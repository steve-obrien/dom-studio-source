<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import DomPopover from '../../components/popover/DomPopover.vue';
import DomButton from '../../components/button/DomButton.vue';
import DomDatePicker from '../../forms/date-picker/DomDatePicker.vue';
import DomNativeSelect from '../../forms/native-select/DomNativeSelect.vue';
import { comparisonRange, dateRangePresets, rangeError } from './dateRange.js';

defineOptions({
	__doc: {
		name: 'Date range picker', tag: '<DomDateRangePicker>',
		description: 'Inclusive reporting dates with useful presets, explicit Apply and Cancel actions, and optional period comparisons.',
		icon: 'M5 4v3M19 4v3M4 9h16M4 6h16v14H4zM8 13h8M8 16h5',
		events: [
			{ name: 'update:modelValue', payload: '{ start, end }', description: 'Committed inclusive YYYY-MM-DD dates.' },
			{ name: 'update:comparison', payload: 'string', description: 'Committed comparison mode.' },
			{ name: 'change', payload: '{ range, comparison, comparisonRange }', description: 'Atomic reporting query change; fetching remains application-owned.' },
		],
	},
});
const props = defineProps({
	modelValue: { type: Object, default: () => ({ start: '', end: '' }), _edit: { description: 'Controlled inclusive { start, end } dates in YYYY-MM-DD format.' } },
	comparison: { type: String, default: 'none', _edit: { options: ['none', 'previous-period', 'previous-year'] } },
	showComparison: { type: Boolean, default: true },
	label: { type: String, default: 'Reporting period' },
	disabled: { type: Boolean, default: false },
	min: { type: String, default: '' },
	max: { type: String, default: '' },
	anchorDate: { type: String, default: '', _edit: { description: 'Preset reference date. Defaults to browser-local today after mount; supply a reporting-timezone date for deterministic presets.' } },
	locale: { type: String, default: 'en-GB' },
});
const draft = ref({ ...props.modelValue });
const draftComparison = ref(props.comparison);
const invalidStart = ref(false);
const invalidEnd = ref(false);
const draftVersion = ref(0);
const today = ref('');
const presets = computed(() => dateRangePresets(props.anchorDate || today.value));
const error = computed(() => invalidStart.value || invalidEnd.value ? 'Correct the invalid date before applying this range.' : rangeError(draft.value, props.min, props.max));
const compared = computed(() => comparisonRange(draft.value, draftComparison.value));
const triggerLabel = computed(() => rangeError(props.modelValue) ? props.label : `${formatDate(props.modelValue.start)} – ${formatDate(props.modelValue.end)}`);
const emit = defineEmits(['update:modelValue', 'update:comparison', 'change']);
const comparisonOptions = [{ value: 'none', label: 'No comparison' }, { value: 'previous-period', label: 'Previous period' }, { value: 'previous-year', label: 'Previous year' }];
onMounted(setToday);
watch(() => [props.modelValue, props.comparison], resetDraft, { deep: true });

/** @returns {void} Establishes local today only after hydration. */
function setToday() {
	const date = new Date();
	today.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
/** @returns {void} Restores controlled values when reopening or cancelling. */
function resetDraft() {
	draft.value = { ...props.modelValue };
	draftComparison.value = props.comparison;
	invalidStart.value = false;
	invalidEnd.value = false;
	draftVersion.value += 1;
}
/** @param {string} value Canonical date. @returns {string} Localized date label. */
function formatDate(value) { return new Intl.DateTimeFormat(props.locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)); }
/** @param {object} preset Inclusive dates. @returns {void} Updates only the editable draft. */
function choosePreset(preset) {
	draft.value = { start: preset.start, end: preset.end };
	invalidStart.value = false;
	invalidEnd.value = false;
	draftVersion.value += 1;
}
/** @param {Function} close Popover close helper. @returns {void} Commits the complete reporting choice. */
function apply(close) {
	if (props.disabled || error.value) return;
	const range = { ...draft.value };
	const comparison = props.showComparison ? draftComparison.value : 'none';
	emit('update:modelValue', range);
	emit('update:comparison', comparison);
	emit('change', { range, comparison, comparisonRange: comparisonRange(range, comparison) });
	close();
}
</script>

<template>
	<DomPopover width="w-[min(26rem,calc(100vw-2rem))]" :arrow="false" padding="p-4" @open="resetDraft">
		<template #trigger><DomButton variant="secondary" :disabled="disabled" :aria-label="`${label}: ${triggerLabel}`">{{ triggerLabel }}</DomButton></template>
		<template #default="{ close }">
			<div class="space-y-4">
				<p class="font-semibold">{{ label }}</p>
				<div class="grid grid-cols-2 gap-2">
					<DomButton v-for="preset in presets" :key="preset.label" size="sm" variant="secondary" :disabled="!!rangeError(preset, min, max)" @click="choosePreset(preset)">{{ preset.label }}</DomButton>
				</div>
				<div class="grid gap-3 sm:grid-cols-2">
					<DomDatePicker :key="`start-${draftVersion}`" v-model="draft.start" label="Start date" :calendar-props="{ min, max }" :register-field="false" @invalid-date="invalidStart = true" @update:model-value="invalidStart = false" />
					<DomDatePicker :key="`end-${draftVersion}`" v-model="draft.end" label="End date" :calendar-props="{ min, max }" :register-field="false" @invalid-date="invalidEnd = true" @update:model-value="invalidEnd = false" />
				</div>
				<DomNativeSelect v-if="showComparison" v-model="draftComparison" label="Compare with" :options="comparisonOptions" :register-field="false" />
				<p v-if="compared && showComparison" class="text-xs leading-5 text-muted-fg">Comparison: {{ formatDate(compared.start) }} – {{ formatDate(compared.end) }}</p>
				<p v-if="error" role="status" class="text-xs text-destructive">{{ error }}</p>
				<div class="flex justify-end gap-2 border-t border-border pt-3">
					<DomButton size="sm" variant="ghost" @click="resetDraft(); close()">Cancel</DomButton>
					<DomButton size="sm" :disabled="!!error || disabled" @click="apply(close)">Apply</DomButton>
				</div>
			</div>
		</template>
	</DomPopover>
</template>
