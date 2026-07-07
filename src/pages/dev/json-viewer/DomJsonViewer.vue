<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import DomIconButton from '../../components/icon-button/DomIconButton.vue';
import DomTooltip from '../../components/tooltip/DomTooltip.vue';
import DomCodeBlock from '../code-block/DomCodeBlock.vue';

const copyIcon = 'M8 8h10v10H8V8Zm-4-4h10v3H7v7H4V4Z';
const chevronIcon = 'M9 6l6 6-6 6';
const modeValues = ['tree', 'code'];

defineOptions({
	__doc: {
		name: 'JSON viewer',
		tag: '<DomJsonViewer>',
		description: 'A read-only JSON viewer with a collapsible tree, formatted source view, syntax highlighting, and copy support.',
		icon: 'M5 5h5v5H5V5Zm9 0h5v5h-5V5ZM5 14h5v5H5v-5Zm9 0h5v5h-5v-5Z',
		events: [
			{ name: 'update:mode', payload: "'tree' | 'code'", description: 'Fired when the built-in mode toggle changes the active view.' },
			{ name: 'copy', payload: 'string', description: 'Fired after formatted JSON is copied to the clipboard.' },
		],
		playground: {
			initial: {
				title: 'API response',
				filename: 'response.json',
				value: {
					ok: true,
					data: {
						id: 'project_dom_studio',
						status: 'active',
						features: ['components', 'blocks', 'theme'],
					},
				},
			},
		},
	},
});

const props = defineProps({
	value: {
		default: null,
		_edit: { component: 'DomJsonInput', description: 'A JSON-serializable value, or a raw JSON string when parseStrings is enabled.' },
	},
	title: {
		type: String,
		default: '',
		_edit: { description: 'Optional label rendered in the viewer toolbar.' },
	},
	description: {
		type: String,
		default: '',
		_edit: { description: 'Optional supporting text rendered below the title.' },
	},
	filename: {
		type: String,
		default: '',
		_edit: { description: 'Optional filename shown in the toolbar and used by the source view.' },
	},
	mode: {
		type: String,
		default: 'tree',
		_edit: { options: ['tree', 'code'], description: 'Initial display mode.' },
	},
	showModeToggle: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the Tree / Code segmented control.' },
	},
	showToolbar: {
		type: Boolean,
		default: true,
		_edit: { description: 'Render the viewer toolbar.' },
	},
	copyable: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show a copy button when the toolbar is visible.' },
	},
	parseStrings: {
		type: Boolean,
		default: true,
		_edit: { description: 'Treat string values as raw JSON source and format them when they parse.' },
	},
	indent: {
		type: Number,
		default: 2,
		_edit: { description: 'Spaces used when formatting JSON in code mode and clipboard output.' },
	},
	expandedDepth: {
		type: Number,
		default: 5,
		_edit: { description: 'Default branch depth to expand in tree mode. Use 0 to collapse everything.' },
	},
	previewLines: {
		type: Number,
		default: 0,
		_edit: { description: 'Maximum visible lines before the viewer scrolls. Use 0 for no cap.' },
	},
	density: {
		type: String,
		default: 'comfortable',
		_edit: { options: ['compact', 'comfortable'], description: 'Tree row spacing.' },
	},
	framed: {
		type: Boolean,
		default: true,
		_edit: { description: 'Render the standard card frame around the viewer.' },
	},
	emptyText: {
		type: String,
		default: 'No JSON value.',
		_edit: { description: 'Message shown when the supplied value is empty.' },
	},
});

const emit = defineEmits(['update:mode', 'copy']);
const internalMode = ref(normalizeMode(props.mode));
const expandedPaths = ref(new Set());
const copyStatus = ref('idle');
let copyTimer = 0;

const requestedMode = computed(resolveRequestedMode);
const viewerState = computed(resolveViewerState);
const formattedCode = computed(resolveFormattedCode);
const expansionSeedKey = computed(resolveExpansionSeedKey);
const treeRows = computed(resolveTreeRows);
const bodyStyle = computed(resolveBodyStyle);
const frameClasses = computed(resolveFrameClasses);
const showToolbarContent = computed(resolveShowToolbarContent);
const displayTitle = computed(resolveDisplayTitle);
const copyLabel = computed(resolveCopyLabel);

