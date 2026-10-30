<script setup>
import { computed, ref } from 'vue';
import ScrubField from '../_shared/ScrubField.vue';
import InspectorSelect from '../_shared/InspectorSelect.vue';
import { vDomTooltip } from '../../components/tooltip/vDomTooltip.js';
import { formatFilter, imageFilters, parseFilter, readImageFile, safeImageSource } from './imageStyle.js';

/**
 * Image controls for an inspector: the source (a URL or a file read in the
 * browser), alt text, how it fits its box, and colour filters. A value
 * editor: it emits a whole new value and the editor writes it.
 *
 * The value is `{ src, alt, fit, position, filter }`, where `fit` and
 * `position` are CSS `object-fit` and `object-position`, and `filter` is the
 * CSS `filter`.
 */
defineOptions({ __doc: { name: 'Image editor', description: 'Image source, alt text, fit and filters for a designer inspector.' } });
const props = defineProps({
	modelValue: { type: Object, required: true },
	title: { type: String, default: 'Image' },
	/** Turns a chosen file into a source. By default it is read as a data URL; pass one that uploads to your storage and returns its URL. */
	upload: { type: Function, default: readImageFile },
	disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'error']);

const fits = [{ label: 'Default', value: '' }, { label: 'Cover', value: 'cover' }, { label: 'Contain', value: 'contain' }, { label: 'Fill', value: 'fill' }, { label: 'None', value: 'none' }];
const positions = [{ label: 'Centre', value: '' }, { label: 'Top', value: 'top' }, { label: 'Bottom', value: 'bottom' }, { label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }];
const file = ref(null);
const busy = ref(false);
const draft = ref(null);
const filter = computed(() => parseFilter(props.modelValue.filter));
const filtered = computed(() => Boolean(formatFilter(filter.value.values)));
const isData = computed(() => String(props.modelValue.src || '').startsWith('data:'));

function update(patch) { emit('update:modelValue', { ...props.modelValue, ...patch }); }

/** Applies a typed source when it is safe; an unsafe one is reported and left out. */
function setSource(value) {
	draft.value = null;
	const text = String(value || '').trim();
	if (text === (props.modelValue.src || '')) return;
	const safe = safeImageSource(text);
	if (text && !safe) { emit('error', 'Use an http or https URL, a path, or upload an image.'); return; }
	update({ src: safe });
}
async function choose(event) {
	const chosen = event.target.files?.[0];
	event.target.value = '';
	if (!chosen) return;
	busy.value = true;
	try {
		update({ src: await props.upload(chosen) });
	} catch (error) {
		emit('error', error.message);
	} finally {
		busy.value = false;
	}
}
function setFilter(key, value) {
	const number = Number(value);
	if (!Number.isFinite(number)) return;
	update({ filter: formatFilter({ ...filter.value.values, [key]: number }, filter.value.rest) });
}
</script>

<template>
	<fieldset class="min-w-0 space-y-2" :disabled="disabled">
		<div class="flex items-center justify-between gap-2">
			<h3 class="text-[11px] font-semibold">{{ title }}</h3>
			<button type="button" class="rounded px-1.5 py-0.5 text-[11px] text-primary hover:bg-secondary disabled:opacity-40" :disabled="busy" v-dom-tooltip="'Choose an image file'" @click="file.click()">{{ busy ? 'Reading…' : 'Upload' }}</button>
		</div>
		<input
			:value="draft ?? (isData ? '' : modelValue.src || '')"
			:placeholder="isData ? 'Uploaded image (in the file)' : 'https://…'"
			type="url"
			aria-label="Image URL"
			class="h-7 w-full rounded-md bg-secondary/60 px-2 text-xs text-canvas-fg outline-none ring-inset hover:ring-1 hover:ring-border focus:bg-canvas focus:ring-1 focus:ring-primary"
			@input="draft = $event.target.value"
			@change="setSource($event.target.value)"
			@keydown.enter.prevent="$event.target.blur()"
		>
		<input
			:value="modelValue.alt || ''"
			placeholder="Describe the image"
			aria-label="Alt text"
			class="h-7 w-full rounded-md bg-secondary/60 px-2 text-xs text-canvas-fg outline-none ring-inset hover:ring-1 hover:ring-border focus:bg-canvas focus:ring-1 focus:ring-primary"
			@change="update({ alt: $event.target.value })"
			@keydown.enter.prevent="$event.target.blur()"
		>
		<div class="grid grid-cols-2 gap-1.5">
			<InspectorSelect label="Fit" :options="fits" :model-value="modelValue.fit || ''" @update:model-value="update({ fit: $event })" />
			<InspectorSelect label="Position" :options="positions" :model-value="modelValue.position || ''" @update:model-value="update({ position: $event })" />
		</div>
		<div class="flex items-center justify-between gap-2 pt-1">
			<h4 class="text-[11px] text-muted-fg">Filters</h4>
			<button v-if="filtered" type="button" class="rounded px-1.5 py-0.5 text-[11px] text-muted-fg hover:bg-secondary hover:text-canvas-fg" @click="update({ filter: filter.rest })">Reset</button>
		</div>
		<div class="grid grid-cols-2 gap-1.5">
			<ScrubField v-for="item in imageFilters" :key="item.key" :label="item.label" :prefix="item.label.slice(0, 3)" :suffix="item.unit" :min="0" :max="item.max" :model-value="Math.round(filter.values[item.key])" @update:model-value="setFilter(item.key, $event)" />
		</div>
		<input ref="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" class="hidden" aria-label="Upload image" @change="choose">
	</fieldset>
</template>
