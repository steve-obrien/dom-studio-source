<script setup>
import { ref } from 'vue';
import { DomDialog, DomButton } from '@getdom/studio/vue';

const open = ref(false);
</script>

<template>
	<DomButton variant="danger" @click="open = true">Delete project</DomButton>
	<DomDialog
		v-model="open"
		title="Delete project?"
		description="This will permanently delete the project and all of its data."
	>
		<p class="text-sm text-muted-foreground">There is no undo. Type the project name to confirm.</p>
		<input
			class="mt-3 h-10 w-full rounded-full border border-border bg-background px-4 text-sm"
			placeholder="my-project"
		/>
		<template #footer>
			<DomButton variant="secondary" @click="open = false">Cancel</DomButton>
			<DomButton variant="danger" @click="open = false">Delete</DomButton>
		</template>
	</DomDialog>
</template>
