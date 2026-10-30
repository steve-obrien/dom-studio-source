<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import DomToastItem from './DomToastItem.vue';

defineOptions({
	__doc: {
		name: 'Toast stack',
		tag: '<DomToastStack>',
		description: 'A polite live-region stack for transient notifications.',
		slots: [
			{ name: 'default', payload: '{ toast, dismiss }', description: 'Custom toast content rendered inside the card. Use this for avatars, actions, or richer markup.' },
		],
		events: [
			{ name: 'dismiss', payload: '(id: string)', description: 'Emitted when a toast is dismissed.' },
			{ name: 'action', payload: '({ id, toast, ...payload })', description: 'Emitted by toast template content, useful for buttons and menus inside a toast.' },
		],
	},
});

const props = defineProps({
	toasts: {
		type: Array,
		default: () => [],
		_edit: {
			component: 'DomJsonListInput',
			description: 'Visible toasts. Set duration to 0 for a toast that requires manual dismissal.',
			props: {
				addLabel: '+ Add toast',
				compact: true,
				schema: [
					{ key: 'id', label: 'ID', placeholder: 'toast-id', default: (index) => `toast-${index + 1}` },
					{ key: 'title', label: 'Title', placeholder: 'Successfully saved' },
					{ key: 'description', label: 'Description', placeholder: 'Your changes have been stored.' },
					{ key: 'tone', label: 'Tone', placeholder: 'default | success | danger | warning', default: 'default' },
					{ key: 'duration', label: 'Duration', type: 'number', default: 3600 },
				],
			},
		},
	},
	position: {
		type: String,
		default: 'top-right',
		_edit: { options: ['top-right', 'top-center', 'top-left', 'bottom-right', 'bottom-center', 'bottom-left'], description: 'Viewport placement.' },
	},
	layout: {
		type: String,
		default: 'stack',
		_edit: { options: ['stack', 'rack'], description: 'Visual layout. Use rack to place the newest toast in front while older toasts recede behind it.' },
	},
	duration: {
		type: Number,
		default: 3600,
		_edit: { description: 'Default auto-dismiss delay in milliseconds. Set to 0 to keep toasts until manually dismissed.' },
	},
	autoDismiss: {
		type: Boolean,
		default: true,
		_edit: { description: 'Automatically emit dismiss after each toast duration.' },
	},
});
const emit = defineEmits(['dismiss', 'action']);
const renderedToasts = ref([]);
const rackExpanded = ref(false);
const rackPointerInside = ref(false);
const rackFocusInside = ref(false);
const isMounted = ref(false);
const timers = new Map();
const motionTimers = new Map();
const rackMotionTimers = new Map();
let rackCollapseTimer;
const isRackLayout = computed(isRackLayoutSelected);
const isBottomPosition = computed(isBottomPlacement);
const displayedToasts = computed(buildDisplayedToasts);

onMounted(registerToastRegion);
watch(getPropToasts, syncTimers, { immediate: true, deep: true });
watch(getPropToasts, syncRendered, { immediate: true, deep: true });
onBeforeUnmount(clearToastTimers);

/**
 * Registers the headless toast region custom element after the client app mounts.
 *
 * @returns {Promise<void>}
 */
async function registerToastRegion() {
	isMounted.value = true;
	await import('../../lib/headless/toast.js');
}

/**
 * Clears any pending auto-dismiss and motion timers owned by this stack.
 *
 * @returns {void}
 */
function clearToastTimers() {
	for (const timer of timers.values()) clearClientTimeout(timer);
	for (const timer of motionTimers.values()) clearClientTimeout(timer);
	for (const timer of rackMotionTimers.values()) clearClientTimeout(timer);
	clearRackCollapseTimer();
	timers.clear();
	motionTimers.clear();
	rackMotionTimers.clear();
}

/**
 * Reads the controlled toast list for watchers without creating inline watch callbacks.
 *
 * @returns {Array}
 */
function getPropToasts() {
	return props.toasts;
}

/**
 * Reports whether the rack visual treatment is currently selected.
 *
 * @returns {boolean}
 */
function isRackLayoutSelected() {
	return props.layout === 'rack';
}

/**
 * Reports whether the current viewport position anchors the toast stack to the bottom edge.
 *
 * @returns {boolean}
 */
function isBottomPlacement() {
	return props.position.startsWith('bottom');
}

/**
 * Builds the render order and rack depth metadata for the current layout.
 *
 * @returns {Array<{toast: object, rackIndex: number, isRackFront: boolean}>}
 */
