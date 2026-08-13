<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from 'vue';
import DomLiquidGlassSurface from '../../lib/vue/_internal/DomLiquidGlassSurface.vue';
import { LIQUID_GLASS_EFFECTS } from '../../lib/vue/_internal/liquidGlassConfig.js';

defineOptions({
	__doc: {
		name: 'Command palette',
		tag: '<DomCommandPalette>',
		description: 'A keyboard-first command launcher composed from dialog and listbox patterns.',
		events: [
			{ name: 'update:modelValue', payload: '(open: boolean)', description: 'Emitted when the palette opens or closes.' },
			{ name: 'select', payload: '({ command, value })', description: 'Emitted when a command is selected.' },
		],
	},
});

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false,
		_edit: { description: 'Whether the palette is open.' },
	},
	commands: {
		type: Array,
		required: true,
		_edit: { component: 'DomJsonListInput', description: 'Commands shown in the palette.', props: { compact: true } },
	},
	placeholder: {
		type: String,
		default: 'Search commands...',
		_edit: { description: 'Input placeholder.' },
	},
	shortcut: {
		type: String,
		default: 'mod+k',
		_edit: { description: 'Global keyboard shortcut. Use mod for Cmd on Mac and Ctrl elsewhere. Set empty string to disable.' },
	},
});
const emit = defineEmits(['update:modelValue', 'select']);

const query = ref('');
const activeIndex = ref(0);
const input = ref(null);
const listPanel = ref(null);
const panel = ref(null);
const isMounted = ref(false);
const isRendered = ref(false);
const isVisible = ref(false);
const motion = ref('closed');
const teleportTarget = shallowRef(null);
const listId = `dom-command-palette-${useId()}-list`;
const dialogLabel = 'Command palette';
const useLiquidGlass = LIQUID_GLASS_EFFECTS.commandPalette;

const filtered = computed(() => {
	const q = normalizeSearchText(query.value);
	if (!q) return props.commands;
	return props.commands
		.map((command, index) => ({
			command,
			index,
			score: commandSearchScore(command, q),
		}))
		.filter((result) => Number.isFinite(result.score))
		.sort((a, b) => a.score - b.score || a.index - b.index)
		.map((result) => result.command);
});

watch(() => props.modelValue, async (open) => {
	if (!open) {
		if (!isRendered.value) return;
		isVisible.value = false;
		motion.value = 'leaving';
		return;
	}

	isRendered.value = true;
	motion.value = 'entering';
	query.value = '';
	activeIndex.value = 0;
	await nextTick();
	scrollActiveCommandIntoView();
	window.requestAnimationFrame(() => {
		isVisible.value = true;
		input.value?.focus();
	});
});
watch(query, resetActiveIndex);
watch(filtered, syncActiveIndex);

/**
 * Returns keyboard navigation to the first filtered command.
 *
 * @returns {void}
 */
function resetActiveIndex() {
	activeIndex.value = 0;
	scrollActiveCommandIntoView();
}

/**
 * Keeps the active index valid when filtering changes the command collection.
 *
 * @param {Array<Record<string, unknown>>} items Filtered command collection.
 * @returns {void}
 */
function syncActiveIndex(items) {
	if (activeIndex.value >= items.length) activeIndex.value = Math.max(0, items.length - 1);
	scrollActiveCommandIntoView();
}
onMounted(() => {
	teleportTarget.value = panel.value?.ownerDocument?.body || document.body;
	isMounted.value = true;
	window.addEventListener('keydown', onShortcut, { capture: true });
	document.addEventListener('keydown', onShortcut, { capture: true });
	window.addEventListener('keyup', onShortcutFallback, { capture: true });
});
onBeforeUnmount(() => {
	window.removeEventListener('keydown', onShortcut, { capture: true });
	document.removeEventListener('keydown', onShortcut, { capture: true });
	window.removeEventListener('keyup', onShortcutFallback, { capture: true });
});

/**
 * Completes the current panel motion after the browser renders its final frame.
 *
 * @returns {void}
 */
function onPanelAnimationEnd() {
	if (motion.value === 'entering' && props.modelValue) {
		motion.value = 'open';
		return;
	}
	if (motion.value !== 'leaving' || props.modelValue) return;
	isRendered.value = false;
	motion.value = 'closed';
}

function close() {
	emit('update:modelValue', false);
}

function open() {
	if (props.modelValue) {
		input.value?.focus();
		return;
	}
	emit('update:modelValue', true);
}

function move(delta) {
	if (!filtered.value.length) return;
	activeIndex.value = (activeIndex.value + delta + filtered.value.length) % filtered.value.length;
	scrollActiveCommandIntoView();
}

/**
 * Keeps the highlighted command fully visible inside the scrollable list.
 *
 * @returns {void}
 */
