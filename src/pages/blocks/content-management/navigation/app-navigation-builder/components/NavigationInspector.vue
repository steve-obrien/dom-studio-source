<script setup>
import { computed } from 'vue';
import {
	DomAlert,
	DomButton,
	DomIconSelector,
	DomSelect,
	DomStatusPill,
	DomTagCombobox,
	DomTextInput,
	DomTextareaInput,
	DomToggle,
} from '@getdom/studio/vue';

const model = defineModel({
	type: Object,
	required: true,
});

const props = defineProps({
	visibilityOptions: {
		type: Array,
		default: () => [],
	},
	audienceOptions: {
		type: Array,
		default: () => [],
	},
	iconOptions: {
		type: Array,
		default: () => [],
	},
	issues: {
		type: Array,
		default: () => [],
	},
	path: {
		type: String,
		default: '',
	},
	saving: {
		type: Boolean,
		default: false,
	},
	dirty: {
		type: Boolean,
		default: false,
	},
	hasChildren: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['save', 'archive', 'floating-interaction']);

const primaryIssue = computed(getPrimaryIssue);
const issueTone = computed(getIssueTone);

/**
 * Return the first server-owned issue associated with the selected item.
 *
 * @returns {Record<string, unknown>|null} Highest-priority validation issue.
 */
function getPrimaryIssue() {
	return props.issues.find((issue) => issue.severity === 'blocker') || props.issues[0] || null;
}

/**
 * Map the selected issue severity to a DOM Studio alert tone.
 *
 * @returns {string} Alert tone.
 */
function getIssueTone() {
	return primaryIssue.value?.severity === 'blocker' ? 'danger' : 'warning';
}

/**
 * Keep a containing drawer open after a teleported picker commits a value.
 *
 * @returns {void}
 */
function notifyFloatingInteraction() {
	setTimeout(() => emit('floating-interaction'), 0);
}
</script>

<template>
	<div class="flex h-full min-h-0 flex-col bg-canvas">
		<div class="shrink-0 border-b border-border px-4 py-4">
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0">
					<p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-fg">Selected destination</p>
					<h2 class="mt-1 truncate text-lg font-semibold tracking-tight">{{ model.label }}</h2>
					<p class="mt-1 truncate text-xs text-muted-fg">{{ props.path }}</p>
				</div>
				<DomStatusPill
					:tone="primaryIssue ? issueTone : 'success'"
					:label="primaryIssue ? (primaryIssue.severity === 'blocker' ? 'Needs attention' : 'Review') : 'Ready'"
					size="sm"
				/>
			</div>
		</div>

		<div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5">
			<DomAlert
				v-if="primaryIssue"
				:tone="issueTone"
				variant="soft"
				:title="primaryIssue.severity === 'blocker' ? 'Publishing blocker' : 'Check recommended'"
				:description="primaryIssue.message"
			/>

			<section class="space-y-4">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Content</p>
					<p class="mt-1 text-xs leading-5 text-muted-fg">The label and destination people see in the app shell.</p>
				</div>
				<DomTextInput v-model="model.label" label="Menu label" placeholder="Operations" />
				<DomTextInput
					v-model="model.url"
					label="Destination"
					placeholder="/app/ops"
					:invalid="primaryIssue?.field === 'url'"
					:error="primaryIssue?.field === 'url' ? primaryIssue.message : ''"
				/>
				<DomTextareaInput
					v-model="model.description"
					label="Internal description"
					placeholder="Explain where this item sends people"
					:rows="3"
				/>
				<DomIconSelector
					v-model="model.icon"
					label="Navigation icon"
					kind="custom"
					:items="props.iconOptions"
					:include-built-ins="false"
					:clearable="false"
					placeholder="Search navigation icons"
					@select="notifyFloatingInteraction"
				/>
			</section>

			<section class="space-y-4 border-t border-border pt-5">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Access</p>
					<p class="mt-1 text-xs leading-5 text-muted-fg">Preview visibility here; route authorization remains server-owned.</p>
				</div>
				<DomSelect
					v-model="model.visibility"
					label="Visibility"
					:options="props.visibilityOptions"
					width="min-w-[18rem]"
					@select="notifyFloatingInteraction"
				>
					<template #option="{ option }">
						<span class="block">
							<span class="block text-sm font-semibold">{{ option.label }}</span>
							<span class="mt-0.5 block text-xs leading-5 opacity-75">{{ option.description }}</span>
						</span>
					</template>
				</DomSelect>
				<DomTagCombobox
					v-if="model.visibility === 'roles' || model.visibility === 'admins'"
					v-model="model.audience"
					label="Allowed audiences"
					:options="props.audienceOptions"
					placeholder="Add roles or plan cohorts"
					clearable
					@select="notifyFloatingInteraction"
				/>
				<DomTextInput v-model="model.featureFlag" label="Feature flag" placeholder="Optional flag key" />
				<div class="grid gap-3 rounded-lg border border-border bg-secondary/35 p-3">
					<DomToggle v-model="model.requiresAuth" label="Requires sign in" />
					<DomToggle v-model="model.openInNewTab" label="Open in a new tab" />
				</div>
			</section>
		</div>

		<div class="shrink-0 border-t border-border bg-canvas px-4 py-3">
			<div class="flex items-center justify-between gap-3">
				<DomButton
					variant="ghost"
					size="sm"
					:disabled="props.hasChildren || props.saving"
					@click="emit('archive')"
				>
					Archive
				</DomButton>
				<DomButton
					size="sm"
					:loading="props.saving"
					:disabled="!props.dirty"
					@click="emit('save')"
				>
					Save changes
				</DomButton>
			</div>
			<p v-if="props.hasChildren" class="mt-2 text-xs leading-5 text-muted-fg">Move or archive child items before archiving this parent.</p>
		</div>
	</div>
</template>
