<script setup>
import { computed, nextTick, onMounted, ref, shallowRef, useId, watch } from 'vue';
import { normalizeOption } from '../_shared/options.js';
import DomField from '../field/DomField.vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';

const listId = `dom-select-${useId()}`;

defineOptions({
	__doc: {
		name: 'Select',
		tag: '<DomSelect>',
		description: 'A styled select control with a closed trigger, floating listbox, keyboard navigation, and rich option slots.',
		slots: [
			{ name: 'value', payload: '{ option, value, label, placeholder }', description: 'Custom selected-value markup inside the trigger.' },
			{ name: 'option', payload: '{ option, index, selected }', description: 'Custom option markup inside the floating list.' },
		],
		events: [
			{ name: 'update:modelValue', payload: '(value: string)', description: 'Emitted when the selected option changes.' },
			{ name: 'select', payload: '({ option, value, label })', description: 'Emitted with the selected option record.' },
		],
		keyboard: [
			{ keys: 'Enter / Space / ↓', action: 'Open the listbox.' },
			{ keys: '↑ / ↓', action: 'Move active option.' },
			{ keys: 'Enter / Space', action: 'Select active option.' },
			{ keys: 'Esc / Tab', action: 'Close and return focus.' },
		],
	},
});

const props = defineProps({
	...fieldProps,
	modelValue: {
		type: [String, Number],
		default: '',
		_edit: { group: 'Control props', description: 'Selected option value.' },
	},
	options: {
		type: Array,
		required: true,
		_edit: {
			component: 'DomJsonListInput',
			description: 'Available options. Use the option slot for rich rows.',
			props: {
				compact: true,
				addLabel: '+ Add option',
				schema: [
					{ key: 'label', label: 'Label', placeholder: 'Option label', default: (index) => `Option ${index + 1}` },
					{ key: 'value', label: 'Value', placeholder: 'option-value', default: (index) => `option-${index + 1}` },
					{ key: 'description', label: 'Description', placeholder: 'Optional helper text' },
				],
			},
		},
	},
	placeholder: {
		type: String,
		default: 'Select an option',
		_edit: { group: 'Control props', description: 'Text shown when no option is selected.' },
	},
	placement: {
		type: String,
		default: 'bottom',
		_edit: { group: 'Control props', options: ['bottom', 'top', 'right', 'left'], description: 'Preferred side before collision handling.' },
	},
	align: {
		type: String,
		default: 'left',
		_edit: { group: 'Control props', options: ['left', 'right'], description: 'Horizontal panel alignment.' },
	},
	floatingMode: {
		type: String,
		default: 'viewport',
		_edit: { group: 'Control props', options: ['viewport', 'anchor'], description: 'viewport keeps the list inside the browser; anchor keeps it attached while scrolling.' },
	},
	width: {
		type: String,
		default: 'min-w-[14rem]',
		_edit: { group: 'Control props', description: 'Tailwind width utility for the floating listbox.' },
	},
});
const emit = defineEmits(['update:modelValue', 'select', 'focus', 'blur']);

const root = ref(null);
const listbox = ref(null);
const isMounted = ref(false);
const teleportTarget = shallowRef(null);
const field = useField(props, emit, { idPrefix: 'dom-select' });

const optionList = computed(() => props.options.map((option) => normalizeOption(option, {
	stringifyValue: true,
	allowEmptyValue: true,
})).filter(Boolean));
const selectedOption = computed(() => optionList.value.find((option) => String(option.value) === String(field.value.value)) || null);
const selectedLabel = computed(() => selectedOption.value?.label ?? '');
const selectedValue = computed(() => String(field.value.value ?? ''));
const triggerClasses = computed(() => [
	'skin-input flex h-auto min-h-10 cursor-pointer items-center justify-between gap-3 rounded-full py-2 pr-3 text-left',
	(field.disabled.value || field.readOnly.value) && 'cursor-not-allowed opacity-60',
	field.invalid.value && 'border-destructive focus:border-destructive focus:ring-destructive/25',
]);

onMounted(async () => {
	teleportTarget.value = root.value?.ownerDocument?.body || document.body;
	isMounted.value = true;
	await nextTick();
	await Promise.all([
		import('../../lib/headless/dropdown.js'),
		import('../../lib/headless/listbox.js'),
	]);
	listbox.value?.addEventListener('dom:select', onSelect);
});

watch(selectedValue, () => {
	if (listbox.value && listbox.value.value !== selectedValue.value) listbox.value.value = selectedValue.value;
});

function onSelect(event) {
	if (field.disabled.value || field.readOnly.value) return;
	const value = event.detail.value;
	const option = optionList.value.find((item) => String(item.value) === String(value)) || null;
	field.onInput(value);
	emit('select', {
		option,
		value,
		label: option?.label ?? value,
	});
	close();
}

function close() {
	if (root.value) root.value.open = false;
}
</script>

<template>
	<DomField v-bind="field.fieldAttrs.value" :chrome="chrome">
		<input
			v-if="field.htmlName.value"
			type="hidden"
			:name="field.htmlName.value"
			:value="field.value.value ?? ''"
		/>
		<dom-dropdown
			ref="root"
			:data-menu-id="listId"
			:align="align"
			:placement="placement"
			:floating-mode="floatingMode"
			:offset="4"
			:data-disabled="field.disabled.value || field.readOnly.value ? '' : null"
			class="relative block"
		>
			<button
				:id="field.id.value"
				slot="trigger"
				type="button"
				:class="triggerClasses"
				:disabled="field.disabled.value || field.readOnly.value || undefined"
				:aria-label="label || placeholder"
				:aria-describedby="field.describedBy.value || undefined"
				:aria-invalid="field.invalid.value || undefined"
				:aria-errormessage="field.errorId.value || undefined"
				@focus="field.onFocus"
				@blur="field.onBlur"
			>
				<span class="min-w-0 flex-1 truncate">
					<slot
						name="value"
						:option="selectedOption"
						:value="selectedValue"
						:label="selectedLabel"
						:placeholder="placeholder"
					>
						<span :class="selectedOption ? 'text-canvas-fg' : 'text-muted-fg'">
							{{ selectedOption ? selectedLabel : placeholder }}
						</span>
					</slot>
				</span>
				<svg viewBox="0 0 20 20" class="size-4 shrink-0 text-muted-fg" fill="none" aria-hidden="true">
					<path d="M6 8l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>
			<Teleport :to="teleportTarget || 'body'" :disabled="!isMounted || !teleportTarget">
				<dom-listbox
					:id="listId"
					ref="listbox"
					:value="selectedValue"
					data-composite-panel="true"
					data-haspopup="listbox"
					class="dom-dropdown-menu dom-floating-transition skin-popover z-50 max-h-[min(18rem,var(--dom-floating-available-height))] overflow-auto rounded-2xl p-1"
					:class="width"
				>
					<button
						v-for="(option, index) in optionList"
						:key="option.value ?? index"
						role="option"
						type="button"
						:data-value="option.value"
						:disabled="option.disabled || undefined"
						class="block w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm text-canvas-fg outline-none transition hover:bg-accent focus:bg-accent aria-selected:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
					>
						<slot name="option" :option="option" :index="index" :selected="String(option.value) === selectedValue">
							<span class="block font-medium">{{ option.label }}</span>
							<span v-if="option.description" class="mt-0.5 block text-xs text-muted-fg">{{ option.description }}</span>
						</slot>
					</button>
				</dom-listbox>
			</Teleport>
		</dom-dropdown>
	</DomField>
</template>
