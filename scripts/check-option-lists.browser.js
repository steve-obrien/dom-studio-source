/**
 * Browser regressions for an agent-owned Playwright CLI session running the docs.
 * Run: playwright-cli -s=<owned-session> run-code --filename scripts/check-option-lists.browser.js
 * The caller owns browser/server cleanup. Temporary handlers and route overrides
 * are always released here, including on a failed assertion.
 */
async (page) => {
	const base = page.url().split('/').slice(0, 3).join('/');
	const results = [];
	const errors = [];
	const fontRequests = [];
	page.setDefaultTimeout(10000);
	/** Fail with a specific regression label rather than silently logging a mismatch. */
	function check(condition, message) { if (!condition) throw new Error(message); }
	/** Capture uncaught application exceptions during each route's interactions. */
	function onError(error) { errors.push(error.message); }
	/** Record font-network ownership while leaving ordinary requests untouched. */
	function onRequest(request) { if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) fontRequests.push(request.url()); }
	/** Resolve the exact teleported panel instead of racing another closing panel. */
	async function controlledBy(control) { return page.locator(`[id="${await control.getAttribute('aria-controls')}"]`); }
	/** Wait for hydration and lazy custom-element upgrades, not just SSR markup. */
	async function visit(route) {
		await page.goto(`${base}/forms/${route}`);
		await page.waitForFunction(() => Boolean(document.querySelector('#app')?.__vue_app__));
		const tag = route === 'combobox' ? 'dom-combobox' : route === 'autocomplete' ? 'dom-autocomplete' : 'dom-dropdown';
		if (route !== 'tag-combobox') await page.waitForFunction((name) => Boolean(customElements.get(name)), tag);
	}
	/** Wait for a specific loaded option count without fixed timing assumptions. */
	async function rowCount(list, minimum) {
		await list.locator('[role="option"]').nth(minimum - 1).waitFor({ state: 'attached' });
		return list.locator('[role="option"]').count();
	}
	/** Scroll the list itself to exercise its automatic next-page boundary. */
	async function nextPage(list, minimum) {
		await list.evaluate((element) => { element.scrollTop = element.scrollHeight; });
		return rowCount(list, minimum);
	}
	/** Assert the floating panel stays inside a desktop or mobile viewport. */
	async function insideViewport(panel) {
		const box = await panel.boundingBox();
		const viewport = page.viewportSize();
		check(box && box.x >= -1 && box.y >= -1 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, 'Floating panel escaped the viewport');
	}
	page.on('pageerror', onError);
	page.on('request', onRequest);
	try {
		await page.setViewportSize({ width: 1280, height: 900 });
		await visit('font-picker');
		const consent = page.getByRole('button', { name: 'No thanks', exact: true });
		if (await consent.isVisible()) await consent.click();
		const fontTrigger = page.getByRole('button', { name: 'Font family', exact: true }).first();
		const fontPanel = await controlledBy(fontTrigger);
		for (let attempt = 0; attempt < 3; attempt += 1) {
			await fontTrigger.click();
			check(await fontPanel.getByRole('option').count() >= 24, 'Font reopening lost the unfiltered options');
			check(await fontPanel.getByRole('searchbox').inputValue() === '', 'Selection leaked into font search');
			check(await fontPanel.locator('[data-value="Lato"][aria-selected="true"]').count() === 1, 'Selected Lato lost its tick');
			await page.keyboard.press('Escape');
		}
		await fontTrigger.click();
		await nextPage(fontPanel.locator('dom-listbox'), 48);
		await fontPanel.getByRole('searchbox').fill('Zilla Slab');
		await fontPanel.locator('[data-value="Zilla Slab"]').click();
		await fontTrigger.click();
		const fontWindow = await fontPanel.locator('dom-listbox').evaluate((element) => {
			const selected = element.querySelector('[aria-selected="true"]');
			const row = selected.getBoundingClientRect();
			const box = element.getBoundingClientRect();
			return { rows: element.querySelectorAll('[role="option"]').length, visible: row.top >= box.top && row.bottom <= box.bottom };
		});
		check(fontWindow.visible && fontWindow.rows > 24, 'Distant font selection did not open in context');
		await page.waitForFunction(() => [...document.querySelectorAll('link[data-dom-font-picker]')].some((link) => new URL(link.href).searchParams.getAll('family').length > 1));
		await page.waitForFunction(() => [...document.fonts].some((font) => font.family.includes('Zilla Slab') && font.status === 'loaded'));
		const previewFamilies = await page.locator('link[data-dom-font-picker]').evaluateAll((links) => [...new Set(links.flatMap((link) => new URL(link.href).searchParams.getAll('family')))]);
		check(previewFamilies.length < 60, 'Opening a distant font eagerly requested all intervening fonts');
		await insideViewport(fontPanel);
		await page.screenshot({ path: 'output/playwright/font-picker-desktop.png' });
		await page.keyboard.press('Escape');
		await page.getByRole('link', { name: 'Combobox', exact: true }).first().click();
		await page.waitForURL('**/forms/combobox');
		check(await page.locator('link[data-dom-font-picker]').count() === 0, 'SPA unmount leaked owned font stylesheets');
		const fontsAfterUnmount = fontRequests.length;
		results.push({ test: 'font reopening, incremental rows, selected context and SPA cleanup', ...fontWindow, previewFamilies: previewFamilies.length });

		const highlighted = page.getByRole('combobox', { name: 'Highlighted people', exact: true });
		await highlighted.fill('ob');
		const highlights = await controlledBy(highlighted);
		check(await highlights.getByRole('option').count() === 2, 'Literal substring filtering failed');
		check(await highlights.locator('mark').count() === 2, 'Match highlighting missing');
		check(await highlights.locator('ops').count() === 0, 'Option text was interpreted as HTML');
		await highlights.getByRole('option', { name: /Robin/ }).click();
		check(await highlighted.inputValue() === 'Robin <Ops>', 'Committed combobox label changed');
		const highlightedHost = page.locator('dom-combobox').filter({ has: highlighted });
		for (let attempt = 0; attempt < 3; attempt += 1) {
			await highlightedHost.getByRole('button', { name: 'Show options' }).click();
			check(await highlights.getByRole('option').count() === 5, 'Combobox reopening treated selection as a query');
			check(await highlights.locator('[aria-selected="true"]').count() === 1, 'Combobox selected tick missing');
			await highlighted.press('ArrowDown');
			check(await highlights.locator('[data-value="robin"][aria-selected="true"]').count() === 1, 'Keyboard activity replaced selected state');
			await highlighted.press('Escape');
		}
		results.push({ test: 'combobox selection versus query, keyboard state and safe highlighting', passed: true });

		const owner = page.getByRole('combobox', { name: 'Assign owner', exact: true });
		await owner.click();
		const ownerList = await controlledBy(owner);
		await rowCount(ownerList, 12);
		for (const minimum of [24, 36, 48, 60]) await nextPage(ownerList, minimum);
		const chosen = ownerList.getByRole('option').nth(50);
		const chosenLabel = await chosen.getAttribute('data-label');
		await chosen.click();
		check(await owner.inputValue() === chosenLabel, 'Page-five combobox selection lost its label');
		await owner.fill('Alina');
		await ownerList.locator('[data-value="alina-adams"]').waitFor();
		await owner.press('Escape');
		check(await owner.inputValue() === chosenLabel, 'Remote search replacement overwrote committed label');
		check(fontRequests.length === fontsAfterUnmount, 'Unrelated page initiated font preview requests');
		results.push({ test: 'combobox real HTTP pagination through page five and retained selection label', chosenLabel });

		await visit('autocomplete');
		const text = page.getByRole('combobox', { name: 'Search people', exact: true }).last();
		await text.click();
		const suggestions = await controlledBy(text);
		await rowCount(suggestions, 12);
		await nextPage(suggestions, 24);
		await suggestions.locator('[data-value="robin"]').click();
		const textHost = text.locator('..');
		await textHost.getByRole('button', { name: 'Show suggestions' }).click();
		check(await suggestions.getByRole('option').count() >= 12, 'Autocomplete selection became a permanent filter');
		check(await suggestions.locator('[data-value="robin"][aria-selected="true"]').count() === 1, 'Autocomplete selected row missing');
		await text.fill('A new custom contact');
		await suggestions.getByText('No options found', { exact: true }).waitFor();
		await text.press('Enter');
		check(await text.inputValue() === 'A new custom contact', 'Autocomplete failed to retain free text');
		results.push({ test: 'autocomplete real HTTP pages, reopening, selected tick and free text', passed: true });

		await visit('tag-combobox');
		const tokens = page.getByRole('combobox', { name: 'Server-loaded classes', exact: true });
		await tokens.click();
		const tokenList = await controlledBy(tokens);
		await rowCount(tokenList, 12);
		check(await tokenList.getByRole('option', { name: /^flex / }).getAttribute('aria-selected') === 'true', 'Selected token is missing from suggestions');
		await tokenList.getByRole('option', { name: /^grid / }).click();
		await nextPage(tokenList, 24);
		await tokenList.getByRole('option', { name: /^p-12 / }).click();
		await tokens.fill('gap-');
		await tokenList.getByRole('option', { name: /^gap-0 / }).waitFor();
		check(await page.getByRole('button', { name: 'Remove p-12', exact: true }).count() === 1, 'Selected token disappeared after searching');
		await tokenList.getByRole('option', { name: /^gap-0 / }).click();
		await page.getByRole('button', { name: 'Remove p-12', exact: true }).click();
		check(await page.getByRole('button', { name: 'Remove p-12', exact: true }).count() === 0, 'Token removal failed');
		results.push({ test: 'tag multi-select across HTTP pages, selected ticks, query reset and removal', passed: true });

		await visit('select');
		const contact = page.getByRole('button', { name: 'Contact', exact: true });
		await contact.click();
		const directory = await controlledBy(contact);
		const contactPosition = await directory.locator('dom-listbox').evaluate((element) => {
			const row = element.querySelector('[aria-selected="true"]').getBoundingClientRect();
			const box = element.getBoundingClientRect();
			return { scroll: element.scrollTop, visible: row.top >= box.top && row.bottom <= box.bottom };
		});
		check(contactPosition.scroll > 0 && contactPosition.visible, 'Local Select failed to scroll near selected contact');
		await page.keyboard.press('Escape');
		const reviewers = page.getByRole('button', { name: 'Project reviewers', exact: true });
		await reviewers.click();
		const reviewerPanel = await controlledBy(reviewers);
		const reviewerList = reviewerPanel.locator('dom-listbox');
		await rowCount(reviewerList, 12);
		await reviewerList.locator('[data-value="robin"]').click();
		check(await reviewerPanel.evaluate((element) => element.matches(':popover-open')), 'Multiple Select closed after selection');
		await nextPage(reviewerList, 24);
		await reviewerList.locator('[data-value="alina-adams"]').click();
		await reviewerPanel.getByRole('searchbox').fill('no-such-contact');
		await reviewerPanel.getByText('No options found', { exact: true }).waitFor();
		check((await reviewers.textContent()).includes('Alina Adams'), 'Multiple Select forgot a selected label outside the query');
		await page.keyboard.press('Escape');
		await reviewers.click();
		await reviewerList.locator('[data-value="robin"]').waitFor();
		check(await reviewerList.locator('[aria-selected="true"]').count() === 2, 'Loaded multiple selections lost their ticks');
		await reviewerList.locator('[data-value="robin"]').click();
		check(!(await reviewers.textContent()).includes('Robin'), 'Clicking a selected row did not deselect it');
		await page.keyboard.press('Escape');
		results.push({ test: 'Select selected-context scrolling and HTTP multi-select across searches', ...contactPosition });

		await page.setViewportSize({ width: 390, height: 844 });
		for (const route of ['font-picker', 'select', 'combobox', 'autocomplete', 'tag-combobox']) {
			await visit(route);
			check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} overflows the mobile page`);
			if (route === 'font-picker') {
				const trigger = page.getByRole('button', { name: 'Font family', exact: true }).first();
				await trigger.click();
				await insideViewport(await controlledBy(trigger));
				await page.waitForFunction(() => [...document.fonts].filter((font) => font.status === 'loaded').length > 3);
				await page.waitForFunction(() => !document.querySelector('[popover]:popover-open')?.hasAttribute('data-entering'));
				await page.screenshot({ path: 'output/playwright/font-picker-mobile.png' });
				await page.keyboard.press('Escape');
			}
		}
		results.push({ test: 'five docs routes at 390px, including open font panel', passed: true });
		check(errors.length === 0, `Uncaught browser errors: ${errors.join('; ')}`);
		return results;
	} catch (error) {
		throw new Error(`${error.message}\nCompleted checks: ${JSON.stringify(results)}`);
	} finally {
		page.off('pageerror', onError);
		page.off('request', onRequest);
		await page.setViewportSize({ width: 1280, height: 900 });
	}
}
