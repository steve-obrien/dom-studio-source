import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import designerFileStorageServer from './src/pages/designer/core/fileStorageServer.js';
import {
	componentCatalogOutputPath,
	isComponentCatalogFile,
	writeComponentCatalogModule,
} from './scripts/lib/component-catalog.mjs';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

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
			domStudioStylesFirstPlugin(),
			designerFileStorageServer({ root: projectRoot }),
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
			port: 8100,
			strictPort: true,
			allowedHosts: ['local.getdom.studio'],
		},
	};
}

/**
 * Keeps the generated component catalog in sync for local site builds.
 *
 * @param {string} root Absolute project root.
 * @returns {import('vite').Plugin} Vite plugin.
 */
function domStudioComponentCatalogPlugin(root) {
	return {
		name: 'dom-studio-component-catalog',
		/**
		 * Generates the component catalog before Vite resolves app modules.
		 *
		 * @returns {void}
		 */
		buildStart() {
			writeComponentCatalogModule(root);
		},
		/**
		 * Invalidates the generated catalog when a catalogued component changes.
		 *
		 * @param {import('vite').HmrContext} context Vite HMR context.
		 * @returns {Array<import('vite').ModuleNode>|undefined} Modules to update.
		 */
		handleHotUpdate(context) {
			if (!isComponentCatalogFile(root, context.file)) return;
			writeComponentCatalogModule(root);
			const catalogModule = context.server.moduleGraph.getModuleById(componentCatalogOutputPath(root));
			if (!catalogModule) return;
			context.server.moduleGraph.invalidateModule(catalogModule);
			return [...new Set([...context.modules, catalogModule])];
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

export default defineConfig(createViteConfig);

/**
 * Places the entry stylesheet before SSR module preloads so the parser discovers
 * paint-critical CSS before queuing the route's JavaScript dependencies.
 *
 * @returns {import('vite').Plugin} Production HTML ordering plugin.
 */
function domStudioStylesFirstPlugin() {
	return {
		name: 'dom-studio-styles-first',
		apply: 'build',
		transformIndexHtml: {
			order: 'post',
			/**
			 * Moves generated stylesheet links ahead of Now's resource hints.
			 * @param {string} html Built HTML entry template.
			 * @returns {string} Template with earlier stylesheet discovery.
			 */
			handler(html) {
				const marker = '<!--now-preload-links-->';
				if (!html.includes(marker)) return html;
				const styles = html.match(/<link\b[^>]*\brel="stylesheet"[^>]*>/g) || [];
				for (const style of styles) html = html.replace(style, '');
				return html.replace(marker, `${styles.join('\n')}\n${marker}`);
			},
		},
	};
}
