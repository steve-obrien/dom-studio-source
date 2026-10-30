import { publishArticles, updateArticle, validateOutrankArticle } from '../../lib/blog.js';

/**
 * Processes authenticated article publication events sent by Outrank.
 *
 * Supported event types:
 * - `publish_articles` validates and publishes every article in `data.articles`.
 * - `update_article` validates and updates the article in `data.article`.
 *
 * @param {import('express').Request} req HTTP request containing the bearer token and webhook payload.
 * @param {import('express').Response} res HTTP response used to set error status codes.
 * @returns {Promise<{ message: string, count: number } | { error: string }>} Webhook result.
 */
export async function post(req, res) {
	const expectedToken = process.env.OUTRANK_WEBHOOK_ACCESS_TOKEN || '';
	if (!expectedToken) {
		res.status(503);
		return { error: 'Outrank webhook is not configured.' };
	}

	if (!validateBearerToken(req, expectedToken)) {
		res.status(401);
		return { error: 'Invalid access token.' };
	}

	const { event_type: eventType, data } = req.body || {};
	if (eventType === 'publish_articles' || eventType === 'article.publish') {
		const articles = Array.isArray(data?.articles) ? data.articles : [];
		const error = articles.map(validateOutrankArticle).find(Boolean);
		if (!articles.length || error) {
			res.status(400);
			return { error: error || 'Publish event requires data.articles.' };
		}

		const count = await publishArticles(articles);
		return { message: 'Webhook processed successfully.', count };
	}

	if (eventType === 'update_article' || eventType === 'article.update') {
		const article = data?.article;
		const error = validateOutrankArticle(article);
		if (error) {
			res.status(400);
			return { error };
		}

		await updateArticle(article);
		return { message: 'Webhook processed successfully.', count: 1 };
	}

	res.status(400);
	return { error: 'Unsupported Outrank event_type.' };
}

/**
 * Checks whether the request supplies the configured bearer token.
 *
 * @param {import('express').Request} req HTTP request whose authorization header is checked.
 * @param {string} expectedToken Configured token that the request must provide.
 * @returns {boolean} Whether the authorization header contains the expected token.
 */
function validateBearerToken(req, expectedToken) {
	const header = req.headers.authorization || '';
	if (!header.startsWith('Bearer ')) return false;
	return header.slice('Bearer '.length).trim() === expectedToken;
}
