<script setup>
import { computed, nextTick, onMounted, ref, shallowRef, useId, watch } from 'vue';
import { resolveFloatingTeleportTarget } from '../../lib/vue/floatingTeleportTarget.js';
import DomFieldLoadingSpinner from '../_shared/DomFieldLoadingSpinner.vue';
import { booleanProp, normalizeOption, searchableText } from '../_shared/options.js';
import DomOptionStatus from '../_shared/DomOptionStatus.vue';
import { useOptionPaging } from '../_shared/useOptionPaging.js';
import { useSelectedOptions } from '../_shared/useSelectedOptions.js';
import DomField from '../field/DomField.vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';

const listId = `dom-combobox-${useId()}`;

defineOptions({
	__doc: {
		name: 'Combobox',
		tag: '<DomCombobox>',
		description: 'Select-like combobox with a styled input, floating list, keyboard navigation, and query events for async lookups.',
		slots: [
			{ name: 'item', payload: '{ item, index, selected, query }', description: 'Replaces each option body. The control keeps the selected checkmark.' },
		],
		events: [
			{ name: 'query', payload: '(query: string)', description: 'Fired as the user types. Use it to fetch or replace options.' },
			{ name: 'select', payload: '({ item, value, label })', description: 'Fired when an option is selected. item is the original option object.' },
			{ name: 'list-scroll', payload: '(event: Event)', description: 'Fired when the floating option list scrolls.' },
			{ name: 'load-more', payload: '{ query }', description: 'Request the next page when hasMore is true. The parent owns fetching and appending options.' },
			{ name: 'open', description: 'Fired when the options open with an empty transient query.' },
			{ name: 'close', description: 'Fired when the options close.' },
		],
	},
});

const props = defineProps({
	...fieldProps,
	modelValue: {
		type: [String, Number],
		default: '',
		_edit: { group: 'Control props', description: 'Committed selected value.' },
	},
	options: {
		type: Array,
		required: true,
		_edit: {
			component: 'DomJsonListInput',
			description: 'Available options. May be replaced by async lookup results.',
			props: {
				compact: true,
				addLabel: '+ Add option',
				schema: [
					{ key: 'label', label: 'Label', placeholder: 'Option label', default: (index) => `Option ${index + 1}` },
					{ key: 'value', label: 'Value', placeholder: 'option-value', default: (index) => `option-${index + 1}` },
				],
			},
		},
	},
	placeholder: {
		type: String,
		default: 'Search...',
		_edit: { group: 'Control props', description: 'Placeholder shown when the input is empty.' },
	},
	placement: {
		type: String,
		default: 'bottom',
		_edit: { group: 'Control props', options: ['bottom', 'top', 'right', 'left'], description: 'Preferred side before collision handling.' },
	},
	floatingMode: {
		type: String,
		default: 'viewport',
		_edit: { group: 'Control props', options: ['viewport', 'anchor'], description: 'viewport keeps the list inside the browser; anchor keeps it attached while scrolling.' },
	},
	clearable: {
		type: [Boolean, String],
		default: true,
		_edit: { group: 'Control props', description: 'Show a clear button when an option has been selected.' },
	},
	loading: {
		type: [Boolean, String],
		default: false,
		_edit: { group: 'Control props', description: 'Show an inline spinner while async options are being fetched.' },
	},
	filterOptions: { type: [Boolean, String], default: true },
	hasMore: { type: [Boolean, String], default: false },
	selectedOptions: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'query', 'select', 'list-scroll', 'load-more', 'open', 'close', 'focus', 'blur']);

const root = ref(null);
const inputEl = ref(null);
const list = ref(null);
const query = ref('');
const isOpen = ref(false);
const isMounted = ref(false);
const teleportTarget = shallowRef(null);
const field = useField(props, emit, { idPrefix: 'dom-combobox' });
const isClearable = computed(() => booleanProp(props.clearable, true));
const isLoading = computed(() => booleanProp(props.loading, false));
const hasSelection = computed(() => field.value.value !== null && field.value.value !== undefined && field.value.value !== '');
const inputAttrs = computed(() => {
	const { value: _value, ...attrs } = field.inputAttrs.value;
	return attrs;
});
const inputPaddingClass = computed(() => {
	if (isClearable.value && hasSelection.value && isLoading.value) return 'pr-28';
	if (isClearable.value && hasSelection.value) return 'pr-20';
	if (isLoading.value) return 'pr-20';
	return 'pr-10';
});
const loadingPositionClass = computed(() => (isClearable.value && hasSelection.value ? 'right-[4.25rem]' : 'right-9'));

const optionList = computed(() => props.options.map((option) => normalizeOption(option)).filter(Boolean));
const selectedItems = useSelectedOptions(optionList, computed(() => [field.value.value]), () => props.selectedOptions);
const hasMoreOptions = computed(() => booleanProp(props.hasMore));
const filterLocally = computed(() => booleanProp(props.filterOptions, true));
const matchingOptions = computed(() => optionList.value.filter((option) => !filterLocally.value || searchableText(option, ['label', 'value', 'description', 'group', 'email', 'role']).includes(query.value.trim().toLowerCase())));
const paging = useOptionPaging(props, emit, { list, options: optionList, query, open: isOpen });

/**
 * Resolve the user-facing text shown for a committed value.
 *
 * @param {string|number|null|undefined} value Current model value.
 * @returns {string|number} Option label or raw value fallback.
 */
