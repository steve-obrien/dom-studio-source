<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomNativeSelect, DomTabs, DomTextInput, DomToggle } from '@getdom/studio/vue';

const tabs = [
	{ key: 'arrival', label: 'Arrival' },
	{ key: 'items', label: 'Items' },
	{ key: 'handoff', label: 'Handoff' },
];

const arrivalMethods = [
	{ label: 'Curbside pickup', value: 'Curbside pickup' },
	{ label: 'Walk-up counter', value: 'Walk-up counter' },
	{ label: 'Drive-through lane', value: 'Drive-through lane' },
];

const bayOptions = [
	{ label: 'Bay B2', value: 'B2' },
	{ label: 'Bay B3', value: 'B3' },
	{ label: 'Front entrance', value: 'Front entrance' },
	{ label: 'Inside counter', value: 'Inside counter' },
];

const initialItems = [
	{
		id: 'cold-bag',
		name: 'Chilled meal kit',
		detail: 'Dinner for two / cold chain',
		quantity: 1,
		ready: true,
		status: 'Packed',
		note: 'Keep below 5 C until handoff.',
	},
	{
		id: 'oat-milk',
		name: 'Oat milk multipack',
		detail: '6 x 1L cartons',
		quantity: 2,
		ready: false,
		status: 'Substitution ready',
		note: 'Original unavailable. Barista blend staged.',
	},
	{
		id: 'id-check',
		name: 'Sparkling mixer case',
		detail: 'Restricted item / ID required',
		quantity: 1,
		ready: true,
		status: 'ID check',
		note: 'Verify age before loading.',
	},
];

const timeline = [
	{ label: 'Customer checked in', detail: 'Curbside pickup at Bay B2.', time: '16:34' },
	{ label: 'Cold bag staged', detail: 'Temperature label scanned by fulfilment.', time: '16:29' },
	{ label: 'Substitution offered', detail: 'Barista blend approved by shopper.', time: '16:21' },
];

const activeTab = ref('arrival');
const arrivalMethod = ref('Curbside pickup');
const bay = ref('B2');
const pickupCode = ref('4821');
const customerMessage = ref('Blue hatchback. Trunk is open for contactless loading.');
const items = ref(initialItems.map((item) => ({ ...item })));
const contactless = ref(true);
const substitutionsAccepted = ref(true);
const idChecked = ref(false);
const handoffComplete = ref(false);
const lastAction = ref('');

const allItemsReady = computed(() => items.value.every((item) => item.ready));
const verifiedCode = computed(() => pickupCode.value.trim() === '4821');
const hasRestrictedItem = computed(() => items.value.some((item) => item.status === 'ID check'));
const requiredChecks = computed(() => [
	{
		label: 'Arrival location shared',
		detail: `${arrivalMethod.value} / ${bay.value}`,
		passed: Boolean(arrivalMethod.value && bay.value),
	},
	{
		label: 'Pickup code verified',
		detail: verifiedCode.value ? 'Code 4821 matches this order' : 'Ask customer for the 4 digit code',
		passed: verifiedCode.value,
	},
	{
		label: 'All items staged',
		detail: `${items.value.filter((item) => item.ready).length} of ${items.value.length} ready`,
		passed: allItemsReady.value,
	},
	{
		label: 'Restricted item check',
		detail: hasRestrictedItem.value ? 'Age or identity check required' : 'No restricted items',
		passed: !hasRestrictedItem.value || idChecked.value,
	},
	{
		label: 'Substitution decision saved',
		detail: substitutionsAccepted.value ? 'Customer accepts approved substitutions' : 'Hold substitution for staff review',
		passed: substitutionsAccepted.value,
	},
]);
const readyToComplete = computed(() => requiredChecks.value.every((check) => check.passed));
const progressPercent = computed(() => Math.round((requiredChecks.value.filter((check) => check.passed).length / requiredChecks.value.length) * 100));
const primaryLabel = computed(() => {
	if (handoffComplete.value) return 'Handoff completed';
	if (!verifiedCode.value) return 'Verify pickup code';
	if (!allItemsReady.value) return 'Stage remaining items';
	if (hasRestrictedItem.value && !idChecked.value) return 'Confirm ID check';
	return 'Complete handoff';
});
const statusLabel = computed(() => {
	if (handoffComplete.value) return 'Complete';
	if (readyToComplete.value) return 'Ready for loading';
	return 'Needs attention';
});

function toggleItemReady(item) {
	item.ready = !item.ready;
	lastAction.value = item.ready ? `${item.name} marked ready` : `${item.name} moved back to staging`;
	handoffComplete.value = false;
}

