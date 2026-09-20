<script setup>
import { computed, ref } from 'vue';
import DomPopover from '../../components/popover/DomPopover.vue';
import DomIconButton from '../../components/icon-button/DomIconButton.vue';
import DomButton from '../../components/button/DomButton.vue';
import DomBadge from '../../visual/badge/DomBadge.vue';
import DomEmptyState from '../../visual/empty-state/DomEmptyState.vue';
import DomSkeleton from '../../visual/skeleton/DomSkeleton.vue';
import { notificationTone } from './notificationPresentation.js';

/**
 * @typedef {object} NotificationAction
 * @property {string} label Human-readable action label.
 * @property {string} href Authorized application destination.
 */

/**
 * @typedef {object} NotificationMessage
 * @property {string} title Plain-text notification title.
 * @property {string} body Plain-text notification body.
 * @property {'info'|'success'|'warning'|'error'} [severity] Semantic severity independent from persistence or prominence.
 * @property {'inbox'|'toast'|'banner'} [presentation] Delivery presentation recorded by the framework.
 * @property {NotificationAction} [action] Optional authorized destination.
 */

/**
 * @typedef {object} NotificationInboxItem
 * @property {string} id Durable item identifier.
 * @property {string} type Stable application notification type.
 * @property {NotificationMessage} message Recipient-facing plain-text content.
 * @property {string} createdAt ISO creation time.
 * @property {string|null} readAt Independent read state.
 * @property {string|null} dismissedAt Independent banner dismissal state.
 * @property {string|null} archivedAt Independent archive state.
 */

defineOptions({
	__doc: {
		name: 'Notification inbox',
		tag: '<DomNotificationInbox>',
		description: 'A polished notification bell and durable inbox panel for application-owned in-app records, including unread, action, archive, pagination, loading, and failure-ready states.',
		icon: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
		slots: [
			{ name: 'trigger', payload: '{ unreadCount, open }', description: 'Replace the default bell trigger while retaining the inbox popover.' },
			{ name: 'header', payload: '{ unreadCount, refresh }', description: 'Replace the panel heading and refresh control.' },
			{ name: 'item', payload: '{ item, unread, transition, action }', description: 'Replace one notification row while retaining the panel list and state helpers.' },
			{ name: 'item-icon', payload: '{ item, tone }', description: 'Replace the semantic icon shown for one default notification row.' },
			{ name: 'empty', description: 'Replace the caught-up empty state.' },
			{ name: 'footer', payload: '{ hasMore, loadingMore, loadMore }', description: 'Replace the optional pagination footer.' },
		],
		events: [
			{ name: 'transition', payload: '({ item, transition: "read" | "unread" | "archive" })', description: 'Requests an application-owned durable state transition.' },
			{ name: 'action', payload: '({ item, action })', description: 'Fired when the recipient follows a notification action.' },
			{ name: 'refresh', description: 'Requests a fresh first page without marking any item read.' },
			{ name: 'load-more', description: 'Requests the next application-owned inbox page.' },
			{ name: 'open', description: 'Fired when the inbox popover opens.' },
			{ name: 'close', description: 'Fired when the inbox popover closes.' },
		],
	},
});

