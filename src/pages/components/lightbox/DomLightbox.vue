<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useId, useSlots, watch } from 'vue';
import DomIconButton from '../icon-button/DomIconButton.vue';

const DEFAULT_DURATION_MS = 420;
const TRANSITION_BUFFER_MS = 80;
const STAGE_HANDOFF_MS = 180;
const FRAME_TIMEOUT_MS = 80;
const VIEWPORT_MARGIN_PX = 24;
const MIN_STAGE_WIDTH_PX = 220;
const MIN_STAGE_HEIGHT_PX = 160;
const DEFAULT_STAGE_WIDTH_PX = 960;
const DEFAULT_ASPECT_RATIO = 16 / 10;
const STAGE_VERTICAL_CHROME_PX = 176;
const CLOSE_ICON = 'M6 6l12 12M18 6L6 18';
const PREVIOUS_ICON = 'M15 18l-6-6l6-6';
const NEXT_ICON = 'M9 6l6 6l-6 6';

const DEFAULT_RECTS = {
	from: createMotionRect(0, 0, 1, 1),
	to: createMotionRect(0, 0, 1, 1),
};

/**
 * @typedef {{ left: number, top: number, width: number, height: number }} LightboxMotionRect
 */

defineOptions({
	__doc: {
		name: 'Lightbox',
		tag: '<DomLightbox>',
		description: 'A gallery overlay that opens from a thumbnail into a stable preview stage, then flies back to the origin on close.',
		slots: [
			{ name: '(default)', payload: '{ item, index, close, next, previous, goTo, phase }', description: 'Optional custom stage content. Omit for the built-in image preview.' },
			{ name: 'caption', payload: '{ item, index }', description: 'Optional caption content below the stage.' },
			{ name: 'thumbnail', payload: '{ item, index, active }', description: 'Optional thumbnail strip rendering.' },
		],
		events: [
			{ name: 'update:modelValue', payload: '(open: boolean)', description: 'Emitted when the lightbox requests an open-state change.' },
			{ name: 'update:index', payload: '(index: number)', description: 'Emitted when navigation changes the active item.' },
			{ name: 'close', description: 'Emitted when the close transition begins.' },
			{ name: 'after-enter', description: 'Emitted when the thumbnail-to-stage transition completes.' },
			{ name: 'after-leave', description: 'Emitted when the fly-back transition completes and retained data is released.' },
			{ name: 'navigate', payload: '({ index, item, direction })', description: 'Emitted after arrow or thumbnail navigation.' },
		],
		keyboard: [
			{ keys: 'Esc', action: 'Closes the lightbox.' },
			{ keys: 'Left / Right', action: 'Moves between gallery items.' },
			{ keys: 'Click backdrop', action: 'Closes the lightbox when closeOnBackdrop is true.' },
		],
	},
});

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false,
		_edit: { description: 'Whether the lightbox overlay is open.' },
	},
	items: {
		type: Array,
		default: () => [],
		_edit: { description: 'Gallery items. Image items usually provide src, thumbnail, alt, title, width, and height.' },
	},
	index: {
		type: Number,
		default: 0,
		_edit: { description: 'Active gallery item index.' },
	},
	origin: {
		type: [Object, String, Function],
		default: null,
		_edit: { description: 'Element, Vue ref, selector, DOMRect, or resolver used as the thumbnail origin.' },
	},
	label: {
		type: String,
		default: 'Image preview',
		_edit: { description: 'Accessible label for the overlay.' },
	},
	showThumbnails: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show a thumbnail navigation strip when multiple items are available.' },
	},
	loop: {
		type: Boolean,
		default: true,
		_edit: { description: 'Wrap previous/next navigation at the ends of the gallery.' },
	},
	closeOnBackdrop: {
		type: Boolean,
		default: true,
		_edit: { description: 'Close when the dimmed backdrop is clicked.' },
	},
	duration: {
		type: Number,
		default: 420,
		_edit: { description: 'Thumbnail flyout transition duration in milliseconds.' },
	},
});
const emit = defineEmits(['update:modelValue', 'update:index', 'close', 'after-enter', 'after-leave', 'navigate']);
const slots = useSlots();

const root = ref(null);
const rendered = ref(false);
const phase = ref('idle');
const stageVisible = ref(false);
const ghostVisible = ref(false);
const retainedItems = shallowRef([]);
const retainedIndex = ref(0);
const lastOriginRect = ref(null);
const motionRects = ref(DEFAULT_RECTS);
const closeEmitted = ref(false);
let motionRun = 0;
let phaseTimer = null;
let previousActiveElement = null;
let restoreBodyOverflow = '';
let restoreBodyPaddingRight = '';

const uniqueId = useId();
const captionId = computed(getCaptionId);
const activeItems = computed(getActiveItems);
const activeIndex = computed(getActiveIndex);
const activeItem = computed(getActiveItem);
const hasItems = computed(getHasItems);
const hasMultipleItems = computed(getHasMultipleItems);
const activeSrc = computed(getActiveSrc);
const activeThumbnail = computed(getActiveThumbnail);
const activeAlt = computed(getActiveAlt);
const activeTitle = computed(getActiveTitle);
const activeDescription = computed(getActiveDescription);
const shouldShowCaption = computed(getShouldShowCaption);
const shouldShowThumbnails = computed(getShouldShowThumbnails);
const lightboxStyle = computed(getLightboxStyle);
const slotState = computed(getSlotState);

watch(readModelValue, syncModelValue);
watch(readIndex, syncIndex);
watch(readItems, syncItems, { deep: true });

