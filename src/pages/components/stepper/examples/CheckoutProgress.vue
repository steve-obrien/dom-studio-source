<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomStepper } from '../../../lib/vue';

const activeStep = ref('details');
const steps = [
	{ key: 'details', label: 'Details', description: 'Account and contact information' },
	{ key: 'delivery', label: 'Delivery', description: 'Address and delivery window' },
	{ key: 'payment', label: 'Payment', description: 'Secure payment method' },
	{ key: 'review', label: 'Review', description: 'Confirm and submit the order' },
];

const activeIndex = computed(findActiveIndex);
const activeItem = computed(getActiveItem);

/**
 * Returns the controlled active step record.
 *
 * @returns {Record<string, unknown>} Active step.
 */
function getActiveItem() {
	return steps[activeIndex.value] || steps[0];
}

/**
 * Finds the controlled active step index.
 *
 * @returns {number} Active step index.
 */
function findActiveIndex() {
	const index = steps.findIndex(matchesActiveStep);
	return index >= 0 ? index : 0;
}

/**
 * Reports whether one step matches the controlled key.
 *
 * @param {Record<string, unknown>} step Step record.
 * @returns {boolean} True for the controlled active step.
 */
function matchesActiveStep(step) {
	return step.key === activeStep.value;
}

/**
 * Moves the controlled workflow one step backward.
 *
 * @returns {void}
 */
function goBack() {
	activeStep.value = steps[Math.max(0, activeIndex.value - 1)].key;
}

/**
 * Moves the controlled workflow one step forward.
 *
 * @returns {void}
 */
function continueForward() {
	activeStep.value = steps[Math.min(steps.length - 1, activeIndex.value + 1)].key;
}
</script>

<template>
	<div class="w-full rounded-xl border border-border skin-card p-5 sm:p-6">
		<DomStepper v-model="activeStep" :items="steps" linear />

		<div class="mt-7 rounded-lg border border-border bg-secondary/35 p-5">
			<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Current step</p>
			<h3 class="mt-1 text-lg font-semibold text-canvas-fg">{{ activeItem.label }}</h3>
			<p class="mt-1 text-sm text-muted-fg">{{ activeItem.description }}</p>
		</div>

		<div class="mt-4 flex justify-between gap-3">
			<DomButton variant="secondary" :disabled="activeIndex === 0" @click="goBack">Back</DomButton>
			<DomButton :disabled="activeIndex === steps.length - 1" @click="continueForward">Continue</DomButton>
		</div>
	</div>
</template>
