<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomNativeSelect, DomToggle } from '@getdom/studio/vue';

const activeSessionId = ref('macbook');
const eventFilter = ref('all');
const revokeState = ref('idle');

const account = ref({
	name: 'Olivia Carter',
	email: 'olivia@northstar.example',
	securityScore: 86,
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
		firstSeen: 'May 18',
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
		firstSeen: 'Jun 1',
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
		lastActive: 'Yesterday 22:48',
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
		firstSeen: 'Apr 9',
		trusted: false,
		current: false,
		risk: 'Medium',
		status: 'Expired',
	},
]);

const recoveryItems = ref([
	{ key: 'passkeys', label: 'Passkeys registered', value: '2', status: 'Ready', detail: 'MacBook Pro and iPhone 16 can sign in without password.' },
	{ key: 'backup', label: 'Backup codes', value: '6 left', status: 'Refresh soon', detail: 'Generate a new set when fewer than 4 remain.' },
	{ key: 'email', label: 'Recovery email', value: 'Verified', status: 'Ready', detail: 'olivia.recovery@example.com receives recovery links.' },
	{ key: 'phone', label: 'Recovery phone', value: 'Not added', status: 'Missing', detail: 'Add a verified phone number for account recovery.' },
]);

const securityEvents = [
	{ id: 1, type: 'sign-in', label: 'Current device signed in', detail: 'Safari 18 on macOS from London, UK', time: 'Today 08:14', tone: 'success' },
	{ id: 2, type: 'setting', label: 'Login alerts enabled', detail: 'Security alerts will send for new devices and recovery changes.', time: 'Yesterday 16:02', tone: 'primary' },
	{ id: 3, type: 'review', label: 'Untrusted Windows session detected', detail: 'Chrome 137 from Berlin has not completed device trust.', time: 'Yesterday 22:48', tone: 'warning' },
	{ id: 4, type: 'recovery', label: 'Backup code used', detail: 'One backup code was used during account recovery.', time: 'Jun 6, 11:30', tone: 'muted' },
];

const eventOptions = [
	{ label: 'All events', value: 'all' },
	{ label: 'Sign-ins', value: 'sign-in' },
	{ label: 'Settings', value: 'setting' },
	{ label: 'Needs review', value: 'review' },
	{ label: 'Recovery', value: 'recovery' },
];

const activeSession = computed(() => sessions.value.find((session) => session.id === activeSessionId.value) || sessions.value[0]);
const activeSessions = computed(() => sessions.value.filter((session) => session.status === 'Active'));
const untrustedSessions = computed(() => activeSessions.value.filter((session) => !session.trusted));
const filteredEvents = computed(() => {
	if (eventFilter.value === 'all') return securityEvents;
	return securityEvents.filter((event) => event.type === eventFilter.value);
});
const readinessChecks = computed(() => [
	{ label: 'Multi-factor authentication', ready: account.value.mfaEnabled },
	{ label: 'Passkey sign-in', ready: account.value.passkeySignIn },
	{ label: 'Login alerts', ready: account.value.loginAlerts },
	{ label: 'No untrusted active sessions', ready: untrustedSessions.value.length === 0 },
]);
const readyCheckCount = computed(() => readinessChecks.value.filter((check) => check.ready).length);

function selectSession(id) {
	activeSessionId.value = id;
	revokeState.value = 'idle';
}

function revokeSelectedSession() {
	if (activeSession.value.current) return;
	activeSession.value.status = 'Revoked';
	activeSession.value.trusted = false;
	revokeState.value = 'revoked';
}
</script>

