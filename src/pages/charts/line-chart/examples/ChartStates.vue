<script setup>
import { ref, computed } from 'vue';
import { DomLineChart, DomNativeSelect } from '@getdom/studio';
const state = ref('ready');
const options = [{ value: 'ready', label: 'Missing readings and zero' }, { value: 'loading', label: 'Loading' }, { value: 'empty', label: 'Empty' }, { value: 'error', label: 'Error' }, { value: 'single', label: 'Single point' }];
const measurements = [{ day: 'Mon', count: 12 }, { day: 'Tue', count: 0 }, { day: 'Wed', count: null }, { day: 'Thu', count: 18 }, { day: 'Fri', count: 9 }];
/** Selects a data shape without modifying the original records. */
const rows = computed(() => state.value === 'empty' ? [] : state.value === 'single' ? measurements.slice(0, 1) : measurements);
</script>
<template>
	<div class="w-full space-y-5">
		<DomNativeSelect v-model="state" label="Example state" :options="options" class="max-w-xs" />
		<DomLineChart title="Daily signups" description="Zero signups on Tuesday; Wednesday has no measurement." :rows="rows" x-key="day" :series="[{ key: 'count', label: 'Signups', color: 'chart-2' }]" :loading="state === 'loading'" :error="state === 'error' ? 'The reporting service is unavailable.' : ''" @retry="state = 'ready'" />
	</div>
</template>
