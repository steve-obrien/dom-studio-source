<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomAvatar,
	DomButton,
	DomDialog,
	DomDrawer,
	DomIconButton,
	DomSelect,
	DomSplitterPanel,
	DomTagCombobox,
	DomTextInput,
	DomTextareaInput,
} from '@getdom/studio/vue';
import MailReader from './MailReader.vue';
import MailThreadList from './MailThreadList.vue';

const workspace = ref(null);
const selectedFolder = ref('inbox');
const selectedFilter = ref('all');
const searchQuery = ref('');
const selectedThreadId = ref('');
const selectedThread = ref(null);
const listWidth = ref(340);
const loadingWorkspace = ref(true);
const loadingThread = ref(false);
const busy = ref(false);
const errorMessage = ref('');
const mobileFoldersOpen = ref(false);
const mobileReading = ref(false);
const composeOpen = ref(false);
const composeError = ref('');
const replyDraft = ref('');
const archiveUndo = ref(null);
const composeDraft = ref(createEmptyComposeDraft());

const folders = computed(() => workspace.value?.folders || []);
const filterOptions = computed(() => workspace.value?.filterOptions || []);
const snoozeOptions = computed(() => workspace.value?.snoozeOptions || []);
const labels = computed(() => workspace.value?.labels || []);
const contacts = computed(() => workspace.value?.contacts || []);
const currentUser = computed(() => workspace.value?.currentUser || {});
const activeFolder = computed(() => folders.value.find((folder) => folder.id === selectedFolder.value) || folders.value[0] || {});
const filteredThreads = computed(() => {
	const query = searchQuery.value.trim().toLowerCase();
	return (workspace.value?.threads || []).filter((thread) => {
		const folderMatches = selectedFolder.value === 'starred'
			? thread.starred
			: thread.folder === selectedFolder.value;
		if (!folderMatches) return false;
		if (selectedFilter.value === 'unread' && !thread.unread) return false;
		if (selectedFilter.value === 'starred' && !thread.starred) return false;
		if (!query) return true;
		const haystack = [
			thread.subject,
			thread.preview,
			...(thread.participants || []).flatMap((participant) => [participant.name, participant.email]),
			...(thread.labels || []).map((label) => label.label),
		].join(' ').toLowerCase();
		return haystack.includes(query);
	});
});
const conversationCountLabel = computed(() => `${filteredThreads.value.length} ${filteredThreads.value.length === 1 ? 'conversation' : 'conversations'}`);

onMounted(loadInitialWorkspace);

/**
 * Creates a clean compose form value.
 *
 * @returns {{ recipients: string[], subject: string, body: string }} Compose form state.
 */
function createEmptyComposeDraft() {
	return {
		recipients: [],
		subject: '',
		body: '',
	};
}

/**
 * Loads the workspace and opens the first available inbox thread.
 *
 * @returns {Promise<void>}
 */
async function loadInitialWorkspace() {
	loadingWorkspace.value = true;
	try {
		await refreshWorkspace();
		const firstThread = filteredThreads.value[0];
		if (firstThread) await openThread(firstThread.id, false);
	} catch (error) {
		showError(error);
	} finally {
		loadingWorkspace.value = false;
	}
}

/**
 * Refreshes dynamic folders and conversation summaries from the API.
 *
 * @returns {Promise<void>}
 */
async function refreshWorkspace() {
	workspace.value = await requestJson('/api/block-demos/mail/workspace');
}

/**
 * Selects a folder and opens its first matching thread on desktop.
 *
 * @param {string} folderId Folder identifier.
 * @returns {Promise<void>}
 */
async function selectFolder(folderId) {
	selectedFolder.value = folderId;
	selectedFilter.value = 'all';
	searchQuery.value = '';
	mobileFoldersOpen.value = false;
	mobileReading.value = false;
	const firstThread = filteredThreads.value[0];
	if (firstThread) {
		await openThread(firstThread.id, false);
		return;
	}
	selectedThreadId.value = '';
	selectedThread.value = null;
}

