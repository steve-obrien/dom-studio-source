<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomCard, DomNativeSelect, DomToggle } from '@getdom/studio/vue';

const billingCycle = ref('monthly');
const annualBilling = ref(false);

const usage = [
	{ label: 'Workflow runs', value: 8420, limit: 12000, display: '8,420 / 12,000' },
	{ label: 'Team seats', value: 14, limit: 20, display: '14 / 20' },
	{ label: 'Storage', value: 68, limit: 100, display: '68 GB / 100 GB' },
];

const plans = [
	{
		name: 'Starter',
		price: 'GBP 29',
		description: 'For small teams validating a workflow.',
		features: ['3 seats included', 'Basic automations', 'Email support'],
	},
	{
		name: 'Growth',
		price: 'GBP 79',
		description: 'Current plan for active product teams.',
		features: ['20 seats included', 'Advanced workflow runs', 'Priority support'],
		current: true,
	},
	{
		name: 'Scale',
		price: 'Custom',
		description: 'For teams that need governance and volume.',
		features: ['SSO and audit logs', 'Custom limits', 'Dedicated success manager'],
	},
];

const invoices = [
	{ id: 'INV-1048', date: 'Jun 1, 2026', amount: 'GBP 79.00', status: 'Paid' },
	{ id: 'INV-1021', date: 'May 1, 2026', amount: 'GBP 79.00', status: 'Paid' },
	{ id: 'INV-998', date: 'Apr 1, 2026', amount: 'GBP 79.00', status: 'Paid' },
];

const billingCycles = [
	{ label: 'Monthly billing', value: 'monthly' },
	{ label: 'Annual billing', value: 'annual' },
];

const projectedTotal = computed(() => (billingCycle.value === 'annual' || annualBilling.value ? 'GBP 790 / year' : 'GBP 79 / month'));

function usageWidth(item) {
	return `${Math.min(Math.round((item.value / item.limit) * 100), 100)}%`;
}
</script>

