import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadStaticRouteRecords } from './lib/load-routes.mjs';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist', 'client');
const cnamePath = path.join(rootDir, 'CNAME');
const siteName = 'DOM Studio';

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
 * Reads the canonical production site URL from CNAME when available.
 *
 * @returns {Promise<string>} Production site URL.
 */
const readSiteUrl = async () => {
	try {
		const cname = (await readFile(cnamePath, 'utf8')).trim();
		if (!cname) throw new Error('CNAME file is empty');
		return `https://${cname}`;
	} catch {
		return 'https://getdom.studio';
	}
};

/**
 * Builds sitemap XML for the supplied route records.
 *
 * @param {string} siteUrl Production site URL.
 * @param {{ path: string, lastmod?: string }[]} routeRecords Static route records.
 * @returns {string} Sitemap XML.
 */
const buildSitemap = (siteUrl, routeRecords) => {
	const generatedAt = new Date().toISOString();
	const urlEntries = routeRecords
		.map((routeRecord) => {
			const routePath = routeRecord.path;
			const location = routePath === '/' ? siteUrl : `${siteUrl}${routePath}`;
			const lastmod = routeRecord.lastmod || generatedAt;
			return [
				'\t<url>',
				`\t\t<loc>${escapeHtml(location)}</loc>`,
				`\t\t<lastmod>${escapeHtml(lastmod)}</lastmod>`,
				'\t\t<changefreq>weekly</changefreq>',
				'\t\t<priority>0.8</priority>',
				'\t</url>',
			].join('\n');
		})
		.join('\n');

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		urlEntries,
		'</urlset>',
	].join('\n');
};

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
	if (routePath === '/') {
		return {
			title: siteName,
			description: 'DOM Studio is a source-owned Vue and web component interface system for humans and LLMs.',
		};
	}

	const sectionName = routePath.replace(/^\//, "").replace(/-/g, " ");
	const humanLabel = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
	return {
		title: `${humanLabel} | ${siteName}`,
		description: `${humanLabel} in ${siteName}.`,
	};
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

	const meta = getPageMeta(routePath);
	const canonical = routePath === "/" ? siteUrl : `${siteUrl}${routePath}`;
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
	const siteUrl = await readSiteUrl();
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
