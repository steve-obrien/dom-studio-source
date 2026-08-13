<script setup>
import { ref } from 'vue';
import { DomDialog, DomButton } from '@getdom/studio/vue';

const open = ref(false);
</script>

<template>
	<DomButton variant="danger" @click="open = true">Delete project</DomButton>
	<DomDialog
		v-model="open"
		static
		title="Delete project?"
		description="This will permanently delete the project and all of its data."
	>
		<template #header="{ title, description, titleId, descriptionId }">
			<div class="flex items-start gap-3 rounded-xl bg-destructive/10 p-4">
				<div class="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-fg" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5">
						<path d="M12 9v4m0 4h.01M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />
					</svg>
				</div>
				<div class="space-y-1">
					<h2 :id="titleId" class="font-semibold tracking-tight text-canvas-fg">{{ title }}</h2>
					<p :id="descriptionId" class="text-sm text-muted-fg">{{ description }}</p>
				</div>
			</div>
		</template>
		<p class="text-sm text-muted-fg">There is no undo. Type the project name to confirm.</p>
		<input
			class="mt-3 h-10 w-full rounded-full border border-border bg-canvas px-4 text-sm"
			placeholder="my-project"
		/>
		<template #footer>
			<DomButton variant="secondary" data-close @click="open = false">Cancel</DomButton>
			<DomButton variant="danger" data-close @click="open = false">Delete</DomButton>
		</template>
	</DomDialog>
</template>
