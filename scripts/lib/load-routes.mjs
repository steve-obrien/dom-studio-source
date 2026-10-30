import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { componentCatalog } from '../../src/pages/_layout/componentCatalog.generated.js';
import { isIndexablePage } from '../../src/seo.js';

const rootDir = process.cwd();
const routesFilePath = path.join(rootDir, 'src', 'routes.js');
const pagesDirPath = path.join(rootDir, 'src', 'pages');
const blogContentDirPath = path.join(rootDir, 'src', 'pages', 'blog', 'content');
const excludedStaticRoutePrefixes = [
	'/auth',
];

/**
 * @typedef {Object} StaticRouteRecord
 * @property {string} path Public route path.
 * @property {string} [lastmod] ISO last modified timestamp when known.
 */

/**
 * Loads concrete route paths that are declared directly in the application
 * route table and are suitable for static SEO output.
 *
 * @returns {Promise<StaticRouteRecord[]>} Public static route records from src/routes.js.
 */
const loadRoutesFromRoutesFile = async () => {
	const routesFile = await readFile(routesFilePath, 'utf8');
	const lastmod = await loadFileLastModified(routesFilePath);
	const matches = [...routesFile.matchAll(/path:\s*['"`]([^'"`]+)['"`]\s*,\s*component:/g)];
	return [
		...new Set(
			matches
				.map((match) => match[1]?.trim())
				.filter(Boolean)
				.filter(isStaticRouteCandidate),
		),
	].map((routePath) => createRouteRecord(routePath, lastmod));
};

/**
 * Loads route paths inferred from page entry files, including the homepage's
 * private composition files when calculating its modification date.
 *
 * @returns {Promise<StaticRouteRecord[]>} Public static route records from src/pages.
 */
const loadRoutesFromPagesDir = async () => {
	const files = await listPageFiles(pagesDirPath);
	const homeDirectory = `${path.join(pagesDirPath, '_home')}${path.sep}`;
	const homeFiles = files.filter((file) => file.startsWith(homeDirectory));
	const records = await Promise.all(files.filter((file) => path.basename(file) === 'Index.vue').map(async (file) => {
		const routePath = routePathFromIndexFile(path.relative(pagesDirPath, file));
		if (!routePath) return null;
		const sourceFiles = routePath === '/' ? [file, ...homeFiles] : [file];
		const modifiedDates = await Promise.all(sourceFiles.map(loadFileLastModified));
		return createRouteRecord(routePath, modifiedDates.reduce(latestLastModified, ''));
	}));

	return records.filter(Boolean);
};

/**
 * Includes generated component documentation that has no dedicated Index.vue page.
 *
 * @returns {Promise<StaticRouteRecord[]>} Source-backed component route records.
 */
async function loadGeneratedComponentRoutes() {
	return Promise.all(componentCatalog.map(async (record) => createRouteRecord(
		record.route,
		await loadFileLastModified(path.resolve(pagesDirPath, '_layout', record.path)),
	)));
}

/**
 * Recursively finds page source files below a directory.
 *
 * @param {string} dir Directory to scan.
 * @returns {Promise<string[]>} Absolute page source file paths.
 */
const listPageFiles = async (dir) => {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const entryPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...await listPageFiles(entryPath));
			continue;
		}
		if (entry.isFile()) files.push(entryPath);
	}

	return files;
};

/**
 * Converts a page entry file path into its public route path.
 *
 * @param {string} relativeFile File path relative to src/pages.
 * @returns {string|null} Public route path, or null when the file should not be indexed.
 */
const routePathFromIndexFile = (relativeFile) => {
	const normalized = relativeFile.split(path.sep).join('/');
	if (normalized === 'Index.vue') return '/';
	const match = normalized.match(/^(.+)\/Index\.vue$/);
	if (!match) return null;
	const inner = match[1];
	if (!inner || inner.includes('..')) return null;
	if (inner.split('/').some(isPrivateRouteSegment)) return null;

	const routePath = inner.toLowerCase() === 'index' ? '/' : `/${inner}`;
	return isStaticRouteCandidate(routePath) ? routePath : null;
};

/**
 * Sorts route records with the home page first and all other paths alphabetically.
 *
 * @param {StaticRouteRecord[]} records Route records to sort.
 * @returns {StaticRouteRecord[]} The sorted route records.
 */
const sortRouteRecords = (records) => records.sort((a, b) => compareRoutePaths(a.path, b.path));

/**
 * Loads every public blog article route from local markdown and the optional
 * database-backed article table.
 *
 * @param {{ throwOnError?: boolean, includeDatabaseBlog?: boolean }} [options] Loader failure and database options.
 * @returns {Promise<StaticRouteRecord[]>} Public blog route records.
 */
const loadBlogRoutes = async (options = {}) => mergeRouteRecords([
	...await loadLocalBlogRoutes(options),
	...(options.includeDatabaseBlog === false ? [] : await loadDatabaseBlogRoutes(options)),
]);

/**
 * Loads database-backed blog article routes from their stored slugs.
 *
 * @param {{ throwOnError?: boolean }} [options] Loader failure behavior.
 * @returns {Promise<StaticRouteRecord[]>} Public blog route records from persisted articles.
 */
export const loadDatabaseBlogRoutes = async ({ throwOnError = false } = {}) => {
	let db;

	try {
		const [{ default: knex }, { default: config }] = await Promise.all([
			import('knex'),
			import('../../knexfile.js'),
		]);
		db = knex(config);
		const rows = await db('blog_articles').select(
			'slug',
			'updated_at',
			'source_updated_at',
			'published_at',
			'source_created_at',
			'webhook_received_at',
			'created_at',
		);
		return rows
			.map((row) => createRouteRecord(
				routePathFromBlogSlug(row.slug),
				firstValidLastModified([
					row.updated_at,
					row.source_updated_at,
					row.published_at,
					row.source_created_at,
					row.webhook_received_at,
					row.created_at,
				]),
			))
			.filter(Boolean)
			.filter((record) => isStaticRouteCandidate(record.path));
	} catch (error) {
		if (throwOnError) throw error;
		return [];
	} finally {
		if (db) await db.destroy();
	}
};

/**
 * Loads local markdown blog article routes from their frontmatter slugs.
 *
 * @param {{ throwOnError?: boolean }} [options] Loader failure behavior.
 * @returns {Promise<StaticRouteRecord[]>} Public blog route records from local markdown files.
 */
const loadLocalBlogRoutes = async ({ throwOnError = false } = {}) => {
	try {
		const entries = await readdir(blogContentDirPath, { withFileTypes: true });
		const routes = await Promise.all(entries
			.filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
			.map(async (entry) => {
				const filePath = path.join(blogContentDirPath, entry.name);
				const [raw, fileLastmod] = await Promise.all([
					readFile(filePath, 'utf8'),
					loadFileLastModified(filePath),
				]);
				const slug = readFrontmatterValue(raw, 'slug') || entry.name.replace(/\.md$/, '');
				return createRouteRecord(
					routePathFromBlogSlug(slug),
					readBlogFrontmatterLastModified(raw) || fileLastmod,
				);
			}));

		return routes
			.filter(Boolean)
			.filter((record) => isStaticRouteCandidate(record.path));
	} catch (error) {
		if (throwOnError) throw error;
		return [];
	}
};

/**
 * Loads every public static route record that should be represented in SEO artifacts.
 *
 * @param {{ throwOnError?: boolean, includeBlog?: boolean, includeDatabaseBlog?: boolean }} [options] Failure and blog loading options.
 * @returns {Promise<StaticRouteRecord[]>} Sorted public route records, with "/" as a fallback.
 */
export const loadStaticRouteRecords = async ({ throwOnError = false, includeBlog = true, includeDatabaseBlog = true } = {}) => {
	try {
		const sourceRecords = mergeRouteRecords([
			...await loadRoutesFromPagesDir(),
			...await loadGeneratedComponentRoutes(),
			...(includeBlog ? await loadBlogRoutes({ throwOnError, includeDatabaseBlog }) : []),
		]);
		const sourcePaths = new Set(sourceRecords.map((record) => record.path));
		const manualRecords = await loadRoutesFromRoutesFile();
		// A route declaration is only a date fallback for pages without source records.
		const records = sortRouteRecords([
			...sourceRecords,
			...manualRecords.filter((record) => !sourcePaths.has(record.path)),
		]);
		return records.length ? records : [createRouteRecord('/')];
	} catch (error) {
		if (throwOnError) throw error;
		return [createRouteRecord('/')];
	}
};

/**
 * Loads every public static route path that should be represented in SEO artifacts.
 *
 * @returns {Promise<string[]>} Sorted public route paths, with "/" as a fallback.
 */
export const loadStaticRoutes = async () => (await loadStaticRouteRecords()).map((record) => record.path);

/**
 * Compares two route paths with the home page ordered first.
 *
 * @param {string} a First route path.
 * @param {string} b Second route path.
 * @returns {number} Sort comparison result.
 */
function compareRoutePaths(a, b) {
	if (a === '/') return -1;
	if (b === '/') return 1;
	return a.localeCompare(b);
}

/**
 * Merges route records by path and preserves the latest known modification date.
 *
 * @param {StaticRouteRecord[]} records Route records to merge.
 * @returns {StaticRouteRecord[]} Deduplicated route records.
 */
export function mergeRouteRecords(records) {
	const recordsByPath = new Map();

	for (const record of records) {
		if (!record?.path || !isStaticRouteCandidate(record.path)) continue;

		const existing = recordsByPath.get(record.path);
		recordsByPath.set(record.path, createRouteRecord(
			record.path,
			existing ? latestLastModified(existing.lastmod, record.lastmod) : record.lastmod,
		));
	}

	return [...recordsByPath.values()];
}

/**
 * Creates a normalized static route record.
 *
 * @param {string|null} routePath Public route path.
 * @param {string|Date} [lastmod] Optional last modified timestamp.
 * @returns {StaticRouteRecord|null} Route record, or null when the path is empty.
 */
function createRouteRecord(routePath, lastmod) {
	if (!routePath) return null;
	const normalizedLastmod = normalizeLastModified(lastmod);
	return normalizedLastmod
		? { path: routePath, lastmod: normalizedLastmod }
		: { path: routePath };
}

/**
 * Loads the filesystem modification time for a source file.
 *
 * @param {string} filePath Source file path.
 * @returns {Promise<string>} ISO last modified timestamp, or an empty string.
 */
async function loadFileLastModified(filePath) {
	try {
		const stats = await stat(filePath);
		return normalizeLastModified(stats.mtime);
	} catch {
		return '';
	}
}

/**
 * Reads the best blog last modified date from frontmatter.
 *
 * @param {string} raw Markdown source.
 * @returns {string} ISO last modified timestamp, or an empty string.
 */
function readBlogFrontmatterLastModified(raw) {
	return firstValidLastModified([
		readFrontmatterValue(raw, 'updated_at'),
		readFrontmatterValue(raw, 'modified_at'),
		readFrontmatterValue(raw, 'published_at'),
		readFrontmatterValue(raw, 'date'),
	]);
}

/**
 * Returns the first valid timestamp in a list of possible values.
 *
 * @param {Array<string|Date|null|undefined>} values Possible date values.
 * @returns {string} ISO last modified timestamp, or an empty string.
 */
function firstValidLastModified(values) {
	for (const value of values) {
		const lastmod = normalizeLastModified(value);
		if (lastmod) return lastmod;
	}

	return '';
}

/**
 * Chooses the most recent timestamp from two possible last modified values.
 *
 * @param {string|Date|null|undefined} first First timestamp candidate.
 * @param {string|Date|null|undefined} second Second timestamp candidate.
 * @returns {string} The latest ISO timestamp, or an empty string.
 */
function latestLastModified(first, second) {
	const firstLastmod = normalizeLastModified(first);
	const secondLastmod = normalizeLastModified(second);
	if (!firstLastmod) return secondLastmod;
	if (!secondLastmod) return firstLastmod;

	return new Date(secondLastmod).getTime() > new Date(firstLastmod).getTime()
		? secondLastmod
		: firstLastmod;
}

/**
 * Normalizes a date-like value into an ISO timestamp.
 *
 * @param {string|Date|null|undefined} value Date-like value.
 * @returns {string} ISO timestamp, or an empty string.
 */
function normalizeLastModified(value) {
	if (!value) return '';
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

/**
 * Checks whether a route path is a concrete public page for static SEO output.
 *
 * @param {string} routePath Route path candidate.
 * @returns {boolean} True when the route should be included in generated SEO files.
 */
function isStaticRouteCandidate(routePath) {
	return isIndexablePage(routePath)
		&& routePath.startsWith('/')
		&& routePath !== '/docs'
		&& !routePath.startsWith('/docs/')
		&& !routePath.includes(':')
		&& !routePath.includes('*')
		&& !routePath.includes('$')
		&& !isExcludedStaticRoutePrefix(routePath)
		&& !routePath.split('/').some(isPrivateRouteSegment);
}

/**
 * Checks whether a route sits under a static sitemap prefix exclusion.
 *
 * @param {string} routePath Route path candidate.
 * @returns {boolean} True when the route should be excluded by prefix.
 */
function isExcludedStaticRoutePrefix(routePath) {
	return excludedStaticRoutePrefixes.some((prefix) => (
		routePath === prefix || routePath.startsWith(`${prefix}/`)
	));
}

/**
 * Converts a blog slug value into a public article route path.
 *
 * @param {string} slug Source article slug.
 * @returns {string|null} Public blog route path, or null when the slug is empty.
 */
function routePathFromBlogSlug(slug) {
	const normalizedSlug = normalizeSlug(slug);
	return normalizedSlug ? `/blog/${normalizedSlug}` : null;
}

/**
 * Checks whether a path segment uses the private route-group convention.
 *
 * @param {string} segment Path segment to inspect.
 * @returns {boolean} True when the segment is wrapped in parentheses.
 */
function isPrivateRouteSegment(segment) {
	return /^\(.+\)$/.test(segment);
}

/**
 * Reads a scalar value from a markdown frontmatter block.
 *
 * @param {string} raw Markdown source.
 * @param {string} key Frontmatter key to read.
 * @returns {string} The normalized frontmatter value, or an empty string.
 */
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

/**
 * Converts arbitrary text into a URL-safe lowercase slug.
 *
 * @param {string} value Source slug or title value.
 * @returns {string} Normalized URL slug.
 */
function normalizeSlug(value) {
	return String(value || '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}
