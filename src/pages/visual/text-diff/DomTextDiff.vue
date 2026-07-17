<script setup>
import { computed, ref, watch } from 'vue';
import { createInlineDiff, createSplitDiff, createUnifiedDiff } from './textDiff.js';

defineOptions({
	__doc: {
		name: 'Text diff',
		tag: '<DomTextDiff>',
		description: 'A standalone text comparison for AI rewrites, code patches, editorial review, and before-and-after copy changes.',
		icon: 'M8 7H4m4 0L6 5m2 2L6 9m10 8h4m-2-2v4M11 5h3a3 3 0 0 1 3 3v1m-6 10H8a3 3 0 0 1-3-3v-1',
		playground: {
			initial: {
				original: 'Write better pages with a flexible visual editor.',
				proposed: 'Create clearer pages with an editor built for focused teams.',
				mode: 'diff',
				view: 'inline',
				format: 'text',
				originalLabel: 'Current',
				proposedLabel: 'Suggested',
				showHeader: true,
				showModeSwitcher: true,
				framed: true,
			},
		},
		slots: [
			{ name: 'header', payload: '{ additions, removals, mode, setMode, originalLabel, proposedLabel }', description: 'Replace the comparison header and optionally control the active content mode.' },
		],
		events: [
			{ name: 'update:mode', payload: "'diff' | 'original' | 'replacement'", description: 'Fired when the active content mode changes.' },
			{ name: 'mode-change', payload: "'diff' | 'original' | 'replacement'", description: 'Fired after the viewer switches between the diff, current text, and replacement text.' },
		],
	},
});

const props = defineProps({
	original: {
		type: String,
		default: '',
		_edit: { description: 'Current or original text.' },
	},
	proposed: {
		type: String,
		default: '',
		_edit: { description: 'Suggested replacement text.' },
	},
	mode: {
		type: String,
		default: 'diff',
		_edit: { options: ['diff', 'original', 'replacement'], description: 'Show the complete diff, current text, or finished replacement.' },
	},
	view: {
		type: String,
		default: 'inline',
		_edit: { options: ['inline', 'unified', 'split'], description: 'Inline prose, unified patch, or side-by-side comparison.' },
	},
	format: {
		type: String,
		default: 'text',
		_edit: { options: ['text', 'code'], description: 'Use proportional text or code-oriented monospace styling.' },
	},
	originalLabel: {
		type: String,
		default: 'Original',
		_edit: { description: 'Label for the original content.' },
	},
	proposedLabel: {
		type: String,
		default: 'Suggested',
		_edit: { description: 'Label for the proposed content.' },
	},
	showHeader: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show comparison labels and change counts.' },
	},
	showModeSwitcher: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the Diff, Current, and Replacement controls inside the standard header.' },
	},
	framed: {
		type: Boolean,
		default: true,
		_edit: { description: 'Render the standard border, radius, and canvas background.' },
	},
});

const emit = defineEmits(['update:mode', 'mode-change']);
const modeOptions = [
	{ value: 'diff', label: 'Diff' },
	{ value: 'original', label: 'Current' },
	{ value: 'replacement', label: 'Replacement' },
];
const activeMode = ref(normalizeMode(props.mode));

const resolvedView = computed(resolveView);
const resolvedFormat = computed(resolveFormat);
const inlineSegments = computed(resolveInlineSegments);
const unifiedRows = computed(resolveUnifiedRows);
const splitRows = computed(resolveSplitRows);
const changeStats = computed(calculateChangeStats);
const figureLabel = computed(resolveFigureLabel);
const completeText = computed(resolveCompleteText);
const completeTextLabel = computed(resolveCompleteTextLabel);

watch(readModeProp, syncModeFromProp);

/**
 * Checks whether a content mode is supported.
 *
 * @param {string} value Candidate content mode.
 * @returns {boolean} Whether the mode is supported.
 */
