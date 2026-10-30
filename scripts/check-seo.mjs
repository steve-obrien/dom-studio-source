import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createSitemapHandler, createSitemapRouteLoader } from '../server/lib/sitemapRoute.js';
import { getCanonicalUrl, getPageSeo, getRouteHead } from '../src/seo.js';
import { componentCatalog } from '../src/pages/_layout/componentCatalog.generated.js';
import { loadStaticRouteRecords } from './lib/load-routes.mjs';
import { buildSitemap } from './lib/sitemap.mjs';

/**
 * Resolves public metadata for a route without starting a server or connecting to a DB.
 *
 * @param {string} path Public path.
 * @param {object} [query] Route query values.
 * @returns {object} Route head tags.
 */
function headFor(path, query = {}) {
	return getRouteHead({ path, query, meta: getPageSeo(path) });
}

test('public search titles match component, block, and headless intent', () => {
	assert.equal(headFor('/').title, 'Vue UI Component Library | DOM Studio');
	assert.equal(headFor('/data/data-grid').title, 'Vue Data Grid with Filtering | DOM Studio');
	assert.equal(headFor('/blocks/app-shells/dashboard').title, 'Vue Dashboard Template | DOM Studio');
	assert.equal(headFor('/headless/dialog').title, 'Headless Dialog Web Component | DOM Studio');
	assert.equal(getPageSeo('/data/data-grid').heading, 'Vue Data Grid with Filtering');
});

test('canonical identity strips demo state and fragments while preserving blog pagination', () => {
	assert.deepEqual(headFor('/data/data-grid/?sort=name#demo').link, [{ rel: 'canonical', href: 'https://getdom.studio/data/data-grid' }]);
	assert.equal(headFor('/data/media-browser/images', { view: 'list' }).link[0].href, 'https://getdom.studio/data/media-browser');
	assert.equal(headFor('/blog', { page: ['2', '3'], utm_source: 'test' }).link[0].href, 'https://getdom.studio/blog?page=2');
	assert.equal(headFor('/blog', { page: 'invalid' }).link[0].href, 'https://getdom.studio/blog');
	assert.equal(headFor('/blog', { page: '1' }).link[0].href, 'https://getdom.studio/blog');
	assert.equal(headFor('/blog', { page: 2 }).title, 'Vue UI Development Blog - Page 2 | DOM Studio');
	assert.equal(getCanonicalUrl({ path: '/DATA/Data-Grid/', meta: getPageSeo('/data/data-grid') }), 'https://getdom.studio/data/data-grid');
	assert.equal(getCanonicalUrl({ path: '//external.example/path', query: {} }), 'https://getdom.studio/external.example/path');
});

test('private pages, previews, and missing pages cannot acquire an indexable canonical', () => {
	for (const path of ['/auth/sign-in', '/auth/sign-up', '/paywall', '/blocks/app-shells/dashboard/preview/ProductDashboard']) {
		const head = headFor(path);
		assert.equal(head.link.length, 0, path);
		assert.match(head.meta.find((tag) => tag.name === 'robots').content, /noindex/, path);
	}
	assert.equal(getCanonicalUrl({ path: '/missing', name: 'NotFound' }), '');
});

test('loaded article metadata is scoped to the current article', () => {
	const head = { title: 'Actual Article | DOM Studio', meta: [], link: [{ rel: 'canonical', href: 'https://getdom.studio/blog/actual' }] };
	const meta = { title: 'Blog Article', articleHead: { path: '/blog/actual', head } };
	assert.deepEqual(getRouteHead({ path: '/blog/actual', meta }), head);
	assert.notEqual(getRouteHead({ path: '/blog/another', meta }).title, head.title);
});

