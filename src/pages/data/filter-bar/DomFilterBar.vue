<script>
/**
 * @typedef {object} FilterBarOption
 * @property {string} label Human-readable option label.
 * @property {string|number|boolean} value Stable query value.
 * @property {boolean} [disabled] Disable this option.
 */

/**
 * @typedef {object} FilterBarDefinition
 * @property {string} key Stable filter and API query key.
 * @property {string} [label] Human-readable filter label.
 * @property {'text'|'select'|'date'|'number'|'boolean'} [type] Built-in control type.
 * @property {string} [placeholder] Empty control label.
 * @property {Array<FilterBarOption|string|number|boolean>} [options] Select options.
 * @property {string} [width] CSS width applied to the built-in control.
 * @property {boolean} [disabled] Disable this filter control.
 */

/**
 * @typedef {object} FilterBarQuery
 * @property {string} search Normalized search text.
 * @property {Record<string, unknown>} filters Active logical filter values.
 */

export const filterBarProps = {
	definitions: {
		type: Array,
		default: () => [],
		_edit: { typeRef: 'Array<FilterBarDefinition>', description: 'Logical filter definitions rendered as controlled query inputs.' },
	},
	filters: {
		type: Object,
		default: () => ({}),
		_edit: { description: 'Controlled active filter values keyed by definition key.' },
	},
	search: {
		type: String,
		default: '',
		_edit: { description: 'Controlled free-text search value.' },
	},
	searchable: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the built-in search input.' },
	},
	searchPlaceholder: {
		type: String,
		default: 'Search records',
		_edit: { group: 'Labels', description: 'Placeholder for the built-in search input.' },
	},
	clearLabel: {
		type: String,
		default: 'Clear filters',
		_edit: { group: 'Labels', description: 'Label for clearing the complete query.' },
	},
	ariaLabel: {
		type: String,
		default: 'Filter records',
		_edit: { group: 'Labels', description: 'Accessible label for the filter controls.' },
	},
	density: {
		type: String,
		default: 'comfortable',
		_edit: { options: ['compact', 'comfortable'], group: 'Layout', description: 'Spacing and control density.' },
	},
	disabled: {
		type: Boolean,
		default: false,
		_edit: { group: 'State', description: 'Disable all built-in query controls.' },
	},
};
</script>

<script setup>
import { computed, ref, watch } from 'vue';

defineOptions({
	__doc: {
		name: 'Filter bar',
		tag: '<DomFilterBar>',
		description: 'A controlled, transport-free query bar for application-owned search and logical filter values.',
		icon: 'M4 6h16M7 12h10M10 18h4M8 6v3M15 12v3M12 18v2',
		events: [
			{ name: 'update:filters', payload: 'Record<string, unknown>', description: 'Fired when one logical filter value changes or is cleared.' },
			{ name: 'update:search', payload: 'string', description: 'Fired when the free-text search value changes.' },
			{ name: 'query-change', payload: 'FilterBarQuery', typeRef: 'FilterBarQuery', description: 'Fired with the complete normalized query after any control changes.' },
			{ name: 'clear', payload: 'FilterBarQuery', typeRef: 'FilterBarQuery', description: 'Fired after the complete query is cleared.' },
		],
		slots: [
			{ name: 'leading', payload: '{ query }', description: 'Content before the built-in search and filters.' },
			{ name: 'filter', payload: '{ definition, value, setValue, clear }', description: 'Replace the control for each filter definition.' },
			{ name: 'trailing', payload: '{ query, clear }', description: 'Application actions after the built-in controls.' },
			{ name: 'active-filter', payload: '{ definition, value, label, clear }', description: 'Replace an active filter chip.' },
		],
	},
});

const props = defineProps(filterBarProps);
const emit = defineEmits(['update:filters', 'update:search', 'query-change', 'clear']);

const internalFilters = ref(cloneFilters(props.filters));
const internalSearch = ref(String(props.search || ''));
const normalizedDefinitions = computed(getNormalizedDefinitions);
const query = computed(getQuery);
const activeEntries = computed(getActiveEntries);
const hasActiveQuery = computed(getHasActiveQuery);
const rootClass = computed(getRootClass);

