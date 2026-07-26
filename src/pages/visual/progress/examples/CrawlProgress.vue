<script setup>
import { computed, reactive } from 'vue';
import { DomButton, DomSegmentedProgress } from '../../../lib/vue';

const crawl = reactive({
	complete: 18,
	processing: 3,
	queued: 21,
	failed: 2,
});

const segments = computed(getSegments);
const processed = computed(getProcessedCount);
const summaryTone = computed(getSummaryTone);

/**
 * Builds the ordered crawl-state segments from the current lifecycle counts.
 *
 * @returns {Array<Record<string, unknown>>} Crawl progress segments.
 */
function getSegments() {
	return [
		{ key: 'complete', label: 'completed', value: crawl.complete, tone: 'success' },
		{ key: 'processing', label: 'processing', value: crawl.processing, tone: 'warning' },
		{ key: 'queued', label: 'queued', value: crawl.queued, tone: 'neutral' },
		{ key: 'failed', label: 'failed', value: crawl.failed, tone: 'danger' },
	];
}

/**
 * Counts terminal crawl states as processed pages.
 *
 * @returns {number} Complete and failed page count.
 */
function getProcessedCount() {
	return crawl.complete + crawl.failed;
}

/**
 * Resolves the summary tone from the most important active crawl state.
 *
 * @returns {'warning'|'danger'|'success'|'neutral'} Summary tone.
 */
function getSummaryTone() {
	if (crawl.processing > 0) return 'warning';
	if (crawl.queued > 0) return 'neutral';
	if (crawl.failed > 0) return 'danger';
	return 'success';
}

/**
 * Adds newly discovered pages to the queued segment and dynamic total.
 *
 * @returns {void}
 */
function discoverPages() {
	crawl.queued += 3;
}

/**
 * Moves the next queued page into active processing.
 *
 * @returns {void}
 */
function startNextPage() {
	if (crawl.queued < 1) return;
	crawl.queued -= 1;
	crawl.processing += 1;
}

/**
 * Moves one active page into the completed state.
 *
 * @returns {void}
 */
function completePage() {
	if (crawl.processing < 1) return;
	crawl.processing -= 1;
	crawl.complete += 1;
}

/**
 * Moves one active page into the failed state.
 *
 * @returns {void}
 */
function failPage() {
	if (crawl.processing < 1) return;
	crawl.processing -= 1;
	crawl.failed += 1;
}
</script>

<template>
	<div class="w-full max-w-5xl space-y-5">
		<DomSegmentedProgress
			:segments="segments"
			:value="processed"
			:tone="summaryTone"
			label="pages processed"
			size="lg"
		/>

		<div class="flex flex-wrap gap-2 border-t border-border pt-4">
			<DomButton size="sm" variant="secondary" @click="discoverPages">Discover 3 pages</DomButton>
			<DomButton size="sm" variant="secondary" :disabled="crawl.queued < 1" @click="startNextPage">Start next page</DomButton>
			<DomButton size="sm" variant="secondary" :disabled="crawl.processing < 1" @click="completePage">Complete page</DomButton>
			<DomButton size="sm" variant="danger" :disabled="crawl.processing < 1" @click="failPage">Fail page</DomButton>
		</div>
	</div>
</template>
