import { readFile } from 'node:fs/promises';
import { compile } from 'tailwindcss';

const maxBodyBytes = 512 * 1024;
const cssCache = new Map();
let compilerPromise = null;

export async function handleTemplateEditorTailwindRequest(request, response) {
	if (request.method !== 'POST') {
		response.statusCode = 405;
		response.setHeader('allow', 'POST');
		response.end('Method not allowed');
		return;
	}

	const body = await readRequestPayload(request);
	const payload = body ? JSON.parse(body) : {};
	const content = String(payload.content || '');
	const candidates = extractTailwindCandidates(content);
	const cacheKey = candidates.join(' ');

	if (!cssCache.has(cacheKey)) {
		const compiler = await getTailwindCompiler();
		cssCache.set(cacheKey, compiler.build(candidates));
	}

	response.statusCode = 200;
	response.setHeader('content-type', 'text/css; charset=utf-8');
	response.end(cssCache.get(cacheKey));
}

async function getTailwindCompiler() {
	if (!compilerPromise) {
		const theme = await readFile(new URL('../../node_modules/tailwindcss/theme.css', import.meta.url), 'utf8');
		compilerPromise = compile(`${theme}\n@tailwind utilities;`);
	}
	return compilerPromise;
}

function extractTailwindCandidates(content) {
	const candidates = new Set();
	const attrPattern = /(?:^|\s)(?::?class|className)\s*=\s*(["'`])([\s\S]*?)\1/g;
	let match;

	while ((match = attrPattern.exec(content))) {
		for (const token of match[2].split(/\s+/)) {
			const candidate = cleanCandidate(token);
			if (candidate) candidates.add(candidate);
		}
	}

	return [...candidates].sort();
}

function cleanCandidate(token) {
	return token
		.trim()
		.replace(/^['"`{]+/, '')
		.replace(/['"`},;]+$/, '');
}

function readRequestBody(request) {
	return new Promise((resolve, reject) => {
		let body = '';
		request.setEncoding('utf8');
		request.on('data', (chunk) => {
			body += chunk;
			if (body.length > maxBodyBytes) {
				reject(new Error('Template editor Tailwind payload is too large.'));
				request.destroy();
			}
		});
		request.on('end', () => resolve(body));
		request.on('error', reject);
	});
}

function readRequestPayload(request) {
	if (typeof request.body === 'string') return request.body;
	if (Buffer.isBuffer(request.body)) return request.body.toString('utf8');
	if (request.body && typeof request.body === 'object') return JSON.stringify(request.body);
	return readRequestBody(request);
}