onMounted(handleMounted);
onBeforeUnmount(handleBeforeUnmount);

/**
 * Synchronize initial controlled state once the component reaches the browser.
 *
 * @returns {void}
 */
function handleMounted() {
	if (props.modelValue) openLightbox();
}

/**
 * Release timers, listeners, and scroll locks before the component is removed.
 *
 * @returns {void}
 */
function handleBeforeUnmount() {
	clearPhaseTimer();
	removeGlobalListeners();
	unlockBodyScroll();
}

/**
 * Read the controlled open state for the model watcher.
 *
 * @returns {boolean} Current open state.
 */
function readModelValue() {
	return props.modelValue;
}

/**
 * Read the controlled active index for the index watcher.
 *
 * @returns {number} Current active index.
 */
function readIndex() {
	return props.index;
}

/**
 * Read the item collection for the item watcher.
 *
 * @returns {Array<unknown>} Current item collection.
 */
function readItems() {
	return props.items;
}

/**
 * Apply controlled model changes to the lightbox lifecycle.
 *
 * @param {boolean} open Whether the lightbox should be open.
 * @returns {void}
 */
function syncModelValue(open) {
	if (open) openLightbox();
	else closeLightbox('model');
}

/**
 * Keep the retained index aligned while the overlay is visible.
 *
 * @param {number} index Next controlled index.
 * @returns {void}
 */
function syncIndex(index) {
	if (!rendered.value) return;
	retainedIndex.value = normalizeIndex(index, activeItems.value.length);
	updateTargetGeometry();
}

/**
 * Refresh retained gallery items while the lightbox is not leaving.
 *
 * @returns {void}
 */
function syncItems() {
	if (!rendered.value || isClosingPhase()) return;
	retainLiveItems();
	updateTargetGeometry();
}

/**
 * Build the generated caption id when caption content exists.
 *
 * @returns {string} Caption element id or an empty string.
 */
function getCaptionId() {
	return shouldShowCaption.value ? `dom-lightbox-${uniqueId}-caption` : '';
}

/**
 * Return the live or retained item collection.
 *
 * @returns {Array<unknown>} Items available to the overlay.
 */
function getActiveItems() {
	return rendered.value ? retainedItems.value : normalizedItems();
}

/**
 * Return the live or retained active index.
 *
 * @returns {number} Active item index.
 */
function getActiveIndex() {
	return rendered.value ? retainedIndex.value : normalizeIndex(props.index, normalizedItems().length);
}

/**
 * Return the active item record.
 *
 * @returns {unknown|null} Current gallery item.
 */
function getActiveItem() {
	return activeItems.value[activeIndex.value] || null;
}

/**
 * Check whether there is at least one lightbox item.
 *
 * @returns {boolean} Whether an item is available.
 */
function getHasItems() {
	return activeItems.value.length > 0;
}

/**
 * Check whether navigation controls should be available.
 *
 * @returns {boolean} Whether more than one item exists.
 */
function getHasMultipleItems() {
	return activeItems.value.length > 1;
}

/**
 * Resolve the active item image source.
 *
 * @returns {string} Image source.
 */
function getActiveSrc() {
	return imageSource(activeItem.value);
}

/**
 * Resolve the active item thumbnail source.
 *
 * @returns {string} Thumbnail image source.
 */
function getActiveThumbnail() {
	return thumbnailSource(activeItem.value);
}

/**
 * Resolve the active item alt text.
 *
 * @returns {string} Image alt text.
 */
function getActiveAlt() {
	return stringField(activeItem.value, 'alt') || stringField(activeItem.value, 'title') || '';
}

/**
 * Resolve the active item title.
 *
 * @returns {string} Item title.
 */
function getActiveTitle() {
	return stringField(activeItem.value, 'title');
}

/**
 * Resolve the active item description.
 *
 * @returns {string} Item description.
 */
function getActiveDescription() {
	return stringField(activeItem.value, 'description');
}

/**
 * Check whether caption content should render.
 *
 * @returns {boolean} Whether the caption region should show.
 */
function getShouldShowCaption() {
	return Boolean(slots.caption || activeTitle.value || activeDescription.value);
}

/**
 * Check whether the thumbnail strip should render.
 *
 * @returns {boolean} Whether the thumbnail strip should show.
 */
function getShouldShowThumbnails() {
	return Boolean(props.showThumbnails && hasMultipleItems.value);
}

/**
 * Build overlay-level CSS variables for the active motion run.
 *
 * @returns {Record<string, string>} CSS custom properties.
 */
function getLightboxStyle() {
	const from = motionRects.value.from;
	const to = motionRects.value.to;

	return {
		'--dom-lightbox-duration': `${transitionDuration()}ms`,
		'--dom-lightbox-from-left': `${from.left}px`,
		'--dom-lightbox-from-top': `${from.top}px`,
		'--dom-lightbox-from-width': `${from.width}px`,
		'--dom-lightbox-from-height': `${from.height}px`,
		'--dom-lightbox-to-left': `${to.left}px`,
		'--dom-lightbox-to-top': `${to.top}px`,
		'--dom-lightbox-to-width': `${to.width}px`,
		'--dom-lightbox-to-height': `${to.height}px`,
	};
}

/**
 * Build slot helpers for custom stage, caption, and thumbnail content.
 *
 * @returns {Record<string, unknown>} Slot state.
 */
