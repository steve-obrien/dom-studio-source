<script setup>
import { ref } from 'vue';
import { DomDateRangePicker } from '@getdom/studio';
const period = ref({ start: '2026-09-01', end: '2026-09-30' });
const comparison = ref('previous-period');
const compared = ref({ start: '2026-08-02', end: '2026-08-31' });
/** Receives the atomic query change; the application decides when and how to fetch. */
function updateQuery(payload) { compared.value = payload.comparisonRange; }
</script>
<template>
	<div class="w-full space-y-5">
		<DomDateRangePicker v-model="period" v-model:comparison="comparison" anchor-date="2026-09-30" min="2026-01-01" max="2026-09-30" @change="updateQuery" />
		<dl class="space-y-2 text-sm"><div><dt class="text-muted-fg">Reporting period</dt><dd class="mt-1 font-medium">{{ period.start }} to {{ period.end }} (inclusive)</dd></div><div v-if="compared"><dt class="text-muted-fg">Comparison period</dt><dd class="mt-1 font-medium">{{ compared.start }} to {{ compared.end }}</dd></div></dl>
	</div>
</template>
