import { nextTick, onBeforeUnmount, ref, toValue, watch } from 'vue';

/**
 * Reads a computed CSS length and falls back when the browser reports a
 * keyword such as `normal`.
 *
 * @param {string} value Computed CSS value.
 * @param {number} fallback Numeric fallback in pixels.
 * @returns {number} Parsed pixel value.
 */
function cssPixels(value, fallback = 0) {
	const parsedValue = Number.parseFloat(value);
	return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

/**
 * Resolves a row count into a positive whole number.
 *
 * @param {unknown} value Requested row count.
 * @param {number} fallback Fallback row count.
 * @returns {number} Positive whole-number row count.
 */
function rowCount(value, fallback) {
	const numericValue = Number(value);
	if (!Number.isFinite(numericValue) || numericValue <= 0) return fallback;
	return Math.max(1, Math.round(numericValue));
}

/**
 * Keeps a textarea's rendered height aligned with its content while
 * preserving a minimum row count and an optional maximum row count.
 *
 * @param {object} options Reactive autosize options.
 * @param {unknown} options.value Reactive textarea value.
 * @param {unknown} options.autosize Whether automatic sizing is enabled.
 * @param {unknown} options.rows Minimum visible row count.
 * @param {unknown} options.maxRows Maximum visible row count, or zero for no maximum.
 * @returns {{ textarea: import('vue').Ref<HTMLTextAreaElement|null>, resize: () => void }} Autosize bindings.
 */
export function useTextareaAutosize(options) {
	const textarea = ref(null);
	let resizeObserver = null;
	let observedWidth = 0;

	/**
	 * Clears inline sizing when autosize is disabled.
	 *
	 * @param {HTMLTextAreaElement} element Textarea to reset.
	 * @returns {void}
	 */
	function clearSizing(element) {
		element.style.height = '';
		element.style.overflowY = '';
	}

	/**
	 * Measures the textarea content and applies a row-bounded height.
	 *
	 * @returns {void}
	 */
	function resize() {
		const element = textarea.value;
		if (!element) return;
		if (!toValue(options.autosize)) {
			clearSizing(element);
			return;
		}
		if (typeof window === 'undefined') return;

		const styles = window.getComputedStyle(element);
		const fontSize = cssPixels(styles.fontSize, 16);
		const lineHeight = cssPixels(styles.lineHeight, fontSize * 1.5);
		const padding = cssPixels(styles.paddingTop) + cssPixels(styles.paddingBottom);
		const border = cssPixels(styles.borderTopWidth) + cssPixels(styles.borderBottomWidth);
		const minimumRows = rowCount(toValue(options.rows), 1);
		const requestedMaximumRows = Number(toValue(options.maxRows));
		const maximumRows = Number.isFinite(requestedMaximumRows) && requestedMaximumRows > 0
			? Math.max(minimumRows, rowCount(requestedMaximumRows, minimumRows))
			: Number.POSITIVE_INFINITY;

		element.style.height = '0px';
		const measuredContentHeight = element.scrollHeight;
		const minimumContentHeight = (minimumRows * lineHeight) + padding;
		const maximumContentHeight = Number.isFinite(maximumRows)
			? (maximumRows * lineHeight) + padding
			: Number.POSITIVE_INFINITY;
		const contentHeight = Math.max(
			minimumContentHeight,
			Math.min(measuredContentHeight, maximumContentHeight),
		);
		const renderedHeight = styles.boxSizing === 'border-box'
			? contentHeight + border
			: Math.max(0, contentHeight - padding);

		element.style.height = `${Math.ceil(renderedHeight)}px`;
		element.style.overflowY = measuredContentHeight > maximumContentHeight + 1 ? 'auto' : 'hidden';
	}

	/**
	 * Defers measurement until Vue has written reactive text and prop changes.
	 *
	 * @returns {Promise<void>} Promise resolved after the scheduled measurement.
	 */
	async function scheduleResize() {
		await nextTick();
		resize();
	}

	/**
	 * Re-measures wrapped content only when the textarea width changes.
	 *
	 * @param {ResizeObserverEntry[]} entries Resize observer entries.
	 * @returns {void}
	 */
	function onElementResize(entries) {
		const width = entries[0]?.contentRect?.width || 0;
		if (Math.abs(width - observedWidth) < 0.5) return;
		observedWidth = width;
		resize();
	}

	watch(
		() => [
			toValue(options.value),
			toValue(options.autosize),
			toValue(options.rows),
			toValue(options.maxRows),
		],
		() => void scheduleResize(),
		{ immediate: true, flush: 'post' },
	);

	/**
	 * Observes the current textarea, including after an editor-mode change.
	 *
	 * @param {HTMLTextAreaElement|null} element Current native input.
	 * @returns {void}
	 */
	function observeTextarea(element) {
		resizeObserver?.disconnect();
		if (!element) return;
		resize();
		if (typeof ResizeObserver === 'undefined') return;
		observedWidth = element.getBoundingClientRect().width;
		resizeObserver = new ResizeObserver(onElementResize);
		resizeObserver.observe(element);
	}

	watch(textarea, observeTextarea, { flush: 'post' });
	onBeforeUnmount(() => resizeObserver?.disconnect());

	return {
		textarea,
		resize,
	};
}
