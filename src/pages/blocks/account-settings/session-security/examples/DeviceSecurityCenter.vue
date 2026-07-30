<script setup>
import { computed, ref, watch } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCard,
	DomDialog,
	DomEmptyState,
	DomProgress,
	DomSelect,
	DomStatusPill,
	DomTabs,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const securityTabs = [
	{ key: 'sessions', label: 'Sessions' },
	{ key: 'protection', label: 'Protection' },
	{ key: 'activity', label: 'Activity' },
];

const account = ref({
	name: 'Olivia Carter',
	email: 'olivia@northstar.example',
	mfaEnabled: true,
	passkeySignIn: true,
	loginAlerts: true,
});

const sessions = ref([
	{
		id: 'macbook',
		device: 'MacBook Pro',
		browser: 'Safari 18',
		platform: 'macOS',
		location: 'London, UK',
		ip: '81.2.69.142',
		lastActive: 'Active now',
		firstSeen: '18 May',
		trusted: true,
		current: true,
		risk: 'Low',
		status: 'Active',
	},
	{
		id: 'iphone',
		device: 'iPhone 16',
		browser: 'DOM Studio iOS',
		platform: 'iOS',
		location: 'Manchester, UK',
		ip: '92.40.214.18',
		lastActive: '18 minutes ago',
		firstSeen: '1 June',
		trusted: true,
		current: false,
		risk: 'Low',
		status: 'Active',
	},
	{
		id: 'windows',
		device: 'Windows workstation',
		browser: 'Chrome 137',
		platform: 'Windows',
		location: 'Berlin, DE',
		ip: '185.220.101.12',
		lastActive: 'Yesterday, 22:48',
		firstSeen: 'Yesterday',
		trusted: false,
		current: false,
		risk: 'Review',
		status: 'Active',
	},
	{
		id: 'tablet',
		device: 'Shared tablet',
		browser: 'Firefox 139',
		platform: 'Android',
		location: 'Paris, FR',
		ip: '51.158.172.165',
		lastActive: '4 days ago',
		firstSeen: '9 April',
		trusted: false,
		current: false,
		risk: 'Medium',
		status: 'Expired',
	},
]);

const recoveryItems = [
	{
		key: 'passkeys',
		label: 'Passkeys',
		value: '2 registered',
		status: 'Ready',
		detail: 'MacBook Pro and iPhone 16 can sign in without a password.',
	},
	{
		key: 'backup',
		label: 'Backup codes',
		value: '6 remaining',
		status: 'Review soon',
		detail: 'Generate a new set before the remaining supply becomes low.',
	},
	{
		key: 'email',
		label: 'Recovery email',
		value: 'Verified',
		status: 'Ready',
		detail: 'olivia.recovery@example.com receives account recovery links.',
	},
	{
		key: 'phone',
		label: 'Recovery phone',
		value: 'Not added',
		status: 'Missing',
		detail: 'Add a verified phone number for another recovery route.',
	},
];

const securityEvents = ref([
	{
		id: 1,
		type: 'sign-in',
		label: 'Current device signed in',
		detail: 'Safari 18 on macOS from London, UK.',
		time: 'Today, 08:14',
		tone: 'success',
	},
	{
		id: 2,
		type: 'setting',
		label: 'Login alerts enabled',
		detail: 'Security alerts will send for new devices and recovery changes.',
		time: 'Yesterday, 16:02',
		tone: 'primary',
	},
	{
		id: 3,
		type: 'review',
		label: 'Untrusted Windows session detected',
		detail: 'Chrome 137 from Berlin has not completed device trust.',
		time: 'Yesterday, 22:48',
		tone: 'warning',
	},
	{
		id: 4,
		type: 'recovery',
		label: 'Backup code used',
		detail: 'One backup code was used during account recovery.',
		time: '6 June, 11:30',
		tone: 'neutral',
	},
]);

