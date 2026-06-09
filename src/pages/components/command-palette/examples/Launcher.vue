<script setup>
import { ref } from 'vue';
import { DomButton, DomCommandPalette } from '@getdom/studio/vue';

const open = ref(false);
const selected = ref('none');
const commands = [
	{ value: 'new-project', label: 'New project', description: 'Create a blank project.' },
	{ value: 'invite-team', label: 'Invite team', description: 'Send invitations to collaborators.' },
	{ value: 'open-billing', label: 'Open billing', description: 'Manage plan and invoices.' },
	{ value: 'toggle-theme', label: 'Toggle theme', description: 'Switch between light and dark.' },
];

function onSelect(event) {
	selected.value = event.value;
}
</script>

<template>
	<div class="grid gap-3">
		<div class="flex flex-wrap items-center gap-2">
			<DomButton variant="secondary" @click="open = true">Open command palette (Cmd+K)</DomButton>
			<p class="text-xs text-muted-fg">Selected: <code class="text-fg">{{ selected }}</code></p>
		</div>
		<DomCommandPalette v-model="open" :commands="commands" @select="onSelect" />
	</div>
</template>