function getSlotState() {
	return {
		item: activeItem.value,
		index: activeIndex.value,
		phase: phase.value,
		close: closeFromSlot,
		next: goToNext,
		previous: goToPrevious,
		goTo: goToIndex,
	};
}

/**
 * Start the thumbnail-to-stage lightbox transition.
 *
 * @returns {Promise<void>}
 */
async function openLightbox() {
	const run = ++motionRun;
	clearPhaseTimer();
	retainLiveItems();
	if (!hasItems.value) return;

	closeEmitted.value = false;
	rendered.value = true;
	stageVisible.value = false;
	ghostVisible.value = true;
	phase.value = 'enter-from';
	previousActiveElement = activeElement();

	await nextTick();
	if (!isCurrentRun(run)) return;

	lockBodyScroll();
	addGlobalListeners();
	measureMotionRects();
	focusRoot();

	await waitForPaint();
	if (!isCurrentRun(run)) return;

	phase.value = 'opening';
	phaseTimer = window.setTimeout(handleEnterTimer, transitionDuration() + TRANSITION_BUFFER_MS);

	/**
	 * Complete the enter transition scheduled for this motion run.
	 *
	 * @returns {void}
	 */
	function handleEnterTimer() {
		void finishEnter(run);
	}
}

/**
 * Start the handoff from the moving thumbnail clone to the stable stage.
 *
 * @param {number} run Motion sequence id.
 * @returns {Promise<void>}
 */
async function finishEnter(run) {
	if (!isCurrentRun(run)) return;
	clearPhaseTimer();
	stageVisible.value = true;
	await nextTick();
	await waitForPaint();
	if (!isCurrentRun(run)) return;

	phaseTimer = window.setTimeout(handleStageHandoffTimer, stageHandoffDuration());

	/**
	 * Complete the stage handoff scheduled for this motion run.
	 *
	 * @returns {void}
	 */
	function handleStageHandoffTimer() {
		void finishEnterHandoff(run);
	}
}

/**
 * Remove the moving clone after the stable image has painted underneath it.
 *
 * @param {number} run Motion sequence id.
 * @returns {Promise<void>}
 */
async function finishEnterHandoff(run) {
	if (!isCurrentRun(run)) return;
	clearPhaseTimer();
	ghostVisible.value = false;
	phase.value = 'open';
	await nextTick();
	if (!isCurrentRun(run)) return;
	emit('after-enter');
}

/**
 * Request a user-driven close from slotted content.
 *
 * @returns {void}
 */
function closeFromSlot() {
	requestClose('slot');
}

/**
 * Request a controlled close and notify the parent model.
 *
 * @param {string} reason Close interaction source.
 * @returns {void}
 */
function requestClose(reason = 'user') {
	emit('update:modelValue', false);
	closeLightbox(reason);
}

/**
 * Start the stage-to-thumbnail close transition.
 *
 * @param {string} reason Close interaction source.
 * @returns {Promise<void>}
 */
async function closeLightbox(reason = 'model') {
	if (!rendered.value || isClosingPhase()) return;

	const run = ++motionRun;
	clearPhaseTimer();
	void reason;
	retainLiveItems();
	measureMotionRects();
	ghostVisible.value = true;
	stageVisible.value = false;
	phase.value = 'closing-from';
	emitCloseOnce();

	await nextTick();
	await waitForPaint();
	if (!isCurrentRun(run)) return;

	phase.value = 'closing';
	phaseTimer = window.setTimeout(handleLeaveTimer, transitionDuration() + TRANSITION_BUFFER_MS);

	/**
	 * Complete the leave transition scheduled for this motion run.
	 *
	 * @returns {void}
	 */
	function handleLeaveTimer() {
		void finishLeave(run);
	}
}

/**
 * Complete the close transition and release retained content.
 *
 * @param {number} run Motion sequence id.
 * @returns {Promise<void>}
 */
async function finishLeave(run) {
	if (!isCurrentRun(run)) return;
	clearPhaseTimer();
	rendered.value = false;
	stageVisible.value = false;
	ghostVisible.value = false;
	phase.value = 'idle';
	retainedItems.value = [];
	removeGlobalListeners();
	unlockBodyScroll();
	restoreFocus();
	await nextTick();
	if (!isCurrentRun(run)) return;
	emit('after-leave');
}

/**
 * Emit the close event once per visible lightbox cycle.
 *
 * @returns {void}
 */
function emitCloseOnce() {
	if (closeEmitted.value) return;
	closeEmitted.value = true;
	emit('close');
}

/**
 * Move to the previous gallery item.
 *
 * @returns {void}
 */
function goToPrevious() {
	goToIndex(activeIndex.value - 1, 'previous');
}

/**
 * Move to the next gallery item.
 *
 * @returns {void}
 */
function goToNext() {
	goToIndex(activeIndex.value + 1, 'next');
}

/**
 * Navigate to a specific gallery item.
 *
 * @param {number} nextIndex Requested item index.
 * @param {string} direction Navigation direction.
 * @returns {void}
 */
function goToIndex(nextIndex, direction = 'select') {
	const normalized = normalizeNavigationIndex(nextIndex, activeItems.value.length);
	if (normalized === activeIndex.value || normalized < 0) return;
	retainedIndex.value = normalized;
	emit('update:index', normalized);
	emit('navigate', {
		index: normalized,
		item: activeItems.value[normalized] || null,
		direction,
	});
	updateTargetGeometry();
}

/**
 * Handle backdrop clicks.
 *
 * @returns {void}
 */
function onBackdropClick() {
	if (!props.closeOnBackdrop) return;
	requestClose('backdrop');
}

