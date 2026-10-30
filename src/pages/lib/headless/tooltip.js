import { DomElementBase, defineDomElement } from './base.js';
import { attachTooltip } from './tooltip-controller.js';

export { attachTooltip, DomTooltipController } from './tooltip-controller.js';

// <dom-tooltip text="…" placement="top|bottom|left|right" delay="150">
//   <button>trigger</button>
// </dom-tooltip>
export class DomTooltipElement extends DomElementBase {
	static get observedAttributes() {
		return ['for', 'text', 'placement', 'delay', 'offset', 'collision-padding', 'floating-mode', 'flip'];
	}

	static __doc = {
		name: 'dom-tooltip',
		description: 'Lightweight tooltip wired through aria-describedby. Wrap a trigger or reference one by id with for.',
		slots: [
			{ name: '(default)', description: 'The trigger — any focusable element wrapped by the tooltip when for is not set.' },
		],
		attributes: [
			{ name: 'for', type: 'string', description: 'ID of an existing trigger element. This avoids adding a wrapper around the trigger.' },
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

	/**
	 * Initialize target and controller state for this declarative host.
	 */
	constructor() {
		super();
		this._trigger = null;
		this._controller = null;
	}

	/**
	 * Register the wrapper child or explicit for target when connected.
	 *
	 * @returns {void}
	 */
	connectedCallback() {
		if (this._connectTarget()) return;
		queueMicrotask(() => {
			if (this.isConnected && !this._controller) this._connectTarget();
		});
	}

	/**
	 * Read the complete tooltip options from host attributes.
	 *
	 * @returns {Record<string, unknown>} Controller options.
	 */
	_options() {
		return {
			text: this.getAttribute('text') || '',
			placement: this.getAttribute('placement') || 'top',
			delay: Number(this.getAttribute('delay') || 120),
			offset: Number(this.getAttribute('offset') || 6),
			collisionPadding: Number(this.getAttribute('collision-padding') || 8),
			floatingMode: this.getAttribute('floating-mode') || 'viewport',
			flip: this.getAttribute('flip') !== 'false',
		};
	}

	/**
	 * Resolve the target from for or the existing wrapper child.
	 *
	 * @returns {HTMLElement | null} Explicit tooltip target.
	 */
	_resolveTarget() {
		const targetId = this.getAttribute('for')?.trim();
		if (targetId) {
			const target = this.ownerDocument.getElementById(targetId);
			return target instanceof HTMLElement ? target : null;
		}
		return [...this.children].find((element) => element instanceof HTMLElement) || null;
	}

	/**
	 * Attach or update the controller for the currently resolved target.
	 *
	 * @returns {boolean} Whether a target is registered.
	 */
	_connectTarget() {
		const target = this._resolveTarget();
		if (!target) {
			this._disconnectTarget();
			return false;
		}
		if (target === this._trigger && this._controller) {
			this._controller.update(this._options());
			return true;
		}
		this._disconnectTarget();
		this._trigger = target;
		this._controller = attachTooltip(target, this._options(), this);
		return true;
	}

	/**
	 * Destroy the current per-target tooltip registration.
	 *
	 * @returns {void}
	 */
	_disconnectTarget() {
		this._controller?.destroy();
		this._controller = null;
		this._trigger = null;
	}

	/**
	 * Reconnect for changes to for and update options for other attributes.
	 *
	 * @param {string} name Changed attribute name.
	 * @returns {void}
	 */
	attributeChangedCallback(name) {
		if (!this.isConnected) return;
		if (name === 'for') {
			this._connectTarget();
			return;
		}
		this._controller?.update(this._options());
	}

	/**
	 * Release the registered target when this host leaves the document.
	 *
	 * @returns {void}
	 */
	disconnectedCallback() {
		this._disconnectTarget();
		super.disconnectedCallback();
	}
}

defineDomElement('dom-tooltip', DomTooltipElement);
