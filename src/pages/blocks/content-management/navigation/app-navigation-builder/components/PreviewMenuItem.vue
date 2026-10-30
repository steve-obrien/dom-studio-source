<script setup>
import { DomBadge, DomIconButton } from '@getdom/studio/vue';

defineOptions({
	name: 'PreviewMenuItem',
});

const props = defineProps({
	item: {
		type: Object,
		required: true,
	},
	selectedId: {
		type: String,
		default: '',
	},
	depth: {
		type: Number,
		default: 0,
	},
	compact: {
		type: Boolean,
		default: false,
	},
});

defineEmits(['select']);

/**
 * Return the short audience marker shown beside gated preview rows.
 *
 * @param {Record<string, unknown>} item Navigation preview item.
 * @returns {string} Short policy label.
 */
function audienceLabel(item) {
	if (item.visibility === 'admins') return 'Admin';
	if (item.visibility === 'roles') return 'Gated';
	return '';
}
</script>

<template>
	<div class="grid gap-0.5">
		<button
			type="button"
			class="group flex min-h-10 w-full items-center gap-2 rounded-md pr-2 text-left text-sm outline-none transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50"
			:class="selectedId === item.id ? 'bg-primary/10 text-canvas-fg' : 'text-muted-fg'"
			:style="{ paddingLeft: `${0.5 + depth * 0.75}rem` }"
			@click="$emit('select', item.id)"
		>
			<DomIconButton
				as="span"
				class="pointer-events-none"
				size="xs"
				:active="selectedId === item.id"
				:icon="item.icon"
				:label="`${item.label} icon`"
			/>
			<span class="min-w-0 flex-1 truncate font-medium text-canvas-fg">{{ item.label }}</span>
			<DomBadge
				v-if="audienceLabel(item) && !compact"
				tone="neutral"
				variant="outline"
				size="sm"
			>
				{{ audienceLabel(item) }}
			</DomBadge>
		</button>

		<div v-if="item.children?.length" class="grid gap-0.5">
			<PreviewMenuItem
				v-for="child in item.children"
				:key="child.id"
				:item="child"
				:selected-id="props.selectedId"
				:depth="props.depth + 1"
				:compact="props.compact"
				@select="$emit('select', $event)"
			/>
		</div>
	</div>
</template>
