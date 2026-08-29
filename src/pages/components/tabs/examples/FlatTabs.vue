<script setup>
import { ref } from 'vue';
import { DomTabs } from '../../../lib/vue';

const active = ref('activity');
const tabs = [
	{ key: 'activity', label: 'Activity' },
	{ key: 'analytics', label: 'Analytics' },
	{ key: 'settings', label: 'Settings' },
];
</script>

<template>
	<div class="w-full max-w-2xl">
		<DomTabs v-model="active" :tabs="tabs" variant="flat">
			<template #activity>
				<div class="rounded-xl border border-border bg-canvas p-5 text-sm text-muted-fg">
					Recent workspace activity appears here.
				</div>
			</template>
			<template #analytics>
				<div class="rounded-xl border border-border bg-canvas p-5 text-sm text-muted-fg">
					Analytics and performance trends appear here.
				</div>
			</template>
			<template #settings>
				<div class="rounded-xl border border-border bg-canvas p-5 text-sm text-muted-fg">
					Workspace settings appear here.
				</div>
			</template>
		</DomTabs>
	</div>
</template>
