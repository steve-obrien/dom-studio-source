<script setup>
import { RouterLink } from 'vue-router';
import DomStudioLayout from './_layout/DomStudioLayout.vue';
import { libraryMenu, primaryNavigation } from './_layout/siteNavigation.js';
import { getBlockCategories, getBlockRecords } from './blocks/blockRegistry.js';
import HomeAIVisual from './_home/HomeAIVisual.vue';
import HomeAnalytics from './_home/HomeAnalytics.vue';
import HomeDesignerVisual from './_home/HomeDesignerVisual.vue';
import HomeDocumentsVisual from './_home/HomeDocumentsVisual.vue';
import HomeFilesVisual from './_home/HomeFilesVisual.vue';
import HomeGridVisual from './_home/HomeGridVisual.vue';
import HomeLiveDemo from './_home/HomeLiveDemo.vue';
import HomeMobileVisual from './_home/HomeMobileVisual.vue';
import HomePricingCompare from './_home/HomePricingCompare.vue';
import HomeProductSection from './_home/HomeProductSection.vue';
import HomeSchedulerVisual from './_home/HomeSchedulerVisual.vue';
import HomeSocialVisual from './_home/HomeSocialVisual.vue';
import HomeWorkflowVisual from './_home/HomeWorkflowVisual.vue';
import { DomButton, DomCodeBlock } from './lib/vue';

