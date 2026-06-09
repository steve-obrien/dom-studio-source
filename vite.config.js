import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import {
	legacyThemeAiEndpointPath,
	requestThemeFromOpenAi,
	resolveThemeAiConfig,
	themeAiEndpointPath,
} from './server/lib/themeAi.js';
import templateEditorTailwindServer from './src/pages/experiments/template-editor/tailwindServer.js';

function themeAiServer() {
	let themeAiConfig = resolveThemeAiConfig({});

	return {
		name: 'theme-ai-server',
		configResolved(config) {
			const env = loadEnv(config.mode, config.root, '');
			themeAiConfig = resolveThemeAiConfig(env);
		},
		configureServer(server) {
			const endpointPaths = new Set([themeAiEndpointPath, legacyThemeAiEndpointPath]);

			server.middlewares.use(async (request, response, next) => {
				const pathname = new URL(request.url || '/', 'http://localhost').pathname;
				if (!endpointPaths.has(pathname)) {
					next();
					return;
				}

				if (request.method !== 'POST') {
					next();
					return;
				}

				try {
					if (!themeAiConfig.apiKey) {
						sendJson(response, 500, { error: 'OPENAI_API_KEY is not available to the local dev server.' });
						return;
					}

					const body = await readJsonBody(request);
					if (themeAiConfig.publicToken && request.headers.authorization !== `Bearer ${themeAiConfig.publicToken}`) {
						sendJson(response, 401, { error: 'Unauthorized.' });
						return;
					}
					const theme = await requestThemeFromOpenAi({
						apiKey: themeAiConfig.apiKey,
						model: themeAiConfig.model,
						prompt: body.prompt || '',
						tokens: body.tokens || {},
					});
					sendJson(response, 200, theme);
				} catch (error) {
					sendJson(response, 500, { error: error.message || 'Theme generation failed.' });
				}
			});
		},
	};
}

function readJsonBody(request) {
	return new Promise((resolve, reject) => {
		let body = '';
		request.on('data', (chunk) => {
			body += chunk;
			if (body.length > 200000) {
				request.destroy();
				reject(new Error('Request body is too large.'));
			}
		});
		request.on('end', () => {
			try {
				resolve(body ? JSON.parse(body) : {});
			} catch {
				reject(new Error('Request body must be valid JSON.'));
			}
		});
		request.on('error', reject);
	});
}

function sendJson(response, status, body) {
	response.statusCode = status;
	response.setHeader('Content-Type', 'application/json');
	response.end(JSON.stringify(body));
}

export default defineConfig({
	plugins: [
		themeAiServer(),
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
