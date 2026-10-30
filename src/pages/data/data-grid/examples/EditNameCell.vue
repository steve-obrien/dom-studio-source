<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
	value: {
		type: [String, Number],
		default: '',
	},
	formatted: {
		type: String,
		default: '',
	},
	row: {
		type: Object,
		required: true,
	},
	column: {
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
const emit = defineEmits(['update:value']);

const editing = ref(false);
const draft = ref(String(props.value ?? ''));
const initials = computed(() => {
	const source = String(props.value || props.row.email || '?').trim();
	return source
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0])
		.join('')
		.toUpperCase();
});

watch(() => props.value, (value) => {
	if (!editing.value) draft.value = String(value ?? '');
});

function startEdit() {
	draft.value = String(props.value ?? '');
	editing.value = true;
}

function save() {
	const value = draft.value.trim();
	if (value) emit('update:value', value);
	editing.value = false;
}

function cancel() {
	draft.value = String(props.value ?? '');
	editing.value = false;
}
</script>

<template>
	<div class="min-w-0" @click.stop>
		<form v-if="editing" class="flex min-w-0 items-center gap-2" @submit.prevent="save">
			<input
				v-model="draft"
				type="text"
				class="skin-input h-8 min-w-0 rounded-md text-sm"
				:aria-label="`Edit ${column.label} for row ${rowIndex + 1}`"
			/>
			<button
				type="submit"
				class="skin-action inline-flex h-8 items-center rounded-md px-2 text-xs font-semibold"
			>
				Save
			</button>
			<button
				type="button"
				class="inline-flex h-8 items-center rounded-md px-2 text-xs font-semibold text-muted-fg transition hover:bg-secondary hover:text-canvas-fg"
				@click="cancel"
			>
				Cancel
			</button>
		</form>

		<button
			v-else
			type="button"
			class="group flex min-w-0 items-center gap-3 rounded-md py-1 pr-2 text-left outline-none transition hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-ring/50"
			:aria-label="`Edit ${formatted || value}`"
			@click="startEdit"
		>
			<span class="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
				{{ initials }}
			</span>
			<span class="min-w-0 flex-1">
				<span class="block truncate font-medium text-canvas-fg">{{ formatted || value }}</span>
				<span class="block truncate text-xs text-muted-fg">{{ row.email }}</span>
			</span>
			<span class="text-xs font-medium text-muted-fg opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
				Edit
			</span>
		</button>
	</div>
</template>