function displayForValue(value) {
	const selected = selectedItems.value.find((option) => String(option.value) === String(value));
	return selected ? (selected.label ?? selected.value ?? '') : (value ?? '');
}

/**
 * Synchronize the headless host and visible input from the Vue model value.
 *
 * @returns {void}
 */
function syncInputFromModel() {
	if (root.value && root.value.value !== String(field.value.value ?? '')) {
		root.value.value = field.value.value ?? '';
	}
	if (inputEl.value) inputEl.value.value = displayForValue(field.value.value);
}

/**
 * Refresh the input label after async option records change.
 *
 * @returns {void}
 */
function syncInputAfterOptionsChange() {
	if (!hasSelection.value || field.focused.value) return;
	syncInputFromModel();
}

onMounted(async () => {
	teleportTarget.value = resolveFloatingTeleportTarget(root.value);
	isMounted.value = true;
	await nextTick();
	await import('../../lib/headless/combobox.js');
	syncInputFromModel();
	root.value?.addEventListener('dom:change', (event) => field.onInput(event.detail.value));
	root.value?.addEventListener('dom:select', (event) => {
		const index = Number(event.detail.option?.dataset.index);
		emit('select', {
			item: Number.isFinite(index) ? optionList.value[index] : null,
			value: event.detail.value,
			label: event.detail.label,
			option: event.detail.option,
		});
	});
	root.value?.addEventListener('dom:query', (event) => {
		query.value = event.detail.query;
		emit('query', event.detail.query);
	});
	root.value?.addEventListener('dom:open', () => { isOpen.value = true; emit('open'); });
	root.value?.addEventListener('dom:close', () => { isOpen.value = false; emit('close'); });
	root.value?.addEventListener('dom:load-more', () => paging.requestMore());
});

watch(field.value, syncInputFromModel);
watch(optionList, syncInputAfterOptionsChange);

/**
 * Clear the selected value and close any open suggestion list.
 *
 * @returns {void}
 */
function clearSelection() {
	if (field.disabled.value || field.readOnly.value) return;
	field.setValue('');
	if (root.value) root.value.value = '';
	if (inputEl.value) inputEl.value.value = '';
	root.value?.removeAttribute('open');
	emit('select', { item: null, value: '', label: '', option: null });
}

</script>

<template>
	<DomField v-bind="field.fieldAttrs.value" :chrome="chrome">
		<dom-combobox
			ref="root"
			:data-menu-id="listId"
			:value-label="displayForValue(field.value.value)"
			:placement="placement"
			:floating-mode="floatingMode"
			:filter-options="String(filterLocally)"
			:has-more="hasMoreOptions ? '' : null"
			class="relative block"
		>
			<input
				v-bind="inputAttrs"
				ref="inputEl"
				slot="input"
				type="text"
				class="skin-input h-10 rounded-full px-4 focus:ring-ring/60"
				:class="inputPaddingClass"
				@focus="field.onFocus"
				@blur="field.onBlur"
			/>
			<DomFieldLoadingSpinner
				v-if="isLoading"
				class="absolute top-1"
				:class="loadingPositionClass"
			/>
			<button
				v-if="isClearable && hasSelection"
				type="button"
				class="absolute right-9 top-1 inline-flex size-8 items-center justify-center rounded-full text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
				aria-label="Clear selection"
				:disabled="field.disabled.value || field.readOnly.value"
				@click.stop="clearSelection"
				@mousedown.prevent
			>
				<svg viewBox="0 0 20 20" class="size-4" fill="none">
					<circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5" />
					<path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
				</svg>
			</button>
			<button
				slot="toggle"
				type="button"
				class="absolute right-1 top-1 inline-flex size-8 items-center justify-center rounded-full text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
				aria-label="Show options"
				:disabled="field.disabled.value || field.readOnly.value"
			>
				<svg viewBox="0 0 20 20" class="size-4" fill="none">
					<path d="M6 8l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>
			<Teleport :to="teleportTarget || 'body'" :disabled="!isMounted || !teleportTarget">
				<ul
					:id="listId"
					ref="list"
					hidden
					:aria-busy="isLoading"
					class="dom-floating-transition skin-popover z-50 max-h-[min(15rem,var(--dom-floating-available-height))] overflow-auto rounded-2xl p-1"
					@scroll="paging.onScroll"
				>
					<li
						v-for="(option, index) in optionList"
						:key="option.value ?? index"
						:data-value="option.value"
						:data-label="option.label"
						:data-index="index"
						:data-search="searchableText(option, ['label', 'value', 'description', 'group', 'email', 'role'])"
						:aria-disabled="option.disabled || undefined"
						class="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition data-[active]:bg-accent aria-selected:bg-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
					>
						<span class="min-w-0 flex-1"><slot name="item" :item="option" :index="index" :selected="String(option.value) === String(field.value.value)" :query="query">{{ option.label }}</slot></span>
						<svg v-if="String(option.value) === String(field.value.value)" viewBox="0 0 20 20" class="size-4 shrink-0" fill="none" aria-hidden="true"><path d="M4.5 10.5 8 14l7.5-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
					</li>
					<DomOptionStatus as="li" :loading="isLoading" :has-more="hasMoreOptions" :empty="!matchingOptions.length" @load-more="paging.requestMore(true)" />
				</ul>
			</Teleport>
		</dom-combobox>
	</DomField>
</template>
