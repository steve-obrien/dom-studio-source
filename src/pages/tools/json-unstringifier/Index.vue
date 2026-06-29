<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import DomButton from '../../components/button/DomButton.vue';
import DomSplitterPanel from '../../components/splitter-panel/DomSplitterPanel.vue';

const maxUnstringifyDepth = 6;
const jsonTokenPattern = /"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/g;
const samplePayload = {
	keywords: [
		{
			keyword: 'AI app components',
			generatedFrom: 'target audience',
			generatedFromDetail: 'AI app builders looking for reusable interface components',
		},
		{
			keyword: 'headless web components',
			generatedFrom: 'business description',
			generatedFromDetail: 'source-owned UI system with headless web components',
		},
		{
			keyword: 'Vue UI library',
			generatedFrom: 'business description',
			generatedFromDetail: 'polished Vue wrappers for building real app interfaces',
		},
		{
			keyword: 'application UI blocks',
			generatedFrom: 'business description',
			generatedFromDetail: 'application blocks for dashboards, forms, navigation, and layouts',
		},
		{
			keyword: 'LLM ready documentation',
			generatedFrom: 'business description',
			generatedFromDetail: 'LLM-ready documentation connected to component contracts and examples',
		},
		{
			keyword: 'form schema builder',
			generatedFrom: 'business description',
			generatedFromDetail: 'form schemas for building connected product interfaces',
		},
		{
			keyword: 'dashboard UI components',
			generatedFrom: 'business description',
			generatedFromDetail: 'support for dashboards as a core product surface',
		},
		{
			keyword: 'command palette component',
			generatedFrom: 'business description',
			generatedFromDetail: 'support for command palettes in app interfaces',
		},
		{
			keyword: 'mobile app shells',
			generatedFrom: 'business description',
			generatedFromDetail: 'mobile shells and mobile layouts included in the library',
		},
		{
			keyword: 'source owned UI',
			generatedFrom: 'business description',
			generatedFromDetail: 'source-owned UI system for product teams and AI app builders',
		},
	],
};

const inputText = ref(createSampleInput());
const parseResult = ref(parseJsonInput(inputText.value));
const copyState = ref('');
const splitterOrientation = ref('horizontal');
const splitterStartSize = ref(520);
let copyTimer = null;
let splitterMediaQuery = null;

const prettyOutput = computed(readPrettyOutput);
const highlightedOutput = computed(readHighlightedOutput);
const statusLabel = computed(readStatusLabel);
const statusClass = computed(readStatusClass);

watch(inputText, refreshParseResult, { immediate: true });
onMounted(attachSplitterMediaQuery);
onBeforeUnmount(detachSplitterMediaQuery);
onBeforeUnmount(clearCopyTimer);

/**
 * Creates the default demo value as JSON that has been encoded into a JSON string.
 *
 * @returns {string} A stringified JSON document ready to paste into the tool.
 */
function createSampleInput() {
	return JSON.stringify(JSON.stringify(samplePayload));
}

/**
 * Updates the parse result whenever the editor content changes.
 *
 * @param {string} value The latest raw editor value.
 * @returns {void}
 */
function refreshParseResult(value) {
	parseResult.value = parseJsonInput(value);
}

/**
 * Reads the formatted JSON output from the current parse result.
 *
 * @returns {string} Pretty printed JSON, or an empty string when no output exists.
 */
function readPrettyOutput() {
	if (!parseResult.value.ok || parseResult.value.empty) return '';
	return formatJsonValue(parseResult.value.value);
}

/**
 * Reads highlighted markup for the formatted JSON output.
 *
 * @returns {string} HTML markup containing escaped JSON tokens.
 */
function readHighlightedOutput() {
	if (!prettyOutput.value) return '';
	return highlightJson(prettyOutput.value);
}

/**
 * Produces the compact parser status label shown above the editors.
 *
 * @returns {string} Human-readable parser state.
 */
function readStatusLabel() {
	if (parseResult.value.empty) return 'Waiting for input';
	if (!parseResult.value.ok) return 'Invalid JSON';
	if (parseResult.value.unwrapped > 0) return `Unstringified ${formatLayerCount(parseResult.value.unwrapped)}`;
	return 'Pretty JSON';
}

/**
 * Produces the CSS classes used to present parser state.
 *
 * @returns {string} Utility classes for the status pill.
 */
