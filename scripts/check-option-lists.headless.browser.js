/** Check standalone headless contracts in a temporary, always-removed DOM fixture. */
async (page) => {
	const base = page.url().split('/').slice(0, 3).join('/');
	await page.goto(`${base}/forms/combobox`);
	await page.waitForFunction(() => Boolean(customElements.get('dom-combobox')));
	return page.evaluate(async () => {
		await import('/src/pages/lib/headless/listbox.js');
		const fixture = document.createElement('div');
		fixture.style.cssText = 'position:fixed;left:16px;top:16px;width:300px;z-index:99999';
		fixture.innerHTML = '<dom-combobox value=""><input slot="input" disabled><button slot="toggle" type="button">Open test choices</button><ul slot="list"><li data-value="a" aria-disabled="true">Disabled A</li><li data-value="b" data-label="Bee">Bee</li><li data-value="c" data-label="Sea">Sea</li></ul></dom-combobox><dom-listbox multiple value=\'["b"]\'><button role="option" data-value="a">A</button><button role="option" data-value="d" disabled>D</button><button role="option" data-value="b">B</button><button role="option" data-value="c">C</button></dom-listbox>';
		/** Reject any mismatch before reporting the headless contracts as verified. */
		function check(condition, message) { if (!condition) throw new Error(message); }
		try {
			document.body.append(fixture);
			const combo = fixture.querySelector('dom-combobox');
			const input = combo.querySelector('input');
			const toggle = combo.querySelector('button');
			toggle.click();
			check(!combo.hasAttribute('open'), 'Disabled combobox opened');
			input.disabled = false;
			input.readOnly = true;
			toggle.click();
			check(!combo.hasAttribute('open'), 'Read-only combobox opened');
			input.readOnly = false;
			toggle.click();
			check(input.getAttribute('aria-activedescendant') === combo.querySelector('[data-value="b"]').id, 'Disabled row entered keyboard navigation');
			combo.querySelector('[data-value="a"]').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
			check(combo.value === '', 'Disabled option was committed');
			input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
			input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
			check(combo.value === 'c' && input.value === 'Sea', 'Keyboard committed the wrong label/value');
			const late = document.createElement('li');
			late.dataset.value = 'late';
			late.textContent = 'Late page';
			combo.querySelector('ul').append(late);
			await new Promise(requestAnimationFrame);
			check(!combo.hasAttribute('open'), 'Async option append reopened a closed focused input');
			input.click();
			check(combo.hasAttribute('open'), 'Clicking the already-focused input did not reopen');
			check(combo.querySelector('[data-value="c"]').getAttribute('aria-selected') === 'true', 'Reopening lost committed ARIA selection');
			combo.remove();
			fixture.prepend(combo);
			toggle.click();
			combo.querySelector('[data-value="b"]').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
			check(combo.value === 'b', 'Reconnecting the headless host lost pointer listeners');

			const multi = fixture.querySelector('dom-listbox');
			multi.querySelector('[data-value="a"]').click();
			multi.querySelector('[data-value="b"]').click();
			multi.querySelector('[data-value="d"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
			check(JSON.stringify(multi.values) === '["a"]', 'Multi-listbox toggle or disabled guard failed');
			let pageRequests = 0;
			multi.addEventListener('dom:load-more', () => { pageRequests += 1; });
			multi.setAttribute('has-more', '');
			const last = multi.querySelector('[data-value="c"]');
			last.focus();
			last.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
			check(pageRequests === 1 && multi.values[0] === 'a', 'Keyboard paging changed committed multi-selection');
			return { disabledAndReadOnly: true, disabledOptions: true, keyboardSelection: true, lateAppendStaysClosed: true, focusedClickReopens: true, reconnectCleanup: true, multiToggle: true, keyboardPagination: true };
		} finally {
			fixture.remove();
		}
	});
}
