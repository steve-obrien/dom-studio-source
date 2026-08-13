<script setup>
import { computed, onMounted, ref, useId, watch } from 'vue';

defineOptions({
	__doc: {
		name: 'Dialog',
		tag: '<DomDialog>',
		description: 'A modal built on the native HTML <dialog> element — top-layer rendering, native stacking, scroll lock, and backdrop styling without z-index hacks.',
		slots: [
			{ name: 'trigger', description: 'Optional. Element that opens the dialog when clicked — omit when using v-model, a template ref, or commandfor on an external button.' },
			{ name: '(default)', description: 'Dialog body — rendered inside the card below the title and description.' },
			{ name: 'header', payload: '{ title, description, titleId, descriptionId }', description: 'Replace the default title and description block. Apply the provided IDs to custom heading and description elements to preserve the dialog accessibility relationships.' },
			{ name: 'footer', description: 'Action buttons. Add `data-close` on a control to dismiss the dialog.' },
		],
		events: [
			{ name: 'update:modelValue', payload: '(open: boolean)', description: 'Emitted when the dialog opens or closes.' },
			{ name: 'before-open', description: 'Emitted immediately before the dialog opens; prepare draft data or item snapshots here.' },
			{ name: 'close', description: 'Emitted when the dialog is dismissed.' },
			{ name: 'close-complete', description: 'Emitted after the close transition completes; clear retained dialog data here.' },
		],
		keyboard: [
			{ keys: 'Esc', action: 'Closes the topmost open dialog unless `static` is set.' },
			{ keys: 'Tab / Shift+Tab', action: 'Focus stays within the dialog while open (native top-layer).' },
			{ keys: 'Click backdrop', action: 'Dismisses the dialog unless `static` is set.' },
		],
	},
});

const dialogWidthClasses = {
	sm: 'w-[min(calc(100vw-2rem),24rem)]',
	md: 'w-[min(calc(100vw-2rem),28rem)]',
	lg: 'w-[min(calc(100vw-2rem),44rem)]',
	xl: 'w-[min(calc(100vw-2rem),56rem)]',
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
});
const emit = defineEmits(['update:modelValue', 'before-open', 'close', 'close-complete']);

const root = ref(null);
const uniqueId = useId();
const titleId = computed(() => (props.title ? `dom-dialog-${uniqueId}-title` : ''));
const descriptionId = computed(() => (props.description ? `dom-dialog-${uniqueId}-description` : ''));
const dialogWidthClass = computed(() => dialogWidthClasses[props.size] || dialogWidthClasses.md);
const dialogPanelStyle = computed(() => {
	const width = normalizeDialogDimension(props.width);
	const height = normalizeDialogDimension(props.height);

	return {
		width: width || undefined,
		height: height || undefined,
		maxHeight: height || undefined,
	};
});

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

onMounted(async () => {
	await import('../../lib/headless/dialog.js');
	root.value?.addEventListener('dom:before-open', onHeadlessBeforeOpen);
	root.value?.addEventListener('dom:open', onHeadlessOpen);
	root.value?.addEventListener('dom:close', onHeadlessClose);
	root.value?.addEventListener('dom:close-complete', onHeadlessCloseComplete);
	if (props.modelValue) setOpen(true);
});

watch(() => props.modelValue, setOpen);

defineExpose({
	open: () => setOpen(true),
	close: () => setOpen(false),
	toggle: () => root.value?.toggle(),
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
			class="skin-overlay flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl p-6 outline-none"
			:class="dialogWidthClass"
			:style="dialogPanelStyle"
		>
			<slot
				name="header"
				:title="title"
				:description="description"
				:title-id="titleId"
				:description-id="descriptionId"
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
	</dom-dialog>
</template>

<style scoped>
.dom-dialog::part(dialog) {
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
