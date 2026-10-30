<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { resolveSwipeRelease } from '../_shared/interactionMath.js';

defineOptions({
	__doc: {
		name: 'Swipe actions',
		tag: '<DomSwipeActions>',
		description: 'Reveal row actions with a horizontal swipe while preserving vertical scrolling. Includes an Actions button, keyboard access, coordinated open rows, and opt-in full-swipe shortcuts. Applications own mutations and undo.',
		slots: [
			{ name: '(default)', description: 'Row content, including an ordinary button or link.' },
			{ name: 'action', payload: '{ action, side }', description: 'Optional visual content inside each action button.' },
		],
		events: [
			{ name: 'action', payload: 'SwipeActionPayload', typeRef: 'SwipeActionPayload', description: 'An enabled action selected by button or full swipe. source is button or swipe.' },
			{ name: 'open', payload: 'string', description: 'The revealed side: start, end, or menu.' },
			{ name: 'close', description: 'All action controls have closed.' },
		],
		keyboard: [
			{ keys: 'Actions button', action: 'Shows every action without requiring a gesture.' },
			{ keys: 'Escape', action: 'Closes revealed actions and returns focus to Actions.' },
		],
	},
});

const props = defineProps({
	label: { type: String, default: 'Row', _edit: { description: 'Row name used in the accessible Actions button label.' } },
	startActions: { type: Array, default: () => [], _edit: { typeRef: 'Array<SwipeAction>', description: 'Leading actions: { value, label, icon, variant, disabled, fullSwipe }. icon is an SVG path.' } },
	endActions: { type: Array, default: () => [], _edit: { typeRef: 'Array<SwipeAction>', description: 'Trailing actions with the same shape as startActions.' } },
	fullSwipe: { type: Boolean, default: false, _edit: { description: 'Allow the first action on each side to run after a full swipe only when that action also has fullSwipe: true.' } },
	disabled: { type: Boolean, default: false, _edit: { description: 'Disable gestures and all action controls.' } },
	group: { type: String, default: 'default', _edit: { description: 'Opening a row closes other rows in this group in the same document.' } },
});
const emit = defineEmits(['action', 'open', 'close']);
const root = ref(null);
const surface = ref(null);
const startRail = ref(null);
const endRail = ref(null);
const menuButton = ref(null);
const offset = ref(0);
const dragging = ref(false);
const menuOpen = ref(false);
const openSide = ref('');
const armed = ref(false);
const menuId = `dom-swipe-${useId()}`;
const actions = computed(() => [
	...props.startActions.map((action) => ({ action, side: 'start' })),
	...props.endActions.map((action) => ({ action, side: 'end' })),
]);
const activeSide = computed(() => offset.value === 0 ? '' : offset.value * direction() > 0 ? 'start' : 'end');
const activeActions = computed(() => activeSide.value === 'start' ? props.startActions : props.endActions);
let gesture = null;
let suppressClickUntil = 0;
let doc;
let observer;

/** Returns the action rail width, capped to leave part of the row visible. */
function railWidth(side) {
	const rail = side === 'start' ? startRail.value : endRail.value;
	return rail?.getBoundingClientRect().width || 0;
}

/** Resolves leading/trailing direction from the row's own document and CSS. */
function direction() {
	return root.value?.ownerDocument.defaultView.getComputedStyle(root.value).direction === 'rtl' ? -1 : 1;
}

/** Releases pointer capture without interpreting cancellation as an action. */
function cancelGesture() {
	const previous = gesture;
	gesture = null;
	dragging.value = false;
	armed.value = false;
	if (previous && !previous.touch && surface.value?.hasPointerCapture?.(previous.id)) surface.value.releasePointerCapture(previous.id);
}

/** Closes both gesture and button presentations, optionally returning focus. */
function close(restoreFocus = false) {
	const wasOpen = openSide.value || menuOpen.value;
	cancelGesture();
	offset.value = 0;
	openSide.value = '';
	menuOpen.value = false;
	if (restoreFocus) menuButton.value?.focus({ preventScroll: true });
	if (wasOpen) emit('close');
}

