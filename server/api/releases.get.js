import { listReleases } from '../lib/releases.js';

/** Returns published notes without exposing private GitHub fields or credentials. */
export async function get() {
	return { releases: await listReleases() };
}