function buildDisplayedToasts() {
	const toasts = isRackLayout.value ? [...renderedToasts.value].reverse() : renderedToasts.value;
	return toasts.map((toast, index) => ({
		toast,
		rackIndex: isRackLayout.value ? index : 0,
		isRackFront: !isRackLayout.value || index === 0,
	}));
}

/**
 * Emits a dismiss event for a toast id and clears its pending auto-dismiss timer.
 *
 * @param {string} id Toast id to dismiss.
 * @returns {void}
 */
function dismiss(id) {
	clearClientTimeout(timers.get(id));
	timers.delete(id);
	holdRackOpenAfterDismiss();
	emit('dismiss', id);
}

/**
 * Synchronizes auto-dismiss timers with the controlled toast array.
 *
 * Auto-dismiss timers live in the stack so callers only need to update the
 * controlled toast array when dismiss is emitted.
 *
 * @param {Array} toasts Controlled toast records.
 * @returns {void}
 */
function syncTimers(toasts) {
	const ids = new Set(toasts.map((toast) => toast.id));
	for (const [id, timer] of timers) {
		if (!ids.has(id)) {
			clearClientTimeout(timer);
			timers.delete(id);
		}
	}

	if (!props.autoDismiss || typeof window === 'undefined') return;
	for (const toast of toasts) {
		if (!toast.id || timers.has(toast.id)) continue;
		const delay = Number(toast.duration ?? props.duration);
		if (delay <= 0) continue;
		timers.set(toast.id, window.setTimeout(() => dismiss(toast.id), delay));
	}
}

/**
 * Synchronizes animated toast rows with the controlled toast array.
 *
 * Leaving toasts stay in a local render list long enough for opacity and
 * height transitions to finish before removal from the DOM.
 *
 * @param {Array} toasts Controlled toast records.
 * @returns {void}
 */
function syncRendered(toasts) {
	const previousRackFrontId = getRackFrontId();
	const nextIds = new Set(toasts.map((toast) => toast.id));
	const current = new Map(renderedToasts.value.map((toast) => [toast.id, toast]));

	for (const toast of toasts) {
		const existing = current.get(toast.id);
		if (existing) {
			clearClientTimeout(motionTimers.get(toast.id));
			motionTimers.delete(toast.id);
			Object.assign(existing, toast, {
				expanded: true,
				rackMotion: existing.rackMotion,
				motion: existing.motion === 'leaving' ? 'entering' : existing.motion,
			});
			if (existing.motion === 'entering') settleToast(existing);
			continue;
		}

		const shouldAnimate = isMounted.value && typeof window !== 'undefined';
		const next = {
			...toast,
			expanded: true,
			rackMotion: 'idle',
			motion: shouldAnimate ? 'entering' : 'open',
		};
		renderedToasts.value.push(next);
		if (shouldAnimate) settleToast(renderedToasts.value[renderedToasts.value.length - 1]);
	}

	for (const toast of renderedToasts.value) {
		if (nextIds.has(toast.id) || toast.motion === 'leaving') continue;
		toast.motion = 'leaving';
		toast.expanded = false;
		clearClientTimeout(motionTimers.get(toast.id));
		if (typeof window === 'undefined') {
			renderedToasts.value = renderedToasts.value.filter((item) => item.id !== toast.id);
			continue;
		}
		motionTimers.set(toast.id, window.setTimeout(() => {
			renderedToasts.value = renderedToasts.value.filter((item) => item.id !== toast.id);
			motionTimers.delete(toast.id);
		}, 300));
	}
	syncRackRestackMotion(previousRackFrontId);
}

/**
 * Reads the current front toast id for collapsed rack transition bookkeeping.
 *
 * @returns {string|undefined}
 */
function getRackFrontId() {
	if (!isRackLayout.value || !renderedToasts.value.length) return undefined;
	return renderedToasts.value[renderedToasts.value.length - 1]?.id;
}

/**
 * Marks the displaced rack front so it animates into the receded card position.
 *
 * @param {string|undefined} previousRackFrontId Toast id that was front before the render sync.
 * @returns {void}
 */
function syncRackRestackMotion(previousRackFrontId) {
	const nextRackFrontId = getRackFrontId();
	if (!previousRackFrontId || !nextRackFrontId || previousRackFrontId === nextRackFrontId) return;
	if (!isRackLayout.value || rackExpanded.value || typeof window === 'undefined') return;
	const toast = renderedToasts.value.find((item) => item.id === previousRackFrontId);
	if (!toast || toast.motion === 'leaving') return;
	clearClientTimeout(rackMotionTimers.get(toast.id));
	toast.rackMotion = 'receding';
	rackMotionTimers.set(toast.id, window.setTimeout(() => {
		if (toast.rackMotion === 'receding') toast.rackMotion = 'idle';
		rackMotionTimers.delete(toast.id);
	}, 260));
}

