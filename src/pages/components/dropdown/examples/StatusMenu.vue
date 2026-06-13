<script setup>
import { computed, ref } from 'vue';
import { DomBadge, DomDropdown, DomStatusPill } from '@getdom/studio/vue';

const statuses = [
	{ value: 'draft', label: 'Draft', tone: 'neutral', description: 'Visible to editors only.', shortcut: 'D' },
	{ value: 'review', label: 'In review', tone: 'warning', description: 'Ready for stakeholder approval.', shortcut: 'R' },
	{ value: 'live', label: 'Live', tone: 'success', description: 'Published to customers.', shortcut: 'L' },
	{ separator: true },
	{ value: 'archived', label: 'Archived', tone: 'danger', description: 'Hidden from active workflows.', shortcut: 'A' },
];
const status = ref('review');
const current = computed(() => statuses.find((item) => item.value === status.value));
</script>

<template>
	<div class="grid w-full max-w-sm gap-3">
		<DomDropdown :items="statuses" label="Change status" width="min-w-[19rem]" @select="(value) => status = value">
			<template #trigger>
				<span class="flex items-center gap-2">
					<DomStatusPill :tone="current?.tone">{{ current?.label }}</DomStatusPill>
				</span>
			</template>

			<template #item="{ item }">
				<span class="flex items-start justify-between gap-4" :class="item.tone === 'danger' && 'text-destructive'">
					<span class="min-w-0">
						<span class="flex items-center gap-2">
							<DomStatusPill :tone="item.tone" size="sm">{{ item.label }}</DomStatusPill>
							<DomBadge v-if="item.value === status" tone="success" size="sm">Selected</DomBadge>
						</span>
						<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ item.description }}</span>
					</span>
					<kbd class="rounded-md border border-border bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-muted-fg">
						{{ item.shortcut }}
					</kbd>
				</span>
			</template>
		</DomDropdown>
		<p class="text-xs text-muted-fg">
			Dropdowns are for actions. Use <code class="text-canvas-fg">DomSelect</code> when the selection is a form value.
		</p>
	</div>
</template>
