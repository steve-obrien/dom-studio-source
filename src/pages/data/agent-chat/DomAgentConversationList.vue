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
import DomAvatar from '../../visual/avatar/DomAvatar.vue';
import DomSkeleton from '../../visual/skeleton/DomSkeleton.vue';

defineOptions({
	__doc: {
		nav: { section: 'ai' },
		name: 'Agent conversation list',
		tag: '<DomAgentConversationList>',
		description: 'A reusable AI conversation navigation list with search, agent labels, unread counts, status indicators, and active-thread selection.',
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
 * Returns the agent name used for a conversation avatar.
 *
 * @param {Record<string, unknown>} conversation Conversation summary.
 * @returns {string} Agent name.
 */
function agentName(conversation) {
	return agentForConversation(conversation)?.name || 'AI';
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
 * Resolves the status dot class for a conversation.
 *
 * @param {Record<string, unknown>} conversation Conversation summary.
 * @returns {string} Token-based dot classes.
 */
function statusDotClass(conversation) {
	return {
		streaming: 'bg-primary animate-pulse',
		waiting: 'bg-warning',
		error: 'bg-destructive',
		complete: 'bg-success',
	}[conversation.status] || 'bg-muted-fg/50';
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
</script>

<template>
	<aside class="flex h-full min-h-0 w-full min-w-0 flex-col bg-canvas text-canvas-fg">
		<header class="shrink-0 px-3 pb-2">
			<div class="flex h-14 items-center justify-between gap-3 px-1">
				<h2 class="truncate text-sm font-semibold tracking-tight text-canvas-fg">{{ title }}</h2>
				<div class="flex shrink-0 items-center gap-1">
					<slot name="actions" :conversations="conversations" />
					<DomIconButton
						v-if="showNewButton"
						label="New conversation"
						size="sm"
						variant="ghost"
						icon="M12 5v14M5 12h14"
						@click="createConversation"
					/>
				</div>
			</div>
			<label :for="searchId" class="sr-only">Search conversations</label>
			<div class="skin-input flex items-center gap-2 px-2.5 py-1.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
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

		<div class="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
			<div v-if="loading" class="space-y-1">
				<div v-for="index in 5" :key="index" class="flex gap-2.5 px-2.5 py-2.5">
					<DomSkeleton variant="circle" width="2rem" height="2rem" class="shrink-0" />
					<DomSkeleton class="flex-1" variant="text" :lines="2" />
				</div>
			</div>

			<slot v-else-if="!filteredConversations.length" name="empty">
				<p class="px-3 py-8 text-center text-sm leading-6 text-muted-fg">{{ emptyText }}</p>
			</slot>

			<div v-else class="space-y-0.5">
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
						class="w-full rounded-lg px-2.5 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
						:class="isActiveConversation(conversation) ? 'bg-secondary' : 'hover:bg-secondary/50'"
						:aria-current="isActiveConversation(conversation) ? 'true' : undefined"
						@click="selectConversation(conversation)"
					>
						<div class="flex items-start gap-2.5">
							<span class="relative shrink-0">
								<DomAvatar
									size="sm"
									shape="rounded"
									:src="agentForConversation(conversation)?.avatarUrl || ''"
									:name="agentName(conversation)"
								/>
								<span
									class="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2"
									:class="[statusDotClass(conversation), isActiveConversation(conversation) ? 'ring-secondary' : 'ring-canvas']"
									:title="conversation.status || 'idle'"
									aria-hidden="true"
								></span>
							</span>
							<div class="min-w-0 flex-1">
								<div class="flex min-w-0 items-baseline justify-between gap-2">
									<p class="truncate text-sm font-medium text-canvas-fg">{{ conversationTitle(conversation) }}</p>
									<span class="shrink-0 text-[11px] text-muted-fg">{{ updatedLabel(conversation) }}</span>
								</div>
								<div class="mt-0.5 flex min-w-0 items-center gap-2">
									<p class="min-w-0 flex-1 truncate text-xs leading-5 text-muted-fg">
										<span class="sr-only">{{ conversation.status || 'idle' }}. </span>{{ conversationSummary(conversation) }}
									</p>
									<span
										v-if="conversation.unreadCount"
										class="grid h-4.5 min-w-4.5 shrink-0 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-fg"
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
