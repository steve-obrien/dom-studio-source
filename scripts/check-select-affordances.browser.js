/**
 * Check select action geometry and the documented tag-editing distinctions.
 * Run with an agent-owned Playwright CLI session on the local documentation site.
 * The caller owns browser/server cleanup; this script restores its viewport.
 */
async (page) => {
	const base = page.url().split('/').slice(0, 3).join('/');
	const originalViewport = page.viewportSize();
	const results = [];
	page.setDefaultTimeout(10000);
	/** Fail immediately when a visual or interaction contract regresses. */
	function check(condition, message) { if (!condition) throw new Error(message); }
	/** Resolve this trigger's teleported panel without matching closing overlays. */
	async function panelFor(trigger) { return page.locator(`[id="${await trigger.getAttribute('aria-controls')}"]`); }
	/** Wait for Vue hydration and the dropdown's lazy custom-element registration. */
	async function visit(route) {
		await page.goto(`${base}/forms/${route}`);
		await page.waitForFunction(() => Boolean(document.querySelector('#app')?.__vue_app__));
		if (route !== 'tag-combobox') await page.waitForFunction(() => Boolean(customElements.get('dom-dropdown')));
	}
	/** Measure the real rendered icons, including clearance for long selected labels. */
	async function actionGeometry(trigger, hasClear = true) {
		await trigger.scrollIntoViewIfNeeded();
		const box = await trigger.boundingBox();
		const arrow = await trigger.locator(':scope > svg').boundingBox();
		const container = await trigger.locator('..').locator('..').locator('..').boundingBox();
		check(box.width <= container.width + 1, 'Long selection widened the field beyond its layout container');
		const rightInset = box.x + box.width - arrow.x - arrow.width;
		check(rightInset >= 10 && rightInset <= 16, 'Dropdown arrow moved away from the right edge');
		check(Math.abs(arrow.y + arrow.height / 2 - box.y - box.height / 2) < 1, 'Dropdown arrow is not vertically centered');
		const clear = trigger.locator('..').getByRole('button', { name: 'Clear selection', exact: true });
		if (hasClear) {
			const button = await clear.boundingBox();
			const cross = await clear.locator('svg').boundingBox();
			check(button.x + button.width <= arrow.x, 'Clear button is not to the left of the arrow');
			check(arrow.x - button.x - button.width <= 12, 'Excess space separates clear and arrow');
			check(Math.abs(button.y + button.height / 2 - box.y - box.height / 2) < 1, 'Clear button is not vertically centered');
			check(Math.abs(cross.x + cross.width / 2 - button.x - button.width / 2) < 1 && Math.abs(cross.y + cross.height / 2 - button.y - button.height / 2) < 1, 'Clear icon is not centered in its target');
			const label = await trigger.locator(':scope > span').boundingBox();
			check(label.x + label.width <= button.x, 'Selected label overlaps the clear button');
		} else check(await clear.count() === 0, 'Empty selection retained its clear button');
		return rightInset;
	}
	try {
		for (const width of [1280, 390]) {
			await page.setViewportSize({ width, height: 900 });
			await visit('select');
			const consent = page.getByRole('button', { name: 'No thanks', exact: true });
			if (await consent.isVisible()) await consent.click();
			check(await page.getByRole('link', { name: 'Tag combobox (tag input)', exact: true }).getAttribute('href') === '/forms/tag-combobox', 'Select docs do not link to tag input');
			const reviewers = page.getByRole('button', { name: 'Project reviewers', exact: true });
			const panel = await panelFor(reviewers);
			await reviewers.click();
			await panel.locator('[data-value="robin"]').click();
			await panel.locator('[data-value="aisha-bennett"]').click();
			await page.keyboard.press('Escape');
			await panel.waitFor({ state: 'hidden' });
			const selectedInset = await actionGeometry(reviewers);
			await reviewers.locator('..').screenshot({ path: `output/playwright/select-actions-${width}.png` });
			await reviewers.evaluate((element) => { element.style.minHeight = '64px'; });
			try { await actionGeometry(reviewers); }
			finally { await reviewers.evaluate((element) => element.style.removeProperty('min-height')); }
			const clear = reviewers.locator('..').getByRole('button', { name: 'Clear selection', exact: true });
			await clear.click();
			check((await reviewers.textContent()).trim() === 'Select an option', 'Clear did not remove all selected values');
			check(await reviewers.getAttribute('aria-expanded') === 'false', 'Clearing unexpectedly opened the dropdown');
			check(await actionGeometry(reviewers, false) === selectedInset, 'Arrow shifted when selection was cleared');
			const plainSelect = page.getByRole('button', { name: 'Assignee', exact: true });
			check(await actionGeometry(plainSelect, false) === selectedInset, 'Arrow differs between clearable and ordinary selects');
			check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Select page overflows on mobile');
			results.push({ test: 'multi-select clear target, centered icons, stable arrow and no label overlap', width, rightInset: selectedInset });

			await visit('font-picker');
			const font = page.getByRole('button', { name: 'Font family', exact: true }).first();
			const fontInset = await actionGeometry(font);
			const fontClear = font.locator('..').getByRole('button', { name: 'Clear selection', exact: true });
			await fontClear.focus();
			await page.keyboard.press('Enter');
			check((await font.textContent()).includes('Search Google Fonts'), 'Keyboard clear did not empty the single-value font picker');
			check(await actionGeometry(font, false) === fontInset, 'Font arrow shifted after clearing');
			check(await font.evaluate((element) => element === document.activeElement), 'Removing the focused clear button lost keyboard focus');
			results.push({ test: 'font picker shares action layout and supports keyboard clearing', width });
		}

		await visit('tag-combobox');
		check(await page.getByRole('link', { name: 'Select with multiple', exact: true }).getAttribute('href') === '/forms/select', 'Tag docs do not link back to multi-select');
		const tags = page.getByRole('combobox', { name: 'Tailwind classes', exact: true });
		await tags.fill('codex-token');
		await tags.press('Enter');
		await page.getByRole('button', { name: 'Remove codex-token', exact: true }).waitFor();
		await tags.evaluate((element) => {
			const clipboardData = new DataTransfer();
			clipboardData.setData('text', 'codex-token, p-4, w-[100px]');
			element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }));
		});
		for (const value of ['codex-token', 'p-4', 'w-[100px]']) {
			const remove = page.getByRole('button', { name: `Remove ${value}`, exact: true });
			await remove.waitFor();
			check(await remove.count() === 1, `Pasted token ${value} was duplicated`);
		}
		await tags.press('Backspace');
		check(await page.getByRole('button', { name: 'Remove w-[100px]', exact: true }).count() === 0, 'Backspace did not remove the last token');
		await page.getByRole('button', { name: 'Remove p-4', exact: true }).click();
		check(await page.getByRole('button', { name: 'Remove p-4', exact: true }).count() === 0, 'Individual token removal failed');
		results.push({ test: 'reciprocal guidance, custom tokens, paste deduplication, Backspace and individual removal', passed: true });
		return results;
	} finally {
		if (originalViewport) await page.setViewportSize(originalViewport);
	}
}
