<script setup>
import { ref } from 'vue';
import {
	DomButton,
	DomForm,
	DomInputGroup,
	DomTextInput,
} from '@getdom/studio/vue';

const item = ref({
	name: '',
});
</script>

<template>
	<DomForm v-model="item" class="w-full max-w-md">
		<DomInputGroup aria-label="Add an item">
			<div class="grid grid-cols-[minmax(0,1fr)_auto]">
				<DomTextInput
					name="name"
					label="Item"
					placeholder="Write release notes"
					:chrome="false"
				/>

				<div class="border-l border-border">
					<DomButton type="submit" class="!rounded-none px-5">
						Add
					</DomButton>
				</div>
			</div>
		</DomInputGroup>
	</DomForm>
</template>
