<script setup>
import { ref } from 'vue';
import { DomBadge, DomListbox, DomStatusPill } from '@getdom/studio/vue';

const access = ref('editor');
const options = [
	{
		value: 'viewer',
		label: 'Viewer',
		description: 'Can read content and export approved reports.',
		tone: 'neutral',
		badge: 'Low risk',
	},
	{
		value: 'editor',
		label: 'Editor',
		description: 'Can create, update, and submit work for review.',
		tone: 'info',
		badge: 'Recommended',
	},
	{
		value: 'admin',
		label: 'Admin',
		description: 'Can manage billing, members, integrations, and security.',
		tone: 'warning',
		badge: 'Sensitive',
	},
];
</script>

<template>
	<div class="grid w-full max-w-md gap-3">
		<DomListbox v-model="access" label="Access level" :options="options">
			<template #option="{ option }">
				<span class="flex items-start justify-between gap-4">
					<span class="min-w-0">
						<span class="flex items-center gap-2">
							<span class="font-medium">{{ option.label }}</span>
							<DomStatusPill :tone="option.tone" size="sm">{{ option.badge }}</DomStatusPill>
						</span>
						<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ option.description }}</span>
					</span>
					<DomBadge v-if="option.value === access" tone="success" size="sm">Selected</DomBadge>
				</span>
			</template>
		</DomListbox>
		<p class="text-xs text-muted-fg">Selected value: <code class="text-fg">{{ access }}</code></p>
	</div>
</template>
