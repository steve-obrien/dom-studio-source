<script setup>
import { computed, ref, watch } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCard,
	DomCheckbox,
	DomConfirmationCodeInput,
	DomDialog,
	DomEmptyState,
	DomPasswordInput,
	DomStatusPill,
	DomTabs,
} from '@getdom/studio/vue';

const verificationMethods = [
	{
		key: 'passkey',
		label: 'Passkey',
		summary: 'Confirm with the passkey saved on this device.',
	},
	{
		key: 'totp',
		label: 'Code',
		summary: 'Enter the six-digit code from your authentication app.',
	},
	{
		key: 'password',
		label: 'Password',
		summary: 'Confirm the current account password as a fallback.',
	},
];

const sensitiveActions = [
	{
		id: 'disable_mfa',
		label: 'Disable multi-factor authentication',
		description: 'Removes the extra sign-in challenge for this account.',
		risk: 'High',
		methods: ['passkey', 'totp', 'password'],
		policy: 'Fresh proof required',
		allowRemember: false,
		status: 'Blocked',
	},
	{
		id: 'export_data',
		label: 'Export customer data',
		description: 'Creates a downloadable archive of workspace contacts and activity.',
		risk: 'Medium',
		methods: ['passkey', 'totp'],
		policy: 'Audit event required',
		allowRemember: true,
		status: 'Needs proof',
	},
	{
		id: 'rotate_key',
		label: 'Rotate production API key',
		description: 'Invalidates the active key and reveals a one-time replacement secret.',
		risk: 'High',
		methods: ['passkey', 'password'],
		policy: 'Owners notified',
		allowRemember: false,
		status: 'Blocked',
	},
];

const recentEvents = [
	{
		label: 'Passkey added',
		detail: 'MacBook Pro registered as a trusted authenticator.',
		time: 'Today, 09:14',
		tone: 'success',
	},
	{
		label: 'Export challenge expired',
		detail: 'No export token was issued after verification timed out.',
		time: '10 June, 18:42',
		tone: 'neutral',
	},
];

const dialogOpen = ref(false);
const activeActionId = ref('disable_mfa');
const activeMethod = ref('passkey');
const totpCode = ref('');
const password = ref('');
const rememberDevice = ref(false);
const passkeyState = ref('idle');
const verificationState = ref('idle');
const verificationError = ref('');
const recoveryHelpVisible = ref(false);
const verifiedActionIds = ref([]);

const activeAction = computed(getActiveAction);
const availableMethodTabs = computed(getAvailableMethodTabs);
const activeMethodDetails = computed(getActiveMethodDetails);
const activeActionUnlocked = computed(getActiveActionUnlocked);
const verifiedActions = computed(getVerifiedActions);
const verificationReady = computed(getVerificationReady);
const primaryButtonLabel = computed(getPrimaryButtonLabel);

watch(activeActionId, onActiveActionChange);
watch(activeMethod, onActiveMethodChange);
watch([totpCode, password], onCredentialInputChange);
watch(dialogOpen, onDialogVisibilityChange);

/**
 * Return the currently selected sensitive action.
 *
 * @returns {object} Selected action record.
 */
function getActiveAction() {
	return sensitiveActions.find((action) => action.id === activeActionId.value) || sensitiveActions[0];
}

/**
 * Return only the verification methods approved by the selected action policy.
 *
 * @returns {Array<object>} Tabs available for the selected action.
 */
function getAvailableMethodTabs() {
	return verificationMethods.filter((method) => activeAction.value.methods.includes(method.key));
}

/**
 * Return the user-facing description of the active verification method.
 *
 * @returns {object} Active verification method metadata.
 */
function getActiveMethodDetails() {
	return verificationMethods.find((method) => method.key === activeMethod.value) || verificationMethods[0];
}

/**
 * Report whether the selected action already has a short-lived unlock.
 *
 * @returns {boolean} True when the action has an issued token.
 */
