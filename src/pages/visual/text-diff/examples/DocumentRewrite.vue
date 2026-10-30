<script setup>
import { ref } from 'vue';
import { DomBadge, DomButton, DomTextDiff } from '../../../lib/vue';

const current = 'Our platform gives teams many tools that can be used to create, review, and publish content in a number of different ways.';
const suggested = 'Give every team one focused place to create, review, and publish content with confidence.';
const decision = ref('');

/**
 * Records the reviewer's decision for the suggestion demo.
 *
 * @param {'accepted'|'rejected'} value Review decision.
 * @returns {void}
 */
function decide(value) {
	decision.value = value;
}
</script>

<template>
	<article class="w-full max-w-2xl rounded-xl border border-border bg-canvas shadow-lg">
		<header class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
			<div>
				<p class="text-sm font-semibold text-canvas-fg">Launch announcement</p>
				<p class="mt-0.5 text-xs text-muted-fg">Draft · Product update</p>
			</div>
			<DomBadge label="AI suggestion" tone="primary" size="sm" />
		</header>

		<div class="space-y-4 p-5">
			<div class="border-b border-border pb-4 text-[15px] leading-7 text-canvas-fg">
				<p class="font-serif text-2xl font-semibold tracking-tight">A clearer way to publish</p>
				<p class="mt-3 text-muted-fg">The opening paragraph has a suggestion ready for review.</p>
			</div>

			<DomTextDiff
				:original="current"
				:proposed="suggested"
				view="inline"
				original-label="Current paragraph"
				proposed-label="Suggested rewrite"
			/>

			<footer class="flex items-center justify-between gap-3">
				<p class="text-xs text-muted-fg">
					{{ decision ? `Suggestion ${decision}` : 'Review the wording before changing the document.' }}
				</p>
				<div class="flex items-center gap-2">
					<DomButton size="sm" variant="secondary" @click="decide('rejected')">Reject</DomButton>
					<DomButton size="sm" variant="primary" @click="decide('accepted')">Accept</DomButton>
				</div>
			</footer>
		</div>
	</article>
</template>
