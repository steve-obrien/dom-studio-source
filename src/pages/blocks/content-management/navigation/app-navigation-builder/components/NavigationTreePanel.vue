<script setup>
import { computed } from 'vue';
import { DomIconButton, DomStatusPill, DomTreeView } from '@getdom/studio/vue';

const props = defineProps({
	items: {
		type: Array,
		default: () => [],
	},
	selectedId: {
		type: String,
		default: '',
	},
	validation: {
		type: Object,
		default: () => ({ issues: [] }),
	},
	reordering: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['add', 'select', 'reorder']);

const blockerIds = computed(getBlockerIds);

/**
 * Return the navigation item identifiers with blocking validation issues.
 *
 * @returns {Set<string>} Item identifiers with blockers.
 */
function getBlockerIds() {
	return new Set((props.validation?.issues || [])
		.filter((issue) => issue.severity === 'blocker')
		.map((issue) => issue.itemId));
}

/**
 * Map a navigation visibility rule to a compact human-readable label.
 *
 * @param {string} visibility Visibility rule value.
 * @returns {string} Compact visibility label.
 */
function visibilityLabel(visibility) {
	if (visibility === 'roles') return 'Gated';
	if (visibility === 'admins') return 'Admin';
	if (visibility === 'hidden') return 'Hidden';
	return '';
}

/**
 * Map a navigation visibility rule to a DOM Studio status tone.
 *
 * @param {string} visibility Visibility rule value.
 * @returns {string} Status pill tone.
 */
function visibilityTone(visibility) {
	if (visibility === 'admins') return 'danger';
	if (visibility === 'hidden') return 'warning';
	return 'primary';
}

/**
 * Forward tree selection using only the stable item identifier.
 *
 * @param {Record<string, unknown>} payload DomTreeView selection payload.
 * @returns {void}
 */
function selectTreeItem(payload) {
	emit('select', String(payload.value));
}
</script>

<template>
	<div class="flex h-full min-h-0 flex-col bg-canvas">
		<div class="shrink-0 border-b border-border px-3 py-3">
			<div class="flex items-center justify-between gap-3">
				<div class="min-w-0">
					<p class="font-semibold tracking-tight">Primary navigation</p>
					<p class="mt-0.5 text-xs text-muted-fg">Drag or use Alt + arrow keys to reorder</p>
				</div>
				<DomIconButton
					label="Add navigation item"
					size="sm"
					variant="secondary"
					icon="M12 5v14M5 12h14"
					@click="emit('add')"
				/>
			</div>
		</div>

		<div class="min-h-0 flex-1 overflow-y-auto p-2">
			<DomTreeView
				:model-value="props.selectedId"
				:items="props.items"
				label="Application navigation hierarchy"
				:open-values="['projects']"
				variant="finder"
				density="compact"
				:draggable="!props.reordering"
				@select="selectTreeItem"
				@update:items="emit('reorder', $event)"
			>
				<template #item="{ item, selected }">
					<span class="flex min-w-0 flex-1 items-center gap-2">
						<span
							v-if="blockerIds.has(item.id)"
							class="size-2 shrink-0 rounded-full bg-destructive"
							aria-label="Publishing blocker"
						></span>
						<span class="min-w-0 flex-1">
							<span class="block truncate text-sm font-medium" :class="selected ? 'text-canvas-fg' : 'text-muted-fg'">{{ item.label }}</span>
							<span class="block truncate text-[11px] text-muted-fg/75">{{ item.url }}</span>
						</span>
						<DomStatusPill
							v-if="visibilityLabel(item.visibility)"
							:tone="visibilityTone(item.visibility)"
							:label="visibilityLabel(item.visibility)"
							size="sm"
							:dot="false"
						/>
					</span>
				</template>
			</DomTreeView>
		</div>

		<div class="shrink-0 border-t border-border px-3 py-3 text-xs text-muted-fg">
			<div class="flex items-center justify-between gap-3">
				<span>{{ props.validation?.blockerCount || 0 }} blocker{{ props.validation?.blockerCount === 1 ? '' : 's' }}</span>
				<span v-if="props.reordering">Saving order…</span>
				<span v-else>{{ props.items.length }} top-level items</span>
			</div>
		</div>
	</div>
</template>