function readStatusClass() {
	if (parseResult.value.empty) return 'border-border bg-secondary text-muted-fg';
	if (!parseResult.value.ok) return 'border-destructive/30 bg-destructive/10 text-destructive';
	return 'border-success/30 bg-success/10 text-success';
}

/**
 * Attaches the media query that switches the splitter between columns and rows.
 *
 * @returns {void}
 */
function attachSplitterMediaQuery() {
	if (typeof window === 'undefined') return;
	splitterMediaQuery = window.matchMedia('(min-width: 1024px)');
	syncSplitterOrientation(splitterMediaQuery);

	if (typeof splitterMediaQuery.addEventListener === 'function') {
		splitterMediaQuery.addEventListener('change', syncSplitterOrientation);
		return;
	}

	splitterMediaQuery.addListener?.(syncSplitterOrientation);
}

/**
 * Detaches the splitter media query listener.
 *
 * @returns {void}
 */
function detachSplitterMediaQuery() {
	if (!splitterMediaQuery) return;

	if (typeof splitterMediaQuery.removeEventListener === 'function') {
		splitterMediaQuery.removeEventListener('change', syncSplitterOrientation);
	} else {
		splitterMediaQuery.removeListener?.(syncSplitterOrientation);
	}

	splitterMediaQuery = null;
}

/**
 * Updates the splitter orientation and default leading pane size for the viewport.
 *
 * @param {MediaQueryList | MediaQueryListEvent} query The media query state.
 * @returns {void}
 */
function syncSplitterOrientation(query) {
	const nextOrientation = query.matches ? 'horizontal' : 'vertical';
	if (splitterOrientation.value === nextOrientation) return;
	splitterOrientation.value = nextOrientation;
	splitterStartSize.value = nextOrientation === 'horizontal' ? 520 : 420;
}

/**
 * Parses direct JSON, JSON strings, and raw escaped JSON string content.
 *
 * @param {string} source The raw value pasted into the editor.
 * @returns {{ ok: boolean, empty: boolean, value?: unknown, unwrapped: number, error: string }} Parse result metadata.
 */
function parseJsonInput(source) {
	const trimmed = String(source || '').trim();
	if (!trimmed) {
		return {
			ok: true,
			empty: true,
			value: null,
			unwrapped: 0,
			error: '',
		};
	}

	const direct = parseJsonDocument(trimmed);
	if (direct.ok) return direct;

	const escaped = parseEscapedJsonString(trimmed);
	if (escaped.ok) return escaped;

	return {
		ok: false,
		empty: false,
		value: null,
		unwrapped: 0,
		error: escaped.error || direct.error || 'Input is not valid JSON or an escaped JSON string.',
	};
}

/**
 * Parses a JSON document and then unwraps encoded JSON strings inside it.
 *
 * @param {string} source The candidate JSON document.
 * @returns {{ ok: boolean, empty: boolean, value?: unknown, unwrapped: number, error: string }} Parse result metadata.
 */
function parseJsonDocument(source) {
	const parsed = safeJsonParse(source);
	if (!parsed.ok) {
		return {
			ok: false,
			empty: false,
			value: null,
			unwrapped: 0,
			error: parsed.error,
		};
	}

	return unwrapJsonStrings(parsed.value);
}

/**
 * Parses raw escaped JSON content by temporarily treating it as a JSON string literal.
 *
 * @param {string} source Escaped JSON content without surrounding quotes.
 * @returns {{ ok: boolean, empty: boolean, value?: unknown, unwrapped: number, error: string }} Parse result metadata.
 */
function parseEscapedJsonString(source) {
	const parsed = safeJsonParse(makeJsonStringLiteral(source));
	if (!parsed.ok) {
		return {
			ok: false,
			empty: false,
			value: null,
			unwrapped: 0,
			error: parsed.error,
		};
	}

	return unwrapJsonStrings(parsed.value);
}

/**
 * Wraps raw escaped content in a JSON string literal without changing existing escapes.
 *
 * @param {string} source Raw escaped JSON content.
 * @returns {string} A candidate JSON string literal.
 */
function makeJsonStringLiteral(source) {
	return `"${source.replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t')}"`;
}

/**
 * Parses JSON without throwing into Vue reactivity.
 *
 * @param {string} source The candidate JSON text.
 * @returns {{ ok: true, value: unknown } | { ok: false, error: string }} Safe parse result.
 */
