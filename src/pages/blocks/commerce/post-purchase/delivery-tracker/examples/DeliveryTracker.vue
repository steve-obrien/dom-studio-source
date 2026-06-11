<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomCard, DomNativeSelect, DomTextareaInput, DomToggle } from '@getdom/studio/vue';

const statusSteps = [
	{
		key: 'confirmed',
		label: 'Order confirmed',
		detail: 'Payment accepted and fulfilment queued.',
		time: '12:04',
		eta: 'Today, 16:55',
		courierDistance: '8.4 km away',
	},
	{
		key: 'packed',
		label: 'Packed',
		detail: 'Warehouse sealed both items for courier pickup.',
		time: '13:18',
		eta: 'Today, 16:45',
		courierDistance: '5.9 km away',
	},
	{
		key: 'handoff',
		label: 'Courier handoff',
		detail: 'Nina collected the parcel from Fulham depot.',
		time: '15:22',
		eta: 'Today, 16:40',
		courierDistance: '2.1 km away',
	},
	{
		key: 'nearby',
		label: 'Nearby',
		detail: 'Courier is finishing the previous stop.',
		time: '16:31',
		eta: 'Today, 16:35-16:50',
		courierDistance: '650 m away',
	},
	{
		key: 'delivered',
		label: 'Delivered',
		detail: 'Proof of delivery captured at reception.',
		time: '16:44',
		eta: 'Delivered',
		courierDistance: 'Complete',
	},
];

const issueOptions = [
	{ label: 'Access code needed', value: 'Access code needed' },
	{ label: 'Courier delayed by traffic', value: 'Courier delayed by traffic' },
	{ label: 'Address confirmation required', value: 'Address confirmation required' },
];

const dropoffOptions = [
	{ label: 'Leave with reception', value: 'Leave with reception' },
	{ label: 'Meet at entrance', value: 'Meet at entrance' },
	{ label: 'Leave at front desk', value: 'Leave at front desk' },
	{ label: 'Call on arrival', value: 'Call on arrival' },
];

const orderItems = [
	{ name: 'Workspace starter kit', detail: 'Oak / 1 unit' },
	{ name: 'Magnetic cable tray', detail: 'Black / 1 unit' },
];

const supportEvents = [
	{ label: 'Customer confirmed access code', time: '16:28' },
	{ label: 'Courier marked next stop', time: '16:19' },
	{ label: 'Package scanned at depot', time: '15:22' },
];

const activeStepIndex = ref(2);
const selectedIssue = ref('Access code needed');
const dropoffPreference = ref('Leave with reception');
const deliveryNote = ref('Access code 2048. Reception closes at 18:00.');
const contactless = ref(true);
const proofRequired = ref(true);
const issueResolved = ref(false);
const savedInstructions = ref(false);

const activeStep = computed(() => statusSteps[activeStepIndex.value]);
const nextStep = computed(() => statusSteps[Math.min(activeStepIndex.value + 1, statusSteps.length - 1)]);
const completedCount = computed(() => activeStepIndex.value + 1);
const progressPercent = computed(() => Math.round((activeStepIndex.value / (statusSteps.length - 1)) * 100));
const openIssue = computed(() => !issueResolved.value && activeStepIndex.value < statusSteps.length - 1);
const primaryActionLabel = computed(() => issueResolved.value ? 'Exception resolved' : 'Send delivery update');
const routeLabel = computed(() => `${activeStep.value.courierDistance} / ETA ${activeStep.value.eta}`);
const readinessChecks = computed(() => [
	{ label: 'Drop-off preference selected', passed: Boolean(dropoffPreference.value) },
	{ label: 'Delivery note has access details', passed: deliveryNote.value.trim().length >= 10 },
	{ label: 'Contact rule confirmed', passed: contactless.value || dropoffPreference.value === 'Call on arrival' },
	{ label: 'Open exception acknowledged', passed: !openIssue.value || issueResolved.value },
]);
const canSave = computed(() => readinessChecks.value.slice(0, 3).every((check) => check.passed));

function setStep(index) {
	activeStepIndex.value = index;
	savedInstructions.value = false;
	if (index >= statusSteps.length - 1) issueResolved.value = true;
}

function saveInstructions() {
	if (!canSave.value) return;
	savedInstructions.value = true;
}

function resolveIssue() {
	if (!canSave.value) return;
	issueResolved.value = true;
	savedInstructions.value = true;
}
</script>

