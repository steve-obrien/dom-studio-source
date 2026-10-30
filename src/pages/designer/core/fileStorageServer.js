import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Dev-server endpoint for the designer's file storage adapter.
 *
 * Reads and writes `.vue` and `.html` files in one folder, so the canvas can
 * edit real templates in a project. It only runs under `vite serve`; the
 * production site has no file endpoint, and the canvas falls back to the
 * browser.
 *
 * The folder is `DESIGNER_FILES_DIR` (relative to the project) or
 * `designer-files/`. Paths are relative to it; anything outside, hidden or of
 * another type is refused.
 */

const endpoint = '/__designer/files';
const maxBodyBytes = 512 * 1024;
const extensions = ['.vue', '.html'];

/** Resolves a relative path inside the root, or throws. */
export function safeFilePath(root, relative) {
	const value = String(relative || '').replace(/\\/g, '/').replace(/^\/+/, '');
	if (!value || value.split('/').some((part) => !part || part === '..' || part.startsWith('.'))) throw new Error('Use a relative path inside the designer folder.');
	if (!extensions.some((extension) => value.endsWith(extension))) throw new Error('Only .vue and .html files can be opened.');
	const resolved = path.resolve(root, value);
	if (!resolved.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error('Use a relative path inside the designer folder.');
	return { relative: value, absolute: resolved };
}

/** Lists editable files under the root, depth first, sorted. */
async function listFiles(root, prefix = '') {
	const entries = await readdir(path.join(root, prefix), { withFileTypes: true }).catch(() => []);
	const files = [];
	for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
		if (entry.name.startsWith('.')) continue;
		const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (entry.isDirectory()) files.push(...await listFiles(root, relative));
		else if (entry.isFile() && extensions.some((extension) => entry.name.endsWith(extension))) files.push({ path: relative });
	}
	return files;
}

function readBody(request) {
	return new Promise((resolve, reject) => {
		let size = 0;
		const chunks = [];
		request.on('data', (chunk) => {
			size += chunk.length;
			if (size > maxBodyBytes) { reject(new Error('Files must be under 512 KB.')); request.destroy(); return; }
			chunks.push(chunk);
		});
		request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
		request.on('error', reject);
	});
}

function send(response, status, body) {
	response.statusCode = status;
	response.setHeader('content-type', typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json');
	response.end(typeof body === 'string' ? body : JSON.stringify(body));
}

/**
 * Handles one file request; exported for tests.
 *
 * @param {string} root Folder holding the files.
 * @param {import('node:http').IncomingMessage} request Request.
 * @param {import('node:http').ServerResponse} response Response.
 */
export async function handleFileRequest(root, request, response) {
	try {
		const url = new URL(request.url || '/', 'http://localhost');
		if (request.method === 'GET') {
			const relative = url.searchParams.get('path');
			if (!relative) { send(response, 200, { files: await listFiles(root) }); return; }
			const file = safeFilePath(root, relative);
			try {
				send(response, 200, { path: file.relative, source: await readFile(file.absolute, 'utf8') });
			} catch {
				send(response, 404, 'No such file.');
			}
			return;
		}
		if (request.method === 'PUT') {
			const payload = JSON.parse((await readBody(request)) || '{}');
			const file = safeFilePath(root, payload.path);
			if (typeof payload.source !== 'string') throw new Error('Send the file source as a string.');
			await mkdir(path.dirname(file.absolute), { recursive: true });
			await writeFile(file.absolute, payload.source.endsWith('\n') ? payload.source : `${payload.source}\n`, 'utf8');
			send(response, 200, { path: file.relative });
			return;
		}
		response.setHeader('allow', 'GET, PUT');
		send(response, 405, 'Method not allowed.');
	} catch (error) {
		send(response, 400, error instanceof Error ? error.message : 'File request failed.');
	}
}

/**
 * Vite plugin that serves the endpoint during development.
 *
 * @param {{ root?: string }} [options] Project root; the folder resolves against it.
 * @returns {import('vite').Plugin}
 */
export default function designerFileStorageServer({ root = process.cwd() } = {}) {
	const folder = path.resolve(root, process.env.DESIGNER_FILES_DIR || 'designer-files');
	return {
		name: 'designer-file-storage',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use(endpoint, (request, response) => handleFileRequest(folder, request, response));
		},
	};
}
