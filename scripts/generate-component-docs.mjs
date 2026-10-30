import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPackageDoc, copyGuideExamples, readComponentDoc } from './lib/component-docs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vueEntryPath = path.join(root, 'src/pages/lib/vue/index.js');
const vueTypesPath = path.join(root, 'src/pages/lib/vue/index.d.ts');

/**
 * Writes one Markdown file per public Vue component, plus an index, so coding
 * agents and people can read the API without opening component source.
 * Components with a guide beside them (`DomDataGrid.md`) get the guide and
 * its examples; every component gets the generated API reference.
 *
 * @param {string} outputDir - Folder to write, such as dist/npm/docs/components.
 * @returns {{ components: number, guides: number }} Counts written.
 */
export function writeComponentDocs(outputDir) {
	const declarations = fs.readFileSync(vueTypesPath, 'utf8');
	fs.rmSync(outputDir, { recursive: true, force: true });
	fs.mkdirSync(outputDir, { recursive: true });

	const index = [];
	let guides = 0;
	for (const component of publicComponents()) {
		const doc = safeComponentDoc(component.file);
		const guidePath = component.file.replace(/\.vue$/, '.md');
		const guide = fs.existsSync(guidePath) ? fs.readFileSync(guidePath, 'utf8') : '';
		if (guide) {
			guides += 1;
			copyGuideExamples({
				guide,
				examplesDir: path.join(path.dirname(component.file), 'examples'),
				outputDir: path.join(outputDir, component.name, 'examples'),
			});
		}

		fs.writeFileSync(
			path.join(outputDir, `${component.name}.md`),
			buildPackageDoc({ name: component.name, doc, guide, declarations, examplesPath: `./${component.name}/examples` }),
		);
		index.push({ name: component.name, summary: summary(doc), guide: Boolean(guide) });
	}

	fs.writeFileSync(path.join(outputDir, 'README.md'), indexDocument(index));
	return { components: index.length, guides };
}

/**
 * Lists public component exports with their source files, skipping aliases.
 *
 * @returns {Array<{ name: string, file: string }>} Components in export order.
 */
function publicComponents() {
	const entry = fs.readFileSync(vueEntryPath, 'utf8');
	const seen = new Set();
	const components = [];
	for (const match of entry.matchAll(/export\s+\{\s+default\s+as\s+(\w+)\s+\}\s+from\s+'([^']+\.vue)';/g)) {
		const file = path.normalize(path.join(path.dirname(vueEntryPath), match[2]));
		if (seen.has(file)) continue;
		seen.add(file);
		components.push({ name: match[1], file });
	}
	return components;
}

function safeComponentDoc(file) {
	try {
		return readComponentDoc(file);
	} catch (error) {
		console.warn(`Could not read __doc from ${path.relative(root, file)}: ${error.message}`);
		return null;
	}
}

function summary(doc) {
	const text = String(doc?.description || '').split('\n').map((line) => line.trim()).join(' ');
	const sentence = /^(.+?[.!?])(\s|$)/.exec(text);
	return sentence ? sentence[1] : text;
}

function indexDocument(components) {
	return [
		'# DOM Studio components',
		'',
		'One file per component with its props, defaults, events, slots, methods, keyboard support and types. Components marked "guide" also have usage guidance and working examples.',
		'',
		'## Set up once per app',
		'',
		'```js',
		'// main.js',
		"import '@getdom/studio/style.css';",
		'```',
		'',
		'Or, when your own stylesheet runs Tailwind CSS v4:',
		'',
		'```css',
		'@import "tailwindcss";',
		'@import "@getdom/studio/tailwind.css";',
		'@import "@getdom/studio/theme.css";',
		'```',
		'',
		'Some components render custom elements whose tags start with `dom-`. Tell Vue about them in `vite.config.js`:',
		'',
		'```js',
		"import vue from '@vitejs/plugin-vue';",
		'',
		'export default {',
		'\tplugins: [',
		"\t\tvue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('dom-') } } }),",
		'\t],',
		'};',
		'```',
		'',
		'`DomButton` renders `<button>` without a `type`, so set `type="button"` on buttons inside a form that should not submit it.',
		'',
		'## Components',
		'',
		...components.map((component) => `- [${component.name}](./${component.name}.md)${component.guide ? ' (guide)' : ''}${component.summary ? `: ${component.summary}` : ''}`),
		'',
	].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const outputDir = path.resolve(root, process.argv[2] || 'dist/component-docs');
	const { components, guides } = writeComponentDocs(outputDir);
	console.log(`Wrote ${components} component docs (${guides} with guides) to ${path.relative(root, outputDir)}.`);
}
