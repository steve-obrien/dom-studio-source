<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useAsyncData } from '#now/runtime/asyncData.js';
import { useHead } from '#now/runtime/head.js';
import { useApiFetch } from '../../composable/useApiFetch.js';
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import { formatArticleDate, loadBlogArticles } from './blogData.js';

const apiFetch = useApiFetch();
const { data: articles, pending, error } = useAsyncData('blog:articles', () => loadBlogArticles(apiFetch), {
	default: [],
});

const featuredArticle = computed(() => articles.value[0] || null);
const moreArticles = computed(() => articles.value.slice(1));
const title = 'Blog | getdom.studio';
const description = 'Practical writing on DOM Studio, AI-ready UI, component systems, and editable product interfaces.';
const canonical = 'https://getdom.studio/blog';

useHead().setTitle(title);
useHead().setMeta([
	{ name: 'description', content: description },
	{ property: 'og:type', content: 'website' },
	{ property: 'og:title', content: title },
	{ property: 'og:description', content: description },
	{ property: 'og:url', content: canonical },
	{ name: 'twitter:card', content: 'summary' },
	{ name: 'twitter:title', content: title },
	{ name: 'twitter:description', content: description },
]);
useHead().setLink([{ rel: 'canonical', href: canonical }]);
useHead().setLdJson('blog-jsonld', {
	'@context': 'https://schema.org',
	'@type': 'Blog',
	name: 'getdom.studio Blog',
	description,
	url: canonical,
});
</script>

<template>
	<DomStudioLayout>
		<section class="border-b border-border pb-10">
			<p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-fg">Blog</p>
			<h1 class="mt-3 text-4xl font-bold tracking-tight text-canvas-fg sm:text-5xl">Notes on building interfaces people can keep owning.</h1>
			<p class="mt-4 max-w-2xl text-base leading-relaxed text-muted-fg">
				Practical writing on component systems, AI-editable UI, and the small decisions that make product surfaces feel steady.
			</p>
		</section>

		<div v-if="pending" class="py-16 text-sm text-muted-fg">Loading articles...</div>
		<div v-else-if="error" class="py-16 text-sm text-destructive">The blog could not be loaded.</div>
		<div v-else-if="!articles.length" class="py-16 text-sm text-muted-fg">No articles have been published yet.</div>

		<section v-else class="space-y-12 py-12">
			<RouterLink
				v-if="featuredArticle"
				:to="`/blog/${featuredArticle.slug}`"
				class="group grid gap-8 border-b border-border pb-12 md:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]"
			>
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2 text-xs text-muted-fg">
						<span>{{ formatArticleDate(featuredArticle.published_at || featuredArticle.source_created_at) }}</span>
						<span v-for="tag in featuredArticle.tags" :key="tag" class="rounded-full border border-border px-2 py-0.5">{{ tag }}</span>
					</div>
					<h2 class="mt-4 text-3xl font-bold leading-tight tracking-tight text-canvas-fg transition group-hover:text-muted-fg sm:text-4xl">
						{{ featuredArticle.title }}
					</h2>
					<p v-if="featuredArticle.meta_description" class="mt-4 max-w-2xl text-base leading-relaxed text-muted-fg">
						{{ featuredArticle.meta_description }}
					</p>
					<span class="mt-6 inline-flex text-sm font-semibold text-canvas-fg">Read article →</span>
				</div>
				<img
					v-if="featuredArticle.image_url"
					:src="featuredArticle.image_url"
					:alt="featuredArticle.title"
					class="aspect-[4/3] w-full rounded-lg border border-border object-cover"
				>
			</RouterLink>

			<div class="grid gap-8 sm:grid-cols-2">
				<RouterLink
					v-for="article in moreArticles"
					:key="article.slug"
					:to="`/blog/${article.slug}`"
					class="group block border-b border-border pb-8"
				>
					<img
						v-if="article.image_url"
						:src="article.image_url"
						:alt="article.title"
						class="mb-5 aspect-[16/9] w-full rounded-lg border border-border object-cover"
					>
					<div class="flex flex-wrap items-center gap-2 text-xs text-muted-fg">
						<span>{{ formatArticleDate(article.published_at || article.source_created_at) }}</span>
						<span v-for="tag in article.tags" :key="tag" class="rounded-full border border-border px-2 py-0.5">{{ tag }}</span>
					</div>
					<h2 class="mt-3 text-xl font-semibold leading-tight tracking-tight text-canvas-fg transition group-hover:text-muted-fg">
						{{ article.title }}
					</h2>
					<p v-if="article.meta_description" class="mt-3 text-sm leading-relaxed text-muted-fg">
						{{ article.meta_description }}
					</p>
				</RouterLink>
			</div>
		</section>
	</DomStudioLayout>
</template>