/**
 * Moves an entering toast into its open motion state after its entrance settles.
 *
 * @param {object} toast Rendered toast record.
 * @returns {void}
 */
function settleToast(toast) {
	requestClientFrame(() => {
		toast.expanded = true;
		if (typeof window === 'undefined') {
			toast.motion = 'open';
			return;
		}
		motionTimers.set(toast.id, window.setTimeout(() => {
			if (toast.motion === 'entering') toast.motion = 'open';
			motionTimers.delete(toast.id);
		}, 320));
	});
}

/**
 * Clears a browser timeout when code is running on the client.
 *
 * @param {number|undefined} timer Timeout id to clear.
 * @returns {void}
 */
function clearClientTimeout(timer) {
	if (typeof window !== 'undefined') window.clearTimeout(timer);
}

/**
 * Runs a callback on the next animation frame when the browser is available.
 *
 * @param {Function} callback Work to run after layout has a chance to update.
 * @returns {void}
 */
function requestClientFrame(callback) {
	if (typeof window === 'undefined') {
		callback();
		return;
	}
	window.requestAnimationFrame(callback);
}

/**
 * Resolves the semantic accent border class for a toast tone.
 *
 * @param {string} tone Toast tone.
 * @returns {string}
 */
function toneClass(tone) {
	return {
		default: 'border-border',
		success: 'border-success/35',
		danger: 'border-destructive/35',
		warning: 'border-warning/35',
	}[tone] || 'border-border';
}

/**
 * Resolves the component used for a toast record.
 *
 * @param {object} toast Toast record.
 * @returns {object}
 */
function toastComponent(toast) {
	return toast.component || DomToastItem;
}

/**
 * Builds props for the resolved toast component.
 *
 * @param {object} toast Toast record.
 * @returns {object}
 */
function toastProps(toast) {
	if (toast.component) return toast.props || {};
	return {
		title: toast.title,
		description: toast.description,
		tone: toast.tone,
		dismissible: toast.dismissible !== false,
	};
}

/**
 * Builds rack CSS custom properties for a displayed toast.
 *
 * @param {number} rackIndex Visual depth from the front toast.
 * @returns {object|undefined}
 */
function toastShellStyle(rackIndex) {
	if (!isRackLayout.value) return undefined;
	const visibleIndex = Math.min(rackIndex, 3);
	const direction = isBottomPosition.value ? -1 : 1;
	const offset = visibleIndex * direction * 10;
	const collapseOffset = offset < 0 ? `calc(-100% - ${Math.abs(offset)}px)` : `calc(-100% + ${offset}px)`;
	return {
		'--toast-rack-collapse-y': rackIndex === 0 ? '0px' : collapseOffset,
		'--toast-rack-depth-offset': `${offset}px`,
		'--toast-rack-scale': `${Math.max(0.86, 1 - (visibleIndex * 0.045))}`,
		'--toast-rack-opacity': `${rackIndex > 3 ? 0 : Math.max(0.58, 1 - (visibleIndex * 0.16))}`,
		'--toast-rack-z': `${100 - rackIndex}`,
	};
}

/**
 * Reports whether a rack toast should be hidden from interaction while collapsed.
 *
 * @param {boolean} isRackFront Whether the toast is the front rack card.
 * @returns {boolean}
 */
function isCollapsedRackItem(isRackFront) {
	return isRackLayout.value && !rackExpanded.value && !isRackFront;
}

/**
 * Handles pointer entry so the rack can stay expanded while the user works in it.
 *
 * @returns {void}
 */
function handleRackPointerEnter() {
	rackPointerInside.value = true;
	expandRack();
}

/**
 * Handles pointer exit by allowing the rack to settle before collapsing.
 *
 * @returns {void}
 */
function handleRackPointerLeave() {
	rackPointerInside.value = false;
	scheduleRackCollapse();
}

/**
 * Handles focus entry so keyboard users can inspect and dismiss older rack items.
 *
 * @returns {void}
 */
function handleRackFocusIn() {
	rackFocusInside.value = true;
	expandRack();
}

/**
 * Expands the rack so older toasts can be inspected and dismissed.
 *
 * @returns {void}
 */
function expandRack() {
	clearRackCollapseTimer();
	setRackExpanded(true);
}

/**
 * Collapses the rack after keyboard focus leaves the toast region.
 *
 * @param {FocusEvent} event Focusout event from the toast region.
 * @returns {void}
 */