const props = defineProps({
	items: {
		type: Array,
		default: () => [],
		_edit: {
			component: 'DomJsonListInput',
			description: 'Application-owned durable notification items. The shape matches db3.ai InAppItem records.',
		},
	},
	unreadCount: {
		type: Number,
		default: null,
		_edit: { description: 'Authoritative unread count for the full scoped inbox. Omit to count unread supplied items.' },
	},
	loading: {
		type: Boolean,
		default: false,
		_edit: { group: 'State', description: 'Show initial inbox loading placeholders when no items are available.' },
	},
	refreshing: {
		type: Boolean,
		default: false,
		_edit: { group: 'State', description: 'Show refresh progress without replacing already loaded items.' },
	},
	loadingMore: {
		type: Boolean,
		default: false,
		_edit: { group: 'State', description: 'Show progress on the pagination action.' },
	},
	updatingIds: {
		type: Array,
		default: () => [],
		_edit: { group: 'State', description: 'Item IDs with a durable state transition currently in flight.' },
	},
	hasMore: {
		type: Boolean,
		default: false,
		_edit: { group: 'State', description: 'Show a control that requests the next application-owned page.' },
	},
	error: {
		type: String,
		default: '',
		_edit: { group: 'State', description: 'Compact recoverable error shown above the notification list.' },
	},
	title: {
		type: String,
		default: 'Notifications',
		_edit: { group: 'Labels', description: 'Inbox panel heading.' },
	},
	triggerLabel: {
		type: String,
		default: 'Open notifications',
		_edit: { group: 'Labels', description: 'Accessible label for the default bell trigger.' },
	},
	emptyTitle: {
		type: String,
		default: 'You’re all caught up',
		_edit: { group: 'Labels', description: 'Empty-state heading.' },
	},
	emptyDescription: {
		type: String,
		default: 'New updates will appear here as they arrive.',
		_edit: { group: 'Labels', description: 'Empty-state supporting copy.' },
	},
	loadMoreLabel: {
		type: String,
		default: 'Load older notifications',
		_edit: { group: 'Labels', description: 'Pagination action label.' },
	},
	showRefresh: {
		type: Boolean,
		default: true,
		_edit: { group: 'Controls', description: 'Show the application-owned refresh action in the default header.' },
	},
	showArchive: {
		type: Boolean,
		default: true,
		_edit: { group: 'Controls', description: 'Show an archive action for every default notification row.' },
	},
	formatTimestamp: {
		type: Function,
		default: null,
		_edit: { group: 'Content', description: 'Optional formatter receiving createdAt and the complete item.' },
	},
	position: {
		type: String,
		default: 'bottom-end',
		_edit: { group: 'Layout', options: ['bottom-end', 'bottom-start', 'top-end', 'top-start'], description: 'Preferred popover placement around the trigger.' },
	},
	panelWidth: {
		type: String,
		default: 'w-[min(25rem,calc(100vw-1rem))]',
		_edit: { group: 'Layout', description: 'Tailwind width utilities applied to the popover panel.' },
	},
	maxHeight: {
		type: String,
		default: 'min(34rem, calc(100dvh - 9rem))',
		_edit: { group: 'Layout', description: 'CSS maximum height for the scrolling notification list.' },
	},
});

const emit = defineEmits(['transition', 'action', 'refresh', 'load-more', 'open', 'close']);
const open = ref(false);
const safeItems = computed(getSafeItems);
const resolvedUnreadCount = computed(getUnreadCount);
const updatingSet = computed(getUpdatingSet);
const listStyle = computed(getListStyle);

const bellIcon = 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4';
const refreshIcon = 'M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7';
const readIcon = 'M4 12l5 5L20 6';
const unreadIcon = 'M4 6h16v12H4zM4 7l8 6 8-6';
const archiveIcon = 'M4 7h16M5 7l1 13h12l1-13M3 4h18v3H3zM10 11h4';
const emptyIcon = 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4';

/**
 * Returns only object-shaped items while preserving application row identity.
 *
 * @returns {NotificationInboxItem[]} Safe notification item collection.
 */
function getSafeItems() {
	return Array.isArray(props.items) ? props.items.filter((item) => item && typeof item === 'object') : [];
}

/**
 * Uses the server-owned count when supplied or derives it from the loaded rows.
 *
 * @returns {number} Non-negative unread count.
 */
function getUnreadCount() {
	if (Number.isFinite(props.unreadCount)) return Math.max(0, Number(props.unreadCount));
	return safeItems.value.filter((item) => !item.readAt && !item.archivedAt).length;
}

/**
 * Builds a stable lookup for item-level pending state.
 *
 * @returns {Set<string>} Updating notification identifiers.
 */
function getUpdatingSet() {
	return new Set((Array.isArray(props.updatingIds) ? props.updatingIds : []).map(String));
}

/**
 * Converts the configurable list height into an inline style.
 *
 * @returns {{ maxHeight: string }} Notification list style.
 */
function getListStyle() {
	return { maxHeight: props.maxHeight };
}

/**
 * Reports whether a durable update is in flight for one item.
 *
 * @param {NotificationInboxItem} item Notification item.
 * @returns {boolean} Whether the row controls should be disabled.
 */
function isUpdating(item) {
	return updatingSet.value.has(String(item.id));
}

/**
 * Returns the semantic DOM Studio tone for an item's framework severity.
 *
 * @param {NotificationInboxItem} item Notification item.
 * @returns {'info'|'success'|'warning'|'danger'} Semantic tone.
 */
function itemTone(item) {
	return notificationTone(item?.message?.severity);
}

/**
 * Resolves the visual classes for a notification severity.
 *
 * @param {NotificationInboxItem} item Notification item.
 * @returns {string} Tailwind utility classes.
 */
