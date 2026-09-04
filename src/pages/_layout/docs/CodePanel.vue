<script setup>
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import CodeBlock from '../CodeBlock.vue';
import { DomPopover } from '../../lib/vue';
import { createComponentExampleSources } from './componentExampleSources.js';
import { isExternalSourceHref, sourceHrefForPath } from './sourceLinks.js';

// The code half of an <Example> / <Playground>. It owns the toolbar,
// source links, copy, and disclosure controls while CodeBlock owns rendering.
const props = defineProps({
	source: { type: String, default: '' },
	lang: { type: String, default: 'vue' },
	filename: { type: String, default: '' },
	sourcePath: { type: String, default: '' },
	sourceHref: { type: String, default: '' },
	defaultOpen: { type: Boolean, default: true },
	previewLines: { type: Number, default: 0 },
	borderTop: { type: Boolean, default: true },
	sourceVariants: { type: Object, default: null },
	installationMethod: {
		type: String,
		default: '',
		validator: (value) => ['', 'npm', 'source'].includes(value),
	},
	installNote: { type: String, default: '' },
});
const emit = defineEmits(['update:installationMethod']);

const showCode = ref(props.defaultOpen || props.previewLines > 0);
const expanded = ref(props.defaultOpen);
const copiedTarget = ref('');
const localInstallationMethod = ref(props.installationMethod || 'npm');
const isPreview = computed(() => props.previewLines > 0);
const isClipped = computed(() => showCode.value && isPreview.value && !expanded.value);
const selectedInstallationMethod = computed(() => props.installationMethod || localInstallationMethod.value);
const resolvedSourceVariants = computed(() => {
	if (props.sourceVariants?.npm && props.sourceVariants?.source) return props.sourceVariants;
	if (props.lang !== 'vue' || !props.source) return null;
	return createComponentExampleSources(props.source);
});
const hasInstallationPreference = computed(() => Boolean(resolvedSourceVariants.value));
const resolvedSource = computed(() => {
	if (!hasInstallationPreference.value) return props.source;
	return resolvedSourceVariants.value[selectedInstallationMethod.value] || props.source;
});
const installCommand = 'npm install @getdom/studio';
const resolvedSourceHref = computed(() => props.sourceHref || sourceHrefForPath(props.sourcePath));
const sourceLinkTarget = computed(() => isExternalSourceHref(resolvedSourceHref.value) ? '_blank' : null);
const sourceLinkTitle = computed(() => props.sourcePath ? `Open ${props.sourcePath}` : 'Open source file');
const toggleLabel = computed(() => {
	if (isPreview.value) return expanded.value ? 'Collapse code' : 'Expand code';
	return showCode.value ? 'Hide code' : 'Show code';
});
const codeStyle = computed(() => {
	if (!isPreview.value) return {};
	if (expanded.value) return { maxHeight: '70vh' };
	return { maxHeight: `${Math.round((props.previewLines * 20.625) + 32)}px` };
});

/**
 * Copies the source variant selected by the user.
 *
 * @returns {void}
 */
function copy() {
	if (typeof navigator === 'undefined' || !navigator.clipboard) return;
	navigator.clipboard.writeText(resolvedSource.value);
	showCopiedState('source');
}

/**
 * Copies the setup command for the selected installation method.
 *
 * @returns {void}
 */
function copyInstallCommand() {
	if (typeof navigator === 'undefined' || !navigator.clipboard) return;
	navigator.clipboard.writeText(installCommand);
	showCopiedState('install');
}

/**
 * Selects the installation method and updates every bound example on the page.
 *
 * @param {'npm'|'source'} method Installation method selected by the user.
 * @returns {void}
 */
function selectInstallationMethod(method) {
	localInstallationMethod.value = method;
	emit('update:installationMethod', method);
}

/**
 * Shows a short confirmation beside the control that was copied.
 *
 * @param {'source'|'install'} target Copied control identifier.
 * @returns {void}
 */
function showCopiedState(target) {
	copiedTarget.value = target;
	setTimeout(() => {
		if (copiedTarget.value === target) copiedTarget.value = '';
	}, 1500);
}

/**
 * Opens, closes, or expands the source panel.
 *
 * @returns {void}
 */
function toggleCode() {
	if (isPreview.value) {
		showCode.value = true;
		expanded.value = !expanded.value;
		return;
	}
	showCode.value = !showCode.value;
}

/**
 * Expands a clipped preview when its fade overlay is selected.
 *
 * @returns {void}
 */
function expandPreview() {
	if (isClipped.value) expanded.value = true;
}
</script>