test('sitemap covers generated components, excludes redirects, and agrees with canonical paths', async () => {
	const records = await loadStaticRouteRecords({ throwOnError: true, includeBlog: false });
	const paths = new Set(records.map((record) => record.path));
	for (const record of componentCatalog) assert.ok(paths.has(record.route), record.route);
	for (const path of ['/auth/sign-in', '/paywall', '/docs', '/tools', '/components/studio', '/designer/studio', '/experiments/template-editor', '/data/json-viewer', '/visual/code-block']) assert.ok(!paths.has(path), path);
	assert.equal(paths.size, records.length);
	const titles = new Set();
	for (const { path } of records) {
		const head = headFor(path);
		assert.equal(head.link[0]?.href, `https://getdom.studio${path}`, path);
		assert.ok(head.meta.find((tag) => tag.name === 'description')?.content, path);
		assert.ok(!titles.has(head.title), `Duplicate title: ${head.title}`);
		titles.add(head.title);
	}
	assert.match(buildSitemap('https://getdom.studio', records), /<loc>https:\/\/getdom\.studio\/<\/loc>/);
});

test('homepage lastmod follows page and nested home edits independently of routing changes', checkHomepageLastModified);

/**
 * Exercises sitemap dates against an isolated source tree with controlled file
 * timestamps, without changing the checkout or connecting to the blog database.
 *
 * @returns {Promise<void>}
 */
async function checkHomepageLastModified() {
	const fixtureRoot = await mkdtemp(path.join(tmpdir(), 'dom-studio-sitemap-'));
	const pageDate = '2026-10-24T12:00:00.000Z';
	const otherDate = '2026-10-22T12:00:00.000Z';
	const editDate = '2026-10-25T12:00:00.000Z';
	const demoDate = '2026-10-25T13:00:00.000Z';
	try {
		await writeDatedSource(fixtureRoot, 'src/routes.js', "const routes = [{ path: '/', component: HomePage }];", '2026-10-15T12:00:00.000Z');
		await writeDatedSource(fixtureRoot, 'src/pages/Index.vue', '<template>Homepage</template>', pageDate);
		await writeDatedSource(fixtureRoot, 'src/pages/ai/Index.vue', '<template>AI</template>', otherDate);
		await writeDatedSource(fixtureRoot, 'src/pages/_home/live/HomeDemo.vue', '<template>Demo</template>', otherDate);

		let records = loadFixtureRouteRecords(fixtureRoot);
		assert.equal(records.find((record) => record.path === '/')?.lastmod, pageDate);
		assert.equal(records.find((record) => record.path === '/ai')?.lastmod, otherDate);

		await writeDatedSource(fixtureRoot, 'src/pages/Index.vue', '<template>Updated homepage</template>', editDate);
		records = loadFixtureRouteRecords(fixtureRoot);
		assert.equal(records.find((record) => record.path === '/')?.lastmod, editDate);

		await writeDatedSource(fixtureRoot, 'src/pages/_home/live/HomeDemo.vue', '<template>Updated demo</template>', demoDate);
		await writeDatedSource(fixtureRoot, 'src/routes.js', "const routes = [{ path: '/', component: HomePage }];", '2026-10-25T14:00:00.000Z');
		records = loadFixtureRouteRecords(fixtureRoot);
		assert.equal(records.find((record) => record.path === '/')?.lastmod, demoDate);
		assert.equal(records.find((record) => record.path === '/ai')?.lastmod, otherDate);
		assert.match(buildSitemap('https://getdom.studio', records), /<loc>https:\/\/getdom\.studio\/<\/loc>\s*<lastmod>2026-10-25T13:00:00.000Z<\/lastmod>/);
	} finally {
		await rm(fixtureRoot, { recursive: true, force: true });
	}
}

/**
 * Writes a source fixture with a deterministic filesystem modification date.
 *
 * @param {string} root Fixture working directory.
 * @param {string} relativeFile Source file path relative to the fixture.
 * @param {string} content Source contents.
 * @param {string} lastmod ISO modification timestamp.
 * @returns {Promise<void>}
 */
async function writeDatedSource(root, relativeFile, content, lastmod) {
	const file = path.join(root, relativeFile);
	await mkdir(path.dirname(file), { recursive: true });
	await writeFile(file, content);
	await utimes(file, new Date(lastmod), new Date(lastmod));
}

