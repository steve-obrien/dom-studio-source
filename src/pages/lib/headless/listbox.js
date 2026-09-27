import { DomElementBase, createRoving, defineDomElement } from './base.js';

/** Resolve a listbox row's stable value, independent of its rich rendering. */
function valueOf(option) {
	return option.dataset.value ?? option.textContent.trim();
}

export class DomListboxElement extends DomElementBase {
	static get observedAttributes() { return ['value', 'orientation', 'multiple']; }

	static __doc = {
		name: 'dom-listbox',
		description: 'A selectable option list with roving focus, selected state, and keyboard navigation.',
		slots: [{ name: '(default)', description: 'Options. Add role="option" and data-value to each selectable item.' }],
		attributes: [
			{ name: 'value', type: 'string', description: 'Selected option value.' },
			{ name: 'orientation', type: "'vertical' | 'horizontal'", description: 'Arrow-key direction. Defaults to vertical.' },
			{ name: 'multiple', type: 'boolean', description: 'Toggle multiple choices. value is then a JSON array; values returns the parsed selected strings.' },
			{ name: 'has-more', type: 'boolean', description: 'Emit dom:load-more instead of wrapping beyond the final loaded option.' },
		],
		events: [
			{ name: 'dom:change', payload: '{ value, option }', description: 'Fired when selection changes.' },
			{ name: 'dom:select', payload: '{ value, option }', description: 'Fired when an option is selected.' },
			{ name: 'dom:load-more', description: 'Fired when ArrowDown reaches the last loaded option and has-more is set.' },
		],
		keyboard: [
			{ keys: '↑ / ↓', action: 'Move active option.' },
			{ keys: 'Home / End', action: 'Jump to first / last option.' },
			{ keys: 'Enter / Space', action: 'Select active option.' },
		],
	};

	/** Initialize roving navigation and coalesced option refresh state. */
	constructor() {
		super();
		this._roving = null;
		this._observer = null;
		this._refreshFrame = 0;
		this._onKey = this._onKey.bind(this);
		this._onClick = this._onClick.bind(this);
		this._scheduleRefresh = this._scheduleRefresh.bind(this);
	}

	/** Observe dynamic option pages and attach list-level keyboard and pointer handlers. */
	connectedCallback() {
		this.setAttribute('role', this.getAttribute('role') || 'listbox');
		this._refresh();
		this.on(this, 'keydown', this._onKey);
		this.on(this, 'click', this._onClick);
		this._observer = new MutationObserver(this._scheduleRefresh);
		this._observer.observe(this, {
			attributes: true,
			attributeFilter: ['aria-disabled', 'data-value', 'disabled', 'role'],
			childList: true,
			subtree: true,
		});
	}

	/** Refresh selection and navigation when the public host state changes. */
	attributeChangedCallback() {
		this._refresh();
	}

	get value() { return this.getAttribute('value') || ''; }
	set value(value) {
		if (value == null || value === '') this.removeAttribute('value');
		else this.setAttribute('value', value);
	}

	/** Read selected values; multiple lists serialize the value attribute as JSON. */
	get values() {
		if (!this.hasAttribute('multiple')) return [this.value];
		try {
			const values = JSON.parse(this.value || '[]');
			return Array.isArray(values) ? values.map(String) : [];
		} catch {
			return [];
		}
	}

	get options() {
		return Array.from(this.querySelectorAll('[role="option"]'))
			.filter((option) => !option.hasAttribute('disabled') && option.getAttribute('aria-disabled') !== 'true');
	}

	/** Coalesce option mutations into one animation-frame navigation refresh. */
	_scheduleRefresh() {
		if (this._refreshFrame) return;
		this._refreshFrame = requestAnimationFrame(() => {
			this._refreshFrame = 0;
			this._refresh();
		});
	}

	/** Preserve focused rows across page appends and expose committed ARIA selection. */
	_refresh() {
		const options = this.options;
		const orientation = this.getAttribute('orientation') || 'vertical';
		const focused = options.findIndex((option) => option === document.activeElement || option.contains(document.activeElement));
		const values = new Set(this.values);
		const selected = options.findIndex((option) => values.has(valueOf(option)));
		const active = focused >= 0 ? focused : Math.max(0, selected);
		this.setAttribute('aria-orientation', orientation);
		this.setAttribute('aria-multiselectable', String(this.hasAttribute('multiple')));
		options.forEach((option, index) => {
			option.tabIndex = index === active ? 0 : -1;
			option.setAttribute('aria-selected', String(values.has(valueOf(option))));
		});
		this._roving = createRoving({ items: options, orientation, loop: true });
		this._roving.setActive(active, { focus: false, select: false });
	}

	/** Commit or toggle an enabled option while preserving multi-selection values. */
	_select(option, event) {
		if (!this.options.includes(option)) return;
		const value = valueOf(option);
		const changed = value !== this.value;
		if (this.hasAttribute('multiple')) {
			const values = this.values;
			this.value = JSON.stringify(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
		} else this.value = value;
		this._refresh();
		this.emit('dom:select', { value, values: this.values, option, event });
		if (changed) this.emit('dom:change', { value, option, event });
	}

	/** Route clicks from rich option descendants to the containing selectable row. */
	_onClick(event) {
		const option = event.target.closest('[role="option"]');
		if (!option || !this.contains(option)) return;
		this._select(option, event);
	}

	/** Navigate enabled options and request more at a paginated keyboard boundary. */
	_onKey(event) {
		const options = this.options;
		if (event.key === 'ArrowDown' && document.activeElement === options.at(-1) && this.hasAttribute('has-more')) {
			event.preventDefault();
			this.emit('dom:load-more');
			return;
		}
		this._roving?.onKey(event);
		if (event.key !== 'Enter' && event.key !== ' ') return;
		const option = document.activeElement?.closest?.('[role="option"]');
		if (!option || !this.contains(option)) return;
		event.preventDefault();
		this._select(option, event);
	}

	/** Release the option observer, pending frame and registered event handlers. */
	disconnectedCallback() {
		this._observer?.disconnect();
		this._observer = null;
		if (this._refreshFrame) {
			cancelAnimationFrame(this._refreshFrame);
			this._refreshFrame = 0;
		}
		super.disconnectedCallback();
	}
}

defineDomElement('dom-listbox', DomListboxElement);
