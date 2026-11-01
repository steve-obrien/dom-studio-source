<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import * as Y from 'yjs';
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from 'y-protocols/awareness';
import DomDocumentEditor from '../../data/document-editor/DomDocumentEditor.vue';
import DomCard from '../../visual/card/DomCard.vue';

/**
 * The real document editor on the homepage. Two simulated teammates share the
 * document through Yjs, exactly as remote people would: Aisha types into the
 * last paragraph and Sam keeps a selection. Nothing leaves the browser.
 */
const sentences = [
	' Admins see the change a week early, and every customer gets a migration call.',
	' We will send a reminder email on the Monday before the switch.',
	' Anyone on an annual plan keeps their current price until renewal.',
];
const content = {
	type: 'doc',
	content: [
		{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Q4 platform launch' }] },
		{ type: 'paragraph', content: [{ type: 'text', text: 'Support will publish a step-by-step guide with screenshots and a short video for each plan.' }] },
		{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Timeline' }] },
		{ type: 'paragraph', content: [{ type: 'text', text: 'We move every workspace to the new billing engine on ' }, { type: 'text', marks: [{ type: 'bold' }], text: '18 November' }, { type: 'text', text: '.' }] },
	],
};

const target = ref(null);
const near = ref(false);
let observer = null;
const you = shallowRef(null);
const people = shallowRef([]);
const disconnectors = [];
let editor = null;
let timer = 0;
let sentence = 0;
let typed = 0;
let deleting = false;

onMounted(() => {
	create();
	observer = new IntersectionObserver(([entry]) => (near.value = entry.isIntersecting));
	observer.observe(target.value);
});
onBeforeUnmount(destroy);
watch(near, schedule);

/**
 * Converts a theme color to the hex the collaboration caret needs, dark enough
 * for its white label.
 *
 * @param {string} color Resolved CSS color.
 * @returns {string} Six-digit hex color.
 */
function cursorColor(color) {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = 1;
	const context = canvas.getContext('2d');
	context.fillStyle = color;
	context.fillRect(0, 0, 1, 1);
	const channels = context.getImageData(0, 0, 1, 1).data;
	const scale = Math.min(1, 118 / Math.max(...channels.slice(0, 3)));
	let hex = '#';
	for (const channel of channels.slice(0, 3)) hex += Math.round(channel * scale).toString(16).padStart(2, '0');
	return hex;
}

/**
 * Creates one participant's Yjs document and awareness.
 *
 * @param {string} id Participant id.
 * @param {string} name Cursor label.
 * @param {string} variable Theme variable for the participant's color.
 * @returns {Record<string, unknown>} Collaboration adapter.
 */
function createPeer(id, name, variable) {
	const color = cursorColor(getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || '#2563eb');
	const doc = new Y.Doc();
	const awareness = new Awareness(doc);
	const user = { id, name, color, type: 'human' };
	awareness.setLocalStateField('user', user);
	return { document: doc, provider: { awareness }, field: 'body', user };
}

/**
 * Relays document and awareness updates one way between two local peers.
 *
 * @param {Record<string, unknown>} source Sending peer.
 * @param {Record<string, unknown>} receiver Receiving peer.
 * @returns {Function} Removes the listeners.
 */
function connect(source, receiver) {
	/** @param {Uint8Array} update @param {unknown} origin */
	function relayDocument(update, origin) {
		if (origin !== 'home-relay') Y.applyUpdate(receiver.document, update, 'home-relay');
	}
	/** @param {{ added: number[], updated: number[], removed: number[] }} changes @param {unknown} origin */
	function relayAwareness({ added, updated, removed }, origin) {
		if (origin === 'home-relay') return;
		applyAwarenessUpdate(receiver.provider.awareness, encodeAwarenessUpdate(source.provider.awareness, [...added, ...updated, ...removed]), 'home-relay');
	}
	source.document.on('update', relayDocument);
	source.provider.awareness.on('update', relayAwareness);
	return () => {
		source.document.off('update', relayDocument);
		source.provider.awareness.off('update', relayAwareness);
	};
}

/** Connects you to two simulated teammates. @returns {void} */
function create() {
	you.value = createPeer('you', 'You', '--chart-1');
	const aisha = createPeer('aisha', 'Aisha', '--chart-2');
	const sam = createPeer('sam', 'Sam', '--chart-4');
	people.value = [aisha, sam];
	for (const peer of people.value) disconnectors.push(connect(you.value, peer), connect(peer, you.value));
}

/**
 * Seeds the shared document once the editor runs, then places Sam's selection.
 *
 * @param {{ editor: Record<string, unknown> }} payload Ready event.
 * @returns {void}
 */
function onReady(payload) {
	editor = payload.editor;
	editor.commands.setContent(content);
	select(people.value[1], 1, 23, 58);
	schedule();
}

/**
 * Returns the text node of one top-level block in a peer's copy of the document.
 *
 * @param {Record<string, unknown>} peer Collaboration adapter.
 * @param {number} block Block index; negative counts from the end.
 * @returns {Y.XmlText|null} The block's first text node.
 */
function blockText(peer, block) {
	const fragment = peer.document.getXmlFragment(peer.field);
	const element = fragment.get(block < 0 ? fragment.length + block : block);
	const text = element instanceof Y.XmlElement ? element.toArray().findLast((child) => child instanceof Y.XmlText) : null;
	return text || null;
}

/**
 * Shows a teammate's cursor or selection inside one block.
 *
 * @param {Record<string, unknown>} peer Collaboration adapter.
 * @param {number} block Block index.
 * @param {number} anchor Start offset.
 * @param {number} head End offset.
 * @returns {void}
 */
function select(peer, block, anchor, head = anchor) {
	const text = blockText(peer, block);
	if (!text) return;
	const position = (index) => Y.relativePositionToJSON(Y.createRelativePositionFromTypeIndex(text, Math.min(index, text.length)));
	peer.provider.awareness.setLocalStateField('cursor', { anchor: position(anchor), head: position(head) });
}

/** Types or deletes one step of Aisha's current sentence. @returns {void} */
function step() {
	const aisha = people.value[0];
	const text = blockText(aisha, -1);
	const phrase = sentences[sentence];
	if (!text) return;
	if (!deleting && typed < phrase.length) {
		text.insert(text.length, phrase[typed]);
		typed += 1;
	} else if (!deleting) {
		deleting = true;
	} else if (typed > 0) {
		const remove = Math.min(typed, Math.max(1, phrase.slice(0, typed).length - phrase.slice(0, typed).trimEnd().lastIndexOf(' ')));
		text.delete(text.length - remove, remove);
		typed -= remove;
	} else {
		deleting = false;
		sentence = (sentence + 1) % sentences.length;
	}
	select(aisha, -1, text.length);
}

/**
 * Runs the typing loop while the editor is visible. Typing pauses after a
 * sentence, deletes faster, and stops for visitors who prefer reduced motion.
 *
 * @returns {void}
 */
function schedule() {
	clearTimeout(timer);
	if (!editor || !near.value) return;
	if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
		select(people.value[0], -1, blockText(people.value[0], -1)?.length ?? 0);
		return;
	}
	const phrase = sentences[sentence];
	const pause = (!deleting && typed === phrase.length) || (deleting && typed === 0);
	timer = setTimeout(() => {
		step();
		schedule();
	}, pause ? 2400 : deleting ? 45 : 55 + Math.random() * 70);
}

/** Stops the loop and releases the Yjs documents. @returns {void} */
function destroy() {
	clearTimeout(timer);
	observer?.disconnect();
	for (const disconnect of disconnectors) disconnect();
	for (const peer of [you.value, ...people.value]) {
		peer?.provider.awareness.destroy();
		peer?.document.destroy();
	}
}
</script>

<template>
	<div ref="target">
		<DomCard
			padding="none"
			class="shadow-xl shadow-canvas-fg/5 focus-within:ring-2 focus-within:ring-ring/30 [&_.dom-document-editor\_\_paper]:m-0! [&_.dom-document-editor\_\_paper]:rounded-none! [&_.dom-document-editor\_\_paper]:border-0! [&_.dom-document-editor\_\_paper]:shadow-none! [&_[data-document-editor-toolbar]]:border-b [&_[data-document-editor-toolbar]]:border-border [&_[data-document-editor-toolbar]]:pb-2"
		>
			<DomDocumentEditor
				v-if="you"
				:collaboration="you"
				:collaborators="people.map((peer) => peer.user)"
				title="Q4 platform launch"
				status="3 editing live"
				chrome="none"
				:show-suggestion-rail="false"
				min-height="24rem"
				@ready="onReady"
			/>
		</DomCard>
	</div>
</template>