/**
 * Loads route dates in a separate process so the fixture owns the loader's
 * working directory while the test runner retains its original project root.
 *
 * @param {string} root Fixture working directory.
 * @returns {Array<{ path: string, lastmod?: string }>} Public source route records.
 */
function loadFixtureRouteRecords(root) {
	const moduleUrl = new URL('./lib/load-routes.mjs', import.meta.url).href;
	const script = `import { loadStaticRouteRecords } from ${JSON.stringify(moduleUrl)};
		const records = await loadStaticRouteRecords({ throwOnError: true, includeBlog: false });
		process.stdout.write(JSON.stringify(records));`;
	return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '--eval', script], { cwd: root, encoding: 'utf8' }));
}

test('build freezes source dates while production refreshes article additions, updates, and removals', checkBuiltSitemapInventory);

/**
 * Builds the real SEO artifacts without a database, then serves them after
 * removing the source tree to prove production does not discover source files.
 *
 * @returns {Promise<void>}
 */
async function checkBuiltSitemapInventory() {
	const fixtureRoot = await mkdtemp(path.join(tmpdir(), 'dom-studio-sitemap-build-'));
	const homeDate = '2026-10-24T12:00:00.000Z';
	const articleDate = '2026-10-25T12:00:00.000Z';
	const updateDate = '2026-10-25T13:00:00.000Z';
	try {
		await writeDatedSource(fixtureRoot, 'src/routes.js', "const routes = [{ path: '/', component: HomePage }];", homeDate);
		await writeDatedSource(fixtureRoot, 'src/pages/Index.vue', '<template>Homepage</template>', homeDate);
		await writeDatedSource(fixtureRoot, 'src/pages/blog/content/local.md', '---\nslug: local\nupdated_at: 2026-10-23T12:00:00.000Z\n---\nLocal article.', homeDate);
		const generator = fileURLToPath(new URL('./generate-seo-files.mjs', import.meta.url));
		execFileSync(process.execPath, [generator], {
			cwd: fixtureRoot,
			encoding: 'utf8',
			env: { ...process.env, DATABASE_URL: '', DB_HOST: '127.0.0.1', DB_PORT: '1' },
		});
		const manifestPath = path.join(fixtureRoot, 'dist', 'server', 'sitemap-routes.json');
		const builtRecords = JSON.parse(await readFile(manifestPath, 'utf8'));
		assert.equal(builtRecords.find((record) => record.path === '/')?.lastmod, homeDate);
		assert.equal(builtRecords.find((record) => record.path === '/blog/local')?.lastmod, '2026-10-23T12:00:00.000Z');
		assert.ok((await readFile(path.join(fixtureRoot, 'dist', 'client', 'sitemap.xml'), 'utf8')).includes(`<lastmod>${homeDate}</lastmod>`));
		await rm(path.join(fixtureRoot, 'src'), { recursive: true });

		let articleRecords = [{ path: '/blog/current', lastmod: articleDate }, { path: '/blog/removed', lastmod: articleDate }];
		let articleLoads = 0;
		const loadRouteRecords = createSitemapRouteLoader({
			production: true,
			manifestPath,
			loadSourceRoutes: rejectSourceScan,
			/** Returns the current article inventory for each simulated request. */
			loadArticleRoutes: async () => {
				articleLoads += 1;
				return articleRecords;
			},
		});
		const handler = createSitemapHandler({ loadRouteRecords });
		const first = createSitemapResponse();
		await handler({}, first);
		assert.equal(first.statusCode, 200);
		assert.match(first.headers['Cache-Control'], /no-store/);
		assert.ok(first.body.includes('/blog/removed</loc>'));

		// Removing the manifest after the first request proves subsequent loads use memory.
		await rm(manifestPath);
		articleRecords = [
			{ path: '/blog/current', lastmod: updateDate },
			{ path: '/blog/new', lastmod: updateDate },
			{ path: '/blog/local', lastmod: updateDate },
		];
		const second = createSitemapResponse();
		await handler({}, second);
		assert.equal(second.statusCode, 200);
		assert.equal(articleLoads, 2);
		assert.ok(second.body.includes(`<loc>https://getdom.studio/</loc>\n\t\t<lastmod>${homeDate}</lastmod>`));
		assert.ok(second.body.includes(`<loc>https://getdom.studio/blog/current</loc>\n\t\t<lastmod>${updateDate}</lastmod>`));
		assert.ok(second.body.includes('/blog/new</loc>'));
		assert.ok(!second.body.includes('/blog/removed</loc>'));
		assert.equal(second.body.match(/<loc>https:\/\/getdom\.studio\/blog\/local<\/loc>/g)?.length, 1);
		assert.ok(second.body.includes(`<loc>https://getdom.studio/blog/local</loc>\n\t\t<lastmod>${updateDate}</lastmod>`));
	} finally {
		await rm(fixtureRoot, { recursive: true, force: true });
	}
}

