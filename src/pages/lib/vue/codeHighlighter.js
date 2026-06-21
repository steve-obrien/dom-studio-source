// Optional syntax highlighting via Shiki, loaded from an ESM CDN at runtime.
//
// Shiki is polish, not a hard runtime dependency. If the CDN is blocked,
// unavailable, or the app is rendering on the server, callers get null and
// can fall back to plain code rendering.

const SHIKI_URL = 'https://esm.sh/shiki@1';
const LIGHT = 'github-light';
const DARK = 'github-dark';
const LANGS = ['vue', 'html', 'javascript', 'typescript', 'css', 'json', 'markdown', 'text'];
const LANG_ALIASES = {
	js: 'javascript',
	ts: 'typescript',
	md: 'markdown',
	txt: 'text',
};

let highlighterPromise = null;
let loadFailed = false;

async function getHighlighter() {
	if (loadFailed) return null;
	if (highlighterPromise) return highlighterPromise;

	highlighterPromise = (async () => {
		if (typeof window === 'undefined') return null;
		try {
			const shiki = await import(/* @vite-ignore */ SHIKI_URL);
			const factory = shiki.createHighlighter || shiki.getHighlighter;
			if (!factory) throw new Error('shiki: no factory export');
			return await factory({ themes: [LIGHT, DARK], langs: LANGS });
		} catch (err) {
			loadFailed = true;
			if (typeof console !== 'undefined') {
				// eslint-disable-next-line no-console
				console.info('[dom-studio] Shiki CDN unavailable; using plain code blocks.', err?.message);
			}
			return null;
		}
	})();

	return highlighterPromise;
}

export async function highlight(code, lang = 'vue') {
	if (!code) return null;
	const h = await getHighlighter();
	if (!h) return null;
	try {
		const normalizedLang = LANG_ALIASES[lang] || lang;
		return h.codeToHtml(code, {
			lang: LANGS.includes(normalizedLang) ? normalizedLang : 'html',
			themes: { light: LIGHT, dark: DARK },
		});
	} catch {
		return null;
	}
}
