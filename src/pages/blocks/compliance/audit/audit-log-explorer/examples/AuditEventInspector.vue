<script setup>
import { computed, ref, watch } from 'vue';
import {
	DomAlert,
	DomAvatar,
	DomButton,
	DomJsonViewer,
	DomStatusPill,
	DomTextDiff,
	DomTextInput,
} from '@getdom/studio/vue';

const props = defineProps({
	event: {
		type: Object,
		default: null,
	},
	loading: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['hold-updated']);

const holdReason = ref('');
const holdBusy = ref(false);
const holdError = ref('');
const holdMessage = ref('');

const beforeText = computed(() => JSON.stringify(props.event?.before || {}, null, 2));
const afterText = computed(() => JSON.stringify(props.event?.after || {}, null, 2));

watch(() => props.event?.id, resetHoldForm);

/**
 * Resets transient hold feedback whenever the inspected event changes.
 *
 * @returns {void}
 */
function resetHoldForm() {
	holdReason.value = '';
	holdError.value = '';
	holdMessage.value = '';
}

/**
 * Places or releases a legal hold through the event mutation endpoint.
 *
 * @returns {Promise<void>}
 */
async function updateHold() {
	if (!props.event || holdBusy.value) return;
	holdBusy.value = true;
	holdError.value = '';
	holdMessage.value = '';
	try {
		const active = !props.event.hold.active;
		const result = await requestJson(`/api/block-demos/audit-log-explorer/events/${props.event.id}/hold`, {
			method: 'PATCH',
			body: {
				revision: props.event.revision,
				active,
				reason: active ? holdReason.value : 'Hold released after evidence review',
			},
		});
		holdMessage.value = result.message;
		holdReason.value = '';
		emit('hold-updated', result.event);
	} catch (error) {
		holdError.value = error.message || 'The legal hold could not be updated.';
	} finally {
		holdBusy.value = false;
	}
}

/**
 * Performs a JSON request and surfaces API validation messages.
 *
 * @param {string} url Request URL.
 * @param {{method?: string, body?: Record<string, unknown>}} [options={}] Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed response payload.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		method: options.method || 'GET',
		headers: options.body ? { 'content-type': 'application/json' } : undefined,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(payload.error || `Request failed with status ${response.status}.`);
	return payload;
}

/**
 * Converts an ISO timestamp into a concise locale date and time.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Human-readable timestamp.
 */
function formatTimestamp(value) {
	if (!value) return 'Not recorded';
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}

/**
 * Maps an event severity to a DOM Studio semantic tone.
 *
 * @param {string} severity Event severity.
 * @returns {string} Status pill tone.
 */
function severityTone(severity) {
	return { critical: 'danger', high: 'warning', medium: 'info', low: 'neutral' }[severity] || 'neutral';
}

/**
 * Maps an event outcome to a DOM Studio semantic tone.
 *
 * @param {string} outcome Event outcome.
 * @returns {string} Status pill tone.
 */
function outcomeTone(outcome) {
	return { success: 'success', denied: 'warning', failed: 'danger' }[outcome] || 'neutral';
}

/**
 * Formats a machine value as a readable label.
 *
 * @param {string} value Machine-readable value.
 * @returns {string} Human-readable label.
 */
function titleCase(value) {
	const text = String(value || '').replaceAll('_', ' ');
	return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : '';
}
</script>

<template>
	<div v-if="loading" class="grid min-h-72 place-items-center p-8 text-sm text-muted-fg">
		Loading evidence…
	</div>

	<div v-else-if="event" class="divide-y divide-border">
		<section class="p-4 sm:p-5">
			<div class="flex items-start justify-between gap-4">
				<div class="min-w-0">
					<p class="font-mono text-[0.68rem] text-muted-fg">{{ event.id }}</p>
					<h2 class="mt-2 text-base font-semibold leading-6">{{ event.description }}</h2>
					<p class="mt-2 font-mono text-xs text-muted-fg">{{ event.action }}</p>
				</div>
				<DomStatusPill :tone="severityTone(event.severity)" :label="titleCase(event.severity)" size="sm" />
			</div>
			<div class="mt-4 flex flex-wrap items-center gap-2">
				<DomStatusPill :tone="outcomeTone(event.outcome)" :label="titleCase(event.outcome)" size="sm" />
				<DomStatusPill tone="neutral" :label="titleCase(event.environment)" size="sm" :dot="false" />
				<DomStatusPill v-if="event.hold.active" tone="warning" label="Legal hold" size="sm" />
			</div>
		</section>

		<section class="grid gap-px bg-border sm:grid-cols-2">
			<div class="bg-canvas p-4">
				<p class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-fg">Actor</p>
				<div class="mt-3 flex items-center gap-3">
					<DomAvatar :name="event.actor.name" :initials="event.actor.initials" size="sm" />
					<div class="min-w-0">
						<p class="truncate text-sm font-medium">{{ event.actor.name }}</p>
						<p class="truncate text-xs text-muted-fg">{{ event.actor.email }}</p>
					</div>
				</div>
			</div>
			<div class="bg-canvas p-4">
				<p class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-fg">Resource</p>
				<p class="mt-3 truncate text-sm font-medium">{{ event.resource.name }}</p>
				<p class="mt-1 truncate font-mono text-xs text-muted-fg">{{ event.resource.type }} · {{ event.resource.id }}</p>
			</div>
			<div class="bg-canvas p-4">
				<p class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-fg">Request</p>
				<p class="mt-3 font-mono text-xs">{{ event.request.id }}</p>
				<p class="mt-1 text-xs text-muted-fg">{{ event.request.ip }} · {{ event.request.region }}</p>
			</div>
			<div class="bg-canvas p-4">
				<p class="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-fg">Recorded</p>
				<p class="mt-3 text-sm font-medium">{{ formatTimestamp(event.createdAt) }}</p>
				<p class="mt-1 truncate text-xs text-muted-fg">{{ event.request.userAgent }}</p>
			</div>
		</section>

		<section class="p-4 sm:p-5">
			<div class="flex items-center justify-between gap-3">
				<div>
					<h3 class="text-sm font-semibold">Change evidence</h3>
					<p class="mt-1 text-xs text-muted-fg">Immutable before and after payloads.</p>
				</div>
				<span class="font-mono text-[0.68rem] text-muted-fg">rev {{ event.revision }}</span>
			</div>
			<DomTextDiff
				class="mt-4"
				:original="beforeText"
				:proposed="afterText"
				view="unified"
				format="code"
				original-label="Before"
				proposed-label="After"
				:show-mode-switcher="false"
			/>
		</section>

		<section class="p-4 sm:p-5">
			<DomJsonViewer
				:value="event.metadata"
				title="Raw metadata"
				:filename="`${event.id}.json`"
				:expanded-depth="2"
				:preview-lines="12"
				density="compact"
			/>
		</section>

		<section class="p-4 sm:p-5">
			<div class="flex items-start justify-between gap-3">
				<div>
					<h3 class="text-sm font-semibold">Evidence retention</h3>
					<p class="mt-1 text-xs leading-5 text-muted-fg">
						{{ event.hold.active ? `Held by ${event.hold.placedBy} · ${event.hold.reason}` : 'Place a legal hold to exclude this event from retention deletion.' }}
					</p>
				</div>
				<DomStatusPill :tone="event.hold.active ? 'warning' : 'neutral'" :label="event.hold.active ? 'On hold' : 'Standard policy'" size="sm" />
			</div>

			<DomAlert v-if="holdError" class="mt-4" tone="danger" title="Hold was not updated" :description="holdError" />
			<DomAlert v-if="holdMessage" class="mt-4" tone="success" title="Retention updated" :description="holdMessage" />

			<DomTextInput
				v-if="!event.hold.active"
				v-model="holdReason"
				class="mt-4"
				label="Legal hold reason"
				placeholder="e.g. Q3 access investigation"
			/>
			<DomButton
				class="mt-4"
				:variant="event.hold.active ? 'secondary' : 'primary'"
				size="sm"
				:loading="holdBusy"
				@click="updateHold"
			>
				{{ event.hold.active ? 'Release legal hold' : 'Place legal hold' }}
			</DomButton>
		</section>
	</div>

	<div v-else class="grid min-h-72 place-items-center p-8 text-center">
		<div>
			<p class="text-sm font-semibold">Select an audit event</p>
			<p class="mt-2 max-w-xs text-sm leading-6 text-muted-fg">Open a row to inspect actor, request, diff, metadata, and retention evidence.</p>
		</div>
	</div>
</template>
