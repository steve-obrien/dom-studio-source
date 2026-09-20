<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue';

defineOptions({
	__doc: {
		name: 'Dialog',
		tag: '<DomDialog>',
		description: 'A modal built on the native HTML <dialog> element — top-layer rendering, native stacking, scroll lock, and backdrop styling without z-index hacks.',
		slots: [
			{ name: 'trigger', description: 'Optional. Element that opens the dialog when clicked — omit when using v-model, a template ref, or commandfor on an external button.' },
			{ name: '(default)', description: 'Dialog body — rendered inside the card below the title and description.' },
			{ name: 'header', payload: '{ title, description, titleId, descriptionId, companionOpen, companionMode, companionTriggerProps, toggleCompanion }', description: 'Replace the default title and description block. Apply the provided IDs to custom heading and description elements to preserve the dialog accessibility relationships. Companion helpers wire an in-dialog toggle when the companion slot is present.' },
			{ name: 'footer', description: 'Action buttons. Add `data-close` on a control to dismiss the dialog.' },
			{ name: 'companion', payload: '{ open, mode, closeCompanion, toggleCompanion }', description: 'Optional contextual surface shown beside the dialog on wide screens and over it below companionBreakpoint.' },
		],
		events: [
			{ name: 'update:modelValue', payload: '(open: boolean)', description: 'Emitted when the dialog opens or closes.' },
			{ name: 'before-open', description: 'Emitted immediately before the dialog opens; prepare draft data or item snapshots here.' },
			{ name: 'update:companionOpen', payload: '(open: boolean)', description: 'Emitted when the companion surface opens or closes.' },
			{ name: 'close', description: 'Emitted when the dialog is dismissed.' },
			{ name: 'close-complete', description: 'Emitted after the close transition completes; clear retained dialog data here.' },
		],
		keyboard: [
			{ keys: 'Esc', action: 'Closes an open companion first, then closes the dialog unless `static` is set.' },
			{ keys: 'Tab / Shift+Tab', action: 'Focus stays within the dialog while open (native top-layer).' },
			{ keys: 'Click backdrop', action: 'Dismisses the dialog unless `static` is set.' },
		],
	},
});

const dialogWidthValues = {
	sm: '24rem',
	md: '28rem',
	lg: '44rem',
	xl: '56rem',
};

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false,
		_edit: { description: 'Whether the dialog is open.' },
	},
	title: {
		type: String,
		default: '',
		_edit: { description: 'Heading rendered inside the dialog card.' },
	},
	description: {
		type: String,
		default: '',
		_edit: { description: 'Supporting copy under the heading.' },
	},
	size: {
		type: String,
		default: 'md',
		validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value),
		_edit: {
			options: ['sm', 'md', 'lg', 'xl'],
			description: 'Width preset for the dialog card.',
		},
	},
	width: {
		type: [String, Number],
		default: '',
		_edit: { description: 'Optional CSS width. Overrides the size preset when set, for example 95vw.' },
	},
	height: {
		type: [String, Number],
		default: '',
		_edit: { description: 'Optional CSS height. Use values like 95vh for near-full-page dialogs.' },
	},
	static: {
		type: Boolean,
		default: false,
		_edit: { description: 'Modal cannot be dismissed by backdrop click or Esc — use footer actions with data-close or v-model.' },
	},
	backdrop: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the dimmed, blurred page backdrop behind the dialog.' },
	},
	footer: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the footer region and default Close action when no footer slot is provided.' },
	},
	companionOpen: {
		type: Boolean,
		default: false,
		_edit: { description: 'Whether the optional companion slot is visible.' },
	},
	companionWidth: {
		type: [String, Number],
		default: '24rem',
		_edit: { description: 'Desktop width of the companion surface.' },
	},
	companionBreakpoint: {
		type: [String, Number],
		default: '56.25rem',
		_edit: { description: 'Viewport width at which the companion switches from a side-by-side surface to a covering dialog.' },
	},
	companionLabel: {
		type: String,
		default: 'Companion panel',
		_edit: { description: 'Accessible name for the companion surface.' },
	},
});
const emit = defineEmits(['update:modelValue', 'update:companionOpen', 'before-open', 'close', 'close-complete']);

