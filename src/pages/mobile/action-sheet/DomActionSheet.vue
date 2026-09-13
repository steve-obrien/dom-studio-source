<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';

defineOptions({
	__doc: {
		name: 'Action sheet',
		tag: '<DomActionSheet>',
		description: 'A bottom action sheet for mobile and desktop, with bounded scrolling, keyboard dismissal, focus return, and drag dismissal. Works standalone as a viewport overlay. In DomAppShell, place it in the overlay slot and it stays inside that app.',
		events: [
			{ name: 'update:modelValue', payload: 'boolean', description: 'Fired when the sheet opens or closes.' },
			{ name: 'select', payload: 'object', description: 'Fired with the selected action.' },
		],
		playground: {
			mobileSlot: 'overlay',
			initial: {
				modelValue: true,
				title: 'Project actions',
				description: 'Use for app commands that should stay near the thumb.',
				actions: [
					{ label: 'Share project', description: 'Open the native share sheet', value: 'share', variant: '', disabled: false },
					{ label: 'Duplicate screen', description: '', value: 'duplicate', variant: '', disabled: false },
					{ label: 'Delete draft', description: '', value: 'delete', variant: 'danger', disabled: false },
				],
			},
		},
	},
});

const props = defineProps({
	contained: {
		type: Boolean,
		default: undefined,
		_edit: { description: 'Defaults to contained inside DomAppShell, viewport otherwise. Explicit true requires a positioned, sized parent; prefer the shell overlay slot.' },
	},
	modelValue: {
		type: Boolean,
		default: false,
		_edit: { description: 'Whether the action sheet is open.' },
	},
	title: {
		type: String,
		default: '',
		_edit: { description: 'Optional action sheet title.' },
	},
	description: {
		type: String,
		default: '',
		_edit: { description: 'Optional supporting text below the title.' },
	},
	actions: {
		type: Array,
		default: () => [],
		_edit: {
			component: 'DomJsonListInput',
			props: {
				addLabel: '+ Add action',
				compact: true,
				schema: {
					type: 'array',
					items: {
						type: 'DomForm',
						properties: {
							disabled: { type: 'boolean', label: 'Disabled', default: false },
							label: {
								type: 'string',
								label: 'Label',
								placeholder: 'Share project',
							},
							description: {
								type: 'string',
								label: 'Description',
								placeholder: 'Open the native share sheet',
							},
							value: {
								type: 'string',
								label: 'Value',
								placeholder: 'share',
							},
							variant: {
								type: 'string',
								component: 'DomSelectInput',
								label: 'Variant',
								options: [
									{ label: 'Default', value: '' },
									{ label: 'Danger', value: 'danger' },
								],
							},
						},
					},
				},
			},
			description: 'Action rows: { label, description, value, variant, disabled }.',
		},
	},
	cancelLabel: {
		type: String,
		default: 'Cancel',
		_edit: { description: 'Dismiss button label.' },
	},
});
const emit = defineEmits(['update:modelValue', 'select']);

const drawer = ref(null);
const shell = inject('dom-app-shell', null);
const isContained = computed(() => props.contained ?? Boolean(shell));
const teleportTarget = ref(null);
let ready = false;
let removeListeners = null;
const uniqueId = useId();
const titleId = computed(() => (props.title ? `dom-action-sheet-${uniqueId}-title` : ''));
const descriptionId = `dom-action-sheet-${uniqueId}-description`;

/** Requests dismissal of the controlled action sheet. */
function close() {
	emit('update:modelValue', false);
}

/** Emits an enabled action and then requests sheet dismissal. */
function selectAction(action) {
	if (action.disabled) return;
	emit('select', action);
	close();
}

/** Synchronizes Vue state after the headless drawer has upgraded. */
function setOpen(value) {
	if (ready && drawer.value) drawer.value.open = value;
}

