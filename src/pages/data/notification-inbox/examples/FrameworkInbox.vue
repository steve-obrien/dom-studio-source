<script setup>
import { computed, ref } from 'vue';
import {
	DomButton,
	DomNotificationInbox,
	DomToastStack,
	notificationToast,
	useToasts,
} from '@getdom/studio/vue';

const notifications = ref([
	{
		id: '01K59REPORTREADY0000000000',
		type: 'report.ready',
		message: {
			title: 'Your performance report is ready',
			body: 'The September workspace report finished processing and is ready to review.',
			severity: 'success',
			presentation: 'toast',
			action: { label: 'View report', href: '/data/notification-inbox#report' },
		},
		createdAt: '2026-09-20T09:58:00.000Z',
		readAt: null,
		dismissedAt: null,
		archivedAt: null,
	},
	{
		id: '01K59INVITE00000000000000',
		type: 'workspace.invitation',
		message: {
			title: 'Maya joined your workspace',
			body: 'Maya accepted your invitation and can now access the Northstar workspace.',
			severity: 'info',
			presentation: 'inbox',
			action: { label: 'Manage members', href: '/data/notification-inbox#members' },
		},
		createdAt: '2026-09-20T09:14:00.000Z',
		readAt: null,
		dismissedAt: null,
		archivedAt: null,
	},
	{
		id: '01K59PAYMENT0000000000000',
		type: 'billing.payment-failed',
		message: {
			title: 'Payment method needs attention',
			body: 'We could not renew your Pro workspace. Update the card before 24 September.',
			severity: 'warning',
			presentation: 'banner',
			action: { label: 'Update billing', href: '/data/notification-inbox#billing' },
		},
		createdAt: '2026-09-19T14:30:00.000Z',
		readAt: '2026-09-19T14:35:00.000Z',
		dismissedAt: null,
		archivedAt: null,
	},
	{
		id: '01K59EXPORT00000000000000',
		type: 'export.completed',
		message: {
			title: 'Customer export completed',
			body: 'Your CSV export with 2,481 customer records is available for 7 days.',
			severity: 'success',
			presentation: 'inbox',
			action: { label: 'Download export', href: '/data/notification-inbox#export' },
		},
		createdAt: '2026-09-18T16:08:00.000Z',
		readAt: '2026-09-18T16:11:00.000Z',
		dismissedAt: null,
		archivedAt: null,
	},
]);

const updatingIds = ref([]);
const loadingMore = ref(false);
const hasMore = ref(true);
const { toasts, show, dismiss } = useToasts();
const unreadCount = computed(() => notifications.value.filter((item) => !item.readAt).length);
const timestampLabels = {
	'01K59REPORTREADY0000000000': '2m',
	'01K59INVITE00000000000000': '46m',
	'01K59PAYMENT0000000000000': 'Yesterday',
	'01K59EXPORT00000000000000': '2d',
	'01K59SECURITY000000000000': '4d',
	'01K59DIGEST00000000000000': '6d',
};

/**
 * Formats demo timestamps without coupling the reusable component to a relative-time library.
 *
 * @param {string} _createdAt Framework ISO timestamp.
 * @param {{ id: string }} item Notification item.
 * @returns {string} Stable demo label.
 */
function formatTimestamp(_createdAt, item) {
	return timestampLabels[item.id] || '';
}

/**
 * Simulates an application-owned persisted state transition.
 *
 * @param {{ item: object, transition: 'read'|'unread'|'archive' }} payload Transition event.
 * @returns {Promise<void>}
 */
async function transition({ item, transition }) {
	updatingIds.value = [item.id];
	await new Promise((resolve) => window.setTimeout(resolve, 350));
	if (transition === 'archive') {
		notifications.value = notifications.value.filter((entry) => entry.id !== item.id);
	} else {
		notifications.value = notifications.value.map((entry) => entry.id === item.id
			? { ...entry, readAt: transition === 'read' ? new Date().toISOString() : null }
			: entry);
	}
	updatingIds.value = [];
}

/**
 * Adds a newly observed live arrival to both the durable inbox and transient toast stack.
 *
 * @returns {void}
 */
function simulateArrival() {
	const item = {
		id: `01K59LIVE${Date.now()}`,
		type: 'automation.completed',
		message: {
			title: 'Automation finished',
			body: 'Weekly customer health scores have been recalculated for 128 accounts.',
			severity: 'success',
			presentation: 'toast',
			action: { label: 'View run', href: '/data/notification-inbox#automation' },
		},
		createdAt: new Date().toISOString(),
		readAt: null,
		dismissedAt: null,
		archivedAt: null,
	};
	timestampLabels[item.id] = 'Now';
	notifications.value = [item, ...notifications.value];
	show(notificationToast(item));
}

/**
 * Simulates cursor pagination while preserving the current inbox rows.
 *
 * @returns {Promise<void>}
 */
async function loadMore() {
	loadingMore.value = true;
	await new Promise((resolve) => window.setTimeout(resolve, 500));
	notifications.value = [
		...notifications.value,
		{
			id: '01K59SECURITY000000000000',
			type: 'security.new-device',
			message: { title: 'New device signed in', body: 'Safari on macOS signed in from London, United Kingdom.', severity: 'info', presentation: 'inbox' },
			createdAt: '2026-09-16T08:12:00.000Z',
			readAt: '2026-09-16T08:20:00.000Z',
			dismissedAt: null,
			archivedAt: null,
		},
		{
			id: '01K59DIGEST00000000000000',
			type: 'workspace.digest',
			message: { title: 'Your weekly workspace digest', body: '12 projects moved forward and 3 items need your attention.', severity: 'info', presentation: 'inbox', action: { label: 'Open digest', href: '/data/notification-inbox#digest' } },
			createdAt: '2026-09-14T07:00:00.000Z',
			readAt: '2026-09-14T09:05:00.000Z',
			dismissedAt: null,
			archivedAt: null,
		},
	];
	hasMore.value = false;
	loadingMore.value = false;
}
</script>

<template>
	<div class="rounded-2xl border border-border bg-secondary/25 p-4 sm:p-6">
		<div class="flex items-center justify-between gap-4 rounded-xl border border-border bg-canvas px-4 py-3 shadow-sm">
			<div>
				<p class="text-sm font-semibold">Northstar</p>
				<p class="text-xs text-muted-fg">Customer operations</p>
			</div>
			<div class="flex items-center gap-2">
				<DomButton size="sm" variant="secondary" @click="simulateArrival">Simulate live notification</DomButton>
				<DomNotificationInbox
					:items="notifications"
					:unread-count="unreadCount"
					:updating-ids="updatingIds"
					:has-more="hasMore"
					:loading-more="loadingMore"
					:format-timestamp="formatTimestamp"
					@transition="transition"
					@load-more="loadMore"
				/>
			</div>
		</div>
		<DomToastStack :toasts="toasts" position="bottom-right" @dismiss="dismiss" />
	</div>
</template>
