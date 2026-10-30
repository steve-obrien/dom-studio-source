<script setup>
import { ref } from 'vue';
import {
	DomButton,
	DomDialog,
	DomIconButton,
	DomStatusPill,
	DomTextInput,
	DomTextareaComposer,
	DomTextareaInput,
} from '@getdom/studio/vue';

const open = ref(false);
const assistantOpen = ref(false);
const title = ref('A practical guide to product onboarding');
const plan = ref('Explain the first-run checklist and include one worked example.');
const draft = ref('');
const suggestionStatus = ref('pending');
const messages = ref([
	{
		id: 'assistant-1',
		role: 'assistant',
		text: 'I can see the current title, audience and article plan. The plan would be clearer with a short section on measuring activation.',
	},
]);

/**
 * Update the article plan through the same setter used by manual edits.
 *
 * @param {string} value Next plan text.
 * @returns {void}
 */
function updatePlan(value) {
	plan.value = value;
}

/**
 * Apply the pending assistant suggestion to the editable plan.
 *
 * @returns {void}
 */
function acceptSuggestion() {
	if (suggestionStatus.value !== 'pending') return;
	const addition = 'Add an activation section covering the first meaningful action and one measurable success signal.';
	updatePlan(plan.value.trim() ? `${plan.value.trim()}\n${addition}` : addition);
	suggestionStatus.value = 'accepted';
}

/**
 * Retain the suggestion in the thread while marking it dismissed.
 *
 * @returns {void}
 */
function dismissSuggestion() {
	if (suggestionStatus.value !== 'pending') return;
	suggestionStatus.value = 'dismissed';
}

/**
 * Add a local user message and a deterministic assistant reply for the example.
 *
 * @param {string} value Composer content.
 * @returns {void}
 */
function sendMessage(value) {
	const content = value.trim();
	if (!content) return;
	messages.value.push(
		{ id: `user-${messages.value.length}`, role: 'user', text: content },
		{ id: `assistant-${messages.value.length + 1}`, role: 'assistant', text: 'I would keep the existing direction and make the success measure explicit in the closing checklist.' },
	);
	draft.value = '';
}
</script>

<template>
	<DomButton @click="open = true">Open article brief</DomButton>

	<DomDialog
		v-model="open"
		v-model:companion-open="assistantOpen"
		width="56rem"
		height="min(42rem, calc(100dvh - 2rem))"
		companion-width="24rem"
		companion-label="Article assistant"
		:footer="false"
	>
		<template #header="{ titleId, descriptionId, companionOpen, companionTriggerProps, toggleCompanion }">
			<header class="-mx-6 -mt-6 flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-5">
				<div class="min-w-0">
					<div class="mb-2 flex flex-wrap items-center gap-2">
						<DomStatusPill label="Draft" tone="neutral" />
						<span class="text-xs text-muted-fg">Article brief</span>
					</div>
					<h2 :id="titleId" class="truncate text-xl font-semibold tracking-tight text-canvas-fg">Product onboarding</h2>
					<p :id="descriptionId" class="mt-1 text-sm text-muted-fg">Review the brief and ask the assistant to suggest focused changes.</p>
				</div>
				<DomButton
					v-bind="companionTriggerProps"
					size="sm"
					:variant="companionOpen ? 'primary' : 'secondary'"
					@click="toggleCompanion"
				>
					AI chat
				</DomButton>
			</header>
		</template>

		<div class="grid gap-5 pt-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
			<div class="space-y-5">
				<DomTextInput v-model="title" label="Suggested title" />
				<DomTextareaInput
					:model-value="plan"
					label="Article plan"
					:rows="8"
					@update:model-value="updatePlan"
				/>
			</div>
			<aside class="space-y-3 rounded-xl border border-border bg-secondary/35 p-4">
				<p class="text-xs font-semibold uppercase tracking-wider text-muted-fg">Context</p>
				<div>
					<p class="text-xs text-muted-fg">Audience</p>
					<p class="mt-1 text-sm text-canvas-fg">Product teams improving trial activation</p>
				</div>
				<div>
					<p class="text-xs text-muted-fg">Reader goal</p>
					<p class="mt-1 text-sm text-canvas-fg">Build a useful first-run experience without adding noise</p>
				</div>
			</aside>
		</div>

		<template #footer>
			<DomButton variant="ghost" @click="open = false">Close</DomButton>
			<DomButton @click="open = false">Save brief</DomButton>
		</template>

		<template #companion="{ closeCompanion, mode }">
			<section class="flex min-h-0 flex-1 flex-col" :data-mode="mode">
				<header class="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-4">
					<div class="min-w-0">
						<h3 class="text-sm font-semibold text-canvas-fg">Assistant</h3>
						<p class="truncate text-xs text-muted-fg">Reading this article brief</p>
					</div>
					<DomIconButton
						label="Close assistant"
						size="sm"
						variant="secondary"
						icon="M6 6l12 12M18 6 6 18"
						@click="closeCompanion"
					/>
				</header>

				<div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
					<div
						v-for="message in messages"
						:key="message.id"
						class="w-fit max-w-[88%] rounded-xl px-3 py-2 text-sm leading-relaxed"
						:class="message.role === 'user' ? 'ml-auto bg-primary text-primary-fg' : 'border border-border bg-secondary/40 text-canvas-fg'"
					>
						{{ message.text }}
					</div>

					<div class="overflow-hidden rounded-xl border border-border">
						<div class="border-b border-border bg-secondary/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-fg">
							Proposed section → article plan
						</div>
						<p class="px-3 py-3 text-sm leading-relaxed text-canvas-fg">
							Add an activation section covering the first meaningful action and one measurable success signal.
						</p>
						<div class="flex items-center gap-2 px-3 pb-3">
							<template v-if="suggestionStatus === 'pending'">
								<DomButton size="xs" @click="acceptSuggestion">Accept</DomButton>
								<DomButton size="xs" variant="secondary" @click="dismissSuggestion">Dismiss</DomButton>
							</template>
							<p v-else class="text-xs font-medium" :class="suggestionStatus === 'accepted' ? 'text-success' : 'text-muted-fg'">
								{{ suggestionStatus === 'accepted' ? 'Added to the brief' : 'Dismissed' }}
							</p>
						</div>
					</div>
				</div>

				<footer class="shrink-0 space-y-3 border-t border-border bg-secondary/25 p-3">
					<div class="flex flex-wrap gap-2">
						<DomButton size="xs" variant="secondary" @click="draft = 'What is missing from this brief?'">What is missing?</DomButton>
						<DomButton size="xs" variant="secondary" @click="draft = 'Draft a concise outline'">Draft an outline</DomButton>
					</div>
					<DomTextareaComposer
						v-model="draft"
						aria-label="Ask about this brief"
						placeholder="Ask about this brief…"
						:rows="1"
						:max-rows="4"
						@submit="sendMessage"
					/>
				</footer>
			</section>
		</template>
	</DomDialog>
</template>