function scrollActiveCommandIntoView() {
	nextTick(() => {
		const list = listPanel.value;
		const option = list?.querySelector?.('[aria-selected="true"]');
		if (!list || !option) return;

		const listRect = list.getBoundingClientRect();
		const optionRect = option.getBoundingClientRect();
		const edgeInset = 4;
		if (optionRect.top < listRect.top + edgeInset) {
			list.scrollTop += optionRect.top - listRect.top - edgeInset;
		} else if (optionRect.bottom > listRect.bottom - edgeInset) {
			list.scrollTop += optionRect.bottom - listRect.bottom + edgeInset;
		}
	});
}

function select(command = filtered.value[activeIndex.value]) {
	if (!command) return;
	emit('select', { command, value: command.value ?? command.label });
	close();
}

function onKeydown(event) {
	if (event.key === 'Escape') {
		event.preventDefault();
		close();
	} else if (event.key === 'Tab') {
		const nodes = panel.value?.querySelectorAll('button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), [tabindex]:not([tabindex="-1"])') || [];
		const first = nodes[0];
		const last = nodes[nodes.length - 1];
		if (!first || !last) return;
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	} else if (event.key === 'ArrowDown') {
		event.preventDefault();
		move(1);
	} else if (event.key === 'ArrowUp') {
		event.preventDefault();
		move(-1);
	} else if (event.key === 'Enter') {
		event.preventDefault();
		select();
	}
}

/**
 * Rank a command match so title matches appear before supporting metadata matches.
 *
 * @param {Record<string, unknown>} command Command candidate.
 * @param {string} query Normalized search query.
 * @returns {number} Lower relevance score, or positive infinity when the command does not match.
 */
function commandSearchScore(command, query) {
	const title = normalizeSearchText(command.label);
	if (title === query) return 0;
	if (title.startsWith(`${query} `)) return 10;
	if (title.split(/[\s/\-–—:]+/).includes(query)) return 20;
	if (title.startsWith(query)) return 30;
	if (title.includes(query)) return 40;
	return searchableCommandText(command).includes(query) ? 100 : Number.POSITIVE_INFINITY;
}

/**
 * Build the broad searchable text for a command's secondary fields.
 *
 * @param {Record<string, unknown>} command Command candidate.
 * @returns {string} Normalized searchable command text.
 */
function searchableCommandText(command) {
	return normalizeSearchText([
		command.label,
		command.description,
		command.value,
		command.to,
		command.search,
		command.keywords,
	]
		.flatMap((part) => Array.isArray(part) ? part : [part])
		.map((part) => String(part || '').trim())
		.filter(Boolean)
		.join(' '));
}

/**
 * Normalize user-entered and command-provided text for predictable matching.
 *
 * @param {unknown} value Text-like value to normalize.
 * @returns {string} Lowercase text with trimmed, collapsed whitespace.
 */
function normalizeSearchText(value) {
	return String(value || '')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, ' ');
}

function onShortcut(event) {
	if (isSiteSearchShortcut()) return;
	if (event.defaultPrevented || event.__domStudioGlobalSearchHandled) return;
	if (!matchesShortcut(event, props.shortcut)) return;
	if (event.repeat) return;
	event.preventDefault();
	event.stopPropagation();
	open();
}

function onShortcutFallback(event) {
	if (props.modelValue) return;
	if (isSiteSearchShortcut()) return;
	if (event.defaultPrevented || event.__domStudioGlobalSearchHandled) return;
	if (!matchesShortcut(event, props.shortcut)) return;
	event.preventDefault();
	event.stopPropagation();
	open();
}

function isSiteSearchShortcut() {
	return typeof window !== 'undefined'
		&& Boolean(window.__domStudioGlobalSearchShortcutHandler)
		&& normalizeShortcut(props.shortcut) === 'mod+k';
}

function normalizeShortcut(shortcut) {
	return String(shortcut || '')
		.toLowerCase()
		.split('+')
		.map((part) => part.trim())
		.filter(Boolean)
		.join('+');
}

function matchesShortcut(event, shortcut) {
	if (!shortcut) return false;
	const parts = shortcut.toLowerCase().split('+').map((part) => part.trim()).filter(Boolean);
	const key = parts.find((part) => !['mod', 'meta', 'cmd', 'command', 'ctrl', 'control', 'alt', 'option', 'shift'].includes(part));
	if (!key) return false;

	const wantsMod = parts.includes('mod');
	const wantsMeta = wantsMod || parts.includes('meta') || parts.includes('cmd') || parts.includes('command');
	const wantsCtrl = wantsMod || parts.includes('ctrl') || parts.includes('control');
	const wantsAlt = parts.includes('alt') || parts.includes('option');
	const wantsShift = parts.includes('shift');
	const hasMod = event.metaKey || event.ctrlKey;
	const keyMatches = event.key.toLowerCase() === key;

	if (wantsMod && !hasMod) return false;
	if (!wantsMod && event.metaKey !== wantsMeta) return false;
	if (!wantsMod && event.ctrlKey !== wantsCtrl) return false;
	if (event.altKey !== wantsAlt) return false;
	if (event.shiftKey !== wantsShift) return false;
	return keyMatches;
}
</script>