const eventOptions = [
	{
		label: 'All activity',
		value: 'all',
		description: 'Sign-ins, account settings, reviews, recovery, and session actions.',
	},
	{
		label: 'Sign-ins',
		value: 'sign-in',
		description: 'Successful and unsuccessful authentication events.',
	},
	{
		label: 'Account settings',
		value: 'setting',
		description: 'Changes to MFA, passkeys, alerts, and device trust.',
	},
	{
		label: 'Needs review',
		value: 'review',
		description: 'Events that may require an account-owner decision.',
	},
	{
		label: 'Recovery',
		value: 'recovery',
		description: 'Backup-code and recovery-method activity.',
	},
	{
		label: 'Session actions',
		value: 'session',
		description: 'Renamed, trusted, and revoked device sessions.',
	},
];

const activeTab = ref('sessions');
const activeSessionId = ref('macbook');
const eventFilter = ref('all');
const securityCheckState = ref('idle');
const downloadState = ref('idle');
const sessionNotice = ref('');
const recoveryNotice = ref('');
const renameDialogOpen = ref(false);
const revokeDialogOpen = ref(false);
const renameDraft = ref('');

const activeSession = computed(getActiveSession);
const activeSessions = computed(getActiveSessions);
const untrustedSessions = computed(getUntrustedSessions);
const sessionOptions = computed(getSessionOptions);
const readinessChecks = computed(getReadinessChecks);
const readyCheckCount = computed(getReadyCheckCount);
const readinessPercent = computed(getReadinessPercent);
const readinessTone = computed(getReadinessTone);
const readinessLabel = computed(getReadinessLabel);
const filteredEvents = computed(getFilteredEvents);
const selectedEventOption = computed(getSelectedEventOption);
const canRevokeActiveSession = computed(getCanRevokeActiveSession);
const securityLogHref = computed(getSecurityLogHref);

watch(activeSessionId, onActiveSessionChange);

/**
 * Return the currently selected session record.
 *
 * @returns {object} Selected session.
 */
function getActiveSession() {
	return sessions.value.find((session) => session.id === activeSessionId.value) || sessions.value[0];
}

/**
 * Return sessions that can still authorize account access.
 *
 * @returns {Array<object>} Active session records.
 */
function getActiveSessions() {
	return sessions.value.filter((session) => session.status === 'Active');
}

/**
 * Return active sessions that have not completed device trust.
 *
 * @returns {Array<object>} Active untrusted sessions.
 */
function getUntrustedSessions() {
	return activeSessions.value.filter((session) => !session.trusted);
}

/**
 * Adapt session records for the rich DOM Studio select.
 *
 * @returns {Array<object>} Select-compatible session options.
 */
function getSessionOptions() {
	return sessions.value.map((session) => ({
		...session,
		value: session.id,
		label: session.device,
		description: `${session.browser} on ${session.platform} · ${session.location}`,
	}));
}

/**
 * Build the account protection checks from current session and control state.
 *
 * @returns {Array<{ label: string, ready: boolean, detail: string }>} Readiness checks.
 */
function getReadinessChecks() {
	return [
		{
			label: 'Multi-factor authentication',
			ready: account.value.mfaEnabled,
			detail: 'A second factor protects new or risky sign-ins.',
		},
		{
			label: 'Passkey sign-in',
			ready: account.value.passkeySignIn,
			detail: 'Hardware-backed credentials are available on registered devices.',
		},
		{
			label: 'New sign-in alerts',
			ready: account.value.loginAlerts,
			detail: 'Account owners are notified when a new device signs in.',
		},
		{
			label: 'Trusted active sessions',
			ready: untrustedSessions.value.length === 0,
			detail: untrustedSessions.value.length
				? `${untrustedSessions.value.length} active session still needs review.`
				: 'Every active session has completed device trust.',
		},
	];
}

/**
 * Count readiness checks that currently pass.
 *
 * @returns {number} Passing readiness-check count.
 */
function getReadyCheckCount() {
	return readinessChecks.value.filter((check) => check.ready).length;
}

/**
 * Convert readiness checks into an accessible progress percentage.
 *
 * @returns {number} Percentage of checks currently passing.
 */
function getReadinessPercent() {
	return Math.round((readyCheckCount.value / readinessChecks.value.length) * 100);
}

/**
 * Return the semantic tone for the current readiness state.
 *
 * @returns {string} DOM Studio status tone.
 */
function getReadinessTone() {
	return readyCheckCount.value === readinessChecks.value.length ? 'success' : 'warning';
}

