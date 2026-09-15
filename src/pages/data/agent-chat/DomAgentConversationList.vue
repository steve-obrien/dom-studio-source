<script>
export const agentConversationListProps = {
	conversations: {
		type: Array,
		default: () => [],
		_edit: { description: 'Conversation summaries shown in the navigation list.' },
	},
	agents: {
		type: Array,
		default: () => [],
		_edit: { description: 'Agent records used to label each conversation.' },
	},
	activeConversationId: {
		type: String,
		default: '',
		_edit: { description: 'Selected conversation id.' },
	},
	search: {
		type: String,
		default: '',
		_edit: { description: 'Controlled conversation search value.' },
	},
	loading: {
		type: Boolean,
		default: false,
		_edit: { description: 'Show loading rows while conversations are fetched.' },
	},
	title: {
		type: String,
		default: 'Conversations',
		_edit: { description: 'Sidebar heading.' },
	},
	showNewButton: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the built-in new conversation button.' },
	},
	emptyText: {
		type: String,
		default: 'No conversations match this view.',
		_edit: { description: 'Message shown when the filtered list is empty.' },
	},
};
</script>

<script setup>
import { computed, useId } from 'vue';
import DomIconButton from '../../components/icon-button/DomIconButton.vue';
import DomStatusPill from '../../visual/status-pill/DomStatusPill.vue';

defineOptions({
	__doc: {
		nav: { section: 'ai' },
		name: 'Agent conversation list',
		tag: '<DomAgentConversationList>',
		description: 'A reusable AI conversation navigation list with search, agent labels, unread counts, status pills, and active-thread selection.',
		icon: 'M5 6h14M5 12h14M5 18h8',
		events: [
			{ name: 'update:search', payload: 'string', description: 'Fired when the sidebar search changes.' },
			{ name: 'select', payload: 'conversation', description: 'Fired when a conversation row is selected.' },
			{ name: 'new', payload: 'undefined', description: 'Fired when the new conversation action is activated.' },
		],
		slots: [
			{ name: 'actions', payload: '{ conversations }', description: 'Extra controls beside the heading.' },
			{ name: 'conversation', payload: '{ conversation, active, agent }', description: 'Replace a conversation row.' },
			{ name: 'empty', description: 'Custom empty state.' },
		],
	},
});

const props = defineProps(agentConversationListProps);
const emit = defineEmits(['update:search', 'select', 'new']);
const searchId = useId();

const filteredConversations = computed(() => {
	const query = props.search.trim().toLowerCase();
	if (!query) return props.conversations;
	return props.conversations.filter((conversation) => conversationMatchesQuery(conversation, query));
});

/**
 * Emits a search value update.
 *
 * @param {Event} event Native input event.
 * @returns {void}
 */
function updateSearch(event) {
	emit('update:search', event.target.value);
}

/**
 * Emits a conversation selection event.
 *
 * @param {Record<string, unknown>} conversation Conversation summary.
 * @returns {void}
 */
function selectConversation(conversation) {
	emit('select', conversation);
}

/**
 * Emits a new conversation request.
 *
 * @returns {void}
 */
function createConversation() {
	emit('new');
}

/**
 * Checks whether a conversation is currently active.
 *
 * @param {Record<string, unknown>} conversation Conversation summary.
 * @returns {boolean} True when active.
 */
function isActiveConversation(conversation) {
	return conversation.id === props.activeConversationId;
}

/**
 * Finds the agent associated with a conversation.
 *
 * @param {Record<string, unknown>} conversation Conversation summary.
 * @returns {Record<string, unknown>|null} Matching agent.
 */
function agentForConversation(conversation) {
	return props.agents.find((agent) => agent.id === conversation.agentId) || null;
}

/**
 * Returns a fallback title for a conversation.
 *
 * @param {Record<string, unknown>} conversation Conversation summary.
 * @returns {string} Display title.
 */
function conversationTitle(conversation) {
	return conversation.title || 'Untitled conversation';
}

/**
 * Returns summary text for a conversation row.
 *
 * @param {Record<string, unknown>} conversation Conversation summary.
 * @returns {string} Summary text.
 */
function conversationSummary(conversation) {
	return conversation.summary || agentForConversation(conversation)?.role || 'No summary yet';
}

/**
 * Returns a compact label for the agent avatar.
 *
 * @param {Record<string, unknown>} conversation Conversation summary.
 * @returns {string} Initials.
 */
function agentInitials(conversation) {
	const name = agentForConversation(conversation)?.name || 'AI';
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map(firstCharacter)
		.join('')
		.toUpperCase() || 'AI';
}

/**
 * Formats the conversation update time.
 *
 * @param {Record<string, unknown>} conversation Conversation summary.
 * @returns {string} Short date or time label.
 */
