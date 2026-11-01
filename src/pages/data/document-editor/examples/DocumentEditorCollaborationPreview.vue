<script setup>
import { onMounted, onUnmounted, ref, shallowRef } from 'vue';
import * as Y from 'yjs';
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from 'y-protocols/awareness';
import DomButton from '../../../components/button/DomButton.vue';
import DomDocumentEditor from '../DomDocumentEditor.vue';

const peers = shallowRef([]);
const editors = [];
const disconnectors = [];
const ready = ref(false);
const editAdded = ref(false);
const heading = 'Team launch plan';
const originalText = 'Make the first draft together.';
const sampleDocument = {
	type: 'doc',
	content: [
		{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: heading }] },
		{ type: 'paragraph', content: [{ type: 'text', text: originalText }] },
		{ type: 'paragraph', content: [{ type: 'text', text: 'Share the launch notes with the team.' }] },
	],
};

onMounted(createPreview);
onUnmounted(destroyPreview);

/**
 * Creates two independent Yjs peers connected only inside this preview.
 * No preview content or participant presence reaches the shared demo room.
 *
 * @returns {void}
 */
function createPreview() {
	const theme = getComputedStyle(document.documentElement);
	const you = createPeer('you', 'You', theme.getPropertyValue('--primary').trim());
	const alex = createPeer('alex', 'Alex', theme.getPropertyValue('--success').trim());
	disconnectors.push(connectPeer(you, alex), connectPeer(alex, you));
	peers.value = [you, alex];
}

/**
 * Converts a semantic theme color to the hex format required by Yjs cursors.
 * The canvas resolves modern CSS colors, including the theme's OKLCH values.
 *
 * @param {string} color Resolved CSS color.
 * @returns {string} Opaque six-digit hex color with readable white labels.
 */
function cursorColor(color) {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = 1;
	const context = canvas.getContext('2d');
	context.fillStyle = color;
	context.fillRect(0, 0, 1, 1);
	const channels = context.getImageData(0, 0, 1, 1).data;
	// A maximum channel of 118 keeps the editor's white cursor labels above 4.5:1.
	const scale = Math.min(1, 118 / Math.max(...channels.slice(0, 3)));
	let hex = '#';
	for (const channel of channels.slice(0, 3)) hex += Math.round(channel * scale).toString(16).padStart(2, '0');
	return hex;
}

/**
 * Builds the document and awareness adapter consumed by DomDocumentEditor.
 *
 * @param {string} id Preview participant identifier.
 * @param {string} name Visible cursor label.
 * @param {string} color Resolved theme color for the participant.
 * @returns {Record<string, unknown>} Independent collaboration adapter.
 */
function createPeer(id, name, color) {
	const document = new Y.Doc();
	return {
		document,
		provider: { awareness: new Awareness(document) },
		field: 'body',
		user: { id, name, color: cursorColor(color), type: 'human' },
	};
}

/**
 * Relays document and awareness updates between two local peers. The origin
 * marker prevents echoes while retaining normal Yjs merge behavior.
 *
 * @param {Record<string, unknown>} source Originating collaboration adapter.
 * @param {Record<string, unknown>} target Receiving collaboration adapter.
 * @returns {Function} Disconnects both update listeners before disposal.
 */
function connectPeer(source, target) {
	/**
	 * Applies a local document change to the other editor.
	 *
	 * @param {Uint8Array} update Encoded Yjs update.
	 * @param {unknown} origin Transaction origin.
	 * @returns {void}
	 */
	function relayDocument(update, origin) {
		if (origin === 'preview-relay') return;
		Y.applyUpdate(target.document, update, 'preview-relay');
	}

	/**
	 * Shares cursor, selection, and participant changes with the other view.
	 *
	 * @param {{ added: number[], updated: number[], removed: number[] }} changes Changed clients.
	 * @param {unknown} origin Awareness update origin.
	 * @returns {void}
	 */
	function relayAwareness({ added, updated, removed }, origin) {
		if (origin === 'preview-relay') return;
		const update = encodeAwarenessUpdate(source.provider.awareness, [...added, ...updated, ...removed]);
		applyAwarenessUpdate(target.provider.awareness, update, 'preview-relay');
	}

	source.document.on('update', relayDocument);
	source.provider.awareness.on('update', relayAwareness);

	/**
	 * Detaches the local transport before either peer is destroyed.
	 *
	 * @returns {void}
	 */
	return function disconnectPeer() {
		source.document.off('update', relayDocument);
		source.provider.awareness.off('update', relayAwareness);
	};
}

