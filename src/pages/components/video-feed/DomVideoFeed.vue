<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import DomIconButton from '../icon-button/DomIconButton.vue';
import DomRangeInput from '../../forms/range-input/DomRangeInput.vue';

defineOptions({
	__doc: {
		name: 'Video feed',
		tag: '<DomVideoFeed>',
		description: 'A vertical video feed with touch scrolling, snap navigation, and one active player. Built for desktop and mobile.',
		icon: 'M8 3h8v18H8zM11 9l4 3-4 3M3 9l2-2 2 2M3 15l2 2 2-2',
		slots: [
			{ name: 'caption', payload: '{ item, index }', description: 'Replaces the title, creator, and description overlay. Include media attribution here when required.' },
			{ name: 'actions', payload: '{ item, index }', description: 'Application-owned actions beside the caption, such as save or like.' },
			{ name: 'empty', description: 'Content shown when the feed has no items.' },
		],
		events: [
			{ name: 'update:index', payload: '(index: number)', description: 'The active item changed through scrolling, keyboard, or navigation.' },
			{ name: 'update:muted', payload: '(muted: boolean)', description: 'The viewer changed the sound preference.' },
			{ name: 'change', payload: '({ item, index })', description: 'Active item changed; use this to request another page near the end.' },
			{ name: 'error', payload: '({ item, index, error })', description: 'A video failed to load or play. Autoplay policy blocks show a play button instead.' },
		],
		keyboard: [
			{ keys: '↑ / ↓', action: 'Previous or next video when the feed is focused.' },
			{ keys: 'Home / End', action: 'First or last video.' },
			{ keys: 'Space / K', action: 'Play or pause.' },
			{ keys: 'M', action: 'Toggle sound.' },
			{ keys: 'Tab', action: 'Move through playback, seek, caption, and application controls.' },
		],
	},
});

const props = defineProps({
	items: {
		type: Array,
		/** Returns a fresh collection for each feed instance. */
		default: () => [],
		_edit: { description: 'Video records with a unique id, src, and title. Optional poster, creator, description, objectPosition, and WebVTT tracks.' },
	},
	index: { type: Number, default: 0, _edit: { description: 'Active item index; supports v-model:index.' } },
	height: { type: String, default: '100dvh', _edit: { description: 'Feed height. Use a CSS length, or 100% inside an explicitly sized parent.' } },
	muted: { type: Boolean, default: true, _edit: { description: 'Initial sound preference; supports v-model:muted. Muted playback is most compatible with autoplay.' } },
	autoplay: { type: Boolean, default: true, _edit: { description: 'Play the visible item automatically, except when reduced motion or data saving is requested.' } },
	loop: { type: Boolean, default: true, _edit: { description: 'Loop the active video. Does not wrap feed navigation.' } },
	fit: { type: String, default: 'cover', _edit: { options: ['cover', 'contain'], description: 'Fill the portrait frame or preserve the complete source image.' } },
	label: { type: String, default: 'Video feed', _edit: { description: 'Accessible name of the feed.' } },
});
const emit = defineEmits(['update:index', 'update:muted', 'change', 'error']);
const viewport = ref(null);
const activeIndex = ref(clampIndex(props.index));
const visitedSources = ref(new Map());
const soundMuted = ref(props.muted);
const playing = ref(false);
const waiting = ref(false);
const failed = ref(false);
const blocked = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const scrubbing = ref(false);
const captions = ref(true);
const visible = ref(false);
const reducedMotion = ref(false);
const saveData = ref(false);
const instructionsId = useId();
let userPaused = false;
let explicitPlayback = false;
let mounted = false;
let scrollFrame = 0;
let progressFrame = 0;
let playRun = 0;
let intersectionObserver;
let resizeObserver;
let motionQuery;
let ownerDocument;
let ownerWindow;

/** Returns the currently selected application-owned record. */
const activeItem = computed(() => props.items[activeIndex.value]);
/** Limits progress to the current media duration, including while loading. */
const progress = computed(() => duration.value ? Math.min(100, currentTime.value / duration.value * 100) : 0);
/** Makes media dimensions available to the portrait frame without parent layout tricks. */
const frameStyle = computed(() => ({ height: props.height }));

rememberActiveVideo();

