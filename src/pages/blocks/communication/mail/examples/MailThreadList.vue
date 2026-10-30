<script setup>
import { DomAvatar, DomBadge, DomEmptyState, DomSpinner } from '@getdom/studio/vue';

defineProps({
	threads: {
		type: Array,
		default: () => [],
	},
	selectedId: {
		type: String,
		default: '',
	},
	loading: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['select']);

/**
 * Formats a thread timestamp for the compact conversation list.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Human-readable time or date.
 */
function formatThreadTime(value) {
	const date = new Date(value);
	const now = new Date();
	if (date.toDateString() === now.toDateString()) {
		return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(date);
	}
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date);
}

/**
 * Returns the first participant used to identify a thread.
 *
 * @param {Record<string, unknown>} thread Mail thread summary.
 * @returns {{ name?: string, initials?: string }} Primary participant.
 */
function primaryParticipant(thread) {
	return thread.participants?.[0] || {};
}
</script>

<template>
	<div class="h-full min-h-0 overflow-y-auto bg-canvas">
		<div v-if="loading" class="grid h-full place-items-center">
			<div class="flex items-center gap-2 text-sm text-muted-fg">
				<DomSpinner size="sm" label="Loading conversations" />
				Loading conversations
			</div>
		</div>

		<div v-else-if="threads.length" class="divide-y divide-border">
			<button
				v-for="thread in threads"
				:key="thread.id"
				type="button"
				class="group relative flex w-full gap-3 px-4 py-3.5 text-left transition hover:bg-secondary/60 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
				:class="thread.id === selectedId ? 'bg-secondary' : 'bg-canvas'"
				:aria-current="thread.id === selectedId ? 'true' : undefined"
				@click="emit('select', thread.id)"
			>
				<span v-if="thread.unread" class="absolute left-1.5 top-5 size-1.5 rounded-full bg-primary" aria-label="Unread"></span>
				<DomAvatar
					:name="primaryParticipant(thread).name"
					:initials="primaryParticipant(thread).initials"
					size="sm"
					class="mt-0.5"
				/>
				<span class="min-w-0 flex-1">
					<span class="flex items-baseline justify-between gap-3">
						<span class="truncate text-sm" :class="thread.unread ? 'font-semibold text-canvas-fg' : 'font-medium text-canvas-fg'">
							{{ primaryParticipant(thread).name }}
						</span>
						<span class="shrink-0 text-[11px] text-muted-fg">{{ formatThreadTime(thread.updatedAt) }}</span>
					</span>
					<span class="mt-0.5 flex items-center gap-1.5">
						<span class="truncate text-sm" :class="thread.unread ? 'font-semibold text-canvas-fg' : 'font-medium text-canvas-fg/90'">{{ thread.subject }}</span>
						<DomBadge v-if="thread.starred" label="Starred" tone="warning" size="sm" />
					</span>
					<span class="mt-1 block truncate text-xs leading-5 text-muted-fg">{{ thread.preview }}</span>
					<span v-if="thread.labels.length" class="mt-2 flex flex-wrap gap-1">
						<DomBadge
							v-for="label in thread.labels.slice(0, 2)"
							:key="label.value"
							:label="label.label"
							:tone="label.tone"
							size="sm"
						/>
					</span>
				</span>
			</button>
		</div>

		<div v-else class="grid h-full min-h-64 place-items-center p-6">
			<DomEmptyState
				title="Nothing here"
				description="Try another folder or clear the current search and filter."
				icon="M5 6h14v12H5V6Zm0 0 7 6 7-6"
			/>
		</div>
	</div>
</template>
