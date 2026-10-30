// Mount a self-contained HTML example (markup + inline module scripts) for
// headless docs. The same file is imported with ?raw for the code panel and
// passed here for the live preview — one source of truth.

const MODULE_LOADERS = {
	'@getdom/studio/headless': () => import('../../lib/headless/index.js'),
	'@getdom/studio/headless/accordion.js': () => import('../../lib/headless/accordion.js'),
	'@getdom/studio/headless/autocomplete.js': () => import('../../lib/headless/autocomplete.js'),
	'@getdom/studio/headless/combobox.js': () => import('../../lib/headless/combobox.js'),
	'@getdom/studio/headless/dialog.js': () => import('../../lib/headless/dialog.js'),
	'@getdom/studio/headless/drawer.js': () => import('../../lib/headless/drawer.js'),
	'@getdom/studio/headless/dropdown.js': () => import('../../lib/headless/dropdown.js'),
	'@getdom/studio/headless/popover.js': () => import('../../lib/headless/popover.js'),
	'@getdom/studio/headless/tabs.js': () => import('../../lib/headless/tabs.js'),
	'@getdom/studio/headless/toggle.js': () => import('../../lib/headless/toggle.js'),
	'@getdom/studio/headless/tooltip.js': () => import('../../lib/headless/tooltip.js'),
};

const IMPORT_RE = /^\s*import\s+['"]([^'"]+)['"]\s*;?\s*$/gm;

function stripModuleScripts(source) {
	return source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').trim();
}

function extractModuleScripts(source) {
	const scripts = [];
	const re = /<script\b[^>]*type=["']module["'][^>]*>([\s\S]*?)<\/script>/gi;
	let match;
	while ((match = re.exec(source))) {
		scripts.push(match[1].trim());
	}
	return scripts;
}

function importSpecs(body) {
	return [...body.matchAll(IMPORT_RE)].map((m) => m[1]);
}

async function preloadImports(scripts) {
	const specs = new Set(scripts.flatMap(importSpecs));
	for (const spec of specs) {
		const load = MODULE_LOADERS[spec];
		if (!load) throw new Error(`Unknown @getdom import in HTML example: ${spec}`);
		await load();
	}
}

function injectModuleScript(container, body) {
	const stripped = body.replace(IMPORT_RE, '').trim();
	if (!stripped) return;

	// Real <script type="module"> — AsyncFunction/eval is blocked by CSP.
	// `root` is the demo mount node (script.parentElement).
	const script = document.createElement('script');
	script.type = 'module';
	script.textContent = `\n${stripped}`;
	container.appendChild(script);
}

/** Inject example markup and run any `<script type="module">` blocks. */
export async function mountHtmlExample(container, source) {
	if (!container) return;
	const scripts = extractModuleScripts(source);

	await preloadImports(scripts);

	container.replaceChildren();
	container.insertAdjacentHTML('afterbegin', stripModuleScripts(source));

	for (const body of scripts) {
		injectModuleScript(container, body);
	}
}
