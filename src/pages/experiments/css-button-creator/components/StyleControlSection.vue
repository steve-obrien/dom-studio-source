<script setup>
import ControlIconButton from './ControlIconButton.vue';

const props = defineProps({
	title: {
		type: String,
		required: true,
	},
	meta: {
		type: String,
		default: '',
	},
	modelValue: {
		type: Boolean,
		default: true,
	},
	muted: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['update:modelValue']);

function toggleOpen() {
	emit('update:modelValue', !props.modelValue);
}
</script>

<template>
	<section class="rounded-lg border border-border skin-card text-canvas-fg" :class="muted && 'opacity-60'">
		<div class="grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-2">
			<button type="button" class="min-w-0 text-left" @click="toggleOpen">
				<span class="block truncate text-sm font-semibold">{{ title }}</span>
				<span v-if="meta" class="block text-xs text-muted-fg">{{ meta }}</span>
			</button>
			<div class="flex items-center gap-1">
				<slot name="actions" />
				<ControlIconButton :icon="modelValue ? 'minus' : 'plus'" :label="modelValue ? `Collapse ${title}` : `Expand ${title}`" @click="toggleOpen" />
			</div>
		</div>
		<div v-if="modelValue" class="border-t border-border">
			<slot />
		</div>
	</section>
</template>
