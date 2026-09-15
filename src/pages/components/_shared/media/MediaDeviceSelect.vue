<script setup>
import { computed } from 'vue';
import DomNativeSelect from '../../../forms/native-select/DomNativeSelect.vue';

const props = defineProps({
	devices: { type: Array, required: true },
	deviceId: { type: String, default: '' },
	label: { type: String, default: 'Microphone' },
	disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['select']);
/** Keeps saved selections readable before permission reveals the device list. */
const options = computed(() => {
	const items = props.devices.map(toOption);
	if (props.deviceId && !items.some(matchesSelection)) {
		items.unshift({ value: props.deviceId, label: `Selected ${props.label.toLowerCase()}` });
	}
	return [{ value: '', label: 'System default' }, ...items];
});
/** Tests whether discovery already includes the committed or saved input. */
function matchesSelection(option) { return option.value === props.deviceId; }
/** Converts browser input metadata into the native select's public option shape. */
function toOption(device) { return { value: device.deviceId, label: device.label }; }
</script>

<template>
	<DomNativeSelect :label="label" :model-value="deviceId" :options="options" placeholder="" :disabled="disabled" @update:model-value="emit('select', $event)" />
</template>
