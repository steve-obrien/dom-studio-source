import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

/** Reads an npm registry record, distinguishing unpublished versions from outages. */
async function registryVersion(version) {
	const response = await fetch(`https://registry.npmjs.org/@getdom%2fstudio/${version}`, { signal: AbortSignal.timeout(15_000) });
	if (response.status === 404) return null;
	if (!response.ok) throw new Error(`Registry unavailable (${response.status})`);
	return response.json();
}

/** Publishes the tested tarball once and verifies integrity before announcing a release. */
async function main() {
	const manifest = JSON.parse(fs.readFileSync('dist/npm/package.json', 'utf8'));
	if (process.env.GITHUB_ACTIONS !== 'true' || process.env.GITHUB_REF !== `refs/tags/v${manifest.version}`) throw new Error('Publish only through the release tag workflow');
	const [packed] = JSON.parse(execFileSync('npm', ['pack', './dist/npm', '--pack-destination', './dist', '--json'], { encoding: 'utf8' }));
	const existing = await registryVersion(manifest.version);
	if (existing && existing.dist?.integrity !== packed.integrity) throw new Error('This npm version already exists with different contents. Do not move the tag; release a new version.');
	if (!existing) execFileSync('npm', ['publish', `./dist/${packed.filename}`, '--access', 'public'], { stdio: 'inherit' });
	// npm may accept an upload before its processing queue exposes the version.
	for (let attempt = 0; attempt < 60; attempt += 1) {
		const published = await registryVersion(manifest.version);
		if (published?.dist?.integrity === packed.integrity) return;
		await new Promise(waitForRegistry);
	}
	throw new Error('npm publication could not be verified; rerun this workflow to finish announcing it');
}

/** Waits briefly for registry propagation between bounded verification attempts. */
function waitForRegistry(resolve) { setTimeout(resolve, 5000); }

/** Fails the workflow before GitHub Release creation when publication is uncertain. */
function reportFailure(error) { console.error(error.message); process.exitCode = 1; }

main().catch(reportFailure);