const root = ref(null);
const mainPanel = ref(null);
const companionPanel = ref(null);
const slots = useSlots();
const uniqueId = useId();
const companionId = `dom-dialog-${uniqueId}-companion`;
const titleId = computed(() => (props.title ? `dom-dialog-${uniqueId}-title` : ''));
const descriptionId = computed(() => (props.description ? `dom-dialog-${uniqueId}-description` : ''));
const hasCompanion = computed(() => Boolean(slots.companion));
const companionActive = computed(() => hasCompanion.value && props.companionOpen);
const companionOverlay = ref(false);
const companionMode = computed(() => companionOverlay.value ? 'overlay' : 'beside');
const companionTriggerProps = computed(() => ({
	'aria-controls': companionId,
	'aria-expanded': String(companionActive.value),
	'aria-haspopup': companionOverlay.value ? 'dialog' : undefined,
}));
const dialogShellStyle = computed(() => ({
	'--dom-dialog-panel-width': normalizeDialogDimension(props.width)
		|| dialogWidthValues[props.size]
		|| dialogWidthValues.md,
	'--dom-dialog-companion-width': normalizeDialogDimension(props.companionWidth) || '24rem',
}));
const dialogPanelStyle = computed(() => {
	const height = normalizeDialogDimension(props.height);

	return {
		height: height || undefined,
		maxHeight: height || undefined,
	};
});
let companionMediaQuery = null;
let companionReturnFocus = null;

/**
 * Normalize a CSS dimension prop into an inline style value.
 *
 * @param {string|number} value CSS size string or numeric pixel value.
 * @returns {string} CSS size value, with numbers converted to pixels.
 */
