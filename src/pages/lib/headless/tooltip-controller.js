import { isBrowser, uid } from './base.js';
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
const DEFAULT_OPTIONS = Object.freeze({
	text: '',
	placement: 'top',
	delay: 120,
	offset: 6,
	collisionPadding: 8,
	floatingMode: 'viewport',
	flip: true,
});

/**
 * Install the document-level styles required by headless tooltip bubbles.
 *
 * Tooltip bubbles are appended to `document.body` so they can escape local
 * stacking contexts and overflow containers. Styles are installed lazily when
 * the first target registers a tooltip.
 *
 * @returns {void}
 */
function ensureTooltipStyles() {
	if (!isBrowser || document.getElementById(STYLE_ID)) return;
	const style = document.createElement('style');
	style.id = STYLE_ID;
	style.textContent = `
dom-tooltip {
	display: inline-flex;
}
dom-tooltip[for] {
	display: none;
}
[data-dom-tooltip] {
	--dom-tooltip-arrow-size: 0.375rem;
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
[data-dom-tooltip]::before {
	content: "";
	position: absolute;
	display: block;
	width: 0;
	height: 0;
	border: var(--dom-tooltip-arrow-size) solid transparent;
	pointer-events: none;
}
[data-dom-tooltip][data-side="top"]::before {
	bottom: calc(var(--dom-tooltip-arrow-size) * -1);
	left: var(--dom-popover-arrow-x, 50%);
	border-top-color: var(--primary);
	border-bottom: 0;
	transform: translateX(-50%);
}
[data-dom-tooltip][data-side="bottom"]::before {
	top: calc(var(--dom-tooltip-arrow-size) * -1);
	left: var(--dom-popover-arrow-x, 50%);
	border-top: 0;
	border-bottom-color: var(--primary);
	transform: translateX(-50%);
}
[data-dom-tooltip][data-side="left"]::before {
	top: var(--dom-popover-arrow-y, 50%);
	right: calc(var(--dom-tooltip-arrow-size) * -1);
	border-right: 0;
	border-left-color: var(--primary);
	transform: translateY(-50%);
}
[data-dom-tooltip][data-side="right"]::before {
	top: var(--dom-popover-arrow-y, 50%);
	left: calc(var(--dom-tooltip-arrow-size) * -1);
	border-right-color: var(--primary);
	border-left: 0;
	transform: translateY(-50%);
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
[data-dom-tooltip][hidden] {
	display: none;
}
@media (prefers-reduced-motion: reduce) {
	[data-dom-tooltip][data-floating-effect="fade"] {
		transition-duration: 1ms;
	}
}
`;
	document.head.appendChild(style);
}

/**
 * Coerce a tooltip number option to a finite non-negative value.
 *
 * @param {unknown} value Candidate option value.
 * @param {number} fallback Default used for invalid values.
 * @returns {number} Normalized option value.
 */
function normalizeNumber(value, fallback) {
	const number = Number(value);
	return Number.isFinite(number) && number >= 0 ? number : fallback;
}

/**
 * Normalize public tooltip options into the controller's complete contract.
 *
 * @param {Record<string, unknown>} [options] Partial public tooltip options.
 * @returns {{
 * 	text: string,
 * 	placement: string,
 * 	delay: number,
 * 	offset: number,
 * 	collisionPadding: number,
 * 	floatingMode: string,
 * 	flip: boolean,
 * }} Complete tooltip options.
 */
function normalizeOptions(options = {}) {
	return {
		text: String(options.text ?? DEFAULT_OPTIONS.text),
		placement: String(options.placement || DEFAULT_OPTIONS.placement),
		delay: normalizeNumber(options.delay, DEFAULT_OPTIONS.delay),
		offset: normalizeNumber(options.offset, DEFAULT_OPTIONS.offset),
		collisionPadding: normalizeNumber(options.collisionPadding, DEFAULT_OPTIONS.collisionPadding),
		floatingMode: String(options.floatingMode || DEFAULT_OPTIONS.floatingMode),
		flip: options.flip !== false,
	};
}

/**
 * Dispatch a public tooltip lifecycle event from its declarative owner.
 *
 * @param {EventTarget | null} target Event target supplied by the caller.
 * @param {'dom:show' | 'dom:hide'} type Tooltip lifecycle event name.
 * @returns {void}
 */
function emitTooltipEvent(target, type) {
	if (!target?.dispatchEvent) return;
	target.dispatchEvent(new CustomEvent(type, {
		bubbles: true,
		composed: true,
	}));
}

/**
 * Own the bubble, ARIA relationship, listeners, and positioning for one target.
 */
