<script setup>
import { computed } from 'vue';
import { DomBadge, DomSelect, DomStatusPill } from '../../../../../lib/vue';

const props = defineProps({
	source: {
		type: String,
		required: true,
	},
	modelValue: {
		type: String,
		required: true,
	},
	count: {
		type: String,
		default: '',
	},
	status: {
		type: String,
		default: 'synced',
	},
	options: {
		type: Array,
		required: true,
	},
});

const emit = defineEmits(['update:modelValue']);
const statusPresentation = computed(getStatusPresentation);

/**
 * Resolve the semantic status used for the mapping result.
 *
 * @returns {{ label: string, tone: string }} Mapping status presentation.
 */
function getStatusPresentation() {
	return {
		synced: { label: 'Synced', tone: 'success' },
		review: { label: 'Review', tone: 'warning' },
		blocked: { label: 'Blocked', tone: 'danger' },
	}[props.status] || { label: props.status, tone: 'neutral' };
}

/**
 * Forward a selected workspace role to the parent mapping model.
 *
 * @param {string} value Selected role identifier.
 * @returns {void}
 */
function updateTarget(value) {
	emit('update:modelValue', value);
}
</script>

<template>
	<article
		:aria-label="`${source} role mapping`"
		class="grid gap-4 border-b border-border py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(15rem,0.8fr)_auto] md:items-end"
	>
		<div class="min-w-0">
			<div class="flex flex-wrap items-center gap-2">
				<h3 class="truncate text-sm font-semibold text-canvas-fg">{{ source }}</h3>
				<DomBadge v-if="count" tone="neutral" variant="outline" size="sm">{{ count }}</DomBadge>
			</div>
			<p class="mt-1 text-xs leading-5 text-muted-fg">Imported identity-provider group</p>
		</div>

		<DomSelect
			:model-value="modelValue"
			:label="`Workspace role for ${source}`"
			:options="options"
			width="min-w-[18rem]"
			@update:model-value="updateTarget"
		>
			<template #value="{ option, label }">
				<span class="min-w-0">
					<span class="block truncate text-sm font-medium">{{ label }}</span>
					<span v-if="option?.description" class="block truncate text-xs text-muted-fg">{{ option.description }}</span>
				</span>
			</template>
			<template #option="{ option }">
				<span class="min-w-0">
					<span class="block text-sm font-medium">{{ option.label }}</span>
					<span class="block text-xs leading-5 opacity-75">{{ option.description }}</span>
				</span>
			</template>
		</DomSelect>

		<div class="flex items-center md:h-10">
			<DomStatusPill
				:tone="statusPresentation.tone"
				:label="statusPresentation.label"
				size="sm"
			/>
		</div>
	</article>
</template>
