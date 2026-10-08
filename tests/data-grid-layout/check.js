/**
 * Verifies real browser geometry for the data-grid layout fixture at mobile and
 * desktop widths. Run with playwright-cli run-code --filename after opening
 * /tests/data-grid-layout/. Throws on padding, alignment or overflow regressions.
 */
async (page) => {
	await page.reload();
	let checks = 0;
	for (const width of [375, 1280]) {
		await page.setViewportSize({ width, height: 900 });
		await page.locator('[data-case="normal"] tbody td').first().waitFor();
		const results = await page.evaluate(() => {
			/** Captures geometry after the browser has applied responsive styles. */
			function inspectCase(section) {
				const grid = section.querySelector('.dom-data-grid');
				const style = getComputedStyle(grid);
				const heading = section.querySelector('h1').getBoundingClientRect();
				const title = grid.querySelector('h2').getBoundingClientRect();
				const header = grid.querySelector('header');
				const footer = grid.querySelector('footer');
				const cells = Array.from(grid.querySelectorAll('table > thead > tr, table > tbody > tr:not([aria-hidden="true"])')).map(row => {
					const first = getComputedStyle(row.firstElementChild);
					const last = getComputedStyle(row.lastElementChild);
					return { left: first.paddingLeft, right: last.paddingRight };
				});
				const body = grid.querySelector('tbody > tr:not([aria-hidden="true"])');
				return {
					id: section.dataset.case,
					cells,
					leftBorder: style.borderLeftWidth,
					rightBorder: style.borderRightWidth,
					topBorder: style.borderTopWidth,
					radius: style.borderTopLeftRadius,
					shadow: style.boxShadow,
					toolbar: [getComputedStyle(header).paddingLeft, getComputedStyle(header).paddingRight],
					footer: [getComputedStyle(footer).paddingLeft, getComputedStyle(footer).paddingRight],
					titleOffset: title.left - heading.left,
					headerOffset: grid.querySelector('th button span')?.getBoundingClientRect().left - title.left,
					middlePadding: body.children.length === 3 ? getComputedStyle(body.children[1]).paddingLeft : null,
					width: grid.getBoundingClientRect().width,
				};
			}
			return { cases: Array.from(document.querySelectorAll('[data-case]'), inspectCase), documentWidth: document.documentElement.scrollWidth };
		});
		for (const result of results.cases) {
			if (result.id === 'card') {
				if (result.leftBorder !== '1px' || result.toolbar[0] !== '12px' || result.cells.at(-1).left !== '12px') throw new Error('Default card layout changed');
				continue;
			}
			const expected = result.id === 'variable' ? '28px' : width < 640 ? '16px' : '24px';
			if ([...result.toolbar, ...result.footer, ...result.cells.flatMap(cell => [cell.left, cell.right])].some(value => value !== expected)) throw new Error(`${width} ${result.id}: gutter mismatch ${JSON.stringify(result)}`);
			if (result.leftBorder !== '0px' || result.rightBorder !== '0px' || result.topBorder !== '1px' || result.radius !== '0px' || result.shadow !== 'none') throw new Error(`${result.id}: flush chrome incorrect`);
			if (result.middlePadding && result.middlePadding !== '12px') throw new Error(`${result.id}: middle cell padding changed`);
			if (result.id === 'normal' && (Math.abs(result.titleOffset) > 0.5 || Math.abs(result.headerOffset) > 0.5)) throw new Error(`Header alignment incorrect: ${JSON.stringify(result)}`);
			if (Math.abs(result.width - width) > 1) throw new Error(`${result.id}: wrapper does not reach page edges`);
			checks++;
		}
		if (results.documentWidth > width) throw new Error('Grid caused page-level horizontal overflow');
	}
	await page.locator('[data-case="normal"] button[aria-label="Sort Name ascending"]').click();
	if (await page.locator('[data-case="normal"] th[scope="col"]').first().getAttribute('aria-sort') !== 'ascending') throw new Error('Flush grid sorting failed');
	await page.locator('[data-case="wide"] [data-grid-viewport]').evaluate(element => { element.scrollLeft = element.scrollWidth; });
	if (await page.locator('[data-case="wide"] [data-grid-viewport]').evaluate(element => element.scrollLeft) < 1) {
		await page.setViewportSize({ width: 375, height: 900 });
		await page.locator('[data-case="wide"] [data-grid-viewport]').evaluate(element => { element.scrollLeft = element.scrollWidth; });
		if (await page.locator('[data-case="wide"] [data-grid-viewport]').evaluate(element => element.scrollLeft) < 1) throw new Error('Horizontal grid scrolling failed');
	}
	return { passed: checks, cardCompatible: true, sorting: true, horizontalScrolling: true };
}
