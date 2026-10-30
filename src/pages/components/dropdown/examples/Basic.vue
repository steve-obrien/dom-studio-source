<script setup>
import { ref } from 'vue';
import { DomDropdown } from '@getdom/studio/vue';

const items = [
	{ label: 'View profile', value: 'profile' },
	{ label: 'Billing & plans', value: 'billing' },
	{ label: 'Team settings', value: 'team' },
	{ label: 'Sign out', value: 'signout' },
];
const selected = ref('');
</script>

<template>
	<div class="flex flex-col items-center gap-3">
		<DomDropdown :items="items" label="Account ▾" @select="(v) => selected = v" />
		<p class="text-xs text-muted-fg">
			Selected: <code class="text-canvas-fg">{{ selected || '—' }}</code>
		</p>
	</div>
</template>
