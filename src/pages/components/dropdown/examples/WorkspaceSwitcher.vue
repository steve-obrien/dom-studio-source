<script setup>
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { DomAvatar, DomAvatarStack, DomBadge, DomDropdown, DomStatusPill } from '@getdom/studio/vue';

const workspaces = [
	{
		value: 'northstar',
		label: 'Northstar Studio',
		description: 'Design systems and product audit workspace',
		initials: 'NS',
		src: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&crop=faces&w=96&h=96&q=80',
		tone: 'success',
		plan: 'Scale',
		members: [
			{ name: 'Mina Patel', initials: 'MP', src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
			{ name: 'Ari Chen', initials: 'AC', src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
			{ name: 'Noah Kim', initials: 'NK', src: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
		],
	},
	{
		value: 'vector',
		label: 'Vector Labs',
		description: 'AI workflow experiments and eval reports',
		initials: 'VL',
		src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&crop=faces&w=96&h=96&q=80',
		tone: 'info',
		plan: 'Pro',
		members: [
			{ name: 'Leah Stone', initials: 'LS', src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
			{ name: 'Theo Grant', initials: 'TG', src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
		],
	},
	{
		value: 'harbor',
		label: 'Harbor Ops',
		description: 'Support, billing, and incident operations',
		initials: 'HO',
		src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&crop=faces&w=96&h=96&q=80',
		tone: 'warning',
		plan: 'Business',
		members: [
			{ name: 'Sam Green', initials: 'SG', src: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
			{ name: 'Ida Bell', initials: 'IB', src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
			{ name: 'Kai Rivers', initials: 'KR', src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
			{ name: 'June Hart', initials: 'JH', src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
		],
	},
];

const selected = ref('northstar');
const current = computed(() => workspaces.find((workspace) => workspace.value === selected.value));
</script>

<template>
	<div class="grid w-full max-w-sm gap-3">
		<DomDropdown :items="workspaces" :focus-value="selected" width="min-w-[22rem]" @select="(value) => selected = value">
			<template #trigger>
				<span class="flex min-w-0 items-center gap-2">
					<DomAvatar :src="current?.src" :name="current?.label" :initials="current?.initials" size="xs" />
					<span class="truncate">{{ current?.label }}</span>
					<DomStatusPill :tone="current?.tone" size="sm">{{ current?.plan }}</DomStatusPill>
				</span>
			</template>

			<template #item="{ item }">
				<span class="flex items-start gap-3">
					<DomAvatar :src="item.src" :name="item.label" :initials="item.initials" size="sm" />
					<span class="min-w-0 flex-1">
						<span class="flex items-center gap-2">
							<span class="truncate font-medium">{{ item.label }}</span>
							<DomStatusPill :tone="item.tone" size="sm">{{ item.plan }}</DomStatusPill>
						</span>
						<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ item.description }}</span>
						<span class="mt-2 flex items-center justify-between gap-3">
							<DomAvatarStack :items="item.members" size="xs" :max="3" :label="`${item.label} members`" />
							<DomBadge v-if="item.value === selected" tone="success" size="sm">Current</DomBadge>
						</span>
					</span>
				</span>
			</template>
		</DomDropdown>
		<p class="text-xs leading-5 text-muted-fg">
			Use <RouterLink to="/forms/select" class="font-medium text-canvas-fg underline-offset-4 hover:underline">DomSelect</RouterLink> when workspace selection needs form semantics.
		</p>
	</div>
</template>
