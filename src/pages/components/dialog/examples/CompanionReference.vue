<script setup>
import { ref } from 'vue';
import { DomButton, DomDialog, DomIconButton, DomTextInput, DomToggle } from '@getdom/studio/vue';

const open = ref(false);
const referenceOpen = ref(false);
const projectName = ref('Northstar redesign');
const notifications = ref(true);
</script>

<template>
	<DomButton variant="secondary" @click="open = true">Open project settings</DomButton>

	<DomDialog
		v-model="open"
		v-model:companion-open="referenceOpen"
		size="lg"
		companion-width="19rem"
		companion-breakpoint="64rem"
		companion-label="Settings reference"
		title="Project settings"
		description="Change the project identity and notification defaults."
	>
		<template #header="{ title, description, titleId, descriptionId, companionOpen, companionTriggerProps, toggleCompanion }">
			<div class="flex shrink-0 items-start justify-between gap-4">
				<div>
					<h2 :id="titleId" class="text-lg font-semibold tracking-tight text-canvas-fg">{{ title }}</h2>
					<p :id="descriptionId" class="mt-1 text-sm text-muted-fg">{{ description }}</p>
				</div>
				<DomButton
					v-bind="companionTriggerProps"
					size="sm"
					:variant="companionOpen ? 'primary' : 'secondary'"
					@click="toggleCompanion"
				>
					Reference
				</DomButton>
			</div>
		</template>

		<div class="space-y-5">
			<DomTextInput v-model="projectName" label="Project name" />
			<div class="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
				<div>
					<p class="text-sm font-medium text-canvas-fg">Weekly summary</p>
					<p class="mt-1 text-xs text-muted-fg">Send a concise project activity summary every Friday.</p>
				</div>
				<DomToggle v-model="notifications" aria-label="Weekly summary" />
			</div>
		</div>

		<template #footer>
			<DomButton variant="secondary" @click="open = false">Cancel</DomButton>
			<DomButton @click="open = false">Save settings</DomButton>
		</template>

		<template #companion="{ closeCompanion, mode }">
			<section class="flex min-h-0 flex-1 flex-col" :data-mode="mode">
				<header class="flex items-start justify-between gap-3 border-b border-border p-4">
					<div>
						<h3 class="text-sm font-semibold text-canvas-fg">Settings reference</h3>
						<p class="mt-1 text-xs text-muted-fg">Context without a second modal lifecycle</p>
					</div>
					<DomIconButton label="Close reference" size="sm" icon="M6 6l12 12M18 6 6 18" @click="closeCompanion" />
				</header>
				<div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 text-sm leading-relaxed text-muted-fg">
					<div>
						<p class="font-semibold text-canvas-fg">Project names</p>
						<p class="mt-1">Names appear in navigation, notifications and exported reports. Existing links are unaffected.</p>
					</div>
					<div>
						<p class="font-semibold text-canvas-fg">Weekly summaries</p>
						<p class="mt-1">Only members with project access receive the summary. Individual notification preferences still apply.</p>
					</div>
					<div class="rounded-xl border border-border bg-secondary/40 p-3">
						<p class="font-medium text-canvas-fg">Responsive check</p>
						<p class="mt-1 text-xs">This example switches to the covering mode at 64rem to exercise a different breakpoint.</p>
					</div>
				</div>
			</section>
		</template>
	</DomDialog>
</template>
