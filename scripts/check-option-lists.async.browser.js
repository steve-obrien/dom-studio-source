/**
 * Exercise failures, stale responses and keyboard paging against every remote
 * example. Uses a dedicated Playwright CLI browser; always removes interception.
 */
async (page) => {
	const base = page.url().split('/').slice(0, 3).join('/');
	const results = [];
	page.setDefaultTimeout(10000);
	/** Fail explicitly with the control and broken behaviour. */
	function check(condition, message) { if (!condition) throw new Error(message); }
	try {
		for (const config of [
			{ route: 'select', label: 'Project reviewers', tag: 'dom-dropdown' },
			{ route: 'combobox', label: 'Assign owner', tag: 'dom-combobox' },
			{ route: 'autocomplete', label: 'Search people', tag: 'dom-autocomplete' },
			{ route: 'tag-combobox', label: 'Server-loaded classes', tag: null },
		]) {
			await page.goto(`${base}/forms/${config.route}`);
			await page.waitForFunction(() => Boolean(document.querySelector('#app')?.__vue_app__));
			if (config.tag) await page.waitForFunction((tag) => Boolean(customElements.get(tag)), config.tag);
			let fail = true;
			let held = null;
			let signalHeld;
			let holdQuery = null;
			const heldRequest = new Promise((resolve) => { signalHeld = resolve; });
			await page.route('**/api/form-options?**', async (route) => {
				if (fail) {
					fail = false;
					await route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Temporary test failure"}' });
				} else if (holdQuery && route.request().url().includes(`q=${holdQuery}&`)) {
					held = route;
					signalHeld();
				} else await route.continue();
			});
			const control = config.route === 'select'
				? page.getByRole('button', { name: config.label, exact: true })
				: page.getByRole('combobox', { name: config.label, exact: true }).last();
			await control.click();
			const panel = page.locator(`[id="${await control.getAttribute('aria-controls')}"]`);
			await page.getByRole('alert').filter({ hasText: '503' }).waitFor();
			await page.keyboard.press('Escape');
			await page.getByRole('button', { name: 'Retry', exact: true }).click();
			// Retry is outside the popup and closes it; reopening should reuse the page.
			await control.click();
			await panel.locator('[role="option"]').nth(11).waitFor();
			const input = config.route === 'select' ? panel.getByRole('searchbox') : control;
			if (config.route === 'select') {
				await panel.locator('[role="option"]').nth(11).focus();
				await page.keyboard.press('ArrowDown');
			} else {
				for (let index = 0; index < 13; index += 1) await input.press('ArrowDown');
			}
			await panel.locator('[role="option"]').nth(23).waitFor({ state: 'attached' });
			holdQuery = config.route === 'tag-combobox' ? 'p-' : 'Aisha';
			await input.fill(holdQuery);
			await heldRequest;
			await input.fill(config.route === 'tag-combobox' ? 'gap-' : 'Alina');
			const expected = config.route === 'tag-combobox' ? /^gap-0 / : /Alina Adams/;
			await panel.getByRole('option', { name: expected }).waitFor();
			try { await held.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[{"value":"stale","label":"Stale result"}],"nextCursor":null,"total":1}' }); } catch { /* Aborted requests may reject fulfilment. */ }
			await page.evaluate(() => new Promise(requestAnimationFrame));
			check(await panel.getByText('Stale result', { exact: true }).count() === 0, `${config.route}: stale response replaced the new search`);
			await input.press('Escape');
			check(await control.getAttribute('aria-expanded') === 'false', `${config.route}: Escape failed to close`);
			await page.unrouteAll({ behavior: 'ignoreErrors' });
			results.push({ control: config.route, retry: true, keyboardPagination: true, staleResponseIgnored: true });
		}
		return results;
	} catch (error) {
		throw new Error(`${error.message}\nCompleted checks: ${JSON.stringify(results)}`);
	} finally {
		await page.unrouteAll({ behavior: 'ignoreErrors' });
	}
}