/** Clamps external indices to a finite item position, including an empty feed. */
function clampIndex(index) {
	return Math.max(0, Math.min(props.items.length - 1, Number.isFinite(index) ? Math.trunc(index) : 0));
}

/** Keeps a visited player mounted so its paused frame and playback position survive navigation. */
function rememberActiveVideo() {
	const item = props.items[activeIndex.value];
	if (item) visitedSources.value.set(item.id, item.src);
}

/** Lazily mounts neighbouring sources while retaining every previously active player. */
function shouldMountVideo(item, index) {
	return Math.abs(index - activeIndex.value) <= 1 || visitedSources.value.get(item.id) === item.src;
}

/** Returns the active, neighbouring, and retained paused media elements. */
function videos() {
	return Array.from(viewport.value?.querySelectorAll('video') || []);
}

/** Resolves the active player independently of Vue's keyed list ref ordering. */
function activeVideo() {
	return videos().find(isActiveVideo);
}

/** Tests whether a media element belongs to the active slide. */
function isActiveVideo(video) {
	return Number(video.dataset.index) === activeIndex.value;
}

/** Determines whether playback is allowed by visibility and the viewer's intent. */
function shouldPlay() {
	return mounted && visible.value && !ownerDocument.hidden && !userPaused && !failed.value
		&& (explicitPlayback || (props.autoplay && !reducedMotion.value && !saveData.value));
}

/**
 * Pauses inactive players and safely requests playback on the visible one.
 * A generation counter prevents a late play promise from reviving a stale slide.
 */
async function syncPlayback() {
	const run = ++playRun;
	const video = activeVideo();
	if (!shouldPlay()) stopProgress();
	for (const candidate of videos()) {
		candidate.muted = soundMuted.value;
		if (candidate !== video || !shouldPlay()) candidate.pause();
	}
	if (!video || !shouldPlay()) return;
	try {
		await video.play();
		if (run !== playRun && (!isActiveVideo(video) || !shouldPlay())) video.pause();
	} catch (error) {
		if (run !== playRun || error.name === 'AbortError') return;
		waiting.value = false;
		if (error.name === 'NotAllowedError') blocked.value = true;
		else handleMediaError({ target: video });
	}
}

/** Updates active state and preserves focus when a previously focused slide becomes inert. */
async function selectIndex(index) {
	const next = clampIndex(index);
	if (next === activeIndex.value) return;
	// Stop the outgoing player before Vue updates the active slide or mounts its neighbour.
	playRun++;
	stopProgress();
	scrubbing.value = false;
	for (const video of videos()) video.pause();
	const focusedSlide = ownerDocument?.activeElement?.closest('[data-video-slide]');
	if (focusedSlide && viewport.value?.contains(focusedSlide)) viewport.value.focus({ preventScroll: true });
	activeIndex.value = next;
	rememberActiveVideo();
	userPaused = false;
	explicitPlayback = false;
	playing.value = false;
	waiting.value = false;
	failed.value = false;
	blocked.value = false;
	currentTime.value = 0;
	duration.value = 0;
	emit('update:index', next);
	emit('change', { item: props.items[next], index: next });
	await nextTick();
	readMediaState();
	applyCaptions();
	syncPlayback();
}

/** Scrolls to an item; native scroll events commit the visible slide as it arrives. */
function goTo(index, smooth = true) {
	const next = clampIndex(index);
	if (!viewport.value) return;
	viewport.value.scrollTo({ top: next * viewport.value.clientHeight, behavior: smooth && !reducedMotion.value ? 'smooth' : 'instant' });
	if (!smooth || reducedMotion.value) selectIndex(next);
}

/** Moves to the previous item without wrapping at the first item. */
function previous() { goTo(activeIndex.value - 1); }
/** Moves to the next item without wrapping at the last item. */
function next() { goTo(activeIndex.value + 1); }

/** Samples native scroll position once per animation frame for touch and wheel input. */
function handleScroll() {
	if (!scrollFrame) scrollFrame = ownerWindow.requestAnimationFrame(commitScroll);
}

/** Commits the nearest snap point without taking over native scrolling. */
function commitScroll() {
	scrollFrame = 0;
	if (viewport.value?.clientHeight) selectIndex(Math.round(viewport.value.scrollTop / viewport.value.clientHeight));
}

