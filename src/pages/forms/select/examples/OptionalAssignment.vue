<script setup>
import { ref } from 'vue';
import { DomSelect, DomStatusPill } from '@getdom/studio/vue';

const assignee = ref('');
const people = [
	{ value: '', label: 'Not assigned', description: 'Leave this workflow unowned.' },
	{ value: 'ada', label: 'Ada Lovelace', description: 'Product analytics' },
	{ value: 'grace', label: 'Grace Hopper', description: 'Platform engineering' },
	{ value: 'katherine', label: 'Katherine Johnson', description: 'Launch readiness' },
];
</script>

<template>
	<div class="grid w-full max-w-sm gap-3">
		<DomSelect
			v-model="assignee"
			label="Assignee"
			placeholder="Choose a person"
			:options="people"
			width="min-w-[18rem]"
		>
			<template #option="{ option, selected }">
				<span class="flex items-start justify-between gap-3">
					<span class="min-w-0">
						<span class="font-medium">{{ option.label }}</span>
						<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ option.description }}</span>
					</span>
					<DomStatusPill v-if="selected" size="sm" tone="success">Selected</DomStatusPill>
				</span>
			</template>
		</DomSelect>

		<p class="text-xs text-muted-fg">Selected value: <code class="text-canvas-fg">{{ assignee || '(empty)' }}</code></p>
	</div>
</template>
