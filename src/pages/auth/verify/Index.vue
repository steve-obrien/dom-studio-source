<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import { DomButton } from '../../lib/vue';
import { setAuthState } from '../../../composable/useAuth.js';

const router = useRouter();
const token = ref('');
const loading = ref(false);
const error = ref('');

/**
 * Moves the token out of the URL without consuming it, so mail scanners cannot sign in.
 *
 * @returns {void}
 */
function readToken() {
	token.value = new URLSearchParams(window.location.hash.slice(1)).get('token') || '';
	window.history.replaceState(window.history.state, '', '/auth/verify');
	if (!token.value) error.value = 'Open the link from your email, or request a new one.';
}

/**
 * Verifies email ownership only after the recipient explicitly chooses to continue.
 *
 * @returns {Promise<void>}
 */
async function verify() {
	if (loading.value) return;
	loading.value = true;
	error.value = '';
	try {
		const response = await fetch('/api/auth/verify-email', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token: token.value }),
		});
		const result = await response.json();
		if (!response.ok) throw new Error(result.error || 'Could not verify your email.');
		setAuthState(result.auth);
		await router.replace('/licence');
	} catch (err) {
		error.value = err.message;
	} finally {
		loading.value = false;
	}
}

onMounted(readToken);
</script>

<template>
	<DomStudioLayout>
		<section class="mx-auto w-full max-w-lg py-16">
			<p class="text-xs font-semibold uppercase tracking-wider text-muted-fg">Secure email link</p>
			<h1 class="mt-3 text-4xl font-bold tracking-tight">Continue to your account.</h1>
			<p class="mt-5 leading-7 text-muted-fg">Verify your email to create your account or sign in. Your paid licence will be linked automatically.</p>
			<p v-if="error" role="alert" class="mt-6 text-destructive">{{ error }}</p>
			<DomButton v-if="token" class="mt-8 w-full" :disabled="loading" @click="verify">{{ loading ? 'Verifying…' : 'Verify email and continue' }}</DomButton>
			<RouterLink to="/licence" class="mt-6 block text-sm underline underline-offset-4">Request a new email link</RouterLink>
		</section>
	</DomStudioLayout>
</template>
