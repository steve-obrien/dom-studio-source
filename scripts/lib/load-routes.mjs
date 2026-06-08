import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const routesFilePath = path.join(rootDir, 'src', 'routes.js');
const pagesDirPath = path.join(rootDir, 'src', 'pages');
const blogContentDirPath = path.join(rootDir, 'src', 'pages', 'blog', 'content');

const loadRoutesFromRoutesFile = async () => {
	const routesFile = await readFile(routesFilePath, 'utf8');
	const matches = [...routesFile.matchAll(/path:\s*['"`]([^'"`]+)['"`]/g)];
	return [
		...new Set(
			matches
				.map((match) => match[1]?.trim())
				.filter(Boolean)
				.filter((routePath) => routePath.startsWith("/"))
				.filter((routePath) => !routePath.includes(":") && !routePath.includes("*") && !routePath.includes("$")),
		),
	];
};

const loadRoutesFromPagesDir = async () => {
	const files = await listIndexFiles(pagesDirPath);
	return files
		.map((file) => routePathFromIndexFile(path.relative(pagesDirPath, file)))
		.filter(Boolean);
};

const listIndexFiles = async (dir) => {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const entryPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...await listIndexFiles(entryPath));
			continue;
		}
		if (entry.isFile() && entry.name === 'Index.vue') files.push(entryPath);
	}

	return files;
};

const routePathFromIndexFile = (relativeFile) => {
	const normalized = relativeFile.split(path.sep).join('/');
	const match = normalized.match(/^(.+)\/Index\.vue$/);
	if (!match) return null;
	const inner = match[1];
	if (!inner || inner.includes('..')) return null;
	if (inner.toLowerCase() === 'index') return '/';
	return `/${inner}`;
};

const sortRoutes = (routes) => routes.sort((a, b) => {
	if (a === '/') return -1;
	if (b === '/') return 1;
	return a.localeCompare(b);
});

const loadLocalBlogRoutes = async () => {
	try {
		const entries = await readdir(blogContentDirPath, { withFileTypes: true });
		const routes = await Promise.all(entries
			.filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
			.map(async (entry) => {
				const filePath = path.join(blogContentDirPath, entry.name);
				const raw = await readFile(filePath, 'utf8');
				const slug = readFrontmatterValue(raw, 'slug') || entry.name.replace(/\.md$/, '');
				return `/blog/${normalizeSlug(slug)}`;
			}));

		return routes.filter((route) => route !== '/blog/');
	} catch {
		return [];
	}
};

export const loadStaticRoutes = async () => {
	try {
		const routes = sortRoutes([
			...new Set([
				...await loadRoutesFromRoutesFile(),
				...await loadRoutesFromPagesDir(),
				...await loadLocalBlogRoutes(),
			]),
		]);
		return routes.length ? routes : ["/", "/docs"];
	} catch {
		return ["/", "/docs"];
	}
};

function readFrontmatterValue(raw, key) {
	if (!raw.startsWith('---')) return '';
	const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
	if (!match) return '';

	for (const line of match[1].split('\n')) {
		const separator = line.indexOf(':');
		if (separator === -1) continue;

		const name = line.slice(0, separator).trim();
		if (name !== key) continue;

		return line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
	}

	return '';
}

function normalizeSlug(value) {
	return String(value || '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}