/** One scrolling section per header product, in header order. Copy names only what ships today. */
const products = [
	{
		id: 'data-grid',
		visual: HomeGridVisual,
		live: () => import('./_home/live/HomeGridLive.vue'),
		title: 'A data grid for the serious work.',
		text: 'Trading desks, back offices and admin consoles. Spreadsheet-grade editing on your own Vue components, themed like the rest of your app.',
		features: ['Pinned columns, column menu and resizing', 'Inline editing with validation and undo', 'Range selection with copy and paste to Excel', 'Row grouping with sums, averages and totals', 'CSV and typed .xlsx export', 'Typed filters, multi-sort, virtual rows and server queries'],
		link: 'Explore the Data Grid',
	},
	{
		id: 'scheduler',
		visual: HomeSchedulerVisual,
		live: () => import('./_home/live/HomeSchedulerLive.vue'),
		title: 'Plan people, rooms and time.',
		text: 'Resource planners, roadmaps, room bookings and calendars, built on one time model so every view behaves the same way.',
		features: ['Gantt and resource rows with stacked overlaps', 'Draw to create, drag to move, stretch to resize', 'Zoom from hours to months without losing your place', 'Working hours, weekends and snapping', 'Week planner and month calendar views', 'Loads only the visible date range'],
		link: 'Explore the Scheduler',
		more: [{ to: '/data/gantt', label: 'Gantt' }, { to: '/data/month-calendar', label: 'Month calendar' }],
	},
	{
		id: 'documents',
		visual: HomeDocumentsVisual,
		live: () => import('./_home/live/HomeDocumentsLive.vue'),
		title: 'Write together, in real time.',
		text: 'A rich document editor where everyone sees each other’s cursors and selections as they type, with AI rewrites you review before they land.',
		features: ['Live multi-user editing with named cursors', 'Shared selections and presence', 'Headings, tables, code blocks, images and video', 'AI Expand, Simplify and Improve on any selection', 'Suggested changes shown as a diff to accept or reject', 'Drops into a form as a v-model field'],
		link: 'Try live editing',
	},
	{
		id: 'files',
		visual: HomeFilesVisual,
		live: () => import('./_home/live/HomeFilesLive.vue'),
		title: 'A media library you don’t have to build.',
		text: 'The Finder-style file manager every app ends up needing, wired to your own storage and API.',
		features: ['Folders, breadcrumbs and folder paths in the URL', 'Drag to select, plus shift and command-click', 'Rename and move with instant, optimistic updates', 'Chunked uploads with progress', 'Inspector with image and PDF previews', 'A file picker field that drops into any form'],
		link: 'Explore the media browser',
	},
	{
		id: 'designer',
		visual: HomeDesignerVisual,
		live: () => import('./_home/live/HomeDesignerLive.vue'),
		liveMinWidth: 1024,
		wide: true,
		title: 'Design the real website. Keep the real code.',
		text: 'A Figma-style canvas that renders your actual Vue and HTML. Select something on the page and the source highlights; edit either side and the other follows.',
		features: ['Artboards at several screen widths, with live components', 'Two-way code view: canvas and source stay in sync', 'Saves by patching your file, keeping its formatting', 'Inline text editing, layers, layout and style panels', 'Social post and poster studios on the same core', 'Embed it in your own product as DomDesigner'],
		link: 'Open the canvas designer',
		to: '/designer/canvas',
		more: [{ to: '/designer/social', label: 'Social post studio' }, { to: '/designer', label: 'All designer tools' }],
	},
	{
		id: 'social',
		product: 'Social studio',
		visual: HomeSocialVisual,
		title: 'One design. Every platform.',
		text: 'Canva-style post editing inside your own product. Edit layers on a real HTML canvas and every platform size updates underneath, because each layer pins to an edge or the centre.',
		features: ['Instagram post and story, LinkedIn, X, YouTube and link previews', 'Pin layers so designs adapt to each format', 'Industry templates for retail, food, fitness, property and more', 'Generate new templates with AI', 'Save designs as new templates, never overwriting', 'Built on the same editor core as the designer'],
		link: 'Open the Social post studio',
		to: '/designer/social',
		more: [{ to: '/designer/poster', label: 'Poster studio' }],
	},
	{
		id: 'charts',
		visual: HomeAnalytics,
		title: 'Dashboards people actually read.',
		text: 'Responsive charts that share your theme tokens, with accessible data tables built in. Try the legend and the stacking toggle.',
		features: ['Line, area, bar, donut and sparkline', 'Metric cards with trends', 'Legend toggles, tooltips and stacking', 'Currency, percent and number formats', 'An accessible data table behind every chart', 'Finance examples and a date range picker'],
		link: 'Explore Charts',
	},
	{
		id: 'ai',
		visual: HomeAIVisual,
		live: () => import('./_home/live/HomeAILive.vue'),
		title: 'Give your agent a proper interface.',
		text: 'Conversations, tool results and answers people can act on. Show a table, ask for a decision, then let the agent carry on.',
		features: ['Agent chat with streamed responses', 'Tool calls and results as rich cards', 'Prompt composer with attachments and context', 'Side-by-side diff review of AI changes', 'Component contracts and llms.txt for coding agents', 'AI builders for prompts and themes'],
		link: 'Explore AI interfaces',
		more: [{ to: '/data/agent-chat', label: 'Agent chat' }, { to: '/ai/builders', label: 'AI builders' }],
	},
	{
		id: 'workflows',
		product: 'AI workflows',
		visual: HomeWorkflowVisual,
		title: 'Show the AI process, step by step.',
		text: 'Put automations and infrastructure on a canvas people can follow, like n8n inside your own app. Switch between an AI lead flow and the server routes view from db3 Dock. The flowchart designer draws and edits the flow; your app runs the steps.',
		features: ['Editable steps and connections on an infinite canvas', 'Branches, AI steps and human approval in one picture', 'Show the model, data and tools attached to an agent', 'Live, standby and failed routes for operations views', 'Pan, zoom and a minimap for large flows', 'HTML nodes you can style like the rest of your app'],
		link: 'Open the flowchart designer',
		to: '/designer/flowchart',
	},
	{
		id: 'mobile',
		product: 'Mobile',
		visual: HomeMobileVisual,
		title: 'Small screen. Complete experience.',
		text: 'Touch-first app shells and navigation for phones. Both screens here are live: swipe a message, open one, or dig into the settings.',
		features: ['App shell with top bar and bottom navigation', 'Navigation stack with native-feeling transitions', 'Swipe actions with undo', 'Bottom sheets with snap points and action sheets', 'Safe-area aware layouts'],
		link: 'Explore mobile',
		to: '/mobile',
	},
].map(withNavigation);
const blockCount = getBlockRecords().length;
const blockCategoryCount = getBlockCategories().length;
const libraryItems = libraryMenu.groups.filter((group) => group.label !== 'Get started').flatMap((group) => group.items).filter((item) => !['/data/kanban', '/icons', '/mobile'].includes(item.to));
const installCode = "import { DomDataGrid, DomGantt } from '@getdom/studio/vue';\nimport { DomDesigner } from '@getdom/studio/designer';\nimport '@getdom/studio/style.css';";