/** Announces the active row so sibling instances close before it opens. */
function announce(side) {
	doc?.dispatchEvent(new doc.defaultView.CustomEvent('dom:swipe-open', { detail: { element: root.value, group: props.group } }));
	emit('open', side);
}

/** Reveals one rail through the public component method. */
function reveal(side) {
	if (props.disabled || !['start', 'end'].includes(side) || !railWidth(side)) return;
	cancelGesture();
	menuOpen.value = false;
	openSide.value = side;
	offset.value = railWidth(side) * (side === 'start' ? 1 : -1) * direction();
	announce(side);
}

/** Opens an explicit, focusable menu containing actions from both sides. */
async function toggleMenu() {
	if (props.disabled) return;
	if (menuOpen.value) return close(true);
	close();
	menuOpen.value = true;
	announce('menu');
	await nextTick();
	root.value?.querySelector('[data-swipe-menu] button:not(:disabled)')?.focus();
}

/** Emits an enabled action after closing the controls; persistence stays with the app. */
function selectAction(action, side, source = 'button') {
	if (props.disabled || action.disabled) return;
	close(source === 'button');
	emit('action', { action, side, source });
}

/** Starts observation without capturing the pointer until horizontal intent is clear. */
function onPointerDown(event) {
	if (event.pointerType === 'touch' || props.disabled || event.button !== 0 || !event.isPrimary || gesture) return;
	if (event.target.closest('input, textarea, select, [contenteditable], [data-swipe-toggle], [data-no-swipe]')) return;
	gesture = { id: event.pointerId, touch: event.pointerType === 'direct-touch', x: event.clientX, y: event.clientY, start: offset.value, lastX: event.clientX, time: event.timeStamp, velocity: 0, initialSide: openSide.value, active: false };
}

/**
 * Adapts a touch sample to the shared gesture coordinates. String ids keep native
 * pointer cancellation separate from the touch stream that owns scrolling.
 * @param {TouchEvent} event Native event whose scrolling default may be cancelled.
 * @param {Touch} touch The single tracked contact.
 * @returns {object} Gesture sample accepted by the shared handlers.
 */
function touchSample(event, touch) {
	return {
		pointerId: `touch-${touch.identifier}`, pointerType: 'direct-touch',
		clientX: touch.clientX, clientY: touch.clientY, timeStamp: event.timeStamp,
		target: event.target, button: 0, isPrimary: true,
		/** Prevents native scrolling only after horizontal intent is established. */
		preventDefault() { if (event.cancelable) event.preventDefault(); },
	};
}

/** Observes one finger while leaving taps, vertical scrolling, and pinch zoom native. */
function onTouchStart(event) {
	if (event.touches.length !== 1) {
		if (gesture?.touch) onPointerCancel({ pointerId: gesture.id });
		return;
	}
	onPointerDown(touchSample(event, event.touches[0]));
}

/**
 * Locks scrolling for the rest of a horizontal gesture, including curved thumb
 * paths. A non-passive listener must cancel touchmove before native scrolling
 * starts; preventing pointermove or changing touch-action mid-gesture is too late.
 */
function onTouchMove(event) {
	if (!gesture?.touch) return;
	if (event.touches.length !== 1 || !event.cancelable) return onPointerCancel({ pointerId: gesture.id });
	const touch = Array.from(event.touches).find((touch) => `touch-${touch.identifier}` === gesture.id);
	if (touch) onPointerMove(touchSample(event, touch));
}

/** Settles only the tracked contact; interrupted or multi-touch gestures never commit. */
function onTouchEnd(event) {
	if (!gesture?.touch) return;
	const touch = Array.from(event.changedTouches).find((touch) => `touch-${touch.identifier}` === gesture.id);
	if (!touch) return;
	const sample = touchSample(event, touch);
	if (event.type === 'touchcancel') onPointerCancel(sample);
	else onPointerUp(sample);
}

/**
 * Tracks horizontal movement on the initially revealed side, clamping reversals at closed.
 * The initial axis decision stays locked until release, even when a thumb arcs.
 * @param {PointerEvent} event Current pointer position and timing.
 * @returns {void}
 */
