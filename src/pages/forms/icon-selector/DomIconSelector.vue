<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from 'vue';
import { resolveFloatingTeleportTarget } from '../../lib/vue/floatingTeleportTarget.js';
import DomFieldLoadingSpinner from '../_shared/DomFieldLoadingSpinner.vue';
import { booleanProp } from '../_shared/options.js';
import DomField from '../field/DomField.vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';
import {
	createIconSelectorItems,
	fallbackIconSelectorItem,
	iconSelectorItemKey,
	iconSelectorOptionValue,
	iconSelectorValuesMatch,
} from './iconSelectorItems.js';

const listId = `dom-icon-selector-${useId()}`;

defineOptions({
	__doc: {
		name: 'Icon selector',
		tag: '<DomIconSelector>',
		description: 'A searchable select-style field for choosing SVG path icons, emoji, or app-defined symbol rows.',
		icon: 'M5 5h5v5H5V5Zm9 0h5v5h-5V5ZM5 14h5v5H5v-5Zm9 0h5v5h-5v-5Z',
		playground: {
			initial: {
				label: 'Icon',
				modelValue: 'M12 5v14M5 12h14',
				kind: 'icons',
				placeholder: 'Search icons',
			},
		},
		slots: [
			{ name: 'preview', payload: '{ item }', description: 'Replace the selected-value preview inside the input.' },
			{ name: 'item', payload: '{ item, selected }', description: 'Replace each icon, emoji, or custom row in the picker panel.' },
		],
		events: [
			{ name: 'update:modelValue', payload: 'string | number | boolean | Component', description: 'Fired with the selected icon path, emoji, component, or custom item value.' },
			{ name: 'select', payload: '{ item, value, label }', description: 'Fired when a picker item is selected.' },
			{ name: 'query', payload: 'string', description: 'Fired as the user searches the picker.' },
		],
	},
});

const props = defineProps({
	...fieldProps,
	modelValue: {
		type: [String, Number, Boolean, Object, Function],
		default: '',
		_edit: {
			group: 'Control props',
			component: 'DomIconSelector',
			typeRef: 'string | number | boolean | Component',
			description: 'Selected icon path, emoji, component, or custom item value.',
			props: {
				kind: 'mixed',
				placeholder: 'Search icons or emoji',
			},
		},
	},
	kind: {
		type: String,
		default: 'icons',
		_edit: { group: 'Control props', options: ['icons', 'emoji', 'mixed', 'custom'], description: 'Built-in collection to show before custom items.' },
	},
	items: {
		type: Array,
		/**
		 * Build the default custom item collection.
		 *
		 * @returns {Array<unknown>}
		 */
		default: () => [],
		_edit: {
			group: 'Control props',
			component: 'DomJsonListInput',
			description: 'Custom icon, emoji, or symbol rows.',
			props: {
				compact: true,
				addLabel: '+ Add item',
				schema: [
					{ key: 'label', label: 'Label', placeholder: 'Priority' },
					{ key: 'value', label: 'Value', placeholder: 'priority' },
					{ key: 'path', label: 'SVG path', placeholder: 'M12 5v14M5 12h14' },
					{ key: 'emoji', label: 'Emoji', placeholder: '🚀' },
					{ key: 'group', label: 'Group', placeholder: 'Status' },
					{ key: 'keywords', label: 'Keywords', placeholder: 'launch success' },
				],
			},
		},
	},
	includeBuiltIns: {
		type: Boolean,
		default: true,
		_edit: { group: 'Control props', description: 'Include DOM Studio icon and emoji collections for the selected kind.' },
	},
	placeholder: {
		type: String,
		default: 'Search icons',
		_edit: { group: 'Control props', description: 'Search input placeholder.' },
	},
	clearable: {
		type: Boolean,
		default: true,
		_edit: { group: 'Control props', description: 'Show a clear button when a value is selected.' },
	},
	loading: {
		type: [Boolean, String],
		default: false,
		_edit: { group: 'Control props', description: 'Show an inline spinner while custom symbol rows are loading.' },
	},
	placement: {
		type: String,
		default: 'bottom',
		_edit: { group: 'Control props', options: ['bottom', 'top', 'right', 'left'], description: 'Preferred side before collision handling.' },
	},
	floatingMode: {
		type: String,
		default: 'viewport',
		_edit: { group: 'Control props', options: ['viewport', 'anchor'], description: 'viewport keeps the picker inside the browser; anchor keeps it attached while scrolling.' },
	},
	panelMinWidth: {
		type: String,
		default: '20rem',
		_edit: { group: 'Control props', description: 'Minimum floating panel width as a CSS length.' },
	},
});
const emit = defineEmits(['update:modelValue', 'select', 'query', 'focus', 'blur']);

const root = ref(null);
const inputEl = ref(null);
const isMounted = ref(false);
const teleportTarget = shallowRef(null);
const field = useField(props, emit, { idPrefix: 'dom-icon-selector' });
const inputAttrs = computed(getInputAttrs);
const optionList = computed(getOptionList);
const selectedItem = computed(getSelectedItem);
const hasSelection = computed(hasSelectedValue);
const isLoading = computed(isLoadingState);
const canClear = computed(canClearSelection);
const inputPaddingClass = computed(getInputPaddingClass);
const loadingPositionClass = computed(getLoadingPositionClass);