function handleRackFocusOut(event) {
	if (event.currentTarget?.contains(event.relatedTarget)) return;
	rackFocusInside.value = false;
	if (rackPointerInside.value) return;
	scheduleRackCollapse(420);
}

/**
 * Updates the rack expansion state only when rack layout is active.
 *
 * @param {boolean} expanded Whether the rack should be expanded.
 * @returns {void}
 */
function setRackExpanded(expanded) {
	rackExpanded.value = isRackLayout.value ? expanded : false;
}

/**
 * Keeps the rack open briefly after a dismiss action changes focus and layout.
 *
 * @returns {void}
 */
function holdRackOpenAfterDismiss() {
	if (!isRackLayout.value || !rackExpanded.value) return;
	clearRackCollapseTimer();
	scheduleRackCollapse(520);
}

/**
 * Schedules rack collapse after any close or hover-leave motion has time to read cleanly.
 *
 * @param {number} delay Collapse delay in milliseconds.
 * @returns {void}
 */
function scheduleRackCollapse(delay = 180) {
	clearRackCollapseTimer();
	if (!isRackLayout.value) {
		setRackExpanded(false);
		return;
	}
	if (typeof window === 'undefined') {
		setRackExpanded(false);
		return;
	}
	rackCollapseTimer = window.setTimeout(() => {
		rackCollapseTimer = undefined;
		if (rackPointerInside.value || rackFocusInside.value) return;
		setRackExpanded(false);
	}, delay);
}

/**
 * Clears the pending rack-collapse timeout.
 *
 * @returns {void}
 */
function clearRackCollapseTimer() {
	clearClientTimeout(rackCollapseTimer);
	rackCollapseTimer = undefined;
}

/**
 * Handles action payloads emitted by custom toast template components.
 *
 * Template components can emit action payloads for app-specific work, or emit
 * dismiss when they want the stack to remove their own toast.
 *
 * @param {object} toast Toast record that emitted the action.
 * @param {object|string} payload Action payload from the toast content.
 * @returns {void}
 */
function onToastAction(toast, payload) {
	const detail = {
		id: toast.id,
		toast,
		...(payload && typeof payload === 'object' ? payload : { action: payload }),
	};
	if (detail.action === 'dismiss') dismiss(toast.id);
	emit('action', detail);
}
</script>

<template>
	<dom-toast-region
		class="toast-region fixed z-[80] w-[min(92vw,22rem)]"
		:class="[
			{
				'top-4 right-4': position === 'top-right',
				'top-4 left-1/2 -translate-x-1/2': position === 'top-center',
				'top-4 left-4': position === 'top-left',
				'bottom-4 right-4': position === 'bottom-right',
				'bottom-4 left-1/2 -translate-x-1/2': position === 'bottom-center',
				'bottom-4 left-4': position === 'bottom-left',
				'toast-region-bottom': isBottomPosition,
			},
		]"
		@mouseenter="handleRackPointerEnter"
		@mouseleave="handleRackPointerLeave"
		@focusin="handleRackFocusIn"
		@focusout="handleRackFocusOut"
	>
		<div
			class="toast-list"
			:class="{
				'toast-list-stack': !isRackLayout,
				'toast-list-rack': isRackLayout,
				'toast-list-rack-expanded': isRackLayout && rackExpanded,
			}"
		>
			<div
				v-for="{ toast, rackIndex, isRackFront } in displayedToasts"
				:key="toast.id"
				class="toast-shell"
				:class="[
					toast.expanded && 'toast-shell-open',
					toast.motion === 'leaving' && 'toast-leaving',
					toast.rackMotion === 'receding' && 'toast-rack-receding',
				]"
				:style="toastShellStyle(rackIndex)"
				:data-rack-front="isRackFront ? 'true' : undefined"
				:inert="isCollapsedRackItem(isRackFront)"
				:aria-hidden="isCollapsedRackItem(isRackFront) ? 'true' : undefined"
			>
				<div class="toast-shell-clip">
					<div class="toast-shell-inner">
						<div
							:role="toast.tone === 'danger' ? 'alert' : 'status'"
							class="toast-card skin-popover overflow-hidden rounded-2xl p-4"
							:class="[
								toneClass(toast.tone),
								toast.motion === 'entering' && 'toast-entering',
								toast.motion === 'leaving' && 'toast-card-leaving',
							]"
						>
							<slot :toast="toast" :dismiss="dismiss">
								<component
									:is="toastComponent(toast)"
									v-bind="toastProps(toast)"
									@action="onToastAction(toast, $event)"
									@dismiss="dismiss(toast.id)"
								/>
							</slot>
						</div>
					</div>
				</div>
			</div>
		</div>
	</dom-toast-region>