function isSupportedMode(value) {
	for (const option of modeOptions) {
		if (option.value === value) return true;
	}
	return false;
}

/**
 * Normalizes a content mode to the complete diff view.
 *
 * @param {string} value Candidate content mode.
 * @returns {'diff'|'original'|'replacement'} Supported content mode.
 */
function normalizeMode(value) {
	return isSupportedMode(value) ? value : 'diff';
}

/**
 * Reads the externally supplied mode for the prop watcher.
 *
 * @returns {string} Current mode prop.
 */
function readModeProp() {
	return props.mode;
}

/**
 * Synchronizes externally controlled mode changes with the local viewer.
 *
 * @param {string} value Updated mode prop.
 * @returns {void}
 */
function syncModeFromProp(value) {
	activeMode.value = normalizeMode(value);
}

/**
 * Switches the visible content and notifies controlled consumers.
 *
 * @param {'diff'|'original'|'replacement'} value Requested content mode.
 * @returns {void}
 */
function setMode(value) {
	const nextMode = normalizeMode(value);
	if (nextMode === activeMode.value) return;
	activeMode.value = nextMode;
	emit('update:mode', nextMode);
	emit('mode-change', nextMode);
}

/**
 * Checks whether a diff view is supported.
 *
 * @param {string} value Candidate view.
 * @returns {boolean} Whether the view is supported.
 */
function isSupportedView(value) {
	return ['inline', 'unified', 'split'].includes(value);
}

/**
 * Checks whether a text format is supported.
 *
 * @param {string} value Candidate format.
 * @returns {boolean} Whether the format is supported.
 */
function isSupportedFormat(value) {
	return ['text', 'code'].includes(value);
}

/**
 * Resolves unknown view values to the inline presentation.
 *
 * @returns {'inline'|'unified'|'split'} Supported view.
 */
function resolveView() {
	return isSupportedView(props.view) ? props.view : 'inline';
}

/**
 * Resolves unknown format values to proportional text.
 *
 * @returns {'text'|'code'} Supported format.
 */
function resolveFormat() {
	return isSupportedFormat(props.format) ? props.format : 'text';
}

/**
 * Creates inline segments for the current component values.
 *
 * @returns {Array<Record<string, unknown>>} Inline diff segments.
 */
function resolveInlineSegments() {
	return createInlineDiff(props.original, props.proposed);
}

/**
 * Creates unified rows for the current component values.
 *
 * @returns {Array<Record<string, unknown>>} Unified diff rows.
 */
function resolveUnifiedRows() {
	return createUnifiedDiff(props.original, props.proposed);
}

/**
 * Creates split rows for the current component values.
 *
 * @returns {Array<Record<string, unknown>>} Split diff rows.
 */
function resolveSplitRows() {
	return createSplitDiff(props.original, props.proposed);
}

/**
 * Describes the currently visible comparison or complete text.
 *
 * @returns {string} Accessible figure label.
 */
function resolveFigureLabel() {
	if (activeMode.value === 'original') return `${props.originalLabel} text`;
	if (activeMode.value === 'replacement') return `${props.proposedLabel} replacement text`;
	return `${props.originalLabel} compared with ${props.proposedLabel}`;
}

/**
 * Returns the complete text for the active non-diff mode.
 *
 * @returns {string} Original or proposed text.
 */
function resolveCompleteText() {
	return activeMode.value === 'original' ? props.original : props.proposed;
}

/**
 * Returns the accessible label for the active complete text.
 *
 * @returns {string} Complete text label.
 */
function resolveCompleteTextLabel() {
	return activeMode.value === 'original' ? props.originalLabel : props.proposedLabel;
}

/**
 * Calculates visible addition and removal counts for the active view.
 *
 * @returns {{ additions: number, removals: number }} Change counts.
 */