watch(() => props.filters, syncFiltersFromProps, { deep: true });
watch(() => props.search, syncSearchFromProps);

/**
 * Synchronizes controlled filter values from the parent.
 *
 * @param {Record<string, unknown>} value Controlled filter map.
 * @returns {void}
 */
function syncFiltersFromProps(value) {
	internalFilters.value = cloneFilters(value);
}

/**
 * Synchronizes controlled search text from the parent.
 *
 * @param {string} value Controlled search value.
 * @returns {void}
 */
function syncSearchFromProps(value) {
	internalSearch.value = String(value || '');
}

/**
 * Normalizes every logical filter definition.
 *
 * @returns {Array<FilterBarDefinition>} Safe filter definitions.
 */
function getNormalizedDefinitions() {
	return (Array.isArray(props.definitions) ? props.definitions : [])
		.filter(hasDefinitionKey)
		.map(normalizeDefinition);
}

/**
 * Reports whether a filter definition has a usable key.
 *
 * @param {FilterBarDefinition} definition Candidate filter definition.
 * @returns {boolean} True when a logical key exists.
 */
function hasDefinitionKey(definition) {
	return Boolean(definition && String(definition.key || '').trim());
}

/**
 * Builds defaults for one filter definition.
 *
 * @param {FilterBarDefinition} definition Source definition.
 * @returns {FilterBarDefinition} Normalized definition.
 */
function normalizeDefinition(definition) {
	const key = String(definition.key).trim();
	return {
		...definition,
		key,
		label: definition.label || labelFromKey(key),
		type: ['text', 'select', 'date', 'number', 'boolean'].includes(definition.type) ? definition.type : 'select',
		options: normalizeOptions(definition.options),
	};
}

/**
 * Normalizes select options while preserving their original values.
 *
 * @param {Array<FilterBarOption|string|number|boolean>} options Source options.
 * @returns {Array<FilterBarOption>} Normalized option rows.
 */
function normalizeOptions(options) {
	return (Array.isArray(options) ? options : []).map(normalizeOption);
}

/**
 * Normalizes one primitive or object option.
 *
 * @param {FilterBarOption|string|number|boolean} option Source option.
 * @returns {FilterBarOption} Normalized option.
 */
function normalizeOption(option) {
	if (option && typeof option === 'object') {
		return {
			...option,
			label: option.label ?? String(option.value ?? ''),
			value: option.value ?? option.label ?? '',
		};
	}
	return { label: String(option), value: option };
}

/**
 * Returns the current complete query contract.
 *
 * @returns {FilterBarQuery} Normalized controlled query.
 */
function getQuery() {
	return {
		search: internalSearch.value.trim(),
		filters: cloneFilters(internalFilters.value),
	};
}

/**
 * Returns active filter rows for removable summary chips.
 *
 * @returns {Array<{ definition: FilterBarDefinition, value: unknown, label: string }>} Active filter entries.
 */
function getActiveEntries() {
	return normalizedDefinitions.value
		.filter(isDefinitionActive)
		.map(createActiveEntry);
}

/**
 * Reports whether a definition currently has an active value.
 *
 * @param {FilterBarDefinition} definition Filter definition.
 * @returns {boolean} True when the value should join the API query.
 */
function isDefinitionActive(definition) {
	return isActiveValue(internalFilters.value[definition.key]);
}

/**
 * Creates an active filter summary record.
 *
 * @param {FilterBarDefinition} definition Filter definition.
 * @returns {{ definition: FilterBarDefinition, value: unknown, label: string }} Active entry.
 */
function createActiveEntry(definition) {
	const value = internalFilters.value[definition.key];
	return { definition, value, label: valueLabel(definition, value) };
}

/**
 * Reports whether search text or any logical filter is active.
 *
 * @returns {boolean} True when the query can be cleared.
 */
function getHasActiveQuery() {
	return Boolean(internalSearch.value.trim() || activeEntries.value.length);
}

/**
 * Builds density-aware container classes.
 *
 * @returns {string} Filter bar classes.
 */
function getRootClass() {
	return props.density === 'compact' ? 'gap-2 p-2' : 'gap-3 p-3';
}

