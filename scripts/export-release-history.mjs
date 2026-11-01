import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicReleases, validateReleaseHistory } from '../server/lib/releaseRecords.js';

/**
 * Fetches all published GitHub releases with bounded pagination before exporting any data.
 * @param {string} token Workflow-scoped repository credential.
 * @param {typeof fetch} request HTTP client, injectable for isolated tests.
 * @returns {Promise<Array<object>>} Public release records only.
 */
export async function fetchReleaseHistory(token, request = fetch) {
	if (!token) throw new Error('A GitHub workflow token is required');
	const records = [];
	for (let page = 1; page <= 20; page += 1) {
		const response = await request(`https://api.github.com/repos/steve-obrien/dom-studio-source/releases?per_page=100&page=${page}`, {
			headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' },
			signal: AbortSignal.timeout(15_000),
		});
		if (!response.ok) throw new Error(`GitHub release request failed (${response.status})`);
		const batch = await response.json();
		if (!Array.isArray(batch)) throw new Error('Invalid GitHub release response');
		records.push(...batch);
		if (batch.length < 100) return validateReleaseHistory(publicReleases(records));
	}
	throw new Error('Release pagination limit reached');
}

/** Writes an allowlisted snapshot only after the complete GitHub fetch succeeds. @returns {Promise<void>} */
async function main() {
	const output = process.argv[2];
	if (!output) throw new Error('Usage: node scripts/export-release-history.mjs OUTPUT');
	const records = await fetchReleaseHistory(process.env.GH_TOKEN);
	await fs.writeFile(output, JSON.stringify(records, null, '\t') + '\n');
	console.log(`Exported ${records.length} published releases`);
}

/** Reports actionable export failures without printing credentials or upstream bodies. @param {Error} error Failure. @returns {void} */
function reportFailure(error) {
	console.error(error.message);
	process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(reportFailure);
