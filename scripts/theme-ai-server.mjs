import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
	isThemeAiOriginAllowed,
	legacyThemeAiEndpointPath,
	requestThemeFromOpenAi,
	resolveThemeAiConfig,
	setThemeAiCorsHeaders,
	themeAiEndpointPath,
} from '../server/lib/themeAi.js';

await loadEnvFile('.env');
await loadEnvFile('.env.local');

const port = Number(process.env.PORT || 8787);
const themeAiConfig = resolveThemeAiConfig();
const endpointPaths = new Set([themeAiEndpointPath, legacyThemeAiEndpointPath]);

if (!themeAiConfig.apiKey) {
	console.error('OPENAI_API_KEY is required. Add it to .env on the server.');
	process.exit(1);
}

createServer(async (request, response) => {
	const origin = request.headers.origin || '';
	const pathname = new URL(request.url || '/', 'http://localhost').pathname;

	if (pathname === '/health') {
		sendJson(response, 200, { ok: true }, origin);
		return;
	}

	if (!endpointPaths.has(pathname)) {
		sendJson(response, 404, { error: 'Not found.' }, origin);
		return;
	}

	if (!isThemeAiOriginAllowed(origin, themeAiConfig.allowedOrigins)) {
		sendJson(response, 403, { error: 'Origin is not allowed.' }, origin);
		return;
	}

	if (request.method === 'OPTIONS') {
		sendJson(response, 204, null, origin);
		return;
	}

	if (request.method !== 'POST') {
		sendJson(response, 405, { error: 'Method not allowed.' }, origin);
		return;
	}

	if (themeAiConfig.publicToken && request.headers.authorization !== `Bearer ${themeAiConfig.publicToken}`) {
		sendJson(response, 401, { error: 'Unauthorized.' }, origin);
		return;
	}

	try {
		const body = await readJsonBody(request);
		const theme = await requestThemeFromOpenAi({
			apiKey: themeAiConfig.apiKey,
			model: themeAiConfig.model,
			prompt: body.prompt || '',
			tokens: body.tokens || {},
		});
		sendJson(response, 200, theme, origin);
	} catch (error) {
		sendJson(response, 500, { error: error.message || 'Theme generation failed.' }, origin);
	}
}).listen(port, () => {
	console.log(`Theme AI server listening on http://0.0.0.0:${port}${themeAiEndpointPath}`);
});

async function readJsonBody(request) {
	return new Promise((resolveBody, reject) => {
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
				resolveBody(body ? JSON.parse(body) : {});
			} catch {
				reject(new Error('Request body must be valid JSON.'));
			}
		});
		request.on('error', reject);
	});
}

function sendJson(response, status, body, origin = '') {
	response.statusCode = status;
	response.setHeader('Content-Type', 'application/json');
	setThemeAiCorsHeaders(response, origin, themeAiConfig.allowedOrigins);
	response.end(body == null ? '' : JSON.stringify(body));
}

async function loadEnvFile(path) {
	try {
		const contents = await readFile(resolve(path), 'utf8');
		for (const line of contents.split(/\r?\n/)) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
			if (!match || process.env[match[1]]) continue;
			process.env[match[1]] = unquoteEnvValue(match[2]);
		}
	} catch {
		// Optional env file.
	}
}

function unquoteEnvValue(value) {
	const trimmed = value.trim();
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"'))
		|| (trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1);
	}
	return trimmed;
}
