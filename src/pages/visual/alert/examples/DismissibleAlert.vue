<script setup>
import { ref } from 'vue';
import { DomAlert, DomButton } from '../../../lib/vue';

const alertKey = ref(0);
const dismissed = ref(false);

/**
 * Records that the alert completed its dismiss transition.
 *
 * @returns {void}
 */
function handleDismiss() {
	dismissed.value = true;
}

/**
 * Mounts a fresh alert so the dismiss interaction can be tried again.
 *
 * @returns {void}
 */
function restoreAlert() {
	alertKey.value += 1;
	dismissed.value = false;
}
</script>

<template>
	<div class="grid gap-3">
		<DomAlert
			:key="alertKey"
			dismissible
			tone="info"
			title="Workspace update available"
			description="Refresh when convenient to use the latest editor improvements."
			@dismiss="handleDismiss"
		/>
		<DomButton v-if="dismissed" class="w-fit" variant="secondary" size="sm" @click="restoreAlert">
			Show alert again
		</DomButton>
	</div>
</template>