test('production retries missing or invalid build inventories without scanning source files', checkSitemapInventoryRecovery);

/**
 * Verifies a failed artifact read cannot poison the per-worker cache and that
 * an incomplete deployment never silently falls back to filesystem discovery.
 *
 * @returns {Promise<void>}
 */
async function checkSitemapInventoryRecovery() {
	const fixtureRoot = await mkdtemp(path.join(tmpdir(), 'dom-studio-sitemap-recovery-'));
	try {
		const manifestPath = path.join(fixtureRoot, 'sitemap-routes.json');
		const load = createSitemapRouteLoader({
			production: true,
			manifestPath,
			loadSourceRoutes: rejectSourceScan,
			/** Supplies an empty database inventory for artifact recovery checks. */
			loadArticleRoutes: async () => [],
		});
		await assert.rejects(load(), { code: 'ENOENT' });
		await writeFile(manifestPath, '{}');
		await assert.rejects(load(), /Invalid sitemap route inventory/);
		const records = [{ path: '/', lastmod: '2026-10-24T12:00:00.000Z' }];
		await writeFile(manifestPath, JSON.stringify(records));
		assert.deepEqual(await load(), records);
	} finally {
		await rm(fixtureRoot, { recursive: true, force: true });
	}
}

test('development discovers source edits without requiring a new build inventory', checkDevelopmentSitemap);

/**
 * Confirms development remains responsive to local source changes and leaves
 * database articles to the separate runtime loader.
 *
 * @returns {Promise<void>}
 */
async function checkDevelopmentSitemap() {
	let date = '2026-10-24T12:00:00.000Z';
	const load = createSitemapRouteLoader({
		production: false,
		/** Returns changing local page dates and verifies database discovery is disabled. */
		loadSourceRoutes: async (options) => {
			assert.equal(options.includeDatabaseBlog, false);
			assert.equal(options.throwOnError, true);
			return [{ path: '/', lastmod: date }];
		},
		/** Supplies an empty article inventory for development discovery checks. */
		loadArticleRoutes: async () => [],
	});
	assert.equal((await load())[0].lastmod, date);
	date = '2026-10-25T12:00:00.000Z';
	assert.equal((await load())[0].lastmod, date);
}

/**
 * Fails if a production loader attempts development-only source discovery.
 *
 * @returns {never}
 */
function rejectSourceScan() {
	throw new Error('Production must not scan source files.');
}

/**
 * Captures Express response fields without starting a listening HTTP server.
 *
 * @returns {object} Chainable response recorder.
 */
function createSitemapResponse() {
	return {
		/** Stores the outgoing HTTP status. */
		status(value) { this.statusCode = value; return this; },
		/** Stores the outgoing HTTP headers. */
		set(value) { this.headers = value; return this; },
		/** Stores the outgoing response body. */
		send(value) { this.body = value; return this; },
	};
}