<template>
	<div class="w-full max-w-7xl overflow-hidden rounded-lg border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-5 py-5 sm:px-7">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Account security</p>
					<h3 class="mt-2 text-2xl font-semibold tracking-tight">Device security center</h3>
					<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">
						Give users a direct place to review signed-in devices, revoke access, strengthen recovery, and audit recent account activity.
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<span class="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
						{{ account.securityScore }}% protected
					</span>
					<DomButton variant="secondary" size="sm">Download log</DomButton>
					<DomButton size="sm">Run security check</DomButton>
				</div>
			</div>

			<div class="mt-5 grid gap-3 md:grid-cols-4">
				<div class="border-l-4 border-primary bg-canvas px-4 py-3">
					<p class="text-xs font-medium text-muted-fg">Active sessions</p>
					<p class="mt-1 text-2xl font-semibold tracking-tight">{{ activeSessions.length }}</p>
				</div>
				<div class="border-l-4 border-warning bg-canvas px-4 py-3">
					<p class="text-xs font-medium text-muted-fg">Needs review</p>
					<p class="mt-1 text-2xl font-semibold tracking-tight">{{ untrustedSessions.length }}</p>
				</div>
				<div class="border-l-4 border-success bg-canvas px-4 py-3">
					<p class="text-xs font-medium text-muted-fg">Readiness checks</p>
					<p class="mt-1 text-2xl font-semibold tracking-tight">{{ readyCheckCount }}/{{ readinessChecks.length }}</p>
				</div>
				<div class="border-l-4 border-border bg-canvas px-4 py-3">
					<p class="text-xs font-medium text-muted-fg">Account owner</p>
					<p class="mt-1 truncate text-base font-semibold">{{ account.email }}</p>
				</div>
			</div>
		</header>

		<div class="grid lg:grid-cols-[18rem_minmax(0,1fr)_22rem]">
			<aside class="border-b border-border bg-secondary/35 lg:border-b-0 lg:border-r">
				<div class="flex items-center justify-between gap-3 px-5 py-4">
					<h4 class="text-sm font-semibold">Signed-in devices</h4>
					<span class="rounded-full bg-canvas px-2 py-1 text-xs font-semibold text-muted-fg">{{ sessions.length }}</span>
				</div>
				<div class="grid">
					<button
						v-for="session in sessions"
						:key="session.id"
						type="button"
						class="border-t border-border px-5 py-4 text-left transition hover:bg-canvas/70"
						:class="activeSessionId === session.id ? 'bg-canvas' : ''"
						@click="selectSession(session.id)"
					>
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="truncate text-sm font-semibold">{{ session.device }}</p>
								<p class="mt-1 text-xs leading-5 text-muted-fg">{{ session.browser }} on {{ session.platform }}</p>
							</div>
							<span
								class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
								:class="session.status === 'Revoked' ? 'bg-muted text-muted-fg' : session.risk === 'Low' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'"
							>
								{{ session.status === 'Revoked' ? 'Revoked' : session.risk }}
							</span>
						</div>
						<div class="mt-4 grid grid-cols-2 gap-2 text-xs">
							<div>
								<p class="text-muted-fg">Location</p>
								<p class="mt-1 truncate font-semibold">{{ session.location }}</p>
							</div>
							<div>
								<p class="text-muted-fg">Last active</p>
								<p class="mt-1 truncate font-semibold">{{ session.lastActive }}</p>
							</div>
						</div>
					</button>
				</div>
			</aside>

			<main class="min-w-0">
				<section class="border-b border-border px-5 py-5 sm:px-7">
					<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Selected session</p>
							<h4 class="mt-2 text-xl font-semibold tracking-tight">{{ activeSession.device }}</h4>
							<p class="mt-2 text-sm leading-6 text-muted-fg">
								{{ activeSession.browser }} on {{ activeSession.platform }} from {{ activeSession.location }}.
							</p>
						</div>
						<div class="flex flex-wrap gap-2">
							<span v-if="activeSession.current" class="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">Current device</span>
							<span v-if="activeSession.trusted" class="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">Trusted</span>
							<span v-else class="rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning">Untrusted</span>
						</div>
					</div>
				</section>

				<section class="grid gap-6 border-b border-border px-5 py-6 sm:px-7 xl:grid-cols-2">
					<div>
						<h5 class="text-sm font-semibold">Session details</h5>
						<dl class="mt-4 grid gap-3 text-sm">
							<div class="flex justify-between gap-4 border-b border-border pb-3">
								<dt class="text-muted-fg">IP address</dt>
								<dd class="font-semibold">{{ activeSession.ip }}</dd>
							</div>
							<div class="flex justify-between gap-4 border-b border-border pb-3">
								<dt class="text-muted-fg">First seen</dt>
								<dd class="font-semibold">{{ activeSession.firstSeen }}</dd>
							</div>
							<div class="flex justify-between gap-4 border-b border-border pb-3">
								<dt class="text-muted-fg">Status</dt>
								<dd class="font-semibold">{{ activeSession.status }}</dd>
							</div>
							<div class="flex justify-between gap-4">
								<dt class="text-muted-fg">Risk</dt>
								<dd class="font-semibold">{{ activeSession.risk }}</dd>
							</div>
						</dl>
					</div>

					<div>
						<h5 class="text-sm font-semibold">Available actions</h5>
						<div class="mt-4 grid gap-3">
							<DomButton variant="secondary">Rename device</DomButton>
							<DomButton variant="secondary" :disabled="activeSession.status === 'Revoked'">Mark as trusted</DomButton>
							<DomButton
								:variant="activeSession.current || activeSession.status === 'Revoked' ? 'secondary' : 'primary'"
								:disabled="activeSession.current || activeSession.status === 'Revoked'"
								@click="revokeSelectedSession"
							>
								{{ activeSession.current ? 'Cannot revoke current session' : activeSession.status === 'Revoked' ? 'Session revoked' : 'Revoke this session' }}
							</DomButton>
							<p v-if="revokeState === 'revoked'" class="rounded-lg bg-success/15 px-3 py-2 text-sm font-medium text-success">
								Access for this device has been revoked in the UI state.
							</p>
						</div>
					</div>
				</section>

				<section class="px-5 py-6 sm:px-7">
					<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<div>
							<h5 class="text-sm font-semibold">Recent security activity</h5>
							<p class="mt-1 text-sm leading-6 text-muted-fg">Show immutable events from sign-in, recovery, and security-setting changes.</p>
						</div>
						<DomNativeSelect v-model="eventFilter" :options="eventOptions" class="md:w-44" />
					</div>
					<div class="mt-4 divide-y divide-border border-y border-border">
						<div v-for="event in filteredEvents" :key="event.id" class="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-start">
							<div>
								<div class="flex flex-wrap items-center gap-2">
									<p class="text-sm font-semibold">{{ event.label }}</p>
									<span
										class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
										:class="event.tone === 'warning' ? 'bg-warning/15 text-warning' : event.tone === 'success' ? 'bg-success/15 text-success' : 'bg-secondary text-muted-fg'"
									>
										{{ event.type }}
									</span>
								</div>
								<p class="mt-1 text-sm leading-6 text-muted-fg">{{ event.detail }}</p>
							</div>
							<p class="text-xs font-semibold text-muted-fg">{{ event.time }}</p>
						</div>
					</div>
				</section>
			</main>

			<aside class="grid content-start gap-6 border-t border-border bg-secondary/20 p-5 lg:border-l lg:border-t-0 sm:p-6">
				<section>
					<h4 class="font-semibold tracking-tight">Protection controls</h4>
					<div class="mt-4 grid gap-4">
						<div class="border-b border-border pb-4">
							<DomToggle v-model="account.mfaEnabled" label="Require MFA at sign-in" />
							<p class="mt-2 text-sm leading-6 text-muted-fg">Ask for a second factor on new browsers and risky sign-ins.</p>
						</div>
						<div class="border-b border-border pb-4">
							<DomToggle v-model="account.passkeySignIn" label="Allow passkey sign-in" />
							<p class="mt-2 text-sm leading-6 text-muted-fg">Let verified devices use hardware-backed passkeys.</p>
						</div>
						<div>
							<DomToggle v-model="account.loginAlerts" label="New sign-in alerts" />
							<p class="mt-2 text-sm leading-6 text-muted-fg">Send an alert whenever a new device accesses the account.</p>
						</div>
					</div>
				</section>

				<section class="border-t border-border pt-5">
					<h4 class="font-semibold tracking-tight">Recovery coverage</h4>
					<div class="mt-4 divide-y divide-border border-y border-border">
						<div v-for="item in recoveryItems" :key="item.key" class="py-3">
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="text-sm font-semibold">{{ item.label }}</p>
									<p class="mt-1 text-xs leading-5 text-muted-fg">{{ item.detail }}</p>
								</div>
								<span
									class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
									:class="item.status === 'Ready' ? 'bg-success/15 text-success' : item.status === 'Missing' ? 'bg-warning/15 text-warning' : 'bg-secondary text-muted-fg'"
								>
									{{ item.value }}
								</span>
							</div>
						</div>
					</div>
				</section>

				<section class="border-t border-border pt-5">
					<h4 class="font-semibold tracking-tight">Readiness checks</h4>
					<div class="mt-3 grid gap-2">
						<div v-for="check in readinessChecks" :key="check.label" class="flex items-center justify-between gap-3 text-sm">
							<span class="text-muted-fg">{{ check.label }}</span>
							<span :class="check.ready ? 'text-success' : 'text-warning'" class="font-semibold">
								{{ check.ready ? 'Ready' : 'Review' }}
							</span>
						</div>
					</div>
				</section>
			</aside>
		</div>
	</div>
</template>