function onPointerMove(event) {
	if (!gesture || event.pointerId !== gesture.id) return;
	const dx = event.clientX - gesture.x;
	const dy = event.clientY - gesture.y;
	if (!gesture.active) {
		if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) return cancelGesture();
		if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
		gesture.active = true;
		gesture.side = gesture.initialSide || (dx * direction() > 0 ? 'start' : 'end');
		dragging.value = true;
		menuOpen.value = false;
		if (!gesture.touch) surface.value.setPointerCapture(event.pointerId);
		announce(gesture.side);
	}
	event.preventDefault();
	const elapsed = Math.max(1, event.timeStamp - gesture.time);
	const velocity = (event.clientX - gesture.lastX) / elapsed;
	// Smooth sample jitter, but react immediately to a reversal or a paused finger.
	gesture.velocity = elapsed > 100 || Math.sign(velocity) !== Math.sign(gesture.velocity)
		? velocity : velocity * 0.65 + gesture.velocity * 0.35;
	gesture.lastX = event.clientX;
	gesture.time = event.timeStamp;
	const next = gesture.start + dx;
	const side = gesture.side;
	const sign = (side === 'start' ? 1 : -1) * direction();
	const width = railWidth(side);
	const rowWidth = root.value.clientWidth;
	const first = (side === 'start' ? props.startActions : props.endActions)[0];
	const canCommit = props.fullSwipe && first?.fullSwipe && !first.disabled;
	const limit = canCommit ? rowWidth : width + 24;
	offset.value = width ? sign * Math.min(Math.max(0, next * sign), limit) : 0;
	armed.value = resolveSwipeRelease({ distance: Math.abs(offset.value), actionWidth: width, rowWidth, fullSwipe: canCommit }) === 'commit';
}

/**
 * Settles the gesture's original side or commits its explicitly enabled shortcut.
 * @param {PointerEvent} event Released pointer and final event timing.
 * @returns {void}
 */
function onPointerUp(event) {
	if (!gesture || gesture.id !== event.pointerId) return;
	const previous = gesture;
	if (!previous.active) return cancelGesture();
	suppressClickUntil = Date.now() + 400;
	const side = previous.side;
	const first = (side === 'start' ? props.startActions : props.endActions)[0];
	const outcome = resolveSwipeRelease({
		distance: Math.abs(offset.value),
		velocity: event.timeStamp - previous.time > 100 ? 0 : previous.velocity * Math.sign(offset.value),
		actionWidth: railWidth(side), rowWidth: root.value.clientWidth,
		fullSwipe: props.fullSwipe && first?.fullSwipe && !first.disabled,
	});
	cancelGesture();
	if (outcome === 'commit') selectAction(first, side, 'swipe');
	else if (outcome === 'reveal') reveal(side);
	else close();
}

/** Cancels an interrupted gesture without executing full-swipe actions. */
function onPointerCancel(event) {
	if (!gesture || gesture.id !== event.pointerId) return;
	const side = gesture.initialSide;
	if (gesture.active) suppressClickUntil = Date.now() + 400;
	cancelGesture();
	if (side) reveal(side);
	else close();
}

/** Prevents an accidental row activation after a drag or while a rail is open. */
function onSurfaceClick(event) {
	if (event.target.closest('[data-swipe-toggle]')) return;
	if (Date.now() < suppressClickUntil || openSide.value) {
		event.preventDefault();
		event.stopPropagation();
		if (Date.now() >= suppressClickUntil) close();
	}
}

/** Closes this row when another row in its group opens. */
function onSiblingOpen(event) {
	if (event.detail?.group === props.group && event.detail.element !== root.value) close();
}

/** Dismisses controls when interacting outside this row. */
function onOutsidePointer(event) {
	if (!root.value?.contains(event.target)) close();
}

/** Chooses semantic action colours for the rail and explicit menu. */
function actionClass(action) {
	if (action.variant === 'danger') return 'bg-destructive text-destructive-fg';
	if (action.variant === 'success') return 'bg-success text-success-fg';
	return 'bg-primary text-primary-fg';
}

