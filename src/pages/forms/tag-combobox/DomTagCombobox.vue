<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import DomFieldLoadingSpinner from '../_shared/DomFieldLoadingSpinner.vue';
import { booleanProp, normalizeOption, optionKey, searchableText, splitTokens as splitOptionTokens } from '../_shared/options.js';
import { useOptionMenu } from '../_shared/useOptionMenu.js';
import { useOptionPaging } from '../_shared/useOptionPaging.js';
import { useSelectedOptions } from '../_shared/useSelectedOptions.js';
import DomOptionStatus from '../_shared/DomOptionStatus.vue';
import DomField from '../field/DomField.vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';

defineOptions({
	__doc: {
		name: 'Tag combobox',
		tag: '<DomTagCombobox>',
		description: 'A tokenizing multi-select combobox for class lists, recipients, labels, and other values that need autocomplete plus optional custom entries.',
		icon: 'M7 5h5l5 5-7 7-5-5 7-7Zm1.5 4.5h.01M15 15h4M17 13v4',
		slots: [
			{ name: 'item', payload: '{ item, index, active, selected, query, custom }', description: 'Replaces each suggestion row while retaining the selected checkmark.' },
			{ name: 'tag', payload: '{ item, value, label, remove }', description: 'Replaces each selected token.' },
		],
		events: [
			{ name: 'query', payload: 'string', description: 'Fired as the user types.' },
			{ name: 'add', payload: '({ item, value, label, custom })', description: 'Fired when a tag is added.' },
			{ name: 'remove', payload: '({ item, value, label })', description: 'Fired when a tag is removed.' },
			{ name: 'select', payload: '({ item, value, label, custom })', description: 'Fired when a suggestion or custom value is committed.' },
			{ name: 'change', payload: 'Array', description: 'Fired after the selected values array changes.' },
			{ name: 'load-more', payload: '{ query }', description: 'Request the next server page when hasMore is true.' },
		],
	},
});

