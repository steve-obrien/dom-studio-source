import { DomElementBase, defineDomElement, uid } from './base.js';
import {
	applyFloatingPosition,
	autoUpdateFloating,
} from './floating.js';
import {
	beginFloatingEffectEnter,
	beginFloatingEffectLeave,
	clearFloatingEffectTimer,
	hasFloatingEffect,
	prepareFloatingEffect,
	resetFloatingEffectState,
} from './floating-effect.js';

// <dom-combobox value="">
//   <input slot="input" />
//   <button slot="toggle" type="button">...</button>
//   <ul slot="list">
//     <li data-value="apple">Apple</li>
//   </ul>
// </dom-combobox>

const OBSERVED = [
	'value',
	'value-label',
	'open',
	'align',
	'offset',
	'placement',
	'collision-padding',
	'floating-mode',
];

/** Read an option's plain-text label when no explicit label was supplied. */
function textOf(option) {
	return option.textContent.trim();
}

/** Resolve an option's stable committed value. */
function valueOf(option) {
	return option.dataset.value ?? option.getAttribute('value') ?? option.value ?? textOf(option);
}

/** Resolve display text independently of rich option markup. */
function labelOf(option) {
	return option.dataset.label ?? option.getAttribute('label') ?? textOf(option);
}

/** Match literal search text without interpreting HTML or regular expressions. */
function matchesOption(option, query) {
	if (!query) return true;
	const haystack = (option.dataset.search ?? `${option.dataset.value || ''} ${option.dataset.label || ''} ${option.textContent}`).toLowerCase();
	return haystack.includes(query);
}

/** Dispatch a cancelable custom-value request before committing free text. */
function dispatchCancelable(host, type, detail) {
	const event = new CustomEvent(type, {
		detail,
		bubbles: true,
		cancelable: true,
		composed: true,
	});
	host.dispatchEvent(event);
	return event;
}

/**
 * Check whether a listbox is currently promoted to the browser top layer.
 *
 * @param {HTMLElement|null|undefined} list Floating listbox element.
 * @returns {boolean} True when the element is an open native popover.
 */
function isListPopoverOpen(list) {
	return Boolean(list?.matches?.(':popover-open'));
}

/**
 * Show a listbox as a manual popover when the browser supports the Popover API.
 *
 * @param {HTMLElement|null|undefined} list Floating listbox element.
 * @returns {void}
 */
function showListPopover(list) {
	if (!list || typeof list.showPopover !== 'function' || isListPopoverOpen(list)) return;
	try {
		list.showPopover();
	} catch {
		// The list remains in-place for browsers or states that reject promotion.
	}
}

/**
 * Hide a listbox manual popover when it is currently open.
 *
 * @param {HTMLElement|null|undefined} list Floating listbox element.
 * @returns {void}
 */
function hideListPopover(list) {
	if (!list || typeof list.hidePopover !== 'function' || !isListPopoverOpen(list)) return;
	try {
		list.hidePopover();
	} catch {
		// Ignore stale top-layer state; hidden/reset below still closes the list.
	}
}

export class ComboBase extends DomElementBase {
	static get observedAttributes() { return OBSERVED; }

	/** Initialize committed-selection, transient-query and owned listener state. */
	constructor() {
		super();
		this._active = -1;
		this._open = false;
		this._options = [];
		this._query = '';
		this._selection = null;
		this._unbindFloating = null;
		this._mutationObserver = null;
		this._wiredList = null;
		this._onDocDown = this._onDocDown.bind(this);
		this._onListPointerDown = this._onListPointerDown.bind(this);
		this._onListPointerMove = this._onListPointerMove.bind(this);
	}

	get _freeText() { return false; }
	get _inputRole() { return 'combobox'; }
	get _valueMode() { return 'option'; }
	get _activeOnFilter() { return true; }

	/** Read the shared floating placement contract from host attributes. */
	_positionOpts() {
		return {
			align: this.getAttribute('align') || 'left',
			offset: Number(this.getAttribute('offset') || 4),
			placement: this.getAttribute('placement') || 'bottom',
			padding: Number(this.getAttribute('collision-padding') || 8),
			mode: this.getAttribute('floating-mode') || 'viewport',
		};
	}