/** Installs listeners in the row's document, including adopted iframe previews. */
function mount() {
	doc = root.value.ownerDocument;
	surface.value.addEventListener('touchstart', onTouchStart, { passive: true });
	surface.value.addEventListener('touchmove', onTouchMove, { passive: false });
	surface.value.addEventListener('touchend', onTouchEnd);
	surface.value.addEventListener('touchcancel', onTouchEnd);
	doc.addEventListener('dom:swipe-open', onSiblingOpen);
	doc.addEventListener('pointerdown', onOutsidePointer, true);
	observer = new doc.defaultView.ResizeObserver(() => { if (openSide.value && !gesture) reveal(openSide.value); });
	observer.observe(root.value);
}

/** Releases document listeners, capture, and geometry observation. */
function unmount() {
	cancelGesture();
	surface.value?.removeEventListener('touchstart', onTouchStart);
	surface.value?.removeEventListener('touchmove', onTouchMove);
	surface.value?.removeEventListener('touchend', onTouchEnd);
	surface.value?.removeEventListener('touchcancel', onTouchEnd);
	doc?.removeEventListener('dom:swipe-open', onSiblingOpen);
	doc?.removeEventListener('pointerdown', onOutsidePointer, true);
	observer?.disconnect();
}

watch(() => [props.disabled, props.startActions, props.endActions], () => close(), { deep: true });
onMounted(mount);
onBeforeUnmount(unmount);
defineExpose({ reveal, close });
</script>

<template>
	<div ref="root" data-dom-swipe-actions class="relative min-w-0 overflow-hidden bg-canvas" @keydown.esc.stop.prevent="close(true)">
		<div class="relative overflow-hidden" :class="offset && activeActions[0] ? actionClass(activeActions[0]) : 'bg-canvas'">
			<div
				v-for="side in ['start', 'end']" :key="side"
				:ref="side === 'start' ? (el) => startRail = el : (el) => endRail = el"
				class="absolute inset-y-0 flex max-w-[80%]" :class="[side === 'start' ? 'start-0' : 'end-0', activeSide !== side && 'invisible']"
				:inert="disabled || activeSide !== side"
				:aria-hidden="disabled || activeSide !== side"
			>
				<button v-for="(action, index) in side === 'start' ? startActions : endActions" :key="action.value ?? index" type="button"
					class="flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 px-5 text-xs font-semibold transition-[filter] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-current disabled:opacity-40"
					:class="[actionClass(action), armed && 'brightness-110']" :disabled="disabled || action.disabled"
					@click="selectAction(action, side)">
					<slot name="action" :action="action" :side="side">
						<svg v-if="action.icon" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path :d="action.icon" stroke-linecap="round" stroke-linejoin="round" /></svg>
						<span>{{ action.label }}</span>
					</slot>
				</button>
			</div>
			<!-- Ignore bubbled capture loss when a touched child transfers implicit capture to this surface. -->
			<div ref="surface" data-swipe-surface class="relative bg-canvas text-canvas-fg transition-transform duration-200 ease-out motion-reduce:transition-none [touch-action:pan-y_pinch-zoom]"
				:class="[actions.length && !disabled && 'pe-11', dragging && 'select-none']"
				:style="{ transform: `translateX(${offset}px)`, transition: dragging ? 'none' : undefined }"
				@pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerCancel" @lostpointercapture.self="onPointerCancel" @click.capture="onSurfaceClick" @dragstart.prevent>
				<slot />
				<button v-if="actions.length && !disabled" ref="menuButton" data-swipe-toggle type="button" class="absolute end-0 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-muted-fg hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring"
					:aria-label="`Actions for ${label}`" :aria-expanded="menuOpen" :aria-controls="menuId" @click="toggleMenu">
					<svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
				</button>
			</div>
		</div>
		<div v-if="menuOpen" :id="menuId" data-swipe-menu class="flex flex-wrap gap-2 border-t border-border bg-secondary/40 p-3" role="group" :aria-label="`Actions for ${label}`">
			<button v-for="({ action, side }, index) in actions" :key="index" type="button" class="min-h-11 rounded-lg px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40" :class="actionClass(action)" :disabled="action.disabled" @click="selectAction(action, side)">{{ action.label }}</button>
			<button type="button" class="min-h-11 rounded-lg px-4 text-sm text-muted-fg hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring" @click="close(true)">Cancel</button>
		</div>
	</div>
</template>
