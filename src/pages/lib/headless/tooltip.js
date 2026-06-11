import { DomElementBase, defineDomElement, isBrowser, uid } from './base.js';
import {
	applyFloatingPosition,
	autoUpdateFloating,
} from './floating.js';

const STYLE_ID = 'dom-tooltip-styles';

function ensureTooltipStyles() {
	if (!isBrowser || document.getElementById(STYLE_ID)) return;
	const style = document.createElement('style');
	style.id = STYLE_ID;
	style.textContent = `
dom-tooltip {
	display: inline-flex;
}
[data-dom-tooltip] {
	position: fixed;
	z-index: 70;
	max-width: min(18rem, calc(100vw - 1rem));
	padding: 0.375rem 0.625rem;
	border-radius: 0.5rem;
	font-size: 0.75rem;
	line-height: 1rem;
	font-weight: 500;
	background: var(--primary);
	color: var(--primary-fg);
	box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.25);
	white-space: normal;
	pointer-events: none;
}
[data-dom-tooltip][hidden] { display: none; }
`;
	document.head.appendChild(style);
}

ensureTooltipStyles();

// <dom-tooltip text="…" placement="top|bottom|left|right" delay="150">
//   <button>trigger</button>
// </dom-tooltip>
export class DomTooltipElement extends DomElementBase {
	static get observedAttributes() { return ['text', 'placement', 'delay', 'offset', 'collision-padding', 'floating-mode', 'flip']; }

	static __doc = {
		name: 'dom-tooltip',
		description: 'Lightweight tooltip wired through aria-describedby. The bubble appears on hover and focus, and uses shared floating positioning.',
		slots: [
			{ name: '(default)', description: 'The trigger — any focusable element wrapped by the tooltip.' },
		],
		attributes: [
			{ name: 'text', type: 'string', description: 'Tooltip body. Keep it short.' },
			{ name: 'placement', type: "'top' | 'bottom' | 'left' | 'right'", description: 'Position relative to the trigger.' },
			{ name: 'delay', type: 'number', description: 'Open delay in milliseconds (default 120).' },
			{ name: 'offset', type: 'number', description: 'Gap in pixels between trigger and tooltip (default 6).' },
			{ name: 'collision-padding', type: 'number', description: 'Viewport padding used when flipping or shifting the tooltip (default 8).' },
			{ name: 'floating-mode', type: "'viewport' | 'anchor'", description: 'viewport keeps the tooltip inside the browser; anchor keeps it attached while scrolling.' },
			{ name: 'flip', type: 'boolean', description: 'Allow the tooltip to flip to the opposite side when it would collide with the viewport.' },
		],
		events: [
			{ name: 'dom:show', description: 'Fired when the tooltip becomes visible.' },
			{ name: 'dom:hide', description: 'Fired when the tooltip is dismissed.' },
		],
		keyboard: [
			{ keys: 'Focus trigger', action: 'Shows the tooltip.' },
			{ keys: 'Blur trigger', action: 'Hides the tooltip.' },
		],
		example: `<dom-tooltip text="Save your changes" placement="top" delay="120">
  <button>Save</button>
</dom-tooltip>`,
	};

	constructor() {
		super();
		this._bubble = null;
		this._trigger = null;
		this._t = 0;
		this._reflowOff = null;
	}

	connectedCallback() {
		if (this._bubble) return;

		this._trigger = [...this.children].find((el) => el.getAttribute('role') !== 'tooltip');
		if (!this._trigger) return;

		const id = uid('tip');
		this._bubble = document.createElement('div');
		this._bubble.id = `${id}-bubble`;
		this._bubble.setAttribute('role', 'tooltip');
		this._bubble.setAttribute('data-placement', this.getAttribute('placement') || 'top');
		this._bubble.dataset.domTooltip = '';
		this._bubble.hidden = true;
		this._bubble.textContent = this.getAttribute('text') || '';
		document.body.appendChild(this._bubble);
		this._trigger.setAttribute('aria-describedby', this._bubble.id);

		this.on(this._trigger, 'mouseenter', () => this._show());
		this.on(this._trigger, 'mouseleave', () => this._hide());
		this.on(this._trigger, 'focus', () => this._show());
		this.on(this._trigger, 'blur', () => this._hide());
	}

	_positionOptions() {
		return {
			align: 'center',
			offset: Number(this.getAttribute('offset') || 6),
			placement: this.getAttribute('placement') || 'top',
			padding: Number(this.getAttribute('collision-padding') || 8),
			mode: this.getAttribute('floating-mode') || 'viewport',
			flip: this.getAttribute('flip') !== 'false',
		};
	}

	_place() {
		if (!this._trigger || !this._bubble || this._bubble.hidden) return null;
		return applyFloatingPosition(this._trigger, this._bubble, this._positionOptions());
	}

	_show() {
		const delay = Number(this.getAttribute('delay') || 120);
		clearTimeout(this._t);
		this._t = setTimeout(() => {
			this._bubble.style.visibility = 'hidden';
			this._bubble.hidden = false;
			this._place();
			this._reflowOff?.();
			this._reflowOff = autoUpdateFloating(this._trigger, this._bubble, () => this._place());
			this._bubble.style.visibility = '';
			this.emit('dom:show');
		}, delay);
	}

	_hide() {
		clearTimeout(this._t);
		this._reflowOff?.();
		this._reflowOff = null;
		this._bubble.hidden = true;
		this.emit('dom:hide');
	}

	attributeChangedCallback(name, _o, value) {
		if (!this._bubble) return;
		if (name === 'text') this._bubble.textContent = value || '';
		if (name === 'placement') this._bubble.setAttribute('data-placement', value || 'top');
		if (['placement', 'offset', 'collision-padding', 'floating-mode', 'flip'].includes(name)) this._place();
	}

	disconnectedCallback() {
		clearTimeout(this._t);
		this._reflowOff?.();
		this._reflowOff = null;
		this._bubble?.remove();
		this._bubble = null;
		this._trigger = null;
		super.disconnectedCallback();
	}
}

defineDomElement('dom-tooltip', DomTooltipElement);
