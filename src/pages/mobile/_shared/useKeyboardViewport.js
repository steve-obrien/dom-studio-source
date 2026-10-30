import { onBeforeUnmount, onMounted, ref, toValue, watch } from 'vue';
import { keyboardHeight } from './interactionMath.js';

/**
 * Observes the owning window's keyboard-sized viewport changes without treating
 * pinch zoom as a keyboard. An optional app-supplied inset supports native
 * keyboards that overlay the webview without resizing its visual viewport.
 * @param {import('vue').Ref<HTMLElement|null>} target Surface containing editable controls.
 * @param {Function} enabled Returns whether the surface should adapt.
 * @param {Function} inset Returns a native keyboard inset, or null for detection.
 * @returns {{ open: import('vue').Ref<boolean>, height: import('vue').Ref<number>, available: import('vue').Ref<number>, top: import('vue').Ref<number> }} Reactive geometry.
 */
export function useKeyboardViewport(target, enabled, inset = () => null) {
	const open = ref(false);
	const height = ref(0);
	const available = ref(0);
	const top = ref(0);
	let view;
	let doc;
	let baseline = 0;
	let baselineWidth = 0;
	let frame = 0;
	let blurTimer = 0;

	/** Measures only the viewport of the document containing this surface. */
	function measure() {
		frame = 0;
		if (!view || !target.value) return;
		const viewport = view.visualViewport;
		const visible = viewport?.height || view.innerHeight;
		const layout = Math.max(view.innerHeight, doc.documentElement.clientHeight);
		const active = doc.activeElement;
		const editable = active?.matches('textarea, input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="range"]):not([type="file"]), [contenteditable="true"], [contenteditable=""]');
		const editing = Boolean(editable && target.value.contains(active) && !active.readOnly && !active.disabled);
		if (Math.abs(view.innerWidth - baselineWidth) > 80) {
			baseline = layout;
			baselineWidth = view.innerWidth;
		}
		if (!editing && !open.value) baseline = layout;
		baseline = Math.max(baseline, layout);
		const supplied = toValue(inset);
		const detected = keyboardHeight({ baseline, viewportHeight: visible, scale: viewport?.scale || 1, editing });
		height.value = toValue(enabled) ? (supplied == null ? detected : Math.max(0, Number(supplied) || 0)) : 0;
		open.value = height.value > 0;
		top.value = viewport?.offsetTop || 0;
		const origin = Math.max(0, target.value.getBoundingClientRect().top - top.value);
		available.value = Math.max(0, Math.min(visible, baseline - height.value) - origin);
	}

	/** Coalesces focus, scroll, and resize notifications into a single frame. */
	function schedule() {
		if (view && !frame) frame = view.requestAnimationFrame(measure);
	}

	/** Waits for the next focus target before deciding that editing ended. */
	function onBlur() {
		view.clearTimeout(blurTimer);
		blurTimer = view.setTimeout(schedule, 0);
	}

	/** Binds after mount so adopted iframe nodes use their actual owner window. */
	function mount() {
		doc = target.value?.ownerDocument;
		view = doc?.defaultView;
		if (!view) return;
		baseline = Math.max(view.innerHeight, doc.documentElement.clientHeight);
		baselineWidth = view.innerWidth;
		view.addEventListener('resize', schedule);
		view.visualViewport?.addEventListener('resize', schedule);
		view.visualViewport?.addEventListener('scroll', schedule);
		doc.addEventListener('focusin', schedule);
		doc.addEventListener('focusout', onBlur);
		measure();
	}

	/** Releases listeners and pending callbacks when a surface is removed. */
	function unmount() {
		view?.cancelAnimationFrame(frame);
		view?.clearTimeout(blurTimer);
		view?.removeEventListener('resize', schedule);
		view?.visualViewport?.removeEventListener('resize', schedule);
		view?.visualViewport?.removeEventListener('scroll', schedule);
		doc?.removeEventListener('focusin', schedule);
		doc?.removeEventListener('focusout', onBlur);
	}

	watch([enabled, inset], schedule);
	onMounted(mount);
	onBeforeUnmount(unmount);
	return { open, height, available, top };
}