watch(requestedMode, syncRequestedMode, { immediate: true });
watch(expansionSeedKey, seedDefaultExpandedPaths, { immediate: true });

onBeforeUnmount(clearCopyTimer);

/**
 * Resolves the normalized mode requested by the public prop.
 *
 * @returns {'tree' | 'code'} Supported display mode.
 */
function resolveRequestedMode() {
	return normalizeMode(props.mode);
}

/**
 * Creates the parsed value and formatted source used by both viewer modes.
 *
 * @returns {{ value: unknown, code: string, invalid: boolean, error: string }} Normalized viewer state.
 */
function resolveViewerState() {
	return normalizeSourceValue(props.value, props.parseStrings, props.indent);
}

/**
 * Returns the formatted source currently shown in code mode and copied to the clipboard.
 *
 * @returns {string} Display-ready JSON source.
 */
function resolveFormattedCode() {
	return viewerState.value.code;
}

/**
 * Builds a stable key that reseeds branch expansion when the input or default depth changes.
 *
 * @returns {string} Expansion seed key.
 */
function resolveExpansionSeedKey() {
	return `${props.expandedDepth}:${formattedCode.value}`;
}

/**
 * Flattens the parsed JSON tree into renderable rows.
 *
 * @returns {Array<object>} Rows for tree mode.
 */
function resolveTreeRows() {
	return flattenJsonRows(viewerState.value.value, expandedPaths.value);
}

/**
 * Calculates the scroll clamp for long tree views.
 *
 * @returns {Record<string, string>} Inline style object.
 */
function resolveBodyStyle() {
	if (!props.previewLines) return {};
	const lineHeight = props.density === 'compact' ? 20 : 22;
	return { maxHeight: `${Math.round((props.previewLines * lineHeight) + 24)}px` };
}

/**
 * Resolves the wrapper frame classes from the framed prop.
 *
 * @returns {Array<string>} Tailwind class list.
 */
function resolveFrameClasses() {
	return [
		'w-full min-w-0 overflow-hidden',
		props.framed ? 'rounded-xl border border-border skin-card' : '',
	];
}

/**
 * Determines whether the toolbar has anything useful to render.
 *
 * @returns {boolean} True when toolbar content should be visible.
 */
function resolveShowToolbarContent() {
	return Boolean(props.showToolbar && (displayTitle.value || props.description || props.showModeToggle || props.copyable));
}

/**
 * Chooses the most useful toolbar title.
 *
 * @returns {string} Title text.
 */
function resolveDisplayTitle() {
	return props.title || props.filename;
}

/**
 * Resolves the current accessible label for the copy control.
 *
 * @returns {string} Copy button label.
 */
function resolveCopyLabel() {
	if (copyStatus.value === 'copied') return 'Copied JSON';
	if (copyStatus.value === 'failed') return 'Copy failed';
	return 'Copy JSON';
}

/**
 * Normalizes unknown mode values to a supported display mode.
 *
 * @param {string} mode Candidate mode.
 * @returns {'tree' | 'code'} Supported mode.
 */
function normalizeMode(mode) {
	return modeValues.includes(mode) ? mode : 'tree';
}

/**
 * Synchronizes internal mode when the controlled prop changes.
 *
 * @param {'tree' | 'code'} mode Normalized mode.
 * @returns {void}
 */
function syncRequestedMode(mode) {
	internalMode.value = mode;
}

/**
 * Sets the active display mode and notifies parent components.
 *
 * @param {'tree' | 'code'} mode Next mode.
 * @returns {void}
 */
function setMode(mode) {
	const normalized = normalizeMode(mode);
	internalMode.value = normalized;
	emit('update:mode', normalized);
}

/**
 * Resets expanded branches from the current value and expanded-depth prop.
 *
 * @returns {void}
 */