/**
 * Loads one conversation and persists its read state when necessary.
 *
 * @param {string} threadId Thread identifier.
 * @param {boolean} [showMobileReader=true] Whether compact layouts should reveal the reader.
 * @returns {Promise<void>}
 */
async function openThread(threadId, showMobileReader = true) {
	selectedThreadId.value = threadId;
	mobileReading.value = showMobileReader;
	loadingThread.value = true;
	errorMessage.value = '';
	try {
		const result = await requestJson(`/api/block-demos/mail/threads/${threadId}`);
		selectedThread.value = result.thread;
		replyDraft.value = '';
		if (result.thread.unread) {
			const readResult = await requestJson(`/api/block-demos/mail/threads/${threadId}/state`, {
				method: 'PATCH',
				body: { revision: result.thread.revision, unread: false },
			});
			selectedThread.value = readResult.thread;
			await refreshWorkspace();
		}
	} catch (error) {
		showError(error);
	} finally {
		loadingThread.value = false;
	}
}

/**
 * Updates read, starred, or label state for the selected thread.
 *
 * @param {Record<string, unknown>} patch State changes.
 * @returns {Promise<void>}
 */
async function updateSelectedThread(patch) {
	if (!selectedThread.value || busy.value) return;
	busy.value = true;
	errorMessage.value = '';
	try {
		const result = await requestJson(`/api/block-demos/mail/threads/${selectedThread.value.id}/state`, {
			method: 'PATCH',
			body: { revision: selectedThread.value.revision, ...patch },
		});
		selectedThread.value = result.thread;
		await refreshWorkspace();
	} catch (error) {
		showError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Toggles the selected thread's starred state.
 *
 * @returns {Promise<void>}
 */
async function toggleSelectedStar() {
	await updateSelectedThread({ starred: !selectedThread.value?.starred });
}

/**
 * Marks the selected conversation unread while keeping it open.
 *
 * @returns {Promise<void>}
 */
async function markSelectedUnread() {
	await updateSelectedThread({ unread: true });
}

/**
 * Persists the selected label identifiers for the open conversation.
 *
 * @param {string[]} labelValues Selected label identifiers.
 * @returns {Promise<void>}
 */
async function updateSelectedLabels(labelValues) {
	await updateSelectedThread({ labels: labelValues });
}

/**
 * Archives the selected thread and keeps a server-issued undo token.
 *
 * @returns {Promise<void>}
 */
async function archiveSelectedThread() {
	if (!selectedThread.value || busy.value) return;
	busy.value = true;
	errorMessage.value = '';
	try {
		const archivedSubject = selectedThread.value.subject;
		const result = await requestJson(`/api/block-demos/mail/threads/${selectedThread.value.id}/archive`, {
			method: 'POST',
			body: { revision: selectedThread.value.revision },
		});
		archiveUndo.value = {
			threadId: result.thread.id,
			undoToken: result.undoToken,
			subject: archivedSubject,
		};
		await refreshWorkspace();
		mobileReading.value = false;
		await selectFirstVisibleThread();
	} catch (error) {
		showError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Restores the most recently archived thread through its one-use token.
 *
 * @returns {Promise<void>}
 */
async function undoArchive() {
	if (!archiveUndo.value || busy.value) return;
	busy.value = true;
	try {
		const undo = archiveUndo.value;
		const result = await requestJson(`/api/block-demos/mail/threads/${undo.threadId}/restore`, {
			method: 'POST',
			body: { undoToken: undo.undoToken },
		});
		archiveUndo.value = null;
		selectedFolder.value = result.thread.folder;
		await refreshWorkspace();
		await openThread(result.thread.id);
	} catch (error) {
		showError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Snoozes the selected thread and opens the next visible conversation.
 *
 * @param {string} schedule Snooze schedule identifier.
 * @returns {Promise<void>}
 */
async function snoozeSelectedThread(schedule) {
	if (!selectedThread.value || busy.value) return;
	busy.value = true;
	errorMessage.value = '';
	try {
		await requestJson(`/api/block-demos/mail/threads/${selectedThread.value.id}/snooze`, {
			method: 'POST',
			body: { revision: selectedThread.value.revision, schedule },
		});
		await refreshWorkspace();
		mobileReading.value = false;
		await selectFirstVisibleThread();
	} catch (error) {
		showError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Sends the current reply draft and refreshes the ordered thread list.
 *
 * @returns {Promise<void>}
 */
async function sendReply() {
	if (!selectedThread.value || !replyDraft.value.trim() || busy.value) return;
	busy.value = true;
	errorMessage.value = '';
	try {
		const result = await requestJson(`/api/block-demos/mail/threads/${selectedThread.value.id}/reply`, {
			method: 'POST',
			body: { revision: selectedThread.value.revision, body: replyDraft.value },
		});
		selectedThread.value = result.thread;
		replyDraft.value = '';
		await refreshWorkspace();
	} catch (error) {
		showError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Opens the compose dialog with a fresh form.
 *
 * @returns {void}
 */
function startCompose() {
	composeDraft.value = createEmptyComposeDraft();
	composeError.value = '';
	composeOpen.value = true;
}

/**
 * Sends or saves the compose form through the mail API.
 *
 * @param {'send'|'draft'} action Compose action.
 * @returns {Promise<void>}
 */
async function submitCompose(action) {
	if (busy.value) return;
	busy.value = true;
	composeError.value = '';
	try {
		const result = await requestJson('/api/block-demos/mail/compose', {
			method: 'POST',
			body: { ...composeDraft.value, action },
		});
		composeOpen.value = false;
		selectedFolder.value = result.thread.folder;
		await refreshWorkspace();
		await openThread(result.thread.id, true);
	} catch (error) {
		composeError.value = error instanceof Error ? error.message : 'Unable to save this message.';
	} finally {
		busy.value = false;
	}
}

/**
 * Opens the first thread remaining in the current list.
 *
 * @returns {Promise<void>}
 */
async function selectFirstVisibleThread() {
	const firstThread = filteredThreads.value[0];
	if (firstThread) {
		await openThread(firstThread.id, false);
		return;
	}
	selectedThreadId.value = '';
	selectedThread.value = null;
}

/**
 * Stores and exposes an API or network error to the operator.
 *
 * @param {unknown} error Error value.
 * @returns {void}
 */
function showError(error) {
	errorMessage.value = error instanceof Error ? error.message : 'The mail workspace could not complete that action.';
}

/**
 * Sends a JSON API request and converts non-success responses into errors.
 *
 * @param {string} url API URL.
 * @param {{ method?: string, body?: Record<string, unknown> }} [options] Request options.
 * @returns {Promise<any>} Parsed response payload.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		method: options.method || 'GET',
		headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const payload = await response.json().catch(() => ({}));
	if (!response.ok || payload.error) throw new Error(payload.error || `Request failed with status ${response.status}.`);
	return payload;
}
</script>

<template>
	<div class="relative h-dvh min-h-[32rem] w-full overflow-hidden bg-canvas text-canvas-fg">
		<div class="hidden h-full lg:flex">
			<aside class="flex w-52 shrink-0 flex-col border-r border-border bg-secondary/30 px-3 py-4">
				<div class="flex items-center gap-2 px-2">
					<DomAvatar name="Tempo Mail" initials="TM" size="sm" shape="rounded" />
					<div>
						<p class="text-sm font-semibold tracking-tight">Tempo Mail</p>
						<p class="text-[11px] text-muted-fg">Shared workspace</p>
					</div>
				</div>

				<DomButton class="mt-5 w-full justify-center" @click="startCompose">Compose</DomButton>

				<nav class="mt-5 space-y-0.5" aria-label="Mail folders">
					<button
						v-for="folder in folders"
						:key="folder.id"
						type="button"
						class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						:class="selectedFolder === folder.id ? 'bg-canvas font-semibold text-canvas-fg shadow-sm ring-1 ring-border' : 'text-muted-fg'"
						@click="selectFolder(folder.id)"
					>
						<span>{{ folder.label }}</span>
						<span v-if="folder.count" class="text-xs tabular-nums" :class="selectedFolder === folder.id ? 'text-canvas-fg' : 'text-muted-fg'">{{ folder.count }}</span>
					</button>
				</nav>

				<div class="mt-auto border-t border-border pt-4">
					<div class="flex items-center gap-2 px-2">
						<DomAvatar :name="currentUser.name" :initials="currentUser.initials" size="sm" />
						<div class="min-w-0">
							<p class="truncate text-sm font-medium">{{ currentUser.name }}</p>
							<p class="truncate text-[11px] text-muted-fg">{{ currentUser.email }}</p>
						</div>
					</div>
				</div>
			</aside>

			<DomSplitterPanel
				v-model:start-size="listWidth"
				class="min-w-0 flex-1"
				:min-start="290"
				:min-main="430"
				:handle-size="6"
				handle-class="border-r border-border bg-canvas transition hover:bg-primary/10 focus-visible:bg-primary/10"
			>
				<template #start>
					<section class="flex h-full min-h-0 flex-col border-r border-border">
						<header class="shrink-0 border-b border-border px-4 pb-3 pt-4">
							<div class="flex items-end justify-between gap-3">
								<div>
									<p class="text-xs font-medium uppercase tracking-[0.16em] text-muted-fg">{{ activeFolder.label }}</p>
									<h1 class="mt-1 text-xl font-semibold tracking-tight">{{ conversationCountLabel }}</h1>
								</div>
								<DomSelect
									v-model="selectedFilter"
									:options="filterOptions"
									chrome="none"
									width="min-w-[15rem]"
									class="w-32"
								/>
							</div>
							<DomTextInput
								v-model="searchQuery"
								placeholder="Search mail"
								chrome="none"
								class="mt-3"
							/>
						</header>
						<MailThreadList
							:threads="filteredThreads"
							:selected-id="selectedThreadId"
							:loading="loadingWorkspace"
							class="min-h-0 flex-1"
							@select="openThread"
						/>
					</section>
				</template>

				<MailReader
					v-model="replyDraft"
					:thread="selectedThread"
					:labels="labels"
					:snooze-options="snoozeOptions"
					:loading="loadingThread"
					:busy="busy"
					@toggle-star="toggleSelectedStar"
					@mark-unread="markSelectedUnread"
					@archive="archiveSelectedThread"
					@labels="updateSelectedLabels"
					@snooze="snoozeSelectedThread"
					@reply="sendReply"
				/>
			</DomSplitterPanel>
		</div>

		<div class="flex h-full flex-col lg:hidden">
			<header class="flex h-14 shrink-0 items-center justify-between border-b border-border px-3">
				<div class="flex min-w-0 items-center gap-1.5">
					<DomIconButton label="Open folders" icon="M4 7h16M4 12h16M4 17h16" size="sm" @click="mobileFoldersOpen = true" />
					<div class="min-w-0">
						<p class="truncate text-sm font-semibold">{{ activeFolder.label || 'Tempo Mail' }}</p>
						<p class="text-[11px] text-muted-fg">{{ conversationCountLabel }}</p>
					</div>
				</div>
				<DomIconButton label="Compose message" icon="M5 19h4l10-10-4-4L5 15v4Zm9-13 4 4" variant="primary" size="sm" @click="startCompose" />
			</header>

			<section v-if="!mobileReading" class="flex min-h-0 flex-1 flex-col">
				<div class="shrink-0 space-y-2 border-b border-border p-3">
					<DomTextInput v-model="searchQuery" placeholder="Search mail" chrome="none" />
					<DomSelect
						v-model="selectedFilter"
						:options="filterOptions"
						chrome="none"
						width="min-w-[16rem]"
					/>
				</div>
				<MailThreadList
					:threads="filteredThreads"
					:selected-id="selectedThreadId"
					:loading="loadingWorkspace"
					class="min-h-0 flex-1"
					@select="openThread"
				/>
			</section>

			<MailReader
				v-else
				v-model="replyDraft"
				:thread="selectedThread"
				:labels="labels"
				:snooze-options="snoozeOptions"
				:loading="loadingThread"
				:busy="busy"
				show-back
				class="min-h-0 flex-1"
				@back="mobileReading = false"
				@toggle-star="toggleSelectedStar"
				@mark-unread="markSelectedUnread"
				@archive="archiveSelectedThread"
				@labels="updateSelectedLabels"
				@snooze="snoozeSelectedThread"
				@reply="sendReply"
			/>
		</div>

		<div v-if="errorMessage || archiveUndo" class="pointer-events-none absolute inset-x-3 bottom-3 z-30 flex justify-center">
			<DomAlert
				v-if="errorMessage"
				tone="danger"
				variant="toast"
				title="Action failed"
				:description="errorMessage"
				dismissible
				class="pointer-events-auto w-full max-w-lg"
				@dismiss="errorMessage = ''"
			/>
			<DomAlert
				v-else-if="archiveUndo"
				tone="success"
				variant="toast"
				title="Conversation archived"
				:description="archiveUndo.subject"
				class="pointer-events-auto w-full max-w-lg"
			>
				<template #actions>
					<DomButton variant="secondary" size="sm" :loading="busy" @click="undoArchive">Undo</DomButton>
				</template>
			</DomAlert>
		</div>

		<DomDrawer v-model="mobileFoldersOpen" side="left" title="Tempo Mail" width="min(20rem, 88vw)">
			<div class="p-4">
				<DomButton class="w-full justify-center" @click="startCompose">Compose</DomButton>
				<nav class="mt-4 space-y-1" aria-label="Mail folders">
					<button
						v-for="folder in folders"
						:key="folder.id"
						type="button"
						class="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm transition hover:bg-secondary"
						:class="selectedFolder === folder.id ? 'bg-secondary font-semibold text-canvas-fg' : 'text-muted-fg'"
						@click="selectFolder(folder.id)"
					>
						<span>{{ folder.label }}</span>
						<span v-if="folder.count" class="text-xs tabular-nums">{{ folder.count }}</span>
					</button>
				</nav>
			</div>
			<template #footer>
				<div class="flex items-center gap-2">
					<DomAvatar :name="currentUser.name" :initials="currentUser.initials" size="sm" />
					<div class="min-w-0">
						<p class="truncate text-sm font-medium">{{ currentUser.name }}</p>
						<p class="truncate text-xs text-muted-fg">{{ currentUser.email }}</p>
					</div>
				</div>
			</template>
		</DomDrawer>

		<DomDialog
			v-model="composeOpen"
			title="New message"
			description="Send a conversation now or keep it in Drafts."
			size="lg"
		>
			<div class="space-y-4">
				<DomAlert
					v-if="composeError"
					tone="danger"
					title="Message not saved"
					:description="composeError"
				/>
				<DomTagCombobox
					v-model="composeDraft.recipients"
					:options="contacts"
					allow-custom
					label="To"
					placeholder="Add recipients"
					:token-separators="[',', ' ']"
				/>
				<DomTextInput v-model="composeDraft.subject" label="Subject" placeholder="What is this about?" />
				<DomTextareaInput v-model="composeDraft.body" label="Message" placeholder="Write your message…" :rows="8" />
			</div>
			<template #footer>
				<DomButton variant="ghost" @click="composeOpen = false">Cancel</DomButton>
				<DomButton variant="secondary" :loading="busy" @click="submitCompose('draft')">Save draft</DomButton>
				<DomButton :loading="busy" @click="submitCompose('send')">Send message</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
