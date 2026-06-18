import { DomElementBase, defineDomElement, isBrowser, uid } from './base.js';
import {
	applyFloatingPosition,
	autoUpdateFloating,
} from './floating.js';
import {
	beginFloatingEffectEnter,
	beginFloatingEffectLeave,
	clearFloatingEffectTimer,
	prepareFloatingEffect,
	resetFloatingEffectState,
} from './floating-effect.js';

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
	margin: 0;
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
[data-dom-tooltip][popover] {
	margin: 0;
	overflow: visible;
}
[data-dom-tooltip][data-floating-effect="fade"] {
	opacity: 0;
	transition: opacity 190ms ease;
}
[data-dom-tooltip][data-floating-open="true"] {
	opacity: 1;
}
[data-dom-tooltip][data-entering="from"][data-floating-open="true"],
[data-dom-tooltip][data-leaving="to"][data-floating-open="true"] {
	opacity: 0;
}
[data-dom-tooltip][data-entering="to"][data-floating-open="true"],
[data-dom-tooltip][data-leaving="from"][data-floating-open="true"] {
	opacity: 1;
}
[data-dom-tooltip][hidden] { display: none; }
@media (prefers-reduced-motion: reduce) {
	[data-dom-tooltip][data-floating-effect="fade"] {
		transition-duration: 1ms;
	}
}
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
		this._open = false;
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
		this._bubble.dataset.floatingEffect = 'fade';
		this._bubble.setAttribute('popover', 'manual');
		this._bubble.setAttribute('aria-hidden', 'true');
		this._bubble.hidden = true;
		this._bubble.textContent = this.getAttribute('text') || '';
		prepareFloatingEffect(this._bubble, 'fade');
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

	_isBubblePopoverOpen(bubble = this._bubble) {
		try {
			return Boolean(bubble?.matches?.(':popover-open'));
		} catch {
			return false;
		}
	}

	_showBubblePopover(bubble = this._bubble) {
		if (!bubble?.showPopover || this._isBubblePopoverOpen(bubble)) return;
		try {
			bubble.showPopover();
		} catch {
			// Browsers without Popover API support keep the fixed-position fallback.
		}
	}

	_hideBubblePopover(bubble = this._bubble) {
		if (!bubble?.hidePopover || !this._isBubblePopoverOpen(bubble)) return;
		try {
			bubble.hidePopover();
		} catch {
			// Ignore stale popover state during disconnects or browser fallback paths.
		}
	}

	_place() {
		if (!this._trigger || !this._bubble || this._bubble.hidden) return null;
		return applyFloatingPosition(this._trigger, this._bubble, this._positionOptions());
	}

	_bindReflow() {
		this._reflowOff?.();
		this._reflowOff = autoUpdateFloating(this._trigger, this._bubble, () => this._place());
	}

	_unbindReflow() {
		this._reflowOff?.();
		this._reflowOff = null;
	}

	_finishHide(bubble = this._bubble) {
		if (!bubble) return;
		this._hideBubblePopover(bubble);
		bubble.hidden = true;
		bubble.setAttribute('aria-hidden', 'true');
		resetFloatingEffectState(bubble);
	}

	_show() {
		const delay = Number(this.getAttribute('delay') || 120);
		clearTimeout(this._t);
		if (this._open && !this._bubble?.hidden) return;
		this._t = setTimeout(() => {
			const bubble = this._bubble;
			if (!bubble || !this._trigger) return;
			this._open = true;
			bubble.removeAttribute('aria-hidden');
			const showNow = () => {
				bubble.hidden = false;
				this._showBubblePopover(bubble);
				this._place();
				this._bindReflow();
			};
			const animated = beginFloatingEffectEnter(bubble, {
				animatePlacement: false,
				beforeMeasure: showNow,
				beforeFrame: () => this._place(),
				shouldContinue: () => this._open && this._bubble === bubble,
			});
			if (!animated) showNow();
			this.emit('dom:show');
		}, delay);
	}

	_hide() {
		clearTimeout(this._t);
		if (!this._bubble || (!this._open && this._bubble.hidden)) return;
		this._open = false;
		this._unbindReflow();
		const bubble = this._bubble;
		bubble.setAttribute('aria-hidden', 'true');
		beginFloatingEffectLeave(bubble, {
			shouldContinue: () => !this._open && this._bubble === bubble,
			finish: () => {
				if (this._bubble === bubble) this._finishHide(bubble);
			},
		});
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
		this._open = false;
		this._unbindReflow();
		clearFloatingEffectTimer(this._bubble);
		this._finishHide(this._bubble);
		this._bubble?.remove();
		this._bubble = null;
		this._trigger = null;
		super.disconnectedCallback();
	}
}

defineDomElement('dom-tooltip', DomTooltipElement);
