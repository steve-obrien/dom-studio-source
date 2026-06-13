<script setup>
import { computed, ref, watch } from 'vue';
import {
	DomButton,
	DomCheckbox,
	DomDialog,
	DomPasswordInput,
	DomTabs,
	DomTextInput,
	DomToggle,
	DomTooltip,
} from '@getdom/studio/vue';

const verificationTabs = [
	{ key: 'passkey', label: 'Passkey' },
	{ key: 'totp', label: 'Code' },
	{ key: 'password', label: 'Password' },
];

const sensitiveActions = [
	{
		id: 'disable_mfa',
		label: 'Disable multi-factor authentication',
		description: 'Removes the extra sign-in challenge for this account.',
		risk: 'High',
		methods: ['passkey', 'totp', 'password'],
		confirmation: 'Fresh verification required',
		status: 'Blocked',
	},
	{
		id: 'export_data',
		label: 'Export customer data',
		description: 'Creates a downloadable file containing workspace contacts and activity.',
		risk: 'Medium',
		methods: ['passkey', 'totp'],
		confirmation: 'Audit log entry created',
		status: 'Needs proof',
	},
	{
		id: 'rotate_key',
		label: 'Rotate production API key',
		description: 'Invalidates the active key and reveals a one-time replacement secret.',
		risk: 'High',
		methods: ['passkey', 'password'],
		confirmation: 'Webhook owners notified',
		status: 'Blocked',
	},
];

const recentEvents = [
	{ label: 'Passkey added', detail: 'MacBook Pro registered as a trusted authenticator.', time: 'Today 09:14' },
	{ label: 'Admin role updated', detail: 'Olivia promoted Ari to workspace admin after step-up.', time: 'Yesterday 16:02' },
	{ label: 'Export cancelled', detail: 'Verification expired before the export token was issued.', time: 'Jun 10, 18:42' },
];

const dialogOpen = ref(false);
const activeActionId = ref('disable_mfa');
const activeMethod = ref('passkey');
const totpCode = ref('');
const password = ref('');
const rememberDevice = ref(true);
const passkeyState = ref('idle');
const verifiedActionIds = ref([]);
const submitted = ref(false);

const activeAction = computed(() => sensitiveActions.find((action) => action.id === activeActionId.value) || sensitiveActions[0]);
const activeMethodAllowed = computed(() => activeAction.value.methods.includes(activeMethod.value));
const methodSummary = computed(() => {
	if (activeMethod.value === 'passkey') return 'Uses the platform authenticator on this device.';
	if (activeMethod.value === 'totp') return 'Uses a six-digit code from the user authentication app.';
	return 'Uses the account password as a fallback proof.';
});
const verificationReady = computed(() => {
	if (!activeMethodAllowed.value) return false;
	if (activeMethod.value === 'passkey') return passkeyState.value === 'approved';
	if (activeMethod.value === 'totp') return totpCode.value.replace(/\D/g, '').length === 6;
	return password.value.length >= 8;
});
const verifiedActions = computed(() => sensitiveActions.filter((action) => verifiedActionIds.value.includes(action.id)));
const challengePayload = computed(() => ({
	actionId: activeAction.value.id,
	method: activeMethod.value,
	rememberDevice: rememberDevice.value,
	verified: verificationReady.value,
	expiresIn: '4m 42s',
}));
const challengePayloadJson = computed(() => JSON.stringify(challengePayload.value, null, 2));
const primaryButtonLabel = computed(() => {
	if (submitted.value) return 'Verification complete';
	if (activeMethod.value === 'passkey' && passkeyState.value !== 'approved') return 'Approve passkey first';
	return 'Unlock action';
});

watch(activeActionId, () => {
	submitted.value = false;
	passkeyState.value = 'idle';
	totpCode.value = '';
	password.value = '';
	if (!activeAction.value.methods.includes(activeMethod.value)) {
		activeMethod.value = activeAction.value.methods[0];
	}
});

watch(activeMethod, () => {
	submitted.value = false;
	passkeyState.value = 'idle';
	totpCode.value = '';
	password.value = '';
});

function selectAction(actionId) {
	activeActionId.value = actionId;
	dialogOpen.value = true;
}

function approvePasskey() {
	passkeyState.value = 'approved';
}

function unlockAction() {
	if (!verificationReady.value) return;
	submitted.value = true;
	if (!verifiedActionIds.value.includes(activeAction.value.id)) {
		verifiedActionIds.value = [...verifiedActionIds.value, activeAction.value.id];
	}
}

function riskClasses(risk) {
	if (risk === 'High') return 'bg-destructive/15 text-destructive';
	return 'bg-warning/15 text-warning';
}

