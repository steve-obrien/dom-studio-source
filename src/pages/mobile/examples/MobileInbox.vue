<script setup>
import { computed, nextTick, ref } from 'vue';
import { DomAppBottomNav, DomAppShell, DomBottomSheet, DomButton, DomSwipeActions, DomTextInput, DomTextareaComposer } from '@getdom/studio/vue';

const tab = ref('inbox');
const query = ref('');
const sheetOpen = ref(false);
const selectedId = ref(null);
const snapPoint = ref(0.7);
const announcement = ref('');
const undoAction = ref(null);
const heading = ref(null);
const sheet = ref(null);
const composer = ref(null);
const replyEnd = ref(null);
const drafts = ref({});
const messages = ref([
	{ id: 'mara', name: 'Mara Chen', initials: 'MC', time: '10:42', subject: 'A quieter home for our projects', preview: 'The updated layouts are ready for a look.', unread: true, archived: false, deleted: false, paragraphs: ['Hey Alex,', 'I’ve put the updated layouts together. The project overview has a little more breathing room, and the next action stays close to the work.', 'Could you take a look at the activity section? I’d like to keep the useful updates visible without turning it into another inbox.', 'If it feels right, I’ll prepare the remaining screens this afternoon.', 'Thanks, Mara'], replies: [] },
	{ id: 'leo', name: 'Leo Martinez', initials: 'LM', time: '09:18', subject: 'Thursday, coffee and a catch-up?', preview: 'There’s a new place just around the corner.', unread: true, archived: false, deleted: false, paragraphs: ['Morning Alex,', 'Are you around on Thursday? There’s a new coffee place near the studio and I thought we could catch up before the planning session.', 'I’m free from 10:30. No agenda, just a proper conversation.', 'Leo'], replies: [] },
	{ id: 'nina', name: 'Nina Patel', initials: 'NP', time: 'Yesterday', subject: 'Notes from the customer sessions', preview: 'Three small changes came up in every session.', unread: true, archived: false, deleted: false, paragraphs: ['Hi Alex,', 'I’ve written up the customer sessions. Three things came up repeatedly: clearer project names, a quicker way to find recent work, and fewer steps to change a due date.', 'The encouraging part is that people found the main workflow easy to follow. These are small improvements we can make without changing the structure.', 'Let’s choose one to try this week.', 'Nina'], replies: [] },
	{ id: 'owen', name: 'Owen Brooks', initials: 'OB', time: 'Yesterday', subject: 'The studio keys', preview: 'I’ve left the spare set with reception.', unread: false, archived: false, deleted: false, paragraphs: ['Hi Alex,', 'The spare keys are with reception, in an envelope with your name on it. They’re open until six.', 'See you tomorrow, Owen'], replies: [] },
	{ id: 'aya', name: 'Aya Wilson', initials: 'AW', time: 'Monday', subject: 'A few photographs from Friday', preview: 'That last bit of afternoon light was worth the wait.', unread: false, archived: false, deleted: false, paragraphs: ['Hi Alex,', 'I’ve picked out a few photographs from Friday. That last bit of afternoon light was worth waiting for.', 'I’ll bring the contact sheet along next week so we can choose the final set together.', 'Aya'], replies: [] },
	{ id: 'sam', name: 'Sam Taylor', initials: 'ST', time: 'Monday', subject: 'Workshop follow-up', preview: 'A short list of things we agreed to try.', unread: false, archived: false, deleted: false, paragraphs: ['Hi Alex,', 'Here’s the short version of the workshop: start with the existing workflow, make the next action obvious, and test the changes with a small group first.', 'I’ve booked a room for our follow-up next Tuesday.', 'Sam'], replies: [] },
]);

