<script setup>
import { ref } from 'vue';
import { DomConfirmationCodeInput } from '../../../lib/vue';

const code = ref('');
const completedCode = ref('');

/**
 * Records the complete code so the example can show its completion state.
 *
 * @param {string} value Complete confirmation code.
 * @returns {void}
 */
function onComplete(value) {
	completedCode.value = value;
}
</script>

<template>
	<div class="w-full max-w-sm">
		<DomConfirmationCodeInput
			v-model="code"
			label="Confirmation code"
			description="Enter the six-character code sent to alex@example.com."
			@complete="onComplete"
		/>
		<p
			v-if="completedCode && completedCode === code"
			class="mt-3 text-sm font-medium text-success"
			role="status"
		>
			Code complete: {{ completedCode }}
		</p>
		<p v-else class="mt-3 text-xs text-muted-fg">
			You can also paste the complete code into any box.
		</p>
	</div>
</template>
