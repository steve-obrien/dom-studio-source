import fs from 'node:fs/promises';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import { getDb } from './db.js';

const markdown = new MarkdownIt({
	html: true,
	linkify: true,
	typographer: true,
});
markdown.renderer.rules.table_open = (tokens, idx, options, env, self) => {
	return `<div class="dom-markdown-table">${self.renderToken(tokens, idx, options)}`;
};
markdown.renderer.rules.table_close = (tokens, idx, options, env, self) => {
	return `${self.renderToken(tokens, idx, options)}</div>`;
};
const localContentDir = path.resolve(process.cwd(), 'src/pages/blog/content');

export async function listPublishedArticles() {
	const [databaseArticles, localArticles] = await Promise.all([
		listDatabaseArticles(),
		listLocalArticles(),
	]);

	return mergeArticles(databaseArticles, localArticles);
}

/**
 * Loads one page of published articles after merging database and local sources.
 *
 * @param {{ page?: number, pageSize?: number }} options Pagination options.
 * @returns {Promise<{ articles: object[], pagination: { page: number, pageSize: number, total: number, pageCount: number } }>} Paginated article result.
 */
export async function listPublishedArticlePage({ page = 1, pageSize = 50 } = {}) {
	const articles = await listPublishedArticles();
	const resolvedPageSize = positiveInteger(pageSize, 50);
	const total = articles.length;
	const pageCount = Math.max(1, Math.ceil(total / resolvedPageSize));
	const resolvedPage = Math.min(positiveInteger(page, 1), pageCount);
	const offset = (resolvedPage - 1) * resolvedPageSize;

	return {
		articles: articles.slice(offset, offset + resolvedPageSize),
		pagination: {
			page: resolvedPage,
			pageSize: resolvedPageSize,
			total,
			pageCount,
		},
	};
}

export async function getPublishedArticleBySlug(slug) {
	if (!slug) return null;
	const normalizedSlug = normalizeSlug(slug);

	const [databaseArticle, localArticle] = await Promise.all([
		getDatabaseArticleBySlug(normalizedSlug),
		getLocalArticleBySlug(normalizedSlug),
	]);

	return mergeArticles(
		databaseArticle ? [databaseArticle] : [],
		localArticle ? [localArticle] : [],
	)[0] || null;
}

export async function publishArticles(articles, receivedAt = new Date()) {
	const records = articles.map((article) => buildArticleRecord(article, receivedAt));
	for (const record of records) {
		await upsertArticleRecord(record);
	}

	return records.length;
}

export async function updateArticle(article, receivedAt = new Date()) {
	const record = buildArticleRecord(article, receivedAt);
	await upsertArticleRecord(record);
	return record;
}

export function validateOutrankArticle(article) {
	if (!article || typeof article !== 'object') return 'Article must be an object.';
	if (!stringValue(article.slug)) return 'Article slug is required.';
	if (!stringValue(article.title)) return 'Article title is required.';
	if (!stringValue(article.content_markdown) && !stringValue(article.content_html)) {
		return 'Article content_markdown or content_html is required.';
	}
	if (article.tags !== undefined && !Array.isArray(article.tags)) return 'Article tags must be an array.';
	return '';
}

async function listDatabaseArticles() {
	try {
		const rows = await getDb()('blog_articles')
			.select(
				'id',
				'outrank_id',
				'slug',
				'title',
				'meta_description',
				'image_url',
				'tags',
				'source_created_at',
				'published_at',
				'updated_at',
			)
			.orderBy([{ column: 'published_at', order: 'desc' }, { column: 'created_at', order: 'desc' }]);

		return rows.map((row) => normalizeArticleRow({ source: 'database', ...row }));
	} catch (error) {
		console.warn(`Unable to load database blog articles: ${error.message}`);
		return [];
	}
}

async function getDatabaseArticleBySlug(slug) {
	try {
		const row = await getDb()('blog_articles')
			.where({ slug })
			.first(
				'id',
				'outrank_id',
				'slug',
				'title',
				'meta_description',
				'image_url',
				'content_markdown',
				'content_html',
				'tags',
				'source_created_at',
				'published_at',
				'updated_at',
			);

		return row ? normalizeArticleRow({ source: 'database', ...row }) : null;
	} catch (error) {
		console.warn(`Unable to load database blog article "${slug}": ${error.message}`);
		return null;
	}
}

async function listLocalArticles() {
	const files = await readLocalArticleFiles();
	const articles = await Promise.all(files.map((file) => readLocalArticle(file)));
	return articles.filter(Boolean);
}

async function getLocalArticleBySlug(slug) {
	const files = await readLocalArticleFiles();
	for (const file of files) {
		const article = await readLocalArticle(file, { includeContent: true });
		if (article?.slug === slug) return article;
	}

	return null;
}

async function readLocalArticleFiles() {
	try {
		const entries = await fs.readdir(localContentDir, { withFileTypes: true });
		return entries
			.filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
			.map((entry) => path.join(localContentDir, entry.name));
	} catch (error) {
		if (error.code === 'ENOENT') return [];
		throw error;
	}
}