/**
 * Handle key presses while focus is inside the overlay.
 *
 * @param {KeyboardEvent} event Keyboard event.
 * @returns {void}
 */
function onRootKeydown(event) {
	event.stopPropagation();
	handleLightboxKeydown(event);
}

/**
 * Handle key presses registered on the window while the overlay is open.
 *
 * @param {KeyboardEvent} event Keyboard event.
 * @returns {void}
 */
function onWindowKeydown(event) {
	handleLightboxKeydown(event);
}

/**
 * Apply keyboard shortcuts for close and gallery navigation.
 *
 * @param {KeyboardEvent} event Keyboard event.
 * @returns {void}
 */
function handleLightboxKeydown(event) {
	if (!rendered.value) return;
	if (event.key === 'Escape') {
		event.preventDefault();
		requestClose('escape');
		return;
	}
	if (event.key === 'ArrowLeft') {
		event.preventDefault();
		goToPrevious();
		return;
	}
	if (event.key === 'ArrowRight') {
		event.preventDefault();
		goToNext();
	}
}

/**
 * Update viewport geometry when the window size changes.
 *
 * @returns {void}
 */
function onWindowResize() {
	updateTargetGeometry();
}

/**
 * Add global listeners used while the lightbox is visible.
 *
 * @returns {void}
 */
function addGlobalListeners() {
	if (typeof window === 'undefined') return;
	removeGlobalListeners();
	window.addEventListener('keydown', onWindowKeydown);
	window.addEventListener('resize', onWindowResize);
}

/**
 * Remove global listeners used while the lightbox is visible.
 *
 * @returns {void}
 */
function removeGlobalListeners() {
	if (typeof window === 'undefined') return;
	window.removeEventListener('keydown', onWindowKeydown);
	window.removeEventListener('resize', onWindowResize);
}

/**
 * Retain the current items and index so parent resets do not break close motion.
 *
 * @returns {void}
 */
function retainLiveItems() {
	const items = normalizedItems();
	retainedItems.value = items.slice();
	retainedIndex.value = normalizeIndex(props.index, items.length);
}

/**
 * Normalize the incoming item prop.
 *
 * @returns {Array<unknown>} Safe item list.
 */
function normalizedItems() {
	return Array.isArray(props.items) ? props.items : [];
}

/**
 * Normalize an index against a gallery length.
 *
 * @param {number} index Requested index.
 * @param {number} length Gallery length.
 * @returns {number} Safe index.
 */
function normalizeIndex(index, length) {
	if (length <= 0) return 0;
	const numeric = Number(index);
	if (!Number.isFinite(numeric)) return 0;
	return Math.min(length - 1, Math.max(0, Math.trunc(numeric)));
}

/**
 * Normalize navigation with optional looping.
 *
 * @param {number} index Requested index.
 * @param {number} length Gallery length.
 * @returns {number} Safe index, or -1 when navigation should not move.
 */
function normalizeNavigationIndex(index, length) {
	if (length <= 0) return -1;
	if (props.loop) return (Math.trunc(index) + length) % length;
	if (index < 0 || index >= length) return -1;
	return Math.trunc(index);
}

/**
 * Measure the current origin and viewport target rectangles.
 *
 * @returns {void}
 */
function measureMotionRects() {
	const to = targetRectForItem(activeItem.value);
	const from = resolveOriginRect(props.origin) || lastOriginRect.value || centeredFallbackOrigin(to);
	lastOriginRect.value = from;
	motionRects.value = { from, to };
}

/**
 * Update only the target stage geometry after resize or navigation.
 *
 * @returns {void}
 */
function updateTargetGeometry() {
	if (!rendered.value || typeof window === 'undefined') return;
	const to = targetRectForItem(activeItem.value);
	motionRects.value = {
		from: motionRects.value.from,
		to,
	};
}

/**
 * Resolve any supported origin prop into a viewport rectangle.
 *
 * @param {unknown} value Origin prop value.
 * @returns {LightboxMotionRect|null} Origin rectangle.
 */
function resolveOriginRect(value) {
	const resolved = unwrapOriginValue(value);
	if (!resolved || typeof window === 'undefined') return null;
	if (typeof resolved === 'string') return normalizeMotionRect(document.querySelector(resolved)?.getBoundingClientRect());
	if (isElementLike(resolved)) return normalizeMotionRect(resolved.getBoundingClientRect());
	if (isRectLike(resolved)) return normalizeMotionRect(resolved);
	return null;
}

/**
 * Resolve functions and Vue refs before measuring an origin.
 *
 * @param {unknown} value Origin prop value.
 * @returns {unknown} Resolved origin value.
 */
function unwrapOriginValue(value) {
	if (typeof value === 'function') return unwrapOriginValue(value(originContext()));
	if (value && typeof value === 'object' && 'value' in value) return unwrapOriginValue(value.value);
	return value;
}

/**
 * Build the current origin resolver context.
 *
 * @returns {{ item: unknown|null, index: number }} Origin resolver context.
 */
function originContext() {
	return {
		item: activeItem.value,
		index: activeIndex.value,
	};
}

/**
 * Check whether a value behaves like a DOM element for measurement.
 *
 * @param {unknown} value Candidate value.
 * @returns {value is Element} Whether the value is an element.
 */
function isElementLike(value) {
	return Boolean(value && typeof value === 'object' && typeof value.getBoundingClientRect === 'function');
}

/**
 * Check whether a value contains rectangle geometry.
 *
 * @param {unknown} value Candidate value.
 * @returns {boolean} Whether the value is rect-like.
 */