	/** Wire the input and optional external list after the custom element connects. */
	connectedCallback() {
		this._input = this.querySelector('[slot="input"], [data-input]');
		this._toggle = this.querySelector('[slot="toggle"], [data-toggle]');
		this._list = this._resolveList();
		if (!this._input) return;

		this._input.setAttribute('role', this._inputRole);
		this._input.setAttribute('aria-autocomplete', 'list');
		this._input.setAttribute('aria-expanded', 'false');

		if (this._toggle) {
			this._toggle.setAttribute('aria-haspopup', 'listbox');
			this._toggle.setAttribute('aria-expanded', 'false');
			this.on(this._toggle, 'click', () => this._toggleList());
		}

		if (this._list) this._wireList();

		this.on(this._input, 'input', () => this._handleInput());
		this.on(this._input, 'focus', () => {
			if (!this._open) this._filter('', { open: true, preferSelected: true });
		});
		this.on(this._input, 'click', () => {
			if (!this._open) this._filter('', { open: true, preferSelected: true });
		});
		this.on(this._input, 'keydown', (e) => this._onKey(e));
		if (this.hasAttribute('value')) this._syncInputFromValue();
		if (this.hasAttribute('open')) this._setOpen(true);
	}

	/** Release document listeners, observers, floating effects and list ownership. */
	disconnectedCallback() {
		this._setOpen(false);
		clearFloatingEffectTimer(this._list);
		this._finishListClose();
		this._mutationObserver?.disconnect();
		this._mutationObserver = null;
		this._wiredList?.removeEventListener('mousedown', this._onListPointerDown);
		this._wiredList?.removeEventListener('mousemove', this._onListPointerMove);
		if (this._wiredList?.__elementComboOwner === this) delete this._wiredList.__elementComboOwner;
		this._wiredList = null;
		this._list = null;
		super.disconnectedCallback();
		document.removeEventListener('mousedown', this._onDocDown);
	}

	/** Resolve either a slotted list or its application-provided teleported target. */
	_resolveList() {
		const inner = this.querySelector('[slot="list"], [data-list]');
		if (inner) return inner;
		const id = this.dataset.menuId || this.dataset.listId;
		return id ? document.getElementById(id) : null;
	}

	/** Reconnect the list after a framework replaces or teleports its element. */
	_ensureList() {
		if (!this._list || !this._list.isConnected) {
			this._list = this._resolveList();
			if (this._list) this._wireList();
		}
		return this._list;
	}

	/** Own one list's pointer events and observe async option changes without reopening it. */
	_wireList() {
		if (!this._list || this._list.__elementComboOwner === this) return;
		const id = uid('cmb');
		this._wiredList?.removeEventListener('mousedown', this._onListPointerDown);
		this._wiredList?.removeEventListener('mousemove', this._onListPointerMove);
		this._list.__elementComboOwner = this;
		this._wiredList = this._list;
		this._list.id = this._list.id || `${id}-list`;
		this._list.setAttribute('role', 'listbox');
		if (typeof this._list.showPopover === 'function' && !this._list.hasAttribute('popover')) {
			this._list.setAttribute('popover', 'manual');
		}
		prepareFloatingEffect(this._list);
		this._list.hidden = !this._open;
		this._input.setAttribute('aria-controls', this._list.id);
		this._list.addEventListener('mousedown', this._onListPointerDown);
		this._list.addEventListener('mousemove', this._onListPointerMove);
		this._mutationObserver?.disconnect();
		this._mutationObserver = new MutationObserver(() => {
			if (this._open) {
				this._filter(this._query, { open: true, emitQuery: false, preserveActive: true });
				this._positionList();
			} else this._refreshOptions();
		});
		this._mutationObserver.observe(this._list, {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
			attributeFilter: ['data-value', 'data-label', 'data-search', 'aria-disabled', 'disabled'],
		});
		this._refreshOptions();
		this._syncInputFromValue();
	}

	/** Refresh selectable rows while keeping status and paging controls out of navigation. */
	_refreshOptions() {
		if (!this._list) return;
		const id = this._list.id || uid('cmb-list');
		this._options = Array.from(this._list.children).filter((option) => option.hasAttribute('data-value'));
		this._options.forEach((option, index) => {
			option.setAttribute('role', 'option');
			option.id = option.id || `${id}-opt-${index}`;
			option.setAttribute('aria-selected', String(this._isSelected(option)));
		});
	}

	/** Test committed selection independently from the keyboard-active row. */
	_isSelected(option) {
		if (this._valueMode === 'text') return labelOf(option) === this.value && Boolean(this.value);
		return String(valueOf(option)) === this.value;
	}