const props = defineProps({
	...fieldProps,
	modelValue: {
		type: Array,
		default: () => [],
		_edit: {
			component: 'DomJsonInput',
			description: 'Selected tag values.',
		},
	},
	options: {
		type: Array,
		default: () => [],
		_edit: {
			component: 'DomJsonListInput',
			description: 'Autocomplete options. Strings are treated as both label and value.',
			props: {
				compact: true,
				addLabel: '+ Add option',
				schema: [
					{ key: 'label', label: 'Label', placeholder: 'Option label', default: (index) => `Option ${index + 1}` },
					{ key: 'value', label: 'Value', placeholder: 'option-value', default: (index) => `option-${index + 1}` },
					{ key: 'description', label: 'Description', placeholder: 'Optional helper text' },
					{ key: 'group', label: 'Group', placeholder: 'Optional group' },
				],
			},
		},
	},
	placeholder: {
		type: String,
		default: 'Add tags...',
		_edit: { group: 'Control props', description: 'Placeholder shown when no query is active.' },
	},
	allowCustom: {
		type: [Boolean, String],
		default: false,
		_edit: { group: 'Control props', description: 'Allow values that do not exist in options.' },
	},
	filterOptions: {
		type: [Boolean, String],
		default: true,
		_edit: { group: 'Control props', description: 'Filter options locally. Turn off when options are already server-filtered.' },
	},
	loading: {
		type: [Boolean, String],
		default: false,
		_edit: { group: 'Control props', description: 'Show an inline loading spinner while async options are being fetched.' },
	},
	emptyText: {
		type: String,
		default: 'No matches',
		_edit: { group: 'Control props', description: 'Message shown when no option matches and custom values are not available.' },
	},
	maxOptions: {
		type: Number,
		default: 8,
		_edit: { group: 'Control props', description: 'Maximum matching suggestions to show.' },
	},
	tokenSeparators: {
		type: Array,
		default: () => [' ', ','],
		_edit: { component: 'DomJsonInput', group: 'Control props', description: 'Characters that split pasted text into tags.' },
	},
	clearable: {
		type: [Boolean, String],
		default: false,
		_edit: { group: 'Control props', description: 'Show a clear-all button when tags are selected.' },
	},
	hasMore: { type: [Boolean, String], default: false },
	selectedOptions: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue', 'query', 'add', 'remove', 'select', 'change', 'load-more', 'list-scroll', 'focus', 'blur']);

const inputEl = ref(null);
const list = ref(null);
const query = ref('');
const field = useField(props, emit, { idPrefix: 'dom-tag-combobox' });

const selectedValues = computed(() => Array.isArray(field.value.value) ? field.value.value : []);
const normalizedOptions = computed(() => props.options.map((option) => normalizeOption(option)).filter(Boolean));
const selectedItems = useSelectedOptions(normalizedOptions, selectedValues, () => props.selectedOptions);
const selectedValueKeys = computed(() => new Set(selectedValues.value.map(optionKey)));
const isClearable = computed(() => booleanProp(props.clearable, false));
const isCustomAllowed = computed(() => booleanProp(props.allowCustom, false));
const isFilteringOptions = computed(() => booleanProp(props.filterOptions, true));
const isLoading = computed(() => booleanProp(props.loading, false));
const controlInputAttrs = computed(() => {
	const { value, placeholder, ...attrs } = field.inputAttrs.value;
	return attrs;
});
const trimmedQuery = computed(() => query.value.trim());
const exactQueryOption = computed(() => normalizedOptions.value.find((option) => optionKey(option.value) === optionKey(trimmedQuery.value)));
const canCreateQuery = computed(() => {
	if (!isCustomAllowed.value || !trimmedQuery.value) return false;
	if (selectedValueKeys.value.has(optionKey(trimmedQuery.value))) return false;
	return !exactQueryOption.value;
});
const matchingOptions = computed(() => {
	const needle = trimmedQuery.value.toLowerCase();
	return normalizedOptions.value
		.filter((option) => !option.disabled)
		.filter((option) => {
			if (!needle || !isFilteringOptions.value) return true;
			return searchableText(option).includes(needle);
		})
		.slice(0, isFilteringOptions.value ? Math.max(1, props.maxOptions) : undefined);
});
const menuItems = computed(() => {
	const items = matchingOptions.value.map((item) => ({ item, value: item.value, label: item.label, custom: false }));
	if (canCreateQuery.value) {
		items.push({
			item: customOption(trimmedQuery.value),
			value: trimmedQuery.value,
			label: trimmedQuery.value,
			custom: true,
		});
	}
	return items;
});
const optionMenu = useOptionMenu(menuItems, {
	query,
	emitQuery: (value) => emit('query', value),
});
const { activeIndex, isOpen } = optionMenu;
const hasMoreOptions = computed(() => booleanProp(props.hasMore));
const showMenu = computed(() => isOpen.value && !field.disabled.value && !field.readOnly.value);
const hasTags = computed(() => selectedValues.value.length > 0);
const paging = useOptionPaging(props, emit, { list, options: normalizedOptions, query, open: isOpen });

watch(activeIndex, () => nextTick(scrollActiveOption));

/** Build a plain-text record for an allowed free-entry token. */
function customOption(value) {
	return { value, label: String(value), custom: true };
}

/** Resolve a loaded or retained selected record by token value. */
function optionForValue(value) {
	return [...normalizedOptions.value, ...selectedItems.value].find((option) => optionKey(option.value) === optionKey(value));
}

/** Toggle the chosen suggestion; selected rows remain visible with a checkmark. */
function commitItem(entry) {
	if (!entry) return;
	if (selectedValueKeys.value.has(optionKey(entry.value))) { removeValue(entry.value); return; }
	commitValue(entry.value, entry.item, entry.custom);
}

/** Add a unique token, preserving existing selections across remote page changes. */
function commitValue(value, item = null, custom = false) {
	if (field.disabled.value || field.readOnly.value) return;
	if (value == null || value === '') return;
	if (selectedValueKeys.value.has(optionKey(value))) {
		resetQuery();
		return;
	}
	if (!custom && !optionForValue(value) && !isCustomAllowed.value) return;

	const nextValue = [...selectedValues.value, value];
	field.setValue(nextValue);
	emit('add', { item, value, label: item?.label ?? String(value), custom });
	emit('select', { item, value, label: item?.label ?? String(value), custom });
	emit('change', nextValue);
	resetQuery();
	nextTick(() => inputEl.value?.focus());
}

/** Remove one committed token without altering the remaining values. */
function removeValue(value) {
	if (field.disabled.value || field.readOnly.value) return;
	const item = optionForValue(value) || customOption(value);
	const nextValue = selectedValues.value.filter((candidate) => optionKey(candidate) !== optionKey(value));
	field.setValue(nextValue);
	emit('remove', { item, value, label: item.label });
	emit('change', nextValue);
	nextTick(() => inputEl.value?.focus());
}

/** Clear all tokens unless the field is disabled or read-only. */
function clearAll() {
	if (field.disabled.value || field.readOnly.value) return;
	field.setValue([]);
	emit('change', []);
	nextTick(() => inputEl.value?.focus());
}

/** Clear only transient search after adding a token and keep multi-selection open. */
function resetQuery() {
	optionMenu.reset();
	isOpen.value = true;
}

/** Open suggestions and request the initial remote page when focus enters. */
function onFocus(event) {
	field.onFocus(event);
	optionMenu.cancelClose();
	openMenu();
}

/** Reopen on a click even when Escape left the input focused. */
function openMenu() {
	if (field.disabled.value || field.readOnly.value) return;
	if (!isOpen.value) emit('query', query.value);
	isOpen.value = true;
}

/** Allow a pointer selection to finish before closing on blur. */
function onBlur(event) {
	optionMenu.closeSoon();
	field.onBlur(event);
}

/** Keep the active descendant visible without scrolling the outer document. */
function scrollActiveOption() {
	const option = list.value?.querySelectorAll('[role="option"]')[activeIndex.value];
	if (!option || !list.value) return;
	const row = option.getBoundingClientRect();
	const viewport = list.value.getBoundingClientRect();
	const scale = viewport.height / list.value.offsetHeight || 1;
	if (row.top < viewport.top) list.value.scrollTop += (row.top - viewport.top) / scale;
	else if (row.bottom > viewport.bottom) list.value.scrollTop += (row.bottom - viewport.bottom) / scale;
}

/** Navigate, toggle selections and request another page at the loaded boundary. */
function onKeydown(event) {
	if (field.disabled.value || field.readOnly.value || event.isComposing) return;
	if (event.key === 'ArrowDown') {
		event.preventDefault();
		if (isOpen.value && activeIndex.value === menuItems.value.length - 1 && hasMoreOptions.value) { paging.requestMore(); return; }
		optionMenu.move(1);
		return;
	}
	if (event.key === 'ArrowUp') {
		event.preventDefault();
		optionMenu.move(-1);
		return;
	}
	if (event.key === 'Enter') {
		event.preventDefault();
		if (menuItems.value[activeIndex.value]) commitItem(menuItems.value[activeIndex.value]);
		else if (isCustomAllowed.value) commitValue(trimmedQuery.value, customOption(trimmedQuery.value), true);
		return;
	}
	if (event.key === 'Escape') {
		event.preventDefault();
		isOpen.value = false;
		return;
	}
	if (event.key === 'Backspace' && !query.value && selectedValues.value.length) {
		removeValue(selectedValues.value[selectedValues.value.length - 1]);
	}
}

/** Paste tokens through the same deduplication and permission checks as typing. */
function onPaste(event) {
	const text = event.clipboardData?.getData('text') || '';
	const tokens = splitTokens(text);
	if (tokens.length <= 1) return;
	event.preventDefault();
	for (const token of tokens) {
		const option = optionForValue(token);
		if (option) commitValue(option.value, option, false);
		else if (isCustomAllowed.value) commitValue(token, customOption(token), true);
	}
}

/** Split user text into literal tokens using the configured separators. */
function splitTokens(value) {
	return splitOptionTokens(value, props.tokenSeparators);
}
</script>

<template>
	<DomField v-bind="field.fieldAttrs.value" :chrome="chrome">
		<div class="relative">
			<div
				class="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-2xl border border-input bg-canvas px-2 py-1.5 text-sm shadow-sm transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 data-[invalid]:border-destructive"
				:data-invalid="field.invalid.value ? '' : undefined"
				@click="inputEl?.focus()"
			>
				<span
					v-for="entry in selectedItems"
					:key="optionKey(entry.value)"
					class="inline-flex max-w-full items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-fg ring-1 ring-border"
				>
					<slot name="tag" :item="entry" :value="entry.value" :label="entry.label" :remove="() => removeValue(entry.value)">
						<span class="truncate">{{ entry.label }}</span>
						<button
							type="button"
							class="-mr-1 inline-flex size-4 items-center justify-center rounded-full text-muted-fg hover:bg-canvas hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
							:aria-label="`Remove ${entry.label}`"
							:disabled="field.disabled.value || field.readOnly.value"
							@click.stop="removeValue(entry.value)"
							@mousedown.prevent
						>
							<svg viewBox="0 0 16 16" class="size-3" fill="none" aria-hidden="true">
								<path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
							</svg>
						</button>
					</slot>
				</span>
					<input
						v-bind="controlInputAttrs"
					ref="inputEl"
					v-model="query"
					type="text"
					role="combobox"
					:aria-expanded="showMenu"
					:aria-controls="`${field.id.value}-listbox`"
					:aria-activedescendant="showMenu && menuItems[activeIndex] ? `${field.id.value}-option-${activeIndex}` : undefined"
					aria-autocomplete="list"
					:placeholder="hasTags ? '' : placeholder"
					class="min-w-28 flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-fg disabled:cursor-not-allowed"
					@focus="onFocus"
					@click="openMenu"
					@blur="onBlur"
					@keydown="onKeydown"
						@paste="onPaste"
					/>
					<DomFieldLoadingSpinner
						v-if="isLoading"
					/>
					<button
						v-if="isClearable && hasTags"
					type="button"
					class="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
					aria-label="Clear tags"
					:disabled="field.disabled.value || field.readOnly.value"
					@click.stop="clearAll"
					@mousedown.prevent
				>
					<svg viewBox="0 0 20 20" class="size-4" fill="none" aria-hidden="true">
						<path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
					</svg>
				</button>
			</div>

			<ul
				v-if="showMenu"
				:id="`${field.id.value}-listbox`"
				ref="list"
				role="listbox"
				aria-multiselectable="true"
				:aria-busy="isLoading"
				@scroll="paging.onScroll"
					class="skin-popover absolute z-40 mt-2 max-h-72 w-full overflow-auto rounded-2xl p-1"
				>
				<li
					v-for="(entry, index) in menuItems"
					:key="`${entry.custom ? 'custom' : 'option'}-${optionKey(entry.value)}`"
					role="option"
					:id="`${field.id.value}-option-${index}`"
					:aria-selected="selectedValueKeys.has(optionKey(entry.value))"
					class="cursor-pointer rounded-xl px-3 py-2 text-sm transition"
					:class="activeIndex === index ? 'bg-accent text-accent-fg' : 'hover:bg-accent/70'"
					@mouseenter="activeIndex = index"
					@mousedown.prevent
					@click="commitItem(entry)"
				>
					<div class="flex items-center gap-3"><span class="min-w-0 flex-1"><slot name="item" :item="entry.item" :index="index" :active="activeIndex === index" :selected="selectedValueKeys.has(optionKey(entry.value))" :query="query" :custom="entry.custom">
						<div class="flex min-w-0 items-center justify-between gap-3">
							<span class="min-w-0">
								<span class="block truncate font-medium">{{ entry.custom ? `Add "${entry.label}"` : entry.label }}</span>
								<span v-if="entry.item.description || entry.item.group" class="block truncate text-xs text-muted-fg">
									{{ entry.item.description || entry.item.group }}
								</span>
							</span>
							<span v-if="entry.custom" class="shrink-0 rounded-full bg-canvas/70 px-2 py-0.5 text-[11px] text-muted-fg ring-1 ring-border">custom</span>
						</div>
					</slot></span><svg v-if="selectedValueKeys.has(optionKey(entry.value))" viewBox="0 0 20 20" class="size-4 shrink-0" fill="none" aria-hidden="true"><path d="M4.5 10.5 8 14l7.5-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></div>
				</li>
				<DomOptionStatus as="li" :loading="isLoading" :has-more="hasMoreOptions" :empty="!menuItems.length" :empty-text="emptyText" @load-more="paging.requestMore(true)" />
			</ul>
		</div>
	</DomField>
</template>