function normalizeDialogDimension(value) {
	if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`;
	if (typeof value === 'string') return value.trim();
	return '';
}

/**
 * Build the viewport query used to switch the companion into overlay mode.
 *
 * @returns {string} A max-width media query.
 */
function companionMediaQueryText() {
	const breakpoint = normalizeDialogDimension(props.companionBreakpoint) || '56.25rem';
	return `(max-width: ${breakpoint})`;
}

/**
 * Synchronize the responsive companion mode from a MediaQueryList.
 *
 * @param {MediaQueryList|MediaQueryListEvent} query Current media-query state.
 * @returns {void}
 */
function updateCompanionMode(query) {
	companionOverlay.value = Boolean(query?.matches);
}

/**
 * Replace the active companion breakpoint listener.
 *
 * @returns {void}
 */
function setupCompanionMediaQuery() {
	teardownCompanionMediaQuery();
	if (typeof window === 'undefined') return;
	companionMediaQuery = window.matchMedia(companionMediaQueryText());
	updateCompanionMode(companionMediaQuery);
	companionMediaQuery.addEventListener('change', updateCompanionMode);
}

/**
 * Remove the active companion breakpoint listener.
 *
 * @returns {void}
 */
function teardownCompanionMediaQuery() {
	companionMediaQuery?.removeEventListener('change', updateCompanionMode);
	companionMediaQuery = null;
}

/**
 * Focus the preferred control inside the companion surface.
 *
 * @returns {void}
 */
function focusCompanion() {
	const panel = companionPanel.value;
	if (!panel) return;
	const preferred = panel.querySelector('[autofocus], [data-companion-focus], textarea, input, select, button, [href], [tabindex]:not([tabindex="-1"])');
	(preferred || panel).focus({ preventScroll: true });
}

/**
 * Restore focus to the element that opened the companion when possible.
 *
 * @returns {void}
 */
function restoreCompanionFocus() {
	const target = companionReturnFocus;
	companionReturnFocus = null;
	if (target instanceof HTMLElement && target.isConnected && !target.closest('[inert]')) {
		target.focus({ preventScroll: true });
		return;
	}
	mainPanel.value?.focus({ preventScroll: true });
}

/**
 * Emit a controlled companion visibility update.
 *
 * @param {boolean} open Desired companion visibility.
 * @returns {void}
 */
function setCompanionOpen(open) {
	if (!hasCompanion.value) return;
	emit('update:companionOpen', Boolean(open));
}

/**
 * Close the companion without closing the parent dialog.
 *
 * @returns {void}
 */
function closeCompanion() {
	setCompanionOpen(false);
}

/**
 * Toggle the companion surface.
 *
 * @returns {void}
 */
function toggleCompanion() {
	setCompanionOpen(!companionActive.value);
}

/**
 * Synchronize the headless dialog host with the controlled Vue model.
 *
 * @param {boolean} v Whether the dialog should be open.
 * @returns {void}
 */
function setOpen(v) {
	if (!root.value) return;
	if (v) root.value.open();
	else root.value.close();
}

/**
 * Forward only the root dialog's before-open event to Vue consumers.
 *
 * @param {CustomEvent} event Headless before-open event.
 * @returns {void}
 */
function onHeadlessBeforeOpen(event) {
	if (event.target !== root.value) return;
	emit('before-open');
}

/**
 * Forward only the root dialog's open event to Vue consumers.
 *
 * @param {CustomEvent} event Headless open event.
 * @returns {void}
 */
function onHeadlessOpen(event) {
	if (event.target !== root.value) return;
	emit('update:modelValue', true);
}

/**
 * Forward only the root dialog's close event to Vue consumers.
 *
 * @param {CustomEvent} event Headless close event.
 * @returns {void}
 */
function onHeadlessClose(event) {
	if (event.target !== root.value) return;
	if (companionActive.value) setCompanionOpen(false);
	emit('update:modelValue', false);
	emit('close');
}

/**
 * Forward only the root dialog's close-complete event to Vue consumers.
 *
 * @param {CustomEvent} event Headless close-complete event.
 * @returns {void}
 */
function onHeadlessCloseComplete(event) {
	if (event.target !== root.value) return;
	emit('close-complete');
}

/**
 * Let the companion consume Escape before the parent dialog closes.
 *
 * @param {CustomEvent<{ reason: string }>} event Cancellable headless close request.
 * @returns {void}
 */
function onHeadlessRequestClose(event) {
	if (event.target !== root.value) return;
	if (event.detail?.reason !== 'escape' || !companionActive.value) return;
	event.preventDefault();
	closeCompanion();
}

onMounted(async () => {
	await import('../../lib/headless/dialog.js');
	setupCompanionMediaQuery();
	root.value?.addEventListener('dom:before-open', onHeadlessBeforeOpen);
	root.value?.addEventListener('dom:open', onHeadlessOpen);
	root.value?.addEventListener('dom:request-close', onHeadlessRequestClose);
	root.value?.addEventListener('dom:close', onHeadlessClose);
	root.value?.addEventListener('dom:close-complete', onHeadlessCloseComplete);
	if (props.modelValue) setOpen(true);
});

watch(() => props.modelValue, setOpen);
watch(() => props.companionBreakpoint, setupCompanionMediaQuery);
watch(() => props.companionOpen, async (open, previousOpen) => {
	if (!hasCompanion.value || open === previousOpen) return;
	if (open) {
		companionReturnFocus = document.activeElement;
		await nextTick();
		focusCompanion();
	} else {
		await nextTick();
		restoreCompanionFocus();
	}
});

onBeforeUnmount(teardownCompanionMediaQuery);

defineExpose({
	open: () => setOpen(true),
	close: () => setOpen(false),
	toggle: () => root.value?.toggle(),
	openCompanion: () => setCompanionOpen(true),
	closeCompanion,
	toggleCompanion,
	get element() { return root.value; },
});
</script>

<template>
	<!--
		<dom-dialog> owns the native <dialog> internally (shadow DOM). We
		just hand it a trigger slot and the dialog body — no <dialog> tag in
		Vue templates.
	-->
	<dom-dialog
		ref="root"
		class="dom-dialog"
		:static="static || null"
		:no-backdrop="backdrop ? null : ''"
		:aria-labelledby="titleId || null"
		:aria-describedby="descriptionId || null"
	>
		<!-- Vue does not forward slot= onto component roots; anchor trigger for dom-dialog -->
		<span slot="trigger" class="contents">
			<slot name="trigger" />
		</span>
		<div
			class="dom-dialog-shell"
			:class="{ 'dom-dialog-shell--open': companionActive }"
			:data-companion-mode="companionMode"
			:style="dialogShellStyle"
		>
			<div
				ref="mainPanel"
				class="skin-overlay flex min-w-0 flex-1 self-stretch flex-col overflow-hidden rounded-2xl p-6 outline-none"
				:style="dialogPanelStyle"
				:inert="companionOverlay && companionActive"
				:aria-hidden="companionOverlay && companionActive ? 'true' : undefined"
				tabindex="-1"
			>
				<slot
					name="header"
					:title="title"
					:description="description"
					:title-id="titleId"
					:description-id="descriptionId"
					:companion-open="companionActive"
					:companion-mode="companionMode"
					:companion-trigger-props="companionTriggerProps"
					:toggle-companion="toggleCompanion"
				>
					<div v-if="title || description" class="shrink-0 space-y-2">
						<h2 v-if="title" :id="titleId" class="text-lg font-semibold tracking-tight">{{ title }}</h2>
						<p v-if="description" :id="descriptionId" class="text-sm text-muted-fg">{{ description }}</p>
					</div>
				</slot>
				<div class="-mx-1 -mb-1 min-h-0 overflow-y-auto px-1 pb-1" :class="($slots.header || title || description) ? 'mt-3 pt-1' : '-mt-1 pt-1'">
					<slot />
				</div>
				<div v-if="footer || $slots.footer" class="mt-6 flex shrink-0 items-center justify-end gap-2">
					<slot name="footer">
						<button
							data-close
							type="button"
							class="skin-action inline-flex h-9 items-center rounded-full px-4 text-sm font-medium hover:opacity-90"
						>Close</button>
					</slot>
				</div>
			</div>
			<aside
				v-if="hasCompanion"
				v-show="companionActive"
				:id="companionId"
				ref="companionPanel"
				class="dom-dialog-companion skin-overlay"
				:role="companionOverlay ? 'dialog' : 'region'"
				:aria-modal="companionOverlay ? 'true' : undefined"
				:aria-label="companionLabel"
				tabindex="-1"
			>
				<slot
					name="companion"
					:open="companionActive"
					:mode="companionMode"
					:close-companion="closeCompanion"
					:toggle-companion="toggleCompanion"
				/>
			</aside>
		</div>
	</dom-dialog>
</template>

<style scoped>
.dom-dialog::part(dialog) {
	width: 100vw;
	opacity: 0;
	transform: translateY(10px) scale(0.96);
	transform-origin: center;
	filter: blur(1px);
	transition:
		opacity 180ms ease,
		transform 240ms cubic-bezier(0.16, 1, 0.3, 1),
		filter 180ms ease,
		overlay 240ms allow-discrete,
		display 240ms allow-discrete;
}

.dom-dialog-shell {
	position: relative;
	display: flex;
	align-items: flex-start;
	gap: 0;
	width: 100%;
	max-width: var(--dom-dialog-panel-width);
	margin-inline: auto;
	transition: max-width 200ms ease;
}

.dom-dialog-shell--open[data-companion-mode="beside"] {
	gap: 0.875rem;
	max-width: calc(var(--dom-dialog-panel-width) + var(--dom-dialog-companion-width) + 0.875rem);
}

.dom-dialog-companion {
	display: flex;
	flex: none;
	align-self: stretch;
	width: var(--dom-dialog-companion-width);
	min-height: 20rem;
	max-height: calc(100dvh - 2rem);
	overflow: hidden;
	border-radius: 1rem;
	outline: none;
}

.dom-dialog-shell--open[data-companion-mode="overlay"] {
	gap: 0;
	max-width: var(--dom-dialog-panel-width);
}

[data-companion-mode="overlay"] .dom-dialog-companion {
	position: absolute;
	inset: 0;
	z-index: 1;
	width: auto;
	min-height: 0;
	max-height: none;
}

@media (prefers-reduced-motion: reduce) {
	.dom-dialog-shell {
		transition-duration: 0s;
	}
}

.dom-dialog[open]::part(dialog) {
	opacity: 1;
	transform: none;
	filter: blur(0);
}

@starting-style {
	.dom-dialog[open]::part(dialog) {
		opacity: 0;
		transform: translateY(10px) scale(0.96);
		filter: blur(1px);
	}
}
</style>