function safeJsonParse(source) {
	try {
		return {
			ok: true,
			value: JSON.parse(source),
		};
	} catch (error) {
		return {
			ok: false,
			error: formatParseError(error),
		};
	}
}

/**
 * Recursively parses JSON strings until the value is no longer encoded JSON.
 *
 * @param {unknown} initialValue The first parsed JSON value.
 * @returns {{ ok: boolean, empty: boolean, value?: unknown, unwrapped: number, error: string }} Parse result metadata.
 */
function unwrapJsonStrings(initialValue) {
	let value = initialValue;
	let unwrapped = 0;

	for (let depth = 0; depth < maxUnstringifyDepth; depth += 1) {
		if (typeof value !== 'string') {
			return {
				ok: true,
				empty: false,
				value,
				unwrapped,
				error: '',
			};
		}

		const candidate = value.trim();
		if (!candidate) {
			return {
				ok: true,
				empty: false,
				value,
				unwrapped,
				error: '',
			};
		}

		const nested = safeJsonParse(candidate);
		if (!nested.ok) {
			return {
				ok: true,
				empty: false,
				value,
				unwrapped,
				error: '',
			};
		}

		value = nested.value;
		unwrapped += 1;
	}

	return {
		ok: true,
		empty: false,
		value,
		unwrapped,
		error: '',
	};
}

/**
 * Formats a JSON value with tab indentation for copy-ready output.
 *
 * @param {unknown} value The parsed JSON value.
 * @returns {string} Pretty printed JSON.
 */
function formatJsonValue(value) {
	return JSON.stringify(value, null, '\t');
}

/**
 * Highlights JSON tokens while keeping the output safe for v-html rendering.
 *
 * @param {string} source Pretty printed JSON text.
 * @returns {string} HTML with token spans.
 */
function highlightJson(source) {
	return source.replace(jsonTokenPattern, replaceJsonToken);
}

/**
 * Converts one JSON token into highlighted HTML.
 *
 * @param {string} token The matched JSON token.
 * @param {number} offset The token offset in the source string.
 * @param {string} source The complete pretty printed JSON source.
 * @returns {string} Escaped token HTML.
 */
function replaceJsonToken(token, offset, source) {
	const className = jsonTokenClass(token, offset, source);
	return `<span class="${className}">${escapeHtml(token)}</span>`;
}

/**
 * Chooses the syntax class for a JSON token.
 *
 * @param {string} token The matched JSON token.
 * @param {number} offset The token offset in the source string.
 * @param {string} source The complete pretty printed JSON source.
 * @returns {string} Syntax token class.
 */
function jsonTokenClass(token, offset, source) {
	if (token.startsWith('"')) {
		return source.slice(offset + token.length).match(/^\s*:/)
			? 'json-key'
			: 'json-string';
	}
	if (token === 'true' || token === 'false') return 'json-boolean';
	if (token === 'null') return 'json-null';
	return 'json-number';
}

/**
 * Escapes a string for safe HTML output.
 *
 * @param {string} value The text to escape.
 * @returns {string} Escaped HTML text.
 */
