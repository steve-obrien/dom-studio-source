import { DomElementBase, defineDomElement, uid, createRoving } from './base.js';
import {
	bindPopoverToggle,
	bindFloatingReflow,
	closePopoverPanel,
	isPopoverOpen,
	openPopoverPanel,
	positionPopoverPanel,
	preparePopoverPanel,
	readFloatingPositionOptions,
	syncFloatingScrollLock,
	unbindFloatingReflow,
} from './popover-panel.js';

// Popover API for the menu layer (same as dom-popover); dropdown adds
// menu semantics, roving focus, and dom:select.
import './popover.js';

// <dom-dropdown>
//   <button slot="trigger">…</button>
//   <div slot="menu">
//     <button role="menuitem">…</button>
//   </div>
// </dom-dropdown>
export class DomDropdownElement extends DomElementBase {
	static get observedAttributes() {
		return ['open', 'align', 'offset', 'placement', 'collision-padding', 'floating-mode', 'lock-scroll'];
	}

	static __doc = {
		name: 'dom-dropdown',
		description: 'A menu that opens from a button. The menu panel uses the same native Popover API as dom-popover (top layer, light-dismiss, Esc), plus menu keyboard navigation and dom:select.',
		slots: [
			{ name: 'trigger', description: 'Button that opens the menu.' },
			{ name: 'menu', description: 'Menu panel (popover="auto"). Items inside must carry role="menuitem". data-value flows through dom:select.' },
		],
		attributes: [
			{ name: 'open', type: 'boolean', description: 'Reflects open state (toggle by setting / removing).' },
			{ name: 'placement', type: "'top' | 'right' | 'bottom' | 'left' | '<side>-<align>'", description: 'Preferred placement before collision handling (default bottom).' },
			{ name: 'align', type: "'left' | 'right'", description: 'Horizontal alignment under the trigger (default left).' },
			{ name: 'offset', type: 'number', description: 'Gap in pixels between trigger and menu (default 4).' },
			{ name: 'collision-padding', type: 'number', description: 'Viewport padding used when flipping or shifting the menu (default 8).' },
			{ name: 'floating-mode', type: "'viewport' | 'anchor'", description: 'viewport keeps the menu inside the browser; anchor keeps it attached to the trigger while scrolling.' },
			{ name: 'lock-scroll', type: 'boolean', description: 'Lock document scrolling while the menu is open.' },
			{ name: 'data-menu-id', type: 'string', description: 'Id of an external (teleported) menu element. Used when the menu lives outside the host — e.g. portalled to <body>.' },
		],
		events: [
			{ name: 'dom:open', description: 'Fired when the menu opens.' },
			{ name: 'dom:close', description: 'Fired when the menu closes.' },
			{ name: 'dom:select', payload: '{ value, event }', description: 'Fired when a menu item is chosen.' },
		],
		keyboard: [
			{ keys: 'Enter / Space / ↓', action: 'Open menu (when trigger is focused).' },
			{ keys: '↑ / ↓', action: 'Move active item.' },
			{ keys: 'Home / End', action: 'Jump to first / last item.' },
			{ keys: 'Enter', action: 'Select active item.' },
			{ keys: 'Esc / Tab', action: 'Close menu and return focus.' },
		],
		example: `<dom-dropdown>
  <button slot="trigger">Account ▾</button>
  <div slot="menu">
    <button role="menuitem" data-value="profile">Profile</button>
    <button role="menuitem" data-value="billing">Billing</button>
    <button role="menuitem" data-value="signout">Sign out</button>
  </div>
</dom-dropdown>

<script type="module">
  import '@getdom/studio/headless';
  document.querySelector('dom-dropdown')
    .addEventListener('dom:select', (e) => console.log(e.detail.value));
<\/script>`,
	};

	constructor() {
		super();
		this._open = false;
		this._roving = null;
		this._unbindToggle = null;
		this._reflowOff = null;
		this._onKey = this._onKey.bind(this);
		this._onCompositeKey = this._onCompositeKey.bind(this);
		this._itemClickHandlers = [];
		this._scrollLocked = false;
		this._dismissOff = null;
		this._dismissBindFrame = 0;
	}