<template>
	<div class="w-full max-w-6xl overflow-hidden rounded-3xl border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-raised px-5 py-5 sm:px-7">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Billing</p>
					<h3 class="mt-2 text-2xl font-semibold tracking-tight">Subscription settings</h3>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
						Give customers a clear view of their plan, limits, renewal date, invoices, and payment method before they need support.
					</p>
				</div>
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
					<DomNativeSelect v-model="billingCycle" :options="billingCycles" class="sm:w-44" />
					<DomButton>Upgrade plan</DomButton>
				</div>
			</div>
		</header>

		<div class="grid gap-5 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_21rem]">
			<main class="grid min-w-0 gap-5">
				<section class="grid gap-4 lg:grid-cols-3">
					<DomCard v-for="plan in plans" :key="plan.name" padding="lg" class="flex flex-col">
						<div class="flex items-start justify-between gap-3">
							<div>
								<h4 class="font-semibold tracking-tight">{{ plan.name }}</h4>
								<p class="mt-1 text-sm leading-6 text-muted-fg">{{ plan.description }}</p>
							</div>
							<span v-if="plan.current" class="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
								Current
							</span>
						</div>
						<p class="mt-5 text-2xl font-semibold tracking-tight">{{ plan.price }}</p>
						<ul class="mt-4 grid gap-2 text-sm text-muted-fg">
							<li v-for="feature in plan.features" :key="feature" class="flex gap-2">
								<svg class="mt-0.5 size-4 shrink-0 text-success" viewBox="0 0 24 24" fill="none" aria-hidden="true">
									<path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
								<span>{{ feature }}</span>
							</li>
						</ul>
						<DomButton class="mt-6 w-full" :variant="plan.current ? 'secondary' : 'primary'">
							{{ plan.current ? 'Manage plan' : 'Choose plan' }}
						</DomButton>
					</DomCard>
				</section>

				<DomCard padding="lg">
					<div class="flex flex-wrap items-start justify-between gap-4">
						<div>
							<h4 class="font-semibold tracking-tight">Usage this cycle</h4>
							<p class="mt-1 text-sm leading-6 text-muted-fg">Show limits where the user can act on them: upgrade, reduce usage, or buy seats.</p>
						</div>
						<span class="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">Renews Jun 30</span>
					</div>
					<div class="mt-6 grid gap-5">
						<div v-for="item in usage" :key="item.label">
							<div class="flex items-center justify-between gap-4 text-sm">
								<span class="font-medium">{{ item.label }}</span>
								<span class="text-muted-fg">{{ item.display }}</span>
							</div>
							<div class="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
								<div class="h-full rounded-full bg-primary" :style="{ width: usageWidth(item) }"></div>
							</div>
						</div>
					</div>
				</DomCard>

				<DomCard padding="lg">
					<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h4 class="font-semibold tracking-tight">Invoice history</h4>
							<p class="mt-1 text-sm text-muted-fg">Keep finance actions close to plan controls.</p>
						</div>
						<DomButton variant="secondary" size="sm">Download all</DomButton>
					</div>
					<div class="mt-5 overflow-hidden rounded-2xl border border-border">
						<div v-for="invoice in invoices" :key="invoice.id" class="grid gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center">
							<div class="font-medium">{{ invoice.id }}</div>
							<div class="text-muted-fg">{{ invoice.date }}</div>
							<div>{{ invoice.amount }}</div>
							<div class="flex items-center justify-between gap-3 sm:justify-end">
								<span class="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">{{ invoice.status }}</span>
								<button type="button" class="rounded-lg px-2 py-1 text-sm font-medium text-muted-fg hover:bg-secondary hover:text-fg">PDF</button>
							</div>
						</div>
					</div>
				</DomCard>
			</main>

			<aside class="grid content-start gap-5">
				<DomCard padding="lg">
					<p class="text-sm font-semibold text-muted-fg">Current total</p>
					<p class="mt-2 text-3xl font-semibold tracking-tight">{{ projectedTotal }}</p>
					<p class="mt-2 text-sm leading-6 text-muted-fg">Growth plan, 14 active seats, billed to the card ending 4242.</p>
					<div class="mt-5 rounded-2xl border border-border bg-secondary/50 p-4">
						<div class="flex items-center gap-3">
							<span class="grid size-10 shrink-0 place-items-center rounded-xl bg-background text-sm font-bold">V</span>
							<div class="min-w-0">
								<p class="truncate text-sm font-semibold">Visa ending 4242</p>
								<p class="text-xs text-muted-fg">Expires 08 / 28</p>
							</div>
						</div>
						<DomButton variant="secondary" class="mt-4 w-full">Update payment method</DomButton>
					</div>
				</DomCard>

				<DomCard padding="lg">
					<div class="flex items-start justify-between gap-4">
						<div>
							<h4 class="font-semibold tracking-tight">Annual savings</h4>
							<p class="mt-1 text-sm leading-6 text-muted-fg">Surface the upgrade path without hiding the current cost.</p>
						</div>
						<DomToggle v-model="annualBilling" aria-label="Preview annual billing" />
					</div>
					<div class="mt-5 rounded-2xl bg-secondary p-4">
						<p class="text-sm font-medium">Save GBP 158 per year</p>
						<p class="mt-1 text-sm leading-6 text-muted-fg">Annual billing gives two months free on the Growth plan.</p>
					</div>
				</DomCard>

				<DomCard padding="lg">
					<h4 class="font-semibold tracking-tight">Need a custom limit?</h4>
					<p class="mt-2 text-sm leading-6 text-muted-fg">Route high-intent accounts to sales when usage is healthy but approaching a cap.</p>
					<DomButton variant="secondary" class="mt-4 w-full">Talk to sales</DomButton>
				</DomCard>
			</aside>
		</div>
	</div>
</template>
