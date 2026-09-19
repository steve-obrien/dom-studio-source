<script setup>
import DomNativeSelect from '../../forms/native-select/DomNativeSelect.vue';
import DomNumberInput from '../../forms/number-input/DomNumberInput.vue';
import DomTextInput from '../../forms/text-input/DomTextInput.vue';
import { createFrameLayout } from './frameLayout.js';

defineOptions({ __doc: { name: 'Frame layout editor', description: 'Controlled layout settings for flow, flex, grid and absolute frames.' } });
const props = defineProps({ modelValue: { type: Object, default: () => createFrameLayout() } });
const emit = defineEmits(['update:modelValue']);
const modes = [{ label: 'Flow', value: 'flow' }, { label: 'Flex', value: 'flex' }, { label: 'Grid', value: 'grid' }, { label: 'Absolute', value: 'absolute' }];
const directions = ['row', 'column', 'row-reverse', 'column-reverse'];
const justification = ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'];
const alignment = ['start', 'center', 'end', 'stretch', 'baseline'];
/** Emits a fresh record; the host captures geometry before committing a mode change. */
function update(key, value) {
	emit('update:modelValue', createFrameLayout({ ...props.modelValue, [key]: value }));
}
</script>

<template>
	<div class="space-y-4">
		<DomNativeSelect label="Child layout" :model-value="modelValue.mode" :options="modes" @update:model-value="update('mode', $event)" />
		<DomNumberInput label="Padding" :model-value="modelValue.padding" :min="0" @update:model-value="update('padding', $event)" />
		<template v-if="modelValue.mode === 'flex' || modelValue.mode === 'grid'">
			<DomNumberInput label="Gap" :model-value="modelValue.gap" :min="0" @update:model-value="update('gap', $event)" />
			<template v-if="modelValue.mode === 'flex'">
				<DomNativeSelect label="Direction" :model-value="modelValue.direction" :options="directions" @update:model-value="update('direction', $event)" />
				<DomNativeSelect label="Wrap" :model-value="modelValue.wrap" :options="['nowrap', 'wrap']" @update:model-value="update('wrap', $event)" />
			</template>
			<template v-else>
				<DomTextInput label="Columns" :model-value="modelValue.columns" @update:model-value="update('columns', $event)" />
				<DomTextInput label="Rows" :model-value="modelValue.rows" @update:model-value="update('rows', $event)" />
				<DomNativeSelect label="Auto flow" :model-value="modelValue.autoFlow" :options="['row', 'column', 'row dense', 'column dense']" @update:model-value="update('autoFlow', $event)" />
				<DomNativeSelect label="Justify items" :model-value="modelValue.justifyItems" :options="['start', 'center', 'end', 'stretch']" @update:model-value="update('justifyItems', $event)" />
			</template>
			<DomNativeSelect label="Justify content" :model-value="modelValue.justify" :options="justification" @update:model-value="update('justify', $event)" />
			<DomNativeSelect label="Align items" :model-value="modelValue.align" :options="alignment" @update:model-value="update('align', $event)" />
		</template>
		<p class="text-xs leading-5 text-muted-fg">{{ modelValue.mode === 'absolute' ? 'Children move freely inside this frame. Alignment and spacing use this frame and its siblings.' : modelValue.mode === 'flow' ? 'Children follow normal document flow. Their margins and widths control spacing.' : 'The browser arranges children. Use gap and alignment here; reorder items in the inspector.' }}</p>
	</div>
</template>
