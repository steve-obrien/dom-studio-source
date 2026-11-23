<script setup>
import { computed } from 'vue';
import DomDropdown from '../dropdown/DomDropdown.vue';
import DomMenu from '../menu/DomMenu.vue';

const props = defineProps({
	models: { type: Array, required: true },
	selected: { type: Object, required: true },
	features: { type: Array, required: true },
	resolvedModelLabel: { type: String, default: '' },
	qualifier: { type: String, default: '' },
	align: { type: String, default: 'left' },
	disabled: { type: Boolean, default: false },
	triggerClass: { type: String, required: true },
});
const emit = defineEmits(['update']);
const selectionLabel = computed(() => props.selected.id === 'auto' && props.resolvedModelLabel
	? `Auto · ${props.resolvedModelLabel}`
	: props.selected.label);
const menuItems = computed(buildMenu);

/**
 * Builds model choices and capability flyouts from the same values used by the stacked picker.
 * Keeps the selected model in the compact list when the catalogue is larger.
 *
 * @returns {Array<object>} Rows accepted by DomMenu.
 */
function buildMenu() {
	const models = props.models.length > 1 ? props.models.map((model) => ({
		label: model.label,
		value: `model:${model.id}`,
		type: 'radio',
		checked: model.id === props.selected.id,
		patch: { model: model.id },
	})) : [];
	const primary = models.slice(0, 4);
	const selected = models.find((model) => model.checked);
	if (selected && !primary.includes(selected)) primary[primary.length - 1] = selected;
	const additional = models.filter((model) => !primary.includes(model));
	const settings = props.features.map(({ key, label, options, value }) => ({
		label,
		value: `setting:${key}`,
		current: options.find((option) => option.value === value)?.label,
		children: options.map((option) => ({
			label: option.label,
			value: `${key}:${option.value}`,
			type: 'radio',
			checked: option.value === value,
			patch: { [key]: option.value },
		})),
	}));
	return [
		...primary,
		...(primary.length && (settings.length || additional.length) ? [{ separator: true }] : []),
		...settings,
		...(additional.length ? [{ label: 'More models', value: 'more-models', children: additional }] : []),
	];
}

/**
 * Commits the selected model or feature and returns focus to the picker trigger.
 *
 * @param {{ item: { patch?: object } }} selection Menu selection.
 * @param {() => void} close Dropdown close callback.
 */
function select({ item }, close) {
	if (!item?.patch) return;
	emit('update', item.patch);
	close();
}
</script>

<template>
	<DomDropdown
		v-if="menuItems.length"
		class="min-w-0 max-w-full"
		placement="top"
		width="w-[min(14rem,calc(100vw-1.5rem))] p-0!"
		:align="align"
		:trigger-class="triggerClass"
		:disabled="disabled"
		:focus-value="`model:${selected.id}`"
	>
		<template #trigger>
			<span class="sr-only">Model:</span>
			<span class="min-w-0 truncate" :title="selectionLabel">{{ selectionLabel }}</span>
			<span v-if="qualifier" class="shrink-0 text-muted-fg">{{ qualifier }}</span>
		</template>
		<template #default="{ close }">
			<DomMenu :items="menuItems" @select="select($event, close)">
				<template #item-accessory="{ item, checked, hasChildren }">
					<template v-if="hasChildren">
						<span v-if="item.current">{{ item.current }}</span>
						<span aria-hidden="true">›</span>
					</template>
					<span v-else-if="checked" class="font-semibold text-primary" aria-hidden="true">✓</span>
				</template>
			</DomMenu>
		</template>
	</DomDropdown>
	<span v-else class="min-w-0 truncate px-2 text-sm font-medium text-muted-fg">
		<span class="sr-only">Model:</span> {{ selectionLabel }}
	</span>
</template>
