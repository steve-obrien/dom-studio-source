import MarkdownIt from 'markdown-it';
import fallback from './releases.fallback.json' with { type: 'json' };

const markdown = new MarkdownIt({ html: false, linkify: false });
const endpoint = 'https://api.github.com/repos/steve-obrien/dom.studio/releases';
let cached = fallback;
let expiresAt = 0;
let pending;

/** Projects only stable published notes; private repository metadata stays server-side. */
export function publicReleases(records) {
	return records.filter((record) => !record.draft && !record.prerelease && /^v\d+\.\d+\.\d+$/.test(record.tag_name) && record.published_at)
		.map((record) => ({
			version: record.tag_name.slice(1),
			title: record.name || `DOM Studio ${record.tag_name.slice(1)}`,
			publishedAt: record.published_at,
			body: String(record.body || ''),
		}))
		.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** Loads all published releases with bounded pagination and a server-only credential. */
async function refresh() {
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
			const byVersion = new Map(fallback.map((record) => [record.version, record]));
			for (const record of publicReleases(records)) byVersion.set(record.version, record);
			cached = [...byVersion.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
			return;
		}
	}
	throw new Error('Release pagination limit reached');
}

/** Returns cached public notes, retaining the last successful response during outages. */
export async function listReleases() {
	if (process.env.RELEASES_GITHUB_TOKEN && Date.now() >= expiresAt) {
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
