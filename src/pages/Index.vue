<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import BrandMark from './_layout/BrandMark.vue';
import DomStudioLayout from './_layout/DomStudioLayout.vue';
import {
	DomAccordion,
	DomButton,
	DomCombobox,
	DomCommandPalette,
	DomDatePicker,
	DomDropdown,
	DomPopover,
	DomRadioGroup,
	DomRangeInput,
	DomTagCombobox,
	DomTabs,
	DomToastStack,
	DomToggle,
	DomTooltip,
	DomTreeView,
	useToasts,
} from './lib/vue';

const router = useRouter();
const isMounted = ref(false);
const showcaseTab = ref('product');
const commandOpen = ref(false);
const activeLayer = ref('dialog');
const selectedPrimitive = ref('combobox');
const releaseDate = ref('2026-06-18');
const tokenStack = ref(['headless', 'forms', 'blocks']);
const density = ref('comfortable');
const radius = ref(12);
const motion = ref(true);
const { toasts, success, normal, dismiss } = useToasts({ duration: 3200 });

const heroTabs = [
	{ key: 'product', label: 'Product' },
	{ key: 'forms', label: 'Forms' },
	{ key: 'headless', label: 'Headless' },
];

const workspaceNav = [
	{ label: 'Components', value: '48+', tone: 'bg-emerald-500' },
	{ label: 'Blocks', value: '6', tone: 'bg-sky-500' },
	{ label: 'Forms', value: '18', tone: 'bg-amber-500' },
	{ label: 'Mobile', value: '6', tone: 'bg-rose-500' },
];

const metrics = [
	{ label: 'Primitives', value: '48+', detail: 'documented, linked, inspectable' },
	{ label: 'UI layers', value: '3', detail: 'headless, Vue, blocks' },
	{ label: 'Agent context', value: 'llms.txt', detail: 'source-aware generation' },
];

const dropdownItems = [
	{ label: 'Open docs', value: 'docs' },
	{ label: 'Copy import', value: 'copy' },
	{ separator: true },
	{ label: 'View source', value: 'source' },
];

const primitiveOptions = [
	{ label: 'Combobox', value: 'combobox' },
	{ label: 'Dialog', value: 'dialog' },
	{ label: 'Tree view', value: 'tree-view' },
	{ label: 'Command palette', value: 'command-palette' },
	{ label: 'Toast stack', value: 'toast-stack' },
];

const tagOptions = [
	{ label: 'headless', value: 'headless', group: 'Core' },
	{ label: 'forms', value: 'forms', group: 'Core' },
	{ label: 'blocks', value: 'blocks', group: 'Patterns' },
	{ label: 'mobile', value: 'mobile', group: 'Patterns' },
	{ label: 'theming', value: 'theming', group: 'Tooling' },
	{ label: 'studio', value: 'studio', group: 'Tooling' },
];

const densityOptions = [
	{ label: 'Compact', value: 'compact' },
	{ label: 'Comfortable', value: 'comfortable' },
	{ label: 'Spacious', value: 'spacious' },
];

const treeItems = [
	{
		id: 'workflow',
		label: 'Launch workflow',
		open: true,
		children: [
			{ id: 'toolbar', label: 'Toolbar' },
			{ id: 'dialog', label: 'Invite dialog' },
			{ id: 'form', label: 'Schema form' },
			{ id: 'toast', label: 'Toast feedback' },
		],
	},
	{
		id: 'components',
		label: 'Component stack',
		open: true,
		children: [
			{ id: 'combobox', label: 'Combobox' },
			{ id: 'calendar', label: 'Calendar' },
			{ id: 'popover', label: 'Popover' },
			{ id: 'tabs', label: 'Tabs' },
		],
	},
];

const codeLines = [
	"import { DomDialog, DomForm } from '@getdom/studio/vue';",
	"import '@getdom/studio/headless';",
	"import '@getdom/studio/style.css';",
	'',
	'<DomDialog title="Invite teammate">',
	'	<DomForm :schema="inviteSchema" />',
	'</DomDialog>',
];

