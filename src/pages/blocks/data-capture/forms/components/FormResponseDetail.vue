<script setup>
import { DomBadge, DomButton, DomSelect, DomStatusPill, DomTextareaInput } from '@getdom/studio/vue';

const props = defineProps({
	response: {
		type: Object,
		default: null,
	},
	draft: {
		type: Object,
		default: () => ({ status: 'new', assignee: 'unassigned', note: '' }),
	},
	options: {
		type: Object,
		default: () => ({}),
	},
	errors: {
		type: Object,
		default: () => ({}),
	},
	busy: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['update:draft', 'save']);

/**
 * Emits one immutable response-draft field update.
 *
 * @param {string} field Triage field name.
 * @param {unknown} value Updated field value.
 * @returns {void}
 */
function updateDraftField(field, value) {
	emit('update:draft', { ...props.draft, [field]: value });
}

/**
 * Resolves an option label for a saved scalar value.
 *
 * @param {Array<Record<string, unknown>>} options Available option records.
 * @param {string} value Saved option value.
 * @returns {string} Human-readable option label.
 */
function optionLabel(options, value) {
	return options?.find((option) => option.value === value)?.label || value || 'Not provided';
}

/**
 * Formats an ISO timestamp for response context.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Localized date and time.
 */
function formatDateTime(value) {
	if (!value) return 'Not available';
	return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

/**
 * Resolves a semantic DOM Studio tone for response status.
 *
 * @param {string} status Response status.
 * @returns {string} Semantic status tone.
 */
function statusTone(status) {
	return {
		new: 'info',
		reviewed: 'neutral',
		qualified: 'success',
		archived: 'warning',
	}[status] || 'neutral';
}
</script>

<template>
	<div v-if="response" class="flex h-full min-h-0 flex-col">
		<div class="shrink-0 border-b border-border px-4 py-4 sm:px-5">
			<div class="flex items-start justify-between gap-4">
				<div class="min-w-0">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">{{ response.reference }}</p>
					<h2 class="mt-1 truncate text-lg font-semibold">{{ response.values.name }}</h2>
					<p class="mt-1 truncate text-sm text-muted-fg">{{ response.values.email }}</p>
				</div>
				<DomStatusPill :tone="statusTone(response.status)" size="sm">{{ optionLabel(options.responseStatuses, response.status) }}</DomStatusPill>
			</div>
			<p class="mt-3 text-xs text-muted-fg">Submitted · {{ formatDateTime(response.submittedAt) }} · Revision {{ response.revision }}</p>
		</div>

		<div class="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
			<div class="grid gap-5">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Project context</p>
					<p class="mt-2 text-sm leading-6">{{ response.values.details }}</p>
				</div>

				<div class="grid gap-4 border-y border-border py-4 sm:grid-cols-2">
					<div>
						<p class="text-xs text-muted-fg">Team size</p>
						<p class="mt-1 text-sm font-medium">{{ optionLabel(options.companySizes, response.values.companySize) }}</p>
					</div>
					<div>
						<p class="text-xs text-muted-fg">Preferred next step</p>
						<p class="mt-1 text-sm font-medium">{{ optionLabel(options.contactPreferences, response.values.contactPreference) }}</p>
					</div>
				</div>

				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Use cases</p>
					<div class="mt-2 flex flex-wrap gap-2">
						<DomBadge v-for="value in response.values.useCases" :key="value" tone="primary" variant="soft">{{ optionLabel(options.useCases, value) }}</DomBadge>
					</div>
				</div>

				<div class="border-t border-border pt-5">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Triage</p>
					<div class="mt-4 grid gap-4 sm:grid-cols-2">
						<DomSelect
							:model-value="draft.status"
							label="Status"
							:options="options.responseStatuses || []"
							:errors="errors.status || []"
							@update:model-value="updateDraftField('status', $event)"
						/>
						<DomSelect
							:model-value="draft.assignee"
							label="Assignee"
							:options="options.assignees || []"
							:errors="errors.assignee || []"
							@update:model-value="updateDraftField('assignee', $event)"
						>
							<template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p v-if="option.description" class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template>
						</DomSelect>
					</div>
					<div class="mt-4">
						<DomTextareaInput
							:model-value="draft.note"
							label="Internal note"
							description="Required when archiving a response. Never shown to the respondent."
							:rows="4"
							:errors="errors.note || []"
							@update:model-value="updateDraftField('note', $event)"
						/>
					</div>
					<div class="mt-4 flex justify-end"><DomButton :loading="busy" @click="emit('save')">Save triage</DomButton></div>
				</div>
			</div>
		</div>
	</div>
</template>
