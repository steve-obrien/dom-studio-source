<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import { DomButton, DomPasswordInput, DomTextInput } from '../../lib/vue';
import { useAccountStatus } from '../../../composable/useAuth.js';

const route = useRoute();
const router = useRouter();
const account = useAccountStatus();
const user = account.user;
const isLoggedIn = account.isLoggedIn;
const hasSourceAccess = account.hasSourceAccess;
const needsPurchase = account.needsPurchase;

const name = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const returnTo = computed(() => {
	const value = Array.isArray(route.query.from) ? route.query.from[0] : route.query.from;
	return value && value.startsWith('/') ? value : '/paywall';
});
const licence = computed(() => route.query.licence === 'team' ? 'team' : 'individual');
const shouldCheckout = computed(() => route.query.checkout === '1');
const checkoutUrl = computed(() => `/api/billing/checkout?licence=${licence.value}&from=${encodeURIComponent(returnTo.value)}`);
const continueTo = computed(() => {
	if (hasSourceAccess.value && returnTo.value === '/paywall') return '/';
	return returnTo.value;
});

async function submit() {
	error.value = '';
	loading.value = true;

	try {
		await account.signUp({
			name: name.value,
			email: email.value,
			password: password.value,
		});
		if (shouldCheckout.value && typeof window !== 'undefined') {
			window.location.href = checkoutUrl.value;
			return;
		}
		await router.push(returnTo.value);
	} catch (err) {
		error.value = err.message || 'Could not create account.';
	} finally {
		loading.value = false;
	}
}
</script>

<template>
	<DomStudioLayout>
		<section class="mx-auto flex min-h-[calc(100vh-13rem)] w-full max-w-5xl items-center py-8">
			<div class="grid w-full overflow-hidden rounded-3xl border border-border bg-canvas shadow-2xl shadow-black/10 md:grid-cols-[0.9fr_1.1fr]">
				<div class="hidden bg-primary p-8 text-primary-fg md:flex md:flex-col md:justify-between">
					<div>
						<div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-fg/70">
							<span class="text-primary-fg">Create account</span>
							<span aria-hidden="true">→</span>
							<span>Payment</span>
						</div>
						<h1 class="mt-6 text-4xl font-bold tracking-tight">Create your account. Get lifetime access.</h1>
						<p class="mt-4 text-sm leading-6 text-primary-fg/70">
							You are one step away from checkout. Create an account first so your purchase is saved and your access is ready after payment.
						</p>
					</div>
					<div class="rounded-2xl border border-primary-fg/15 bg-primary-fg/10 p-4">
						<p class="text-sm font-medium">What happens next?</p>
						<p class="mt-1 text-sm text-primary-fg/70">After your account is created, you will continue to secure payment and unlock DOM Studio source access.</p>
					</div>
				</div>

				<div v-if="isLoggedIn" class="p-6 sm:p-10">
					<div class="mx-auto max-w-sm">
						<p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-fg">Account</p>
						<h2 class="mt-2 text-3xl font-bold tracking-tight text-canvas-fg">You are already logged in</h2>
						<p class="mt-2 text-sm leading-6 text-muted-fg">
							You are signed in as <span class="font-medium text-canvas-fg">{{ user.email }}</span>.
						</p>

						<div class="mt-8 space-y-4">
							<div v-if="needsPurchase" class="rounded-2xl border border-border bg-secondary/40 p-4">
								<p class="text-sm font-semibold text-canvas-fg">Finish unlocking lifetime access</p>
								<p class="mt-1 text-sm leading-6 text-muted-fg">
									Your account is ready. Continue to payment to unlock DOM Studio source access.
								</p>
							</div>
							<div v-else-if="hasSourceAccess" class="rounded-2xl border border-success/30 bg-success/10 p-4">
								<p class="text-sm font-semibold text-canvas-fg">Source access is active</p>
								<p class="mt-1 text-sm leading-6 text-muted-fg">
									Your lifetime access is already linked to this account.
								</p>
							</div>

							<DomButton v-if="needsPurchase" class="w-full" size="lg" :as="'a'" :href="checkoutUrl">
								Continue to payment
							</DomButton>
							<DomButton v-else class="w-full" size="lg" :as="'router-link'" :to="continueTo">
								Continue
							</DomButton>
						</div>
					</div>
				</div>

				<form v-else class="p-6 sm:p-10" @submit.prevent="submit">
					<div class="mx-auto max-w-sm">
						<div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-fg">
							<span class="text-canvas-fg">Create account</span>
							<span aria-hidden="true">→</span>
							<span>Payment</span>
						</div>
						<h2 class="mt-2 text-3xl font-bold tracking-tight text-canvas-fg">Create your account</h2>
						<p class="mt-2 text-sm leading-6 text-muted-fg">
							Your lifetime access will be linked to this email after payment.
						</p>

						<div class="mt-8 space-y-4">
							<DomTextInput
								v-model="name"
								label="Name"
								placeholder="Your name"
								autocomplete="name"
							/>
							<DomTextInput
								v-model="email"
								label="Email"
								placeholder="you@example.com"
								type="email"
								autocomplete="email"
								required
							/>
							<DomPasswordInput
								v-model="password"
								label="Password"
								placeholder="Create a password"
								autocomplete="new-password"
								:check-compromised="true"
								required
							/>
							<p v-if="error" class="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
								{{ error }}
							</p>
							<DomButton class="w-full" size="lg" :disabled="loading">
								{{ loading ? 'Creating account...' : 'Create account' }}
							</DomButton>
						</div>

						<p class="mt-6 text-center text-sm text-muted-fg">
							Already have an account?
							<RouterLink class="font-medium text-canvas-fg hover:underline" :to="{ path: '/auth/sign-in', query: { from: returnTo, licence } }">Sign in</RouterLink>
						</p>
					</div>
				</form>
			</div>
		</section>
	</DomStudioLayout>
</template>