function isRectLike(value) {
	return Boolean(
		value
		&& typeof value === 'object'
		&& Number.isFinite(value.left)
		&& Number.isFinite(value.top)
		&& Number.isFinite(value.width)
		&& Number.isFinite(value.height),
	);
}

/**
 * Normalize a measured rectangle into motion-safe geometry.
 *
 * @param {unknown} rect Candidate rectangle.
 * @returns {LightboxMotionRect|null} Motion rectangle.
 */
function normalizeMotionRect(rect) {
	if (!isRectLike(rect)) return null;
	return createMotionRect(rect.left, rect.top, rect.width, rect.height);
}

/**
 * Build a small centered origin when no source thumbnail is available.
 *
 * @param {LightboxMotionRect} target Target stage rectangle.
 * @returns {LightboxMotionRect} Fallback origin.
 */
function centeredFallbackOrigin(target) {
	return createMotionRect(
		target.left + target.width / 2 - 1,
		target.top + target.height / 2 - 1,
		2,
		2,
	);
}

/**
 * Calculate the viewport stage rectangle for an item.
 *
 * @param {unknown} item Active item.
 * @returns {LightboxMotionRect} Target stage rectangle.
 */
function targetRectForItem(item) {
	if (typeof window === 'undefined') return createMotionRect(0, 0, DEFAULT_STAGE_WIDTH_PX, DEFAULT_STAGE_WIDTH_PX / DEFAULT_ASPECT_RATIO);

	const viewportWidth = Math.max(MIN_STAGE_WIDTH_PX, window.innerWidth || DEFAULT_STAGE_WIDTH_PX);
	const viewportHeight = Math.max(MIN_STAGE_HEIGHT_PX, window.innerHeight || DEFAULT_STAGE_WIDTH_PX / DEFAULT_ASPECT_RATIO);
	const maxWidth = Math.max(MIN_STAGE_WIDTH_PX, viewportWidth - VIEWPORT_MARGIN_PX * 2);
	const reservedChrome = chromeHeight();
	const maxHeight = Math.max(MIN_STAGE_HEIGHT_PX, viewportHeight - VIEWPORT_MARGIN_PX * 2 - reservedChrome);
	const ratio = aspectRatioForItem(item);
	let width = Math.min(maxWidth, DEFAULT_STAGE_WIDTH_PX);
	let height = width / ratio;

	if (height > maxHeight) {
		height = maxHeight;
		width = height * ratio;
	}

	return createMotionRect(
		Math.max(VIEWPORT_MARGIN_PX, (viewportWidth - width) / 2),
		Math.max(VIEWPORT_MARGIN_PX + 52, (viewportHeight - height) / 2 - (shouldShowThumbnails.value ? 28 : 0)),
		width,
		height,
	);
}

/**
 * Resolve the amount of vertical UI chrome to reserve around the stage.
 *
 * @returns {number} Vertical chrome height in pixels.
 */
function chromeHeight() {
	let height = 104;
	if (shouldShowCaption.value) height += 44;
	if (shouldShowThumbnails.value) height += 72;
	return Math.min(STAGE_VERTICAL_CHROME_PX, height);
}

/**
 * Resolve an item aspect ratio.
 *
 * @param {unknown} item Gallery item.
 * @returns {number} Positive aspect ratio.
 */
function aspectRatioForItem(item) {
	const explicit = numberField(item, 'aspectRatio');
	if (explicit && explicit > 0) return explicit;
	const width = numberField(item, 'width');
	const height = numberField(item, 'height');
	if (width && height && width > 0 && height > 0) return width / height;
	return DEFAULT_ASPECT_RATIO;
}

/**
 * Create a motion rectangle with positive dimensions.
 *
 * @param {number} left Left coordinate.
 * @param {number} top Top coordinate.
 * @param {number} width Rectangle width.
 * @param {number} height Rectangle height.
 * @returns {LightboxMotionRect} Motion rectangle.
 */
function createMotionRect(left, top, width, height) {
	return {
		left,
		top,
		width: Math.max(1, width),
		height: Math.max(1, height),
	};
}

/**
 * Resolve an image source from a gallery item.
 *
 * @param {unknown} item Gallery item.
 * @returns {string} Image source.
 */
function imageSource(item) {
	return stringField(item, 'src') || stringField(item, 'href') || '';
}

/**
 * Resolve a thumbnail source from a gallery item.
 *
 * @param {unknown} item Gallery item.
 * @returns {string} Thumbnail source.
 */
function thumbnailSource(item) {
	return stringField(item, 'thumbnail') || imageSource(item);
}

/**
 * Resolve a stable key for a gallery item.
 *
 * @param {unknown} item Gallery item.
 * @param {number} index Item index.
 * @returns {string|number} Stable key.
 */
function itemKey(item, index) {
	return stringField(item, 'id') || imageSource(item) || index;
}

/**
 * Resolve a string field from an item.
 *
 * @param {unknown} item Gallery item.
 * @param {string} key Field key.
 * @returns {string} Field value.
 */
function stringField(item, key) {
	if (!item || typeof item !== 'object') return '';
	const value = item[key];
	return typeof value === 'string' ? value : '';
}

/**
 * Resolve a number field from an item.
 *
 * @param {unknown} item Gallery item.
 * @param {string} key Field key.
 * @returns {number} Field value.
 */
