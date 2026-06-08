import { DomElementBase, defineDomElement, isBrowser } from './base.js';

const STYLE_ID = 'dom-checkbox-styles';

function ensureStyles() {
	if (!isBrowser || document.getElementById(STYLE_ID)) return;
	const style = document.createElement('style');
	style.id = STYLE_ID;
	style.textContent = `
dom-checkbox {
	display: inline-grid;
	place-items: center;
	width: 1.25rem;
	height: 1.25rem;
	border: 1px solid var(--border);
	border-radius: 0.375rem;
	background: var(--background);
	color: var(--primary-foreground);
	cursor: pointer;
	vertical-align: middle;
}
dom-checkbox::after {
	content: '';
	width: 0.55rem;
	height: 0.32rem;
	border-left: 2px solid currentColor;
	border-bottom: 2px solid currentColor;
	transform: rotate(-45deg) translate(1px, -1px);
	opacity: 0;
}
dom-checkbox[aria-checked="true"] {
	border-color: var(--primary);
	background: var(--primary);
}
dom-checkbox[aria-checked="true"]::after {
	opacity: 1;
}
dom-checkbox:focus-visible {
	outline: 2px solid var(--ring);
	outline-offset: 2px;
}
dom-checkbox[aria-disabled="true"] {
	opacity: 0.5;
	cursor: not-allowed;
}
`;
	document.head.appendChild(style);
}

ensureStyles();

export class DomCheckboxElement extends DomElementBase {
	static get observedAttributes() { return ['checked', 'disabled']; }

	static __doc = {
		name: 'dom-checkbox',
		description: 'Accessible checkbox with checked state, keyboard support, and dom:change.',
		attributes: [
			{ name: 'checked', type: 'boolean', description: 'Checked state.' },
			{ name: 'disabled', type: 'boolean', description: 'Disable interaction.' },
			{ name: 'aria-label', type: 'string', description: 'Accessible name when no visible label is provided.' },
		],
		events: [{ name: 'dom:change', payload: '{ checked }', description: 'Fired when checked state changes.' }],
		keyboard: [{ keys: 'Space / Enter', action: 'Toggle checked state.' }],
	};

	connectedCallback() {
		this.setAttribute('role', 'checkbox');
		this.tabIndex = this.hasAttribute('disabled') ? -1 : 0;
		this._sync();
		this.on(this, 'click', () => this.toggle());
		this.on(this, 'keydown', (event) => {
			if (event.key !== ' ' && event.key !== 'Enter') return;
			event.preventDefault();
			this.toggle();
		});
	}

	attributeChangedCallback() { this._sync(); }

	get checked() { return this.boolAttr('checked'); }
	set checked(value) { this.setBoolAttr('checked', !!value); }

	_sync() {
		this.setAttribute('aria-checked', String(this.checked));
		const disabled = this.hasAttribute('disabled');
		this.tabIndex = disabled ? -1 : 0;
		if (disabled) this.setAttribute('aria-disabled', 'true');
		else this.removeAttribute('aria-disabled');
	}

	toggle() {
		if (this.hasAttribute('disabled')) return;
		this.checked = !this.checked;
		this.emit('dom:change', { checked: this.checked });
	}
}

defineDomElement('dom-checkbox', DomCheckboxElement);