<template>
	<div>
		<div
			class="flex min-w-0 flex-wrap items-center justify-between gap-2 overflow-hidden bg-secondary/40 px-3 py-1.5 text-xs"
			:class="borderTop && 'border-t border-border'"
		>
			<button
				type="button"
				class="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 font-medium text-muted-fg hover:bg-canvas hover:text-canvas-fg"
				@click="toggleCode"
			>
				<svg viewBox="0 0 16 16" class="size-3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M5 4L1 8l4 4M11 4l4 4-4 4" />
				</svg>
				{{ toggleLabel }}
			</button>
			<div class="flex min-w-0 items-center justify-end gap-2">
				<a
					v-if="filename && resolvedSourceHref"
					:href="resolvedSourceHref"
					:target="sourceLinkTarget || undefined"
					:rel="sourceLinkTarget ? 'noopener' : undefined"
					:title="sourceLinkTitle"
					class="min-w-0 truncate font-mono text-[11px] text-muted-fg underline decoration-border underline-offset-4 transition hover:text-canvas-fg"
				>{{ filename }}</a>
				<span v-else-if="filename" class="min-w-0 truncate font-mono text-[11px] text-muted-fg">{{ filename }}</span>
				<span class="shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-fg">{{ lang }}</span>
				<button
					type="button"
					class="shrink-0 rounded-md px-2 py-1 font-medium text-muted-fg hover:bg-canvas hover:text-canvas-fg"
					@click="copy"
				>{{ copiedTarget === 'source' ? 'Copied' : 'Copy' }}</button>
			</div>
		</div>

		<div
			v-if="showCode && hasInstallationPreference"
			class="grid min-w-0 gap-3 border-t border-border bg-canvas px-3 py-3 text-xs lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center"
		>
			<div class="flex min-w-0 flex-wrap items-center gap-2">
				<span class="font-medium text-muted-fg">Install</span>
				<div class="inline-flex h-9 rounded-lg border border-border bg-secondary/50 p-0.5" role="group" aria-label="Install preference">
					<button
						v-for="method in [{ key: 'npm', label: 'npm package' }, { key: 'source', label: 'Own the source' }]"
						:key="method.key"
						type="button"
						class="flex h-full items-center rounded-md px-2.5 font-medium transition"
						:class="selectedInstallationMethod === method.key
							? 'bg-canvas text-canvas-fg shadow-sm ring-1 ring-border'
							: 'text-muted-fg hover:text-canvas-fg'"
						:aria-pressed="selectedInstallationMethod === method.key"
						@click="selectInstallationMethod(method.key)"
					>{{ method.label }}</button>
				</div>
			</div>
			<div v-if="selectedInstallationMethod === 'npm'" class="flex h-9 min-w-0 items-center overflow-hidden rounded-lg border border-border bg-secondary/30">
				<code class="min-w-0 flex-1 truncate px-3 font-mono text-[11px] text-canvas-fg">{{ installCommand }}</code>
				<button
					type="button"
					class="h-full shrink-0 border-l border-border px-3 font-medium text-muted-fg transition hover:bg-canvas hover:text-canvas-fg"
					@click="copyInstallCommand"
				>{{ copiedTarget === 'install' ? 'Copied' : 'Copy' }}</button>
			</div>
			<div v-else class="flex h-9 min-w-0 items-center overflow-hidden rounded-lg border border-primary/20 bg-primary/5">
				<RouterLink to="/install#own-the-source" class="flex h-full min-w-0 flex-1 items-center truncate px-3 font-semibold text-canvas-fg underline decoration-border underline-offset-4 transition hover:text-primary">
					View source installation instructions
				</RouterLink>
				<DomPopover position="bottom-end" width="w-[min(20rem,calc(100vw-2rem))]" padding="p-3">
					<template #trigger>
						<button
							type="button"
							class="grid size-9 shrink-0 place-items-center border-l border-primary/20 text-muted-fg transition hover:bg-primary/10 hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
							aria-label="Why own the source?"
						>
							<svg viewBox="0 0 16 16" class="size-4" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
								<circle cx="8" cy="8" r="6.25" />
								<path d="M8 7.25v4M8 4.75h.01" stroke-linecap="round" />
							</svg>
						</button>
					</template>
					<p class="leading-5 text-muted-fg">When you copy the source it becomes part of your codebase, so you can edit and maintain it directly. Keep the theme variables in your own stylesheet.</p>
				</DomPopover>
			</div>
			<p v-if="installNote" class="text-[11px] leading-5 text-muted-fg lg:col-start-2">{{ installNote }}</p>
		</div>

		<div
			v-if="showCode"
			class="dom-code relative min-w-0 max-w-full border-t border-border transition-[max-height] duration-300 ease-out"
			:class="isClipped ? 'cursor-pointer overflow-hidden' : 'overflow-auto'"
			:style="codeStyle"
			@click="expandPreview"
		>
			<CodeBlock
				:code="resolvedSource"
				:lang="lang"
				:framed="false"
			/>
			<div
				v-if="isClipped"
				class="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-b from-transparent via-canvas/80 to-canvas"
			></div>
		</div>
	</div>
</template>
