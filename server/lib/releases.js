import MarkdownIt from 'markdown-it';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import fallback from './releases.fallback.json' with { type: 'json' };
import { publicReleases, validateReleaseHistory } from './releaseRecords.js';

export { publicReleases } from './releaseRecords.js';

const markdown = new MarkdownIt({ html: false, linkify: false });
const endpoint = 'https://api.github.com/repos/steve-obrien/dom.studio/releases';
let cached = fallback;
let expiresAt = 0;
let pending;

/** Replaces the cached snapshot after validation, retaining the verified historical baseline. @param {Array<object>} records Public notes. @returns {void} */
function replaceHistory(records) {
	const byVersion = new Map(fallback.map((record) => [record.version, record]));
	for (const record of validateReleaseHistory(records)) byVersion.set(record.version, record);
	cached = [...byVersion.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** Loads the workflow snapshot, with the optional legacy GitHub credential as a fallback. @returns {Promise<void>} */
async function refresh() {
	try {
		const source = await readFile(process.env.RELEASES_FILE || path.resolve('release-history.json'), 'utf8');
		replaceHistory(JSON.parse(source));
		return;
	} catch (error) {
		if (error.code !== 'ENOENT') throw error;
	}
	if (!process.env.RELEASES_GITHUB_TOKEN) return;
	const records = [];
	for (let page = 1; page <= 20; page += 1) {
		const response = await fetch(`${endpoint}?per_page=100&page=${page}`, {
			headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${process.env.RELEASES_GITHUB_TOKEN}`, 'X-GitHub-Api-Version': '2022-11-28' },
			signal: AbortSignal.timeout(5000),
		});
		if (!response.ok) throw new Error(`Release source returned ${response.status}`);
		const batch = await response.json();
		if (!Array.isArray(batch)) throw new Error('Invalid release source');
		records.push(...batch);
		if (batch.length < 100) {
			replaceHistory(publicReleases(records));
			return;
		}
	}
	throw new Error('Release pagination limit reached');
}

/** Returns cached public notes, retaining the last successful response during outages. */
export async function listReleases() {
	if (Date.now() >= expiresAt) {
		pending ||= refresh().catch(reportRefreshFailure).finally(() => {
			expiresAt = Date.now() + 60_000;
			pending = null;
		});
		await pending;
	}
	return cached.map((record) => ({ ...record, html: markdown.render(record.body) }));
}

/** Logs an upstream failure without leaking credentials or unpublished content. */
function reportRefreshFailure() {
	console.warn('Release feed refresh failed; serving the last available release history.');
}
