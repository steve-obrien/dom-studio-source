import { ref, computed } from 'vue';

// Three theme modes stored in localStorage. `system` follows the OS via
// prefers-color-scheme and reacts live to OS changes.
const MODE_KEY = 'theme-mode';
const MODES = ['light', 'dark', 'system'];

const mode = ref('system');
const systemDark = ref(false);
let mediaListener = null;

const resolvedTheme = computed(() => {
	if (mode.value === 'system') return systemDark.value ? 'dark' : 'light';
	return mode.value;
});

function applyToDom() {
	if (typeof document === 'undefined') return;
	document.documentElement.dataset.theme = resolvedTheme.value;
}

export function useTheme() {
	const setMode = (m) => {
		if (!MODES.includes(m)) m = 'system';
		mode.value = m;
		if (typeof localStorage !== 'undefined') localStorage.setItem(MODE_KEY, m);
		applyToDom();
	};

	// light → dark → system → light → …
	const cycleMode = () => {
		const next = ({ light: 'dark', dark: 'system', system: 'light' })[mode.value] || 'light';
		setMode(next);
	};

	const initTheme = () => {
		if (typeof window === 'undefined') return;

		let stored = localStorage.getItem(MODE_KEY);
		mode.value = MODES.includes(stored) ? stored : 'system';

		const mql = window.matchMedia('(prefers-color-scheme: dark)');
		systemDark.value = mql.matches;
		if (!mediaListener) {
			mediaListener = (e) => { systemDark.value = e.matches; applyToDom(); };
			mql.addEventListener('change', mediaListener);
		}

		applyToDom();
	};

	return {
		mode,
		resolvedTheme,
		setMode,
		cycleMode,
		initTheme,
		// Back-compat aliases for existing callers.
		currentTheme: resolvedTheme,
		toggleTheme: cycleMode,
	};
}
