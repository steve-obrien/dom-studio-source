import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import templateEditorTailwindServer from './src/pages/experiments/template-editor/tailwindServer.js';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const componentCatalogVirtualId = 'virtual:dom-studio-component-catalog';
const resolvedComponentCatalogVirtualId = `\0${componentCatalogVirtualId}`;
const componentCatalogSections = ['components', 'data', 'forms', 'mobile', 'visual'];

/**
 * Creates the Vite config for DOM Studio.
 *
 * @param {{ command: string }} options Vite config callback options.
 * @returns {import('vite').UserConfig} Vite configuration.
 */
function createViteConfig({ command }) {
	return {
		define: {
			__DOM_STUDIO_SOURCE_ROOT__: JSON.stringify(command === 'serve' ? process.cwd() : ''),
		},
		plugins: [
			domStudioComponentCatalogPlugin(projectRoot),
			templateEditorTailwindServer(),
			vue({
				template: {
					compilerOptions: {
						isCustomElement: isDomStudioCustomElement,
					},
				},
			}),
			tailwindcss(),
		],
		resolve: {
			dedupe: ['vue', 'vue-router', 'pinia'],
			alias: {
				'#now': fileURLToPath(new URL('./packages/now/src/framework', import.meta.url)),
				'@getdom/studio/vue': fileURLToPath(new URL('./src/pages/lib/vue', import.meta.url)),
				'@getdom/studio/headless': fileURLToPath(new URL('./src/pages/lib/headless', import.meta.url)),
			},
		},
		base: '/',
		server: {
			host: true,
		},
	};
}

/**
 * Serves a compact component catalog without importing every component module.
 *
 * @param {string} root Absolute project root.
 * @returns {import('vite').Plugin} Vite plugin.
 */
function domStudioComponentCatalogPlugin(root) {
	return {
		name: 'dom-studio-component-catalog',
		/**
		 * Resolves the public virtual catalog id to Vite's internal id.
		 *
		 * @param {string} id Import id.
		 * @returns {string|null} Resolved virtual module id.
		 */
		resolveId(id) {
			if (id === componentCatalogVirtualId) return resolvedComponentCatalogVirtualId;
			return null;
		},
		/**
		 * Loads the virtual catalog module source.
		 *
		 * @param {string} id Resolved import id.
		 * @returns {string|null} JavaScript module source.
		 */
		load(id) {
			if (id !== resolvedComponentCatalogVirtualId) return null;
			return loadComponentCatalogModule(root);
		},
		/**
		 * Invalidates the virtual catalog when a catalogued component changes.
		 *
		 * @param {import('vite').HmrContext} context Vite HMR context.
		 * @returns {Array<import('vite').ModuleNode>|undefined} Modules to update.
		 */
		handleHotUpdate(context) {
			if (!isComponentCatalogFile(root, context.file)) return;
			const catalogModule = context.server.moduleGraph.getModuleById(resolvedComponentCatalogVirtualId);
			if (!catalogModule) return;
			context.server.moduleGraph.invalidateModule(catalogModule);
			return [catalogModule];
		},
	};
}

/**
 * Checks whether Vue should leave a DOM Studio headless tag as a custom element.
 *
 * @param {string} tag HTML tag name.
 * @returns {boolean} True when the tag belongs to the DOM Studio headless prefix.
 */
function isDomStudioCustomElement(tag) {
	return tag.startsWith('dom-');
}

/**
 * Builds the JavaScript source for the virtual component catalog module.
 *
 * @param {string} root Absolute project root.
 * @returns {string} JavaScript module source.
 */
function loadComponentCatalogModule(root) {
	const catalog = buildComponentCatalog(root);
	return `export const componentCatalog = ${JSON.stringify(catalog, null, '\t')};\n`;
}

/**
 * Discovers DOM Studio component files and extracts serializable docs metadata.
 *
 * @param {string} root Absolute project root.
 * @returns {Array<object>} Component catalog records.
 */
function buildComponentCatalog(root) {
	const records = [];

	for (const section of componentCatalogSections) {
		for (const record of componentRecordsForSection(root, section)) {
			records.push(record);
		}
	}

	return records.sort(sortCatalogRecords);
}

/**
 * Reads component records for one public component section.
 *
 * @param {string} root Absolute project root.
 * @param {string} section Component section name.
 * @returns {Array<object>} Component catalog records for the section.
 */
function componentRecordsForSection(root, section) {
	const sectionDir = path.join(root, 'src', 'pages', section);
	if (!fs.existsSync(sectionDir)) return [];

	const records = [];
	for (const folderEntry of fs.readdirSync(sectionDir, { withFileTypes: true })) {
		if (!folderEntry.isDirectory()) continue;
		const slug = folderEntry.name;
		const componentDir = path.join(sectionDir, slug);

		for (const fileEntry of fs.readdirSync(componentDir, { withFileTypes: true })) {
			if (!fileEntry.isFile() || !/^Dom.+\.vue$/.test(fileEntry.name)) continue;
			if (isExcludedComponentCatalogPath(section, slug, fileEntry.name)) continue;
			records.push(recordFromComponentFile(root, section, slug, fileEntry.name));
		}
	}

	return records.filter(Boolean);
}

/**
 * Converts one Vue component source file into a static catalog record.
 *
 * @param {string} root Absolute project root.
 * @param {string} section Component section name.
 * @param {string} slug Component folder slug.
 * @param {string} fileName Vue component file name.
 * @returns {object|null} Component catalog record.
 */