function seedDefaultExpandedPaths() {
	const paths = new Set();
	collectDefaultExpandedPaths(viewerState.value.value, paths, {
		depth: 0,
		maxDepth: Math.max(0, Number(props.expandedDepth) || 0),
		path: '$',
		seen: new WeakSet(),
	});
	expandedPaths.value = paths;
}

/**
 * Toggles a branch row open or closed.
 *
 * @param {object} row Rendered branch row.
 * @returns {void}
 */
function toggleRow(row) {
	if (!row?.toggleable) return;
	const next = new Set(expandedPaths.value);
	if (next.has(row.path)) next.delete(row.path);
	else next.add(row.path);
	expandedPaths.value = next;
}

/**
 * Copies the formatted JSON source to the user's clipboard.
 *
 * @returns {Promise<void>} Resolves once the copy attempt has completed.
 */
async function copyJson() {
	if (!props.copyable) return;
	try {
		await writeClipboardText(formattedCode.value);
		markCopyStatus('copied');
		emit('copy', formattedCode.value);
	} catch {
		markCopyStatus('failed');
	}
}

/**
 * Updates the transient copy status and clears it after a short delay.
 *
 * @param {'idle' | 'copied' | 'failed'} status Copy status.
 * @returns {void}
 */
function markCopyStatus(status) {
	clearCopyTimer();
	copyStatus.value = status;
	if (typeof window === 'undefined') return;
	copyTimer = window.setTimeout(resetCopyStatus, 1400);
}

/**
 * Clears any pending copy-status timeout.
 *
 * @returns {void}
 */
function clearCopyTimer() {
	if (!copyTimer || typeof window === 'undefined') return;
	window.clearTimeout(copyTimer);
	copyTimer = 0;
}

/**
 * Returns the copy affordance to its idle state after transient feedback.
 *
 * @returns {void}
 */
function resetCopyStatus() {
	copyStatus.value = 'idle';
	copyTimer = 0;
}

/**
 * Writes text to the clipboard, using a textarea fallback for older browsers.
 *
 * @param {string} text Text to copy.
 * @returns {Promise<void>} Resolves when the text is copied.
 */
async function writeClipboardText(text) {
	if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text);
		return;
	}
	copyWithTextarea(text);
}

/**
 * Copies text through a temporary textarea for browsers without Clipboard API support.
 *
 * @param {string} text Text to copy.
 * @returns {void}
 */
function copyWithTextarea(text) {
	if (typeof document === 'undefined') throw new Error('Clipboard is unavailable.');
	const textarea = document.createElement('textarea');
	textarea.value = text;
	textarea.setAttribute('readonly', '');
	textarea.style.position = 'fixed';
	textarea.style.inset = '0 auto auto -9999px';
	document.body.appendChild(textarea);
	textarea.select();
	const copied = document.execCommand('copy');
	document.body.removeChild(textarea);
	if (!copied) throw new Error('Copy command failed.');
}

/**
 * Normalizes any supported input into canonical JSON-ish state.
 *
 * @param {unknown} source Source value or raw JSON text.
 * @param {boolean} parseStrings Whether strings should be parsed as JSON.
 * @param {number} indent Formatting indentation.
 * @returns {{ value: unknown, code: string, invalid: boolean, error: string }} Normalized state.
 */
function normalizeSourceValue(source, parseStrings, indent) {
	if (typeof source === 'string' && parseStrings) {
		return normalizeRawJsonString(source, indent);
	}
	return normalizeSerializableValue(source, indent);
}

/**
 * Parses and formats raw JSON text while preserving invalid source for diagnosis.
 *
 * @param {string} source Raw JSON source.
 * @param {number} indent Formatting indentation.
 * @returns {{ value: unknown, code: string, invalid: boolean, error: string }} Normalized state.
 */
function normalizeRawJsonString(source, indent) {
	if (!source.trim()) {
		return { value: null, code: '', invalid: false, error: '' };
	}
	try {
		const parsed = JSON.parse(source);
		return normalizeSerializableValue(parsed, indent);
	} catch (error) {
		return {
			value: source,
			code: source,
			invalid: true,
			error: error?.message || 'Invalid JSON.',
		};
	}
}