const icons = {
	archive: 'M4 4h16v4H4zM6 8v12h12V8M10 12h4',
	mail: 'M4 5h16v14H4zM4 6l8 6 8-6',
	delete: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5',
};
const selected = computed(() => messages.value.find((message) => message.id === selectedId.value));
const unreadCount = computed(() => messages.value.filter((message) => message.unread && !message.archived && !message.deleted).length);
const visibleMessages = computed(() => messages.value.filter((message) => !message.deleted && message.archived === (tab.value === 'archive') && `${message.name} ${message.subject} ${message.preview}`.toLowerCase().includes(query.value.trim().toLowerCase())));
const navItems = computed(() => [
	{ value: 'inbox', label: 'Inbox', badge: unreadCount.value || undefined, icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="${icons.mail}" stroke-linejoin="round" /></svg>` },
	{ value: 'archive', label: 'Archive', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="${icons.archive}" stroke-linejoin="round" /></svg>` },
]);

/** Supplies a reversible full-swipe read shortcut for the leading edge. */
function startActions(message) {
	return [{ value: 'read', label: message.unread ? 'Read' : 'Unread', icon: icons.mail, fullSwipe: true }];
}

/** Supplies archive/restore shortcuts while keeping deletion behind a button. */
function endActions(message) {
	return [
		{ value: 'archive', label: message.archived ? 'Restore' : 'Archive', icon: icons.archive, variant: 'success', fullSwipe: true },
		{ value: 'delete', label: 'Delete', icon: icons.delete, variant: 'danger' },
	];
}

/** Opens a message at the reading height and preserves its unsent reply draft. */
function openMessage(message) {
	selectedId.value = message.id;
	message.unread = false;
	snapPoint.value = 0.7;
	sheetOpen.value = true;
}

/** Applies a local demo mutation and retains a one-step undo snapshot. */
async function act(message, { action }) {
	undoAction.value = { id: message.id, unread: message.unread, archived: message.archived, deleted: message.deleted };
	if (action.value === 'read') message.unread = !message.unread;
	if (action.value === 'archive') message.archived = !message.archived;
	if (action.value === 'delete') message.deleted = true;
	announcement.value = action.value === 'read' ? `Marked as ${message.unread ? 'unread' : 'read'}.` : action.value === 'delete' ? 'Message deleted.' : message.archived ? 'Message archived.' : 'Message moved to inbox.';
	await nextTick();
	if (action.value !== 'read') heading.value?.focus({ preventScroll: true });
}

/** Restores the last changed message, including its original read state. */
function undo() {
	const previous = undoAction.value;
	const message = messages.value.find((item) => item.id === previous?.id);
	if (!message) return;
	Object.assign(message, previous);
	undoAction.value = null;
	announcement.value = 'Change undone.';
}

/** Adds a reply to this local preview, without making any network request. */
async function addReply(value) {
	if (!selected.value || !value.trim()) return;
	selected.value.replies.push(value.trim());
	drafts.value[selected.value.id] = '';
	announcement.value = 'Reply added to this preview.';
	sheet.value?.expand();
	await nextTick();
	composer.value?.focus();
	replyEnd.value?.scrollIntoView({ block: 'nearest' });
}
</script>

