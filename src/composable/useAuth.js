import { computed, reactive } from 'vue';
import { getNowPayload } from '#now/runtime/payload.js';

const guestAuth = {
	user: null,
	entitlements: [],
	isAuthenticated: false,
};

const state = reactive({
	auth: normalizeAuth(null),
	loaded: false,
	loading: false,
});

let pendingSession = null;

export function useAuth() {
	ensureAuthState();

	const isAuthenticated = computed(() => Boolean(state.auth?.isAuthenticated));
	const user = computed(() => state.auth?.user || null);
	const entitlements = computed(() => state.auth?.entitlements || []);

	return {
		auth: computed(() => state.auth),
		entitlements,
		isAuthenticated,
		loaded: computed(() => state.loaded),
		loading: computed(() => state.loading),
		user,
		hasEntitlement,
		refreshSession,
		signIn,
		signOut,
		signUp,
	};
}

export function useAccountStatus() {
	const auth = useAuth();
	const isLoggedIn = computed(() => auth.isAuthenticated.value);
	const hasSourceAccess = computed(() => auth.entitlements.value.includes('source'));
	const needsPurchase = computed(() => isLoggedIn.value && !hasSourceAccess.value);

	return {
		...auth,
		hasSourceAccess,
		isLoggedIn,
		needsPurchase,
	};
}

export function getAuthState() {
	ensureAuthState();
	return state.auth;
}

export function setAuthState(auth) {
	state.auth = normalizeAuth(auth);
	state.loaded = true;
	return state.auth;
}

export function hydrateAuthState(auth) {
	return setAuthState(auth);
}

export function hasEntitlement(entitlement) {
	if (!entitlement) return true;
	return Boolean(state.auth?.entitlements?.includes(entitlement));
}

export async function refreshSession() {
	if (pendingSession) return pendingSession;

	state.loading = true;
	pendingSession = fetch('/api/auth/session')
		.then(async (response) => {
			const payload = await response.json();
			if (!response.ok) throw new Error(payload.error || 'Could not load session.');
			state.loaded = true;
			return setAuthState(payload.auth);
		})
		.finally(() => {
			state.loading = false;
			pendingSession = null;
		});

	return pendingSession;
}

export async function signIn({ email, password } = {}) {
	const response = await fetch('/api/auth/sign-in', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
	});
	const payload = await response.json();
	if (!response.ok) throw new Error(payload.error || 'Sign in failed.');
	return setAuthState(payload.auth || payload);
}

export async function signUp({ email, password, name } = {}) {
	const response = await fetch('/api/auth/sign-up', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password, name }),
	});
	const payload = await response.json();
	if (!response.ok) throw new Error(payload.error || 'Sign up failed.');
	return setAuthState(payload.auth || payload);
}

export async function signOut() {
	const response = await fetch('/api/auth/sign-out', {
		method: 'POST',
	});
	const payload = await response.json();
	if (!response.ok) throw new Error(payload.error || 'Sign out failed.');
	return setAuthState(payload.auth);
}

function readInitialAuth() {
	return normalizeAuth(getNowPayload()?.auth);
}

function ensureAuthState() {
	if (state.loaded) return;
	setAuthState(readInitialAuth());
}

function normalizeAuth(auth) {
	return {
		...guestAuth,
		...(auth || {}),
		entitlements: Array.isArray(auth?.entitlements) ? auth.entitlements : [],
	};
}
