<script setup>
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';

const componentTypes = [
	{
		name: 'Code block',
		description: 'Renders examples, snippets, generated source, and implementation notes with syntax highlighting.',
		status: 'Reference',
	},
	{
		name: 'JSON viewer',
		description: 'Inspects parsed values or raw JSON payloads with a collapsible tree, highlighted source view, and copy support.',
		status: 'Reference',
	},
];

const boundaries = [
	'Use this section for developer-facing presentation primitives rather than server API workflows.',
	'Keep payload viewers, code displays, diagnostics, and implementation docs transport-free.',
	'Prefer the data section for components whose primary contract is loading, mutating, or paginating backend resources.',
];
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Dev"
			eyebrow="DOM Studio"
			tag="Developer UI"
			tagline="Developer-facing components for code, payloads, diagnostics, and implementation documentation."
		>
			<DocSection eyebrow="Overview" title="Developer presentation components">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Dev components are useful inside documentation, admin tools, diagnostics, generated-code previews, and AI-assisted builder surfaces. They are data-aware in the ordinary JavaScript sense, but they do not define backend API contracts.
					</p>
					<p>
						Use this section for presentational utilities that help developers inspect or copy implementation details. Use the Data section when a component owns a resource workflow such as server pagination, folder loading, uploads, or mutations.
					</p>
				</div>
			</DocSection>

			<DocSection eyebrow="Boundaries" title="What belongs here">
				<div class="grid gap-3 md:grid-cols-3">
					<div
						v-for="item in boundaries"
						:key="item"
						class="rounded-lg border border-border skin-card p-4 text-sm leading-6 text-muted-fg"
					>
						{{ item }}
					</div>
				</div>
			</DocSection>

			<DocSection eyebrow="Components" title="Developer utilities">
				<div class="grid gap-3 md:grid-cols-2">
					<div
						v-for="item in componentTypes"
						:key="item.name"
						class="rounded-lg border border-border skin-card p-4"
					>
						<div class="flex items-start justify-between gap-3">
							<p class="text-sm font-semibold text-canvas-fg">{{ item.name }}</p>
							<span class="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-fg">{{ item.status }}</span>
						</div>
						<p class="mt-3 text-sm leading-6 text-muted-fg">{{ item.description }}</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
