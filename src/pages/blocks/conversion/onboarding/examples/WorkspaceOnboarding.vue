<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomCard } from '@getdom/studio/vue';

const step = ref(0);
const selectedGoals = ref(['Import data', 'Invite team']);
const workspaceName = ref('Northstar Product');
const selectedPlan = ref('team');
const inviteEmail = ref('');
const invites = ref(['maya@example.com', 'sam@example.com']);

const steps = [
	{ label: 'Workspace', description: 'Name the account and pick the right starting point.' },
	{ label: 'Goals', description: 'Tune the first-run experience to what the user wants done.' },
	{ label: 'Team', description: 'Invite collaborators before the workspace feels empty.' },
	{ label: 'Launch', description: 'Confirm the setup and guide the next action.' },
];

const plans = [
	{ value: 'solo', label: 'Solo', description: 'Personal workspace for one builder.' },
	{ value: 'team', label: 'Team', description: 'Shared projects, roles, and review flows.' },
	{ value: 'scale', label: 'Scale', description: 'SSO, audit history, and advanced controls.' },
];

const goals = ['Import data', 'Invite team', 'Publish a portal', 'Connect billing', 'Review analytics'];
const progress = computed(() => Math.round(((step.value + 1) / steps.length) * 100));
const isFirstStep = computed(() => step.value === 0);
const isLastStep = computed(() => step.value === steps.length - 1);
const selectedPlanLabel = computed(() => plans.find((plan) => plan.value === selectedPlan.value)?.label || 'Team');

function toggleGoal(goal) {
	selectedGoals.value = selectedGoals.value.includes(goal)
		? selectedGoals.value.filter((item) => item !== goal)
		: [...selectedGoals.value, goal];
}

function addInvite() {
	const nextInvite = inviteEmail.value.trim();
	if (!nextInvite || invites.value.includes(nextInvite)) return;
	invites.value = [...invites.value, nextInvite];
	inviteEmail.value = '';
}

function removeInvite(email) {
	invites.value = invites.value.filter((invite) => invite !== email);
}

function goBack() {
	if (!isFirstStep.value) step.value -= 1;
}

function goNext() {
	if (!isLastStep.value) step.value += 1;
}
</script>