	/** Keep disabled rows visible but exclude them from navigation and commitment. */
	_isDisabled(option) {
		return option.hasAttribute('disabled') || option.hasAttribute('data-disabled') || option.getAttribute('aria-disabled') === 'true';
	}

	/** Emit intentional typing separately from the committed option value. */
	_handleInput() {
		const value = this._input.value;
		this.emit('dom:input', { value });
		this._filter(value, { open: true });
		if (this._freeText) this.setAttribute('value', value);
	}

	/** Restore the committed label, including a selection outside the current page. */
	_syncInputFromValue() {
		if (!this._input || !this.hasAttribute('value')) return;
		const value = this.getAttribute('value') || '';
		this._refreshOptions();
		if (this._valueMode === 'text') {
			if (this._input.value !== value) this._input.value = value;
			return;
		}
		const selected = this._options.find((option) => valueOf(option) === value);
		if (selected) this._selection = { value, label: labelOf(selected) };
		const display = selected ? labelOf(selected) : this.getAttribute('value-label') ?? (this._selection?.value === value ? this._selection.label : value);
		if (this._input.value !== display) this._input.value = display;
	}

	/** Close only when pointer interaction is outside both the host and its popup. */
	_onDocDown(e) {
		if (this.contains(e.target)) return;
		if (this._list && this._list.contains(e.target)) return;
		this._setOpen(false);
	}

	/** Size and position the floating list relative to its input. */
	_positionList() {
		if (!this._input || !this._list || this._list.hidden) return;
		const rect = this._input.getBoundingClientRect();
		this._list.style.width = `${Math.round(rect.width)}px`;
		applyFloatingPosition(this._input, this._list, this._positionOpts());
	}

	/** Track viewport, content and anchor changes while the popup is open. */
	_bindFloating() {
		this._unbindFloating?.();
		this._unbindFloating = autoUpdateFloating(this._input, this._list, () => this._positionList());
	}

	/** Stop all floating-position observers owned by this control. */
	_unbindFloating() {
		this._unbindFloating?.();
		this._unbindFloating = null;
	}

	/** Hide the native popover and clear its completed animation state. */
	_finishListClose(list = this._list) {
		if (!list) return;
		hideListPopover(list);
		list.hidden = true;
		resetFloatingEffectState(list);
	}

	/** Promote the list to the top layer and start the shared enter effect. */
	_showList() {
		const list = this._list;
		list.hidden = false;
		showListPopover(list);
		if (!hasFloatingEffect(list)) return;
		beginFloatingEffectEnter(list, {
			shouldContinue: () => this._open && this._list === list,
		});
	}

	/** Run the leave effect without allowing a stale close to hide a reopened list. */
	_hideList() {
		const list = this._list;
		beginFloatingEffectLeave(list, {
			shouldContinue: () => !this._open && this._list === list,
			finish: () => this._finishListClose(list),
		});
	}

	/** Synchronize logical state, ARIA, listeners and lifecycle events exactly once. */
	_setOpen(open) {
		if (!this._ensureList()) return;
		if (open && (this._input.disabled || this._input.readOnly)) return;
		const changed = open !== this._open;
		if (open === this._open && this._list.hidden === !open) {
			if (open) this._positionList();
			return;
		}
		this._open = open;
		if (open) this._showList();
		else this._hideList();
		this._input.setAttribute('aria-expanded', String(open));
		this._toggle?.setAttribute('aria-expanded', String(open));
		this.setBoolAttr('open', open);

		if (open) {
			this._positionList();
			this._bindFloating();
			document.addEventListener('mousedown', this._onDocDown);
		} else {
			this._unbindFloating();
			this._setActive(-1);
			this._query = '';
			if (!this._freeText) this._syncInputFromValue();
			document.removeEventListener('mousedown', this._onDocDown);
		}
		if (changed) this.emit(open ? 'dom:open' : 'dom:close');
	}