</template>

<style scoped>
.toast-region {
	--toast-enter-y: -12px;
	--toast-leave-y: -8px;
	--toast-rack-enter-y: -18px;
}

.toast-region-bottom {
	--toast-enter-y: 12px;
	--toast-leave-y: 8px;
	--toast-rack-enter-y: 18px;
}

.toast-list {
	display: grid;
}

.toast-list-rack {
	align-items: start;
	isolation: isolate;
}

.toast-shell {
	display: grid;
	grid-template-rows: 0fr;
	padding-bottom: 0;
	position: relative;
	transition:
		grid-template-rows 300ms cubic-bezier(0.22, 1, 0.36, 1),
		padding-bottom 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-list-rack .toast-shell {
	z-index: var(--toast-rack-z, 1);
}

.toast-list-rack .toast-shell-inner {
	opacity: 1;
	transform: translateY(0) scale(1);
	transform-origin: top center;
	transition:
		transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 220ms ease;
}

.toast-region-bottom .toast-list-rack .toast-shell-inner {
	transform-origin: bottom center;
}

.toast-shell-open {
	grid-template-rows: 1fr;
	padding-bottom: 0.5rem;
}

.toast-shell:last-child {
	padding-bottom: 0;
}

.toast-shell-clip {
	min-height: 0;
	overflow: visible;
}

.toast-list-rack:not(.toast-list-rack-expanded) .toast-shell {
	pointer-events: none;
}

.toast-list-rack:not(.toast-list-rack-expanded) .toast-shell-open {
	padding-bottom: 0;
}

.toast-list-rack:not(.toast-list-rack-expanded) .toast-shell:not([data-rack-front='true']) {
	grid-template-rows: 0fr;
}

.toast-list-rack:not(.toast-list-rack-expanded) .toast-rack-receding {
	transition: none;
}

.toast-list-rack:not(.toast-list-rack-expanded) .toast-shell-inner {
	opacity: var(--toast-rack-opacity, 1);
	transform: translateY(var(--toast-rack-collapse-y, 0)) scale(var(--toast-rack-scale, 1));
}

.toast-list-rack:not(.toast-list-rack-expanded) .toast-rack-receding .toast-shell-inner {
	animation: rack-toast-recede 240ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.toast-list-rack:not(.toast-list-rack-expanded) .toast-shell[data-rack-front='true'] {
	pointer-events: auto;
}

.toast-list-rack:not(.toast-list-rack-expanded) .toast-shell:not([data-rack-front='true']) .toast-card {
	box-shadow: var(--shadow-md);
}

.toast-list-rack-expanded .toast-shell {
	pointer-events: auto;
}

.toast-list-rack-expanded .toast-shell-inner {
	opacity: 1;
	transform: translateY(0) scale(1);
}

.toast-entering {
	animation: toast-in 280ms both;
}

.toast-list-rack:not(.toast-list-rack-expanded) .toast-shell[data-rack-front='true'] .toast-entering {
	animation: rack-toast-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.toast-card-leaving {
	animation: toast-out 260ms both;
}

@keyframes toast-in {
	0% {
		opacity: 0;
		transform: translateY(var(--toast-enter-y)) scale(0.965);
	}
	68% {
		opacity: 1;
		transform: translateY(1px) scale(1.012);
	}
	100% {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@keyframes toast-out {
	0% {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
	100% {
		opacity: 0;
		transform: translateY(var(--toast-leave-y)) scale(0.985);
	}
}

@keyframes rack-toast-in {
	0% {
		opacity: 0;
		transform: translateY(var(--toast-rack-enter-y, var(--toast-enter-y))) scale(0.94);
	}
	58% {
		opacity: 1;
		transform: translateY(1px) scale(1.018);
	}
	100% {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@keyframes rack-toast-recede {
	0% {
		opacity: 1;
		transform: translateY(calc(var(--toast-rack-collapse-y, 0px) - var(--toast-rack-depth-offset, 0px))) scale(1);
	}
	100% {
		opacity: var(--toast-rack-opacity, 1);
		transform: translateY(var(--toast-rack-collapse-y, 0px)) scale(var(--toast-rack-scale, 1));
	}
}

@media (prefers-reduced-motion: reduce) {
	.toast-entering,
	.toast-card-leaving,
	.toast-rack-receding .toast-shell-inner {
		animation-duration: 1ms;
	}

	.toast-shell {
		transition-duration: 1ms;
	}

	.toast-list-rack .toast-shell-inner {
		transition-duration: 1ms;
	}
}
</style>