<template>
	<div class="w-full max-w-5xl mx-auto overflow-hidden rounded-3xl border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<div class="grid min-h-[38rem] lg:grid-cols-[18rem_1fr]">
			<aside class="border-b border-border skin-card p-5 lg:border-b-0 lg:border-r">
				<div class="flex items-center gap-3">
					<span class="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-sm font-bold text-primary-fg">NS</span>
					<div class="min-w-0">
						<p class="truncate text-sm font-semibold tracking-tight">Northstar</p>
						<p class="text-xs text-muted-fg">Workspace setup</p>
					</div>
				</div>

				<div class="mt-6">
					<div class="h-2 overflow-hidden rounded-full bg-secondary">
						<div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${progress}%` }"></div>
					</div>
					<p class="mt-2 text-xs font-medium text-muted-fg">{{ progress }}% complete</p>
				</div>

				<ol class="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
					<li v-for="(item, index) in steps" :key="item.label">
						<button
							type="button"
							class="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-secondary"
							:class="index === step ? 'bg-secondary text-secondary-fg' : 'text-muted-fg'"
							@click="step = index"
						>
							<span
								class="grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold"
								:class="index <= step ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-canvas text-muted-fg'"
							>
								{{ index + 1 }}
							</span>
							<span class="min-w-0">
								<span class="block text-sm font-semibold">{{ item.label }}</span>
								<span class="mt-0.5 hidden text-xs leading-5 text-muted-fg lg:block">{{ item.description }}</span>
							</span>
						</button>
					</li>
				</ol>
			</aside>

			<section class="flex min-w-0 flex-col">
				<header class="border-b border-border px-5 py-4 sm:px-8">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Onboarding</p>
					<h3 class="mt-1 text-2xl font-semibold tracking-tight">{{ steps[step].label }}</h3>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">{{ steps[step].description }}</p>
				</header>

				<div class="flex-1 p-5 sm:p-8">
					<div v-if="step === 0" class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
						<div class="space-y-5">
							<label class="block">
								<span class="text-sm font-medium">Workspace name</span>
								<input
									v-model="workspaceName"
									class="mt-2 block w-full rounded-xl border border-input bg-canvas px-3 py-2.5 text-sm outline-none transition placeholder:text-muted-fg focus:border-ring focus:ring-2 focus:ring-ring/20"
									placeholder="Acme customer portal"
								/>
							</label>

							<div>
								<p class="text-sm font-medium">Starting plan</p>
								<div class="mt-2 grid gap-3">
									<button
										v-for="plan in plans"
										:key="plan.value"
										type="button"
										class="rounded-2xl border p-4 text-left transition hover:border-ring"
										:class="selectedPlan === plan.value ? 'border-primary bg-primary/10' : 'border-border bg-canvas'"
										@click="selectedPlan = plan.value"
									>
										<span class="flex items-center justify-between gap-3">
											<span class="font-semibold">{{ plan.label }}</span>
											<span v-if="selectedPlan === plan.value" class="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-fg">Selected</span>
										</span>
										<span class="mt-1 block text-sm leading-6 text-muted-fg">{{ plan.description }}</span>
									</button>
								</div>
							</div>
						</div>

						<DomCard class="self-start">
							<p class="text-sm font-semibold">Why this step matters</p>
							<p class="mt-2 text-sm leading-6 text-muted-fg">Keep setup short, but capture the account shape early. It helps route users into the right empty states, default permissions, and upgrade path.</p>
						</DomCard>
					</div>

					<div v-else-if="step === 1" class="space-y-4">
						<div class="grid gap-3 sm:grid-cols-2">
							<button
								v-for="goal in goals"
								:key="goal"
								type="button"
								class="flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition hover:border-ring"
								:class="selectedGoals.includes(goal) ? 'border-primary bg-primary/10' : 'border-border bg-canvas'"
								@click="toggleGoal(goal)"
							>
								<span class="font-medium">{{ goal }}</span>
								<span
									class="grid size-6 shrink-0 place-items-center rounded-full border text-xs"
									:class="selectedGoals.includes(goal) ? 'border-primary bg-primary text-primary-fg' : 'border-border text-muted-fg'"
								>
									<svg v-if="selectedGoals.includes(goal)" class="size-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
										<path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</span>
							</button>
						</div>
						<p class="text-sm leading-6 text-muted-fg">Use these selections to personalize the dashboard, checklist, and first email sequence after signup.</p>
					</div>

					<div v-else-if="step === 2" class="space-y-5">
						<form class="flex flex-col gap-3 sm:flex-row" @submit.prevent="addInvite">
							<label class="min-w-0 flex-1">
								<span class="sr-only">Invite email</span>
								<input
									v-model="inviteEmail"
									type="email"
									class="block w-full rounded-xl border border-input bg-canvas px-3 py-2.5 text-sm outline-none transition placeholder:text-muted-fg focus:border-ring focus:ring-2 focus:ring-ring/20"
									placeholder="teammate@example.com"
								/>
							</label>
							<DomButton type="submit">Add invite</DomButton>
						</form>

						<div class="overflow-hidden rounded-2xl border border-border">
							<div v-for="invite in invites" :key="invite" class="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0">
								<div class="min-w-0">
									<p class="truncate text-sm font-medium">{{ invite }}</p>
									<p class="text-xs text-muted-fg">Editor access</p>
								</div>
								<button type="button" class="rounded-lg px-2 py-1 text-sm text-muted-fg hover:bg-secondary hover:text-canvas-fg" @click="removeInvite(invite)">Remove</button>
							</div>
						</div>
					</div>

					<div v-else class="grid gap-5 lg:grid-cols-3">
						<DomCard class="lg:col-span-2">
							<p class="text-sm font-semibold">Ready to launch</p>
							<dl class="mt-4 grid gap-4 sm:grid-cols-3">
								<div>
									<dt class="text-xs font-medium uppercase tracking-[0.14em] text-muted-fg">Workspace</dt>
									<dd class="mt-1 text-sm font-semibold">{{ workspaceName || 'Untitled workspace' }}</dd>
								</div>
								<div>
									<dt class="text-xs font-medium uppercase tracking-[0.14em] text-muted-fg">Plan</dt>
									<dd class="mt-1 text-sm font-semibold">{{ selectedPlanLabel }}</dd>
								</div>
								<div>
									<dt class="text-xs font-medium uppercase tracking-[0.14em] text-muted-fg">Invites</dt>
									<dd class="mt-1 text-sm font-semibold">{{ invites.length }}</dd>
								</div>
							</dl>
							<div class="mt-5 flex flex-wrap gap-2">
								<span v-for="goal in selectedGoals" :key="goal" class="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-fg">{{ goal }}</span>
							</div>
						</DomCard>

						<DomCard>
							<p class="text-sm font-semibold">Next best action</p>
							<p class="mt-2 text-sm leading-6 text-muted-fg">Send the user straight to the first task that matches their goals, not a blank dashboard.</p>
							<DomButton class="mt-4 w-full">Open workspace</DomButton>
						</DomCard>
					</div>
				</div>

				<footer class="flex flex-col-reverse gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
					<DomButton variant="secondary" :disabled="isFirstStep" @click="goBack">Back</DomButton>
					<div class="flex items-center justify-between gap-3 sm:justify-end">
						<p class="text-sm text-muted-fg">Step {{ step + 1 }} of {{ steps.length }}</p>
						<DomButton v-if="!isLastStep" @click="goNext">Continue</DomButton>
						<DomButton v-else>Finish setup</DomButton>
					</div>
				</footer>
			</section>
		</div>
	</div>
</template>