/**
 * Return a precise readiness summary without inventing a security score.
 *
 * @returns {string} Human-readable readiness label.
 */
function getReadinessLabel() {
	return `${readyCheckCount.value} of ${readinessChecks.value.length} protections ready`;
}

/**
 * Return security events matching the selected activity filter.
 *
 * @returns {Array<object>} Filtered security events.
 */
function getFilteredEvents() {
	if (eventFilter.value === 'all') return securityEvents.value;
	return securityEvents.value.filter((event) => event.type === eventFilter.value);
}

/**
 * Return metadata for the selected activity filter.
 *
 * @returns {object} Selected filter option.
 */
function getSelectedEventOption() {
	return eventOptions.find((option) => option.value === eventFilter.value) || eventOptions[0];
}

/**
 * Determine whether the selected session can be revoked safely.
 *
 * @returns {boolean} True when the revoke action is available.
 */
function getCanRevokeActiveSession() {
	return !activeSession.value.current && activeSession.value.status === 'Active';
}

/**
 * Build a downloadable CSV data URL from the current immutable activity feed.
 *
 * @returns {string} Encoded CSV data URL.
 */
function getSecurityLogHref() {
	const header = ['Time', 'Type', 'Event', 'Detail'];
	const rows = securityEvents.value.map((event) => [
		event.time,
		event.type,
		event.label,
		event.detail,
	]);
	const csv = [header, ...rows]
		.map((row) => row.map(escapeCsvCell).join(','))
		.join('\n');
	return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

/**
 * Escape one CSV value for safe download.
 *
 * @param {unknown} value Raw CSV value.
 * @returns {string} Quoted CSV cell.
 */
function escapeCsvCell(value) {
	return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

/**
 * Clear session-specific feedback when another device is selected.
 *
 * @returns {void}
 */
function onActiveSessionChange() {
	sessionNotice.value = '';
	renameDialogOpen.value = false;
	revokeDialogOpen.value = false;
}

/**
 * Select the untrusted session that needs the account owner's attention.
 *
 * @returns {void}
 */
function reviewUntrustedSession() {
	const session = untrustedSessions.value[0];
	if (!session) return;
	activeSessionId.value = session.id;
	activeTab.value = 'sessions';
}

/**
 * Open the rename dialog with the current device label.
 *
 * @returns {void}
 */
function openRenameDialog() {
	renameDraft.value = activeSession.value.device;
	renameDialogOpen.value = true;
}

/**
 * Save a new device label and record the action in the security feed.
 *
 * @returns {void}
 */
function saveDeviceName() {
	const nextName = renameDraft.value.trim();
	if (!nextName) return;
	const previousName = activeSession.value.device;
	activeSession.value.device = nextName;
	addSecurityEvent({
		type: 'session',
		label: 'Device renamed',
		detail: `${previousName} is now named ${nextName}.`,
		tone: 'primary',
	});
	sessionNotice.value = `Device renamed to ${nextName}.`;
	renameDialogOpen.value = false;
}

/**
 * Toggle device trust and record the decision in the security feed.
 *
 * @returns {void}
 */
function toggleSessionTrust() {
	if (activeSession.value.status !== 'Active') return;
	activeSession.value.trusted = !activeSession.value.trusted;
	const trustLabel = activeSession.value.trusted ? 'trusted' : 'untrusted';
	addSecurityEvent({
		type: 'session',
		label: activeSession.value.trusted ? 'Device marked as trusted' : 'Device trust removed',
		detail: `${activeSession.value.device} is now ${trustLabel}.`,
		tone: activeSession.value.trusted ? 'success' : 'warning',
	});
	sessionNotice.value = `${activeSession.value.device} is now ${trustLabel}.`;
}

/**
 * Open a confirmation dialog for a revocable session.
 *
 * @returns {void}
 */
function openRevokeDialog() {
	if (!canRevokeActiveSession.value) return;
	revokeDialogOpen.value = true;
}

/**
 * Revoke the selected session after explicit confirmation.
 *
 * @returns {void}
 */
function confirmSessionRevocation() {
	if (!canRevokeActiveSession.value) return;
	activeSession.value.status = 'Revoked';
	activeSession.value.trusted = false;
	addSecurityEvent({
		type: 'session',
		label: 'Session revoked',
		detail: `${activeSession.value.device} can no longer access this account.`,
		tone: 'warning',
	});
	sessionNotice.value = `Access revoked for ${activeSession.value.device}.`;
	revokeDialogOpen.value = false;
}

/**
 * Record a toggle change in the immutable activity example.
 *
 * @param {string} label Protection control label.
 * @param {boolean} enabled Current control state.
 * @returns {void}
 */
function recordProtectionChange(label, enabled) {
	addSecurityEvent({
		type: 'setting',
		label: `${label} ${enabled ? 'enabled' : 'disabled'}`,
		detail: `${account.value.email} changed this protection control.`,
		tone: enabled ? 'success' : 'warning',
	});
}

/**
 * Run the local readiness check and move to its results.
 *
 * @returns {void}
 */
function runSecurityCheck() {
	securityCheckState.value = 'complete';
	activeTab.value = 'protection';
}

/**
 * Show confirmation after the downloadable activity log is requested.
 *
 * @returns {void}
 */
function onDownloadLog() {
	downloadState.value = 'ready';
}

/**
 * Reveal a clear recovery-management boundary for this frontend example.
 *
 * @returns {void}
 */
function reviewRecoveryOptions() {
	recoveryNotice.value = 'Connect these rows to server-owned passkey, backup-code, email, and phone setup flows.';
}

/**
 * Add a timestamped event to the top of the security activity feed.
 *
 * @param {{ type: string, label: string, detail: string, tone: string }} event Security event details.
 * @returns {void}
 */
function addSecurityEvent(event) {
	securityEvents.value = [
		{
			id: Date.now(),
			time: 'Just now',
			...event,
		},
		...securityEvents.value,
	];
}

/**
 * Return a DOM Studio tone for a session's current state.
 *
 * @param {object} session Session record.
 * @returns {string} DOM Studio status tone.
 */
function getSessionTone(session) {
	if (session.status !== 'Active') return 'neutral';
	if (session.trusted) return 'success';
	return 'warning';
}

/**
 * Return a concise status label for a session record.
 *
 * @param {object} session Session record.
 * @returns {string} Human-readable session status.
 */
function getSessionStatus(session) {
	if (session.status !== 'Active') return session.status;
	if (session.current) return 'Current device';
	if (!session.trusted) return 'Needs review';
	return 'Trusted';
}

/**
 * Return the DOM Studio tone for a recovery item.
 *
 * @param {object} item Recovery readiness item.
 * @returns {string} DOM Studio status tone.
 */
function getRecoveryTone(item) {
	if (item.status === 'Ready') return 'success';
	if (item.status === 'Missing') return 'warning';
	return 'neutral';
}
</script>

<template>
	<div class="min-h-dvh w-full bg-canvas text-canvas-fg">
		<header class="border-b border-border bg-canvas">
			<div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-start md:justify-between">
				<div class="max-w-2xl">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Account security</p>
					<h3 class="mt-2 text-2xl font-semibold tracking-tight">Secure your signed-in devices</h3>
					<p class="mt-2 text-sm leading-6 text-muted-fg">
						Review account access, resolve untrusted sessions, and keep recovery protections ready.
					</p>
					<div class="mt-3 flex flex-wrap gap-2">
						<DomStatusPill :tone="readinessTone" :label="readinessLabel" />
						<DomStatusPill
							:tone="untrustedSessions.length ? 'warning' : 'success'"
							:label="untrustedSessions.length ? `${untrustedSessions.length} session needs review` : 'All sessions trusted'"
						/>
					</div>
				</div>
				<div class="flex flex-wrap gap-2">
					<DomButton
						as="a"
						:href="securityLogHref"
						download="security-activity.csv"
						variant="secondary"
						size="sm"
						@click="onDownloadLog"
					>
						Download activity
					</DomButton>
					<DomButton size="sm" @click="runSecurityCheck">
						{{ securityCheckState === 'complete' ? 'Run check again' : 'Run security check' }}
					</DomButton>
				</div>
			</div>
		</header>

		<main class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
			<DomAlert
				v-if="downloadState === 'ready'"
				class="mb-4"
				tone="success"
				title="Activity log downloaded"
				description="The CSV contains the security events currently visible in this example."
				dismissible
				@dismiss="downloadState = 'idle'"
			/>

			<DomTabs v-model="activeTab" :tabs="securityTabs">
				<template #sessions>
					<div class="grid gap-5 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
						<DomCard padding="p-4 sm:p-5">
							<div class="flex items-start justify-between gap-3">
								<div>
									<h4 class="font-semibold">Signed-in devices</h4>
									<p class="mt-1 text-sm text-muted-fg">{{ activeSessions.length }} sessions can currently access this account.</p>
								</div>
								<DomBadge tone="neutral" size="sm">{{ sessions.length }} total</DomBadge>
							</div>

							<DomSelect
								v-model="activeSessionId"
								class="mt-5"
								label="Device"
								description="Choose a session to inspect or revoke."
								:options="sessionOptions"
								width="min-w-[20rem]"
							>
								<template #value>
									<span class="flex min-w-0 items-center gap-2">
										<span class="truncate">{{ activeSession.device }}</span>
										<DomStatusPill
											:tone="getSessionTone(activeSession)"
											:label="getSessionStatus(activeSession)"
											size="sm"
										/>
									</span>
								</template>
								<template #option="{ option, selected }">
									<span class="block min-w-0">
										<span class="flex items-center justify-between gap-3">
											<span class="truncate font-medium">{{ option.label }}</span>
											<DomStatusPill
												:tone="getSessionTone(option)"
												:label="getSessionStatus(option)"
												size="sm"
											/>
										</span>
										<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ option.description }}</span>
										<span class="mt-2 flex flex-wrap gap-2">
											<DomBadge size="sm" tone="neutral">{{ option.lastActive }}</DomBadge>
											<DomBadge v-if="selected" size="sm" tone="success">Selected</DomBadge>
										</span>
									</span>
								</template>
							</DomSelect>

							<DomAlert
								v-if="untrustedSessions.length"
								class="mt-5"
								tone="warning"
								title="One active session needs review"
								:description="`${untrustedSessions[0].device} signed in from ${untrustedSessions[0].location} and is not trusted.`"
							>
								<template #actions>
									<DomButton size="sm" variant="secondary" @click="reviewUntrustedSession">
										Review session
									</DomButton>
								</template>
							</DomAlert>
							<DomAlert
								v-else
								class="mt-5"
								tone="success"
								title="Every active session is trusted"
								description="No signed-in device currently needs an account-owner decision."
							/>
						</DomCard>

						<DomCard padding="p-4 sm:p-5">
							<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Selected session</p>
									<h4 class="mt-2 text-xl font-semibold">{{ activeSession.device }}</h4>
									<p class="mt-1 text-sm leading-6 text-muted-fg">
										{{ activeSession.browser }} on {{ activeSession.platform }} · {{ activeSession.location }}
									</p>
								</div>
								<div class="flex flex-wrap gap-2">
									<DomStatusPill
										:tone="getSessionTone(activeSession)"
										:label="getSessionStatus(activeSession)"
									/>
									<DomBadge :tone="activeSession.risk === 'Low' ? 'success' : 'warning'">
										{{ activeSession.risk }} risk
									</DomBadge>
								</div>
							</div>

							<dl class="mt-5 grid gap-x-6 border-y border-border text-sm sm:grid-cols-2">
								<div class="flex justify-between gap-4 border-b border-border py-3 sm:pr-2">
									<dt class="text-muted-fg">IP address</dt>
									<dd class="font-medium">{{ activeSession.ip }}</dd>
								</div>
								<div class="flex justify-between gap-4 border-b border-border py-3 sm:pl-2">
									<dt class="text-muted-fg">First seen</dt>
									<dd class="font-medium">{{ activeSession.firstSeen }}</dd>
								</div>
								<div class="flex justify-between gap-4 border-b border-border py-3 sm:border-b-0 sm:pr-2">
									<dt class="text-muted-fg">Last active</dt>
									<dd class="text-right font-medium">{{ activeSession.lastActive }}</dd>
								</div>
								<div class="flex justify-between gap-4 py-3 sm:pl-2">
									<dt class="text-muted-fg">Access</dt>
									<dd class="font-medium">{{ activeSession.status }}</dd>
								</div>
							</dl>

							<div class="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
								<DomButton variant="secondary" @click="openRenameDialog">Rename device</DomButton>
								<DomButton
									variant="secondary"
									:disabled="activeSession.status !== 'Active'"
									@click="toggleSessionTrust"
								>
									{{ activeSession.trusted ? 'Remove trust' : 'Mark as trusted' }}
								</DomButton>
								<DomButton
									variant="danger"
									:disabled="!canRevokeActiveSession"
									@click="openRevokeDialog"
								>
									{{ activeSession.current
										? 'Current session'
										: activeSession.status === 'Active'
											? 'Revoke session'
											: `${activeSession.status} session` }}
								</DomButton>
							</div>

							<DomAlert
								v-if="activeSession.current"
								class="mt-4"
								tone="neutral"
								title="This is your current session"
								description="Sign out from the account menu if you want to end access on this device."
								:icon="false"
							/>
							<DomAlert
								v-if="sessionNotice"
								class="mt-4"
								tone="success"
								title="Session updated"
								:description="sessionNotice"
							/>
						</DomCard>
					</div>
				</template>

				<template #protection>
					<div class="space-y-5">
						<DomAlert
							v-if="securityCheckState === 'complete' && untrustedSessions.length"
							tone="warning"
							title="Security check found one session to review"
							:description="`${untrustedSessions[0].device} is active but has not completed device trust.`"
						>
							<template #actions>
								<DomButton size="sm" variant="secondary" @click="reviewUntrustedSession">
									Review the session
								</DomButton>
							</template>
						</DomAlert>
						<DomAlert
							v-else-if="securityCheckState === 'complete'"
							tone="success"
							title="Security check complete"
							description="Every protection check currently passes."
						/>

						<div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
							<DomCard padding="p-4 sm:p-5">
								<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
									<div>
										<h4 class="font-semibold">Protection controls</h4>
										<p class="mt-1 text-sm leading-6 text-muted-fg">These values should be saved through the account security API.</p>
									</div>
									<DomStatusPill :tone="readinessTone" :label="readinessLabel" />
								</div>

								<DomProgress
									class="mt-5"
									:value="readinessPercent"
									:tone="readinessTone"
									label="Protection readiness"
									show-value
								/>

								<div class="mt-5 divide-y divide-border border-y border-border">
									<div class="py-4">
										<DomToggle
											v-model="account.mfaEnabled"
											label="Require MFA at sign-in"
											description="Ask for a second factor on new browsers and risky sign-ins."
											@update:model-value="recordProtectionChange('Multi-factor authentication', $event)"
										/>
									</div>
									<div class="py-4">
										<DomToggle
											v-model="account.passkeySignIn"
											label="Allow passkey sign-in"
											description="Let verified devices use hardware-backed passkeys."
											@update:model-value="recordProtectionChange('Passkey sign-in', $event)"
										/>
									</div>
									<div class="py-4">
										<DomToggle
											v-model="account.loginAlerts"
											label="New sign-in alerts"
											description="Send an alert whenever a new device accesses the account."
											@update:model-value="recordProtectionChange('New sign-in alerts', $event)"
										/>
									</div>
								</div>

								<div class="mt-5 space-y-3">
									<div
										v-for="check in readinessChecks"
										:key="check.label"
										class="flex items-start justify-between gap-4"
									>
										<div>
											<p class="text-sm font-medium">{{ check.label }}</p>
											<p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p>
										</div>
										<DomStatusPill
											:tone="check.ready ? 'success' : 'warning'"
											:label="check.ready ? 'Ready' : 'Review'"
											size="sm"
										/>
									</div>
								</div>
							</DomCard>

							<DomCard padding="p-4 sm:p-5">
								<div class="flex items-center justify-between gap-3">
									<h4 class="font-semibold">Recovery coverage</h4>
									<DomBadge tone="neutral" size="sm">{{ account.email }}</DomBadge>
								</div>
								<div class="mt-4 divide-y divide-border border-y border-border">
									<div v-for="item in recoveryItems" :key="item.key" class="py-3">
										<div class="flex items-start justify-between gap-3">
											<div>
												<p class="text-sm font-medium">{{ item.label }}</p>
												<p class="mt-1 text-xs leading-5 text-muted-fg">{{ item.detail }}</p>
											</div>
											<DomStatusPill
												:tone="getRecoveryTone(item)"
												:label="item.value"
												size="sm"
											/>
										</div>
									</div>
								</div>
								<DomButton class="mt-4 w-full" variant="secondary" @click="reviewRecoveryOptions">
									Review recovery options
								</DomButton>
								<DomAlert
									v-if="recoveryNotice"
									class="mt-4"
									tone="info"
									title="Recovery setup boundary"
									:description="recoveryNotice"
								/>
							</DomCard>
						</div>
					</div>
				</template>

				<template #activity>
					<DomCard padding="p-4 sm:p-5">
						<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
							<div>
								<h4 class="font-semibold">Security activity</h4>
								<p class="mt-1 text-sm leading-6 text-muted-fg">
									Review immutable sign-in, recovery, protection, and session events.
								</p>
							</div>
							<DomSelect
								v-model="eventFilter"
								class="w-full md:max-w-xs"
								label="Event type"
								:options="eventOptions"
								width="min-w-[18rem]"
							>
								<template #value>
									<span class="flex min-w-0 items-center justify-between gap-3">
										<span class="truncate">{{ selectedEventOption.label }}</span>
										<DomBadge tone="neutral" size="sm">{{ filteredEvents.length }}</DomBadge>
									</span>
								</template>
								<template #option="{ option, selected }">
									<span class="block">
										<span class="flex items-center justify-between gap-3">
											<span class="font-medium">{{ option.label }}</span>
											<DomBadge v-if="selected" tone="success" size="sm">Selected</DomBadge>
										</span>
										<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ option.description }}</span>
									</span>
								</template>
							</DomSelect>
						</div>

						<div v-if="filteredEvents.length" class="mt-5 divide-y divide-border border-y border-border">
							<article
								v-for="event in filteredEvents"
								:key="event.id"
								class="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
							>
								<div>
									<div class="flex flex-wrap items-center gap-2">
										<p class="text-sm font-medium">{{ event.label }}</p>
										<DomStatusPill :tone="event.tone" :label="event.type" size="sm" />
									</div>
									<p class="mt-1 text-sm leading-6 text-muted-fg">{{ event.detail }}</p>
								</div>
								<DomBadge tone="neutral" size="sm">{{ event.time }}</DomBadge>
							</article>
						</div>
						<DomEmptyState
							v-else
							class="mt-5"
							title="No matching activity"
							description="Choose another event type to see recorded account security changes."
							size="sm"
						/>
					</DomCard>
				</template>
			</DomTabs>
		</main>

		<DomDialog
			v-model="renameDialogOpen"
			title="Rename signed-in device"
			description="Use a label that helps the account owner recognize this session later."
		>
			<DomTextInput
				v-model="renameDraft"
				label="Device name"
				placeholder="Work MacBook"
				required
			/>
			<template #footer>
				<DomButton data-close variant="secondary">Cancel</DomButton>
				<DomButton :disabled="!renameDraft.trim()" @click="saveDeviceName">Save name</DomButton>
			</template>
		</DomDialog>

		<DomDialog
			v-model="revokeDialogOpen"
			title="Revoke this session?"
			:description="`${activeSession.device} will lose access immediately.`"
		>
			<DomAlert
				tone="danger"
				title="This action cannot be undone"
				:description="`Revoke ${activeSession.browser} on ${activeSession.platform} from ${activeSession.location}. The device must sign in again.`"
			/>
			<dl class="mt-4 divide-y divide-border border-y border-border text-sm">
				<div class="flex items-center justify-between gap-4 py-3">
					<dt class="text-muted-fg">Last active</dt>
					<dd class="font-medium">{{ activeSession.lastActive }}</dd>
				</div>
				<div class="flex items-center justify-between gap-4 py-3">
					<dt class="text-muted-fg">IP address</dt>
					<dd class="font-medium">{{ activeSession.ip }}</dd>
				</div>
			</dl>
			<template #footer>
				<DomButton data-close variant="secondary">Keep session</DomButton>
				<DomButton variant="danger" @click="confirmSessionRevocation">Revoke access</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
