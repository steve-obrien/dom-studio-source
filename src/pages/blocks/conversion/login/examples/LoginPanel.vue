<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomAvatar,
	DomBadge,
	DomButton,
	DomCard,
	DomCheckbox,
	DomConfirmationCodeInput,
	DomEmailInput,
	DomPasswordInput,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
} from '@getdom/studio/vue';

const bootstrap = ref(null);
const loading = ref(true);
const submitting = ref(false);
const view = ref('credentials');
const email = ref('alex@northstar.tools');
const password = ref('');
const remember = ref(true);
const code = ref('');
const challenge = ref(null);
const session = ref(null);
const member = ref(null);
const workspaces = ref([]);
const selectedWorkspaceId = ref('');
const receipt = ref(null);
const handoff = ref(null);
const errorMessage = ref('');
const successMessage = ref('');

const workspaceOptions = computed(function buildWorkspaceOptions() {
	return workspaces.value.map((workspace) => ({
		value: workspace.id,
		label: workspace.label,
		description: `${workspace.role} · ${workspace.description}`,
	}));
});

const selectedWorkspace = computed(function findSelectedWorkspace() {
	return workspaces.value.find((workspace) => workspace.id === selectedWorkspaceId.value) || null;
});

const verificationHeading = computed(function resolveVerificationHeading() {
	return challenge.value?.purpose === 'mfa' ? 'Confirm it’s you' : 'Check your email';
});

const verificationDescription = computed(function resolveVerificationDescription() {
	if (!challenge.value) return '';
	if (challenge.value.purpose === 'mfa') return `Enter the code from your ${challenge.value.destination.toLowerCase()}.`;
	return `We sent a six-digit sign-in code to ${challenge.value.destination}.`;
});

const demoVerificationCode = computed(function resolveDemoVerificationCode() {
	if (!bootstrap.value || !challenge.value) return '';
	return challenge.value.purpose === 'mfa'
		? bootstrap.value.demoCredentials.mfaCode
		: bootstrap.value.demoCredentials.passwordlessCode;
});

/**
 * Request JSON from a block-demo endpoint and preserve structured API failures.
 *
 * @param {string} path API path relative to the current origin.
 * @param {RequestInit} options Fetch options.
 * @returns {Promise<Record<string, any>>} Parsed API payload.
 */
async function apiRequest(path, options = {}) {
	const response = await fetch(path, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...(options.headers || {}),
		},
	});
	const payload = await response.json();
	if (!response.ok || payload.error) {
		const error = new Error(payload.error?.message || 'The authentication service could not complete that request.');
		error.status = response.status;
		error.details = payload.error || null;
		throw error;
	}
	return payload;
}

/**
 * Load product identity, security context, and documented demo credentials.
 *
 * @returns {Promise<void>} Promise resolved after bootstrap state is ready.
 */
async function loadBootstrap() {
	loading.value = true;
	errorMessage.value = '';
	try {
		bootstrap.value = await apiRequest('/api/block-demos/login/bootstrap');
		email.value = bootstrap.value.demoCredentials.email;
	} catch (error) {
		errorMessage.value = error.message;
	} finally {
		loading.value = false;
	}
}

/**
 * Fill the documented demo credentials without submitting the form.
 *
 * @returns {void}
 */
function fillDemoAccount() {
	if (!bootstrap.value) return;
	email.value = bootstrap.value.demoCredentials.email;
	password.value = bootstrap.value.demoCredentials.password;
	errorMessage.value = '';
	successMessage.value = 'Demo credentials are ready. Submit when you want to continue.';
}

/**
 * Validate password credentials and move into second-factor verification.
 *
 * @returns {Promise<void>} Promise resolved after the challenge is created.
 */
async function submitPassword() {
	if (submitting.value) return;
	clearMessages();
	submitting.value = true;
	try {
		const payload = await apiRequest('/api/block-demos/login/sessions', {
			method: 'POST',
			body: JSON.stringify({
				email: email.value,
				password: password.value,
				remember: remember.value,
			}),
		});
		challenge.value = payload.challenge;
		code.value = '';
		view.value = 'verify';
		successMessage.value = payload.message;
	} catch (error) {
		errorMessage.value = error.message;
	} finally {
		submitting.value = false;
	}
}

