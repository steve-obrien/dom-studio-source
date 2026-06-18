import { computed, ref } from 'vue';

export const THEME_MODE_STORAGE_KEY = 'theme-mode';
export const themeModeValues = ['light', 'dark', 'system'];

const mode = ref('system');
const systemDark = ref(false);
let mediaQueryList = null;
let mediaListener = null;

export const resolvedTheme = computed(() => resolveThemeMode(mode.value, systemDark.value));

export function normalizeThemeMode(value) {
	return themeModeValues.includes(value) ? value : 'system';
}

export function resolveThemeMode(value = mode.value, prefersDark = systemDark.value) {
	const normalized = normalizeThemeMode(value);
	if (normalized === 'system') return prefersDark ? 'dark' : 'light';
	return normalized;
}

export function readThemeMode() {
	try {
		return normalizeThemeMode(storage()?.getItem(THEME_MODE_STORAGE_KEY));
	} catch {
		return 'system';
	}
}

export function initTheme() {
	if (typeof window !== 'undefined') {
		mode.value = readThemeMode();
		installSystemThemeListener();
	}
	return applyThemeMode();
}

export function setThemeMode(value) {
	const next = normalizeThemeMode(value);
	mode.value = next;
	writeThemeMode(next);
	if (typeof window !== 'undefined' && !mediaQueryList) installSystemThemeListener();
	return applyThemeMode();
}

export function cycleThemeMode() {
	const next = ({ light: 'dark', dark: 'system', system: 'light' })[mode.value] || 'light';
	return setThemeMode(next);
}

export function applyThemeMode(value = mode.value) {
	const next = resolveThemeMode(value, systemDark.value);
	if (typeof document !== 'undefined') document.documentElement.dataset.theme = next;
	return next;
}

export function useTheme() {
	return {
		mode,
		resolvedTheme,
		setMode: setThemeMode,
		cycleMode: cycleThemeMode,
		initTheme,
		currentTheme: resolvedTheme,
		toggleTheme: cycleThemeMode,
	};
}

function installSystemThemeListener() {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

	const nextMediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
	systemDark.value = nextMediaQueryList.matches;
	if (mediaQueryList && mediaListener) removeMediaListener(mediaQueryList, mediaListener);

	mediaQueryList = nextMediaQueryList;
	mediaListener = (event) => {
		systemDark.value = event.matches;
		applyThemeMode();
	};
	addMediaListener(mediaQueryList, mediaListener);
}

function storage() {
	if (typeof window === 'undefined') return null;
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

function writeThemeMode(value) {
	try {
		storage()?.setItem(THEME_MODE_STORAGE_KEY, value);
	} catch {
		// Ignore storage failures; the active document theme still updates.
	}
}

function addMediaListener(queryList, listener) {
	if (typeof queryList.addEventListener === 'function') {
		queryList.addEventListener('change', listener);
		return;
	}
	queryList.addListener?.(listener);
}

function removeMediaListener(queryList, listener) {
	if (typeof queryList.removeEventListener === 'function') {
		queryList.removeEventListener('change', listener);
		return;
	}
	queryList.removeListener?.(listener);
}