onMounted(async () => {
	await import('../../lib/headless/drawer.js');
	if (!drawer.value) return;
	const element = drawer.value;
	const onOpen = () => emit('update:modelValue', true);
	const onClose = () => emit('update:modelValue', false);
	const onState = (event) => emit('update:modelValue', event.detail.open);
	element.addEventListener('dom:open', onOpen);
	element.addEventListener('dom:close', onClose);
	element.addEventListener('dom:state', onState);
	removeListeners = () => {
		element.removeEventListener('dom:open', onOpen);
		element.removeEventListener('dom:close', onClose);
		element.removeEventListener('dom:state', onState);
	};
	ready = true;
	teleportTarget.value = element.ownerDocument.body;
	await nextTick();
	setOpen(props.modelValue);
});

watch(() => props.modelValue, setOpen);
onBeforeUnmount(() => {
	ready = false;
	removeListeners?.();
});
</script>

<template>
	<Teleport :to="teleportTarget || 'body'" :disabled="isContained || !teleportTarget">
		<dom-drawer
			ref="drawer"
			side="bottom"
			class="inset-0 z-50 block pointer-events-none data-[state=open]:pointer-events-auto"
			:class="isContained ? 'absolute' : 'fixed'"
			:aria-labelledby="titleId || null"
			:aria-label="title ? null : 'Actions'"
			:aria-describedby="description ? descriptionId : null"
		>
			<div
				data-overlay
				data-no-defaults
				class="absolute inset-0 overflow-hidden pointer-events-none data-[state=open]:pointer-events-auto"
				hidden
			>
				<div
					data-backdrop
					data-no-defaults
					class="absolute inset-0 bg-black/40 opacity-0 backdrop-blur-sm transition-opacity duration-300 data-[state=open]:opacity-100 motion-reduce:transition-none"
				></div>
				<section
					data-panel
					data-no-defaults
					class="absolute left-[max(0.75rem,var(--dom-safe-area-left,env(safe-area-inset-left,0px)))] right-[max(0.75rem,var(--dom-safe-area-right,env(safe-area-inset-right,0px)))] bottom-0 mx-auto flex max-h-[calc(100%-var(--dom-safe-area-top,env(safe-area-inset-top,0px))-0.75rem)] max-w-md flex-col pb-[max(0.75rem,var(--dom-safe-area-bottom,env(safe-area-inset-bottom,0px)))] translate-y-full outline-none transition-transform duration-300 ease-out data-[state=open]:translate-y-0 motion-reduce:transition-none"
				>
					<button
						data-drag-handle
						type="button"
						class="group mx-auto flex h-11 w-full shrink-0 touch-none items-center justify-center focus-visible:outline-2 focus-visible:outline-ring"
						aria-label="Close action sheet"
						@click="close"
					>
						<span class="block h-1.5 w-12 rounded-full bg-white/70 shadow-sm transition group-hover:bg-white"></span>
					</button>
					<div class="skin-overlay min-h-0 overflow-y-auto overscroll-contain rounded-2xl">
						<div v-if="title || description" class="border-b border-border px-5 py-4 text-center">
							<h2 v-if="title" :id="titleId" class="text-sm font-semibold text-canvas-fg">{{ title }}</h2>
							<p v-if="description" :id="descriptionId" class="mt-1 text-xs leading-5 text-muted-fg">{{ description }}</p>
						</div>
						<div>
							<button
								v-for="action in actions"
								:key="action.value || action.label"
								type="button"
								class="block min-h-14 w-full border-b border-border px-5 py-3 text-center transition last:border-b-0 hover:bg-secondary/70 active:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-40 disabled:pointer-events-none"
								:disabled="action.disabled"
								:class="action.variant === 'danger' ? 'text-destructive' : 'text-canvas-fg'"
								@click="selectAction(action)"
							>
								<span class="block text-sm font-medium">{{ action.label }}</span>
								<span v-if="action.description" class="mt-0.5 block text-xs text-muted-fg">{{ action.description }}</span>
							</button>
						</div>
					</div>
					<button
						data-close
						type="button"
						class="skin-control mt-2 min-h-14 w-full shrink-0 rounded-2xl px-5 text-sm font-semibold transition hover:brightness-[0.98] active:brightness-[0.96] focus-visible:outline-2 focus-visible:outline-ring"
					>{{ cancelLabel }}</button>
				</section>
			</div>
		</dom-drawer>
	</Teleport>
</template>