export class DomTooltipController {
	/**
	 * Create a tooltip controller for one explicit target.
	 *
	 * @param {HTMLElement} trigger Element that receives hover and focus interactions.
	 * @param {Record<string, unknown>} [options] Tooltip content and positioning options.
	 * @param {EventTarget} [eventTarget] Element that emits public tooltip lifecycle events.
	 */
	constructor(trigger, options = {}, eventTarget = trigger) {
		if (!(trigger instanceof HTMLElement)) {
			throw new TypeError('attachTooltip requires an HTMLElement target.');
		}

		ensureTooltipStyles();
		this.trigger = trigger;
		this.eventTarget = eventTarget;
		this.options = normalizeOptions(options);
		this.bubble = null;
		this.timer = 0;
		this.open = false;
		this.hovered = false;
		this.focused = false;
		this.reflowOff = null;
		this.listeners = [];

		this._createBubble();
		this._bindInteractions();
	}

	/**
	 * Create the body-level tooltip bubble and its ARIA relationship.
	 *
	 * @returns {void}
	 */
	_createBubble() {
		const id = uid('tip');
		const bubble = document.createElement('div');
		bubble.id = `${id}-bubble`;
		bubble.setAttribute('role', 'tooltip');
		bubble.setAttribute('data-placement', this.options.placement);
		bubble.dataset.domTooltip = '';
		bubble.dataset.floatingEffect = 'fade';
		bubble.setAttribute('popover', 'manual');
		bubble.setAttribute('aria-hidden', 'true');
		bubble.hidden = true;
		bubble.textContent = this.options.text;
		prepareFloatingEffect(bubble, 'fade');
		document.body.appendChild(bubble);
		this.bubble = bubble;
		this._addDescriptionId(bubble.id);
	}

