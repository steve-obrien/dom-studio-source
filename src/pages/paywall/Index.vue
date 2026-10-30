<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import { DomButton } from '../lib/vue';
import { useAuth } from '../../composable/useAuth.js';
import { useBillingOffer } from '../../composable/useBillingOffer.js';
import { formatBillingPrice } from '../../../shared/billing.js';

const route = useRoute();
const { isAuthenticated, user } = useAuth();
const { hasIndividualPromotion, individual, individualPrice } = useBillingOffer();

const returnTo = computed(() => {
	const value = Array.isArray(route.query.from) ? route.query.from[0] : route.query.from;
	return value && value.startsWith('/') ? value : '/';
});

const signInTo = computed(() => ({
	path: '/auth/sign-in',
	query: { from: returnTo.value },
}));

const checkoutHref = computed(() => `/api/billing/checkout?licence=individual&from=${encodeURIComponent(returnTo.value)}`);
</script>

<template>
	<DomStudioLayout>
		<section class="mx-auto grid min-h-[calc(100vh-13rem)] w-full max-w-6xl items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-fg">DOM Studio access</p>
				<h1 class="mt-3 text-5xl font-bold leading-[1.05] tracking-tight text-canvas-fg sm:text-6xl">Unlock the code behind DOM Studio.</h1>
				<p class="mt-5 max-w-xl text-lg leading-8 text-muted-fg">
					Buy a licence through Stripe, then verify your purchase email to unlock editable implementation patterns and source previews. No account needed to buy.
				</p>
				<div class="mt-8 flex flex-wrap items-center gap-3">
					<DomButton :as="'a'" :href="checkoutHref" size="lg">Continue to checkout</DomButton>
					<DomButton :as="'router-link'" :to="signInTo" variant="secondary" size="lg">
						{{ isAuthenticated ? 'Refresh access' : 'I already have access' }}
					</DomButton>
				</div>
				<p v-if="user" class="mt-4 text-sm text-muted-fg">
					Signed in as <span class="font-medium text-canvas-fg">{{ user.email }}</span>.
				</p>
			</div>

			<div class="rounded-3xl border border-border bg-secondary/40 p-6 shadow-2xl shadow-black/10">
				<div class="rounded-2xl border border-border bg-canvas p-5">
					<div class="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p class="text-sm font-semibold text-canvas-fg">Individual licence</p>
							<p class="mt-1 text-sm text-muted-fg">Use forever. All v1 updates included.</p>
						</div>
						<div class="sm:text-right">
							<p class="text-3xl font-bold tracking-tight text-canvas-fg">{{ formatBillingPrice(individualPrice) }}</p>
							<p class="mt-1 text-xs text-muted-fg">USD · One-time payment</p>
							<p v-if="individual.offerLabel" class="mt-1 text-xs font-semibold uppercase tracking-wider text-success">{{ individual.offerLabel }}</p>
							<p v-if="hasIndividualPromotion" class="mt-1 text-xs text-muted-fg">Regular price: {{ formatBillingPrice(individual.originalPrice) }} USD</p>
						</div>
					</div>
					<ul class="mt-5 space-y-3 text-sm text-muted-fg">
						<li class="flex gap-2">
							<span class="mt-2 size-1.5 rounded-full bg-success"></span>
							<span>Generated Vue source before you copy it.</span>
						</li>
						<li class="flex gap-2">
							<span class="mt-2 size-1.5 rounded-full bg-success"></span>
							<span>Private source releases and implementation notes.</span>
						</li>
						<li class="flex gap-2">
							<span class="mt-2 size-1.5 rounded-full bg-success"></span>
							<span>Copy, import, or vendor the workspace into your product.</span>
						</li>
					</ul>
					<p class="mt-5 text-xs text-muted-fg">Unlimited personal, commercial, and client projects for one developer. Future major upgrades are optional.</p>
				</div>
			</div>
		</section>
	</DomStudioLayout>
</template>
