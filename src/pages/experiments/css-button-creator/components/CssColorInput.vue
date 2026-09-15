<script setup>
import { computed, inject, onMounted, ref, useId, watch } from 'vue';
import { DomColorInput } from '../../../lib/vue';
import { cssColorToHex } from '../../../lib/css/color.js';
import { cssEditorContextKey, resolveEditorColor } from '../lib/cssEditorContext.js';

const props = defineProps({
	modelValue: { type: String, default: '#000000' },
	label: { type: String, default: 'Colour' },
});
const emit = defineEmits(['update:modelValue']);
const context = inject(cssEditorContextKey, null);
const id = useId();
const mounted = ref(false);
const resolvedColor = computed(() => resolveEditorColor(props.modelValue, context?.colorVariables.value));
const nativeValue = computed(() => {
	// Browser-dependent colour functions can only be resolved after hydration.
	if (!mounted.value && !/^#|^oklch\(|^rgba?\(/i.test(resolvedColor.value)) return '#000000';
	return cssColorToHex(resolvedColor.value);
});
const draft = ref(props.modelValue);

/**
 * Keeps the editable expression aligned when the selected skin or palette changes.
 *
 * @param {string} value Newly selected CSS colour value.
 * @returns {void}
 */
function syncDraft(value) {
	draft.value = value;
}

/**
 * Commits a valid CSS colour expression or restores the previous value.
 *
 * @returns {void}
 */
function commitDraft() {
	const value = draft.value.trim();
	const resolved = resolveEditorColor(value, context?.colorVariables.value);
	if (value && value.length <= 160 && !/[;{}@]|\burl\s*\(/i.test(value) && CSS.supports('color', resolved)) {
		emit('update:modelValue', value);
	} else {
		draft.value = props.modelValue;
	}
}

/** Enables browser colour resolution after the initial server/client render. */
function enableBrowserColors() {
	mounted.value = true;
}

watch(() => props.modelValue, syncDraft);
onMounted(enableBrowserColors);
</script>

<template>
	<div v-if="context && !context.framed.value" class="min-w-0 space-y-1.5">
		<label :for="id" class="block text-[10px] font-medium uppercase tracking-wide text-muted-fg">{{ label }}</label>
		<div
			class="flex h-9 min-w-0 items-center gap-2 rounded-md border border-input bg-canvas px-2 focus-within:ring-1 focus-within:ring-ring"
		>
			<label
				class="relative size-5 shrink-0 overflow-hidden rounded-sm border border-border"
				:style="{ backgroundColor: resolvedColor }"
			>
				<input
					type="color"
					:value="nativeValue"
					:aria-label="`${label} colour`"
					class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
					@input="emit('update:modelValue', $event.target.value)"
				/>
			</label>
			<input
				:id="id"
				v-model="draft"
				:aria-label="`${label} CSS colour`"
				:title="modelValue"
				spellcheck="false"
				class="min-w-0 w-full bg-transparent font-mono text-[11px] outline-none"
				@blur="commitDraft"
				@keydown.enter.prevent="commitDraft"
			/>
		</div>
	</div>
	<DomColorInput
		v-else
		:model-value="modelValue"
		:label="label"
		@update:model-value="emit('update:modelValue', $event)"
	/>
</template>
