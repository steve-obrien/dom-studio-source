<script setup>
import { computed, nextTick, onMounted, ref, shallowRef, useId, watch } from 'vue';
import { resolveFloatingTeleportTarget } from '../../lib/vue/floatingTeleportTarget.js';
import { booleanProp, normalizeOption, searchableText } from '../_shared/options.js';
import DomField from '../field/DomField.vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';

const id = useId();
const panelId = `dom-select-panel-${id}`;
const listId = `dom-select-list-${id}`;

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
			{ keys: 'Type in search', action: 'Filter visible options when searchable is enabled.' },
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
	optionTone: {
		type: String,
		default: 'accent',
		_edit: { group: 'Control props', description: 'Theme token basename for hovered, focused, and selected options. For example, primary uses var(--primary) and var(--primary-fg).' },
	},
	searchable: {
		type: [Boolean, String],
		default: false,
		_edit: { group: 'Control props', description: 'Show a search input inside the option panel while keeping select-style committed values.' },
	},
	searchPlaceholder: {
		type: String,
		default: 'Search options...',
		_edit: { group: 'Control props', description: 'Placeholder shown inside the panel search input.' },
	},
});
const emit = defineEmits(['update:modelValue', 'select', 'focus', 'blur']);

const root = ref(null);
const listbox = ref(null);
const searchInput = ref(null);
const searchQuery = ref('');
const isMounted = ref(false);
const teleportTarget = shallowRef(null);
const field = useField(props, emit, { idPrefix: 'dom-select' });
const isSearchable = computed(() => booleanProp(props.searchable, false));

const optionList = computed(() => props.options.map((option) => normalizeOption(option, {
	stringifyValue: true,
	allowEmptyValue: true,
})).filter(Boolean));
const filteredOptions = computed(() => {
	if (!isSearchable.value) return optionList.value;
	const needle = searchQuery.value.trim().toLowerCase();
	if (!needle) return optionList.value;
	return optionList.value.filter((option) => searchableText(option).includes(needle));
});
const selectedOption = computed(() => optionList.value.find((option) => String(option.value) === String(field.value.value)) || null);
const selectedLabel = computed(() => selectedOption.value?.label ?? '');
const selectedValue = computed(() => String(field.value.value ?? ''));
const triggerClasses = computed(() => [
	'skin-input flex h-auto min-h-10 cursor-pointer items-center justify-between gap-3 py-2 pr-3 text-left',
	(field.disabled.value || field.readOnly.value) && 'cursor-not-allowed opacity-60',
	field.invalid.value && 'border-destructive focus:border-destructive focus:ring-destructive/25',
]);
const optionToneStyle = computed(() => {
	const tone = normalizeThemeVariableName(props.optionTone);
	return {
		'--dom-select-option-active-bg': `var(--${tone}, var(--accent))`,
		'--dom-select-option-active-fg': `var(--${tone}-fg, var(--accent-fg))`,
	};
});

/**
 * Normalize a theme token basename before using it to assemble CSS variable references.
 *
 * @param {string|null|undefined} value Theme token basename such as accent, primary, or --brand.
 * @returns {string} Safe CSS custom property basename without the leading double dash.
 */
function normalizeThemeVariableName(value) {
	const name = String(value || '').trim().replace(/^--/, '');
	return /^[A-Za-z][A-Za-z0-9_-]*$/.test(name) ? name : 'accent';
}

onMounted(async () => {
	teleportTarget.value = resolveFloatingTeleportTarget(root.value);
	isMounted.value = true;
	await nextTick();
	await Promise.all([
		import('../../lib/headless/dropdown.js'),
		import('../../lib/headless/listbox.js'),
	]);
	listbox.value?.addEventListener('dom:select', onSelect);
	root.value?.addEventListener('dom:open', onOpen);
	root.value?.addEventListener('dom:close', resetSearch);
});

watch(selectedValue, () => {
	if (listbox.value && listbox.value.value !== selectedValue.value) listbox.value.value = selectedValue.value;
});
watch(isSearchable, () => {
	if (!isSearchable.value) resetSearch();
});

/**
 * Commit the selected option value and close the floating panel.
 *
 * @param {CustomEvent<{ value: string }>} event Selection event from the headless listbox.
 * @returns {void}
 */
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

/**
 * Reset transient search state when the select panel opens.
 *
 * @returns {void}
 */
function onOpen() {
	resetSearch();
	if (!isSearchable.value) return;
	nextTick(() => searchInput.value?.focus());
}