function calculateChangeStats() {
	const operations = resolvedView.value === 'inline' ? inlineSegments.value : unifiedRows.value;
	return {
		additions: operations.filter(isAddedOperation).length,
		removals: operations.filter(isRemovedOperation).length,
	};
}

/**
 * Checks whether an operation represents added content.
 *
 * @param {Record<string, unknown>} operation Diff operation.
 * @returns {boolean} Whether content was added.
 */
function isAddedOperation(operation) {
	return operation.type === 'added';
}

/**
 * Checks whether an operation represents removed content.
 *
 * @param {Record<string, unknown>} operation Diff operation.
 * @returns {boolean} Whether content was removed.
 */
function isRemovedOperation(operation) {
	return operation.type === 'removed';
}

/**
 * Returns the visible sign for a unified diff row.
 *
 * @param {Record<string, unknown>} row Diff row.
 * @returns {string} Addition, removal, or unchanged sign.
 */
function rowSign(row) {
	if (row.type === 'added') return '+';
	if (row.type === 'removed') return '−';
	return '';
}

/**
 * Returns the visible line number pair for a unified row.
 *
 * @param {Record<string, unknown>} row Diff row.
 * @returns {string} Original and proposed line numbers.
 */
function rowNumbers(row) {
	return `${row.originalNumber ?? ''} ${row.proposedNumber ?? ''}`.trim();
}

/**
 * Returns the semantic background utility for a diff line.
 *
 * @param {string} type Diff line state.
 * @returns {string} Tailwind background utility.
 */
function lineBackgroundClass(type) {
	if (type === 'removed') return 'bg-destructive/10';
	if (type === 'added') return 'bg-success/10';
	if (type === 'blank') return 'bg-secondary/35';
	return '';
}

/**
 * Returns the semantic text utility for a diff sign.
 *
 * @param {string} type Diff line state.
 * @returns {string} Tailwind text utility.
 */
function lineSignClass(type) {
	if (type === 'removed') return 'text-destructive';
	if (type === 'added') return 'text-success';
	return 'text-muted-fg';
}

/**
 * Returns the semantic highlight utility for changed text.
 *
 * @param {string} type Diff line state.
 * @returns {string} Tailwind background utility.
 */
function markBackgroundClass(type) {
	return type === 'removed' ? 'bg-destructive/20' : 'bg-success/25';
}
</script>

