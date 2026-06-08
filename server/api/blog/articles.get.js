import { listPublishedArticles } from '../../lib/blog.js';

export async function get() {
	return {
		articles: await listPublishedArticles(),
	};
}
