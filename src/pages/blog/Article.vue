<script setup>
import { computed, nextTick, onMounted, ref, watch, watchEffect } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useAsyncData } from '#now/runtime/asyncData.js';
import { useHead, useRouteStatus } from '#now/runtime/head.js';
import { useApiFetch } from '../../composable/useApiFetch.js';
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import { highlight } from '../_layout/docs/shiki.js';
import { formatArticleDate, loadBlogArticle } from './blogData.js';

const route = useRoute();
const slug = computed(() => String(route.params.slug || ''));
const apiFetch = useApiFetch();
const articleContent = ref(null);
let highlightRun = 0;

const { data: article, pending, error } = useAsyncData(
	`blog:article:${slug.value}`,
	() => loadBlogArticle(slug.value, apiFetch),
);

const articleDate = computed(() => formatArticleDate(article.value?.published_at || article.value?.source_created_at));
const head = useHead();
const setRouteStatus = useRouteStatus();

watchEffect(() => {
	if (!pending.value && !article.value) {
		setRouteStatus(404);
		head.setTitle('Article not found | getdom.studio');
		head.setMeta([{ name: 'robots', content: 'noindex' }]);
		return;
	}

	if (!article.value) return;

	const currentArticle = article.value;
	const title = `${currentArticle.title} | getdom.studio`;
	const description = currentArticle.meta_description || `Read ${currentArticle.title} on the getdom.studio blog.`;
	const canonical = `https://getdom.studio/blog/${currentArticle.slug}`;
	const published = currentArticle.published_at || currentArticle.source_created_at;
	const modified = currentArticle.updated_at || published;
	const image = currentArticle.image_url || 'https://getdom.studio/brand-mark.svg';

	head.setTitle(title);
	head.setMeta([
		{ name: 'description', content: description },
		{ property: 'og:type', content: 'article' },
		{ property: 'og:title', content: currentArticle.title },
		{ property: 'og:description', content: description },
		{ property: 'og:url', content: canonical },
		{ property: 'og:image', content: image },
		{ property: 'article:published_time', content: published },
		{ property: 'article:modified_time', content: modified },
		...currentArticle.tags.map((tag) => ({ property: 'article:tag', content: tag })),
		{ name: 'twitter:card', content: currentArticle.image_url ? 'summary_large_image' : 'summary' },
		{ name: 'twitter:title', content: currentArticle.title },
		{ name: 'twitter:description', content: description },
		{ name: 'twitter:image', content: image },
	]);
	head.setLink([{ rel: 'canonical', href: canonical }]);
	head.setLdJson('blog-article-jsonld', {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: currentArticle.title,
		description,
		image: currentArticle.image_url ? [currentArticle.image_url] : undefined,
		datePublished: published,
		dateModified: modified,
		mainEntityOfPage: canonical,
		url: canonical,
		author: {
			'@type': 'Organization',
			name: 'getdom.studio',
			url: 'https://getdom.studio',
		},
		publisher: {
			'@type': 'Organization',
			name: 'getdom.studio',
			logo: {
				'@type': 'ImageObject',
				url: 'https://getdom.studio/brand-mark.svg',
			},
		},
		keywords: currentArticle.tags.join(', '),
	});
}, { flush: 'sync' });

onMounted(highlightArticleCodeBlocks);
watch(() => article.value?.rendered_html, highlightArticleCodeBlocks, { flush: 'post' });

async function highlightArticleCodeBlocks() {
	if (typeof window === 'undefined') return;

	const run = ++highlightRun;
	await nextTick();

	const root = articleContent.value;
	if (!root || run !== highlightRun) return;

	const blocks = [...root.querySelectorAll('pre > code')];
	for (const code of blocks) {
		if (run !== highlightRun) return;
		const pre = code.parentElement;
		if (!pre || pre.dataset.shiki === 'pending') continue;

		pre.dataset.shiki = 'pending';
		const highlighted = await highlight(code.textContent || '', getCodeLanguage(code));
		if (run !== highlightRun) return;

		if (!highlighted) {
			delete pre.dataset.shiki;
			continue;
		}

		const wrapper = document.createElement('div');
		wrapper.className = 'dom-shiki';
		wrapper.innerHTML = highlighted;
		pre.replaceWith(wrapper);
	}
}