function getActiveActionUnlocked() {
	return verifiedActionIds.value.includes(activeAction.value.id);
}

/**
 * Return the actions with active short-lived authorization tokens.
 *
 * @returns {Array<object>} Currently unlocked actions.
 */
function getVerifiedActions() {
	return sensitiveActions.filter((action) => verifiedActionIds.value.includes(action.id));
}

/**
 * Determine whether the active method has enough proof to be submitted.
 *
 * @returns {boolean} True when the verification request can be submitted.
 */
function getVerificationReady() {
	if (activeMethod.value === 'passkey') return passkeyState.value === 'approved';
	if (activeMethod.value === 'totp') return totpCode.value.length === 6;
	return password.value.length >= 8;
}

/**
 * Resolve the dialog's primary action label from the current verification state.
 *
 * @returns {string} User-facing primary action label.
 */
function getPrimaryButtonLabel() {
	if (verificationState.value === 'success') return 'Done';
	if (activeMethod.value === 'passkey' && passkeyState.value !== 'approved') return 'Use passkey first';
	return activeActionUnlocked.value ? 'Verify again' : 'Verify and unlock';
}

/**
 * Reset all method-specific draft state for a new challenge.
 *
 * @returns {void}
 */
function resetVerificationDraft() {
	totpCode.value = '';
	password.value = '';
	rememberDevice.value = false;
	passkeyState.value = 'idle';
	verificationState.value = 'idle';
	verificationError.value = '';
	recoveryHelpVisible.value = false;
}

/**
 * Keep the selected method valid when the active action changes.
 *
 * @returns {void}
 */
function onActiveActionChange() {
	resetVerificationDraft();
	if (!activeAction.value.methods.includes(activeMethod.value)) {
		activeMethod.value = activeAction.value.methods[0];
	}
}

/**
 * Clear method-specific state when the user chooses another proof method.
 *
 * @returns {void}
 */
function onActiveMethodChange() {
	totpCode.value = '';
	password.value = '';
	passkeyState.value = 'idle';
	verificationState.value = 'idle';
	verificationError.value = '';
	recoveryHelpVisible.value = false;
}

/**
 * Clear a stale server error after the user edits a credential.
 *
 * @returns {void}
 */
function onCredentialInputChange() {
	if (verificationState.value !== 'error') return;
	verificationState.value = 'idle';
	verificationError.value = '';
}

/**
 * Reset an abandoned challenge after its dialog closes.
 *
 * @param {boolean} isOpen Whether the dialog is currently open.
 * @returns {void}
 */
function onDialogVisibilityChange(isOpen) {
	if (!isOpen && verificationState.value !== 'success') resetVerificationDraft();
}

/**
 * Select an action and open a fresh verification challenge.
 *
 * @param {string} actionId Sensitive action identifier.
 * @returns {void}
 */
function selectAction(actionId) {
	if (activeActionId.value === actionId) resetVerificationDraft();
	activeActionId.value = actionId;
	dialogOpen.value = true;
}

/**
 * Open a fresh challenge for the currently selected action.
 *
 * @returns {void}
 */
function openSelectedAction() {
	resetVerificationDraft();
	dialogOpen.value = true;
}

/**
 * Simulate a successful platform passkey ceremony for this interactive example.
 *
 * @returns {void}
 */
function approvePasskey() {
	passkeyState.value = 'approved';
	verificationState.value = 'idle';
	verificationError.value = '';
}

/**
 * Validate the active proof and issue a scoped short-lived authorization.
 *
 * The reserved demonstration code 000000 intentionally returns an error so the
 * block exposes a recoverable server-rejection state without a live backend.
 *
 * @returns {void}
 */