function iconClass(item) {
	return {
		info: 'bg-primary/10 text-primary ring-primary/15',
		success: 'bg-success/15 text-success ring-success/20',
		warning: 'bg-warning/20 text-warning-fg ring-warning/30',
		danger: 'bg-destructive/15 text-destructive ring-destructive/20',
	}[itemTone(item)];
}

/**
 * Resolves an icon path for the notification severity.
 *
 * @param {NotificationInboxItem} item Notification item.
 * @returns {string} SVG path data.
 */
function severityIcon(item) {
	return {
		info: 'M12 16v-4M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
		success: 'M20 6L9 17l-5-5',
		warning: 'M12 9v4M12 17h.01M10.3 3.7 2.7 17a2 2 0 0 0 1.73 3h15.14a2 2 0 0 0 1.73-3L13.7 3.7a2 2 0 0 0-3.4 0z',
		danger: 'M12 8v5M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
	}[itemTone(item)];
}

/**
 * Formats a notification timestamp through the consumer hook or a stable UTC fallback.
 *
 * @param {NotificationInboxItem} item Notification item.
 * @returns {string} Display-ready timestamp.
 */
function formattedTimestamp(item) {
	if (typeof props.formatTimestamp === 'function') {
		const formatted = props.formatTimestamp(item.createdAt, item);
		return formatted === null || formatted === undefined ? '' : String(formatted);
	}
	const date = new Date(item.createdAt);
	if (Number.isNaN(date.getTime())) return String(item.createdAt || '');
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: 'UTC',
	}).format(date);
}

/**
 * Restricts action destinations to the framework's root-relative and HTTP(S) contract.
 *
 * @param {unknown} href Candidate action destination.
 * @returns {string} Safe link destination or an empty string.
 */
function safeHref(href) {
	const value = String(href || '');
	if (value.startsWith('/') && !value.startsWith('//')) return value;
	try {
		const url = new URL(value);
		return ['http:', 'https:'].includes(url.protocol) ? value : '';
	} catch {
		return '';
	}
}

/**
 * Emits one explicit framework-compatible recipient state transition.
 *
 * @param {NotificationInboxItem} item Notification item.
 * @param {'read'|'unread'|'archive'} transition Requested durable transition.
 * @returns {void}
 */
function requestTransition(item, transition) {
	if (isUpdating(item)) return;
	emit('transition', { item, transition });
}

/**
 * Emits action intent without coupling navigation to read state.
 *
 * @param {NotificationInboxItem} item Notification item.
 * @returns {void}
 */
function followAction(item) {
	if (!item?.message?.action) return;
	emit('action', { item, action: item.message.action });
}

/**
 * Requests a fresh first page without inferring a read transition.
 *
 * @returns {void}
 */
function refresh() {
	if (!props.refreshing) emit('refresh');
}

/**
 * Requests the next cursor page from the owning application.
 *
 * @returns {void}
 */
function loadMore() {
	if (!props.loadingMore) emit('load-more');
}

/**
 * Tracks the native popover state and exposes it to trigger slots.
 *
 * @returns {void}
 */
function handleOpen() {
	open.value = true;
	emit('open');
}

/**
 * Tracks dismissal of the native popover.
 *
 * @returns {void}
 */
function handleClose() {
	open.value = false;
	emit('close');
}
</script>