	/**
	 * Add the tooltip bubble without replacing existing descriptions.
	 *
	 * @param {string} id Tooltip bubble identifier.
	 * @returns {void}
	 */
	_addDescriptionId(id) {
		const ids = new Set((this.trigger.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
		ids.add(id);
		this.trigger.setAttribute('aria-describedby', [...ids].join(' '));
	}

	/**
	 * Remove only this controller's description from the target.
	 *
	 * @param {string} id Tooltip bubble identifier.
	 * @returns {void}
	 */
	_removeDescriptionId(id) {
		const ids = (this.trigger.getAttribute('aria-describedby') || '')
			.split(/\s+/)
			.filter((value) => value && value !== id);
		if (ids.length) {
			this.trigger.setAttribute('aria-describedby', ids.join(' '));
			return;
		}
		this.trigger.removeAttribute('aria-describedby');
	}

	/**
	 * Register one interaction listener for cleanup with the controller.
	 *
	 * @param {string} type DOM event name.
	 * @param {EventListener} handler Bound event handler.
	 * @returns {void}
	 */
	_listen(type, handler) {
		this.trigger.addEventListener(type, handler);
		this.listeners.push(() => this.trigger.removeEventListener(type, handler));
	}

	/**
	 * Bind direct hover, focus, and keyboard interactions to the target.
	 *
	 * @returns {void}
	 */
	_bindInteractions() {
		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
		this.handleFocus = this.handleFocus.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
		this.handleKeydown = this.handleKeydown.bind(this);
		this._listen('mouseenter', this.handleMouseEnter);
		this._listen('mouseleave', this.handleMouseLeave);
		this._listen('focus', this.handleFocus);
		this._listen('blur', this.handleBlur);
		this._listen('keydown', this.handleKeydown);
	}

	/**
	 * Show the tooltip when pointer interest begins.
	 *
	 * @returns {void}
	 */
	handleMouseEnter() {
		this.hovered = true;
		this.show();
	}

	/**
	 * Hide the tooltip after pointer interest ends unless focus remains.
	 *
	 * @returns {void}
	 */
	handleMouseLeave() {
		this.hovered = false;
		if (!this.focused) this.hide();
	}

	/**
	 * Show the tooltip when keyboard focus reaches the target.
	 *
	 * @returns {void}
	 */
	handleFocus() {
		this.focused = true;
		this.show();
	}

	/**
	 * Hide the tooltip after focus leaves unless pointer interest remains.
	 *
	 * @returns {void}
	 */
	handleBlur() {
		this.focused = false;
		if (!this.hovered) this.hide();
	}

	/**
	 * Dismiss an open tooltip with Escape.
	 *
	 * @param {KeyboardEvent} event Keyboard interaction from the target.
	 * @returns {void}
	 */
	handleKeydown(event) {
		if (event.key === 'Escape') this.hide();
	}

	/**
	 * Return the shared floating-position options for the current tooltip.
	 *
	 * @returns {Record<string, unknown>} Floating position options.
	 */
	_positionOptions() {
		return {
			align: 'center',
			offset: this.options.offset,
			placement: this.options.placement,
			padding: this.options.collisionPadding,
			mode: this.options.floatingMode,
			flip: this.options.flip,
		};
	}

	/**
	 * Check whether the bubble currently participates in the Popover top layer.
	 *
	 * @returns {boolean} Whether the bubble is open as a native popover.
	 */
	_isBubblePopoverOpen() {
		try {
			return Boolean(this.bubble?.matches?.(':popover-open'));
		} catch {
			return false;
		}
	}

	/**
	 * Promote the bubble into the native Popover top layer when supported.
	 *
	 * @returns {void}
	 */
	_showBubblePopover() {
		if (!this.bubble?.showPopover || this._isBubblePopoverOpen()) return;
		try {
			this.bubble.showPopover();
		} catch {
			// Browsers without Popover API support keep the fixed-position fallback.
		}
	}

	/**
	 * Remove the bubble from the native Popover top layer when supported.
	 *
	 * @returns {void}
	 */
	_hideBubblePopover() {
		if (!this.bubble?.hidePopover || !this._isBubblePopoverOpen()) return;
		try {
			this.bubble.hidePopover();
		} catch {
			// Ignore stale popover state during teardown or browser fallback paths.
		}
	}

	/**
	 * Place the visible bubble relative to its registered target.
	 *
	 * @returns {Record<string, unknown> | null} Floating position result.
	 */
	_place() {
		if (!this.bubble || this.bubble.hidden) return null;
		return applyFloatingPosition(this.trigger, this.bubble, this._positionOptions());
	}

	/**
	 * Keep the visible bubble aligned during resize, scroll, and layout changes.
	 *
	 * @returns {void}
	 */
	_bindReflow() {
		this._unbindReflow();
		this.reflowOff = autoUpdateFloating(this.trigger, this.bubble, () => this._place());
	}

	/**
	 * Stop automatic floating-position updates.
	 *
	 * @returns {void}
	 */
	_unbindReflow() {
		this.reflowOff?.();
		this.reflowOff = null;
	}

	/**
	 * Complete hiding after the leave transition.
	 *
	 * @param {HTMLElement | null} [bubble] Bubble associated with the transition.
	 * @returns {void}
	 */
	_finishHide(bubble = this.bubble) {
		if (!bubble) return;
		this._hideBubblePopover();
		bubble.hidden = true;
		bubble.setAttribute('aria-hidden', 'true');
		resetFloatingEffectState(bubble);
	}

	/**
	 * Update tooltip content and positioning without replacing its target.
	 *
	 * @param {Record<string, unknown>} [options] Complete or partial tooltip options.
	 * @returns {void}
	 */
	update(options = {}) {
		this.options = normalizeOptions(options);
		if (!this.bubble) return;
		this.bubble.textContent = this.options.text;
		this.bubble.setAttribute('data-placement', this.options.placement);
		if (!this.options.text) {
			this.hide();
			return;
		}
		this._place();
	}

	/**
	 * Show the tooltip after its configured intent delay.
	 *
	 * @returns {void}
	 */
	show() {
		window.clearTimeout(this.timer);
		if (!this.options.text || (this.open && !this.bubble?.hidden)) return;
		this.timer = window.setTimeout(() => {
			const bubble = this.bubble;
			if (!bubble) return;
			this.open = true;
			bubble.removeAttribute('aria-hidden');
			const showNow = () => {
				bubble.hidden = false;
				this._showBubblePopover();
				this._place();
				this._bindReflow();
			};
			const animated = beginFloatingEffectEnter(bubble, {
				animatePlacement: false,
				beforeMeasure: showNow,
				beforeFrame: () => this._place(),
				shouldContinue: () => this.open && this.bubble === bubble,
			});
			if (!animated) showNow();
			emitTooltipEvent(this.eventTarget, 'dom:show');
		}, this.options.delay);
	}

	/**
	 * Hide the tooltip and stop active positioning work.
	 *
	 * @returns {void}
	 */
	hide() {
		window.clearTimeout(this.timer);
		if (!this.bubble || (!this.open && this.bubble.hidden)) return;
		this.open = false;
		this._unbindReflow();
		const bubble = this.bubble;
		bubble.setAttribute('aria-hidden', 'true');
		beginFloatingEffectLeave(bubble, {
			shouldContinue: () => !this.open && this.bubble === bubble,
			finish: () => {
				if (this.bubble === bubble) this._finishHide(bubble);
			},
		});
		emitTooltipEvent(this.eventTarget, 'dom:hide');
	}

	/**
	 * Release every resource owned by this target registration.
	 *
	 * @returns {void}
	 */
	destroy() {
		window.clearTimeout(this.timer);
		this.open = false;
		this.hovered = false;
		this.focused = false;
		this._unbindReflow();
		for (const removeListener of this.listeners) removeListener();
		this.listeners = [];
		clearFloatingEffectTimer(this.bubble);
		const bubble = this.bubble;
		this._finishHide(bubble);
		if (bubble) this._removeDescriptionId(bubble.id);
		bubble?.remove();
		this.bubble = null;
	}
}

/**
 * Register tooltip behaviour directly on one element.
 *
 * @param {HTMLElement} trigger Element that receives hover and focus interactions.
 * @param {Record<string, unknown>} [options] Tooltip content and positioning options.
 * @param {EventTarget} [eventTarget] Element that emits public tooltip lifecycle events.
 * @returns {DomTooltipController} Controller used to update or remove the tooltip.
 */
export function attachTooltip(trigger, options = {}, eventTarget = trigger) {
	return new DomTooltipController(trigger, options, eventTarget);
}
