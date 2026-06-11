const githubSourceBase = 'https://github.com/steve-obrien/dom.studio/blob/main/';
const localSourceRoot = typeof __DOM_STUDIO_SOURCE_ROOT__ === 'string'
	? __DOM_STUDIO_SOURCE_ROOT__
	: '';

export function sourceHrefForPath(sourcePath) {
	const normalized = normalizeSourcePath(sourcePath);
	if (!normalized) return '';

	if (import.meta.env.DEV && localSourceRoot) {
		const localPath = `${localSourceRoot.replace(/\/+$/, '')}/${normalized}`;
		return `cursor://file${encodeLocalPath(localPath)}`;
	}

	return `${githubSourceBase}${encodeRepoPath(normalized)}`;
}

export function isExternalSourceHref(href) {
	return /^https?:\/\//i.test(String(href || ''));
}

function normalizeSourcePath(sourcePath) {
	const parts = String(sourcePath || '')
		.replace(/^\/+/, '')
		.split('/')
		.filter((part) => part && part !== '.');

	if (!parts.length || parts.includes('..')) return '';
	return parts.join('/');
}

function encodeRepoPath(sourcePath) {
	return sourcePath
		.split('/')
		.map(encodeURIComponent)
		.join('/');
}

function encodeLocalPath(sourcePath) {
	return encodeURI(sourcePath)
		.replace(/#/g, '%23')
		.replace(/\?/g, '%3F');
}