function recordFromComponentFile(root, section, slug, fileName) {
	const filePath = path.join(root, 'src', 'pages', section, slug, fileName);
	const exportName = fileName.replace(/\.vue$/, '');
	const source = fs.readFileSync(filePath, 'utf8');
	const options = extractDefineOptions(source, filePath);
	const doc = toSerializableObject(options.__doc);
	const studio = toSerializableObject(options.__studio || doc.studio);

	return {
		id: `${section}/${slug}`,
		path: `../${section}/${slug}/${fileName}`,
		section,
		slug,
		exportName,
		route: `/${section}/${slug}`,
		doc,
		studio,
	};
}

/**
 * Extracts a defineOptions object from an SFC source string.
 *
 * @param {string} source Vue SFC source.
 * @param {string} filePath Source file path for error context.
 * @returns {object} Evaluated options object, or an empty object when absent.
 */
function extractDefineOptions(source, filePath) {
	const callMatch = /defineOptions\s*\(/.exec(source);
	if (!callMatch) return {};

	const openIndex = source.indexOf('(', callMatch.index);
	const closeIndex = findMatchingParen(source, openIndex);
	if (openIndex < 0 || closeIndex < 0) return {};

	return evaluateObjectExpression(source.slice(openIndex + 1, closeIndex), filePath);
}

/**
 * Finds the closing parenthesis for a JavaScript call expression.
 *
 * @param {string} source JavaScript-ish source text.
 * @param {number} openIndex Index of the opening parenthesis.
 * @returns {number} Closing parenthesis index, or -1 when unmatched.
 */
function findMatchingParen(source, openIndex) {
	let depth = 0;
	let quote = '';
	let escaped = false;
	let lineComment = false;
	let blockComment = false;

	for (let index = openIndex; index < source.length; index += 1) {
		const char = source[index];
		const next = source[index + 1];

		if (lineComment) {
			if (char === '\n') lineComment = false;
			continue;
		}

		if (blockComment) {
			if (char === '*' && next === '/') {
				blockComment = false;
				index += 1;
			}
			continue;
		}

		if (quote) {
			if (escaped) {
				escaped = false;
				continue;
			}
			if (char === '\\') {
				escaped = true;
				continue;
			}
			if (char === quote) quote = '';
			continue;
		}

		if (char === '/' && next === '/') {
			lineComment = true;
			index += 1;
			continue;
		}

		if (char === '/' && next === '*') {
			blockComment = true;
			index += 1;
			continue;
		}

		if (char === '"' || char === "'" || char === '`') {
			quote = char;
			continue;
		}

		if (char === '(') depth += 1;
		if (char === ')') {
			depth -= 1;
			if (depth === 0) return index;
		}
	}

	return -1;
}

/**
 * Evaluates a trusted component metadata object from repository source.
 *
 * @param {string} expression Object expression source.
 * @param {string} filePath Source file path for VM filename context.
 * @returns {object} Evaluated object, or empty object on failure.
 */
function evaluateObjectExpression(expression, filePath) {
	try {
		const value = vm.runInNewContext(`(${expression})`, {}, { filename: filePath, timeout: 1000 });
		return value && typeof value === 'object' ? value : {};
	} catch {
		return {};
	}
}

/**
 * Converts a value into a plain JSON-safe object.
 *
 * @param {unknown} value Source value.
 * @returns {object} Serializable object, or empty object for unsupported values.
 */
function toSerializableObject(value) {
	const serializable = toSerializableValue(value);
	return serializable && typeof serializable === 'object' && !Array.isArray(serializable) ? serializable : {};
}

/**
 * Converts supported metadata values into JSON-safe data.
 *
 * @param {unknown} value Source value.
 * @returns {unknown} Serializable value, or undefined for unsupported values.
 */
function toSerializableValue(value) {
	if (value == null || ['string', 'number', 'boolean'].includes(typeof value)) return value;
	if (Array.isArray(value)) return value.map(toSerializableValue).filter((item) => item !== undefined);
	if (typeof value !== 'object') return undefined;

	const output = {};
	for (const [key, item] of Object.entries(value)) {
		const serializable = toSerializableValue(item);
		if (serializable !== undefined) output[key] = serializable;
	}
	return output;
}

/**
 * Checks whether a file should refresh the virtual component catalog.
 *
 * @param {string} root Absolute project root.
 * @param {string} filePath Changed file path.
 * @returns {boolean} True when the file belongs to the catalog.
 */
function isComponentCatalogFile(root, filePath) {
	const relative = path.relative(path.join(root, 'src', 'pages'), filePath).split(path.sep).join('/');
	const match = relative.match(/^(components|data|forms|mobile|visual)\/([^/]+)\/(Dom[^/]+\.vue)$/);
	if (!match) return false;
	const [, section, slug, fileName] = match;
	return !isExcludedComponentCatalogPath(section, slug, fileName);
}

/**
 * Checks whether a discovered component path is intentionally excluded.
 *
 * @param {string} section Component section name.
 * @param {string} slug Component folder slug.
 * @param {string} fileName Vue component file name.
 * @returns {boolean} True when the path should be excluded.
 */
function isExcludedComponentCatalogPath(section, slug, fileName) {
	return (
		(section === 'components' && slug === 'playground' && fileName === 'DomRenderer.vue')
		|| (section === 'components' && slug === 'toast' && fileName === 'DomToastItem.vue')
		|| (section === 'forms' && slug === '_shared')
	);
}

/**
 * Sorts catalog records in a stable section, route, and export order.
 *
 * @param {object} a First component catalog record.
 * @param {object} b Second component catalog record.
 * @returns {number} Sort comparison result.
 */
function sortCatalogRecords(a, b) {
	const sectionDelta = componentCatalogSections.indexOf(a.section) - componentCatalogSections.indexOf(b.section);
	if (sectionDelta) return sectionDelta;
	const routeDelta = a.route.localeCompare(b.route);
	if (routeDelta) return routeDelta;
	return a.exportName.localeCompare(b.exportName);
}

export default defineConfig(createViteConfig);