/**
 * Formats a JSON-serializable value and parses it back into canonical tree data.
 *
 * @param {unknown} source Source value.
 * @param {number} indent Formatting indentation.
 * @returns {{ value: unknown, code: string, invalid: boolean, error: string }} Normalized state.
 */
function normalizeSerializableValue(source, indent) {
	const code = stringifyJson(source, indent);
	try {
		return {
			value: code ? JSON.parse(code) : null,
			code,
			invalid: false,
			error: '',
		};
	} catch (error) {
		return {
			value: source == null ? null : String(source),
			code: source == null ? '' : String(source),
			invalid: true,
			error: error?.message || 'Value could not be serialized as JSON.',
		};
	}
}

/**
 * Safely stringifies values that may contain unsupported JSON data.
 *
 * @param {unknown} value Source value.
 * @param {number} indent Formatting indentation.
 * @returns {string} JSON source.
 */
function stringifyJson(value, indent) {
	if (value === undefined) return '';
	const json = JSON.stringify(value, createJsonReplacer(), clampIndent(indent));
	return json == null ? '' : json;
}

/**
 * Limits JSON indentation to a readable browser-safe range.
 *
 * @param {number} indent Candidate indentation.
 * @returns {number} Clamped indentation.
 */
function clampIndent(indent) {
	const numeric = Number(indent);
	if (!Number.isFinite(numeric)) return 2;
	return Math.min(8, Math.max(0, Math.round(numeric)));
}

/**
 * Creates a JSON replacer that protects the viewer from circular or unsupported values.
 *
 * @returns {(key: string, value: unknown) => unknown} JSON.stringify replacer.
 */
function createJsonReplacer() {
	const seen = new WeakSet();

	/**
	 * Normalizes edge-case values while JSON.stringify walks the tree.
	 *
	 * @param {string} key Object key supplied by JSON.stringify.
	 * @param {unknown} value Candidate value.
	 * @returns {unknown} JSON-safe replacement value.
	 */
	return function jsonReplacer(key, value) {
		void key;
		if (typeof value === 'bigint') return value.toString();
		if (typeof value === 'function') return `[Function${value.name ? ` ${value.name}` : ''}]`;
		if (typeof value === 'symbol') return value.toString();
		if (!value || typeof value !== 'object') return value;
		if (seen.has(value)) return '[Circular]';
		seen.add(value);
		return value;
	};
}

/**
 * Builds a flat row list for a JSON value.
 *
 * @param {unknown} value Root JSON value.
 * @param {Set<string>} expanded Expanded branch paths.
 * @returns {Array<object>} Renderable rows.
 */
function flattenJsonRows(value, expanded) {
	if (value == null && !formattedCode.value) {
		return [{ type: 'empty', id: '$empty', depth: 0, text: props.emptyText }];
	}
	const rows = [];
	appendValueRows(rows, {
		value,
		path: '$',
		depth: 0,
		propertyKey: '',
		parentKind: '',
		trailing: false,
	}, expanded);
	return rows;
}

/**
 * Appends tree rows for any JSON value.
 *
 * @param {Array<object>} rows Mutable output rows.
 * @param {object} context Value render context.
 * @param {Set<string>} expanded Expanded branch paths.
 * @returns {void}
 */
function appendValueRows(rows, context, expanded) {
	const kind = jsonKind(context.value);
	if (kind === 'array' || kind === 'object') {
		appendBranchRows(rows, context, expanded, kind);
		return;
	}
	rows.push({
		type: 'leaf',
		id: context.path,
		depth: context.depth,
		propertyKey: context.parentKind === 'object' ? context.propertyKey : '',
		valueKind: kind,
		value: scalarDisplayValue(context.value, kind),
		trailing: context.trailing,
	});
}

/**
 * Appends expandable rows for objects and arrays.
 *
 * @param {Array<object>} rows Mutable output rows.
 * @param {object} context Value render context.
 * @param {Set<string>} expanded Expanded branch paths.
 * @param {'array' | 'object'} kind Branch kind.
 * @returns {void}
 */