/** Applies an explicit play or pause request, including autoplay-policy recovery. */
function togglePlayback() {
	userPaused = playing.value;
	explicitPlayback = !userPaused;
	blocked.value = false;
	syncPlayback();
}

/** Keeps the viewer's sound preference consistent while moving between items. */
function toggleSound() {
	soundMuted.value = !soundMuted.value;
	emit('update:muted', soundMuted.value);
	syncPlayback();
}

/** Reads progress only from the active player, including cached metadata on revisits. */
function readMediaState() {
	const video = activeVideo();
	if (!scrubbing.value) currentTime.value = video?.currentTime || 0;
	duration.value = Number.isFinite(video?.duration) ? video.duration : 0;
}

/** Samples the media clock at display cadence without interpolating through buffering or seeks. */
function sampleProgress() {
	progressFrame = 0;
	readMediaState();
	syncProgress();
}

/** Runs one animation loop only while the active video is playing and the viewer is not scrubbing. */
function syncProgress() {
	if (!playing.value || waiting.value || scrubbing.value || !shouldPlay()) {
		stopProgress();
		return;
	}
	if (!progressFrame) progressFrame = ownerWindow.requestAnimationFrame(sampleProgress);
}

/** Cancels pending progress work on pause, buffering, navigation, or teardown. */
function stopProgress() {
	if (progressFrame) ownerWindow.cancelAnimationFrame(progressFrame);
	progressFrame = 0;
}

/** Synchronizes media events and rejects late play events from hidden or inactive players. */
function handleMediaEvent(event) {
	const video = event.target;
	if (event.type === 'play' && (!isActiveVideo(video) || !shouldPlay())) video.pause();
	if (!isActiveVideo(video)) return;
	playing.value = !video.paused && !video.ended;
	if (event.type === 'waiting') waiting.value = true;
	if (['playing', 'pause', 'ended', 'canplay'].includes(event.type)) waiting.value = false;
	if (event.type === 'ended' && !props.loop) userPaused = true;
	readMediaState();
	syncProgress();
	if (event.type === 'loadedmetadata') applyCaptions();
}

/** Shows a recoverable error for a failed active media resource. */
function handleMediaError(event) {
	if (!isActiveVideo(event.target)) return;
	failed.value = true;
	waiting.value = false;
	playing.value = false;
	stopProgress();
	emit('error', { item: activeItem.value, index: activeIndex.value, error: event.target.error });
}

/** Retries the active source after a network or decoder failure. */
function retry() {
	failed.value = false;
	blocked.value = false;
	userPaused = false;
	explicitPlayback = true;
	activeVideo()?.load();
	syncPlayback();
}

/** Keeps pointer scrubbing authoritative until release so media updates cannot pull the handle away. */
function handleScrubbing(dragging) {
	scrubbing.value = dragging;
	if (!dragging) readMediaState();
	syncProgress();
}

/** Seeks from the DOM Studio range's numeric value while preserving playback intent. */
function seek(value) {
	const video = activeVideo();
	if (!video || !duration.value || failed.value) return;
	const time = Math.max(0, Math.min(100, Number(value))) / 100 * duration.value;
	if (!Number.isFinite(time)) return;
	currentTime.value = time;
	video.currentTime = time;
}

/** Formats a finite duration as minutes and seconds for the seek control. */
function formatTime(seconds) {
	const value = Math.max(0, Math.floor(seconds || 0));
	return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

/** Enables the designated default caption track, or the first supplied track. */
function applyCaptions() {
	const video = activeVideo();
	if (!video) return;
	const preferred = Math.max(0, (activeItem.value?.tracks || []).findIndex(isDefaultTrack));
	for (let index = 0; index < video.textTracks.length; index++) {
		const track = video.textTracks[index];
		track.mode = captions.value && index === preferred ? 'showing' : 'disabled';
		for (const cue of track.cues || []) {
			if (cue.line !== 'auto') continue;
			cue.snapToLines = false;
			cue.line = 55;
		}
	}
}

/** Identifies the application's preferred WebVTT caption track. */
function isDefaultTrack(track) { return track.default; }
/** Toggles text captions without affecting the shared sound preference. */
function toggleCaptions() {
	captions.value = !captions.value;
	applyCaptions();
}

/** Handles feed shortcuts while leaving links, buttons, and form fields in control of their own keys. */
function handleKeydown(event) {
	if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('button, a, input, textarea, select, [contenteditable="true"]')) return;
	if (!props.items.length) return;
	switch (event.key.toLowerCase()) {
		case 'arrowup': case 'pageup': previous(); break;
		case 'arrowdown': case 'pagedown': next(); break;
		case 'home': goTo(0); break;
		case 'end': goTo(props.items.length - 1); break;
		case ' ': case 'k': togglePlayback(); break;
		case 'm': toggleSound(); break;
		default: return;
	}
	event.preventDefault();
}