function actionStatus(action) {
	if (verifiedActionIds.value.includes(action.id)) return 'Unlocked';
	return action.status;
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-lg border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<section class="grid min-h-[680px] gap-0 lg:grid-cols-[minmax(0,1fr)_24rem]">
			<div class="flex min-w-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
				<header class="skin-card px-5 py-5 sm:px-7">
					<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
						<div class="max-w-2xl">
							<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Step-up security</p>
							<h3 class="mt-2 text-2xl font-semibold tracking-tight">Require fresh proof before risky changes</h3>
							<p class="mt-2 text-sm leading-6 text-muted-fg">
								Use this pattern when a signed-in session is not enough. Users get clear risk context, method choice, and a short-lived unlock for the exact action.
							</p>
						</div>
						<div class="flex flex-wrap gap-2">
							<span class="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">Session trusted</span>
							<span class="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">Token expires in 5m</span>
						</div>
					</div>
				</header>

				<div class="grid flex-1 gap-5 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_18rem]">
					<div class="space-y-4">
						<div
							v-for="action in sensitiveActions"
							:key="action.id"
							class="rounded-lg border border-border bg-canvas p-4 transition"
							:class="activeActionId === action.id ? 'shadow-lg shadow-black/10 ring-2 ring-primary/20' : 'hover:bg-secondary/30'"
						>
							<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
								<div class="min-w-0">
									<div class="flex flex-wrap items-center gap-2">
										<span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="riskClasses(action.risk)">
											{{ action.risk }} risk
										</span>
										<span class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg">
											{{ actionStatus(action) }}
										</span>
									</div>
									<h4 class="mt-3 text-lg font-semibold tracking-tight">{{ action.label }}</h4>
									<p class="mt-2 text-sm leading-6 text-muted-fg">{{ action.description }}</p>
								</div>
								<DomButton class="shrink-0" size="sm" :variant="verifiedActionIds.includes(action.id) ? 'secondary' : 'primary'" @click="selectAction(action.id)">
									{{ verifiedActionIds.includes(action.id) ? 'Reverify' : 'Verify' }}
								</DomButton>
							</div>
							<div class="mt-4 grid gap-3 text-sm md:grid-cols-3">
								<div class="rounded-lg bg-secondary px-3 py-2">
									<p class="text-xs text-muted-fg">Allowed methods</p>
									<p class="mt-1 font-semibold">{{ action.methods.join(', ') }}</p>
								</div>
								<div class="rounded-lg bg-secondary px-3 py-2">
									<p class="text-xs text-muted-fg">Server policy</p>
									<p class="mt-1 font-semibold">{{ action.confirmation }}</p>
								</div>
								<div class="rounded-lg bg-secondary px-3 py-2">
									<p class="text-xs text-muted-fg">Audit level</p>
									<p class="mt-1 font-semibold">Actor, device, result</p>
								</div>
							</div>
						</div>
					</div>

					<aside class="space-y-4">
						<div class="rounded-lg border border-border skin-card p-4">
							<div class="flex items-start justify-between gap-3">
								<div>
									<h4 class="font-semibold">Current challenge</h4>
									<p class="mt-1 text-sm leading-6 text-muted-fg">Bind the proof to one action.</p>
								</div>
								<DomTooltip content="Never let a step-up token authorize a different action than the one requested.">
									<span class="grid size-8 place-items-center rounded-full bg-secondary text-sm font-semibold text-muted-fg">?</span>
								</DomTooltip>
							</div>
							<div class="mt-4 space-y-3 text-sm">
								<div class="flex items-center justify-between gap-3">
									<span class="text-muted-fg">Action</span>
									<span class="truncate font-semibold">{{ activeAction.label }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span class="text-muted-fg">Method</span>
									<span class="font-semibold capitalize">{{ activeMethod }}</span>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span class="text-muted-fg">Fresh proof</span>
									<span class="font-semibold">{{ verificationReady ? 'Ready' : 'Missing' }}</span>
								</div>
							</div>
							<DomButton class="mt-4 w-full" @click="dialogOpen = true">Open verification</DomButton>
						</div>

						<div class="rounded-lg border border-border p-4">
							<h4 class="font-semibold">Verified actions</h4>
							<div class="mt-4 space-y-3">
								<div v-if="!verifiedActions.length" class="rounded-lg border border-dashed border-border p-4 text-sm leading-6 text-muted-fg">
									No sensitive action is unlocked yet.
								</div>
								<div v-for="action in verifiedActions" :key="action.id" class="flex gap-3 rounded-lg bg-success/10 p-3 text-sm">
									<span class="mt-1 size-2 rounded-full bg-success"></span>
									<div>
										<p class="font-semibold text-success">{{ action.label }}</p>
										<p class="mt-1 text-xs text-muted-fg">Short-lived authorization token issued.</p>
									</div>
								</div>
							</div>
						</div>

						<div class="rounded-lg border border-border p-4">
							<h4 class="font-semibold">Recent security events</h4>
							<div class="mt-4 space-y-3">
								<div v-for="event in recentEvents" :key="event.label" class="flex gap-3 text-sm">
									<span class="mt-2 size-2 rounded-full bg-primary"></span>
									<div>
										<p class="font-medium">{{ event.label }}</p>
										<p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.detail }}</p>
										<p class="mt-1 text-xs font-medium text-muted-fg">{{ event.time }}</p>
									</div>
								</div>
							</div>
						</div>
					</aside>
				</div>
			</div>

			<aside class="bg-secondary/35 p-5 sm:p-7">
				<div class="mx-auto max-w-md rounded-lg border border-border bg-canvas p-5 shadow-xl shadow-black/10">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Preview state</p>
							<h4 class="mt-2 text-xl font-semibold">Unlock request</h4>
						</div>
						<span class="rounded-full px-3 py-1 text-xs font-semibold" :class="riskClasses(activeAction.risk)">
							{{ activeAction.risk }}
						</span>
					</div>
					<div class="mt-5 rounded-lg border border-border p-4">
						<p class="text-sm font-semibold">{{ activeAction.label }}</p>
						<p class="mt-2 text-sm leading-6 text-muted-fg">{{ activeAction.description }}</p>
					</div>
					<div class="mt-5 space-y-3">
						<DomToggle v-model="rememberDevice" label="Remember this trusted device" />
						<p class="text-xs leading-5 text-muted-fg">Device remembering should still be controlled by server risk policy and recent account activity.</p>
					</div>
					<pre class="mt-5 max-h-56 overflow-auto rounded-lg bg-canvas-fg p-4 text-xs leading-5 text-canvas">{{ challengePayloadJson }}</pre>
				</div>
			</aside>
		</section>

		<DomDialog v-model="dialogOpen" :title="`Verify to ${activeAction.label.toLowerCase()}`" description="Choose an approved method for this action. Successful verification issues a short-lived token for this exact change.">
			<div class="space-y-4">
				<div class="rounded-lg border border-border bg-secondary/50 p-3 text-sm">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="font-semibold">{{ activeAction.label }}</p>
							<p class="mt-1 leading-5 text-muted-fg">{{ activeAction.description }}</p>
						</div>
						<span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" :class="riskClasses(activeAction.risk)">
							{{ activeAction.risk }}
						</span>
					</div>
				</div>

				<DomTabs v-model="activeMethod" :tabs="verificationTabs">
					<template #passkey>
						<div class="space-y-4">
							<div class="rounded-lg border border-border p-4 text-center">
								<div class="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
									<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
										<path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 0v9m0-4h4m-4-3h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</div>
								<p class="mt-3 text-sm font-semibold">Use device passkey</p>
								<p class="mt-2 text-sm leading-6 text-muted-fg">{{ methodSummary }}</p>
								<DomButton class="mt-4 w-full" :variant="passkeyState === 'approved' ? 'secondary' : 'primary'" :disabled="!activeMethodAllowed" @click="approvePasskey">
									{{ passkeyState === 'approved' ? 'Passkey approved' : 'Simulate passkey approval' }}
								</DomButton>
							</div>
						</div>
					</template>

					<template #totp>
						<div class="space-y-4">
							<DomTextInput v-model="totpCode" label="Authentication code" placeholder="123456" maxlength="6" inputmode="numeric" :disabled="!activeMethodAllowed" />
							<p class="text-sm leading-6 text-muted-fg">{{ methodSummary }}</p>
						</div>
					</template>

					<template #password>
						<div class="space-y-4">
							<DomPasswordInput v-model="password" label="Account password" placeholder="Enter current password" :disabled="!activeMethodAllowed" />
							<p class="text-sm leading-6 text-muted-fg">{{ methodSummary }}</p>
						</div>
					</template>
				</DomTabs>

				<div v-if="!activeMethodAllowed" class="rounded-lg bg-warning/10 p-3 text-sm leading-6 text-warning">
					This method is not allowed for the selected action. Choose one of: {{ activeAction.methods.join(', ') }}.
				</div>

				<div class="rounded-lg border border-border p-3">
					<DomCheckbox v-model="rememberDevice" label="Remember this device for lower-risk actions" />
				</div>

				<div class="grid gap-2 rounded-lg bg-secondary p-3 text-sm">
					<div class="flex items-center justify-between gap-3">
						<span class="text-muted-fg">Challenge expires</span>
						<span class="font-semibold">4m 42s</span>
					</div>
					<div class="flex items-center justify-between gap-3">
						<span class="text-muted-fg">Fresh proof</span>
						<span class="font-semibold">{{ verificationReady ? 'Ready' : 'Required' }}</span>
					</div>
					<div class="flex items-center justify-between gap-3">
						<span class="text-muted-fg">Result</span>
						<span class="font-semibold">{{ submitted ? 'Token issued' : 'Waiting' }}</span>
					</div>
				</div>
			</div>
			<template #footer>
				<DomButton data-close variant="secondary">Cancel</DomButton>
				<DomButton :disabled="!verificationReady || submitted" @click="unlockAction">{{ primaryButtonLabel }}</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
