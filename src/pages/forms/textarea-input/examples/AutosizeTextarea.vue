<script setup>
import { ref } from 'vue';
import { DomTextareaInput } from '@getdom/studio/vue';

const unlimited = ref('This field keeps growing.\nAdd more lines to see it expand without a ceiling.');
const bounded = ref('This field grows to five rows.\nAfter that, its content scrolls inside the textarea.');
</script>

<template>
	<div class="grid w-full gap-5 md:grid-cols-2">
		<DomTextareaInput
			v-model="unlimited"
			label="Unlimited growth"
			description="rows sets the minimum; omitting maxRows leaves growth uncapped."
			autosize
			:rows="1"
		/>
		<DomTextareaInput
			v-model="bounded"
			label="Bounded growth"
			description="The textarea scrolls after reaching maxRows."
			autosize
			:rows="1"
			:max-rows="5"
		/>
	</div>
</template>
