<script setup>
import { computed, ref, watch } from 'vue';
import {
	DomAvatar,
	DomBadge,
	DomButton,
	DomEmptyState,
	DomIconButton,
	DomSelect,
	DomSpinner,
	DomTagCombobox,
	DomTextareaInput,
} from '@getdom/studio/vue';

const props = defineProps({
	thread: {
		type: Object,
		default: null,
	},
	labels: {
		type: Array,
		default: () => [],
	},
	snoozeOptions: {
		type: Array,
		default: () => [],
	},
	modelValue: {
		type: String,
		default: '',
	},
	loading: {
		type: Boolean,
		default: false,
	},
	busy: {
		type: Boolean,
		default: false,
	},
	showBack: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits([
	'update:modelValue',
	'back',
	'toggle-star',
	'mark-unread',
	'archive',
	'labels',
	'snooze',
	'reply',
]);

const snoozeSchedule = ref('tomorrow');
const labelValues = computed({
	get: () => props.thread?.labels?.map((label) => label.value) || [],
	set: (value) => emit('labels', value),
});

watch(() => props.thread?.id, () => {
	snoozeSchedule.value = 'tomorrow';
});

/**
 * Formats a message timestamp with a concise date and time.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Human-readable timestamp.
 */
function formatMessageTime(value) {
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}

/**
 * Returns initials for a message sender.
 *
 * @param {string} name Sender name.
 * @returns {string} Up to two initials.
 */
function senderInitials(name) {
	return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

/**
 * Emits the current snooze schedule for server persistence.
 *
 * @returns {void}
 */
function snoozeThread() {
	emit('snooze', snoozeSchedule.value);
}

/**
 * Emits the reply text when it contains meaningful content.
 *
 * @returns {void}
 */
function sendReply() {
	if (!props.modelValue.trim()) return;
	emit('reply');
}
</script>

<template>
	<div class="flex h-full min-h-0 flex-col bg-canvas">
		<div v-if="loading" class="grid h-full place-items-center">
			<div class="flex items-center gap-2 text-sm text-muted-fg">
				<DomSpinner size="sm" label="Loading conversation" />
				Loading conversation
			</div>
		</div>

		<div v-else-if="thread" class="flex h-full min-h-0 flex-col">
			<header class="shrink-0 border-b border-border px-4 py-3 sm:px-6">
				<div class="flex items-center justify-between gap-3">
					<div class="flex min-w-0 items-center gap-1">
						<DomIconButton
							v-if="showBack"
							label="Back to conversations"
							icon="M15 18l-6-6 6-6"
							size="sm"
							@click="emit('back')"
						/>
						<div class="min-w-0">
							<h2 class="truncate text-base font-semibold tracking-tight text-canvas-fg sm:text-lg">{{ thread.subject }}</h2>
							<p class="mt-0.5 truncate text-xs text-muted-fg">
								{{ thread.participants.map((participant) => participant.name).join(', ') }}
							</p>
						</div>
					</div>
					<div class="flex shrink-0 items-center gap-0.5">
						<DomIconButton
							:label="thread.starred ? 'Remove star' : 'Star conversation'"
							:icon="thread.starred ? 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2-4.5-4.4 6.2-.9L12 3Z' : 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2-4.5-4.4 6.2-.9L12 3Z'"
							:active="thread.starred"
							:disabled="busy"
							size="sm"
							@click="emit('toggle-star')"
						/>
						<DomIconButton
							label="Mark unread"
							icon="M4 6h16v12H4V6Zm0 0 8 7 8-7"
							:disabled="busy"
							size="sm"
							@click="emit('mark-unread')"
						/>
						<DomIconButton
							label="Archive conversation"
							icon="M4 7h16v13H4V7Zm-1-3h18v3H3V4Zm6 7h6"
							:disabled="busy"
							size="sm"
							@click="emit('archive')"
						/>
					</div>
				</div>
				<div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
					<DomTagCombobox
						v-model="labelValues"
						:options="labels"
						:disabled="busy"
						placeholder="Add label"
						:token-separators="[',']"
						chrome="none"
						class="min-w-0 flex-1"
					/>
					<div class="flex items-center gap-2">
						<DomSelect
							v-model="snoozeSchedule"
							:options="snoozeOptions"
							:disabled="busy"
							chrome="none"
							width="min-w-[16rem]"
							class="min-w-0 flex-1 sm:w-44 sm:flex-none"
						/>
						<DomButton variant="secondary" size="sm" :disabled="busy" @click="snoozeThread">Snooze</DomButton>
					</div>
				</div>
			</header>

			<div class="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
				<div class="mx-auto max-w-3xl space-y-5">
					<article
						v-for="message in thread.messages"
						:key="message.id"
						class="border-b border-border pb-5 last:border-b-0"
					>
						<div class="flex items-start gap-3">
							<DomAvatar :name="message.from" :initials="senderInitials(message.from)" size="sm" />
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
									<div>
										<p class="text-sm font-semibold text-canvas-fg">{{ message.from }}</p>
										<p class="text-xs text-muted-fg">{{ message.email }}</p>
									</div>
									<div class="flex items-center gap-2">
										<DomBadge v-if="message.draft" label="Draft" tone="warning" size="sm" />
										<time class="text-xs text-muted-fg">{{ formatMessageTime(message.createdAt) }}</time>
									</div>
								</div>
								<p class="mt-4 whitespace-pre-line text-sm leading-7 text-canvas-fg/90">{{ message.body }}</p>
							</div>
						</div>
					</article>
				</div>
			</div>

			<footer class="shrink-0 border-t border-border bg-canvas px-4 py-3 sm:px-6">
				<div class="mx-auto flex max-w-3xl items-end gap-2">
					<DomTextareaInput
						:model-value="modelValue"
						placeholder="Write a reply…"
						:rows="2"
						:disabled="busy"
						chrome="none"
						class="min-w-0 flex-1"
						@update:model-value="emit('update:modelValue', $event)"
					/>
					<DomButton :loading="busy" :disabled="!modelValue.trim()" @click="sendReply">Send</DomButton>
				</div>
			</footer>
		</div>

		<div v-else class="grid h-full place-items-center p-6">
			<DomEmptyState
				title="Choose a conversation"
				description="Select a message to read, label, snooze, archive, or reply."
				icon="M5 6h14v12H5V6Zm0 0 7 6 7-6"
			/>
		</div>
	</div>
</template>
