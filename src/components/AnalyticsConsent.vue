<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import DomButton from '../pages/components/button/DomButton.vue';
import { getAnalyticsConsent, setAnalyticsConsent } from '../analytics.js';

const visible = ref(false);

/**
 * Shows the analytics preference surface when no choice has been saved.
 *
 * @returns {void}
 */
function showIfUndecided() {
	visible.value = getAnalyticsConsent() === null;
}

/**
 * Opens the analytics preference surface on an explicit settings request.
 *
 * @returns {void}
 */
function openSettings() {
	visible.value = true;
}

/**
 * Saves the visitor's analytics preference and closes the surface.
 *
 * @param {'granted'|'denied'} consent Visitor's selected preference.
 * @returns {void}
 */
function chooseConsent(consent) {
	setAnalyticsConsent(consent);
	visible.value = false;
}

onMounted(() => {
	showIfUndecided();
	window.addEventListener('dom-studio:open-analytics-settings', openSettings);
});

onBeforeUnmount(() => {
	window.removeEventListener('dom-studio:open-analytics-settings', openSettings);
});
</script>

<template>
	<div
		v-if="visible"
		class="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl rounded-2xl border border-border bg-canvas p-4 text-canvas-fg shadow-xl sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5"
		role="dialog"
		aria-labelledby="analytics-consent-title"
		aria-describedby="analytics-consent-description"
	>
		<div>
			<p id="analytics-consent-title" class="font-semibold">Help improve DOM Studio</p>
			<p id="analytics-consent-description" class="mt-1 text-sm leading-6 text-muted-fg">
				Allow privacy-conscious Google Analytics to measure visits and understand which documentation is useful. Analytics stays off unless you choose to allow it.
			</p>
		</div>
		<div class="mt-4 flex shrink-0 flex-wrap gap-2 sm:mt-0">
			<DomButton size="sm" variant="secondary" @click="chooseConsent('denied')">No thanks</DomButton>
			<DomButton size="sm" @click="chooseConsent('granted')">Allow analytics</DomButton>
		</div>
	</div>
</template>
