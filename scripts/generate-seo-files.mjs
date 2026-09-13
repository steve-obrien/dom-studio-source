import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getPageSeo, getRouteHead } from '../src/seo.js';
import { loadStaticRouteRecords } from './lib/load-routes.mjs';
import { buildSitemap, readSiteUrl } from './lib/sitemap.mjs';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist', 'client');

/**
 * Escapes text for safe insertion into generated HTML and XML.
 *
 * @param {string} value Source value.
 * @returns {string} Escaped value.
 */
const escapeHtml = (value) => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;');

/**
 * Builds the robots.txt content pointing crawlers at the generated sitemap.
 *
 * @param {string} siteUrl Production site URL.
 * @returns {string} Robots.txt content.
 */
const buildRobots = (siteUrl) => [
	'User-agent: *',
	'Allow: /',
	'',
	`Sitemap: ${siteUrl}/sitemap.xml`,
].join('\n');

/**
 * Creates generic page metadata for static HTML files.
 *
 * @param {string} routePath Public route path.
 * @returns {{ title: string, description: string }} Page metadata.
 */
const getPageMeta = (routePath) => {
	const meta = getPageSeo(routePath);
	return { title: getRouteHead({ path: routePath, meta }).title, description: meta.description };
};

/**
 * Checks whether an HTML file is the SSR shell rendered by Now.
 *
 * @param {string} html HTML file contents.
 * @returns {boolean} True when the file contains the runtime head placeholder.
 */
const isSsrTemplate = (html) => html.includes('<!--now-head-->');

/**
 * Removes generated page-level SEO tags from the SSR shell.
 *
 * @param {string} html HTML file contents.
 * @returns {string} HTML without static title, description, canonical, and social tags.
 */
const removeStaticPageMeta = (html) => {
	const patterns = [
		/^\s*<title>[\s\S]*?<\/title>\s*\n?/gim,
		/^\s*<meta(?=[^>]*\bname=["']description["'])[^>]*>\s*\n?/gim,
		/^\s*<link(?=[^>]*\brel=["']canonical["'])[^>]*>\s*\n?/gim,
		/^\s*<meta(?=[^>]*\bproperty=["']og:(?:title|description|url|type)["'])[^>]*>\s*\n?/gim,
		/^\s*<meta(?=[^>]*\bname=["']twitter:card["'])[^>]*>\s*\n?/gim,
	];

	return patterns.reduce((content, pattern) => content.replace(pattern, ''), html);
};

/**
 * Injects static head metadata into a generated HTML file when it exists.
 *
 * @param {string} siteUrl Production site URL.
 * @param {string} routePath Public route path.
 * @returns {Promise<void>}
 */
const injectMetaIntoPage = async (siteUrl, routePath) => {
	const fileName = routePath === "/" ? "index.html" : `${routePath.replace(/^\//, "")}.html`;
	const htmlPath = path.join(distDir, fileName);
	let html;
	try {
		html = await readFile(htmlPath, 'utf8');
	} catch {
		return;
	}

	if (isSsrTemplate(html)) {
		const cleanedHtml = removeStaticPageMeta(html);
		if (cleanedHtml !== html) await writeFile(htmlPath, cleanedHtml);
		return;
	}

	const meta = getPageMeta(routePath);
	const canonical = `${siteUrl}${routePath}`;
	const tags = [
		`<title>${escapeHtml(meta.title)}</title>`,
		`<meta name="description" content="${escapeHtml(meta.description)}">`,
		`<link rel="canonical" href="${escapeHtml(canonical)}">`,
		`<meta property="og:title" content="${escapeHtml(meta.title)}">`,
		`<meta property="og:description" content="${escapeHtml(meta.description)}">`,
		`<meta property="og:url" content="${escapeHtml(canonical)}">`,
		`<meta property="og:type" content="website">`,
		`<meta name="twitter:card" content="summary">`,
	].join('\n\t\t');

	html = html
		.replace(/<title>[\s\S]*?<\/title>/i, "")
		.replace(/<meta\s+name=["\']description["\'][^>]*>/i, "")
		.replace(/<link\s+rel=["\']canonical["\'][^>]*>/i, "")
		.replace(/<\/head>/i, `\t\t${tags}\n\t</head>`);

	await writeFile(htmlPath, html);
};

/**
 * Generates SEO artifacts from the current route inventory.
 *
 * @returns {Promise<void>}
 */
const main = async () => {
	const siteUrl = await readSiteUrl({ rootDir });
	const routeRecords = await loadStaticRouteRecords();
	const routes = routeRecords.map((routeRecord) => routeRecord.path);
	await mkdir(distDir, { recursive: true });
	await writeFile(path.join(distDir, 'robots.txt'), buildRobots(siteUrl));
	await writeFile(path.join(distDir, 'sitemap.xml'), buildSitemap(siteUrl, routeRecords));
	await Promise.all(routes.map((routePath) => injectMetaIntoPage(siteUrl, routePath)));
};

/**
 * Reports a fatal generation error and exits with failure.
 *
 * @param {Error} error Generation error.
 * @returns {void}
 */
function handleFatalError(error) {
	console.error(error);
	process.exit(1);
}

main().catch(handleFatalError);
