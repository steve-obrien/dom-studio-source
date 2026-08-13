import { listPublishedArticlePage } from '../../lib/blog.js';

const BLOG_ARTICLES_PER_PAGE = 50;

/**
 * Returns one fixed-size page of published blog article summaries.
 *
 * @param {import('express').Request} req Express request containing an optional page query.
 * @returns {Promise<{ articles: object[], pagination: { page: number, pageSize: number, total: number, pageCount: number } }>} Paginated article response.
 */
export async function get(req) {
	return listPublishedArticlePage({
		page: firstQueryValue(req.query?.page),
		pageSize: BLOG_ARTICLES_PER_PAGE,
	});
}

/**
 * Reads the first scalar value from an Express query parameter.
 *
 * @param {unknown} value Express query parameter value.
 * @returns {unknown} The first query value when an array is supplied, otherwise the original value.
 */
function firstQueryValue(value) {
	return Array.isArray(value) ? value[0] : value;
}
