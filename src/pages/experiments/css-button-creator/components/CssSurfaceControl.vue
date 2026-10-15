<script setup>
import CssColorInput from './CssColorInput.vue';
import StyleControlSection from './StyleControlSection.vue';

defineProps({
	surface: {
		type: Object,
		required: true,
	},
	modelValue: {
		type: Boolean,
		default: true,
	},
	title: {
		type: String,
		default: 'Surface',
	},
	variables: {
		type: Object,
		default: () => ({}),
	},
});

const emit = defineEmits(['update:modelValue']);
</script>

<template>
	<StyleControlSection
		:model-value="modelValue"
		:title="title"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<div>
			<div class="grid gap-3 sm:grid-cols-2">
				<div class="space-y-1.5">
					<CssColorInput v-model="surface.bg" label="Background" />
					<p v-if="variables.bg" class="truncate font-mono text-[11px] text-muted-fg">{{ variables.bg }}</p>
				</div>
				<div class="space-y-1.5">
					<CssColorInput v-model="surface.fg" label="Foreground" />
					<p v-if="variables.fg" class="truncate font-mono text-[11px] text-muted-fg">{{ variables.fg }}</p>
				</div>
			</div>
		</div>
	</StyleControlSection>
</template>