function escapeHtml(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Formats a parser exception into a concise message.
 *
 * @param {unknown} error The caught parser error.
 * @returns {string} User-facing parse error text.
 */
function formatParseError(error) {
	return error instanceof Error && error.message
		? error.message
		: 'Could not parse JSON.';
}

/**
 * Formats the unwrapped layer count for the status pill.
 *
 * @param {number} count Number of decoded string layers.
 * @returns {string} A pluralized layer label.
 */
function formatLayerCount(count) {
	return count === 1 ? '1 layer' : `${count} layers`;
}

/**
 * Copies the formatted JSON output to the clipboard.
 *
 * @returns {Promise<void>} Resolves after the copy attempt completes.
 */
async function copyOutput() {
	if (!prettyOutput.value) return;

	clearCopyTimer();

	try {
		if (typeof navigator === 'undefined' || !navigator.clipboard) throw new Error('Clipboard unavailable');
		await navigator.clipboard.writeText(prettyOutput.value);
		copyState.value = 'Copied';
	} catch {
		copyState.value = 'Copy failed';
	}

	copyTimer = setTimeout(() => {
		copyState.value = '';
		copyTimer = null;
	}, 1800);
}

/**
 * Restores the sample stringified JSON payload.
 *
 * @returns {void}
 */
function resetSample() {
	inputText.value = createSampleInput();
}

/**
 * Clears the editor and copy state.
 *
 * @returns {void}
 */
function clearInput() {
	inputText.value = '';
	clearCopyTimer();
	copyState.value = '';
}

/**
 * Clears the pending copy-state timeout.
 *
 * @returns {void}
 */
function clearCopyTimer() {
	if (!copyTimer) return;
	clearTimeout(copyTimer);
	copyTimer = null;
}
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="JSON Unstringifier"
			tagline="Turn stringified, escaped, or minified JSON into clean copy-ready JSON."
			tag="JSON"
			eyebrow="Tools"
		>
			<DocSection eyebrow="Workspace" title="Universal JSON area">
				<DomSplitterPanel
					v-model:start-size="splitterStartSize"
					:orientation="splitterOrientation"
					class="h-[72rem] min-w-0 overflow-hidden rounded-2xl border border-border bg-canvas shadow-sm lg:h-[34rem]"
					:min-start="splitterOrientation === 'vertical' ? 280 : 320"
					:min-main="splitterOrientation === 'vertical' ? 280 : 360"
					:handle-size="10"
					handle-class="bg-border/45 transition hover:bg-ring/20 focus-visible:bg-ring/30 data-[dragging=true]:bg-ring/30"
				>
					<template #start>
						<section class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden skin-card">
							<div class="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
								<div class="min-w-0">
									<h2 class="text-sm font-semibold text-canvas-fg">Input</h2>
									<p class="text-xs text-muted-fg">Stringified or minified JSON</p>
								</div>
								<div class="flex shrink-0 items-center gap-2">
									<DomButton size="sm" variant="secondary" @click="resetSample">Sample</DomButton>
									<DomButton size="sm" variant="secondary" @click="clearInput">Clear</DomButton>
								</div>
							</div>
							<label class="sr-only" for="json-unstringifier-input">JSON input</label>
							<textarea
								id="json-unstringifier-input"
								v-model="inputText"
								class="json-editor min-h-0 flex-1 resize-none border-0 bg-canvas p-4 font-mono text-[12.5px] leading-relaxed text-canvas-fg outline-none placeholder:text-muted-fg focus:ring-2 focus:ring-ring/30"
								placeholder="{&quot;keywords&quot;:[...]}"
								spellcheck="false"
							></textarea>
						</section>
					</template>

					<section class="flex h-full min-h-0 min-w-0 flex-col overflow-hidden skin-card">
						<div class="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
							<div class="flex min-w-0 flex-wrap items-center gap-2">
								<div class="min-w-0">
									<h2 class="text-sm font-semibold text-canvas-fg">Pretty output</h2>
									<p class="text-xs text-muted-fg">Tab-indented JSON</p>
								</div>
								<span class="rounded-full border px-2 py-1 text-[11px] font-semibold" :class="statusClass">
									{{ statusLabel }}
								</span>
							</div>
							<DomButton size="sm" :disabled="!prettyOutput" @click="copyOutput">
								{{ copyState || 'Copy' }}
							</DomButton>
						</div>
						<div class="min-h-0 flex-1 overflow-auto bg-canvas">
							<pre v-if="prettyOutput" class="json-output min-h-full p-4 font-mono text-[12.5px] leading-relaxed text-canvas-fg"><code v-html="highlightedOutput"></code></pre>
							<div v-else class="flex min-h-full items-center justify-center p-6 text-center text-sm text-muted-fg">
								<p>{{ parseResult.error || 'Paste JSON to see the formatted output.' }}</p>
							</div>
						</div>
					</section>
				</DomSplitterPanel>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>

<style scoped>
.json-editor {
	tab-size: 2;
}

.json-output {
	tab-size: 2;
	white-space: pre;
}

.json-output :deep(.json-key) {
	color: var(--primary);
	font-weight: 600;
}

.json-output :deep(.json-string) {
	color: color-mix(in oklch, var(--success) 82%, var(--canvas-fg));
}

.json-output :deep(.json-number) {
	color: color-mix(in oklch, var(--warning) 76%, var(--canvas-fg));
}

.json-output :deep(.json-boolean) {
	color: color-mix(in oklch, var(--accent-fg) 70%, var(--primary));
	font-weight: 600;
}

.json-output :deep(.json-null) {
	color: var(--muted-fg);
	font-style: italic;
}
</style>