	_positionOpts() {
		return readFloatingPositionOptions(this, { offset: 4 });
	}

	_bindReflow() {
		bindFloatingReflow(this, this._menu, this._trigger, this._positionOpts());
	}

	_unbindReflow() {
		unbindFloatingReflow(this);
	}

	_syncScrollLock(next) {
		syncFloatingScrollLock(this, this._menu, next);
	}

	connectedCallback() {
		this._trigger = this.querySelector('[slot="trigger"], [data-trigger]');
		this._menu = this._resolveMenu();
		if (!this._trigger) return;

		if (this._menu) this._prepareMenu();

		this._trigger.setAttribute('aria-haspopup', this._menu?.dataset.haspopup || 'menu');
		this._trigger.setAttribute('aria-expanded', 'false');

		this.on(this._trigger, 'click', () => this.toggle());
		this.on(this._trigger, 'keydown', (e) => {
			if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				this.open = true;
			}
		});

		if (this.hasAttribute('open')) this.open = true;
	}

	_resolveMenu() {
		const inner = this.querySelector('[slot="menu"], [data-menu]');
		if (inner) return inner;
		const id = this.dataset.menuId;
		return id ? this.ownerDocument?.getElementById(id) : null;
	}

	_prepareMenu() {
		const id = uid('dd');
		this._menu.id = this._menu.id || `${id}-menu`;
		if (this._isCompositePanel()) {
			if (this._menu.getAttribute('role') === 'menu') this._menu.removeAttribute('role');
			this._trigger?.setAttribute('aria-haspopup', this._menu.dataset.haspopup || 'true');
		} else {
			this._menu.setAttribute('role', 'menu');
			this._trigger?.setAttribute('aria-haspopup', 'menu');
		}
		if (!this._menu.classList.contains('dom-dropdown-menu')) {
			this._menu.classList.add('dom-dropdown-menu');
		}
		preparePopoverPanel(this._menu, this._trigger);
		this._menu.setAttribute('popover', 'manual');
		this._unbindToggle?.();
		this._unbindToggle = bindPopoverToggle(this._menu, (open) => this._syncOpen(open, true));
	}

	_ensureMenu() {
		if (!this._menu || !this._menu.isConnected) {
			this._menu = this._resolveMenu();
			if (this._menu) this._prepareMenu();
		}
		return this._menu;
	}

	_isCompositePanel() {
		return this._menu?.dataset.compositePanel === 'true';
	}

	_focusFirstCompositeElement() {
		const preferredSelector = [
			'[data-autofocus]',
			'[autofocus]',
			'[tabindex="0"]',
			'[aria-selected="true"]',
		].join(',');
		const selector = [
			'button:not([disabled])',
			'[href]',
			'input:not([disabled])',
			'select:not([disabled])',
			'textarea:not([disabled])',
			'[tabindex]:not([tabindex="-1"])',
		].join(',');
		const findFocusable = (query) => Array.from(this._menu?.querySelectorAll(query) || [])
			.find((element) => element.tabIndex >= 0 && element.getAttribute('aria-disabled') !== 'true');
		requestAnimationFrame(() => (findFocusable(preferredSelector) || findFocusable(selector))?.focus());
	}

	_setupMenuInteractions() {
		if (this._isCompositePanel()) {
			this._menu.addEventListener('keydown', this._onCompositeKey);
			this._focusFirstCompositeElement();
			return;
		}
		const items = Array.from(this._menu.querySelectorAll('[role="menuitem"]:not([disabled])'));
		this._roving = createRoving({ items, orientation: 'vertical', loop: true });
		items.forEach((el, i) => { el.tabIndex = i === 0 ? 0 : -1; });
		requestAnimationFrame(() => items[0]?.focus());
		this._menu.addEventListener('keydown', this._onKey);
		this._itemClickHandlers = items.map((el) => {
			const handler = (ev) => this._select(el, ev);
			el.addEventListener('click', handler);
			return () => el.removeEventListener('click', handler);
		});
	}

	_teardownMenuInteractions() {
		this._menu?.removeEventListener('keydown', this._onKey);
		this._menu?.removeEventListener('keydown', this._onCompositeKey);
		for (const off of this._itemClickHandlers) off();
		this._itemClickHandlers = [];
		this._roving = null;
		this._trigger?.focus();
	}

	_placeMenu() {
		const r = this._trigger.getBoundingClientRect();
		this._menu.style.minWidth = `${r.width}px`;
		positionPopoverPanel(this._menu, this._trigger, this._positionOpts());
	}

	_bindDismiss() {
		this._unbindDismiss();
		this._dismissBindFrame = requestAnimationFrame(() => {
			const isInside = (event) => {
				const path = event.composedPath?.() || [];
				return path.includes(this._menu) || path.includes(this._trigger);
			};
			const onPointerDown = (event) => {
				if (!isPopoverOpen(this._menu) || isInside(event)) return;
				this._syncOpen(false, false);
			};
			const onKeydown = (event) => {
				if (event.key !== 'Escape' || !isPopoverOpen(this._menu)) return;
				event.preventDefault();
				this._syncOpen(false, false);
			};
			document.addEventListener('pointerdown', onPointerDown, true);
			document.addEventListener('keydown', onKeydown, true);
			this._dismissOff = () => {
				document.removeEventListener('pointerdown', onPointerDown, true);
				document.removeEventListener('keydown', onKeydown, true);
			};
		});
	}

	_unbindDismiss() {
		if (this._dismissBindFrame) {
			cancelAnimationFrame(this._dismissBindFrame);
			this._dismissBindFrame = 0;
		}
		this._dismissOff?.();
		this._dismissOff = null;
	}

	_syncOpen(next, fromPopover = false) {
		if (!this._ensureMenu()) return;
		if (next && this._open) {
			this._placeMenu();
			return;
		}
		if (!next && !this._open) return;

		if (next) {
			if (!fromPopover) {
				openPopoverPanel(this._menu, this._trigger, this._positionOpts(), () => this._placeMenu());
			} else {
				this._placeMenu();
			}
			this._bindReflow();
			this._setupMenuInteractions();
			this._syncScrollLock(true);
			this._bindDismiss();
		} else {
			this._unbindReflow();
			this._unbindDismiss();
			this._teardownMenuInteractions();
			this._syncScrollLock(false);
			if (!fromPopover) closePopoverPanel(this._menu);
		}

		this._open = next;
		this.setBoolAttr('open', next);
		this._trigger?.setAttribute('aria-expanded', String(next));
		this.emit(next ? 'dom:open' : 'dom:close');
	}

	get open() { return this._open; }
	set open(value) {
		const next = !!value;
		if (next === this._open) return;
		this._syncOpen(next, false);
	}

	toggle() {
		if (!this._ensureMenu()) return;
		this._syncOpen(!isPopoverOpen(this._menu), false);
	}

	_select(el, ev) {
		this.emit('dom:select', { value: el.dataset.value ?? el.textContent.trim(), event: ev });
		this.open = false;
	}

	_onCompositeKey(e) {
		if (e.key === 'Escape' || e.key === 'Tab') {
			if (e.key === 'Escape') e.preventDefault();
			this.open = false;
		}
	}

	_onKey(e) {
		this._roving?.onKey(e);
		if (e.key === 'Escape' || e.key === 'Tab') {
			if (e.key === 'Escape') e.preventDefault();
			this.open = false;
		}
	}

	attributeChangedCallback(name) {
		if (!this._open || !this._menu || !this._trigger) return;
		if (name === 'lock-scroll') {
			this._syncScrollLock(true);
		}
		if (name === 'align' || name === 'offset' || name === 'placement' || name === 'collision-padding' || name === 'floating-mode') {
			this._placeMenu();
		}
	}

	disconnectedCallback() {
		this._teardownMenuInteractions();
		this._unbindToggle?.();
		this._unbindToggle = null;
		this._unbindReflow();
		this._unbindDismiss();
		this._syncScrollLock(false);
		super.disconnectedCallback();
	}
}

defineDomElement('dom-dropdown', DomDropdownElement);
