/** Projects stable published notes without exposing private GitHub metadata. */
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

/**
 * Validates a synchronized snapshot and discards any fields outside the public contract.
 * @param {unknown} records Parsed release-history JSON.
 * @returns {Array<{version: string, title: string, publishedAt: string, body: string}>}
 */
export function validateReleaseHistory(records) {
	if (!Array.isArray(records) || !records.length) throw new Error('Release history must be a non-empty array');
	const versions = new Set();
	return records.map((record) => {
		if (!record || typeof record.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(record.version)
			|| versions.has(record.version) || typeof record.title !== 'string'
			|| typeof record.publishedAt !== 'string' || !Number.isFinite(Date.parse(record.publishedAt))
			|| typeof record.body !== 'string') throw new Error('Invalid release-history record');
		versions.add(record.version);
		return { version: record.version, title: record.title, publishedAt: record.publishedAt, body: record.body };
	});
}
