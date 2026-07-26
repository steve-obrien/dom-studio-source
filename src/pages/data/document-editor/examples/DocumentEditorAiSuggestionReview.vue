<script setup>
import { computed } from 'vue';
import DomButton from '../../../components/button/DomButton.vue';
import DomBadge from '../../../visual/badge/DomBadge.vue';
import DomTextDiff from '../../../visual/text-diff/DomTextDiff.vue';

const props = defineProps({
	suggestion: {
		type: Object,
		required: true,
	},
	loading: {
		type: Boolean,
		default: false,
	},
});

defineEmits(['accept', 'reject']);

const suggestionLabel = computed(resolveSuggestionLabel);

/**
 * Resolves a readable label for the active AI operation.
 *
 * @returns {string} AI operation label.
 */
function resolveSuggestionLabel() {
	return String(props.suggestion?.label || 'Improve');
}
</script>

<template>
	<aside class="overflow-hidden rounded-xl border border-border bg-canvas shadow-lg" aria-live="polite">
		<header class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
			<div>
				<p class="text-sm font-semibold text-canvas-fg">{{ suggestionLabel }} paragraph</p>
				<p class="mt-0.5 text-xs text-muted-fg">The document stays unchanged until you accept.</p>
			</div>
			<DomBadge :label="loading ? 'AI is writing' : 'Ready to review'" tone="primary" variant="soft" size="sm" />
		</header>

		<div class="space-y-4 p-5">
			<div v-if="loading" class="space-y-3" aria-label="AI suggestion loading">
				<div class="h-4 w-11/12 animate-pulse rounded bg-secondary" />
				<div class="h-4 w-9/12 animate-pulse rounded bg-secondary" />
				<div class="h-4 w-10/12 animate-pulse rounded bg-secondary" />
			</div>
			<DomTextDiff
				v-else
				:original="suggestion.original"
				:proposed="suggestion.proposed"
				view="inline"
				original-label="Current paragraph"
				proposed-label="AI suggestion"
			/>

			<footer class="flex flex-wrap items-center justify-between gap-3">
				<p class="text-xs text-muted-fg">
					{{ loading ? 'Generating a reviewable suggestion…' : 'Compare the wording before updating the document.' }}
				</p>
				<div class="flex items-center gap-2">
					<DomButton type="button" size="sm" variant="secondary" :disabled="loading" @click="$emit('reject')">
						Reject
					</DomButton>
					<DomButton type="button" size="sm" variant="primary" :disabled="loading" @click="$emit('accept')">
						Accept
					</DomButton>
				</div>
			</footer>
		</div>
	</aside>
</template>
