<script setup>
import { computed, watchEffect } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useAsyncData } from '#now/runtime/asyncData.js';
import { useHead, useRouteStatus } from '#now/runtime/head.js';
import { useApiFetch } from '../../composable/useApiFetch.js';
import DomStudioLayout from '../docs/_layout/DomStudioLayout.vue';
import { formatArticleDate, loadBlogArticle } from './blogData.js';

const route = useRoute();
const slug = computed(() => String(route.params.slug || ''));
const apiFetch = useApiFetch();

const { data: article, pending, error } = useAsyncData(
	`blog:article:${slug.value}`,
	() => loadBlogArticle(slug.value, apiFetch),
);

const articleDate = computed(() => formatArticleDate(article.value?.published_at || article.value?.source_created_at));
const head = useHead();

watchEffect(() => {
	if (!pending.value && !article.value) {
		useRouteStatus(404);
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
</script>

<template>
	<DomStudioLayout>
		<div v-if="pending" class="py-16 text-sm text-muted-foreground">Loading article...</div>
		<div v-else-if="error" class="py-16 text-sm text-destructive">The article could not be loaded.</div>
		<section v-else-if="!article" class="py-16">
			<p class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Not found</p>
			<h1 class="mt-3 text-4xl font-bold tracking-tight text-foreground">Article not found</h1>
			<RouterLink to="/blog" class="mt-6 inline-flex text-sm font-semibold text-foreground hover:underline">Back to blog</RouterLink>
		</section>

		<article v-else class="pb-16">
			<RouterLink to="/blog" class="text-sm font-semibold text-muted-foreground hover:text-foreground">← Blog</RouterLink>
			<header class="mt-8 border-b border-border pb-10">
				<div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
					<span v-if="articleDate">{{ articleDate }}</span>
					<span v-for="tag in article.tags" :key="tag" class="rounded-full border border-border px-2 py-0.5">{{ tag }}</span>
				</div>
				<h1 class="mt-4 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">{{ article.title }}</h1>
				<p v-if="article.meta_description" class="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
					{{ article.meta_description }}
				</p>
			</header>

			<img
				v-if="article.image_url"
				:src="article.image_url"
				:alt="article.title"
				class="my-10 aspect-[16/9] w-full rounded-lg border border-border object-cover"
			>

			<div class="blog-article-content" v-html="article.rendered_html"></div>
		</article>
	</DomStudioLayout>
</template>