<template>
	<DomPopover
		:position="position"
		:width="panelWidth"
		padding="p-0"
		:arrow="false"
		@open="handleOpen"
		@close="handleClose"
	>
		<template #trigger>
			<slot name="trigger" :unread-count="resolvedUnreadCount" :open="open">
				<span class="relative inline-grid">
					<DomIconButton :label="triggerLabel" :icon="bellIcon" :active="open" />
					<span
						v-if="resolvedUnreadCount > 0"
						class="pointer-events-none absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-fg ring-2 ring-canvas"
						aria-hidden="true"
					>
						{{ resolvedUnreadCount > 99 ? '99+' : resolvedUnreadCount }}
					</span>
					<span class="sr-only" aria-live="polite">{{ resolvedUnreadCount }} unread notifications</span>
				</span>
			</slot>
		</template>

		<section class="overflow-hidden rounded-xl bg-canvas text-canvas-fg" :aria-label="title" :aria-busy="loading || refreshing">
			<slot name="header" :unread-count="resolvedUnreadCount" :refresh="refresh">
				<header class="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
					<div class="min-w-0">
						<div class="flex items-center gap-2">
							<h2 class="truncate text-sm font-semibold tracking-tight">{{ title }}</h2>
							<DomBadge v-if="resolvedUnreadCount > 0" tone="primary" size="sm">{{ resolvedUnreadCount }} unread</DomBadge>
						</div>
						<p class="mt-0.5 text-xs text-muted-fg">Your latest account and workspace updates</p>
					</div>
					<DomIconButton
						v-if="showRefresh"
						label="Refresh notifications"
						:icon="refreshIcon"
						size="sm"
						:loading="refreshing"
						@click="refresh"
					/>
				</header>
			</slot>

			<div v-if="error" role="alert" class="border-b border-destructive/20 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
				<div class="flex items-center justify-between gap-3">
					<p>{{ error }}</p>
					<button v-if="showRefresh" type="button" class="shrink-0 font-semibold underline underline-offset-2" @click="refresh">Try again</button>
				</div>
			</div>

			<div class="overscroll-contain overflow-y-auto" :style="listStyle">
				<div v-if="loading && !safeItems.length" role="status" aria-label="Loading notifications" class="grid gap-4 p-4">
					<div v-for="index in 4" :key="index" class="flex gap-3">
						<DomSkeleton variant="circle" width="2.25rem" height="2.25rem" />
						<div class="min-w-0 flex-1 pt-1"><DomSkeleton variant="text" :lines="2" /></div>
					</div>
				</div>

				<slot v-else-if="!safeItems.length" name="empty">
					<DomEmptyState
						class="m-4"
						:title="emptyTitle"
						:description="emptyDescription"
						:icon="emptyIcon"
						size="sm"
					/>
				</slot>

				<div v-else role="list" class="divide-y divide-border">
					<article
						v-for="item in safeItems"
						:key="item.id"
						role="listitem"
						class="group relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/45"
						:class="!item.readAt ? 'bg-primary/[0.035]' : ''"
					>
						<span v-if="!item.readAt" class="absolute left-1.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-primary" aria-hidden="true"></span>
						<slot name="item" :item="item" :unread="!item.readAt" :transition="requestTransition" :action="followAction">
							<slot name="item-icon" :item="item" :tone="itemTone(item)">
								<span class="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ring-1 ring-inset" :class="iconClass(item)">
									<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
										<path :d="severityIcon(item)" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</span>
							</slot>

							<div class="min-w-0 flex-1">
								<div class="flex items-start justify-between gap-3">
									<h3 class="text-sm leading-5" :class="item.readAt ? 'font-medium' : 'font-semibold'">{{ item.message?.title }}</h3>
									<time v-if="formattedTimestamp(item)" :datetime="item.createdAt" class="shrink-0 pt-0.5 text-[11px] text-muted-fg">{{ formattedTimestamp(item) }}</time>
								</div>
								<p class="mt-1 text-xs leading-5 text-muted-fg">{{ item.message?.body }}</p>

								<div class="mt-2.5 flex min-h-8 flex-wrap items-center justify-between gap-2">
									<a
										v-if="item.message?.action && safeHref(item.message.action.href)"
										:href="safeHref(item.message.action.href)"
										class="inline-flex items-center gap-1 text-xs font-semibold text-primary outline-none hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring/60"
										@click="followAction(item)"
									>
										{{ item.message.action.label }}
										<svg viewBox="0 0 24 24" class="size-3.5" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
									</a>
									<span v-else></span>

									<div class="flex items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
										<DomIconButton
											:label="item.readAt ? 'Mark as unread' : 'Mark as read'"
											:icon="item.readAt ? unreadIcon : readIcon"
											size="xs"
											:loading="isUpdating(item)"
											@click="requestTransition(item, item.readAt ? 'unread' : 'read')"
										/>
										<DomIconButton
											v-if="showArchive"
											label="Archive notification"
											:icon="archiveIcon"
											size="xs"
											:disabled="isUpdating(item)"
											@click="requestTransition(item, 'archive')"
										/>
									</div>
								</div>
							</div>
						</slot>
					</article>
				</div>
			</div>

			<slot v-if="hasMore" name="footer" :has-more="hasMore" :loading-more="loadingMore" :load-more="loadMore">
				<footer class="border-t border-border bg-secondary/20 p-3">
					<DomButton class="w-full justify-center" size="sm" variant="ghost" :loading="loadingMore" @click="loadMore">{{ loadMoreLabel }}</DomButton>
				</footer>
			</slot>
		</section>
	</DomPopover>
</template>