/**
 * Close the headless dropdown host.
 *
 * @returns {void}
 */
function close() {
	if (root.value) root.value.open = false;
}

/**
 * Clear the panel search input and matching query state.
 *
 * @returns {void}
 */
function resetSearch() {
	searchQuery.value = '';
	if (searchInput.value) searchInput.value.value = '';
}

/**
 * Select an option from keyboard-driven searchable interactions.
 *
 * @param {{ value: string, disabled?: boolean }|null|undefined} option Normalized option record.
 * @returns {void}
 */
function selectOption(option) {
	if (!option || option.disabled) return;
	onSelect({
		detail: { value: option.value },
	});
}

/**
 * Move focus to the first or last visible option in the listbox.
 *
 * @param {'first'|'last'} [position='first'] Position to focus.
 * @returns {void}
 */
function focusVisibleOption(position = 'first') {
	const options = Array.from(listbox.value?.querySelectorAll('[role="option"]:not([disabled])') || [])
		.filter((option) => option.getAttribute('aria-disabled') !== 'true');
	if (!options.length) return;
	const option = position === 'last' ? options[options.length - 1] : options[0];
	option.focus();
}

/**
 * Handle search-box keyboard shortcuts without leaking navigation to the listbox wrapper.
 *
 * @param {KeyboardEvent} event Search input keydown event.
 * @returns {void}
 */
function onSearchKeydown(event) {
	if (event.key === 'ArrowDown') {
		event.preventDefault();
		event.stopPropagation();
		focusVisibleOption('first');
		return;
	}
	if (event.key === 'ArrowUp') {
		event.preventDefault();
		event.stopPropagation();
		focusVisibleOption('last');
		return;
	}
	if (event.key === 'Enter') {
		event.preventDefault();
		event.stopPropagation();
		selectOption(filteredOptions.value[0]);
		return;
	}
	if (event.key === 'Home' || event.key === 'End') {
		event.stopPropagation();
	}
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
			:data-menu-id="panelId"
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
				:aria-controls="panelId"
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
				<div
					:id="panelId"
					data-composite-panel="true"
					data-haspopup="listbox"
					class="dom-dropdown-menu dom-floating-transition skin-popover z-50 flex max-h-[min(20rem,var(--dom-floating-available-height))] flex-col overflow-hidden rounded-2xl p-0"
					:class="width"
					:style="optionToneStyle"
				>
					<div v-if="isSearchable" class="border-b border-border p-2">
						<input
							ref="searchInput"
							v-model="searchQuery"
							type="search"
							data-autofocus
							:placeholder="searchPlaceholder"
							:aria-label="label ? `Search ${label}` : 'Search options'"
							:aria-controls="listId"
							class="skin-input h-9 w-full rounded-full px-3 text-sm focus:ring-ring/60"
							@focus="field.onFocus"
							@blur="field.onBlur"
							@keydown="onSearchKeydown"
						/>
					</div>
					<dom-listbox
						:id="listId"
						ref="listbox"
						:value="selectedValue"
						class="min-h-0 overflow-auto p-1"
					>
						<button
							v-for="(option, index) in filteredOptions"
							:key="option.value ?? index"
							role="option"
							type="button"
							:data-value="option.value"
							:disabled="option.disabled || undefined"
							class="dom-select-option block w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm text-canvas-fg outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
						>
							<slot name="option" :option="option" :index="index" :selected="String(option.value) === selectedValue">
								<span class="block font-medium">{{ option.label }}</span>
								<span v-if="option.description" class="dom-select-option-description mt-0.5 block text-xs text-muted-fg">{{ option.description }}</span>
							</slot>
						</button>
						<div v-if="isSearchable && !filteredOptions.length" class="px-3 py-6 text-center text-sm text-muted-fg">
							No options found
						</div>
					</dom-listbox>
				</div>
			</Teleport>
		</dom-dropdown>
	</DomField>
</template>

<style scoped>
.dom-select-option:not(:disabled):is(:hover, :focus, [aria-selected="true"]) {
	background-color: var(--dom-select-option-active-bg, var(--accent));
	color: var(--dom-select-option-active-fg, var(--accent-fg));
}

.dom-select-option:not(:disabled):is(:hover, :focus, [aria-selected="true"]) .dom-select-option-description {
	color: var(--dom-select-option-active-fg, var(--accent-fg));
}
</style>
