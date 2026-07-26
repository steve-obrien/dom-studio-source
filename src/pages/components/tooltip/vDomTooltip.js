import { attachTooltip } from '../../lib/headless/tooltip-controller.js';

const controllers = new WeakMap();
const placementModifiers = ['top', 'right', 'bottom', 'left'];

/**
 * Resolve the first supported placement modifier from a Vue directive binding.
 *
 * @param {Record<string, boolean>} modifiers Vue directive modifiers.
 * @returns {'top' | 'right' | 'bottom' | 'left' | undefined} Requested placement.
 */
function placementFromModifiers(modifiers) {
	return placementModifiers.find((placement) => modifiers[placement]);
}

/**
 * Normalize a Vue directive binding into the shared tooltip controller shape.
 *
 * String bindings are shorthand for tooltip text. Object bindings may use
 * either `label` or `text`, and falsey or disabled bindings remove behaviour
 * without unmounting the target element.
 *
 * @param {unknown} value Vue directive binding value.
 * @param {Record<string, boolean>} modifiers Vue directive modifiers.
 * @returns {Record<string, unknown> | null} Controller options or null when disabled.
 */
function normalizeDirectiveValue(value, modifiers = {}) {
	const placement = placementFromModifiers(modifiers);

	if (typeof value === 'string') {
		if (!value.trim()) return null;
		return {
			text: value,
			...(placement ? { placement } : {}),
		};
	}
	if (!value || typeof value !== 'object' || value.disabled) return null;
	const text = String(value.text ?? value.label ?? '');
	if (!text.trim()) return null;
	return {
		...value,
		text,
		...(placement ? { placement } : {}),
	};
}

/**
 * Attach, update, or remove tooltip behaviour for one directive target.
 *
 * @param {HTMLElement} element Vue directive target element.
 * @param {unknown} value Current directive binding value.
 * @param {Record<string, boolean>} modifiers Vue directive modifiers.
 * @returns {void}
 */
function syncDirectiveTooltip(element, value, modifiers = {}) {
	const options = normalizeDirectiveValue(value, modifiers);
	const controller = controllers.get(element);

	if (!options) {
		controller?.destroy();
		controllers.delete(element);
		return;
	}

	if (controller) {
		controller.update(options);
		return;
	}

	controllers.set(element, attachTooltip(element, options, element));
}

export const vDomTooltip = {
	/**
	 * Register tooltip behaviour directly on the mounted element.
	 *
	 * @param {HTMLElement} element Vue directive target element.
	 * @param {{ value: unknown, modifiers: Record<string, boolean> }} binding Vue directive binding.
	 * @returns {void}
	 */
	mounted(element, binding) {
		syncDirectiveTooltip(element, binding.value, binding.modifiers);
	},

	/**
	 * Synchronize content, placement, and enabled state after Vue updates.
	 *
	 * @param {HTMLElement} element Vue directive target element.
	 * @param {{ value: unknown, modifiers: Record<string, boolean> }} binding Vue directive binding.
	 * @returns {void}
	 */
	updated(element, binding) {
		syncDirectiveTooltip(element, binding.value, binding.modifiers);
	},

	/**
	 * Release listeners, ARIA wiring, and the bubble before unmount.
	 *
	 * @param {HTMLElement} element Vue directive target element.
	 * @returns {void}
	 */
	beforeUnmount(element) {
		controllers.get(element)?.destroy();
		controllers.delete(element);
	},
};