	/** Filter transient input only; selection labels never become a reopening query. */
	_filter(value, { open = true, emitQuery = true, preserveActive = false, preferSelected = false } = {}) {
		this._query = value;
		if (!this._ensureList()) {
			if (emitQuery) this.emit('dom:query', { query: value });
			return;
		}
		if (emitQuery) this.emit('dom:query', { query: value });

		const activeOption = preserveActive ? this._options[this._active] : null;
		this._refreshOptions();
		const query = value.trim().toLowerCase();
		let firstVisible = -1;

		this._options.forEach((option, index) => {
			const match = this.getAttribute('filter-options') === 'false' || matchesOption(option, query);
			option.hidden = !match;
			if (match && !this._isDisabled(option) && firstVisible === -1) firstVisible = index;
		});

		this._list.toggleAttribute('data-empty', firstVisible < 0);
		this._setOpen(open);
		const selected = preferSelected ? this._options.findIndex((option) => !option.hidden && !this._isDisabled(option) && this._isSelected(option)) : -1;
		const previous = activeOption && !activeOption.hidden ? this._options.indexOf(activeOption) : -1;
		this._setActive(previous >= 0 ? previous : selected >= 0 ? selected : this._activeOnFilter ? firstVisible : -1);
		if (preferSelected && selected >= 0) this._scrollActive();
		else if (!preserveActive && this._list) this._list.scrollTop = 0;
		this._positionList();
	}

	/** Mark navigation without changing aria-selected, which describes commitment. */
	_setActive(index) {
		this._active = index;
		this._options.forEach((option, optionIndex) => {
			const active = optionIndex === index;
			option.toggleAttribute('data-active', active);
			option.setAttribute('aria-selected', String(this._isSelected(option)));
		});
		if (index >= 0 && this._options[index]) this._input.setAttribute('aria-activedescendant', this._options[index].id);
		else this._input.removeAttribute('aria-activedescendant');
	}

	/** Scroll within the list only, without moving the containing page. */
	_scrollActive() {
		const option = this._options[this._active];
		if (!option || !this._list) return;
		const row = option.getBoundingClientRect();
		const list = this._list.getBoundingClientRect();
		const scale = list.height / this._list.offsetHeight || 1;
		if (row.top < list.top) this._list.scrollTop += (row.top - list.top) / scale;
		else if (row.bottom > list.bottom) this._list.scrollTop += (row.bottom - list.bottom) / scale;
	}

	/** Return enabled visible rows with their stable positions in the rendered list. */
	_visible() {
		this._refreshOptions();
		return this._options
			.map((option, index) => ({ option, index }))
			.filter(({ option }) => !option.hidden && !this._isDisabled(option));
	}

	/** Move the active descendant, scrolling it into view or requesting another page. */
	_move(delta) {
		const visible = this._visible();
		if (!visible.length) return;
		const current = visible.findIndex(({ index }) => index === this._active);
		if (delta > 0 && current === visible.length - 1 && this.hasAttribute('has-more')) {
			this.emit('dom:load-more', { query: this._query });
			return;
		}
		if (current === -1) {
			this._setActive(delta > 0 ? visible[0].index : visible[visible.length - 1].index);
			this._scrollActive();
			return;
		}
		const next = visible[(current + delta + visible.length) % visible.length];
		this._setActive(next.index);
		this._scrollActive();
	}

	/** Handle selection, free-text commitment, dismissal and paginated navigation. */
	_onKey(e) {
		if (this._input.disabled || this._input.readOnly || e.isComposing) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (!this._open) this._filter('', { open: true, preferSelected: true });
			else this._move(1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (!this._open) this._filter('', { open: true, preferSelected: true });
			else this._move(-1);
		} else if (e.key === 'Enter') {
			if (this._active >= 0) {
				e.preventDefault();
				this._commit(this._options[this._active]);
			} else if (this._freeText) {
				e.preventDefault();
				this._commitCustom(this._input.value);
			}
		} else if (e.key === 'Escape') {
			e.preventDefault();
			this._setOpen(false);
			if (!this._freeText) this._syncInputFromValue();
		} else if (e.key === 'Tab') {
			this._setOpen(false);
		}
	}

	/** Commit only an enabled option while keeping focus on the input. */
	_onListPointerDown(e) {
		const option = e.target.closest?.('[role="option"]');
		if (!option || !this._list.contains(option) || option.hidden || this._isDisabled(option)) return;
		e.preventDefault();
		this._commit(option);
	}

	/** Update pointer activity independently of committed selection. */
	_onListPointerMove(e) {
		const option = e.target.closest?.('[role="option"]');
		if (!option || !this._list.contains(option) || option.hidden || this._isDisabled(option)) return;
		const index = this._options.indexOf(option);
		if (index >= 0) this._setActive(index);
	}

	/** Toggle from committed state without using its display label as a search query. */
	_toggleList() {
		if (this._input.disabled || this._input.readOnly) return;
		if (!this._ensureList()) return;
		const wasOpen = this._open;
		this._input.focus();
		if (wasOpen) this._setOpen(false);
		else if (!this._open) this._filter('', { open: true, preferSelected: true });
	}

