<script setup>
import { useAsyncData } from '#now/runtime/asyncData.js';
import { useApiFetch } from '../../composable/useApiFetch.js';

const apiFetch = useApiFetch();
const { data, pending, error } = useAsyncData('releases', loadReleases, { default: { releases: [] } });

/** Loads the public release projection through the SSR-aware API client. */
async function loadReleases() {
	const response = await apiFetch('/api/releases');
	if (!response.ok) throw new Error('Unable to load releases');
	return response.json();
}

/** Formats the publication timestamp consistently during SSR and hydration. */
function releaseDate(value) {
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}
</script>

<template>
			<p v-if="pending" class="text-muted-fg">Loading releases…</p>
			<p v-else-if="error" role="alert" class="text-muted-fg">Release notes could not be loaded. Please try again shortly.</p>
			<p v-else-if="!data?.releases?.length" class="text-muted-fg">Release notes will appear here when the first release is published.</p>
			<div v-else class="divide-y divide-border">
				<article v-for="release in data.releases" :id="`v${release.version}`" :key="release.version" class="grid scroll-mt-24 gap-6 py-10 first:pt-0 md:grid-cols-[10rem_minmax(0,1fr)]">
					<div class="space-y-3">
						<a :href="`#v${release.version}`" class="inline-flex rounded-full border border-border bg-secondary px-3 py-1 font-mono text-sm font-semibold">v{{ release.version }}</a>
						<time :datetime="release.publishedAt" class="block text-sm text-muted-fg">{{ releaseDate(release.publishedAt) }}</time>
						<a :href="`https://www.npmjs.com/package/@getdom/studio/v/${release.version}`" class="block text-sm text-primary underline underline-offset-4">View on npm ↗</a>
					</div>
					<div class="min-w-0">
						<h2 class="text-2xl font-semibold tracking-tight">{{ release.title }}</h2>
						<div class="mt-5 space-y-4 leading-7 text-muted-fg [&_h3]:pt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-canvas-fg [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:break-words [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1 [&_code]:text-sm [&_a]:text-primary [&_a]:underline [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-secondary [&_pre]:p-4" v-html="release.html" />
					</div>
				</article>
			</div>
</template>
