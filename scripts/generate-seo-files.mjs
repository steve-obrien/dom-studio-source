import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadStaticRoutes } from './lib/load-routes.mjs';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const cnamePath = path.join(rootDir, 'CNAME');
const siteName = 'DOM Studio';

const escapeHtml = (value) => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;')
	.replace(/'/g, '&#39;');

const readSiteUrl = async () => {
	try {
		const cname = (await readFile(cnamePath, 'utf8')).trim();
		if (!cname) throw new Error('CNAME file is empty');
		return `https://${cname}`;
	} catch {
		return 'https://getdom.studio';
	}
};

const buildSitemap = (siteUrl, routes) => {
	const now = new Date().toISOString();
	const urlEntries = routes
		.map((route) => {
			const location = route === '/' ? siteUrl : `${siteUrl}${route}`;
			return [
				'\t<url>',
				`\t\t<loc>${location}</loc>`,
				`\t\t<lastmod>${now}</lastmod>`,
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

const buildRobots = (siteUrl) => [
	'User-agent: *',
	'Allow: /',
	'',
	`Sitemap: ${siteUrl}/sitemap.xml`,
].join('\n');

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

const main = async () => {
	const siteUrl = await readSiteUrl();
	const routes = await loadStaticRoutes();
	await mkdir(distDir, { recursive: true });
	await writeFile(path.join(distDir, 'robots.txt'), buildRobots(siteUrl));
	await writeFile(path.join(distDir, 'sitemap.xml'), buildSitemap(siteUrl, routes));
	await Promise.all(routes.map((routePath) => injectMetaIntoPage(siteUrl, routePath)));
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