/**
 * Waits for both editor runtimes before seeding the shared sample once.
 *
 * @param {number} index Index of the mounted preview editor.
 * @param {{ editor: Record<string, unknown> }} payload Editor ready event.
 * @returns {void}
 */
function handleReady(index, { editor }) {
	editors[index] = editor;
	if (!editors[0] || !editors[1]) return;
	ready.value = true;
	resetPreview();
}

/**
 * Restores the sample and prepares Alex's first paragraph selection. Focus is
 * opt-in so mounting the inline preview never moves focus or scrolls the page.
 *
 * @param {boolean} [focusEditor=false] Whether an explicit action should focus Alex's editor.
 * @returns {void}
 */
function resetPreview(focusEditor = false) {
	if (!ready.value) return;
	editors[0].commands.setContent(sampleDocument);
	const from = editors[1].state.doc.firstChild.nodeSize + 1;
	const selection = editors[1].chain()
		.setTextSelection({ from, to: from + originalText.length });
	if (focusEditor) selection.focus(null, { scrollIntoView: false });
	selection.run();
	editAdded.value = false;
}

/**
 * Adds a sample edit through Alex's editor, letting the Yjs connection update
 * the other view exactly as it does for manual typing in either editor.
 *
 * @returns {void}
 */
function addAlexEdit() {
	if (!ready.value || editAdded.value) return;
	const editor = editors[1];
	editor.chain()
		.insertContentAt(editor.state.doc.content.size, {
			type: 'paragraph',
			content: [{ type: 'text', text: 'I’ll bring the customer feedback to our next review.' }],
		})
		.focus(null, { scrollIntoView: false })
		.run();
	editAdded.value = true;
}

/**
 * Releases awareness timers and Yjs listeners after child editors unmount.
 *
 * @returns {void}
 */
function destroyPreview() {
	for (const disconnect of disconnectors) disconnect();
	for (const peer of peers.value) {
		peer.provider.awareness.destroy();
		peer.document.destroy();
	}
}
</script>

<template>
	<section class="space-y-4" aria-label="Collaboration preview" data-collaboration-preview>
		<div class="flex flex-wrap items-center gap-2">
			<DomButton size="sm" variant="primary" :disabled="!ready || editAdded" @click="addAlexEdit">Try Alex’s edit</DomButton>
			<DomButton size="sm" variant="secondary" :disabled="!ready" @click="resetPreview(true)">Reset preview</DomButton>
			<p v-if="ready" class="basis-full text-xs leading-5 text-muted-fg" role="status">
				{{ editAdded ? 'Alex’s edit appeared in both views. Try typing or selecting text in either editor.' : 'Type or select text in either editor to see the changes and named cursors in the other view.' }}
			</p>
			<p v-else class="basis-full text-xs leading-5 text-muted-fg" role="status">Loading collaboration preview…</p>
		</div>
		<div class="grid gap-4 md:grid-cols-2">
			<div v-for="(peer, index) in peers" :key="peer.user.id" class="min-w-0 overflow-hidden rounded-lg border border-border bg-canvas">
				<div class="flex items-center gap-3 border-b border-border bg-secondary/35 px-4 py-3">
					<span class="grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold text-white" :style="{ backgroundColor: peer.user.color }" aria-hidden="true">
						{{ index === 0 ? 'YO' : 'AL' }}
					</span>
					<div>
						<p class="text-sm font-semibold text-canvas-fg">{{ index === 0 ? 'Your view' : 'Alex’s view' }}</p>
						<p class="text-xs text-muted-fg">{{ index === 0 ? 'Try typing here' : 'Demo participant · editable too' }}</p>
					</div>
				</div>
				<DomDocumentEditor
					:collaboration="peer"
					:title="index === 0 ? 'Your preview document' : 'Alex’s preview document'"
					chrome="none"
					:show-toolbar="false"
					:show-slash-menu="false"
					:show-suggestion-rail="false"
					min-height="16rem"
					@ready="handleReady(index, $event)"
				/>
			</div>
		</div>
		<p class="text-xs leading-5 text-muted-fg">This preview stays in your browser and resets when you reload or leave the page. To collaborate with another person, open this page in a second tab or share its link and use the shared document below.</p>
	</section>
</template>