/**
 * Request a passwordless sign-in code for the entered account email.
 *
 * @returns {Promise<void>} Promise resolved after the email challenge is created.
 */
async function requestPasswordless() {
	if (submitting.value) return;
	clearMessages();
	submitting.value = true;
	try {
		const payload = await apiRequest('/api/block-demos/login/challenges', {
			method: 'POST',
			body: JSON.stringify({
				email: email.value,
				remember: remember.value,
			}),
		});
		challenge.value = payload.challenge;
		code.value = '';
		view.value = 'verify';
		successMessage.value = payload.message;
	} catch (error) {
		errorMessage.value = error.message;
	} finally {
		submitting.value = false;
	}
}

/**
 * Verify the current confirmation code and hydrate the authenticated session.
 *
 * @returns {Promise<void>} Promise resolved after session creation.
 */
async function verifyChallenge() {
	if (submitting.value || !challenge.value) return;
	clearMessages();
	submitting.value = true;
	try {
		const payload = await apiRequest(`/api/block-demos/login/challenges/${challenge.value.id}/verify`, {
			method: 'POST',
			body: JSON.stringify({ code: code.value }),
		});
		applyAuthenticatedPayload(payload);
		view.value = 'workspace';
		successMessage.value = payload.message;
	} catch (error) {
		errorMessage.value = error.message;
	} finally {
		submitting.value = false;
	}
}

/**
 * Apply an authenticated-session response to the local gateway state.
 *
 * @param {Record<string, any>} payload API response containing session context.
 * @returns {void}
 */
function applyAuthenticatedPayload(payload) {
	session.value = payload.session;
	member.value = payload.member;
	workspaces.value = payload.workspaces || [];
	selectedWorkspaceId.value = payload.session?.workspaceId || payload.workspaces?.[0]?.id || '';
	receipt.value = payload.receipt || null;
}

/**
 * Select a workspace and request a signed handoff to the application shell.
 *
 * @returns {Promise<void>} Promise resolved after handoff proof is created.
 */
async function openWorkspace() {
	if (submitting.value || !session.value) return;
	clearMessages();
	submitting.value = true;
	try {
		const payload = await apiRequest(`/api/block-demos/login/sessions/${session.value.id}/handoff`, {
			method: 'POST',
			body: JSON.stringify({ workspaceId: selectedWorkspaceId.value }),
		});
		session.value = payload.session;
		receipt.value = payload.receipt;
		handoff.value = payload.handoff;
		view.value = 'ready';
		successMessage.value = payload.message;
	} catch (error) {
		errorMessage.value = error.message;
	} finally {
		submitting.value = false;
	}
}

/**
 * Revoke the current demo session and reset the gateway to credential entry.
 *
 * @returns {Promise<void>} Promise resolved after server-side revocation.
 */
async function signOut() {
	if (submitting.value || !session.value) return;
	clearMessages();
	submitting.value = true;
	try {
		const payload = await apiRequest(`/api/block-demos/login/sessions/${session.value.id}`, {
			method: 'DELETE',
		});
		resetAuthenticationState();
		successMessage.value = payload.message;
	} catch (error) {
		errorMessage.value = error.message;
	} finally {
		submitting.value = false;
	}
}

/**
 * Return from code verification to the credential form.
 *
 * @returns {void}
 */
function returnToCredentials() {
	challenge.value = null;
	code.value = '';
	view.value = 'credentials';
	clearMessages();
}

/**
 * Return from a completed handoff to workspace selection.
 *
 * @returns {void}
 */
function chooseAnotherWorkspace() {
	handoff.value = null;
	view.value = 'workspace';
	clearMessages();
}

/**
 * Clear transient success and error feedback.
 *
 * @returns {void}
 */
function clearMessages() {
	errorMessage.value = '';
	successMessage.value = '';
}

/**
 * Clear authenticated state while preserving the demo account email.
 *
 * @returns {void}
 */
function resetAuthenticationState() {
	view.value = 'credentials';
	password.value = '';
	code.value = '';
	challenge.value = null;
	session.value = null;
	member.value = null;
	workspaces.value = [];
	selectedWorkspaceId.value = '';
	receipt.value = null;
	handoff.value = null;
}

