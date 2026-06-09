import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import templateEditorTailwindServer from './src/pages/experiments/template-editor/tailwindServer.js';

export default defineConfig({
	plugins: [
		templateEditorTailwindServer(),
		vue({
			template: {
				compilerOptions: {
					isCustomElement: (tag) => tag.startsWith('dom-'),
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
});
