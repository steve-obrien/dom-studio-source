<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import { DomButton } from '../../lib/vue';
import LicenceCard from '../_components/LicenceCard.vue';
import EmailLinkForm from '../_components/EmailLinkForm.vue';

const route = useRoute();
const router = useRouter();
const licence = ref(null);
const status = ref('loading');
const error = ref('');
let sessionId = '';

/**
 * Checks payment on the server; a return URL alone never implies payment or account ownership.
 *
 * @returns {Promise<void>}
 */
async function loadPurchase() {
	status.value = 'loading';
	error.value = '';
	try {
		const response = await fetch('/api/billing/purchase', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionId }),
		});
		const result = await response.json();
		if (!response.ok) throw new Error(result.error || 'Could not load your purchase.');
		status.value = result.status;
		licence.value = result.licence || null;
	} catch (err) {
		status.value = 'error';
		error.value = err.message;
	}
}

/**
 * Removes purchase-view proof from the address bar and retains it only in this tab for refreshes.
 *
 * @returns {Promise<void>}
 */
async function initialise() {
	sessionId = typeof route.query.session_id === 'string' ? route.query.session_id : '';
	try {
		if (sessionId) sessionStorage.setItem('dom-studio-purchase', sessionId);
		else sessionId = sessionStorage.getItem('dom-studio-purchase') || '';
	} catch { /* Storage is optional; the current return can still be checked. */ }
	await router.replace('/licence/thanks');
	if (sessionId) await loadPurchase();
	else status.value = 'missing';
}

onMounted(initialise);
</script>

<template>
	<DomStudioLayout>
		<section class="mx-auto w-full max-w-2xl py-10 sm:py-16">
			<p class="text-xs font-semibold uppercase tracking-wider text-muted-fg">DOM Studio</p>
			<h1 class="mt-3 text-4xl font-bold tracking-tight">{{ licence ? 'Your licence is ready.' : 'Your purchase confirmation.' }}</h1>
			<template v-if="licence">
				<p class="mt-4 text-base leading-7 text-muted-fg">Thank you for buying DOM Studio. Save your confirmation below. Your licence is valid now, without creating an account.</p>
				<div class="mt-8"><LicenceCard :licence="licence" /></div>
				<div class="mt-8 rounded-2xl border border-border p-6 sm:p-8">
					<p class="text-xs font-semibold uppercase tracking-wider text-muted-fg">Optional next step</p>
					<h2 class="mb-4 mt-2 text-2xl font-semibold">Set up your account</h2>
					<EmailLinkForm :email="licence.email" />
				</div>
			</template>
			<p v-else-if="status === 'loading'" role="status" class="mt-6 text-muted-fg">Checking your payment…</p>
			<div v-else class="mt-6 space-y-5">
				<p v-if="status === 'pending'" role="status" class="leading-7 text-muted-fg">Your payment is still processing. We’ll email your licence confirmation once it clears. You can safely close this page.</p>
				<p v-else-if="status === 'failed'" role="alert" class="leading-7 text-muted-fg">Your payment did not complete, so no licence has been issued for this checkout. You can try again with another payment method.</p>
				<p v-else-if="error" role="alert" class="text-destructive">{{ error }}</p>
				<p v-else class="leading-7 text-muted-fg">Use the email from your Stripe receipt to recover your licence and set up your account.</p>
				<DomButton v-if="sessionId" variant="secondary" @click="loadPurchase">Check payment again</DomButton>
				<DomButton v-if="status === 'failed'" as="router-link" to="/pricing">Return to pricing</DomButton>
				<EmailLinkForm />
			</div>
		</section>
	</DomStudioLayout>
</template>