function verifyAction() {
	if (verificationState.value === 'success') {
		dialogOpen.value = false;
		return;
	}
	if (!verificationReady.value) return;
	if (activeMethod.value === 'totp' && totpCode.value === '000000') {
		verificationState.value = 'error';
		verificationError.value = 'That code was not accepted. Check the current code in your authentication app and try again.';
		return;
	}

	verificationState.value = 'success';
	verificationError.value = '';
	if (!verifiedActionIds.value.includes(activeAction.value.id)) {
		verifiedActionIds.value = [...verifiedActionIds.value, activeAction.value.id];
	}
}

/**
 * Reveal recovery guidance without weakening the active challenge policy.
 *
 * @returns {void}
 */
function showRecoveryHelp() {
	recoveryHelpVisible.value = true;
}

/**
 * Hide the recovery guidance and return to the available proof methods.
 *
 * @returns {void}
 */
function hideRecoveryHelp() {
	recoveryHelpVisible.value = false;
}

/**
 * Revoke the demonstration unlock for an action.
 *
 * @param {string} actionId Sensitive action identifier.
 * @returns {void}
 */
function revokeUnlock(actionId) {
	verifiedActionIds.value = verifiedActionIds.value.filter((id) => id !== actionId);
}

/**
 * Return the semantic badge tone for an action risk level.
 *
 * @param {string} risk Action risk label.
 * @returns {string} DOM Studio badge tone.
 */
function getRiskTone(risk) {
	return risk === 'High' ? 'danger' : 'warning';
}

/**
 * Return the current workflow label for a sensitive action.
 *
 * @param {object} action Sensitive action record.
 * @returns {string} Current action status.
 */
function getActionStatus(action) {
	return verifiedActionIds.value.includes(action.id) ? 'Unlocked for 5m' : action.status;
}

/**
 * Return the semantic status tone for a sensitive action.
 *
 * @param {object} action Sensitive action record.
 * @returns {string} DOM Studio status tone.
 */
function getActionStatusTone(action) {
	if (verifiedActionIds.value.includes(action.id)) return 'success';
	return action.risk === 'High' ? 'danger' : 'warning';
}

/**
 * Format method identifiers as readable verification choices.
 *
 * @param {Array<string>} methods Allowed method identifiers.
 * @returns {string} Human-readable method list.
 */
function formatMethods(methods) {
	return methods
		.map((method) => verificationMethods.find((item) => item.key === method)?.label || method)
		.join(' · ');
}
</script>