<template>
	<figure
		class="w-full min-w-0 overflow-hidden bg-canvas text-sm leading-[1.65] text-canvas-fg [container-type:inline-size]"
		:class="framed ? 'rounded-xl border border-border' : ''"
		:aria-label="figureLabel"
	>
		<header
			v-if="showHeader"
			data-diff-header
			class="grid min-h-[2.65rem] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-b border-border bg-secondary/45 px-3 py-[0.55rem]"
			:class="framed ? '' : 'rounded-t-lg border border-border'"
		>
			<slot
				name="header"
				:additions="changeStats.additions"
				:removals="changeStats.removals"
				:mode="activeMode"
				:set-mode="setMode"
				:original-label="originalLabel"
				:proposed-label="proposedLabel"
			>
				<div class="flex min-w-0 items-center gap-2 text-xs font-[650]">
					<span>{{ originalLabel }}</span>
					<svg
						v-if="resolvedView !== 'split'"
						class="size-4 shrink-0 text-muted-fg"
						viewBox="0 0 20 20"
						fill="none"
						stroke="currentColor"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						aria-hidden="true"
					>
						<path d="M4 10h12m-4-4 4 4-4 4" />
					</svg>
					<span>{{ proposedLabel }}</span>
				</div>
				<div
					v-if="showModeSwitcher"
					data-mode-switcher
					class="col-start-3 row-start-1 flex items-center rounded-lg border border-border bg-secondary/70 p-0.5"
					role="group"
					aria-label="Displayed text"
				>
					<button
						v-for="option in modeOptions"
						:key="option.value"
						type="button"
						class="cursor-pointer rounded-md border-0 px-2 py-1.5 font-[inherit] text-[0.6875rem] font-[650] leading-none transition-[background-color,color,box-shadow] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring motion-reduce:transition-none"
						:class="activeMode === option.value
							? 'bg-canvas text-canvas-fg shadow-sm'
							: 'bg-transparent text-muted-fg hover:text-canvas-fg'"
						:aria-pressed="activeMode === option.value"
						@click="setMode(option.value)"
					>
						{{ option.label }}
					</button>
				</div>
				<Transition
					enter-active-class="transition-opacity duration-150 ease-out motion-reduce:transition-none"
					enter-from-class="opacity-0"
					enter-to-class="opacity-100"
					leave-active-class="transition-opacity duration-100 ease-in motion-reduce:transition-none"
					leave-from-class="opacity-100"
					leave-to-class="opacity-0"
				>
					<div
						v-if="activeMode === 'diff'"
						class="col-start-2 row-start-1 flex items-center gap-2"
						aria-label="Change summary"
					>
						<span class="rounded-md bg-destructive/10 px-1.5 py-1 font-mono text-[0.6875rem] font-bold leading-none text-destructive">−{{ changeStats.removals }}</span>
						<span class="rounded-md bg-success/15 px-1.5 py-1 font-mono text-[0.6875rem] font-bold leading-none text-success">+{{ changeStats.additions }}</span>
					</div>
				</Transition>
			</slot>
		</header>

		<div class="grid min-w-0">
			<Transition
				enter-active-class="transition-opacity duration-150 ease-out motion-reduce:transition-none"
				enter-from-class="opacity-0"
				enter-to-class="opacity-100"
				leave-active-class="transition-opacity duration-100 ease-in motion-reduce:transition-none"
				leave-from-class="opacity-100"
				leave-to-class="opacity-0"
			>
				<div
					v-if="activeMode !== 'diff'"
					:key="activeMode"
					class="col-start-1 row-start-1 min-h-14 overflow-auto whitespace-pre-wrap break-words bg-secondary/20 px-4 py-3.5"
					:aria-label="completeTextLabel"
				>
					<pre v-if="resolvedFormat === 'code'" class="m-0 min-w-max whitespace-pre font-mono text-[0.8125rem] leading-[1.65]"><code>{{ completeText }}</code></pre>
					<div v-else role="document">{{ completeText }}</div>
				</div>

				<div
					v-else-if="resolvedView === 'inline'"
					key="diff-inline"
					class="col-start-1 row-start-1 min-h-14 whitespace-pre-wrap break-words bg-secondary/20 px-4 py-3.5"
					:class="resolvedFormat === 'code' ? 'font-mono text-[0.8125rem]' : ''"
				>
					<template v-for="segment in inlineSegments" :key="segment.id">
						<ins
							v-if="segment.type === 'added'"
							class="rounded-[0.2rem] bg-success/15 px-[0.14em] py-[0.08em] text-success no-underline [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
						>{{ segment.value }}</ins>
						<del
							v-else-if="segment.type === 'removed'"
							class="rounded-[0.2rem] bg-destructive/15 px-[0.14em] py-[0.08em] text-destructive decoration-[1px] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
						>{{ segment.value }}</del>
						<span v-else>{{ segment.value }}</span>
					</template>
				</div>

				<div
					v-else-if="resolvedView === 'unified'"
					key="diff-unified"
					class="col-start-1 row-start-1 min-w-0 overflow-auto"
				>
					<div
						class="w-max min-w-full text-xs leading-[1.65]"
						:class="resolvedFormat === 'code' ? 'font-mono' : ''"
						role="table"
						aria-label="Unified text changes"
					>
						<div
							v-for="row in unifiedRows"
							:key="row.id"
							class="grid min-h-7 grid-cols-[1.75rem_3.75rem_minmax(20rem,1fr)] border-t border-border/50 first:border-t-0"
							:class="lineBackgroundClass(row.type)"
							role="row"
						>
							<span
								class="select-none px-[0.45rem] py-[0.14rem] text-center font-extrabold tabular-nums"
								:class="lineSignClass(row.type)"
								aria-hidden="true"
							>{{ rowSign(row) }}</span>
							<span
								class="select-none px-[0.45rem] py-[0.14rem] text-right text-muted-fg tabular-nums"
								:aria-label="`Lines ${rowNumbers(row)}`"
							>{{ rowNumbers(row) }}</span>
							<code class="block whitespace-pre border-l border-border/60 px-3 py-[0.14rem]" role="cell">
								<template v-for="segment in row.segments" :key="segment.id">
									<mark
										v-if="segment.type === row.type && row.type !== 'same'"
										class="rounded-[0.18rem] px-[0.1em] py-[0.05em] font-[inherit] text-inherit"
										:class="markBackgroundClass(row.type)"
									>{{ segment.value }}</mark>
									<span v-else>{{ segment.value }}</span>
								</template>
							</code>
						</div>
					</div>
				</div>

				<div v-else key="diff-split" class="col-start-1 row-start-1 min-w-0 overflow-auto">
					<div
						class="w-max min-w-max text-xs leading-[1.65]"
						:class="resolvedFormat === 'code' ? 'font-mono' : ''"
						role="table"
						aria-label="Side-by-side text changes"
					>
						<div
							v-for="row in splitRows"
							:key="row.id"
							class="grid grid-cols-[minmax(20rem,1fr)_minmax(20rem,1fr)] border-t border-border/50 first:border-t-0"
							role="row"
						>
							<div
								class="grid min-h-7 grid-cols-[2.5rem_minmax(17.5rem,1fr)]"
								:class="lineBackgroundClass(row.original?.type || 'blank')"
								role="cell"
							>
								<span class="select-none px-[0.45rem] py-[0.14rem] text-right text-muted-fg tabular-nums">{{ row.original?.originalNumber || '' }}</span>
								<code class="block whitespace-pre border-l border-border/60 px-2.5 py-[0.14rem]">
									<template v-for="segment in row.original?.segments || []" :key="segment.id">
										<mark
											v-if="segment.type === 'removed'"
											class="rounded-[0.18rem] bg-destructive/20 px-[0.1em] py-[0.05em] font-[inherit] text-inherit"
										>{{ segment.value }}</mark>
										<span v-else>{{ segment.value }}</span>
									</template>
								</code>
							</div>
							<div
								class="grid min-h-7 grid-cols-[2.5rem_minmax(17.5rem,1fr)] border-l border-border"
								:class="lineBackgroundClass(row.proposed?.type || 'blank')"
								role="cell"
							>
								<span class="select-none px-[0.45rem] py-[0.14rem] text-right text-muted-fg tabular-nums">{{ row.proposed?.proposedNumber || '' }}</span>
								<code class="block whitespace-pre border-l border-border/60 px-2.5 py-[0.14rem]">
									<template v-for="segment in row.proposed?.segments || []" :key="segment.id">
										<mark
											v-if="segment.type === 'added'"
											class="rounded-[0.18rem] bg-success/25 px-[0.1em] py-[0.05em] font-[inherit] text-inherit"
										>{{ segment.value }}</mark>
										<span v-else>{{ segment.value }}</span>
									</template>
								</code>
							</div>
						</div>
					</div>
				</div>
			</Transition>
		</div>
	</figure>
</template>

<style scoped>
@container (max-width: 32rem) {
	[data-diff-header] {
		gap: 0.55rem;
		grid-template-columns: minmax(0, 1fr) auto;
	}

	[data-mode-switcher] {
		grid-column: 1 / -1;
		grid-row: 2;
		width: 100%;
	}

	[data-mode-switcher] button {
		flex: 1;
	}
}
</style>
