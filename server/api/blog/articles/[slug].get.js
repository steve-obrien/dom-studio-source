import { getPublishedArticleBySlug } from '../../../lib/blog.js';

export async function get(req, res) {
	const article = await getPublishedArticleBySlug(req.params.slug);
	if (!article) {
		res.status(404);
		return { error: 'Article not found.' };
	}

	return { article };
}