/** Prevents background-tab playback and resumes only when prior intent allows it. */
function handleVisibility() { syncPlayback(); }
/** Tracks platform motion preferences and stops automatic playback when they change. */
function handleMotion() {
	reducedMotion.value = motionQuery.matches;
	syncPlayback();
}
/** Preserves the selected snap point when resizing or rotating the device. */
function handleResize() { goTo(activeIndex.value, false); }
/** Watches actual feed intersection, including clipped or offscreen documentation examples. */
function handleIntersection(entries) {
	visible.value = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.5;
	syncPlayback();
}

/**
 * Applies application navigation without treating a v-model acknowledgement as
 * a new scroll command. Echoed indices must not interrupt native snap momentum.
 */
function handleExternalIndex(index) {
	if (clampIndex(index) !== activeIndex.value) goTo(index, false);
}
/** Applies controlled sound changes without emitting them back to the application. */
function handleExternalMuted(muted) {
	soundMuted.value = muted;
	syncPlayback();
}
/** Returns the source identity list to detect replacements as well as pagination. */
function itemSources() { return props.items.map(itemIdentity); }
/** Provides a stable source signature for keyed media updates. */
function itemIdentity(item) { return `${item.id}:${item.src}`; }
/** Reconciles empty, appended, reordered, and replaced media lists. */
async function handleItemsChange() {
	failed.value = false;
	blocked.value = false;
	const currentSources = new Map(props.items.map(itemSourceEntry));
	for (const [id, src] of visitedSources.value) {
		if (currentSources.get(id) !== src) visitedSources.value.delete(id);
	}
	rememberActiveVideo();
	await nextTick();
	goTo(activeIndex.value, false);
	readMediaState();
	applyCaptions();
	syncPlayback();
}

/** Pairs a stable item ID with its current source when pruning retained players. */
function itemSourceEntry(item) { return [item.id, item.src]; }

/** Reads the controlled index for the prop watcher. */
function getIndex() { return props.index; }
/** Reads the controlled sound setting for the prop watcher. */
function getMuted() { return props.muted; }
/** Reads the autoplay preference for the prop watcher. */
function getAutoplay() { return props.autoplay; }

watch(getIndex, handleExternalIndex);
watch(getMuted, handleExternalMuted);
watch(getAutoplay, syncPlayback);
watch(itemSources, handleItemsChange);

/** Installs browser observers only after mount, keeping server rendering deterministic. */
onMounted(function mountFeed() {
	mounted = true;
	ownerDocument = viewport.value.ownerDocument;
	ownerWindow = ownerDocument.defaultView;
	motionQuery = ownerWindow.matchMedia('(prefers-reduced-motion: reduce)');
	reducedMotion.value = motionQuery.matches;
	saveData.value = Boolean(ownerWindow.navigator.connection?.saveData);
	motionQuery.addEventListener('change', handleMotion);
	ownerDocument.addEventListener('visibilitychange', handleVisibility);
	intersectionObserver = new ownerWindow.IntersectionObserver(handleIntersection, { threshold: [0, 0.5] });
	intersectionObserver.observe(viewport.value);
	resizeObserver = new ownerWindow.ResizeObserver(handleResize);
	resizeObserver.observe(viewport.value);
	goTo(activeIndex.value, false);
});

/** Releases observers, queued frames, and all playback when the feed is removed. */
onBeforeUnmount(function unmountFeed() {
	mounted = false;
	stopProgress();
	playRun++;
	for (const video of videos()) video.pause();
	intersectionObserver?.disconnect();
	resizeObserver?.disconnect();
	motionQuery?.removeEventListener('change', handleMotion);
	ownerDocument?.removeEventListener('visibilitychange', handleVisibility);
	if (scrollFrame) ownerWindow.cancelAnimationFrame(scrollFrame);
});

