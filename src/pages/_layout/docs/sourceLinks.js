export const domStudioSourceUrl = 'https://github.com/steve-obrien/dom-studio-source';
const githubSourceBase = `${domStudioSourceUrl}/blob/main/`;
const localSourceRoot = typeof __DOM_STUDIO_SOURCE_ROOT__ === 'string'
	? __DOM_STUDIO_SOURCE_ROOT__
	: '';

/**
 * Resolves a source file to the local editor in development or this source repository.
 *
 * @param {string} sourcePath Repository-relative source path.
 * @returns {string} Editor or GitHub URL, or an empty string for an invalid path.
 */
export function sourceHrefForPath(sourcePath) {
	const normalized = normalizeSourcePath(sourcePath);
	if (!normalized) return '';

	if (import.meta.env.DEV && localSourceRoot) {
		const localPath = `${localSourceRoot.replace(/\/+$/, '')}/${normalized}`;
		return `cursor://file${encodeLocalPath(localPath)}`;
	}

	return `${githubSourceBase}${encodeRepoPath(normalized)}`;
}

/**
 * Identifies source links that should use ordinary external browser navigation.
 *
 * @param {string} href Candidate source URL.
 * @returns {boolean} Whether the URL uses HTTP or HTTPS.
 */
export function isExternalSourceHref(href) {
	return /^https?:\/\//i.test(String(href || ''));
}

/**
 * Normalizes a repository-relative path while rejecting parent traversal.
 *
 * @param {string} sourcePath Untrusted source path.
 * @returns {string} Normalized path, or an empty string when it is invalid.
 */
function normalizeSourcePath(sourcePath) {
	const parts = String(sourcePath || '')
		.replace(/^\/+/, '')
		.split('/')
		.filter((part) => part && part !== '.');

	if (!parts.length || parts.includes('..')) return '';
	return parts.join('/');
}

/**
 * Encodes each source-path segment while preserving repository directories.
 *
 * @param {string} sourcePath Normalized repository-relative path.
 * @returns {string} URL-safe repository path.
 */
function encodeRepoPath(sourcePath) {
	return sourcePath
		.split('/')
		.map(encodeURIComponent)
		.join('/');
}

/**
 * Encodes a filesystem path for an editor URL without interpreting query fragments.
 *
 * @param {string} sourcePath Absolute source-file path.
 * @returns {string} Encoded filesystem path.
 */
function encodeLocalPath(sourcePath) {
	return encodeURI(sourcePath)
		.replace(/#/g, '%23')
		.replace(/\?/g, '%3F');
}
