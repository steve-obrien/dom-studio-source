import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Reads the canonical production site URL from CNAME when available.
 *
 * @param {{ rootDir?: string }} [options] Filesystem options.
 * @returns {Promise<string>} Production site URL.
 */
export async function readSiteUrl({ rootDir = process.cwd() } = {}) {
	try {
		const cname = (await readFile(path.join(rootDir, 'CNAME'), 'utf8')).trim();
		if (!cname) throw new Error('CNAME file is empty');
		return `https://${cname}`;
	} catch {
		return 'https://getdom.studio';
	}
}

/**
 * Builds sitemap XML for the supplied route records.
 *
 * @param {string} siteUrl Production site URL.
 * @param {{ path: string, lastmod?: string }[]} routeRecords Public route records.
 * @returns {string} Sitemap XML.
 */
export function buildSitemap(siteUrl, routeRecords) {
	const generatedAt = new Date().toISOString();
	const urlEntries = routeRecords
		.map((routeRecord) => {
			const routePath = routeRecord.path;
			const location = `${siteUrl}${routePath}`;
			const lastmod = routeRecord.lastmod || generatedAt;
			return [
				'\t<url>',
				`\t\t<loc>${escapeXml(location)}</loc>`,
				`\t\t<lastmod>${escapeXml(lastmod)}</lastmod>`,
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
}

/**
 * Escapes text for safe insertion into generated XML.
 *
 * @param {unknown} value Source value.
 * @returns {string} XML-safe text.
 */
function escapeXml(value) {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}