defineExpose({ goTo, next, previous });
</script>

<template>
	<div class="relative flex w-full min-w-0 justify-center gap-4 overflow-hidden rounded-2xl bg-secondary/50 [container-type:size]" :style="frameStyle" @keydown="handleKeydown">
		<p :id="instructionsId" class="sr-only">Swipe or scroll vertically for another video. When focused, use up and down arrows to navigate, space to play or pause, and M for sound.</p>
		<div
			ref="viewport"
			class="relative h-full min-w-0 w-full max-w-[56.25cqh] snap-y snap-mandatory overflow-x-hidden overflow-y-auto rounded-2xl bg-(--video-canvas) text-(--video-fg) [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
			role="region"
			aria-roledescription="carousel"
			:aria-label="label"
			:aria-describedby="instructionsId"
			tabindex="0"
			@scroll.passive="handleScroll"
		>
			<div v-if="!items.length" class="grid h-full place-items-center p-8 text-center">
				<slot name="empty"><p class="text-sm">No videos yet.</p></slot>
			</div>
			<article
				v-for="(item, itemIndex) in items" :key="item.id"
				class="relative isolate h-full w-full snap-start snap-always overflow-hidden"
				data-video-slide
				:inert="itemIndex !== activeIndex"
				:aria-hidden="itemIndex !== activeIndex"
				:aria-label="`${itemIndex + 1} of ${items.length}: ${item.title || 'Video'}`"
				aria-roledescription="slide"
			>
				<img v-if="item.poster" :src="item.poster" alt="" class="absolute inset-0 h-full w-full" :class="fit === 'contain' ? 'object-contain' : 'object-cover'" :style="{ objectPosition: item.objectPosition }" :loading="itemIndex === activeIndex ? 'eager' : 'lazy'" />
				<video
					v-if="shouldMountVideo(item, itemIndex)"
					:key="item.src"
					:data-index="itemIndex"
					:src="item.src"
					:poster="item.poster"
					:muted="soundMuted"
					:loop="loop"
					:preload="itemIndex === activeIndex ? 'auto' : 'metadata'"
					:crossorigin="item.tracks?.length ? 'anonymous' : undefined"
					playsinline
					:aria-label="item.title || 'Video'"
					class="absolute inset-0 h-full w-full"
					:class="fit === 'contain' ? 'object-contain' : 'object-cover'"
					:style="{ objectPosition: item.objectPosition }"
					@play="handleMediaEvent" @playing="handleMediaEvent" @pause="handleMediaEvent" @ended="handleMediaEvent"
					@waiting="handleMediaEvent" @canplay="handleMediaEvent" @loadedmetadata="handleMediaEvent" @timeupdate="handleMediaEvent" @error="handleMediaError"
					@seeking="handleMediaEvent" @seeked="handleMediaEvent" @durationchange="handleMediaEvent"
				>
					<track v-for="track in item.tracks || []" :key="track.src" kind="captions" :src="track.src" :srclang="track.srclang" :label="track.label" :default="track.default" @load="applyCaptions" />
				</video>
				<button type="button" tabindex="-1" aria-hidden="true" class="absolute inset-0 z-10 cursor-pointer" @click="togglePlayback"></button>
				<div class="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-linear-to-b from-(--video-canvas)/70 to-transparent"></div>
				<div class="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
					<span class="rounded-full bg-(--video-canvas)/50 px-3 py-1.5 text-xs font-semibold tabular-nums backdrop-blur">{{ itemIndex + 1 }} / {{ items.length }}</span>
					<div class="flex gap-1">
						<DomIconButton :label="itemIndex === activeIndex && playing ? 'Pause video' : 'Play video'" :icon="itemIndex === activeIndex && playing ? 'M9 5v14M15 5v14' : 'M8 5l11 7-11 7V5Z'" size="lg" class="!bg-(--video-canvas)/50 !text-(--video-fg) backdrop-blur" @click="togglePlayback" />
						<DomIconButton :label="soundMuted ? 'Unmute video' : 'Mute video'" :icon="soundMuted ? 'M11 5L6 9H3v6h3l5 4V5ZM17 9l5 6M22 9l-5 6' : 'M11 5L6 9H3v6h3l5 4V5ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14'" size="lg" class="!bg-(--video-canvas)/50 !text-(--video-fg) backdrop-blur" @click="toggleSound" />
					</div>
				</div>
				<div v-if="itemIndex === activeIndex && (failed || blocked || !playing || waiting)" class="pointer-events-none absolute inset-0 z-10 grid place-items-center p-6">
					<div v-if="failed" role="status" class="pointer-events-auto rounded-2xl bg-(--video-canvas)/90 p-5 text-center">
						<p class="text-sm font-semibold">This video couldn’t load.</p>
						<button type="button" class="mt-3 min-h-11 rounded-full border border-current px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-ring" @click="retry">Try again</button>
					</div>
					<span v-else-if="waiting && playing" role="status" class="rounded-full bg-(--video-canvas)/65 px-4 py-2 text-sm">Loading video…</span>
					<span v-else-if="!playing" class="grid size-16 place-items-center rounded-full bg-(--video-canvas)/50 backdrop-blur" aria-hidden="true">
						<svg viewBox="0 0 24 24" class="ml-1 size-7 fill-current"><path d="M8 5l11 7-11 7z" /></svg>
					</span>
				</div>
				<div class="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-(--video-canvas)/95 via-(--video-canvas)/65 to-transparent px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-24">
					<div class="flex items-end gap-3">
						<div class="pointer-events-auto min-w-0 flex-1 space-y-2">
							<slot name="caption" :item="item" :index="itemIndex">
								<p v-if="item.creator" class="text-xs font-semibold">{{ item.creator }}</p>
								<h3 class="text-xl font-semibold leading-tight tracking-tight">{{ item.title }}</h3>
								<p v-if="item.description" class="text-sm leading-relaxed opacity-85">{{ item.description }}</p>
							</slot>
						</div>
						<div v-if="$slots.actions" class="pointer-events-auto flex shrink-0 flex-col items-center gap-3"><slot name="actions" :item="item" :index="itemIndex" /></div>
					</div>
					<div class="pointer-events-auto mt-3 flex items-center gap-3" :class="{ invisible: itemIndex !== activeIndex }">
						<div class="min-w-0 flex-1">
							<DomRangeInput
								:model-value="progress"
								:min="0" :max="100" :step="0.1"
								:show-value="false" chrome="none"
								:disabled="!duration || failed || itemIndex !== activeIndex"
								:aria-label="`Seek ${item.title || 'video'}`"
								:aria-valuetext="`${formatTime(currentTime)} of ${formatTime(duration)}`"
								control-class="min-h-11"
								track-class="h-0.5! rounded-none! bg-(--video-fg)/25! shadow-none!"
								progress-class="h-0.5! rounded-none! bg-(--video-fg)/80! shadow-none!"
								handle-class="size-3! bg-(--video-fg)! opacity-0 transition-opacity! group-hover/range:opacity-100 group-data-[keyboard-focus]/range:opacity-100 motion-reduce:transition-none!"
								active-handle-class="opacity-100!"
								@update:model-value="seek"
								@update:dragging="handleScrubbing"
							/>
						</div>
						<span class="text-[11px] font-medium tabular-nums">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
						<button v-if="item.tracks?.length" type="button" :aria-pressed="captions" :aria-label="captions ? 'Turn captions off' : 'Turn captions on'" class="min-h-11 min-w-11 rounded-lg border border-current px-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-ring" @click="toggleCaptions">CC</button>
					</div>
				</div>
			</article>
		</div>
		<div v-if="items.length > 1" class="hidden shrink-0 flex-col items-center justify-center gap-3 pr-4 sm:flex" role="group" aria-label="Video navigation">
			<DomIconButton label="Previous video" icon="M6 14l6-6 6 6" variant="secondary" size="lg" :disabled="activeIndex === 0" @click="previous" />
			<DomIconButton label="Next video" icon="M6 10l6 6 6-6" variant="secondary" size="lg" :disabled="activeIndex === items.length - 1" @click="next" />
		</div>
		<p class="sr-only" aria-live="polite" aria-atomic="true">{{ activeItem ? `Video ${activeIndex + 1} of ${items.length}: ${activeItem.title}` : 'No videos' }}</p>
	</div>
</template>

<style scoped>
/* Native captions use the same themeable contrast as the playback controls. */
video::cue {
	color: var(--video-fg);
	background: var(--video-canvas);
}
</style>
