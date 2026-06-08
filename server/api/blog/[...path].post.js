import { publishArticles, updateArticle, validateOutrankArticle } from '../../lib/blog.js';

export async function post(req, res) {
	const expectedToken = process.env.OUTRANK_WEBHOOK_ACCESS_TOKEN || process.env.BLOG_WEBHOOK_ACCESS_TOKEN || '';
	if (!expectedToken) {
		res.status(503);
		return { error: 'Blog webhook is not configured.' };
	}

	if (!validateBearerToken(req, expectedToken)) {
		res.status(401);
		return { error: 'Invalid access token.' };
	}

	const { event_type: eventType, data } = req.body || {};
	if (eventType === 'publish_articles') {
		const articles = Array.isArray(data?.articles) ? data.articles : [];
		const error = articles.map(validateOutrankArticle).find(Boolean);
		if (!articles.length || error) {
			res.status(400);
			return { error: error || 'Publish event requires data.articles.' };
		}

		const count = await publishArticles(articles);
		return { message: 'Webhook processed successfully.', count };
	}

	if (eventType === 'update_article') {
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
	return { error: 'Unsupported event_type.' };
}

function validateBearerToken(req, expectedToken) {
	const header = req.headers.authorization || '';
	if (!header.startsWith('Bearer ')) return false;
	return header.slice('Bearer '.length).trim() === expectedToken;
}
