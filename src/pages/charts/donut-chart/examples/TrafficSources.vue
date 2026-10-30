<script setup>
import { ref } from 'vue';
import { DomDonutChart } from '@getdom/studio';
const selected = ref(null);
const rows = [{ channel: 'Organic search', visitors: 8240, color: 'chart-1' }, { channel: 'Direct', visitors: 3620, color: 'chart-2' }, { channel: 'Referral', visitors: 2180, color: 'chart-3' }, { channel: 'Email', visitors: 1460, color: 'chart-4' }];
</script>
<template>
	<div class="w-full">
		<DomDonutChart title="Where visitors come from" description="September 2026 · Unique visitors" :rows="rows" label-key="channel" value-key="visitors" total-label="Visitors" @select="selected = $event.row" />
		<p v-if="selected" class="mt-3 text-xs text-muted-fg">Selected channel: {{ selected.channel }}. Your application can open its detailed report.</p>
	</div>
</template>
