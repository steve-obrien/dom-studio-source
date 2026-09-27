import { computed, shallowRef, watch } from 'vue';
import { normalizeOption } from './options.js';

/**
 * Retain only selected records when a remote query replaces the current page.
 * Applications can supply selectedOptions for initial values outside loaded pages;
 * this does not insert, reorder or seek options in the application's result set.
 *
 * @param {import('vue').ComputedRef<Array>} options Current normalized page records.
 * @param {import('vue').ComputedRef<Array>} values Committed selected values.
 * @param {Function} supplied Getter for optional externally resolved selected records.
 * @returns {import('vue').ComputedRef<Array>} Resolved selections in model order.
 */
export function useSelectedOptions(options, values, supplied = () => []) {
	const cache = shallowRef(new Map());
	watch([options, values, supplied], () => {
		const records = new Map(cache.value);
		for (const row of [...supplied(), ...options.value]) {
			const option = normalizeOption(row, { allowEmptyValue: true });
			if (option) records.set(String(option.value), option);
		}
		cache.value = new Map(values.value.map((value) => [String(value), records.get(String(value))]));
	}, { immediate: true, flush: 'sync' });
	return computed(() => values.value.map((value) => cache.value.get(String(value)) || { value, label: String(value ?? '') }));
}