onMounted(mountIconSelector);
onBeforeUnmount(unmountIconSelector);

watch(field.value, syncInputFromModel);
watch(optionList, syncInputAfterOptionsChange);

/**
 * Wire the headless combobox after Vue has rendered the input and teleported list.
 *
 * @returns {Promise<void>}
 */
async function mountIconSelector() {
	teleportTarget.value = resolveFloatingTeleportTarget(root.value);
	isMounted.value = true;
	await import('../../lib/headless/combobox.js');
	syncInputFromModel();
	root.value?.addEventListener('dom:change', onComboboxChange);
	root.value?.addEventListener('dom:select', onComboboxSelect);
	root.value?.addEventListener('dom:query', onComboboxQuery);
}

/**
 * Remove native event listeners from the custom element host.
 *
 * @returns {void}
 */
function unmountIconSelector() {
	root.value?.removeEventListener('dom:change', onComboboxChange);
	root.value?.removeEventListener('dom:select', onComboboxSelect);
	root.value?.removeEventListener('dom:query', onComboboxQuery);
}

/**
 * Check whether the selector currently has a committed value.
 *
 * @returns {boolean}
 */
function hasSelectedValue() {
	return field.value.value !== null && field.value.value !== undefined && field.value.value !== '';
}

/**
 * Resolve the normalized loading state from boolean-style prop input.
 *
 * @returns {boolean}
 */
function isLoadingState() {
	return booleanProp(props.loading, false);
}

/**
 * Check whether the clear button can be shown.
 *
 * @returns {boolean}
 */
function canClearSelection() {
	return props.clearable && hasSelection.value && !field.disabled.value && !field.readOnly.value;
}

/**
 * Choose input padding that leaves room for the preview, spinner, and controls.
 *
 * @returns {string}
 */
function getInputPaddingClass() {
	if (canClear.value && isLoading.value) return 'pl-11 pr-28';
	if (canClear.value) return 'pl-11 pr-20';
	if (isLoading.value) return 'pl-11 pr-20';
	return 'pl-11 pr-10';
}

/**
 * Position the loading spinner next to the available trailing controls.
 *
 * @returns {string}
 */
function getLoadingPositionClass() {
	return canClear.value ? 'right-[4.25rem]' : 'right-9';
}

/**
 * Remove the native value attribute so the headless combobox owns display text.
 *
 * @returns {Object}
 */
function getInputAttrs() {
	const { value: _value, ...attrs } = field.inputAttrs.value;
	return attrs;
}

/**
 * Build the icon, emoji, and custom item rows available to the picker.
 *
 * @returns {Array<Object>}
 */
function getOptionList() {
	return createIconSelectorItems({
		kind: props.kind,
		items: props.items,
		includeBuiltIns: props.includeBuiltIns,
	});
}

/**
 * Resolve the selected item from the option list or current ad-hoc value.
 *
 * @returns {Object|null}
 */
function getSelectedItem() {
	return optionList.value.find((option) => iconSelectorValuesMatch(option.value, field.value.value))
		|| fallbackIconSelectorItem(field.value.value);
}

/**
 * Resolve the display label shown in the search input for a committed value.
 *
 * @param {unknown} value Current model value.
 * @returns {string}
 */
function displayForValue(value) {
	const option = optionList.value.find((item) => iconSelectorValuesMatch(item.value, value))
		|| fallbackIconSelectorItem(value);
	return option?.label || '';
}

/**
 * Synchronize the headless host and search input with the Vue model value.
 *
 * @returns {void}
 */
function syncInputFromModel() {
	const optionValue = selectedItem.value ? iconSelectorOptionValue(selectedItem.value) : String(field.value.value ?? '');
	if (root.value && root.value.value !== optionValue) {
		root.value.value = optionValue;
	}
	if (inputEl.value) inputEl.value.value = displayForValue(field.value.value);
}

/**
 * Refresh display text after icon inventory or custom item rows change.
 *
 * @returns {void}
 */
function syncInputAfterOptionsChange() {
	if (!hasSelection.value || field.focused.value) return;
	syncInputFromModel();
}

/**
 * Clear the selected value and close any open picker panel.
 *
 * @returns {void}
 */
function clearSelection() {
	field.setValue('');
	if (root.value) root.value.value = '';
	if (inputEl.value) inputEl.value.value = '';
	root.value?.removeAttribute('open');
	emit('select', { item: null, value: '', label: '', option: null });
}

/**
 * Check whether an item matches the current selected value.
 *
 * @param {Object} item Selector item.
 * @returns {boolean}
 */
function isSelectedItem(item) {
	return iconSelectorValuesMatch(item?.value, field.value.value);
}

/**
 * Handle committed value changes from the headless combobox.
 *
 * @param {CustomEvent} event Headless combobox change event.
 * @returns {void}
 */
