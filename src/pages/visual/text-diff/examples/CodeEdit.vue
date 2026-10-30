<script setup>
import { DomBadge, DomTextDiff } from '../../../lib/vue';

const original = `export async function generateMetadata(page) {
	return {
		title: page.title,
		description: page.description,
	};
}`;

const proposed = `export async function generateMetadata(page) {
	const description = page.seoDescription || page.description;

	return {
		title: page.seoTitle || page.title,
		description,
		robots: page.noIndex ? 'noindex' : 'index',
	};
}`;
</script>

<template>
	<div class="w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-canvas shadow-lg">
		<header class="flex items-center justify-between gap-3 border-b border-border bg-secondary/35 px-4 py-2.5">
			<div class="flex min-w-0 items-center gap-2">
				<svg class="size-4 shrink-0 text-muted-fg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
					<path d="M6 3h9l4 4v14H6V3Zm9 0v5h4M9 12h6M9 16h6" />
				</svg>
				<p class="truncate font-mono text-xs font-medium text-canvas-fg">app/metadata.js</p>
			</div>
			<DomBadge label="AI edit" tone="primary" size="sm" />
		</header>

		<DomTextDiff
			:original="original"
			:proposed="proposed"
			view="unified"
			format="code"
			original-label="Current file"
			proposed-label="Proposed edit"
			:framed="false"
		/>
	</div>
</template>