function appendBranchRows(rows, context, expanded, kind) {
	const entries = branchEntries(context.value, kind, context.path);
	const openToken = kind === 'array' ? '[' : '{';
	const closeToken = kind === 'array' ? ']' : '}';
	const propertyKey = context.parentKind === 'object' ? context.propertyKey : '';

	if (!entries.length) {
		rows.push({
			type: 'leaf',
			id: context.path,
			depth: context.depth,
			propertyKey,
			valueKind: kind,
			value: `${openToken}${closeToken}`,
			trailing: context.trailing,
		});
		return;
	}

	const isExpanded = expanded.has(context.path);
	rows.push({
		type: 'branch',
		id: `${context.path}:open`,
		path: context.path,
		depth: context.depth,
		propertyKey,
		openToken,
		closeToken,
		expanded: isExpanded,
		toggleable: true,
		summary: branchSummary(entries.length, kind),
		trailing: context.trailing,
	});

	if (!isExpanded) return;

	for (let index = 0; index < entries.length; index += 1) {
		const entry = entries[index];
		appendValueRows(rows, {
			value: entry.value,
			path: entry.path,
			depth: context.depth + 1,
			propertyKey: entry.key,
			parentKind: kind,
			trailing: index < entries.length - 1,
		}, expanded);
	}

	rows.push({
		type: 'closing',
		id: `${context.path}:close`,
		depth: context.depth,
		closeToken,
		trailing: context.trailing,
	});
}

/**
 * Collects branch paths that should be open by default.
 *
 * @param {unknown} value Current JSON value.
 * @param {Set<string>} paths Mutable path set.
 * @param {{ depth: number, maxDepth: number, path: string, seen: WeakSet<object> }} options Traversal options.
 * @returns {void}
 */
function collectDefaultExpandedPaths(value, paths, options) {
	if (!isBranchValue(value)) return;
	if (options.seen.has(value)) return;
	options.seen.add(value);
	if (options.depth >= options.maxDepth) return;
	paths.add(options.path);
	const kind = Array.isArray(value) ? 'array' : 'object';
	const entries = branchEntries(value, kind, options.path);
	for (const entry of entries) {
		collectDefaultExpandedPaths(entry.value, paths, {
			depth: options.depth + 1,
			maxDepth: options.maxDepth,
			path: entry.path,
			seen: options.seen,
		});
	}
}

/**
 * Returns true when a value has nested JSON children.
 *
 * @param {unknown} value Candidate value.
 * @returns {boolean} True for arrays and plain objects.
 */
function isBranchValue(value) {
	return Array.isArray(value) || Boolean(value && typeof value === 'object');
}

/**
 * Resolves the viewer token kind for a JSON value.
 *
 * @param {unknown} value Candidate value.
 * @returns {'array' | 'object' | 'string' | 'number' | 'boolean' | 'null'} Token kind.
 */
function jsonKind(value) {
	if (Array.isArray(value)) return 'array';
	if (value === null) return 'null';
	if (typeof value === 'object') return 'object';
	if (typeof value === 'number') return 'number';
	if (typeof value === 'boolean') return 'boolean';
	return 'string';
}

/**
 * Builds child entries for an object or array branch.
 *
 * @param {unknown} value Branch value.
 * @param {'array' | 'object'} kind Branch kind.
 * @param {string} parentPath Stable parent path.
 * @returns {Array<{ key: string, path: string, value: unknown }>} Child entries.
 */
function branchEntries(value, kind, parentPath) {
	const entries = [];
	if (kind === 'array') {
		for (let index = 0; index < value.length; index += 1) {
			entries.push({
				key: String(index),
				path: `${parentPath}[${index}]`,
				value: value[index],
			});
		}
		return entries;
	}
	for (const [key, item] of Object.entries(value)) {
		entries.push({
			key,
			path: jsonChildPath(parentPath, key),
			value: item,
		});
	}
	return entries;
}

/**
 * Creates a child path from a parent path and property key.
 *
 * @param {string} parent Parent path.
 * @param {string} key Property key.
 * @returns {string} Stable child path.
 */
