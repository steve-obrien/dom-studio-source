<script setup>
import { ref } from 'vue';
import { DomButton, DomTextInput } from '../../lib/vue';

const props = defineProps({ email: { type: String, default: '' } });
const address = ref(props.email);
const loading = ref(false);
const message = ref('');
const error = ref('');

/**
 * Requests a verification link without treating an email match as ownership proof.
 *
 * @returns {Promise<void>}
 */
async function submit() {
	if (loading.value) return;
	loading.value = true;
	error.value = '';
	message.value = '';
	try {
		const response = await fetch('/api/auth/email-link', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: address.value }),
		});
		const result = await response.json();
		if (!response.ok) throw new Error(result.error || 'Could not request a sign-in link.');
		message.value = result.message;
	} catch (err) {
		error.value = err.message || 'Please try again shortly.';
	} finally {
		loading.value = false;
	}
}
</script>

<template>
	<form class="space-y-4" @submit.prevent="submit">
		<DomTextInput v-model="address" label="Email used at checkout" type="email" autocomplete="email" placeholder="you@example.com" required />
		<p class="text-sm leading-6 text-muted-fg">We’ll email a secure link. Verifying it creates your account or signs you in and links your paid licence. No password needed.</p>
		<p v-if="message" role="status" class="rounded-xl border border-success/30 bg-success/10 p-4 text-sm leading-6">{{ message }}</p>
		<p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
		<DomButton type="submit" class="w-full" :disabled="loading">{{ loading ? 'Sending…' : 'Email me a sign-in link' }}</DomButton>
	</form>
</template>
