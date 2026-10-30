<script setup>
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
import {
	componentAnchor,
	getComponentRecords,
	labelFromExportName,
	primaryExportNameForSlug,
} from '../_layout/componentManager.js';
import { inspectComponentRecord } from '../_layout/componentInspector.js';
import { staticIconPaths } from '../_layout/sideNavLinks.js';
import ComponentOverviewPreview from './ComponentOverviewPreview.vue';

const overviewDescriptions = {
	accordion: 'Progressively discloses related sections with single or multiple open-state behavior.',
	tabs: 'Switches between related panels with keyboard navigation and pill or page-style presentation.',
	tooltip: 'Adds lightweight accessible context on hover and focus with collision-aware placement.',
};

const componentRecords = getComponentRecords()
	.map(inspectComponentRecord)
	.filter(isOverviewComponent);
const componentFamilies = buildComponentFamilies(componentRecords);

/**
 * Reports whether a catalog record belongs on the public component overview.
 *
 * @param {object} record Inspected component catalog record.
 * @returns {boolean} Whether the record should be included.
 */
function isOverviewComponent(record) {
	return record.section === 'components' && !record.hidden;
}

/**
 * Groups exported components by their shared documentation route.
 *
 * @param {Array<object>} records Inspected component catalog records.
 * @returns {Array<object>} Alphabetized component-family cards.
 */
function buildComponentFamilies(records) {
	const grouped = new Map();
	for (const record of records) {
		if (!grouped.has(record.slug)) grouped.set(record.slug, []);
		grouped.get(record.slug).push(record);
	}

	const families = [];
	for (const recordsInFamily of grouped.values()) families.push(buildComponentFamily(recordsInFamily));
	return families.sort(sortFamiliesByName);
}

/**
 * Builds one overview card from records that share a documentation slug.
 *
 * @param {Array<object>} records Family records from the component catalog.
 * @returns {object} Overview card metadata.
 */
function buildComponentFamily(records) {
	const primary = findPrimaryRecord(records);
	const name = primary.label || labelFromExportName(primary.exportName);
	return {
		slug: primary.slug,
		name,
		description: primary.doc.description || overviewDescriptions[primary.slug] || `Reusable ${name.toLowerCase()} behavior and presentation for application interfaces.`,
		icon: primary.icon || staticIconPaths[name] || 'M5 5h14v14H5z',
		to: primary.route,
		components: records.map((record) => buildComponentLink(record, primary)),
	};
}

/**
 * Resolves the primary export for a shared component route.
 *
 * @param {Array<object>} records Family records from the component catalog.
 * @returns {object} Primary record used for the card title and route.
 */
function findPrimaryRecord(records) {
	const expectedName = primaryExportNameForSlug(records[0]?.slug || '');
	return records.find((record) => record.doc.nav?.primary)
		|| records.find((record) => record.exportName === expectedName)
		|| records[0];
}

/**
 * Builds an exact route for an exported component within a family page.
 *
 * @param {object} record Exported component record.
 * @param {object} primary Primary record for the family.
 * @returns {{ name: string, to: string }} Component tag link.
 */
function buildComponentLink(record, primary) {
	return {
		name: record.exportName,
		to: record === primary ? primary.route : `${record.route}#${componentAnchor(record)}`,
	};
}

/**
 * Sorts overview families alphabetically by their display name.
 *
 * @param {object} first First family.
 * @param {object} second Second family.
 * @returns {number} Locale comparison result.
 */
function sortFamiliesByName(first, second) {
	return first.name.localeCompare(second.name);
}
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Components"
			eyebrow="DOM Studio"
			:tag="`${componentRecords.length} components · ${componentFamilies.length} families`"
			tagline="Application interface primitives with accessible behavior, polished Vue presentation, and source you can inspect and own."
		>
			<DocSection eyebrow="Explore" title="Components at a glance">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">
					Each card shows the component's core visual or interaction model. Where possible, previews use the real component; overlays and context-dependent controls use contained examples so the catalog stays useful at a glance.
				</p>

				<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					<article
						v-for="family in componentFamilies"
						:key="family.slug"
						class="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border skin-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
					>
						<div class="relative overflow-hidden border-b border-border transition duration-300 group-hover:scale-[1.01]">
							<ComponentOverviewPreview :type="family.slug" />
						</div>

						<div class="flex flex-1 flex-col p-5">
							<div class="flex items-start gap-3">
								<div class="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-secondary text-canvas-fg transition group-hover:border-primary/25 group-hover:bg-primary/10 group-hover:text-primary">
									<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
										<path :d="family.icon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</div>
								<div class="min-w-0 flex-1">
									<RouterLink :to="family.to" class="flex w-full items-start justify-between gap-4 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
										<h3 class="text-base font-semibold text-canvas-fg">{{ family.name }}</h3>
										<span class="mt-0.5 shrink-0 text-muted-fg transition group-hover:translate-x-0.5 group-hover:text-canvas-fg" aria-hidden="true">-&gt;</span>
									</RouterLink>
									<div class="mt-2 flex flex-wrap gap-1.5">
										<RouterLink
											v-for="component in family.components"
											:key="component.name"
											:to="component.to"
											class="rounded-md bg-secondary px-2 py-1 text-[11px] text-muted-fg ring-1 ring-border transition hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										>
											{{ component.name }}
										</RouterLink>
									</div>
								</div>
							</div>
							<p class="mt-4 text-sm leading-6 text-muted-fg">{{ family.description }}</p>
						</div>
					</article>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