<template>
	<DomAppShell hide-bottom-on-keyboard>
		<template #top>
			<header class="border-b border-border bg-canvas px-5 pb-4 pt-5">
				<div class="flex items-center justify-between gap-3">
					<p class="text-xs font-semibold tracking-widest text-muted-fg uppercase">Studio Mail</p>
					<span class="grid size-9 place-items-center rounded-full bg-secondary text-xs font-semibold text-canvas-fg" aria-label="Alex Morgan">AM</span>
				</div>
				<div class="mt-4 flex items-baseline justify-between gap-3">
					<h1 ref="heading" tabindex="-1" class="text-3xl font-semibold tracking-tight outline-none">{{ tab === 'inbox' ? 'Inbox' : 'Archive' }}</h1>
					<span class="text-xs text-muted-fg">{{ tab === 'inbox' ? `${unreadCount} unread` : `${visibleMessages.length} messages` }}</span>
				</div>
				<div class="mt-4"><DomTextInput v-model="query" type="search" chrome="none" placeholder="Search messages" aria-label="Search messages" /></div>
			</header>
		</template>
		<div class="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-3 text-xs text-muted-fg"><span>{{ tab === 'inbox' ? 'Your conversations' : 'Saved for later' }}</span><span>Swipe for actions</span></div>
		<div v-if="visibleMessages.length" class="divide-y divide-border">
			<DomSwipeActions v-for="message in visibleMessages" :key="message.id" :label="message.subject" :start-actions="startActions(message)" :end-actions="endActions(message)" full-swipe group="mobile-inbox" @action="act(message, $event)">
				<button type="button" :data-message-id="message.id" class="flex min-h-28 w-full gap-3 px-4 py-4 text-start hover:bg-secondary/30 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring" @click="openMessage(message)">
					<span class="relative mt-0.5 grid size-10 shrink-0 place-items-center rounded-full text-xs font-semibold" :class="message.unread ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-fg'">{{ message.initials }}<span v-if="message.unread" class="absolute -start-1 top-0 size-2 rounded-full bg-primary ring-2 ring-canvas" aria-label="Unread"></span></span>
					<span class="block min-w-0 flex-1">
						<span class="flex items-baseline justify-between gap-2"><span class="truncate text-sm font-semibold">{{ message.name }}</span><span class="shrink-0 text-[11px] text-muted-fg">{{ message.time }}</span></span>
						<span class="mt-1 block truncate text-sm" :class="message.unread ? 'font-semibold text-canvas-fg' : 'font-medium text-canvas-fg'">{{ message.subject }}</span>
						<span class="mt-1 block line-clamp-2 text-xs leading-5 text-muted-fg">{{ message.preview }}</span>
					</span>
				</button>
			</DomSwipeActions>
		</div>
		<div v-else class="grid min-h-56 place-items-center p-8 text-center"><div><p class="text-base font-semibold">{{ query ? 'No matching messages' : 'All clear' }}</p><p class="mt-2 text-sm text-muted-fg">{{ query ? 'Try a name or a few words from the subject.' : tab === 'archive' ? 'Archived conversations will appear here.' : 'Your inbox is clear. Enjoy the quiet.' }}</p></div></div>
		<template #bottom>
			<div v-if="announcement" class="flex min-h-12 items-center justify-between gap-3 border-t border-border bg-secondary px-5 py-2"><p role="status" class="text-xs text-canvas-fg">{{ announcement }}</p><button v-if="undoAction" type="button" class="min-h-11 px-2 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-ring" @click="undo">Undo</button></div>
			<DomAppBottomNav v-model="tab" :items="navItems" />
		</template>
		<template #overlay>
			<DomBottomSheet ref="sheet" v-model="sheetOpen" v-model:snap-point="snapPoint" :title="selected?.subject || 'Message'" :snap-points="[0, 0.4, 0.7, 0.95]" :initial-snap-point="0.7">
				<template v-if="selected" #header><div><p class="truncate text-sm font-semibold">{{ selected.name }}</p><p class="mt-0.5 text-xs text-muted-fg">To you · {{ selected.time }}</p></div></template>
				<article v-if="selected" class="space-y-4 pb-3">
					<h2 class="text-xl font-semibold leading-snug tracking-tight">{{ selected.subject }}</h2>
					<p v-for="(paragraph, index) in selected.paragraphs" :key="index" class="text-sm leading-7 text-muted-fg">{{ paragraph }}</p>
					<div v-for="(reply, index) in selected.replies" :key="index" class="rounded-2xl bg-primary/8 p-4"><p class="mb-2 text-xs font-semibold text-primary">You · Just now</p><p class="whitespace-pre-wrap text-sm leading-6">{{ reply }}</p></div>
					<p v-if="selected.replies.length" ref="replyEnd" role="status" class="text-xs text-muted-fg">Reply added to this preview.</p>
				</article>
				<template v-if="selected" #footer>
					<DomTextareaComposer ref="composer" v-model="drafts[selected.id]" chrome="none" :aria-label="`Reply to ${selected.name}`" placeholder="Write a reply…" :rows="1" :max-rows="3" :submit-on-enter="false" submit-label="Add reply" @submit="addReply">
						<template #submit="{ submit, disabled }"><DomButton size="sm" :disabled="disabled" class="min-h-11" @click="submit">Reply <span aria-hidden="true">↑</span></DomButton></template>
					</DomTextareaComposer>
				</template>
			</DomBottomSheet>
		</template>
	</DomAppShell>
</template>