/**
 * Updates the free-text search and emits the full query.
 *
 * @param {Event} event Native input event.
 * @returns {void}
 */
function updateSearch(event) {
	const value = String(event.target?.value || '');
	internalSearch.value = value;
	emit('update:search', value);
	emitQueryChange();
}

/**
 * Reads a native control value using its filter definition.
 *
 * @param {FilterBarDefinition} definition Filter definition.
 * @param {Event} event Native input or change event.
 * @returns {void}
 */
function updateFromControl(definition, event) {
	const rawValue = event.target?.value ?? '';
	setFilterValue(definition, controlValue(definition, rawValue));
}

/**
 * Converts native string input back into an API-facing logical value.
 *
 * @param {FilterBarDefinition} definition Filter definition.
 * @param {unknown} rawValue Native control value.
 * @returns {unknown} Logical filter value.
 */
function controlValue(definition, rawValue) {
	if (rawValue === '') return '';
	if (definition.type === 'number') {
		const number = Number(rawValue);
		return Number.isFinite(number) ? number : rawValue;
	}
	if (definition.type === 'boolean') return rawValue === 'true';
	if (definition.type === 'select') {
		const option = matchingOption(definition.options, rawValue);
		return option ? option.value : rawValue;
	}
	return rawValue;
}

/**
 * Finds the option matching a native control value.
 *
 * @param {Array<FilterBarOption>} options Normalized options.
 * @param {unknown} value Candidate logical value.
 * @returns {FilterBarOption|undefined} Matching option when one exists.
 */
function matchingOption(options, value) {
	for (const option of options) {
		if (String(option.value) === String(value)) return option;
	}
	return undefined;
}

/**
 * Updates one logical filter and emits controlled state.
 *
 * @param {FilterBarDefinition} definition Filter definition.
 * @param {unknown} value Next logical value.
 * @returns {void}
 */
function setFilterValue(definition, value) {
	const next = cloneFilters(internalFilters.value);
	if (isActiveValue(value)) next[definition.key] = value;
	else delete next[definition.key];
	internalFilters.value = next;
	emit('update:filters', cloneFilters(next));
	emitQueryChange();
}

/**
 * Clears one logical filter.
 *
 * @param {FilterBarDefinition} definition Filter definition.
 * @returns {void}
 */
function clearFilter(definition) {
	setFilterValue(definition, '');
}

/**
 * Clears search and every filter value.
 *
 * @returns {void}
 */
function clearQuery() {
	internalSearch.value = '';
	internalFilters.value = {};
	emit('update:search', '');
	emit('update:filters', {});
	const cleared = { search: '', filters: {} };
	emit('query-change', cleared);
	emit('clear', cleared);
}

/**
 * Emits a cloned query after local state has changed.
 *
 * @returns {void}
 */
function emitQueryChange() {
	emit('query-change', getQuery());
}

/**
 * Returns a display label for one active filter value.
 *
 * @param {FilterBarDefinition} definition Filter definition.
 * @param {unknown} value Active logical value.
 * @returns {string} Human-readable value.
 */
function valueLabel(definition, value) {
	if (definition.type === 'boolean') return value ? 'Yes' : 'No';
	const option = matchingOption(definition.options, value);
	return option?.label || String(value ?? '');
}

/**
 * Converts a logical key into a readable label.
 *
 * @param {string} key Logical filter key.
 * @returns {string} Human-readable label.
 */
function labelFromKey(key) {
	return String(key)
		.replace(/[_-]+/g, ' ')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/\b\w/g, uppercaseCharacter);
}

/**
 * Uppercases one matched word-leading character.
 *
 * @param {string} character Matched character.
 * @returns {string} Uppercase character.
 */
function uppercaseCharacter(character) {
	return character.toUpperCase();
}

/**
 * Reports whether a value should be included in the active filter map.
 *
 * @param {unknown} value Candidate filter value.
 * @returns {boolean} True for meaningful values, including false and zero.
 */
function isActiveValue(value) {
	if (value === null || value === undefined || value === '') return false;
	if (Array.isArray(value)) return value.length > 0;
	return true;
}

