<script setup>
import { computed, nextTick, onMounted, ref, shallowRef, useId, watch } from 'vue';
import { resolveFloatingTeleportTarget } from '../../lib/vue/floatingTeleportTarget.js';
import { booleanProp, normalizeOption, searchableText } from '../_shared/options.js';
import DomOptionStatus from '../_shared/DomOptionStatus.vue';
import { useOptionPaging } from '../_shared/useOptionPaging.js';
import { useSelectedOptions } from '../_shared/useSelectedOptions.js';
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
			{ name: 'value', payload: '{ option, options, value, label, placeholder }', description: 'Custom selected-value markup inside the trigger. options contains all selected records in multiple mode.' },
			{ name: 'option', payload: '{ option, index, selected, query, optionId }', description: 'Custom option markup with the transient query for safe text highlighting. optionId identifies the focusable row.' },
			{ name: 'group', payload: '{ group, options, index }', description: 'Custom heading markup for options that share a group.' },
		],
		events: [
			{ name: 'update:modelValue', payload: 'string | number | Array<string | number>', description: 'Emitted with one committed value or an array in multiple mode.' },
			{ name: 'select', payload: '({ option, value, label })', description: 'Emitted with the selected option record.' },
			{ name: 'query', payload: 'string', description: 'Emitted on open with an empty query and as the user types in the separate search input.' },
			{ name: 'load-more', payload: '{ query }', description: 'Request another page when hasMore is true. The application owns cursors, requests, errors and appending options.' },
			{ name: 'list-scroll', payload: 'Event', description: 'Scroll event for optional visibility-based previews.' },
			{ name: 'open', description: 'Emitted when the panel opens.' },
			{ name: 'close', description: 'Emitted when the panel closes.' },
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
		type: [String, Number, Array],
		default: '',
		_edit: { group: 'Control props', description: 'Selected option value.' },
	},
	options: {
		type: Array,
		required: true,
		_edit: {
			component: 'DomJsonListInput',
			description: 'Available options. Set group for non-selectable section headings and use the option slot for rich rows.',
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
	size: {
		type: String,
		default: 'md',
		_edit: { group: 'Control props', options: ['md', 'sm'], description: 'sm is a compact 28px trigger for inspectors and toolbars; the label is kept for screen readers only.' },
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
	multiple: { type: [Boolean, String], default: false, _edit: { description: 'Toggle multiple values without closing the panel. Use an array v-model.' } },
	filterOptions: { type: [Boolean, String], default: true, _edit: { description: 'Disable local filtering for server-ranked options.' } },
	loading: { type: [Boolean, String], default: false },
	hasMore: { type: [Boolean, String], default: false },
	selectedOptions: { type: Array, default: () => [], _edit: { description: 'Resolved records for initial values outside the currently loaded server page.' } },
	clearable: { type: [Boolean, String], default: false },
});
const emit = defineEmits(['update:modelValue', 'select', 'query', 'load-more', 'list-scroll', 'open', 'close', 'focus', 'blur']);

const root = ref(null);
const listbox = ref(null);
const searchInput = ref(null);
const searchQuery = ref('');
const isOpen = ref(false);
const isMounted = ref(false);
const teleportTarget = shallowRef(null);
const field = useField(props, emit, { idPrefix: 'dom-select' });
const isSearchable = computed(() => booleanProp(props.searchable, false));
const isMultiple = computed(() => booleanProp(props.multiple));
const isLoading = computed(() => booleanProp(props.loading));
const hasMoreOptions = computed(() => booleanProp(props.hasMore));
const filterLocally = computed(() => booleanProp(props.filterOptions, true));

const optionList = computed(() => props.options.map((option) => normalizeOption(option, {
	allowEmptyValue: true,
})).filter(Boolean));
const filteredOptions = computed(() => {
	if (!isSearchable.value || !filterLocally.value) return optionList.value;
	const needle = searchQuery.value.trim().toLowerCase();
	if (!needle) return optionList.value;
	return optionList.value.filter((option) => searchableText(option).includes(needle));
});
const optionSections = computed(buildOptionSections);
const hasOptionGroups = computed(() => optionSections.value.some((section) => section.group));
const selectedValues = computed(() => isMultiple.value ? (Array.isArray(field.value.value) ? field.value.value : []) : [field.value.value ?? '']);
const selectedKeys = computed(() => new Set(selectedValues.value.map(String)));
const selectedItems = useSelectedOptions(optionList, selectedValues, () => props.selectedOptions);
const selectedOption = computed(() => selectedItems.value[0] && (selectedItems.value[0].value !== '' || optionList.value.some((option) => option.value === '')) ? selectedItems.value[0] : null);
const selectedLabel = computed(() => selectedItems.value.map((option) => option.label).join(', '));
const selectedValue = computed(() => isMultiple.value ? JSON.stringify(selectedValues.value.map(String)) : String(field.value.value ?? ''));
const paging = useOptionPaging(props, emit, { list: listbox, options: filteredOptions, query: searchQuery, open: isOpen });
const compact = computed(() => props.size === 'sm');
const triggerClasses = computed(() => [
	compact.value
		? 'relative flex h-7 w-full cursor-pointer items-center rounded-md bg-secondary/60 pl-2 text-left text-xs text-canvas-fg outline-none ring-inset transition hover:ring-1 hover:ring-border focus:bg-canvas focus:ring-1 focus:ring-primary'
		: 'skin-input relative flex h-auto min-h-10 cursor-pointer items-center py-2 text-left',
	compact.value ? (booleanProp(props.clearable) && selectedLabel.value ? 'pr-11' : 'pr-6') : (booleanProp(props.clearable) && selectedLabel.value ? 'pr-18' : 'pr-10'),
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

/**
 * Build ordered option sections while preserving each option's filtered-list index.
 *
 * Options with the same non-empty group label share an accessible group. Ungrouped
 * options remain in an unlabelled section and behave exactly like the flat list.
 *
 * @returns {Array<{ key: string, group: string|null, options: Array<Object>, entries: Array<{ option: Object, index: number }> }>} Ordered option sections.
 */
function buildOptionSections() {
	const sections = [];
	const sectionsByGroup = new Map();

	filteredOptions.value.forEach((option, index) => {
		const group = optionGroupLabel(option);
		let section = sectionsByGroup.get(group);

		if (!section) {
			section = {
				key: group === null ? 'ungrouped' : `group:${group}`,
				group,
				options: [],
				entries: [],
			};
			sectionsByGroup.set(group, section);
			sections.push(section);
		}

		section.options.push(option);
		section.entries.push({ option, index });
	});

	return sections;
}

/**
 * Normalize an option's group into a visible heading label.
 *
 * @param {Object|null|undefined} option Normalized select option.
 * @returns {string|null} Trimmed group label, or null for an ungrouped option.
 */
function optionGroupLabel(option) {
	if (option?.group === undefined || option?.group === null) return null;
	const group = String(option.group).trim();
	return group || null;
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
	root.value?.addEventListener('dom:close', onClose);
	listbox.value?.addEventListener('dom:load-more', () => paging.requestMore());
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
	const option = optionList.value.find((item) => String(item.value) === String(event.detail.value)) || null;
	if (!option || option.disabled) return;
	const value = option.value;
	const nextValue = isMultiple.value
		? selectedKeys.value.has(String(value)) ? selectedValues.value.filter((item) => String(item) !== String(value)) : [...selectedValues.value, value]
		: value;
	field.onInput(nextValue);
	emit('select', {
		option,
		value,
		label: option?.label ?? value,
	});
	if (!isMultiple.value) close();
}

/**
 * Reset transient search state when the select panel opens.
 *
 * @returns {void}
 */
function onOpen() {
	isOpen.value = true;
	resetSearch();
	emit('query', '');
	emit('open');
	nextTick(() => {
		if (isSearchable.value) searchInput.value?.focus({ preventScroll: true });
		const selected = listbox.value?.querySelector('[aria-selected="true"]');
		if (!isMultiple.value && selected && listbox.value) {
			const row = selected.getBoundingClientRect();
			const viewport = listbox.value.getBoundingClientRect();
			// Enter animations scale the panel; scrollTop uses untransformed CSS pixels.
			const scale = viewport.height / listbox.value.offsetHeight || 1;
			listbox.value.scrollTop += (row.top - viewport.top) / scale - (listbox.value.clientHeight - selected.offsetHeight) / 2;
		} else if (listbox.value) listbox.value.scrollTop = 0;
	});
}

/** Reset only transient search on close, without launching another server request. */
function onClose() {
	isOpen.value = false;
	resetSearch();
	emit('close');
}

/**
 * Clear committed values while preserving the single/multiple value contract.
 * Restore focus to the persistent trigger when the clear button disappears.
 *
 * @returns {void}
 */
function clearSelection() {
	if (field.disabled.value || field.readOnly.value) return;
	const value = isMultiple.value ? [] : '';
	field.onInput(value);
	emit('select', { option: null, value, label: '' });
	close();
	nextTick(() => root.value?.querySelector('[slot="trigger"]')?.focus({ preventScroll: true }));
}

/** Forward intentional typing and reset the result viewport for the new query. */
function onQuery() {
	if (listbox.value) listbox.value.scrollTop = 0;
	emit('query', searchQuery.value);
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
		selectOption(filteredOptions.value.find((option) => !option.disabled));
		return;
	}
	if (event.key === 'Home' || event.key === 'End') {
		event.stopPropagation();
	}
}
</script>

<template>
	<DomField v-bind="compact ? { ...field.fieldAttrs.value, label: '' } : field.fieldAttrs.value" :chrome="chrome" class="min-w-0">
		<input
			v-for="(value, index) in (isMultiple ? selectedValues : [field.value.value ?? ''])"
			:key="index"
			type="hidden"
			:name="field.htmlName.value"
			:value="value"
			:disabled="field.disabled.value"
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
						:options="selectedItems"
						:value="field.value.value"
						:label="selectedLabel"
						:placeholder="placeholder"
					>
						<span :class="selectedOption ? 'text-canvas-fg' : 'text-muted-fg'">
							{{ selectedOption ? selectedLabel : placeholder }}
						</span>
					</slot>
				</span>
				<svg viewBox="0 0 20 20" class="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-fg" :class="compact ? 'right-1.5 size-3.5' : 'right-3 size-4'" fill="none" aria-hidden="true">
					<path d="M6 8l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>
			<button
				v-if="booleanProp(clearable) && selectedLabel"
				type="button"
				aria-label="Clear selection"
				class="absolute top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full text-muted-fg hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
				:class="compact ? 'right-6 size-5' : 'right-9 size-8'"
				:disabled="field.disabled.value || field.readOnly.value"
				@click.stop="clearSelection"
				@mousedown.prevent
			>
				<svg viewBox="0 0 20 20" class="size-4" fill="none" aria-hidden="true">
					<path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
				</svg>
			</button>
			<Teleport :to="teleportTarget || 'body'" :disabled="!isMounted || !teleportTarget">
				<div
					:id="panelId"
					popover="manual"
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
							@input="onQuery"
						/>
					</div>
					<dom-listbox
						:id="listId"
						ref="listbox"
						:value="selectedValue"
						:multiple="isMultiple ? '' : null"
						:has-more="hasMoreOptions ? '' : null"
						:aria-busy="isLoading"
						@scroll="paging.onScroll"
						class="min-h-0 overflow-auto"
						:class="hasOptionGroups ? 'px-1 pb-1' : 'p-1'"
					>
						<div
							v-for="(section, sectionIndex) in optionSections"
							:key="section.key"
							:role="section.group ? 'group' : null"
							:aria-labelledby="section.group ? `${listId}-group-${sectionIndex}` : null"
							:class="section.group ? 'pb-1 last:pb-0' : 'contents'"
						>
							<div
								v-if="section.group"
								class="sticky top-0 z-10 bg-[var(--skin-popover-bg,var(--canvas))]"
							>
								<div
									:id="`${listId}-group-${sectionIndex}`"
									class="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg"
								>
									<slot name="group" :group="section.group" :options="section.options" :index="sectionIndex">
										{{ section.group }}
									</slot>
								</div>
								<div class="mx-3 mb-1 border-t border-border" aria-hidden="true"></div>
							</div>
							<button
								v-for="entry in section.entries"
								:key="entry.option.value ?? entry.index"
								:id="`${listId}-option-${entry.index}`"
								role="option"
								type="button"
								:data-value="entry.option.value"
								:aria-selected="selectedKeys.has(String(entry.option.value))"
								:disabled="entry.option.disabled || undefined"
								class="dom-select-option flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm text-canvas-fg outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
							>
								<span class="min-w-0 flex-1">
									<slot
										name="option"
										:option="entry.option"
										:index="entry.index"
										:selected="selectedKeys.has(String(entry.option.value))"
										:query="searchQuery"
										:option-id="`${listId}-option-${entry.index}`"
									>
										<span class="block font-medium">{{ entry.option.label }}</span>
										<span v-if="entry.option.description" class="dom-select-option-description mt-0.5 block text-xs text-muted-fg">{{ entry.option.description }}</span>
									</slot>
								</span>
								<svg
									v-if="selectedKeys.has(String(entry.option.value))"
									viewBox="0 0 20 20"
									class="size-4 shrink-0"
									fill="none"
									aria-hidden="true"
								>
									<path d="M4.5 10.5 8 14l7.5-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</button>
						</div>
						<DomOptionStatus :loading="isLoading" :has-more="hasMoreOptions" :empty="!filteredOptions.length" @load-more="paging.requestMore(true)" />
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