	/** Commit one enabled option, clear transient query state and notify consumers. */
	_commit(option) {
		if (!option || this._isDisabled(option) || this._input.disabled || this._input.readOnly) return;
		const value = valueOf(option);
		const detail = {
			value,
			label: labelOf(option),
			option,
			custom: false,
		};
		const inputValue = this._valueMode === 'text' ? detail.label : detail.label;
		const hostValue = this._valueMode === 'text' ? detail.label : value;
		this._selection = { value: hostValue, label: detail.label };
		this._query = '';

		this._input.value = inputValue;
		this.setAttribute('value', hostValue);
		this._setOpen(false);
		this.emit('dom:select', detail);
		this.emit('dom:change', detail);
	}

	/** Commit permitted free text after a cancelable application validation event. */
	_commitCustom(rawValue) {
		const value = rawValue.trim();
		if (!value) return;
		const detail = { value, label: value, option: null, custom: true };
		const event = dispatchCancelable(this, 'dom:custom', detail);
		if (event.defaultPrevented) return;
		this._input.value = value;
		this.setAttribute('value', value);
		this._setOpen(false);
		this.emit('dom:change', detail);
	}

	/** Apply external value, open-state and floating-placement updates. */
	attributeChangedCallback(name, _old, value) {
		if (!this.isConnected || !this._input) return;
		if (name === 'value' || (name === 'value-label' && !this._open)) this._syncInputFromValue();
		if (name === 'open') this._setOpen(value !== null);
		if (['align', 'offset', 'placement', 'collision-padding', 'floating-mode'].includes(name) && this._open) this._positionList();
	}

	get value() { return this.getAttribute('value') || ''; }
	set value(value) { this.setAttribute('value', value ?? ''); }
}

export class DomComboboxElement extends ComboBase {
	static __doc = {
		name: 'dom-combobox',
		description: 'Select-like combobox with a text input, optional toggle button, managed activedescendant, keyboard navigation, and floating list positioning.',
		slots: [
			{ name: 'input', description: 'The text input. Gets role="combobox" and aria-controls wired automatically.' },
			{ name: 'toggle', description: 'Optional button that opens the list like a select.' },
			{ name: 'list', description: 'The listbox container. Each option must carry data-value.' },
		],
		attributes: [
			{ name: 'value', type: 'string', description: 'Currently-selected value.' },
			{ name: 'open', type: 'boolean', description: 'Reflects whether the list is visible.' },
			{ name: 'placement', type: 'string', description: 'Preferred floating placement before collision handling.' },
			{ name: 'floating-mode', type: "'viewport' | 'anchor'", description: 'viewport keeps the list inside the browser; anchor keeps it attached to the input while scrolling.' },
			{ name: 'data-menu-id', type: 'string', description: 'Id of an external or teleported list element.' },
			{ name: 'filter-options', type: 'string', description: 'Set false for server-filtered results. Query events still fire.' },
			{ name: 'has-more', type: 'boolean', description: 'Request another application-owned page when navigating beyond the loaded options.' },
			{ name: 'value-label', type: 'string', description: 'Resolved label for a committed value outside the current page.' },
		],
		events: [
			{ name: 'dom:input', payload: '{ value }', description: 'Fired whenever the text value changes.' },
			{ name: 'dom:query', payload: '{ query }', description: 'Fired whenever the user types. Useful for server lookups.' },
			{ name: 'dom:select', payload: '{ value, label, option }', description: 'Fired when an option is selected.' },
			{ name: 'dom:change', payload: '{ value, option, custom }', description: 'Fired when an option is committed.' },
			{ name: 'dom:open', description: 'Fired when the list opens, including an empty/loading list.' },
			{ name: 'dom:close', description: 'Fired when the list closes. Later option updates do not reopen it.' },
			{ name: 'dom:load-more', payload: '{ query }', description: 'Fired at the loaded keyboard boundary when has-more is set.' },
		],
		keyboard: [
			{ keys: '↑ / ↓', action: 'Move active option.' },
			{ keys: 'Enter', action: 'Commit active option.' },
			{ keys: 'Esc', action: 'Close the list.' },
			{ keys: 'Type', action: 'Filter the list and emit dom:query.' },
		],
	};
}

defineDomElement('dom-combobox', DomComboboxElement);
