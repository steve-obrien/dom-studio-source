import { DomElementBase, defineDomElement, isBrowser } from './base.js';

const STYLE_ID = 'dom-toggle-styles';

/**
 * Install the shared switch styles used by every headless toggle instance.
 *
 * @returns {void}
 */
function ensureToggleStyles() {
	if (!isBrowser || document.getElementById(STYLE_ID)) return;
	const style = document.createElement('style');
	style.id = STYLE_ID;
	style.textContent = `
dom-toggle {
	position: relative;
	display: inline-flex;
	flex-shrink: 0;
	box-sizing: border-box;
	height: var(--dom-toggle-height, 1.5rem);
	width: var(--dom-toggle-width, 2.75rem);
	cursor: pointer;
	border: 0;
	padding: 0;
	border-radius: 9999px;
	background: var(--input);
	transition: background-color 150ms ease;
	vertical-align: middle;
}
dom-toggle:focus-visible {
	outline: 2px solid var(--ring);
	outline-offset: 2px;
}
dom-toggle[aria-checked="true"] {
	background: var(--primary);
}
dom-toggle[aria-disabled="true"] {
	opacity: 0.5;
	cursor: not-allowed;
}
dom-toggle::after {
	content: '';
	position: absolute;
	top: 50%;
	left: var(--dom-toggle-padding, 2px);
	width: var(--dom-toggle-thumb-size, 1.25rem);
	height: var(--dom-toggle-thumb-size, 1.25rem);
	border-radius: 9999px;
	background: var(--canvas);
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
	transform: translateY(-50%);
	transition: transform 150ms ease;
	pointer-events: none;
}
dom-toggle[aria-checked="true"]::after {
	transform: translate(var(--dom-toggle-thumb-offset, 1.25rem), -50%);
}
`;
	document.head.appendChild(style);
}

ensureToggleStyles();

// <dom-toggle checked></dom-toggle>
export class DomToggleElement extends DomElementBase {
	/**
	 * Return attributes that should resync the switch accessibility state.
	 *
	 * @returns {string[]}
	 */
	static get observedAttributes() { return ['checked', 'disabled']; }

	static __doc = {
		name: 'dom-toggle',
		description: 'Accessible switch with role="switch", keyboard support, and aria-checked maintained as you toggle.',
		slots: [],
		attributes: [
			{ name: 'checked', type: 'boolean', description: 'Reflects on/off state.' },
			{ name: 'disabled', type: 'boolean', description: 'Disables the toggle.' },
			{ name: 'aria-label', type: 'string', description: 'Accessible name when no visible label is provided.' },
		],
		events: [
			{ name: 'dom:change', payload: '{ checked }', description: 'Fired when the toggle is flipped.' },
		],
		keyboard: [
			{ keys: 'Space / Enter', action: 'Toggle the value.' },
			{ keys: 'Tab', action: 'Move focus through toggles in source order.' },
		],
		example: `<dom-toggle checked aria-label="Notifications"></dom-toggle>

<script type="module">
  import '@getdom/studio/headless';
  document.querySelector('dom-toggle')
    .addEventListener('dom:change', (e) => console.log(e.detail.checked));
<\/script>`,
	};

	/**
	 * Configure switch semantics, focusability, and interaction handlers.
	 *
	 * @returns {void}
	 */
	connectedCallback() {
		this.setAttribute('role', 'switch');
		this.tabIndex = this.hasAttribute('disabled') ? -1 : 0;
		this._sync();
		this.on(this, 'click', () => this.toggle());
		this.on(this, 'keydown', (e) => {
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				this.toggle();
			}
		});
	}

	/**
	 * Resync ARIA and focus state after an observed attribute changes.
	 *
	 * @returns {void}
	 */
	attributeChangedCallback() { this._sync(); }

	/**
	 * Reflect checked and disabled state to ARIA attributes and keyboard focus.
	 *
	 * @returns {void}
	 */
	_sync() {
		this.setAttribute('aria-checked', String(this.checked));
		const disabled = this.hasAttribute('disabled');
		this.tabIndex = disabled ? -1 : 0;
		if (disabled) this.setAttribute('aria-disabled', 'true');
		else this.removeAttribute('aria-disabled');
	}

	/**
	 * Read the reflected checked state.
	 *
	 * @returns {boolean}
	 */
	get checked() { return this.boolAttr('checked'); }

	/**
	 * Reflect a new checked state onto the element.
	 *
	 * @param {boolean} value - Whether the switch should be checked.
	 */
	set checked(value) { this.setBoolAttr('checked', !!value); }

	/**
	 * Toggle the switch state and emit the change event.
	 *
	 * @returns {void}
	 */
	toggle() {
		if (this.hasAttribute('disabled')) return;
		this.checked = !this.checked;
		this.emit('dom:change', { checked: this.checked });
	}
}

defineDomElement('dom-toggle', DomToggleElement);
