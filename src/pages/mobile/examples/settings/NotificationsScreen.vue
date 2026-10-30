<script setup>
import { ref } from 'vue';
import {
	DomAppListItem,
	DomNativeSelect,
	DomToggle,
} from '@getdom/studio/vue';

const pushEnabled = ref(true);
const emailEnabled = ref(true);
const quietHours = ref('evening');

const quietHourOptions = [
	{ label: 'Off', value: 'off' },
	{ label: 'Evening', value: 'evening' },
	{ label: 'Weekend', value: 'weekend' },
];
</script>

<template>
	<section class="space-y-5">
		<div class="space-y-1">
			<h2 class="text-xl font-semibold tracking-tight text-canvas-fg">Notifications</h2>
			<p class="text-sm leading-6 text-muted-fg">Choose how product updates and workspace activity reach you.</p>
		</div>

		<div class="overflow-hidden rounded-[1.5rem] border border-border bg-canvas">
			<DomAppListItem as="div" label="Push alerts" description="Activity, mentions, and mobile approvals.">
				<template #trailing>
					<DomToggle v-model="pushEnabled" label="Push alerts" chrome="none" />
				</template>
			</DomAppListItem>
			<DomAppListItem as="div" label="Email summary" description="A daily digest for quieter workspaces.">
				<template #trailing>
					<DomToggle v-model="emailEnabled" label="Email summary" chrome="none" />
				</template>
			</DomAppListItem>
		</div>

		<div class="rounded-[1.5rem] border border-border bg-canvas p-4">
			<DomNativeSelect
				v-model="quietHours"
				label="Quiet hours"
				:options="quietHourOptions"
				placeholder=""
			/>
		</div>
	</section>
</template>