/**
 * Format a server timestamp for compact authentication context.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Localized date and time.
 */
function formatDateTime(value) {
	if (!value) return '—';
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}

onMounted(loadBootstrap);
</script>

<template>
	<div class="min-h-dvh min-w-0 bg-canvas text-canvas-fg lg:grid lg:h-dvh lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(30rem,0.78fr)] lg:overflow-hidden">
		<aside class="relative hidden min-h-dvh border-r border-border bg-secondary/35 p-10 lg:flex lg:h-dvh lg:min-h-0 lg:flex-col lg:overflow-y-auto xl:p-14">
			<div class="flex items-center justify-between gap-4">
				<div class="flex min-w-0 items-center gap-3">
					<DomAvatar :name="bootstrap?.brand?.name || 'Northstar'" :initials="bootstrap?.brand?.initials || 'NS'" shape="rounded" size="lg" />
					<div class="min-w-0">
						<p class="truncate text-sm font-semibold">{{ bootstrap?.brand?.name || 'Northstar' }}</p>
						<p class="truncate text-xs text-muted-fg">{{ bootstrap?.brand?.product || 'Product workspace' }}</p>
					</div>
				</div>
				<DomStatusPill tone="success" size="sm" label="Operational" />
			</div>

			<div class="my-auto max-w-2xl py-16">
				<DomBadge tone="primary" variant="outline">Member access</DomBadge>
				<h1 class="mt-6 max-w-xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] xl:text-6xl">
					One secure door to every Northstar workspace.
				</h1>
				<p class="mt-6 max-w-lg text-base leading-7 text-muted-fg">
					Verify your identity once, choose the space you need, and carry the same session policy into the app.
				</p>

				<div class="mt-12 grid max-w-xl border-y border-border sm:grid-cols-3">
					<div
						v-for="control in bootstrap?.security?.controls || []"
						:key="control.label"
						class="border-b border-border py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0"
					>
						<p class="text-xs font-medium uppercase tracking-[0.14em] text-muted-fg">{{ control.label }}</p>
						<p class="mt-2 text-sm font-medium leading-5">{{ control.value }}</p>
					</div>
				</div>
			</div>

			<div>
				<p class="text-xs font-medium uppercase tracking-[0.14em] text-muted-fg">Recent access</p>
				<div class="mt-4 divide-y divide-border border-y border-border">
					<div
						v-for="access in bootstrap?.security?.recentAccess || []"
						:key="`${access.device}-${access.relativeTime}`"
						class="flex items-center justify-between gap-6 py-4"
					>
						<div class="min-w-0">
							<p class="truncate text-sm font-medium">{{ access.device }}</p>
							<p class="mt-1 truncate text-xs text-muted-fg">{{ access.location }}</p>
						</div>
						<div class="flex shrink-0 items-center gap-3">
							<DomStatusPill v-if="access.current" tone="success" size="sm" label="Current" />
							<span class="text-xs text-muted-fg">{{ access.relativeTime }}</span>
						</div>
					</div>
				</div>
			</div>
		</aside>

		<main class="flex min-h-dvh min-w-0 flex-col bg-canvas lg:h-dvh lg:min-h-0 lg:overflow-y-auto">
			<header class="flex items-center justify-between border-b border-border px-5 py-4 lg:hidden">
				<div class="flex min-w-0 items-center gap-3">
					<DomAvatar :name="bootstrap?.brand?.name || 'Northstar'" :initials="bootstrap?.brand?.initials || 'NS'" shape="rounded" size="sm" />
					<div class="min-w-0">
						<p class="truncate text-sm font-semibold">{{ bootstrap?.brand?.name || 'Northstar' }}</p>
						<p class="truncate text-xs text-muted-fg">Secure member access</p>
					</div>
				</div>
				<DomStatusPill tone="success" size="sm" label="Operational" />
			</header>

			<div class="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
				<div class="w-full max-w-md">
					<template v-if="loading">
						<DomSkeleton class="h-5 w-28" />
						<DomSkeleton class="mt-5 h-10 w-72 max-w-full" />
						<DomSkeleton class="mt-3 h-5 w-full" />
						<DomSkeleton class="mt-10 h-24 w-full" />
						<DomSkeleton class="mt-4 h-12 w-full rounded-full" />
					</template>

					<template v-else-if="view === 'credentials'">
						<DomBadge tone="neutral" variant="outline">Secure workspace</DomBadge>
						<h2 class="mt-5 text-4xl font-semibold tracking-[-0.035em]">Welcome back</h2>
						<p class="mt-3 text-sm leading-6 text-muted-fg">
							Sign in to continue to your Northstar workspaces. Passwordless access is available if you cannot use your password.
						</p>

						<DomAlert v-if="errorMessage" class="mt-6" tone="danger" title="Sign-in needs attention" :description="errorMessage" />
						<DomAlert v-if="successMessage" class="mt-6" tone="info" title="Demo account ready" :description="successMessage" />

						<form class="mt-8 space-y-5" @submit.prevent="submitPassword">
							<DomEmailInput
								v-model="email"
								label="Work email"
								placeholder="name@company.com"
								autocomplete="username"
								required
							/>
							<DomPasswordInput
								v-model="password"
								label="Password"
								placeholder="Enter your password"
								autocomplete="current-password"
								:show-strength="false"
								required
							/>

							<div class="flex flex-wrap items-center justify-between gap-3">
								<DomCheckbox v-model="remember" label="Trust this device for 30 days" />
								<DomButton type="button" size="xs" variant="ghost" @click="requestPasswordless">Forgot password?</DomButton>
							</div>

							<DomButton type="submit" class="w-full" size="lg" :loading="submitting">Continue securely</DomButton>
							<DomButton type="button" class="w-full" size="lg" variant="secondary" :loading="submitting" @click="requestPasswordless">
								Email me a sign-in code
							</DomButton>
						</form>

						<div class="mt-8 flex items-center justify-between gap-5 border-t border-border pt-5">
							<div class="min-w-0">
								<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Demo member</p>
								<p class="mt-1 truncate text-sm">{{ bootstrap?.demoCredentials?.email }}</p>
							</div>
							<DomButton type="button" size="sm" variant="ghost" @click="fillDemoAccount">Use demo account</DomButton>
						</div>
					</template>

					<template v-else-if="view === 'verify'">
						<DomStatusPill tone="info" label="Verification required" />
						<h2 class="mt-5 text-4xl font-semibold tracking-[-0.035em]">{{ verificationHeading }}</h2>
						<p class="mt-3 text-sm leading-6 text-muted-fg">{{ verificationDescription }}</p>

						<DomAlert v-if="errorMessage" class="mt-6" tone="danger" title="Code not accepted" :description="errorMessage" />
						<DomAlert v-if="successMessage" class="mt-6" tone="success" title="First step complete" :description="successMessage" />

						<form class="mt-8 space-y-6" @submit.prevent="verifyChallenge">
							<DomConfirmationCodeInput
								v-model="code"
								label="Six-digit code"
								:description="`Code expires at ${formatDateTime(challenge?.expiresAt)}.`"
								character-set="numeric"
								:uppercase="false"
							/>
							<DomCard padding="md" class="border-dashed bg-secondary/35 shadow-none">
								<div class="flex items-center justify-between gap-4">
									<div>
										<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Demo verification code</p>
										<p class="mt-1 font-mono text-lg tracking-[0.18em]">{{ demoVerificationCode }}</p>
									</div>
									<DomBadge tone="neutral" variant="outline">10 min</DomBadge>
								</div>
							</DomCard>
							<DomButton type="submit" class="w-full" size="lg" :loading="submitting">Verify and continue</DomButton>
							<DomButton type="button" class="w-full" size="lg" variant="ghost" @click="returnToCredentials">Use a different method</DomButton>
						</form>
					</template>

					<template v-else-if="view === 'workspace'">
						<DomStatusPill tone="success" label="Identity verified" />
						<h2 class="mt-5 text-4xl font-semibold tracking-[-0.035em]">Choose your workspace</h2>
						<p class="mt-3 text-sm leading-6 text-muted-fg">Your session is active. Pick where Northstar should take you.</p>

						<DomAlert v-if="errorMessage" class="mt-6" tone="danger" title="Workspace unavailable" :description="errorMessage" />
						<DomAlert v-if="successMessage" class="mt-6" tone="success" title="Signed in" :description="successMessage" />

						<div class="mt-8 flex items-center gap-4 border-y border-border py-5">
							<DomAvatar :name="member?.name" :initials="member?.initials" size="lg" />
							<div class="min-w-0">
								<p class="truncate font-semibold">{{ member?.name }}</p>
								<p class="mt-1 truncate text-sm text-muted-fg">{{ member?.email }} · {{ member?.role }}</p>
							</div>
						</div>

						<div class="mt-7 space-y-5">
							<DomSelect
								v-model="selectedWorkspaceId"
								label="Workspace"
								:options="workspaceOptions"
								width="min-w-[20rem]"
							>
								<template #option="{ option }">
									<div class="min-w-0 py-0.5">
										<p class="truncate text-sm font-medium">{{ option.label }}</p>
										<p class="mt-0.5 truncate text-xs opacity-75">{{ option.description }}</p>
									</div>
								</template>
							</DomSelect>

							<DomCard padding="md" class="bg-secondary/35 shadow-none">
								<div class="grid grid-cols-2 gap-5 text-sm">
									<div>
										<p class="text-xs text-muted-fg">Sign-in method</p>
										<p class="mt-1 font-medium">{{ session?.method }}</p>
									</div>
									<div>
										<p class="text-xs text-muted-fg">Session expires</p>
										<p class="mt-1 font-medium">{{ formatDateTime(session?.expiresAt) }}</p>
									</div>
								</div>
							</DomCard>

							<DomButton type="button" class="w-full" size="lg" :loading="submitting" @click="openWorkspace">
								Open {{ selectedWorkspace?.label || 'workspace' }}
							</DomButton>
							<DomButton type="button" class="w-full" size="lg" variant="ghost" @click="signOut">Sign out</DomButton>
						</div>
					</template>

					<template v-else>
						<DomStatusPill tone="success" label="Handoff ready" />
						<h2 class="mt-5 text-4xl font-semibold tracking-[-0.035em]">You’re in.</h2>
						<p class="mt-3 text-sm leading-6 text-muted-fg">
							{{ selectedWorkspace?.label }} accepted the authenticated session and is ready to load the application shell.
						</p>

						<DomAlert class="mt-6" tone="success" title="Workspace handoff complete" :description="successMessage" />

						<div class="mt-8 divide-y divide-border border-y border-border">
							<div class="flex items-center justify-between gap-5 py-4 text-sm">
								<span class="text-muted-fg">Workspace</span>
								<span class="text-right font-medium">{{ selectedWorkspace?.label }}</span>
							</div>
							<div class="flex items-center justify-between gap-5 py-4 text-sm">
								<span class="text-muted-fg">Route</span>
								<span class="truncate text-right font-mono text-xs">{{ handoff?.path }}</span>
							</div>
							<div class="flex items-center justify-between gap-5 py-4 text-sm">
								<span class="text-muted-fg">Handoff proof</span>
								<span class="truncate text-right font-mono text-xs">{{ handoff?.proof }}</span>
							</div>
							<div class="flex items-center justify-between gap-5 py-4 text-sm">
								<span class="text-muted-fg">Session receipt</span>
								<span class="truncate text-right font-mono text-xs">{{ receipt?.checksum }}</span>
							</div>
						</div>

						<div class="mt-8 space-y-3">
							<DomButton type="button" class="w-full" size="lg" variant="secondary" @click="chooseAnotherWorkspace">Choose another workspace</DomButton>
							<DomButton type="button" class="w-full" size="lg" variant="ghost" :loading="submitting" @click="signOut">Sign out this session</DomButton>
						</div>
					</template>
				</div>
			</div>

			<footer class="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-xs text-muted-fg sm:px-8 lg:px-12">
				<span>Protected by Northstar identity controls</span>
				<span v-if="receipt">Receipt {{ receipt.id }}</span>
				<span v-else>Privacy · Security · Status</span>
			</footer>
		</main>
	</div>
</template>