/**
 * Fills a product section's label, number and default link from the header navigation, unless the section sets its own.
 * @param {object} product Homepage copy for one product.
 * @param {number} index Position in header order.
 * @returns {object} Section props.
 */
function withNavigation(product, index) {
	const nav = primaryNavigation.find((item) => item.id === product.id);
	return { product: nav?.label, to: nav?.to, ...product, number: String(index + 1).padStart(2, '0'), tinted: index % 2 === 0 };
}
</script>

<template>
	<DomStudioLayout>
		<div class="relative left-1/2 w-screen -translate-x-1/2 overflow-x-clip bg-canvas text-canvas-fg">
			<section class="mx-auto max-w-[1320px] px-5 pb-14 pt-2 sm:px-8">
				<div class="mx-auto max-w-4xl text-center">
					<p class="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-fg">
						<span class="size-1.5 rounded-full bg-success" aria-hidden="true"></span> Vue 3 · Web Components · Tailwind CSS</p>
					<h1 class="mt-5 text-[clamp(2.8rem,6vw,5rem)] font-semibold leading-[1.04] tracking-[-0.065em]">Ambitious apps.<br />
						<span class="text-muted-fg">Beautifully built.</span>
					</h1>
					<p class="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-fg sm:text-lg">Data grid, scheduler, live documents, files, a visual designer, charts and AI interfaces. One licence, and source code you own.</p>
					<div class="mt-5 flex flex-wrap justify-center gap-3">
						<DomButton as="router-link" to="/install" size="lg">Start building <span aria-hidden="true">↗</span>
						</DomButton>
						<DomButton as="a" href="#data-grid" size="lg" variant="secondary">See what’s inside <span aria-hidden="true">↓</span>
						</DomButton>
					</div>
				</div>
				<nav class="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" aria-label="Products on this page">
					<a v-for="product in products" :key="product.id" :href="`#${product.id}`" class="group rounded-xl border border-border bg-secondary/20 px-4 py-3 text-left transition-colors hover:border-canvas-fg/30 hover:bg-secondary/50">
						<span class="font-mono text-[0.65rem] text-muted-fg">{{ product.number }}</span>
						<span class="mt-1 flex items-center justify-between text-sm font-semibold">{{ product.product }} <span class="text-muted-fg transition-transform group-hover:translate-y-0.5" aria-hidden="true">↓</span></span>
					</a>
				</nav>
			</section>

			<HomeProductSection v-for="product in products" :id="product.id" :key="product.id" :number="product.number" :product="product.product" :title="product.title" :text="product.text" :features="product.features" :to="product.to" :link="product.link" :more="product.more" :tinted="product.tinted" :wide="product.wide">
				<HomeLiveDemo v-if="product.live" :load="product.live" :min-width="product.liveMinWidth">
					<component :is="product.visual" />
				</HomeLiveDemo>
				<component :is="product.visual" v-else />
			</HomeProductSection>

			<section class="border-y border-border bg-secondary/20">
				<div class="mx-auto max-w-[1320px] px-5 py-16 sm:px-8 lg:py-24">
					<div class="mb-9 flex flex-wrap items-end justify-between gap-5">
						<div>
							<p class="font-mono text-xs uppercase tracking-[0.18em] text-muted-fg">And the rest of the app</p>
							<h2 class="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Everything around it, included.</h2>
							<p class="mt-4 max-w-xl text-base leading-7 text-muted-fg">{{ blockCount }} complete product screens across {{ blockCategoryCount }} categories, plus the components, forms and mobile patterns they are built from.</p>
						</div>
						<RouterLink to="/blocks" class="text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-current">Browse app blocks ↗</RouterLink>
					</div>
					<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<RouterLink v-for="item in libraryItems" :key="item.to" :to="item.to" class="rounded-2xl border border-border bg-canvas p-5 transition-colors hover:border-canvas-fg/30">
							<span class="flex items-center justify-between text-base font-semibold tracking-tight">{{ item.label }} <span class="text-muted-fg" aria-hidden="true">→</span></span>
							<span class="mt-1.5 block text-sm leading-6 text-muted-fg">{{ item.description }}</span>
						</RouterLink>
					</div>
				</div>
			</section>

			<section class="mx-auto max-w-[1320px] px-5 py-16 sm:px-8 lg:py-24">
				<div class="grid min-w-0 grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
					<div class="min-w-0">
						<p class="font-mono text-xs uppercase tracking-[0.18em] text-muted-fg">Made for people and coding agents</p>
						<h2 class="mt-4 text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">Your agent builds it.<br />You shape it.</h2>
						<p class="mt-5 max-w-md text-base leading-7 text-muted-fg">Every component ships with a contract, examples and agent guidance, so a coding assistant builds with the same pieces you do. Then open the result in the designer and refine it visually. It is still code you can read and change.</p>
						<DomCodeBlock :code="installCode" lang="js" filename="app.js" class="mt-7 min-w-0" />
					</div>
					<div class="divide-y divide-border">
						<article class="flex gap-5 py-6 first:pt-0">
							<span class="pt-1 font-mono text-xs text-muted-fg">01</span>
							<div>
								<h3 class="text-xl font-semibold tracking-tight">Contracts agents can read.</h3>
								<p class="mt-2 text-sm leading-7 text-muted-fg">Props, events and examples as metadata, plus llms.txt and an installable skill, so generated code uses the real API.</p>
								<RouterLink to="/component-spec" class="mt-4 inline-block text-sm font-medium">Component metadata ↗</RouterLink>
							</div>
						</article>
						<article class="flex gap-5 py-6">
							<span class="pt-1 font-mono text-xs text-muted-fg">02</span>
							<div>
								<h3 class="text-xl font-semibold tracking-tight">Edit generated apps visually.</h3>
								<p class="mt-2 text-sm leading-7 text-muted-fg">Load the Vue an agent wrote into the canvas designer. Changes are patched back into the same file.</p>
								<RouterLink to="/designer/canvas" class="mt-4 inline-block text-sm font-medium">Canvas designer ↗</RouterLink>
							</div>
						</article>
						<article class="flex gap-5 py-6">
							<span class="pt-1 font-mono text-xs text-muted-fg">03</span>
							<div>
								<h3 class="text-xl font-semibold tracking-tight">Make it yours.</h3>
								<p class="mt-2 text-sm leading-7 text-muted-fg">Semantic tokens shared by every product, light and dark, and an AI theme editor to turn the foundation into your brand.</p>
								<RouterLink to="/theming" class="mt-4 inline-block text-sm font-medium">Theming ↗</RouterLink>
							</div>
						</article>
					</div>
				</div>
				<HomePricingCompare class="mt-16" />
				<div class="mt-8 flex flex-wrap items-center justify-between gap-8 rounded-3xl bg-primary px-7 py-10 text-primary-fg sm:p-12">
					<div>
						<h2 class="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Every product. One licence.</h2>
						<p class="mt-3 max-w-xl text-sm opacity-75">Grid, Scheduler, Documents, Files, Designer, Charts and AI, with every block and component. Use forever, with source included.</p>
					</div>
					<div class="flex flex-wrap gap-3">
						<DomButton as="router-link" to="/pricing" variant="secondary" size="lg">See pricing ↗</DomButton>
						<RouterLink to="/install" class="inline-flex items-center px-4 py-3 text-sm font-medium underline underline-offset-4">Try it locally first</RouterLink>
					</div>
				</div>
			</section>
		</div>
	</DomStudioLayout>
</template>
