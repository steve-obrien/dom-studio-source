<script setup>
import { onMounted, ref, watch } from 'vue';
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import { DomButton } from '../lib/vue';
import { useAuth } from '../../composable/useAuth.js';
import EmailLinkForm from './_components/EmailLinkForm.vue';
import LicenceCard from './_components/LicenceCard.vue';

const { isAuthenticated, user } = useAuth();
const licences = ref([]);
const loading = ref(isAuthenticated.value);
const error = ref('');
let requestVersion = 0;

/**
 * Loads purchase evidence for the current account after client mount.
 *
 * @returns {Promise<void>}
 */
async function loadLicences() {
	const version = ++requestVersion;
	licences.value = [];
	error.value = '';
	if (!isAuthenticated.value) {
		loading.value = false;
		return;
	}
	loading.value = true;
	try {
		const response = await fetch('/api/billing/licences', { cache: 'no-store' });
		const result = await response.json();
		if (version !== requestVersion) return;
		if (!response.ok) throw new Error(result.error || 'Could not load your licences.');
		licences.value = result.licences;
	} catch (err) {
		if (version === requestVersion) error.value = err.message;
	} finally {
		if (version === requestVersion) loading.value = false;
	}
}

onMounted(loadLicences);
watch(() => user.value?.id, loadLicences);
</script>

<template>
	<DomStudioLayout>
		<section class="mx-auto w-full max-w-2xl py-10 sm:py-16">
			<p class="text-xs font-semibold uppercase tracking-wider text-muted-fg">Your purchase</p>
			<h1 class="mt-3 text-4xl font-bold tracking-tight">Your DOM Studio licence.</h1>
			<p class="mt-4 text-base leading-7 text-muted-fg">Your licence is valid without an account. Sign in to find and download your confirmation.</p>
			<p v-if="loading" role="status" class="mt-8">Loading your licences…</p>
			<p v-if="error" role="alert" class="mt-8 text-destructive">{{ error }}</p>
			<div v-if="licences.length" class="mt-8 space-y-6">
				<LicenceCard v-for="licence in licences" :key="licence.reference" :licence="licence" />
				<DomButton as="router-link" to="/components" variant="secondary">Explore the components</DomButton>
			</div>
			<div v-else-if="!loading" class="mt-8 rounded-2xl border border-border p-6 sm:p-8">
				<h2 class="mb-4 text-xl font-semibold">{{ isAuthenticated ? 'Link a purchase to your account' : 'Set up your account or sign in' }}</h2>
				<p v-if="isAuthenticated" class="mb-4 text-sm leading-6 text-muted-fg">No licence confirmations are linked here yet. Verify the email used at checkout to find your purchase.</p>
				<EmailLinkForm :email="user?.email || ''" />
			</div>
			<p class="mt-8 text-sm text-muted-fg">Haven’t bought a licence yet? <RouterLink to="/pricing" class="font-medium text-canvas-fg underline underline-offset-4">Choose your licence</RouterLink>. No account needed at checkout.</p>
		</section>
	</DomStudioLayout>
</template>