<template>
	<div class="min-h-dvh w-full bg-canvas text-canvas-fg">
		<header class="border-b border-border bg-canvas">
			<div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-start md:justify-between">
				<div class="max-w-2xl">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Account security</p>
					<h3 class="mt-2 text-2xl font-semibold tracking-tight">Protect high-risk changes with fresh verification</h3>
					<p class="mt-2 text-sm leading-6 text-muted-fg">
						Choose a sensitive action, verify with an approved method, and issue a short-lived unlock scoped to that change.
					</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<DomStatusPill tone="success" label="Signed in" />
					<DomStatusPill
						:tone="verifiedActions.length ? 'success' : 'neutral'"
						:label="verifiedActions.length ? `${verifiedActions.length} active unlock` : 'No active unlock'"
						:dot="Boolean(verifiedActions.length)"
					/>
				</div>
			</div>
		</header>

		<main class="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
			<section class="min-w-0">
				<div class="mb-3">
					<h4 class="font-semibold">Sensitive actions</h4>
					<p class="mt-1 text-sm text-muted-fg">Each unlock is limited to one action and expires after five minutes.</p>
				</div>

				<DomCard padding="none">
					<article
						v-for="(action, index) in sensitiveActions"
						:key="action.id"
						class="p-4 sm:p-5"
						:class="[
							index && 'border-t border-border',
							activeActionId === action.id && 'bg-secondary/35',
						]"
					>
						<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<DomBadge :tone="getRiskTone(action.risk)" size="sm">{{ action.risk }} risk</DomBadge>
									<DomStatusPill
										:tone="getActionStatusTone(action)"
										:label="getActionStatus(action)"
										size="sm"
									/>
								</div>
								<h5 class="mt-3 font-semibold">{{ action.label }}</h5>
								<p class="mt-1 text-sm leading-6 text-muted-fg">{{ action.description }}</p>
							</div>
							<DomButton
								class="w-full shrink-0 sm:w-auto"
								size="sm"
								:variant="verifiedActionIds.includes(action.id) ? 'secondary' : 'primary'"
								@click="selectAction(action.id)"
							>
								{{ verifiedActionIds.includes(action.id) ? 'Verify again' : 'Verify' }}
							</DomButton>
						</div>
						<div class="mt-4 grid gap-2 border-t border-border pt-3 text-xs sm:grid-cols-2">
							<p>
								<span class="text-muted-fg">Methods</span>
								<span class="ml-2 font-medium">{{ formatMethods(action.methods) }}</span>
							</p>
							<p>
								<span class="text-muted-fg">Policy</span>
								<span class="ml-2 font-medium">{{ action.policy }}</span>
							</p>
						</div>
					</article>
				</DomCard>
			</section>

			<aside class="space-y-4">
				<DomCard padding="p-4 sm:p-5">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Selected challenge</p>
							<h4 class="mt-2 font-semibold">{{ activeAction.label }}</h4>
						</div>
						<DomBadge :tone="getRiskTone(activeAction.risk)" size="sm">{{ activeAction.risk }}</DomBadge>
					</div>
					<dl class="mt-4 divide-y divide-border border-y border-border text-sm">
						<div class="flex items-center justify-between gap-4 py-3">
							<dt class="text-muted-fg">Accepted proof</dt>
							<dd class="text-right font-medium">{{ formatMethods(activeAction.methods) }}</dd>
						</div>
						<div class="flex items-center justify-between gap-4 py-3">
							<dt class="text-muted-fg">Unlock scope</dt>
							<dd class="font-medium">This action only</dd>
						</div>
						<div class="flex items-center justify-between gap-4 py-3">
							<dt class="text-muted-fg">Expires</dt>
							<dd class="font-medium">5 minutes</dd>
						</div>
					</dl>
					<DomButton class="mt-4 w-full" @click="openSelectedAction">
						{{ activeActionUnlocked ? 'Verify again' : 'Start verification' }}
					</DomButton>
				</DomCard>

				<DomCard padding="p-4 sm:p-5">
					<div class="flex items-center justify-between gap-3">
						<h4 class="font-semibold">Active unlocks</h4>
						<DomBadge tone="neutral" size="sm">{{ verifiedActions.length }}</DomBadge>
					</div>
					<DomEmptyState
						v-if="!verifiedActions.length"
						class="mt-4"
						title="Nothing unlocked"
						description="Complete a fresh verification to continue one sensitive action."
						align="left"
						size="sm"
					/>
					<div v-else class="mt-4 divide-y divide-border border-y border-border">
						<div v-for="action in verifiedActions" :key="action.id" class="py-3">
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="text-sm font-medium">{{ action.label }}</p>
									<DomStatusPill class="mt-2" tone="success" label="Expires in 4m 42s" size="sm" />
								</div>
								<DomButton size="sm" variant="ghost" @click="revokeUnlock(action.id)">Revoke</DomButton>
							</div>
						</div>
					</div>
				</DomCard>

				<DomCard padding="p-4 sm:p-5">
					<h4 class="font-semibold">Recent security events</h4>
					<div class="mt-3 divide-y divide-border">
						<div v-for="event in recentEvents" :key="event.label" class="py-3 first:pt-0 last:pb-0">
							<div class="flex items-center justify-between gap-3">
								<p class="text-sm font-medium">{{ event.label }}</p>
								<DomStatusPill :tone="event.tone" :label="event.time" size="sm" :dot="false" />
							</div>
							<p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.detail }}</p>
						</div>
					</div>
				</DomCard>
			</aside>
		</main>

		<DomDialog
			v-model="dialogOpen"
			size="lg"
			:title="verificationState === 'success' ? 'Verification complete' : `Verify to ${activeAction.label.toLowerCase()}`"
			:description="verificationState === 'success'
				? 'A short-lived authorization is ready for this action.'
				: 'Use one of the methods approved by the current security policy.'"
		>
			<div v-if="verificationState === 'success'" class="space-y-4">
				<DomAlert
					tone="success"
					title="Action unlocked for five minutes"
					:description="`${activeAction.label} can now continue. The token cannot authorize another account change.`"
				/>
				<dl class="divide-y divide-border border-y border-border text-sm">
					<div class="flex items-center justify-between gap-4 py-3">
						<dt class="text-muted-fg">Verified with</dt>
						<dd class="font-medium">{{ activeMethodDetails.label }}</dd>
					</div>
					<div class="flex items-center justify-between gap-4 py-3">
						<dt class="text-muted-fg">Expires</dt>
						<dd class="font-medium">4m 42s</dd>
					</div>
					<div class="flex items-center justify-between gap-4 py-3">
						<dt class="text-muted-fg">Scope</dt>
						<dd class="text-right font-medium">{{ activeAction.label }}</dd>
					</div>
				</dl>
			</div>

			<div v-else class="space-y-4">
				<DomAlert
					:tone="activeAction.risk === 'High' ? 'warning' : 'info'"
					:title="activeAction.label"
					:description="`${activeAction.risk} risk · ${activeAction.policy}`"
					:icon="false"
				/>

				<DomTabs v-model="activeMethod" :tabs="availableMethodTabs">
					<template #passkey>
						<div class="space-y-3">
							<DomAlert
								:tone="passkeyState === 'approved' ? 'success' : 'info'"
								:title="passkeyState === 'approved' ? 'Passkey confirmed' : 'Use the passkey on this device'"
								:description="activeMethodDetails.summary"
							/>
							<DomButton
								class="w-full"
								:variant="passkeyState === 'approved' ? 'secondary' : 'primary'"
								:disabled="passkeyState === 'approved'"
								@click="approvePasskey"
							>
								{{ passkeyState === 'approved' ? 'Passkey confirmed' : 'Use passkey' }}
							</DomButton>
						</div>
					</template>

					<template #totp>
						<DomConfirmationCodeInput
							v-model="totpCode"
							label="Authentication code"
							description="Enter the six-digit code from your authentication app. Use 000000 to preview a rejected code."
							character-set="numeric"
							:invalid="verificationState === 'error'"
							:errors="verificationError"
						/>
					</template>

					<template #password>
						<DomPasswordInput
							v-model="password"
							label="Account password"
							description="Enter at least eight characters for this interactive example."
							placeholder="Enter current password"
						/>
					</template>
				</DomTabs>

				<div v-if="activeAction.allowRemember" class="rounded-lg border border-border p-3">
					<DomCheckbox v-model="rememberDevice" label="Remember this device for lower-risk actions" />
				</div>
				<DomAlert
					v-else
					tone="neutral"
					title="Device remembering is unavailable"
					description="High-risk changes always require fresh proof, even on a trusted device."
					:icon="false"
				/>

				<DomAlert
					v-if="recoveryHelpVisible"
					tone="warning"
					title="Recovery uses a separate trust check"
					description="Cancel this challenge and start account recovery. Recovery cannot issue a token for the current sensitive action."
				>
					<template #actions>
						<DomButton size="sm" variant="secondary" @click="hideRecoveryHelp">Back to verification</DomButton>
					</template>
				</DomAlert>
				<DomButton v-else size="sm" variant="ghost" @click="showRecoveryHelp">
					I can’t use these methods
				</DomButton>
			</div>

			<template #footer>
				<DomButton v-if="verificationState !== 'success'" data-close variant="secondary">Cancel</DomButton>
				<DomButton
					:disabled="verificationState !== 'success' && !verificationReady"
					@click="verifyAction"
				>
					{{ primaryButtonLabel }}
				</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