<template>
	<Teleport :to="teleportTarget || 'body'" :disabled="!isMounted || !teleportTarget">
		<div
			v-if="isRendered"
			class="fixed inset-0 z-[90] p-4"
			:class="modelValue ? 'pointer-events-auto' : 'pointer-events-none'"
		>
			<div
				class="absolute inset-0 bg-black/25 opacity-0 backdrop-blur-[2px] transition-opacity duration-[180ms] ease-out"
				:class="isVisible ? 'opacity-100' : 'opacity-0'"
				aria-hidden="true"
				@click="close"
			></div>

			<div
				ref="panel"
				role="dialog"
				aria-modal="true"
				:aria-label="dialogLabel"
				class="relative mx-auto mt-[12vh] w-[min(92vw,38rem)] origin-top rounded-[1.25rem]"
				:class="[
					useLiquidGlass ? '' : 'command-panel-blur skin-overlay overflow-hidden',
					{
						'command-panel-entering': motion === 'entering',
						'command-panel-leaving': motion === 'leaving',
					},
				]"
				@keydown="onKeydown"
				@animationend.self="onPanelAnimationEnd"
			>
				<DomLiquidGlassSurface
					v-if="useLiquidGlass"
					:refraction="40"
					class="pointer-events-none absolute inset-0"
					:style="{
						'--dom-liquid-glass-position': 'absolute',
						'--dom-liquid-glass-radius': '1.25rem',
						'--dom-liquid-glass-surface-fill': 'color-mix(in oklch, var(--canvas) 46%, transparent)',
					}"
					aria-hidden="true"
				/>

				<div class="relative z-[1] overflow-hidden rounded-[1.25rem]">
					<input
						ref="input"
						v-model="query"
						type="text"
						role="combobox"
						aria-autocomplete="list"
						aria-expanded="true"
						:aria-controls="listId"
						:aria-activedescendant="filtered[activeIndex] ? `${listId}-option-${activeIndex}` : undefined"
						:placeholder="placeholder"
						class="h-14 w-full border-b border-border/70 bg-transparent px-5 text-[1.05rem] outline-none placeholder:text-muted-fg"
					/>
					<div ref="listPanel" :id="listId" role="listbox" class="max-h-80 overflow-auto p-2">
						<button
							v-for="(command, index) in filtered"
							:id="`${listId}-option-${index}`"
							:key="command.value ?? command.label ?? index"
							role="option"
							type="button"
							tabindex="-1"
							class="block w-full rounded-xl px-3 py-2 text-left transition-colors"
							:class="index === activeIndex
								? 'bg-primary text-primary-fg shadow-sm'
								: 'text-muted-fg hover:bg-secondary hover:text-canvas-fg'"
							:aria-selected="index === activeIndex"
							@mouseenter="activeIndex = index"
							@click="select(command)"
						>
							<span class="flex min-w-0 items-start gap-3">
								<span
									v-if="command.icon"
									class="grid size-8 shrink-0 place-items-center rounded-lg border"
									:class="index === activeIndex
										? 'border-primary-fg/20 bg-primary-fg/15 text-primary-fg'
										: 'border-border/70 bg-secondary text-muted-fg'"
									aria-hidden="true"
								>
									<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
										<path :d="command.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</span>
								<span v-else class="size-8 shrink-0" aria-hidden="true"></span>
								<span class="min-w-0 flex-1 pt-0.5">
									<span class="block truncate text-sm font-medium">{{ command.label }}</span>
									<span
										v-if="command.description"
										class="mt-0.5 block truncate text-xs"
										:class="index === activeIndex ? 'text-primary-fg/75' : 'text-muted-fg'"
									>
										{{ command.description }}
									</span>
								</span>
							</span>
						</button>
						<p v-if="!filtered.length" class="px-3 py-6 text-center text-sm text-muted-fg">No commands found.</p>
					</div>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<style scoped>
.command-panel-blur {
	--skin-overlay-bg: var(
		--dom-command-palette-background,
		color-mix(in oklch, var(--canvas) 82%, transparent)
	);
	--skin-overlay-backdrop: var(
		--dom-command-palette-backdrop,
		blur(20px) saturate(1.12)
	);
}

.command-panel-entering {
	animation: command-panel-in 300ms both;
}

.command-panel-leaving {
	animation: command-panel-out 130ms both;
}

@keyframes command-panel-in {
	0% {
		opacity: 0;
		transform: translateY(-10px) scale(0.965);
		animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
	}
	60% {
		opacity: 1;
		transform: translateY(1px) scale(1.01);
		animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1);
	}
	100% {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@keyframes command-panel-out {
	0% {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
	100% {
		opacity: 0;
		transform: translateY(-5px) scale(0.985);
	}
}

@media (prefers-reduced-motion: reduce) {
	.command-panel-entering,
	.command-panel-leaving {
		animation-duration: 1ms;
	}
}
</style>