function onComboboxChange(event) {
	const item = itemFromEvent(event);
	const value = item ? item.value : event.detail.value;
	field.onInput(value);
}

/**
 * Emit richer selection details after an item is picked.
 *
 * @param {CustomEvent} event Headless combobox select event.
 * @returns {void}
 */
function onComboboxSelect(event) {
	const item = itemFromEvent(event);
	const value = item ? item.value : event.detail.value;
	emit('select', {
		item,
		value,
		label: item?.label ?? event.detail.label,
		option: event.detail.option,
	});
}

/**
 * Emit search query updates from the headless combobox.
 *
 * @param {CustomEvent} event Headless combobox query event.
 * @returns {void}
 */
function onComboboxQuery(event) {
	emit('query', event.detail.query);
}

/**
 * Resolve the normalized item associated with a headless option element.
 *
 * @param {CustomEvent} event Headless combobox event.
 * @returns {Object|null}
 */
function itemFromEvent(event) {
	const index = Number(event.detail.option?.dataset.index);
	if (Number.isFinite(index) && optionList.value[index]) return optionList.value[index];
	return optionList.value.find((item) => iconSelectorOptionValue(item) === event.detail.value) || null;
}
</script>

<template>
	<DomField v-bind="field.fieldAttrs.value" :chrome="chrome">
		<dom-combobox
			ref="root"
			:data-menu-id="listId"
			:placement="placement"
			:floating-mode="floatingMode"
			class="relative block"
		>
			<div class="relative">
				<span class="pointer-events-none absolute left-3 top-1/2 z-10 grid size-5 -translate-y-1/2 place-items-center text-muted-fg">
					<slot name="preview" :item="selectedItem">
						<component v-if="selectedItem?.component" :is="selectedItem.component" class="size-4" aria-hidden="true" focusable="false" />
						<svg v-else-if="selectedItem?.path" :viewBox="selectedItem.viewBox || '0 0 24 24'" class="size-4" fill="none" aria-hidden="true">
							<path :d="selectedItem.path" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
						<span v-else-if="selectedItem?.emoji" class="text-base leading-none">{{ selectedItem.emoji }}</span>
						<svg v-else viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
							<path d="M10.5 18a7.5 7.5 0 1 1 5.3-2.2L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</slot>
				</span>
				<input
					v-bind="inputAttrs"
					ref="inputEl"
					slot="input"
					type="text"
					class="skin-input h-10 rounded-full focus:ring-ring/60"
					:class="inputPaddingClass"
					:placeholder="placeholder"
					@focus="field.onFocus"
					@blur="field.onBlur"
				/>
				<DomFieldLoadingSpinner
					v-if="isLoading"
					class="absolute top-1"
					:class="loadingPositionClass"
				/>
				<button
					v-if="canClear"
					type="button"
					class="absolute right-9 top-1 inline-flex size-8 items-center justify-center rounded-full text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
					aria-label="Clear selection"
					@click.stop="clearSelection"
					@mousedown.prevent
				>
					<svg viewBox="0 0 20 20" class="size-4" fill="none" aria-hidden="true">
						<circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5" />
						<path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
					</svg>
				</button>
				<button
					slot="toggle"
					type="button"
					class="absolute right-1 top-1 inline-flex size-8 items-center justify-center rounded-full text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
					aria-label="Show icon options"
				>
					<svg viewBox="0 0 20 20" class="size-4" fill="none" aria-hidden="true">
						<path d="M6 8l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>

			<Teleport :to="teleportTarget || 'body'" :disabled="!isMounted || !teleportTarget">
				<ul
					:id="listId"
					class="dom-floating-transition skin-popover z-50 grid max-h-[min(18rem,var(--dom-floating-available-height))] grid-cols-4 gap-1 overflow-auto rounded-2xl p-2 sm:grid-cols-5"
					:style="{ minWidth: panelMinWidth }"
				>
					<li
						v-for="(option, index) in optionList"
						:key="iconSelectorItemKey(option)"
						:data-value="iconSelectorOptionValue(option)"
						:data-label="option.label"
						:data-index="index"
						class="min-w-0 cursor-pointer rounded-xl p-2 text-center text-xs transition data-[active]:bg-accent aria-selected:bg-accent"
					>
						<slot name="item" :item="option" :selected="isSelectedItem(option)">
							<span class="mx-auto grid size-9 place-items-center rounded-lg bg-secondary/60 text-canvas-fg ring-1 ring-border/60">
								<component v-if="option.component" :is="option.component" class="size-5" aria-hidden="true" focusable="false" />
								<svg v-else-if="option.path" :viewBox="option.viewBox || '0 0 24 24'" class="size-5" fill="none" aria-hidden="true">
									<path :d="option.path" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
								<span v-else class="text-xl leading-none">{{ option.emoji || option.label }}</span>
							</span>
							<span class="mt-1 block truncate font-medium text-canvas-fg">{{ option.label }}</span>
							<span class="sr-only">{{ option.group }} {{ option.searchText }}</span>
						</slot>
					</li>
				</ul>
			</Teleport>
		</dom-combobox>
	</DomField>
</template>
