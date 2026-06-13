<script setup>
import { ref } from 'vue';
import { DomBadge, DomSelect } from '@getdom/studio/vue';

const plan = ref('pro');
const plans = [
	{ value: 'starter', label: 'Starter', description: 'For personal tools and prototypes.', price: '$19', badge: 'Good for trials' },
	{ value: 'pro', label: 'Pro', description: 'For small teams shipping customer workflows.', price: '$79', badge: 'Most popular' },
	{ value: 'enterprise', label: 'Enterprise', description: 'For SSO, audit logs, governance, and dedicated support.', price: 'Custom', badge: 'Requires sales' },
];
</script>

<template>
	<div class="w-full max-w-md">
		<DomSelect v-model="plan" label="Plan" :options="plans" width="min-w-[20rem]">
			<template #option="{ option, selected }">
				<span class="flex items-start justify-between gap-4">
					<span class="min-w-0">
						<span class="flex items-center gap-2">
							<span class="font-semibold">{{ option.label }}</span>
							<DomBadge v-if="selected" size="sm" tone="success">Current</DomBadge>
						</span>
						<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ option.description }}</span>
						<DomBadge class="mt-2" size="sm" tone="neutral">{{ option.badge }}</DomBadge>
					</span>
					<span class="shrink-0 text-sm font-semibold text-canvas-fg">{{ option.price }}</span>
				</span>
			</template>
		</DomSelect>
	</div>
</template>
