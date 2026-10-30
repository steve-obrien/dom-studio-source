<script setup>
const props = defineProps({
	row: {
		type: Object,
		required: true,
	},
	rowIndex: {
		type: Number,
		required: true,
	},
	rowKey: {
		type: [String, Number],
		required: true,
	},
});
const emit = defineEmits(['action']);

function selectAction(action) {
	emit('action', {
		action,
		id: props.row.id,
		name: props.row.name,
		rowIndex: props.rowIndex,
		rowKey: props.rowKey,
	});
}
</script>

<template>
	<div class="flex justify-end gap-1" @click.stop>
		<button
			type="button"
			class="rounded-md px-2 py-1 text-xs font-semibold text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
			:aria-label="`View ${row.name}`"
			@click="selectAction('view')"
		>
			View
		</button>
		<button
			type="button"
			class="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:text-emerald-300"
			:aria-label="`Approve ${row.name}`"
			@click="selectAction('approve')"
		>
			Approve
		</button>
		<button
			type="button"
			class="rounded-md px-2 py-1 text-xs font-semibold text-destructive transition hover:bg-destructive/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
			:aria-label="`Delete ${row.name}`"
			@click="selectAction('delete')"
		>
			Delete
		</button>
	</div>
</template>
