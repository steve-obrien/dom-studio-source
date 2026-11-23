<script setup>
import { computed, ref } from 'vue';
import { DomAiInput, DomButton, DomDialog, DomIconButton, DomMediaBrowser } from '@getdom/studio/vue';

const library = [
	{ ulid: 'asset-release', slug: 'documents', name: 'release-notes-cover.webp' },
	{ ulid: 'asset-assistant', slug: 'ai', name: 'assistant-illustration.webp' },
	{ ulid: 'asset-library', slug: 'files', name: 'media-library-icon.webp' },
].map(({ ulid, slug, name }) => ({
	ulid,
	name,
	type: 'file',
	path: `/${name}`,
	file: { ulid, name, mimeType: 'image/webp', thumbnailUrl: `/media/product-icons-3d/${slug}.webp`, publicUrl: `/media/product-icons-3d/${slug}.webp` },
}));
const draft = ref({ text: '', media: [] });
const pickerOpen = ref(false);
const selectedKeys = ref([]);
const displayMode = ref('grid');
const request = ref(null);
const selected = computed(() => library.filter((item) => selectedKeys.value.includes(item.ulid)));

/** Opens the media picker with the draft's committed selection. */
function openPicker() {
	selectedKeys.value = draft.value.media.map(({ id }) => id);
	pickerOpen.value = true;
}

/** Copies stable media references into the draft after the user confirms. */
function attachSelection() {
	draft.value = { ...draft.value, media: selected.value.map(({ ulid, name }) => ({ id: ulid, name })) };
	pickerOpen.value = false;
}

/**
 * Shows the media references that an application would resolve for a request.
 * @param {import('@getdom/studio/vue').AiInputRequest} value Submitted composer request.
 */
function send(value) {
	request.value = value;
	draft.value = { text: '', media: [] };
}
</script>

<template>
	<div class="w-full max-w-3xl space-y-3">
		<DomAiInput v-model="draft" aria-label="Media library composer prompt" placeholder="Ask about the files you attach…" @submit="send">
			<template #add="{ disabled }">
				<DomIconButton label="Open media library" title="Open media library" aria-haspopup="dialog" :aria-expanded="pickerOpen" :disabled="disabled" @click="openPicker" />
			</template>
		</DomAiInput>
		<DomDialog v-model="pickerOpen" title="Attach from the media library" width="min(94vw, 44rem)" height="min(86dvh, 33rem)">
			<DomMediaBrowser
				v-model:selected-keys="selectedKeys"
				v-model:mode="displayMode"
				:items="library"
				:selectable-types="['file']"
				:inspector="false"
				:can-upload="false"
				:can-create-folder="false"
				:can-rename="false"
				:can-move="false"
			/>
			<template #footer>
				<span class="mr-auto text-sm text-muted-fg" aria-live="polite">{{ selected.length }} selected</span>
				<DomButton size="sm" variant="secondary" data-close>Cancel</DomButton>
				<DomButton size="sm" :disabled="!selected.length && !draft.media.length" @click="attachSelection">Use selection</DomButton>
			</template>
		</DomDialog>
		<div v-if="request" role="status" class="rounded-lg border border-border bg-canvas p-3">
			<p class="text-xs font-semibold text-muted-fg">Submitted request</p>
			<pre class="mt-1 max-h-36 overflow-auto text-xs leading-5">{{ JSON.stringify(request, null, 2) }}</pre>
		</div>
	</div>
</template>
