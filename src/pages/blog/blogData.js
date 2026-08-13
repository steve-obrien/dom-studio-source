/**
 * Loads one page of published blog article summaries.
 *
 * @param {{ page?: number, apiFetch?: typeof fetch }} options Request options.
 * @returns {Promise<{ articles: object[], pagination: { page: number, pageSize: number, total: number, pageCount: number } }>} Paginated article data.
 */
export async function loadBlogArticles({ page = 1, apiFetch = fetch } = {}) {
	const query = new URLSearchParams({ page: String(page) });
	const response = await apiFetch(`/api/blog/articles?${query}`, {
		headers: { accept: 'application/json' },
	});
	if (!response.ok) throw new Error('Unable to load blog articles.');
	const data = await response.json();
	return {
		articles: Array.isArray(data.articles) ? data.articles : [],
		pagination: normalizePagination(data.pagination, page),
	};
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

/**
 * Normalizes pagination metadata returned by the blog API.
 *
 * @param {object} pagination API pagination metadata.
 * @param {number} fallbackPage Requested page used when metadata is missing.
 * @returns {{ page: number, pageSize: number, total: number, pageCount: number }} Normalized pagination metadata.
 */
function normalizePagination(pagination = {}, fallbackPage = 1) {
	const pageSize = positiveInteger(pagination.pageSize, 50);
	const total = nonNegativeInteger(pagination.total);
	return {
		page: positiveInteger(pagination.page, positiveInteger(fallbackPage, 1)),
		pageSize,
		total,
		pageCount: positiveInteger(pagination.pageCount, Math.max(1, Math.ceil(total / pageSize))),
	};
}

/**
 * Normalizes a value to a positive integer or a positive fallback.
 *
 * @param {unknown} value Candidate numeric value.
 * @param {number} fallback Positive integer fallback.
 * @returns {number} Normalized positive integer.
 */
function positiveInteger(value, fallback) {
	const number = Math.floor(Number(value));
	return Number.isFinite(number) && number > 0 ? number : fallback;
}

/**
 * Normalizes a value to a non-negative integer.
 *
 * @param {unknown} value Candidate numeric value.
 * @returns {number} Normalized non-negative integer.
 */
function nonNegativeInteger(value) {
	const number = Math.floor(Number(value));
	return Number.isFinite(number) && number >= 0 ? number : 0;
}
