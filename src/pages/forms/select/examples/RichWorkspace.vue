<script setup>
import { computed, ref } from 'vue';
import { DomAvatar, DomBadge, DomSelect, DomStatusPill } from '@getdom/studio/vue';

const workspace = ref('growth');
const workspaces = [
	{
		value: 'growth',
		label: 'Growth workspace',
		description: 'Campaigns, experiments, and referral programs.',
		initials: 'GW',
		src: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&crop=faces&w=96&h=96&q=80',
		tone: 'success',
		plan: 'Scale',
		count: '18 members',
	},
	{
		value: 'platform',
		label: 'Platform team',
		description: 'API keys, webhooks, usage limits, and internal tools.',
		initials: 'PT',
		src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&crop=faces&w=96&h=96&q=80',
		tone: 'info',
		plan: 'Enterprise',
		count: '42 members',
	},
	{
		value: 'support',
		label: 'Support operations',
		description: 'Ticket routing, SLAs, health alerts, and playbooks.',
		initials: 'SO',
		src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&crop=faces&w=96&h=96&q=80',
		tone: 'warning',
		plan: 'Business',
		count: '11 members',
	},
	{
		value: 'design',
		label: 'Design systems',
		description: 'Component governance, accessibility review, and release notes.',
		initials: 'DS',
		src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&crop=faces&w=96&h=96&q=80',
		tone: 'neutral',
		plan: 'Team',
		count: '9 members',
	},
	{
		value: 'research',
		label: 'Research lab',
		description: 'Interview notes, insight tagging, and participant panels.',
		initials: 'RL',
		src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&crop=faces&w=96&h=96&q=80',
		tone: 'info',
		plan: 'Pro',
		count: '6 members',
	},
	{
		value: 'ops',
		label: 'Operations hub',
		description: 'Vendor reviews, procurement workflows, and launch checklists.',
		initials: 'OH',
		src: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&crop=faces&w=96&h=96&q=80',
		tone: 'warning',
		plan: 'Scale',
		count: '24 members',
	},
];
const current = computed(() => workspaces.find((item) => item.value === workspace.value));
</script>

<template>
	<div class="grid w-full max-w-md gap-3">
		<DomSelect
			v-model="workspace"
			label="Workspace"
			description="Use DomSelect when options need richer markup than a native select can render."
			:options="workspaces"
			searchable
			search-placeholder="Search workspaces..."
			width="min-w-[22rem]"
		>
			<template #value>
				<span v-if="current" class="flex min-w-0 items-center gap-2">
					<DomAvatar :src="current.src" :name="current.label" :initials="current.initials" size="xs" />
					<span class="truncate">{{ current.label }}</span>
					<DomStatusPill :tone="current.tone" size="sm">{{ current.plan }}</DomStatusPill>
				</span>
			</template>

			<template #option="{ option, selected }">
				<span class="flex items-start gap-3">
					<DomAvatar :src="option.src" :name="option.label" :initials="option.initials" size="sm" />
					<span class="min-w-0 flex-1">
						<span class="flex items-center gap-2">
							<span class="truncate font-medium">{{ option.label }}</span>
							<DomStatusPill :tone="option.tone" size="sm">{{ option.plan }}</DomStatusPill>
						</span>
						<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ option.description }}</span>
						<span class="mt-2 flex items-center gap-2">
							<DomBadge size="sm" tone="neutral">{{ option.count }}</DomBadge>
							<DomBadge v-if="selected" size="sm" tone="success">Selected</DomBadge>
						</span>
					</span>
				</span>
			</template>
		</DomSelect>

		<p class="text-xs text-muted-fg">Selected value: <code class="text-canvas-fg">{{ workspace }}</code></p>
	</div>
</template>