function numberField(item, key) {
	if (!item || typeof item !== 'object') return 0;
	const value = item[key];
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

/**
 * Lock body scroll while the fixed overlay is visible.
 *
 * @returns {void}
 */
function lockBodyScroll() {
	if (typeof document === 'undefined' || restoreBodyOverflow) return;
	const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
	restoreBodyOverflow = document.body.style.overflow || ' ';
	restoreBodyPaddingRight = document.body.style.paddingRight || ' ';
	document.body.style.overflow = 'hidden';
	if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
}

/**
 * Restore body scroll styles after the overlay closes.
 *
 * @returns {void}
 */
function unlockBodyScroll() {
	if (typeof document === 'undefined' || !restoreBodyOverflow) return;
	document.body.style.overflow = restoreBodyOverflow === ' ' ? '' : restoreBodyOverflow;
	document.body.style.paddingRight = restoreBodyPaddingRight === ' ' ? '' : restoreBodyPaddingRight;
	restoreBodyOverflow = '';
	restoreBodyPaddingRight = '';
}

/**
 * Return the currently focused element.
 *
 * @returns {Element|null} Active element.
 */
function activeElement() {
	if (typeof document === 'undefined') return null;
	return document.activeElement;
}

/**
 * Move focus into the overlay root.
 *
 * @returns {void}
 */
function focusRoot() {
	root.value?.focus?.({ preventScroll: true });
}

/**
 * Restore focus to the element active before opening.
 *
 * @returns {void}
 */
function restoreFocus() {
	if (!previousActiveElement || typeof previousActiveElement.focus !== 'function') return;
	try {
		previousActiveElement.focus({ preventScroll: true });
	} catch {
		previousActiveElement.focus();
	}
	previousActiveElement = null;
}

/**
 * Wait until the browser has committed two paints.
 *
 * @returns {Promise<void>} Paint completion promise.
 */
async function waitForPaint() {
	await nextAnimationFrame();
	await nextAnimationFrame();
}

/**
 * Wait for the next animation frame, with a timeout fallback.
 *
 * @returns {Promise<void>} Animation frame promise.
 */
function nextAnimationFrame() {
	if (typeof window === 'undefined') return Promise.resolve();
	return new Promise(resolveNextAnimationFrame);
}

/**
 * Resolve a promise on the next animation frame.
 *
 * @param {() => void} resolve Promise resolver.
 * @returns {void}
 */
function resolveNextAnimationFrame(resolve) {
	let settled = false;
	let timeoutId = 0;
	const frameId = window.requestAnimationFrame(finishFrame);
	timeoutId = window.setTimeout(cancelFrame, FRAME_TIMEOUT_MS);

	/**
	 * Finish the animation-frame promise once.
	 *
	 * @returns {void}
	 */
	function finishFrame() {
		if (settled) return;
		settled = true;
		window.clearTimeout(timeoutId);
		resolve();
	}

	/**
	 * Cancel the pending animation frame if the timeout wins.
	 *
	 * @returns {void}
	 */
	function cancelFrame() {
		window.cancelAnimationFrame?.(frameId);
		finishFrame();
	}
}

/**
 * Resolve the effective transition duration.
 *
 * @returns {number} Duration in milliseconds.
 */
function transitionDuration() {
	if (prefersReducedMotion()) return 80;
	const duration = Number(props.duration);
	if (!Number.isFinite(duration)) return DEFAULT_DURATION_MS;
	return Math.max(0, duration);
}

/**
 * Resolve the clone-to-stage handoff delay.
 *
 * @returns {number} Handoff duration in milliseconds.
 */
function stageHandoffDuration() {
	return prefersReducedMotion() ? 0 : STAGE_HANDOFF_MS;
}

/**
 * Check the user's reduced-motion preference.
 *
 * @returns {boolean} Whether reduced motion is preferred.
 */
function prefersReducedMotion() {
	return Boolean(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

/**
 * Clear any scheduled phase timer.
 *
 * @returns {void}
 */
function clearPhaseTimer() {
	if (!phaseTimer || typeof window === 'undefined') return;
	window.clearTimeout(phaseTimer);
	phaseTimer = null;
}

/**
 * Check whether the current phase is a leave phase.
 *
 * @returns {boolean} Whether the overlay is closing.
 */
function isClosingPhase() {
	return phase.value === 'closing-from' || phase.value === 'closing';
}

/**
 * Check whether an async motion step belongs to the latest run.
 *
 * @param {number} run Motion sequence id.
 * @returns {boolean} Whether the run is current.
 */
function isCurrentRun(run) {
	return run === motionRun;
}

defineExpose({
	open: openLightbox,
	close: requestClose,
	next: goToNext,
	previous: goToPrevious,
	goTo: goToIndex,
});
</script>

<template>
	<Teleport to="body">
		<div
			v-if="rendered"
			ref="root"
			class="dom-lightbox"
			:data-phase="phase"
			:style="lightboxStyle"
			role="dialog"
			aria-modal="true"
			:aria-label="label"
			:aria-describedby="captionId || null"
			tabindex="-1"
			@keydown="onRootKeydown"
		>
			<div class="dom-lightbox__backdrop" @click="onBackdropClick"></div>

			<header class="dom-lightbox__topbar">
				<p class="dom-lightbox__counter">{{ activeIndex + 1 }} / {{ activeItems.length }}</p>
				<DomIconButton class="dom-lightbox__close" label="Close lightbox" variant="secondary" size="md" :icon="CLOSE_ICON" @click="requestClose('close-button')" />
			</header>

			<main class="dom-lightbox__stage" aria-live="polite">
				<DomIconButton
					v-if="hasMultipleItems"
					class="dom-lightbox__nav dom-lightbox__nav--previous"
					label="Previous item"
					variant="secondary"
					size="lg"
					:icon="PREVIOUS_ICON"
					@click="goToPrevious"
				/>

				<div class="dom-lightbox__stage-frame">
					<div class="dom-lightbox__stage-content" :data-visible="stageVisible ? 'true' : 'false'">
						<slot v-bind="slotState">
							<img
								v-if="activeSrc"
								:key="activeSrc"
								class="dom-lightbox__image"
								:src="activeSrc"
								:alt="activeAlt"
								draggable="false"
							/>
						</slot>
					</div>
				</div>

				<DomIconButton
					v-if="hasMultipleItems"
					class="dom-lightbox__nav dom-lightbox__nav--next"
					label="Next item"
					variant="secondary"
					size="lg"
					:icon="NEXT_ICON"
					@click="goToNext"
				/>
			</main>

			<footer v-if="shouldShowCaption" :id="captionId" class="dom-lightbox__caption">
				<slot name="caption" :item="activeItem" :index="activeIndex">
					<p v-if="activeTitle" class="dom-lightbox__caption-title">{{ activeTitle }}</p>
					<p v-if="activeDescription" class="dom-lightbox__caption-description">{{ activeDescription }}</p>
				</slot>
			</footer>

			<nav v-if="shouldShowThumbnails" class="dom-lightbox__thumbs" aria-label="Gallery thumbnails">
				<button
					v-for="(item, itemIndex) in activeItems"
					:key="itemKey(item, itemIndex)"
					type="button"
					class="dom-lightbox__thumb"
					:data-active="itemIndex === activeIndex ? 'true' : 'false'"
					:aria-current="itemIndex === activeIndex ? 'true' : null"
					:aria-label="`Show item ${itemIndex + 1}`"
					@click="goToIndex(itemIndex)"
				>
					<slot name="thumbnail" :item="item" :index="itemIndex" :active="itemIndex === activeIndex">
						<img
							v-if="thumbnailSource(item)"
							:src="thumbnailSource(item)"
							:alt="stringField(item, 'alt') || ''"
							draggable="false"
						/>
					</slot>
				</button>
			</nav>

			<img
				v-if="ghostVisible && activeThumbnail"
				class="dom-lightbox__ghost"
				:src="activeThumbnail"
				alt=""
				aria-hidden="true"
				draggable="false"
			/>
			<div v-else-if="ghostVisible" class="dom-lightbox__ghost dom-lightbox__ghost--fallback" aria-hidden="true"></div>
		</div>
	</Teleport>
</template>

<style>
.dom-lightbox {
	position: fixed;
	inset: 0;
	z-index: 999;
	color: white;
	outline: none;
	pointer-events: auto;
}

.dom-lightbox__backdrop {
	position: absolute;
	inset: 0;
	background: rgb(0 0 0 / 0.88);
	opacity: 0;
	transition: opacity var(--dom-lightbox-duration, 420ms) ease;
}

.dom-lightbox[data-phase="opening"] .dom-lightbox__backdrop,
.dom-lightbox[data-phase="open"] .dom-lightbox__backdrop,
.dom-lightbox[data-phase="closing-from"] .dom-lightbox__backdrop {
	opacity: 1;
}

.dom-lightbox[data-phase="closing"] .dom-lightbox__backdrop {
	opacity: 0;
}

.dom-lightbox__topbar {
	position: fixed;
	z-index: 4;
	top: 0;
	left: 0;
	right: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: max(0.75rem, env(safe-area-inset-top)) 1rem 0.75rem;
	opacity: 0;
	transform: translateY(-0.5rem);
	transition:
		opacity 160ms ease,
		transform 180ms ease;
}

.dom-lightbox[data-phase="open"] .dom-lightbox__topbar,
.dom-lightbox[data-phase="closing-from"] .dom-lightbox__topbar {
	opacity: 1;
	transform: none;
}

.dom-lightbox__counter {
	border-radius: 999px;
	background: rgb(255 255 255 / 0.12);
	padding: 0.45rem 0.7rem;
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0;
	color: rgb(255 255 255 / 0.86);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
}

.dom-lightbox__close {
	color: white;
	background: rgb(255 255 255 / 0.13);
	backdrop-filter: blur(14px);
	-webkit-backdrop-filter: blur(14px);
}

.dom-lightbox__stage {
	position: fixed;
	z-index: 2;
	inset: 0;
	display: grid;
	grid-template-columns: minmax(3rem, 1fr) auto minmax(3rem, 1fr);
	align-items: center;
	justify-items: center;
	pointer-events: none;
}

.dom-lightbox__stage-frame {
	position: fixed;
	left: var(--dom-lightbox-to-left);
	top: var(--dom-lightbox-to-top);
	width: var(--dom-lightbox-to-width);
	height: var(--dom-lightbox-to-height);
	display: grid;
	place-items: center;
	pointer-events: auto;
}

.dom-lightbox__stage-content {
	width: 100%;
	height: 100%;
	display: grid;
	place-items: center;
	opacity: 0;
	transform: none;
	transition: none;
}

.dom-lightbox__stage-content[data-visible="true"] {
	opacity: 1;
}

.dom-lightbox__image {
	width: 100%;
	height: 100%;
	object-fit: cover;
	border-radius: 0.75rem;
	box-shadow: 0 2rem 5rem rgb(0 0 0 / 0.42);
}

.dom-lightbox__nav {
	position: fixed;
	z-index: 5;
	top: 50%;
	pointer-events: auto;
	color: white;
	background: rgb(255 255 255 / 0.13);
	backdrop-filter: blur(14px);
	-webkit-backdrop-filter: blur(14px);
}

.dom-lightbox__nav--previous {
	left: max(0.75rem, env(safe-area-inset-left));
}

.dom-lightbox__nav--next {
	right: max(0.75rem, env(safe-area-inset-right));
}

.dom-lightbox__caption {
	position: fixed;
	z-index: 4;
	left: 50%;
	bottom: calc(5.25rem + env(safe-area-inset-bottom));
	width: min(calc(100vw - 2rem), var(--dom-lightbox-to-width));
	transform: translateX(-50%);
	text-align: center;
	opacity: 0;
	transition: opacity 160ms ease;
}

.dom-lightbox[data-phase="open"] .dom-lightbox__caption,
.dom-lightbox[data-phase="closing-from"] .dom-lightbox__caption {
	opacity: 1;
}

.dom-lightbox__caption-title {
	font-size: 0.95rem;
	font-weight: 700;
	letter-spacing: 0;
	color: white;
}

.dom-lightbox__caption-description {
	margin-top: 0.25rem;
	font-size: 0.82rem;
	line-height: 1.5;
	color: rgb(255 255 255 / 0.72);
}

.dom-lightbox__thumbs {
	position: fixed;
	z-index: 5;
	left: 50%;
	bottom: calc(0.9rem + env(safe-area-inset-bottom));
	display: flex;
	max-width: min(calc(100vw - 2rem), 44rem);
	gap: 0.5rem;
	overflow-x: auto;
	padding: 0.25rem;
	transform: translateX(-50%);
	opacity: 0;
	transition: opacity 160ms ease;
}

.dom-lightbox[data-phase="open"] .dom-lightbox__thumbs,
.dom-lightbox[data-phase="closing-from"] .dom-lightbox__thumbs {
	opacity: 1;
}

.dom-lightbox__thumb {
	width: 4rem;
	height: 3rem;
	flex: 0 0 auto;
	overflow: hidden;
	border: 2px solid transparent;
	border-radius: 0.5rem;
	background: rgb(255 255 255 / 0.12);
	opacity: 0.62;
	padding: 0;
	transition:
		border-color 140ms ease,
		opacity 140ms ease,
		transform 140ms ease;
}

.dom-lightbox__thumb:hover,
.dom-lightbox__thumb[data-active="true"] {
	opacity: 1;
}

.dom-lightbox__thumb[data-active="true"] {
	border-color: rgb(255 255 255 / 0.92);
	transform: translateY(-0.125rem);
}

.dom-lightbox__thumb img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.dom-lightbox__ghost {
	position: fixed;
	z-index: 3;
	left: var(--dom-lightbox-from-left);
	top: var(--dom-lightbox-from-top);
	width: var(--dom-lightbox-from-width);
	height: var(--dom-lightbox-from-height);
	object-fit: cover;
	border-radius: 0.625rem;
	box-shadow: 0 1.5rem 4rem rgb(0 0 0 / 0.35);
	pointer-events: none;
	transition:
		left var(--dom-lightbox-duration, 420ms) cubic-bezier(0.16, 1, 0.3, 1),
		top var(--dom-lightbox-duration, 420ms) cubic-bezier(0.16, 1, 0.3, 1),
		width var(--dom-lightbox-duration, 420ms) cubic-bezier(0.16, 1, 0.3, 1),
		height var(--dom-lightbox-duration, 420ms) cubic-bezier(0.16, 1, 0.3, 1),
		border-radius var(--dom-lightbox-duration, 420ms) cubic-bezier(0.16, 1, 0.3, 1);
}

.dom-lightbox__ghost--fallback {
	background: var(--canvas);
}

.dom-lightbox[data-phase="opening"] .dom-lightbox__ghost,
.dom-lightbox[data-phase="closing-from"] .dom-lightbox__ghost {
	left: var(--dom-lightbox-to-left);
	top: var(--dom-lightbox-to-top);
	width: var(--dom-lightbox-to-width);
	height: var(--dom-lightbox-to-height);
	border-radius: 0.75rem;
}

.dom-lightbox[data-phase="enter-from"] .dom-lightbox__ghost,
.dom-lightbox[data-phase="closing-from"] .dom-lightbox__ghost {
	transition: none;
}

.dom-lightbox[data-phase="closing"] .dom-lightbox__ghost {
	left: var(--dom-lightbox-from-left);
	top: var(--dom-lightbox-from-top);
	width: var(--dom-lightbox-from-width);
	height: var(--dom-lightbox-from-height);
	border-radius: 0.625rem;
}

@media (max-width: 640px) {
	.dom-lightbox__stage {
		grid-template-columns: 1fr;
	}

	.dom-lightbox__nav {
		top: auto;
		bottom: calc(4.75rem + env(safe-area-inset-bottom));
	}

	.dom-lightbox__caption {
		bottom: calc(4.5rem + env(safe-area-inset-bottom));
	}

	.dom-lightbox__thumb {
		width: 3.25rem;
		height: 2.5rem;
	}
}

@media (prefers-reduced-motion: reduce) {
	.dom-lightbox__backdrop,
	.dom-lightbox__topbar,
	.dom-lightbox__stage-content,
	.dom-lightbox__caption,
	.dom-lightbox__thumbs,
	.dom-lightbox__ghost {
		transition-duration: 80ms;
	}
}
</style>
