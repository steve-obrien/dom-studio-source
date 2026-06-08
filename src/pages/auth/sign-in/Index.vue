<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DomStudioLayout from '../../docs/_layout/DomStudioLayout.vue';
import { DomButton, DomPasswordInput, DomTextInput } from '../../docs/lib/vue';
import { useAccountStatus } from '../../../composable/useAuth.js';

const route = useRoute();
const router = useRouter();
const account = useAccountStatus();
const user = account.user;
const isLoggedIn = account.isLoggedIn;
const hasSourceAccess = account.hasSourceAccess;
const needsPurchase = account.needsPurchase;

const email = ref('');
const password = ref('');
const accessCode = ref('');
const error = ref('');
const loading = ref(false);

const returnTo = computed(() => {
	const value = Array.isArray(route.query.from) ? route.query.from[0] : route.query.from;
	return value && value.startsWith('/') ? value : '/docs';
});
const licence = computed(() => route.query.licence === 'team' ? 'team' : 'individual');
const checkoutUrl = computed(() => `/api/billing/checkout?licence=${licence.value}&from=${encodeURIComponent(returnTo.value)}`);
const continueTo = computed(() => {
	if (hasSourceAccess.value && returnTo.value === '/paywall') return '/';
	return returnTo.value;
});

async function submit() {
	error.value = '';
	loading.value = true;

	try {
		await account.signIn({
			email: email.value,
			password: password.value,
			accessCode: accessCode.value,
		});
		await router.push(returnTo.value);
	} catch (err) {
		error.value = err.message || 'Sign in failed.';
	} finally {
		loading.value = false;
	}
}

function submitFromPassword(event) {
	if (loading.value || event.target?.type !== 'password') return;
	event.preventDefault();
	submit();
}

async function signOut() {
	await account.signOut();
}
</script>

<template>
	<DomStudioLayout>
		<section class="mx-auto flex min-h-[calc(100vh-13rem)] w-full max-w-5xl items-center py-8">
			<div class="grid w-full overflow-hidden rounded-3xl border border-border bg-background shadow-2xl shadow-black/10 md:grid-cols-[0.9fr_1.1fr]">
				<div class="hidden bg-primary p-8 text-primary-foreground md:flex md:flex-col md:justify-between">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">DOM Studio</p>
						<h1 class="mt-6 text-4xl/snug font-bold tracking-tight ">Source access for people who own their UI.</h1>
						<p class="mt-4 text-sm leading-6 text-primary-foreground/70">
							Continue into paid templates, source previews, experiments, and private implementation notes.
						</p>
					</div>
					<div class="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-4">
						<p class="text-sm font-medium">Pay once, Own forever.</p>
						<p class="mt-1 text-sm text-primary-foreground/70">Lifetime access and updates</p>
					</div>
				</div>

				<div v-if="isLoggedIn" class="p-6 sm:p-10">
					<div class="mx-auto max-w-sm">
						<p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Account</p>
						<h2 class="mt-2 text-3xl font-bold tracking-tight text-foreground">You are already signed in</h2>
						<p class="mt-2 text-sm leading-6 text-muted-foreground">
							You are signed in as <span class="font-medium text-foreground">{{ user.email }}</span>.
						</p>

						<div class="mt-8 space-y-4">
							<div v-if="needsPurchase" class="rounded-2xl border border-border bg-secondary/40 p-4">
								<p class="text-sm font-semibold text-foreground">Finish unlocking lifetime access</p>
								<p class="mt-1 text-sm leading-6 text-muted-foreground">
									Continue to payment to unlock DOM Studio source access for this account.
								</p>
							</div>
							<div v-else-if="hasSourceAccess" class="rounded-2xl border border-success/30 bg-success/10 p-4">
								<p class="text-sm font-semibold text-foreground">Source access is active</p>
								<p class="mt-1 text-sm leading-6 text-muted-foreground">
									Your lifetime access is already linked to this account.
								</p>
							</div>

							<DomButton v-if="needsPurchase" class="w-full" size="lg" :as="'a'" :href="checkoutUrl">
								Continue to payment
							</DomButton>
							<DomButton v-else class="w-full" size="lg" :as="'router-link'" :to="continueTo">
								Continue
							</DomButton>
							<DomButton class="w-full" size="lg" variant="secondary" @click="signOut">
								Sign out
							</DomButton>
						</div>
					</div>
				</div>

				<form v-else class="p-6 sm:p-10" @submit.prevent="submit" @keydown.enter="submitFromPassword">
					<div class="mx-auto max-w-sm">
						<p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Account</p>
						<h2 class="mt-2 text-3xl font-bold tracking-tight text-foreground">Sign in</h2>
						<p class="mt-2 text-sm leading-6 text-muted-foreground">Use your account password.</p>

						<div class="mt-8 space-y-4">
							<DomTextInput
								v-model="email"
								label="Email"
								placeholder="you@example.com"
								type="email"
								required
							/>
							<DomPasswordInput
								v-model="password"
								label="Password"
								placeholder="Enter password"
								autocomplete="current-password"
								:show-strength="false"
								required
							/>
							<p v-if="error" class="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
								{{ error }}
							</p>
							<DomButton class="w-full" size="lg" type="submit" :disabled="loading">
								{{ loading ? 'Signing in...' : 'Sign in' }}
							</DomButton>
						</div>

						<p class="mt-6 text-center text-sm text-muted-foreground">
							Need an account?
							<RouterLink class="font-medium text-foreground hover:underline" :to="{ path: '/auth/sign-up', query: { from: returnTo, licence } }">Create one</RouterLink>
						</p>
					</div>
				</form>
			</div>
		</section>
	</DomStudioLayout>
</template>