<template>
	<div class="w-full bg-secondary/40 px-3 py-4 text-fg sm:px-6 lg:px-8">
		<div class="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
			<section class="overflow-hidden rounded-lg border border-border bg-background shadow-2xl shadow-black/10">
				<header class="skin-raised border-b border-border px-4 py-4 sm:px-5">
					<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<p class="text-xs font-semibold uppercase text-muted-fg">Live delivery</p>
							<h3 class="mt-1 text-2xl font-semibold">Order GD-20482</h3>
							<p class="mt-2 max-w-xl text-sm leading-6 text-muted-fg">
								Track the courier, confirm drop-off instructions, and resolve delivery blockers before the next stop.
							</p>
						</div>
						<div class="grid min-w-36 gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm">
							<span class="font-semibold">{{ activeStep.eta }}</span>
							<span class="text-muted-fg">{{ activeStep.courierDistance }}</span>
						</div>
					</div>
				</header>

				<div class="grid gap-4 p-4 sm:p-5">
					<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]">
						<section class="overflow-hidden rounded-lg border border-border bg-background">
							<div class="relative min-h-[300px] bg-[linear-gradient(135deg,rgb(240_253_250),rgb(239_246_255)_45%,rgb(248_250_252))] p-4 dark:bg-[linear-gradient(135deg,rgb(15_23_42),rgb(22_78_99)_55%,rgb(15_23_42))]">
								<div class="absolute left-8 top-8 h-20 w-32 rounded-lg border border-primary/25 bg-primary/10" />
								<div class="absolute right-8 top-14 h-24 w-28 rounded-lg border border-border bg-background/60" />
								<div class="absolute bottom-8 left-10 h-24 w-40 rounded-lg border border-border bg-background/70" />
								<div class="absolute bottom-12 right-10 h-20 w-28 rounded-lg border border-success/30 bg-success/10" />
								<svg class="absolute inset-0 h-full w-full" viewBox="0 0 640 340" fill="none" aria-hidden="true">
									<path d="M72 255C154 232 170 156 250 166C342 178 326 76 430 86C504 93 536 130 572 95" stroke="currentColor" stroke-width="16" stroke-linecap="round" class="text-border" />
									<path
										d="M72 255C154 232 170 156 250 166C342 178 326 76 430 86C504 93 536 130 572 95"
										stroke="currentColor"
										stroke-width="16"
										stroke-linecap="round"
										class="text-primary"
										:stroke-dasharray="`${progressPercent * 8} 800`"
									/>
									<circle cx="72" cy="255" r="18" class="fill-background stroke-primary" stroke-width="8" />
									<circle cx="430" cy="86" r="18" class="fill-background stroke-primary" stroke-width="8" />
									<circle cx="572" cy="95" r="20" class="fill-success stroke-background" stroke-width="8" />
								</svg>
								<div class="relative flex h-[268px] flex-col justify-between">
									<div class="flex items-start justify-between gap-3">
										<div class="rounded-lg border border-border bg-background/90 px-3 py-2 text-sm shadow-sm backdrop-blur">
											<p class="font-semibold">{{ activeStep.label }}</p>
											<p class="mt-1 text-muted-fg">{{ routeLabel }}</p>
										</div>
										<span class="rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-muted-fg shadow-sm">
											{{ completedCount }} / {{ statusSteps.length }}
										</span>
									</div>
									<div class="rounded-lg border border-border bg-background/90 p-3 shadow-sm backdrop-blur">
										<div class="flex items-start gap-3">
											<div class="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-fg">
												<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
													<path d="M5 17h2m10 0h2M7 17a2 2 0 1 0 0 .1M17 17a2 2 0 1 0 0 .1M6 7h9l3 4v6H4V9a2 2 0 0 1 2-2Zm9 0v4h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
												</svg>
											</div>
											<div class="min-w-0">
												<p class="font-semibold">Nina Patel</p>
												<p class="text-sm leading-6 text-muted-fg">Relay Courier / Bike 42 / next stop before you</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</section>

						<DomCard padding="lg">
							<p class="text-xs font-semibold uppercase text-muted-fg">Status simulator</p>
							<div class="mt-3 grid gap-2">
								<button
									v-for="(step, index) in statusSteps"
									:key="step.key"
									type="button"
									class="flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition hover:border-primary/50"
									:class="index === activeStepIndex ? 'border-primary bg-primary/10' : 'border-border bg-background'"
									@click="setStep(index)"
								>
									<span
										class="grid size-6 shrink-0 place-items-center rounded-full border text-xs font-bold"
										:class="index <= activeStepIndex ? 'border-primary bg-primary text-primary-fg' : 'border-border text-muted-fg'"
									>
										{{ index + 1 }}
									</span>
									<span>
										<span class="block font-semibold">{{ step.label }}</span>
										<span class="block text-xs text-muted-fg">{{ step.time }}</span>
									</span>
								</button>
							</div>
						</DomCard>
					</div>

					<section class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
						<DomCard padding="lg">
							<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<p class="text-xs font-semibold uppercase text-muted-fg">Delivery timeline</p>
									<h4 class="mt-1 text-lg font-semibold">Next up: {{ nextStep.label }}</h4>
								</div>
								<span
									class="w-fit rounded-full px-3 py-1 text-xs font-semibold"
									:class="openIssue ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'"
								>
									{{ openIssue ? 'Action needed' : 'On track' }}
								</span>
							</div>
							<div class="mt-5 grid gap-4">
								<div
									v-for="(step, index) in statusSteps"
									:key="step.key"
									class="grid grid-cols-[2rem_minmax(0,1fr)] gap-3"
								>
									<div class="grid justify-items-center">
										<span
											class="grid size-7 place-items-center rounded-full border text-xs font-bold"
											:class="{
												'border-primary bg-primary text-primary-fg': index <= activeStepIndex,
												'border-border bg-background text-muted-fg': index > activeStepIndex,
											}"
										>
											<svg v-if="index < activeStepIndex" viewBox="0 0 24 24" class="size-3.5" fill="none" aria-hidden="true">
												<path d="m6 12 4 4 8-8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
											</svg>
											<span v-else>{{ index + 1 }}</span>
										</span>
										<span v-if="index < statusSteps.length - 1" class="min-h-9 w-px bg-border" />
									</div>
									<div class="pb-4">
										<div class="flex flex-wrap items-center justify-between gap-2">
											<p class="font-semibold">{{ step.label }}</p>
											<p class="text-xs font-medium text-muted-fg">{{ index <= activeStepIndex ? step.time : 'Pending' }}</p>
										</div>
										<p class="mt-1 text-sm leading-6 text-muted-fg">{{ step.detail }}</p>
									</div>
								</div>
							</div>
						</DomCard>

						<DomCard padding="lg">
							<p class="text-xs font-semibold uppercase text-muted-fg">Order contents</p>
							<div class="mt-4 grid gap-3">
								<div v-for="item in orderItems" :key="item.name" class="rounded-lg border border-border bg-background p-3">
									<p class="font-semibold">{{ item.name }}</p>
									<p class="mt-1 text-sm text-muted-fg">{{ item.detail }}</p>
								</div>
							</div>
							<div class="mt-4 rounded-lg bg-secondary/70 p-3 text-sm leading-6 text-muted-fg">
								<p class="font-semibold text-fg">Delivery address</p>
								<p>71 Great Portland Street, London W1W 7LR</p>
							</div>
						</DomCard>
					</section>
				</div>
			</section>

			<aside class="grid content-start gap-4">
				<DomCard padding="lg">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase text-muted-fg">Delivery controls</p>
							<h4 class="mt-1 text-lg font-semibold">Update instructions</h4>
						</div>
						<span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Customer view</span>
					</div>

					<div class="mt-5 grid gap-4">
						<DomNativeSelect v-model="dropoffPreference" label="Drop-off preference" :options="dropoffOptions" />
						<DomTextareaInput
							v-model="deliveryNote"
							label="Delivery note"
							placeholder="Access code, reception details, or pickup instructions"
							:rows="4"
						/>
						<div class="grid gap-3 rounded-lg bg-secondary/60 p-3">
							<DomToggle v-model="contactless" label="Contactless drop-off" description="Courier can complete the delivery without a handoff." />
							<DomToggle v-model="proofRequired" label="Require proof photo" description="Ask for a photo before the order is marked delivered." />
						</div>
						<DomButton class="w-full" :disabled="!canSave" @click="saveInstructions">
							{{ savedInstructions ? 'Instructions saved' : 'Save instructions' }}
						</DomButton>
					</div>
				</DomCard>

				<DomCard padding="lg">
					<div class="flex items-start gap-3">
						<div
							class="grid size-10 shrink-0 place-items-center rounded-full"
							:class="openIssue ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'"
						>
							<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
								<path d="M12 9v4m0 4h.01M10.3 4.3 2.7 17.5A2 2 0 0 0 4.4 20h15.2a2 2 0 0 0 1.7-2.5L13.7 4.3a2 2 0 0 0-3.4 0Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</div>
						<div>
							<h4 class="font-semibold">{{ openIssue ? selectedIssue : 'No open delivery issue' }}</h4>
							<p class="mt-1 text-sm leading-6 text-muted-fg">
								{{ openIssue ? 'Resolve this before the courier reaches the address.' : 'The courier has the latest customer instructions.' }}
							</p>
						</div>
					</div>

					<div class="mt-4 grid gap-4">
						<DomNativeSelect v-model="selectedIssue" label="Exception type" :options="issueOptions" />
						<div class="grid gap-2 text-sm">
							<div
								v-for="check in readinessChecks"
								:key="check.label"
								class="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
							>
								<span class="text-muted-fg">{{ check.label }}</span>
								<span :class="check.passed ? 'text-success' : 'text-warning'" class="font-semibold">
									{{ check.passed ? 'Ready' : 'Needed' }}
								</span>
							</div>
						</div>
						<DomButton class="w-full" variant="secondary" :disabled="!canSave || issueResolved" @click="resolveIssue">
							{{ primaryActionLabel }}
						</DomButton>
					</div>
				</DomCard>

				<DomCard padding="lg">
					<p class="text-xs font-semibold uppercase text-muted-fg">Support log</p>
					<div class="mt-4 grid gap-3 text-sm">
						<div v-for="event in supportEvents" :key="event.label" class="flex items-start justify-between gap-3">
							<p class="leading-6 text-muted-fg">{{ event.label }}</p>
							<span class="shrink-0 font-semibold text-fg">{{ event.time }}</span>
						</div>
					</div>
				</DomCard>
			</aside>
		</div>
	</div>
</template>