const libraryGroups = [
	{
		title: 'Application components',
		description: 'Menus, drawers, dialogs, command palettes, splitters, trees, tabs, toasts, and popovers for product surfaces.',
		to: '/components/button',
		accent: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
		items: ['Command palette', 'Tree view', 'Splitter panel', 'Context menu', 'Toast', 'Dialog'],
	},
	{
		title: 'Form system',
		description: 'Fields, schema adapters, date pickers, class editors, tag inputs, validation, and generated form layouts.',
		to: '/forms',
		accent: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
		items: ['Form', 'Field', 'Date picker', 'Tag combobox', 'JSON input', 'Range input'],
	},
	{
		title: 'Headless elements',
		description: 'Framework-neutral custom elements for teams that want behavior, ARIA, and focus management without style lock-in.',
		to: '/headless',
		accent: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
		items: ['Dropdown', 'Popover', 'Dialog', 'Tabs', 'Tooltip', 'Combobox'],
	},
	{
		title: 'Blocks and mobile',
		description: 'Production-shaped dashboards, chat, mail, login, mobile shells, safe areas, action sheets, and app navigation.',
		to: '/blocks/dashboard',
		accent: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300',
		items: ['Dashboard', 'Chat', 'Mail', 'Login', 'App shell', 'Bottom nav'],
	},
];

const componentCloud = [
	{ name: 'Button', tag: 'DomButton', to: '/components/button' },
	{ name: 'Menu', tag: 'DomMenu', to: '/components/menu' },
	{ name: 'Dropdown', tag: 'DomDropdown', to: '/components/dropdown' },
	{ name: 'Dialog', tag: 'DomDialog', to: '/components/dialog' },
	{ name: 'Drawer', tag: 'DomDrawer', to: '/components/drawer' },
	{ name: 'Popover', tag: 'DomPopover', to: '/components/popover' },
	{ name: 'Tabs', tag: 'DomTabs', to: '/components/tabs' },
	{ name: 'Toast', tag: 'DomToastStack', to: '/components/toast' },
	{ name: 'Tree view', tag: 'DomTreeView', to: '/components/tree-view' },
	{ name: 'Command palette', tag: 'DomCommandPalette', to: '/components/command-palette' },
	{ name: 'Context menu', tag: 'DomContextMenu', to: '/components/context-menu' },
	{ name: 'Splitter panel', tag: 'DomSplitterPanel', to: '/components/splitter-panel' },
	{ name: 'Form', tag: 'DomForm', to: '/forms/form' },
	{ name: 'Field', tag: 'DomField', to: '/forms/field' },
	{ name: 'Combobox', tag: 'DomCombobox', to: '/forms/combobox' },
	{ name: 'Tag combobox', tag: 'DomTagCombobox', to: '/forms/tag-combobox' },
	{ name: 'Date picker', tag: 'DomDatePicker', to: '/forms/date-picker' },
	{ name: 'Calendar', tag: 'DomCalendar', to: '/forms/calendar' },
	{ name: 'Code input', tag: 'DomCodeInput', to: '/forms/code-input' },
	{ name: 'Class toggle', tag: 'DomClassToggleInput', to: '/forms/class-toggle-input' },
	{ name: 'App shell', tag: 'DomAppShell', to: '/mobile/shell' },
	{ name: 'Action sheet', tag: 'DomActionSheet', to: '/mobile/action-sheet' },
	{ name: 'Card', tag: 'DomCard', to: '/visual/card' },
	{ name: 'Renderer', tag: 'DomRenderer', to: '/components/playground' },
];

const accordionItems = [
	{ title: 'What makes it different?', content: 'The same component contracts feed docs, Vue props, web components, inspector metadata, and LLM-facing guidance.' },
	{ title: 'Can I use it outside Vue?', content: 'Yes. The headless layer registers framework-neutral custom elements for core interactions.' },
	{ title: 'Is this only primitives?', content: 'No. DOM Studio includes blocks for dashboard, chat, mail, forms, login, application layouts, and mobile shells.' },
];

const commands = [
	{ label: 'Browse components', value: '/components/button', description: 'Open the component docs.' },
	{ label: 'Explore form system', value: '/forms', description: 'See schema-driven fields and inputs.' },
	{ label: 'Open block library', value: '/blocks/dashboard', description: 'Preview product-shaped screens.' },
	{ label: 'Show toast demo', value: 'toast', description: 'Trigger a live toast from the homepage.' },
];

onMounted(() => {
	isMounted.value = true;
});

function showBuildToast() {
	success('Blueprint saved', {
		description: 'Dialog, form, toast, and headless behavior are wired together.',
	});
}

function runCommand({ value }) {
	if (typeof value === 'string' && value.startsWith('/')) {
		router.push(value);
		return;
	}
	normal('Command handled', {
		description: 'The command palette, shortcut listener, and toast stack are active.',
	});
}
</script>