function updatedLabel(conversation) {
	if (!conversation.updatedAt) return '';
	const date = new Date(conversation.updatedAt);
	if (Number.isNaN(date.getTime())) return '';
	const today = new Date();
	if (date.toDateString() === today.toDateString()) {
		return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);
	}
	return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

/**
 * Resolves a status pill tone for a conversation.
 *
 * @param {Record<string, unknown>} conversation Conversation summary.
 * @returns {'neutral'|'info'|'success'|'warning'|'danger'} Status tone.
 */
function statusTone(conversation) {
	return {
		streaming: 'info',
		waiting: 'warning',
		error: 'danger',
		complete: 'success',
	}[conversation.status] || 'neutral';
}

/**
 * Checks whether a conversation matches the lowercase search query.
 *
 * @param {Record<string, unknown>} conversation Conversation summary.
 * @param {string} query Lowercase search query.
 * @returns {boolean} True when the row should be visible.
 */
function conversationMatchesQuery(conversation, query) {
	const agent = agentForConversation(conversation);
	return [
		conversation.title,
		conversation.summary,
		conversation.status,
		agent?.name,
		agent?.role,
		...(Array.isArray(conversation.labels) ? conversation.labels : []),
	]
		.filter(Boolean)
		.join(' ')
		.toLowerCase()
		.includes(query);
}

/**
 * Returns the first character from a word.
 *
 * @param {string} value Source word.
 * @returns {string} First character.
 */
function firstCharacter(value) {
	return value.charAt(0);
}
</script>

<template>
	<aside class="flex h-full min-h-0 w-full min-w-0 flex-col bg-canvas text-canvas-fg">
		<header class="shrink-0 border-b border-border bg-secondary/25 p-3">
			<div class="flex items-center justify-between gap-3">
				<h2 class="truncate text-sm font-semibold text-canvas-fg">{{ title }}</h2>
				<div class="flex shrink-0 items-center gap-1">
					<slot name="actions" :conversations="conversations" />
					<DomIconButton
						v-if="showNewButton"
						label="New conversation"
						size="sm"
						variant="secondary"
						icon="M12 5v14M5 12h14"
						@click="createConversation"
					/>
				</div>
			</div>
			<label :for="searchId" class="sr-only">Search conversations</label>
			<div class="mt-3 flex items-center gap-2 rounded-md border border-border bg-canvas px-3 py-2">
				<svg viewBox="0 0 24 24" class="size-4 shrink-0 text-muted-fg" fill="none" aria-hidden="true">
					<path d="M11 5a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm4.5 10.5L20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
				</svg>
				<input
					:id="searchId"
					:value="search"
					type="search"
					placeholder="Search threads"
					class="min-w-0 flex-1 bg-transparent text-sm text-canvas-fg outline-none placeholder:text-muted-fg"
					@input="updateSearch"
				/>
			</div>
		</header>

		<div class="min-h-0 flex-1 overflow-y-auto p-2">
			<div v-if="loading" class="space-y-2">
				<div v-for="index in 5" :key="index" class="h-20 animate-pulse rounded-lg border border-border bg-secondary/35"></div>
			</div>

			<slot v-else-if="!filteredConversations.length" name="empty">
				<div class="grid min-h-40 place-items-center rounded-lg border border-dashed border-border p-4 text-center">
					<p class="text-sm leading-6 text-muted-fg">{{ emptyText }}</p>
				</div>
			</slot>

			<div v-else class="space-y-1">
				<slot
					v-for="conversation in filteredConversations"
					:key="conversation.id"
					name="conversation"
					:conversation="conversation"
					:active="isActiveConversation(conversation)"
					:agent="agentForConversation(conversation)"
				>
					<button
						type="button"
						class="w-full rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
						:class="isActiveConversation(conversation)
							? 'border-primary/40 bg-primary/10 shadow-sm'
							: 'border-transparent hover:border-border hover:bg-secondary/45'"
						@click="selectConversation(conversation)"
					>
						<div class="flex items-start gap-3">
							<div class="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-canvas text-xs font-semibold text-muted-fg">
								{{ agentInitials(conversation) }}
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex min-w-0 items-start justify-between gap-2">
									<p class="truncate text-sm font-semibold text-canvas-fg">{{ conversationTitle(conversation) }}</p>
									<span class="shrink-0 text-[11px] text-muted-fg">{{ updatedLabel(conversation) }}</span>
								</div>
								<p class="mt-1 line-clamp-2 text-xs leading-5 text-muted-fg">{{ conversationSummary(conversation) }}</p>
								<div class="mt-2 flex items-center justify-between gap-2">
									<DomStatusPill size="sm" :tone="statusTone(conversation)" variant="soft">{{ conversation.status || 'idle' }}</DomStatusPill>
									<span
										v-if="conversation.unreadCount"
										class="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-fg"
									>
										{{ conversation.unreadCount }}
									</span>
								</div>
							</div>
						</div>
					</button>
				</slot>
			</div>
		</div>
	</aside>
</template>