function getCodeLanguage(code) {
	const className = [...code.classList].find((name) => name.startsWith('language-'));
	return className ? className.slice('language-'.length) : 'html';
}
</script>

<template>
	<DomStudioLayout>
		<div v-if="pending" class="py-16 text-sm text-muted-fg">Loading article...</div>
		<div v-else-if="error" class="py-16 text-sm text-destructive">The article could not be loaded.</div>
		<section v-else-if="!article" class="py-16">
			<p class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-fg">Not found</p>
			<h1 class="mt-3 text-4xl font-bold tracking-tight text-canvas-fg">Article not found</h1>
			<RouterLink to="/blog" class="mt-6 inline-flex text-sm font-semibold text-canvas-fg hover:underline">Back to blog</RouterLink>
		</section>

		<article v-else class="pb-16">
			<RouterLink to="/blog" class="text-sm font-semibold text-muted-fg hover:text-canvas-fg">← Blog</RouterLink>
			<header class="mt-8 border-b border-border pb-10">
				<div class="flex flex-wrap items-center gap-2 text-xs text-muted-fg">
					<span v-if="articleDate">{{ articleDate }}</span>
					<span v-for="tag in article.tags" :key="tag" class="rounded-full border border-border px-2 py-0.5">{{ tag }}</span>
				</div>
				<h1 class="mt-4 text-4xl font-bold leading-tight tracking-tight text-canvas-fg sm:text-5xl">{{ article.title }}</h1>
				<p v-if="article.meta_description" class="mt-5 max-w-2xl text-base leading-relaxed text-muted-fg">
					{{ article.meta_description }}
				</p>
			</header>

			<img
				v-if="article.image_url"
				:src="article.image_url"
				:alt="article.title"
				class="my-10 aspect-[16/9] w-full rounded-lg border border-border object-cover"
			>

			<div
				ref="articleContent"
				class="article-content max-w-none text-base leading-8 text-canvas-fg [&>*+*]:mt-6 [&_a]:font-semibold [&_a]:text-canvas-fg [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-5 [&_blockquote]:text-muted-fg [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-canvas-fg [&_h2]:mt-12 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:tracking-tight [&_h2]:text-canvas-fg [&_h3]:mt-10 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:leading-tight [&_h3]:tracking-tight [&_h3]:text-canvas-fg [&_iframe]:block [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:w-full [&_iframe]:max-w-full [&_iframe]:rounded-lg [&_iframe]:border [&_iframe]:border-border [&_iframe]:bg-secondary [&_li]:text-muted-fg [&_ol]:ml-6 [&_ol]:list-decimal [&_ol]:space-y-2 [&_p]:text-muted-fg [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-secondary [&_pre]:p-4 [&_pre]:text-sm [&_pre]:leading-6 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_.dom-shiki]:overflow-hidden [&_.dom-shiki]:rounded-lg [&_.dom-shiki]:border [&_.dom-shiki]:border-border [&_.dom-shiki]:bg-secondary [&_.dom-shiki_.shiki]:m-0"
				v-html="article.rendered_html"
			></div>
		</article>
	</DomStudioLayout>
</template>

<style scoped>
.article-content :deep(.dom-markdown-table),
.article-content :deep(> table) {
	max-width: 100%;
	overflow-x: auto;
	border: 1px solid var(--border);
	border-radius: var(--radius-lg);
	background: var(--canvas);
	box-shadow: var(--shadow-xs);
}

.article-content :deep(> table) {
	display: block;
}

.article-content :deep(table) {
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	font-size: 0.875rem;
	line-height: 1.6;
}

.article-content :deep(.dom-markdown-table table) {
	min-width: 44rem;
}

.article-content :deep(th),
.article-content :deep(td) {
	border-right: 1px solid var(--border);
	border-bottom: 1px solid var(--border);
	padding: 0.75rem 1rem;
	text-align: left;
	vertical-align: top;
}

.article-content :deep(th) {
	background: color-mix(in oklch, var(--secondary) 76%, transparent);
	color: var(--canvas-fg);
	font-weight: 650;
}

.article-content :deep(td) {
	color: var(--muted-fg);
}

.article-content :deep(th:last-child),
.article-content :deep(td:last-child) {
	border-right: 0;
}

.article-content :deep(tbody tr:last-child td) {
	border-bottom: 0;
}
</style>