<template>
	<DomStudioLayout>
		<div class="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-background">
			<section class="border-b border-border">
				<div class="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
					<div class="max-w-4xl">
						<div class="flex flex-wrap items-center gap-3 text-sm font-medium text-muted-foreground">
							<BrandMark class="size-12 text-foreground" title="DOM Studio" />
							<span class="text-base font-semibold text-foreground">DOM Studio</span>
							<span class="rounded-full border border-border bg-secondary px-3 py-1">Source-owned UI system</span>
						</div>
						<h1 class="mt-6 max-w-5xl text-4xl font-bold leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
							Build real app UI from primitives that already know the hard parts.
						</h1>
						<p class="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
							Headless web components, polished Vue wrappers, app blocks, form schemas, mobile shells, Studio metadata, and LLM-ready docs in one source-owned library.
						</p>
						<div class="mt-8 flex flex-wrap items-center gap-3">
							<DomButton as="router-link" to="/components/button" size="lg">Browse the library</DomButton>
							<DomButton as="router-link" to="/blocks/dashboard" variant="secondary" size="lg">See blocks</DomButton>
							<DomTooltip text="Open a live command palette from this page" placement="bottom">
								<DomButton variant="ghost" size="lg" @click="commandOpen = true">Open command palette</DomButton>
							</DomTooltip>
						</div>
					</div>

					<div class="mt-10 overflow-hidden rounded-[1.75rem] border border-border bg-card text-card-foreground shadow-2xl shadow-black/10">
						<div class="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/45 px-4 py-3">
							<div class="flex min-w-0 items-center gap-3">
								<div class="flex items-center gap-1.5" aria-hidden="true">
									<span class="size-2.5 rounded-full bg-rose-400"></span>
									<span class="size-2.5 rounded-full bg-amber-400"></span>
									<span class="size-2.5 rounded-full bg-emerald-400"></span>
								</div>
								<p class="truncate text-sm font-semibold text-foreground">Studio workspace / launch-flow.vue</p>
							</div>
							<div class="flex items-center gap-2">
								<DomDropdown :items="dropdownItems" align="right" label="Docs" width="min-w-48" />
								<DomButton size="sm" @click="showBuildToast">Save blueprint</DomButton>
							</div>
						</div>

						<div class="grid min-h-[34rem] lg:grid-cols-[15rem_minmax(0,1fr)_18rem]">
							<aside class="border-b border-border bg-background/80 p-4 lg:border-b-0 lg:border-r">
								<div class="flex items-center justify-between">
									<p class="text-sm font-semibold text-foreground">Library map</p>
									<span class="rounded-full bg-success/15 px-2 py-1 text-xs font-medium text-success">live</span>
								</div>
								<nav class="mt-4 grid gap-2">
									<RouterLink
										v-for="item in workspaceNav"
										:key="item.label"
										to="/components/button"
										class="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
									>
										<span class="flex min-w-0 items-center gap-2">
											<span class="size-2 rounded-full" :class="item.tone"></span>
											<span class="truncate">{{ item.label }}</span>
										</span>
										<span class="font-mono text-xs">{{ item.value }}</span>
									</RouterLink>
								</nav>
								<div class="mt-6 rounded-2xl border border-border bg-secondary/40 p-3">
									<p class="text-xs font-medium text-muted-foreground">Agent context</p>
									<p class="mt-2 text-sm font-semibold text-foreground">Props, examples, slots, events, keyboard behavior, and source paths stay attached.</p>
								</div>
							</aside>

							<section class="min-w-0 border-b border-border p-4 lg:border-b-0 lg:border-r">
								<DomTabs v-model="showcaseTab" :tabs="heroTabs">
									<template #product>
										<div class="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
											<div class="overflow-hidden rounded-2xl border border-border bg-background">
												<div class="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
													<div>
														<p class="text-sm font-semibold text-foreground">Revenue operations</p>
														<p class="mt-1 text-sm text-muted-foreground">A block-level dashboard built from the same primitives.</p>
													</div>
													<DomPopover label="Inspect" position="bottom-end" width="w-72">
														<p class="font-semibold text-foreground">Inspector metadata</p>
														<p class="mt-2 text-sm leading-6 text-muted-foreground">Every visible primitive can expose prop controls, slots, examples, and source hints.</p>
													</DomPopover>
												</div>
												<div class="grid grid-cols-3 divide-x divide-border border-b border-border">
													<div v-for="metric in metrics" :key="metric.label" class="min-h-28 p-4">
														<p class="text-xs text-muted-foreground">{{ metric.label }}</p>
														<p class="mt-2 text-xl font-semibold text-foreground">{{ metric.value }}</p>
														<p class="mt-1 text-xs leading-5 text-muted-foreground">{{ metric.detail }}</p>
													</div>
												</div>
												<div class="grid h-48 grid-cols-12 items-end gap-2 p-4">
													<span v-for="height in [34, 48, 42, 76, 66, 88, 80, 104, 92, 118, 128, 144]" :key="height" class="rounded-t-lg bg-primary/80" :style="{ height: `${height}px` }"></span>
												</div>
											</div>

											<div class="grid gap-4">
												<div class="rounded-2xl border border-border bg-background p-4">
													<div class="flex items-start justify-between gap-3">
														<div>
															<p class="text-sm font-semibold text-foreground">Interaction stack</p>
															<p class="mt-1 text-sm text-muted-foreground">Menu, popover, tabs, toast, and links are active here.</p>
														</div>
														<span class="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">wired</span>
													</div>
													<div class="mt-4 flex flex-wrap gap-2">
														<DomButton size="sm" @click="commandOpen = true">Commands</DomButton>
														<DomButton size="sm" variant="secondary" @click="showBuildToast">Toast</DomButton>
														<DomButton as="router-link" to="/components/dialog" size="sm" variant="secondary">Dialog docs</DomButton>
													</div>
												</div>
												<div class="rounded-2xl border border-border bg-background p-4">
													<p class="text-sm font-semibold text-foreground">Component mix</p>
													<div class="mt-4 grid gap-2">
														<div v-for="name in ['DomTreeView', 'DomTabs', 'DomPopover', 'DomToastStack']" :key="name" class="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 text-sm">
															<span class="font-mono text-xs text-muted-foreground">{{ name }}</span>
															<span class="size-2 rounded-full bg-success"></span>
														</div>
													</div>
												</div>
											</div>
										</div>
									</template>

									<template #forms>
										<div class="grid gap-4 xl:grid-cols-2">
											<div class="rounded-2xl border border-border bg-background p-4">
												<p class="text-sm font-semibold text-foreground">Schema-ready form controls</p>
												<div class="mt-4 grid gap-4">
													<DomTagCombobox v-model="tokenStack" :options="tagOptions" label="Component stack" clearable />
													<DomCombobox v-model="selectedPrimitive" :options="primitiveOptions" label="Primary primitive" />
													<DomDatePicker v-model="releaseDate" label="Release date" />
												</div>
											</div>
											<div class="rounded-2xl border border-border bg-background p-4">
												<p class="text-sm font-semibold text-foreground">Theme controls</p>
												<div class="mt-4 grid gap-4">
													<DomRadioGroup v-model="density" :options="densityOptions" label="Density" orientation="horizontal" />
													<DomRangeInput v-model="radius" label="Radius" :min="4" :max="24" suffix="px" />
													<DomToggle v-model="motion" label="Enable motion" />
												</div>
											</div>
										</div>
									</template>

									<template #headless>
										<div class="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
											<div class="rounded-2xl border border-border bg-background p-4">
												<p class="text-sm font-semibold text-foreground">Layer tree</p>
												<DomTreeView
													v-model="activeLayer"
													:items="treeItems"
													:open-values="['workflow', 'components']"
													class="mt-4"
													label="Homepage layer tree"
													variant="finder"
												/>
											</div>
											<div class="overflow-hidden rounded-2xl border border-border bg-[#0b0f14] text-slate-100">
												<div class="border-b border-white/10 px-4 py-3 text-sm font-semibold">source-first usage</div>
												<pre class="overflow-x-auto p-4 text-sm leading-7"><code v-for="line in codeLines" :key="line" class="block">{{ line || ' ' }}</code></pre>
											</div>
										</div>
									</template>
								</DomTabs>
							</section>

							<aside class="bg-background/80 p-4">
								<p class="text-sm font-semibold text-foreground">Inspector</p>
								<div class="mt-4 grid gap-4">
									<DomCombobox v-model="selectedPrimitive" :options="primitiveOptions" label="Primitive" />
									<DomRangeInput v-model="radius" label="Radius" :min="4" :max="24" suffix="px" />
									<DomToggle v-model="motion" label="Motion" />
								</div>
								<div class="mt-6 rounded-2xl border border-border bg-secondary/35 p-4">
									<p class="text-sm font-semibold text-foreground">Selected layer</p>
									<p class="mt-2 font-mono text-xs text-muted-foreground">{{ activeLayer }}</p>
									<p class="mt-3 text-sm leading-6 text-muted-foreground">Tree state, props, and generated markup are connected instead of hidden in docs prose.</p>
								</div>
							</aside>
						</div>
					</div>
				</div>
			</section>

			<section class="border-b border-border bg-secondary/25">
				<div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
					<div class="flex flex-wrap items-end justify-between gap-6">
						<div class="max-w-3xl">
							<p class="text-sm font-semibold text-muted-foreground">More than a component shelf</p>
							<h2 class="mt-2 text-3xl font-bold leading-tight text-foreground sm:text-4xl">The library covers the product surfaces teams actually ship.</h2>
						</div>
						<DomButton as="router-link" to="/components/playground" variant="secondary">Open playground</DomButton>
					</div>

					<div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
						<RouterLink
							v-for="group in libraryGroups"
							:key="group.title"
							:to="group.to"
							class="group flex min-h-80 flex-col rounded-2xl border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-xl"
						>
							<span class="w-fit rounded-full border px-3 py-1 text-xs font-semibold" :class="group.accent">{{ group.title }}</span>
							<p class="mt-5 text-sm leading-6 text-muted-foreground">{{ group.description }}</p>
							<div class="mt-auto grid gap-2 pt-6">
								<span v-for="item in group.items" :key="item" class="rounded-xl bg-secondary/60 px-3 py-2 text-sm font-medium text-foreground">{{ item }}</span>
							</div>
						</RouterLink>
					</div>
				</div>
			</section>

			<section class="border-b border-border bg-background">
				<div class="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
					<div>
						<p class="text-sm font-semibold text-muted-foreground">Try the pieces together</p>
						<h2 class="mt-2 text-3xl font-bold leading-tight text-foreground sm:text-4xl">A homepage should prove the kit works.</h2>
						<p class="mt-4 text-base leading-8 text-muted-foreground">
							This page is using the actual primitives: command palette, toast stack, dropdown, popover, tabs, tree view, combobox, tag combobox, radio group, range input, toggle, date picker, tooltip, and accordion.
						</p>
						<div class="mt-6 flex flex-wrap gap-3">
							<DomButton @click="showBuildToast">Trigger toast</DomButton>
							<DomButton variant="secondary" @click="commandOpen = true">Open commands</DomButton>
							<DomButton as="router-link" to="/ai" variant="secondary">AI builder guide</DomButton>
						</div>
					</div>

					<div class="grid gap-4 md:grid-cols-2">
						<div class="rounded-2xl border border-border bg-card p-5">
							<p class="text-sm font-semibold text-foreground">Answers without leaving the page</p>
							<div class="mt-4">
								<DomAccordion :items="accordionItems" />
							</div>
						</div>
						<div class="rounded-2xl border border-border bg-card p-5">
							<p class="text-sm font-semibold text-foreground">Source path</p>
							<div class="mt-4 overflow-hidden rounded-2xl border border-border bg-[#0b0f14]">
								<pre class="overflow-x-auto p-4 text-sm leading-7 text-slate-100"><code v-for="line in codeLines.slice(0, 3)" :key="line" class="block">{{ line }}</code></pre>
							</div>
							<p class="mt-4 text-sm leading-6 text-muted-foreground">Installable source, examples, and metadata stay close enough for people and agents to edit confidently.</p>
						</div>
					</div>
				</div>
			</section>

			<section class="bg-background">
				<div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
					<div class="flex flex-wrap items-end justify-between gap-6">
						<div>
							<p class="text-sm font-semibold text-muted-foreground">Library wall</p>
							<h2 class="mt-2 text-3xl font-bold leading-tight text-foreground sm:text-4xl">Start anywhere, then keep going.</h2>
						</div>
						<DomButton as="router-link" to="/pricing" size="lg">Get source access</DomButton>
					</div>
					<div class="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<RouterLink
							v-for="component in componentCloud"
							:key="component.tag"
							:to="component.to"
							class="group flex min-h-24 flex-col justify-between rounded-xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
						>
							<span class="text-sm font-semibold text-foreground">{{ component.name }}</span>
							<span class="mt-3 flex items-center justify-between gap-3">
								<code class="truncate text-xs text-muted-foreground">&lt;{{ component.tag }}&gt;</code>
								<span class="shrink-0 text-sm text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground">-&gt;</span>
							</span>
						</RouterLink>
					</div>
				</div>
			</section>
		</div>

		<template v-if="isMounted">
			<DomCommandPalette v-model="commandOpen" :commands="commands" @select="runCommand" />
			<DomToastStack :toasts="toasts" position="bottom-right" @dismiss="dismiss" />
		</template>
	</DomStudioLayout>
</template>
