<script setup>
import { ref } from 'vue';
import {
	DomButton,
	DomForm,
	DomInputGroup,
	DomTextInput,
} from '@getdom/studio/vue';

const website = ref({
	domain: '',
});
</script>

<template>
	<DomForm v-model="website" class="w-full max-w-md">
		<DomInputGroup aria-label="Add a website URL">
			<div class="grid grid-cols-[auto_minmax(0,1fr)_auto]">
				<span
					aria-hidden="true"
					class="flex h-10 items-center bg-secondary/40 px-3 text-sm text-muted-fg"
				>
					https://
				</span>

				<div class="border-l border-border">
					<DomTextInput
						name="domain"
						label="Website domain after https://"
						placeholder="example.com"
						:chrome="false"
					/>
				</div>

				<div class="border-l border-border">
					<DomButton type="submit" class="!rounded-none px-5">
						Add
					</DomButton>
				</div>
			</div>
		</DomInputGroup>
	</DomForm>
</template>