/**
 * Clones a filter map so emitted state remains application-owned.
 *
 * @param {Record<string, unknown>} filters Source filter map.
 * @returns {Record<string, unknown>} Cloned filter values.
 */
function cloneFilters(filters) {
	const source = filters && typeof filters === 'object' ? filters : {};
	return Object.fromEntries(Object.entries(source).map(cloneFilterEntry));
}

/**
 * Clones one filter entry, including array values.
 *
 * @param {[string, unknown]} entry Filter key and value.
 * @returns {[string, unknown]} Cloned filter entry.
 */
function cloneFilterEntry(entry) {
	const [key, value] = entry;
	return [key, Array.isArray(value) ? [...value] : value];
}
</script>

<template>
	<section class="rounded-lg border border-border bg-canvas text-canvas-fg shadow-sm" role="search" :aria-label="ariaLabel">
		<div class="flex min-w-0 flex-wrap items-end" :class="rootClass">
			<slot name="leading" :query="query" />

			<label v-if="searchable" class="min-w-[12rem] flex-1 sm:max-w-xs">
				<span class="mb-1 block text-xs font-semibold text-muted-fg">Search</span>
				<span class="relative block">
					<svg class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-fg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
					</svg>
					<input
						:value="internalSearch"
						type="search"
						class="skin-input h-10 rounded-md pl-9"
						:placeholder="searchPlaceholder"
						:disabled="disabled"
						@input="updateSearch"
					/>
				</span>
			</label>

			<div v-for="definition in normalizedDefinitions" :key="definition.key" class="min-w-[9rem]" :style="definition.width ? { width: definition.width } : undefined">
				<slot
					name="filter"
					:definition="definition"
					:value="internalFilters[definition.key]"
					:set-value="(value) => setFilterValue(definition, value)"
					:clear="() => clearFilter(definition)"
				>
					<label class="block">
						<span class="mb-1 block text-xs font-semibold text-muted-fg">{{ definition.label }}</span>
						<select
							v-if="definition.type === 'select' || definition.type === 'boolean'"
							v-model="internalFilters[definition.key]"
							class="skin-input h-10 rounded-md"
							:disabled="disabled || definition.disabled"
							@change="updateFromControl(definition, $event)"
						>
							<option value="">{{ definition.placeholder || `Any ${definition.label.toLowerCase()}` }}</option>
							<template v-if="definition.type === 'boolean'">
								<option :value="true">Yes</option>
								<option :value="false">No</option>
							</template>
							<template v-else>
								<option v-for="option in definition.options" :key="String(option.value)" :value="option.value" :disabled="option.disabled">{{ option.label }}</option>
							</template>
						</select>
						<input
							v-else
							v-model="internalFilters[definition.key]"
							:type="definition.type"
							class="skin-input h-10 rounded-md"
							:placeholder="definition.placeholder || ''"
							:disabled="disabled || definition.disabled"
							@input="updateFromControl(definition, $event)"
						/>
					</label>
				</slot>
			</div>

			<slot name="trailing" :query="query" :clear="clearQuery" />

			<button
				v-if="hasActiveQuery"
				type="button"
				class="skin-control inline-flex h-10 items-center gap-2 rounded-md px-3 text-xs font-semibold transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				:disabled="disabled"
				@click="clearQuery"
			>
				<span aria-hidden="true">&times;</span>
				{{ clearLabel }}
			</button>
		</div>

		<div v-if="activeEntries.length" class="flex flex-wrap gap-2 border-t border-border px-3 py-2.5">
			<slot
				v-for="entry in activeEntries"
				:key="entry.definition.key"
				name="active-filter"
				:definition="entry.definition"
				:value="entry.value"
				:label="entry.label"
				:clear="() => clearFilter(entry.definition)"
			>
				<span class="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
					<span class="truncate">{{ entry.definition.label }}: {{ entry.label }}</span>
					<button type="button" class="grid size-4 shrink-0 place-items-center rounded-full hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" :aria-label="`Clear ${entry.definition.label} filter`" @click="clearFilter(entry.definition)">&times;</button>
				</span>
			</slot>
		</div>
	</section>
</template>
