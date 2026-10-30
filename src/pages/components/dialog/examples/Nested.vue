<script setup>
import { ref } from 'vue';
import { DomDialog, DomButton, DomTextInput } from '@getdom/studio/vue';

const outer = ref(false);
const confirm = ref(false);
const projectName = ref('');
</script>

<template>
	<DomButton variant="danger" @click="outer = true">Delete project…</DomButton>

	<DomDialog
		v-model="outer"
		title="Delete project?"
		description="This action cannot be undone."
	>
		<p class="text-sm text-muted-fg">All issues, comments, and uploads will be removed.</p>
		<template #footer>
			<DomButton variant="secondary" @click="outer = false">Cancel</DomButton>
			<DomButton variant="danger" @click="confirm = true">Continue</DomButton>
		</template>

		<DomDialog
			v-model="confirm"
			title="Final confirmation"
			description="Type the project name to confirm deletion."
		>
			<DomTextInput v-model="projectName" label="Project name" placeholder="my-project" />
			<template #footer>
				<DomButton variant="secondary" @click="confirm = false">Back</DomButton>
				<DomButton
					variant="danger"
					:disabled="projectName !== 'my-project'"
					@click="confirm = false; outer = false; projectName = ''"
				>
					Delete forever
				</DomButton>
			</template>
		</DomDialog>
	</DomDialog>
</template>