async function readLocalArticle(file, options = {}) {
	const raw = await fs.readFile(file, 'utf8');
	const { attributes, body } = parseFrontmatter(raw);
	const fileSlug = path.basename(file, '.md');
	const slug = normalizeSlug(attributes.slug || fileSlug);
	const title = stringValue(attributes.title) || titleFromSlug(slug);
	const publishedAt = parseDate(attributes.published_at || attributes.date);
	const updatedAt = parseDate(attributes.updated_at || attributes.modified_at);
	const article = {
		id: `local:${slug}`,
		source: 'local',
		slug,
		title,
		meta_description: stringValue(attributes.meta_description || attributes.description),
		image_url: stringValue(attributes.image_url || attributes.image),
		tags: normalizeTags(attributes.tags),
		source_created_at: publishedAt,
		published_at: publishedAt,
		updated_at: updatedAt || publishedAt,
	};

	if (options.includeContent) {
		article.content_markdown = body.trim();
	}

	return normalizeArticleRow(article);
}

function buildArticleRecord(article, receivedAt) {
	const markdownContent = stringValue(article.content_markdown);

	return {
		outrank_id: stringValue(article.id) || null,
		slug: normalizeSlug(article.slug),
		title: stringValue(article.title),
		meta_description: stringValue(article.meta_description),
		image_url: stringValue(article.image_url),
		content_markdown: markdownContent,
		content_html: stringValue(article.content_html),
		tags: JSON.stringify(normalizeTags(article.tags)),
		source_created_at: parseDate(article.created_at),
		source_updated_at: parseDate(article.updated_at || article.modified_at),
		published_at: parseDate(article.created_at) || receivedAt,
		webhook_received_at: receivedAt,
		updated_at: getDb().fn.now(),
	};
}

async function upsertArticleRecord(record) {
	await getDb()('blog_articles')
		.insert(record)
		.onConflict('slug')
		.merge({
			outrank_id: record.outrank_id,
			title: record.title,
			meta_description: record.meta_description,
			image_url: record.image_url,
			content_markdown: record.content_markdown,
			content_html: record.content_html,
			tags: record.tags,
			source_created_at: record.source_created_at,
			source_updated_at: record.source_updated_at,
			published_at: record.published_at,
			webhook_received_at: record.webhook_received_at,
			updated_at: getDb().fn.now(),
		});
}

function mergeArticles(databaseArticles, localArticles) {
	const articlesBySlug = new Map();

	for (const article of localArticles) {
		articlesBySlug.set(article.slug, article);
	}

	for (const article of databaseArticles) {
		articlesBySlug.set(article.slug, article);
	}

	return [...articlesBySlug.values()].sort((a, b) => {
		const aTime = new Date(a.published_at || a.source_created_at || 0).getTime();
		const bTime = new Date(b.published_at || b.source_created_at || 0).getTime();
		return bTime - aTime;
	});
}

function parseFrontmatter(raw) {
	if (!raw.startsWith('---')) return { attributes: {}, body: raw };
	const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
	if (!match) return { attributes: {}, body: raw };

	return {
		attributes: parseFrontmatterAttributes(match[1]),
		body: match[2],
	};
}

function parseFrontmatterAttributes(frontmatter) {
	const attributes = {};

	for (const line of frontmatter.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const separator = trimmed.indexOf(':');
		if (separator === -1) continue;

		const key = trimmed.slice(0, separator).trim();
		const rawValue = trimmed.slice(separator + 1).trim();
		attributes[key] = parseFrontmatterValue(rawValue);
	}

	return attributes;
}

function parseFrontmatterValue(value) {
	if (value.startsWith('[') && value.endsWith(']')) {
		return value
			.slice(1, -1)
			.split(',')
			.map((item) => trimQuotes(item.trim()))
			.filter(Boolean);
	}

	return trimQuotes(value);
}

function trimQuotes(value) {
	return value.replace(/^['"]|['"]$/g, '');
}

export function renderArticleHtml(contentMarkdown, fallbackHtml) {
	if (contentMarkdown) return markdown.render(contentMarkdown);
	return stringValue(fallbackHtml);
}

function normalizeArticleRow(row) {
	const article = {
		...row,
		tags: parseTags(row.tags),
		source_created_at: serializeDate(row.source_created_at),
		published_at: serializeDate(row.published_at),
		updated_at: serializeDate(row.updated_at),
	};
	if (row.content_markdown || row.content_html) {
		article.rendered_html = renderArticleHtml(row.content_markdown, row.content_html);
	}

	return article;
}

function normalizeSlug(value) {
	return stringValue(value)
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 191);
}

function normalizeTags(tags) {
	if (typeof tags === 'string') {
		return tags.split(',').map((tag) => stringValue(tag)).filter(Boolean);
	}

	return Array.isArray(tags)
		? tags.map((tag) => stringValue(tag)).filter(Boolean)
		: [];
}

function parseTags(value) {
	if (Array.isArray(value)) return value;
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function parseDate(value) {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return date;
}

function serializeDate(value) {
	if (!value) return null;
	if (value instanceof Date) return value.toISOString();
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function stringValue(value) {
	return typeof value === 'string' ? value.trim() : '';
}

/**
 * Normalizes a value to a positive integer or returns the supplied fallback.
 *
 * @param {unknown} value Candidate numeric value.
 * @param {number} fallback Positive integer used when the candidate is invalid.
 * @returns {number} A positive integer.
 */
function positiveInteger(value, fallback) {
	const number = Math.floor(Number(value));
	return Number.isFinite(number) && number > 0 ? number : fallback;
}

function titleFromSlug(slug) {
	return slug
		.split('-')
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}