function completeHandoff() {
	if (!readyToComplete.value) {
		activeTab.value = !verifiedCode.value ? 'arrival' : !allItemsReady.value ? 'items' : 'handoff';
		lastAction.value = 'Review the highlighted checks before completing pickup.';
		return;
	}

	handoffComplete.value = true;
	activeTab.value = 'handoff';
	lastAction.value = 'Pickup completed and order timeline updated.';
}
</script>

<template>
	<div class="w-full bg-secondary/40 px-3 py-5 text-canvas-fg sm:px-6 lg:px-8">
		<div class="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)] lg:items-start">
			<section class="mx-auto w-full max-w-[28rem] overflow-hidden rounded-[2rem] border border-border bg-canvas shadow-2xl shadow-black/10">
				<header class="skin-card border-b border-border px-4 py-4">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Pickup order</p>
							<h3 class="mt-1 text-2xl font-semibold tracking-tight">PU-7831</h3>
							<p class="mt-1 text-sm text-muted-fg">Maya Chen / Soho Market</p>
						</div>
						<span
							class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
							:class="readyToComplete ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'"
						>
							{{ statusLabel }}
						</span>
					</div>

					<div class="mt-4">
						<div class="flex items-center justify-between text-xs font-semibold text-muted-fg">
							<span>16:30-17:00</span>
							<span>{{ progressPercent }}% ready</span>
						</div>
						<div class="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
							<div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${progressPercent}%` }"></div>
						</div>
					</div>
				</header>

				<div class="p-4">
					<DomTabs v-model="activeTab" :tabs="tabs" />

					<section v-if="activeTab === 'arrival'" class="mt-4 grid gap-4">
						<div class="grid gap-3 rounded-2xl border border-border bg-canvas p-4">
							<div class="flex items-start gap-3">
								<div class="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
									<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
										<path d="M12 21s7-5.2 7-11A7 7 0 1 0 5 10c0 5.8 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</div>
								<div class="min-w-0">
									<h4 class="font-semibold">Customer arrived</h4>
									<p class="mt-1 text-sm leading-6 text-muted-fg">Staff can stage the order from the selected bay and loading preference.</p>
								</div>
							</div>
							<div class="grid gap-3 sm:grid-cols-2">
								<DomNativeSelect v-model="arrivalMethod" label="Arrival method" :options="arrivalMethods" />
								<DomNativeSelect v-model="bay" label="Pickup spot" :options="bayOptions" />
							</div>
						</div>

						<div class="grid gap-3 rounded-2xl border border-border bg-secondary/50 p-4">
							<DomTextInput v-model="pickupCode" label="Pickup code" inputmode="numeric" maxlength="4" placeholder="4 digit code" />
							<p class="text-sm leading-6 text-muted-fg">
								{{ verifiedCode ? 'Code verified for this order.' : 'The expected test code is 4821. In production, validate this server-side.' }}
							</p>
						</div>

						<div class="rounded-2xl border border-border bg-canvas p-4">
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Customer note</p>
							<p class="mt-2 text-sm leading-6">{{ customerMessage }}</p>
						</div>
					</section>

					<section v-else-if="activeTab === 'items'" class="mt-4 grid gap-3">
						<button
							v-for="item in items"
							:key="item.id"
							type="button"
							class="grid w-full gap-3 rounded-2xl border border-border bg-canvas p-4 text-left transition hover:bg-secondary/60"
							:class="item.ready ? 'border-success/30' : 'border-warning/40'"
							@click="toggleItemReady(item)"
						>
							<span class="flex items-start justify-between gap-3">
								<span class="min-w-0">
									<span class="block font-semibold">{{ item.name }}</span>
									<span class="mt-1 block text-sm leading-6 text-muted-fg">{{ item.detail }} / Qty {{ item.quantity }}</span>
								</span>
								<span
									class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
									:class="item.ready ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'"
								>
									{{ item.ready ? 'Ready' : 'Stage' }}
								</span>
							</span>
							<span class="rounded-xl bg-secondary/70 px-3 py-2 text-sm leading-6 text-muted-fg">{{ item.note }}</span>
						</button>
					</section>

					<section v-else class="mt-4 grid gap-4">
						<div class="grid gap-3 rounded-2xl border border-border bg-canvas p-4">
							<div class="flex items-center justify-between gap-4">
								<div>
									<h4 class="font-semibold">Contactless loading</h4>
									<p class="mt-1 text-sm leading-6 text-muted-fg">Staff loads the order without handling the device.</p>
								</div>
								<DomToggle v-model="contactless" aria-label="Use contactless loading" />
							</div>
							<div class="flex items-center justify-between gap-4">
								<div>
									<h4 class="font-semibold">Accept substitutions</h4>
									<p class="mt-1 text-sm leading-6 text-muted-fg">Customer approved the staged substitute item.</p>
								</div>
								<DomToggle v-model="substitutionsAccepted" aria-label="Accept substitutions" />
							</div>
							<div class="flex items-center justify-between gap-4">
								<div>
									<h4 class="font-semibold">ID checked</h4>
									<p class="mt-1 text-sm leading-6 text-muted-fg">Required because this order has a restricted item.</p>
								</div>
								<DomToggle v-model="idChecked" aria-label="Confirm ID check" />
							</div>
						</div>

						<div class="rounded-2xl border border-border bg-secondary/50 p-4">
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Recent events</p>
							<div class="mt-3 grid gap-3">
								<div v-for="event in timeline" :key="event.label" class="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 text-sm">
									<span class="font-semibold text-muted-fg">{{ event.time }}</span>
									<span>
										<span class="block font-medium">{{ event.label }}</span>
										<span class="mt-0.5 block leading-5 text-muted-fg">{{ event.detail }}</span>
									</span>
								</div>
							</div>
						</div>
					</section>
				</div>

				<footer class="sticky bottom-0 border-t border-border bg-canvas/95 p-4 shadow-[0_-18px_45px_rgba(15,23,42,0.12)] backdrop-blur">
					<div v-if="lastAction" class="mb-3 rounded-xl bg-secondary/70 px-3 py-2 text-sm text-muted-fg">
						{{ lastAction }}
					</div>
					<div class="grid gap-3">
						<div class="grid gap-2">
							<div v-for="check in requiredChecks" :key="check.label" class="flex items-start gap-3 text-sm">
								<span
									class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold"
									:class="check.passed ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'"
								>
									{{ check.passed ? 'OK' : '!' }}
								</span>
								<span class="min-w-0">
									<span class="block font-medium">{{ check.label }}</span>
									<span class="block leading-5 text-muted-fg">{{ check.detail }}</span>
								</span>
							</div>
						</div>
						<DomButton class="w-full" :disabled="handoffComplete" @click="completeHandoff">
							{{ primaryLabel }}
						</DomButton>
					</div>
				</footer>
			</section>

			<aside class="grid gap-4">
				<section class="overflow-hidden rounded-3xl border border-border bg-canvas shadow-2xl shadow-black/10">
					<div class="border-b border-border skin-card p-5">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Handoff snapshot</p>
						<h3 class="mt-1 text-xl font-semibold tracking-tight">Order is {{ statusLabel.toLowerCase() }}</h3>
						<p class="mt-2 text-sm leading-6 text-muted-fg">A companion summary for larger screens, store displays, or embedded staff workflows.</p>
					</div>

					<div class="grid gap-4 p-5">
						<div class="grid gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
							<div class="flex items-center justify-between gap-3">
								<span class="text-sm font-medium text-muted-fg">Customer</span>
								<span class="font-semibold">Maya Chen</span>
							</div>
							<div class="flex items-center justify-between gap-3">
								<span class="text-sm font-medium text-muted-fg">Pickup spot</span>
								<span class="font-semibold">{{ bay }}</span>
							</div>
							<div class="flex items-center justify-between gap-3">
								<span class="text-sm font-medium text-muted-fg">Method</span>
								<span class="font-semibold">{{ arrivalMethod }}</span>
							</div>
						</div>

						<div class="grid gap-3">
							<div v-for="check in requiredChecks" :key="`desktop-${check.label}`" class="rounded-2xl border border-border bg-canvas p-4">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="font-semibold">{{ check.label }}</p>
										<p class="mt-1 text-sm leading-6 text-muted-fg">{{ check.detail }}</p>
									</div>
									<span
										class="rounded-full px-2.5 py-1 text-xs font-semibold"
										:class="check.passed ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'"
									>
										{{ check.passed ? 'Passed' : 'Open' }}
									</span>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section class="rounded-3xl border border-border bg-canvas p-5 shadow-2xl shadow-black/10">
					<div class="flex items-start gap-3">
						<div class="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
							<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
								<path d="M5 12h14M12 5v14M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
							</svg>
						</div>
						<div>
							<h4 class="font-semibold">Builder notes</h4>
							<p class="mt-2 text-sm leading-6 text-muted-fg">
								Use this as a customer flow, staff kiosk, or embedded order-detail module. The state shape maps cleanly to grocery pickup, rental returns, pharmacy collection, and click-and-collect retail.
							</p>
						</div>
					</div>
				</section>
			</aside>
		</div>
	</div>
</template>
