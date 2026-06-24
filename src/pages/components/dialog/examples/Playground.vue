<script setup>
import { reactive } from 'vue';
import { DomDialog, DomButton } from '@getdom/studio/vue';

const data = reactive({
	modelValue: false,
	static: false,
	backdrop: true,
	size: 'md',
	width: '',
	height: '',
	title: 'Dialog title',
	description: 'Supporting text shown under the heading.',
});

defineExpose({ data });
</script>

<template>
	<DomDialog
		v-bind="data"
		@update:modelValue="data.modelValue = $event"
	>
		<template #trigger>
			<DomButton variant="primary">Open dialog</DomButton>
		</template>
		<p class="text-sm text-muted-fg">Dialog body content.</p>
		<template #footer>
			<DomButton variant="secondary" data-close>Cancel</DomButton>
			<DomButton data-close>Confirm</DomButton>
		</template>
	</DomDialog>
</template>
