export async function loadBlogArticles(apiFetch = fetch) {
	const response = await apiFetch('/api/blog/articles', {
		headers: { accept: 'application/json' },
	});
	if (!response.ok) throw new Error('Unable to load blog articles.');
	const data = await response.json();
	return data.articles || [];
}

export async function loadBlogArticle(slug, apiFetch = fetch) {
	const response = await apiFetch(`/api/blog/articles/${encodeURIComponent(slug)}`, {
		headers: { accept: 'application/json' },
	});
	if (response.status === 404) return null;
	if (!response.ok) throw new Error('Unable to load blog article.');
	const data = await response.json();
	return data.article || null;
}

export function formatArticleDate(value) {
	if (!value) return '';
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	}).format(new Date(value));
}
