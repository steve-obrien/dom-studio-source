<script setup>
import { shallowRef, ref } from 'vue';
import DomButton from '../../../components/button/DomButton.vue';
import DomBadge from '../../../visual/badge/DomBadge.vue';
import DomWysiwyg from '../../../forms/wysiwyg/DomWysiwyg.vue';

const content = ref({
	type: 'doc',
	content: [
		{
			type: 'heading',
			attrs: { level: 2 },
			content: [{ type: 'text', text: 'Review notes' }],
		},
		{
			type: 'paragraph',
			content: [{ type: 'text', text: 'Mention the right reviewer when a section needs input.' }],
		},
	],
});
const mentionUsers = [
	{ id: 'mia', name: 'Mia Chen', role: 'Product lead' },
	{ id: 'sam', name: 'Sam Rivera', role: 'Design reviewer' },
	{ id: 'noor', name: 'Noor Patel', role: 'Engineering' },
];
const mentionEditor = shallowRef(null);
const mentionMenuOpen = ref(false);
const lastToolAction = ref('');
const customTools = [
	{
		id: 'mention-user',
		label: 'Mention user',
		icon: 'M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0ZM4 21a8 8 0 0 1 16 0M19 8v6M22 11h-6',
		variant: 'secondary',
		command: openMentionMenu,
	},
	{
		id: 'insert-review-note',
		label: 'Insert review note',
		icon: 'M5 5h14v10H8l-3 3V5Zm4 4h6M9 12h4',
		command: insertReviewNote,
	},
];

/**
 * Opens the app-owned user picker for a custom toolbar command.
 *
 * @param {{ editor?: unknown }} context Custom toolbar command context.
 * @returns {void}
 */
function openMentionMenu(context) {
	mentionEditor.value = context.editor || null;
	mentionMenuOpen.value = true;
}

/**
 * Inserts a review note at the current editor selection.
 *
 * @param {{ editor?: unknown }} context Custom toolbar command context.
 * @returns {void}
 */
function insertReviewNote(context) {
	context.editor?.chain?.().focus().insertContent('Needs review before publishing.').run();
}

/**
 * Inserts a selected user mention into the active editor.
 *
 * @param {{ id: string, name: string }} user Selected user record.
 * @returns {void}
 */
function insertMention(user) {
	mentionEditor.value?.chain?.().focus().insertContent(`@${user.name} `).run();
	mentionMenuOpen.value = false;
}

/**
 * Records the latest custom toolbar event emitted by DomWysiwyg.
 *
 * @param {{ tool?: { label?: string } }} payload Tool event payload.
 * @returns {void}
 */
function handleToolAction(payload) {
	lastToolAction.value = payload.tool?.label || '';
}
</script>

<template>
	<div class="grid w-full min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
		<div class="min-w-0 space-y-3">
			<DomWysiwyg
				v-model="content"
				label="Notes"
				name="notes"
				:custom-tools="customTools"
				min-height="14rem"
				@tool-action="handleToolAction"
			/>

			<div v-if="mentionMenuOpen" class="skin-popover overflow-hidden rounded-lg border border-border p-1 shadow-lg">
				<button
					v-for="user in mentionUsers"
					:key="user.id"
					type="button"
					class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition hover:bg-secondary"
					@mousedown.prevent
					@click="insertMention(user)"
				>
					<span class="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-fg">
						{{ user.name.slice(0, 2).toUpperCase() }}
					</span>
					<span class="min-w-0">
						<span class="block truncate font-medium text-canvas-fg">{{ user.name }}</span>
						<span class="block truncate text-xs text-muted-fg">{{ user.role }}</span>
					</span>
				</button>
			</div>
		</div>

		<div class="rounded-lg border border-border bg-canvas p-4 text-sm leading-6 text-muted-fg">
			<div class="flex items-center justify-between gap-2">
				<p class="font-semibold text-canvas-fg">Custom tools</p>
				<DomBadge label="App-owned" size="sm" tone="info" />
			</div>
			<p class="mt-3">
				Toolbar tools are plain records. A command gets the editor instance and helper methods; the owner can still listen to <code class="text-canvas-fg">tool-action</code>.
			</p>
			<p class="mt-3 text-xs">
				Last tool: <span class="font-medium text-canvas-fg">{{ lastToolAction || 'None yet' }}</span>
			</p>
			<DomButton v-if="mentionMenuOpen" class="mt-4 w-full justify-center" size="sm" variant="secondary" @click="mentionMenuOpen = false">
				Close user menu
			</DomButton>
		</div>
	</div>
</template>