function jsonChildPath(parent, key) {
	return `${parent}.${encodeURIComponent(key)}`;
}

/**
 * Builds the collapsed branch summary text.
 *
 * @param {number} count Child count.
 * @param {'array' | 'object'} kind Branch kind.
 * @returns {string} Summary label.
 */
function branchSummary(count, kind) {
	const noun = kind === 'array' ? 'item' : 'key';
	return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/**
 * Formats scalar values as JSON tokens.
 *
 * @param {unknown} value Scalar value.
 * @param {string} kind Token kind.
 * @returns {string} Display text.
 */
function scalarDisplayValue(value, kind) {
	if (kind === 'string') return JSON.stringify(value);
	if (kind === 'null') return 'null';
	return String(value);
}

/**
 * Resolves token color classes for syntax-like tree rendering.
 *
 * @param {string} kind Token kind.
 * @returns {string} Syntax token class string.
 */
function tokenClass(kind) {
	if (kind === 'string') return 'dom-json-viewer__token-string';
	if (kind === 'number') return 'dom-json-viewer__token-number';
	if (kind === 'boolean') return 'dom-json-viewer__token-boolean';
	if (kind === 'null') return 'dom-json-viewer__token-null';
	if (kind === 'key') return 'dom-json-viewer__token-key';
	if (kind === 'punctuation') return 'dom-json-viewer__token-punctuation';
	if (kind === 'muted') return 'dom-json-viewer__token-muted';
	return 'dom-json-viewer__token-text';
}
</script>

<template>
	<div class="dom-json-viewer" :class="frameClasses">
		<div
			v-if="showToolbarContent"
			class="flex flex-col gap-3 border-b border-border bg-secondary/45 px-2 py-2 sm:flex-row sm:items-center sm:justify-between"
		>
			<div v-if="displayTitle || description" class="min-w-0">
				<p v-if="displayTitle" class="truncate text-sm font-semibold text-canvas-fg">{{ displayTitle }}</p>
				<p v-if="description" class="mt-0.5 text-xs leading-5 text-muted-fg">{{ description }}</p>
			</div>
			<div class="flex shrink-0 items-center gap-2">
				<div
					v-if="showModeToggle"
					class="inline-flex rounded-lg border border-border bg-canvas p-0.5"
					aria-label="JSON viewer mode"
				>
					<button
						type="button"
						class="rounded-md px-2.5 py-1 text-xs font-medium transition"
						:class="internalMode === 'tree' ? 'bg-secondary text-canvas-fg shadow-sm' : 'text-muted-fg hover:text-canvas-fg'"
						:aria-pressed="internalMode === 'tree'"
						@click="setMode('tree')"
					>
						Tree
					</button>
					<button
						type="button"
						class="rounded-md px-2.5 py-1 text-xs font-medium transition"
						:class="internalMode === 'code' ? 'bg-secondary text-canvas-fg shadow-sm' : 'text-muted-fg hover:text-canvas-fg'"
						:aria-pressed="internalMode === 'code'"
						@click="setMode('code')"
					>
						Code
					</button>
				</div>
				<DomTooltip v-if="copyable" :text="copyLabel">
					<DomIconButton
						:label="copyLabel"
						:icon="copyIcon"
						size="sm"
						variant="ghost"
						:active="copyStatus === 'copied'"
						@click="copyJson"
					/>
				</DomTooltip>
			</div>
		</div>

		<div
			v-if="viewerState.invalid"
			class="border-b border-destructive/25 bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive"
		>
			{{ viewerState.error }}
		</div>

		<div class="dom-json-viewer__body min-w-0 overflow-auto" :style="bodyStyle">
			<DomCodeBlock
				v-if="internalMode === 'code'"
				:code="formattedCode"
				:filename="filename"
				:preview-lines="0"
				:framed="false"
				lang="json"
			/>

			<div
				v-else
				class="dom-json-viewer__tree min-w-max py-3 font-mono text-[12.5px]"
				:class="density === 'compact' ? 'leading-5' : 'leading-[1.375rem]'"
			>
				<div
					v-for="row in treeRows"
					:key="row.id"
					class="group flex items-start whitespace-pre px-3"
					:class="row.type === 'empty' ? tokenClass('muted') : 'hover:bg-secondary/60'"
				>
					<div
						class="flex min-w-0 items-start"
						:style="{ paddingLeft: `${row.depth * 1.125}rem` }"
					>
						<button
							v-if="row.toggleable"
							type="button"
							class="-ml-1 mr-1 mt-[0.125rem] grid size-4 shrink-0 place-items-center rounded text-muted-fg transition hover:bg-secondary hover:text-canvas-fg"
							:aria-label="row.expanded ? 'Collapse JSON branch' : 'Expand JSON branch'"
							@click="toggleRow(row)"
						>
							<svg
								viewBox="0 0 24 24"
								class="size-3 transition-transform"
								:class="row.expanded ? 'rotate-90' : ''"
								fill="none"
								aria-hidden="true"
							>
								<path :d="chevronIcon" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</button>
						<span v-else class="mr-1 size-4 shrink-0"></span>

						<span v-if="row.type === 'empty'">{{ row.text }}</span>

						<template v-else-if="row.type === 'closing'">
							<span :class="tokenClass('punctuation')">{{ row.closeToken }}</span>
							<span v-if="row.trailing" :class="tokenClass('punctuation')">,</span>
						</template>

						<template v-else>
							<span v-if="row.propertyKey" :class="tokenClass('key')">{{ JSON.stringify(row.propertyKey) }}</span>
							<span v-if="row.propertyKey" class="mr-1" :class="tokenClass('punctuation')">:</span>
							<template v-if="row.type === 'branch'">
								<span :class="tokenClass('punctuation')">{{ row.openToken }}</span>
								<template v-if="!row.expanded">
									<span class="px-1" :class="tokenClass('muted')">...</span>
									<span :class="tokenClass('punctuation')">{{ row.closeToken }}</span>
									<span v-if="row.trailing" :class="tokenClass('punctuation')">,</span>
									<span class="ml-2 text-[11px]" :class="tokenClass('muted')">{{ row.summary }}</span>
								</template>
							</template>
							<template v-else>
								<span :class="tokenClass(row.valueKind)">{{ row.value }}</span>
								<span v-if="row.trailing" :class="tokenClass('punctuation')">,</span>
							</template>
						</template>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.dom-json-viewer {
	--dom-json-token-background: #ffffff;
	--dom-json-token-text: #000000;
	--dom-json-token-key: #0451a5;
	--dom-json-token-string: #a31515;
	--dom-json-token-number: #098658;
	--dom-json-token-boolean: #0000ff;
	--dom-json-token-null: #0000ff;
	--dom-json-token-punctuation: #000000;
	--dom-json-token-muted: #6a737d;
}

:global([data-theme="dark"] .dom-json-viewer) {
	--dom-json-token-background: #1e1e1e;
	--dom-json-token-text: #d4d4d4;
	--dom-json-token-key: #9cdcfe;
	--dom-json-token-string: #ce9178;
	--dom-json-token-number: #b5cea8;
	--dom-json-token-boolean: #569cd6;
	--dom-json-token-null: #569cd6;
	--dom-json-token-punctuation: #d4d4d4;
	--dom-json-token-muted: #858585;
}

.dom-json-viewer__body {
	background-color: var(--dom-json-token-background);
}

.dom-json-viewer__tree,
.dom-json-viewer__token-text {
	color: var(--dom-json-token-text);
}

.dom-json-viewer__token-key {
	color: var(--dom-json-token-key);
}

.dom-json-viewer__token-string {
	color: var(--dom-json-token-string);
}

.dom-json-viewer__token-number {
	color: var(--dom-json-token-number);
}

.dom-json-viewer__token-boolean {
	color: var(--dom-json-token-boolean);
}

.dom-json-viewer__token-null {
	color: var(--dom-json-token-null);
}

.dom-json-viewer__token-punctuation {
	color: var(--dom-json-token-punctuation);
}

.dom-json-viewer__token-muted {
	color: var(--dom-json-token-muted);
}
</style>
