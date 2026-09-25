<script setup>
import { defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import DomStudioLayout from './_layout/DomStudioLayout.vue';
import HomeAnalytics from './_home/HomeAnalytics.vue';
import HomeDemoState from './_home/HomeDemoState.vue';
import { DomButton, DomCodeBlock, DomCombobox, DomDatePicker, DomRangeInput, DomStatusPill, DomTabs, DomTagCombobox, DomToastStack, DomToggle, useToasts } from './lib/vue';

const showcase = ref('analytics');
const visitedDemos = ref(new Set(['analytics']));
const mounted = ref(false);
const commandOpen = ref(false);
const commandReady = ref(false);
const router = useRouter();
const { toasts, success, dismiss } = useToasts({ duration: 3500 });
const projectType = ref('dashboard');
const launchDate = ref('2026-10-01');
const stack = ref(['vue', 'tailwind']);
const radius = ref(16);
const notifications = ref(true);
const themeColor = ref('var(--chart-1)');
const themeColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];
const colorNames = ['Blue', 'Teal', 'Amber', 'Violet'];
const projectOptions = [{ label: 'SaaS dashboard', value: 'dashboard' }, { label: 'AI workspace', value: 'ai' }, { label: 'Customer portal', value: 'portal' }];
const stackOptions = [{ label: 'Vue 3', value: 'vue' }, { label: 'Tailwind CSS', value: 'tailwind' }, { label: 'Web Components', value: 'headless' }];
const demos = [
	{ key: 'analytics', label: 'Analytics', title: 'Your next dashboard starts here.', description: 'Interactive charts, metrics, legends, and accessible data tables.', to: '/charts', link: 'Explore charts', tags: ['Area chart', 'Donut chart', 'Metric card'] },
	{ key: 'workspace', label: 'Data workspace', title: 'Rich cards. Serious data.', description: 'Move media-rich project cards, then explore a customer grid with filters, sorting, and selection.', to: '/data/kanban', link: 'Explore data views', tags: ['Rich media Kanban', 'Customer data grid', 'Filters & selection'] },
	{ key: 'ai', label: 'AI conversations', title: 'Give your agent a proper interface.', description: 'Conversations, messages, and tool results. Local simulated responses; no AI account needed.', to: '/data/agent-chat', link: 'Explore agent chat', tags: ['Agent chat', 'Conversations', 'Tool results'] },
	{ key: 'designer', label: 'Visual designer', title: 'Your ideas. In full colour.', description: 'Design a poster with real HTML. Drag a layer to see alignment guides; try spacing, zoom, and undo.', to: '/designer/poster', link: 'Open full Poster Studio', tags: ['Poster Studio · Beta', 'Snap guides', 'Layers & properties'] },
	{ key: 'mobile', label: 'Mobile apps', title: 'Small screen. Complete experience.', description: 'Explore nested settings, edit a profile, and try the switches.', to: '/mobile/stack', link: 'Explore mobile', tags: ['App shell', 'Navigation stack', 'Settings screens'] },
];
const components = {
	workspace: lazyDemo(loadWorkspace),
	ai: lazyDemo(loadAgentChat),
	designer: lazyDemo(loadDesigner),
	mobile: lazyDemo(loadMobile),
};
const CommandPalette = lazyDemo(loadCommands);
const commands = [
	{ label: 'Explore the charts', value: '/charts', description: 'Charts, sparklines, metrics, and date ranges.' },
	{ label: 'Build a data workspace', value: '/data', description: 'Grids, Kanban, calendars, and scheduling.' },
	{ label: 'Try the visual designer', value: '/designer', description: 'HTML stages, layers, and property controls.' },
	{ label: 'Browse application blocks', value: '/blocks', description: 'Start with a complete product screen.' },
];
const foundations = [
	{ number: '01', title: 'Start with the whole screen.', text: 'Dashboards, inboxes, billing, and operations. Copy a working block, then make it yours.', to: '/blocks', link: 'Browse app blocks' },
	{ number: '02', title: 'Go as deep as you need.', text: 'Polished Vue components on framework-neutral headless elements. Keep control of the markup, state, and styling.', to: '/headless', link: 'Meet the foundations' },
	{ number: '03', title: 'Give your AI the same toolkit.', text: 'Component contracts, examples, and agent guidance help people and coding assistants build from the same pieces.', to: '/ai/builders', link: 'Build with AI' },
];
const installCode = "import { DomButton, DomCard } from '@getdom/studio/vue';\nimport '@getdom/studio/style.css';";

/** @param {() => Promise<object>} loader Demo import. @returns {object} Deferred Vue component with loading and failure feedback. */
function lazyDemo(loader) {
	return defineAsyncComponent({ loader, loadingComponent: HomeDemoState, errorComponent: HomeDemoState, delay: 150, timeout: 30000 });
}

/** @returns {Promise<object>} Rich media board and detailed customer-grid examples. */
function loadWorkspace() { return import('./_home/HomeWorkspace.vue'); }
/** @returns {Promise<object>} Agent conversation example using its local mock API. */
function loadAgentChat() { return import('./_home/HomeAgentChat.vue'); }
/** @returns {Promise<object>} Embedded Poster Studio with its complete editing controls. */
function loadDesigner() { return import('./_home/HomeDesigner.vue'); }
/** @returns {Promise<object>} Nested mobile settings example. */
function loadMobile() { return import('./mobile/examples/SettingsStack.vue'); }
/** @returns {Promise<object>} Command palette, loaded only on first interaction. */
function loadCommands() { return import('./components/command-palette/DomCommandPalette.vue'); }

/** @param {string} key Selected showcase key. @returns {void} Keeps visited demos mounted so edits survive tab changes. */
function retainDemo(key) { visitedDemos.value.add(key); }

/** Enables client-only overlays after hydration. @returns {void} */
function markMounted() { mounted.value = true; }
/** @param {boolean} open Whether the command palette is opening. @returns {void} */
function prepareCommands(open) { if (open) commandReady.value = true; }
/** Shows explicit local-demo feedback; no project or account is created. @returns {void} */
function previewProject() {
	success('Your project is taking shape.', { description: 'Demo settings updated. Explore the form docs to use these controls in your app.' });
}
/** Demonstrates the shared toast stack without persisting data. @returns {void} */
function showToast() { success('That’s a DOM Studio toast.', { description: 'A little feedback, right when you need it.' }); }
/** @param {{ value: string }} command Selected documentation destination. @returns {void} */
function runCommand(command) { router.push(command.value); }

onMounted(markMounted);
watch(commandOpen, prepareCommands);
watch(showcase, retainDemo);
</script>

<template>
	<DomStudioLayout>
		<div class="relative left-1/2 w-screen -translate-x-1/2 overflow-x-clip bg-canvas text-canvas-fg">
			<section class="mx-auto max-w-[1320px] px-5 pb-16 pt-2 sm:px-8">
				<div class="mx-auto max-w-4xl text-center">
					<p class="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-fg">
						<span class="size-1.5 rounded-full bg-success" aria-hidden="true"></span> Vue 3 · Web Components · Tailwind CSS</p>
					<h1 class="mt-5 text-[clamp(2.8rem,6vw,5rem)] font-semibold leading-[1.04] tracking-[-0.065em]">Ambitious apps.<br />
						<span class="text-muted-fg">Beautifully built.</span>
					</h1>
					<p class="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-fg sm:text-lg">A Vue UI library for the good stuff: rich data views, AI conversations, visual editors, and mobile experiences. All yours to shape.</p>
					<div class="mt-5 flex flex-wrap justify-center gap-3">
						<DomButton as="router-link" to="/install" size="lg">Start building <span aria-hidden="true">↗</span>
						</DomButton>
						<DomButton as="a" href="#showcase" size="lg" variant="secondary">Try the components <span aria-hidden="true">↓</span>
						</DomButton>
					</div>
				</div>

				<div id="showcase" class="mt-9 scroll-mt-24 sm:mt-10">
					<div class="mb-4 flex items-center justify-between gap-4 text-xs text-muted-fg">
						<span class="font-mono uppercase tracking-[0.18em]">The library, in action</span>
						<span class="hidden sm:inline">Real components. Go ahead, interact.</span>
					</div>
					<DomTabs v-model="showcase" :tabs="demos" variant="flat">
						<template v-for="demo in demos" :key="demo.key" #[demo.key]>
							<div class="overflow-hidden rounded-2xl border border-border bg-secondary/25 shadow-xl shadow-canvas-fg/5 sm:rounded-3xl">
								<div class="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-canvas px-5 py-5 sm:px-7">
									<div>
										<h2 class="text-lg font-semibold tracking-tight sm:text-xl">{{ demo.title }}</h2>
										<p class="mt-1 text-sm text-muted-fg">{{ demo.description }}</p>
									</div>
									<DomButton as="router-link" :to="demo.to" variant="secondary" size="sm">{{ demo.link }} <span aria-hidden="true">↗</span>
									</DomButton>
								</div>
								<div v-if="visitedDemos.has(demo.key)" class="p-3 sm:p-6">
									<HomeAnalytics v-if="demo.key === 'analytics'" />
									<div v-else :class="demo.key === 'mobile' ? 'mx-auto max-w-md overflow-hidden rounded-3xl border border-border bg-canvas' : 'max-h-[42rem] overflow-auto rounded-xl'">
										<component :is="components[demo.key]" :height="demo.key === 'mobile' ? '38rem' : undefined" />
									</div>
								</div>
								<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-canvas px-5 py-3 text-xs text-muted-fg sm:px-7">
									<span>{{ demo.tags.join(' / ') }}</span>
									<span class="flex items-center gap-1.5">
										<span class="size-1.5 rounded-full bg-success" aria-hidden="true"></span> Interactive demo · Sample data</span>
								</div>
							</div>
						</template>
					</DomTabs>
				</div>
				<div class="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs font-medium text-muted-fg sm:text-sm">
					<span>Inspectable source</span>
					<span>Light & dark themes</span>
					<span>Keyboard interactions</span>
					<span>Made for people & coding agents</span>
				</div>
			</section>

			<section class="border-y border-border bg-secondary/20">
				<div class="mx-auto max-w-[1320px] px-5 py-16 sm:px-8 lg:py-24">
					<div class="mb-9 flex flex-wrap items-end justify-between gap-5">
						<div>
							<p class="font-mono text-xs uppercase tracking-[0.18em] text-muted-fg">Small details. Big difference.</p>
							<h2 class="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Even the everyday feels considered.</h2>
						</div>
						<RouterLink to="/components" class="text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-current">Explore all components ↗</RouterLink>
					</div>
					<div class="grid gap-5 lg:grid-cols-3">
						<article class="flex flex-col rounded-2xl border border-border bg-canvas p-6">
							<p class="text-xs font-medium text-muted-fg">01 / FORM CONTROLS</p>
							<h3 class="mt-3 text-xl font-semibold tracking-tight">A better starting point.</h3>
							<p class="mt-2 text-sm leading-6 text-muted-fg">Searchable choices, multi-select tags, and dates that don’t get in the way.</p>
							<form class="my-7 space-y-4" @submit.prevent="previewProject">
								<DomCombobox v-model="projectType" :options="projectOptions" label="What are you building?" />
								<DomTagCombobox v-model="stack" :options="stackOptions" label="Your stack" />
								<DomDatePicker v-model="launchDate" label="Launch date" />
								<DomButton type="submit" class="w-full">Preview project <span aria-hidden="true">↗</span>
								</DomButton>
							</form>
							<RouterLink to="/forms" class="mt-auto text-sm font-medium">Explore forms <span aria-hidden="true">→</span>
							</RouterLink>
						</article>
						<article class="flex flex-col rounded-2xl border border-border bg-canvas p-6">
							<p class="text-xs font-medium text-muted-fg">02 / INTERACTIONS</p>
							<h3 class="mt-3 text-xl font-semibold tracking-tight">The finishing touches, finished.</h3>
							<p class="mt-2 text-sm leading-6 text-muted-fg">Commands, feedback, and controls that make an app feel like a product.</p>
							<div class="my-7 flex flex-1 flex-col justify-center gap-5 rounded-xl border border-border bg-secondary/25 p-5">
								<DomButton variant="secondary" class="justify-between" @click="commandOpen = true">Find your next component <span aria-hidden="true">⌕</span>
								</DomButton>
								<div class="flex flex-wrap gap-2">
									<DomStatusPill label="Published" tone="success" />
									<DomStatusPill label="In review" tone="warning" />
									<DomStatusPill label="Draft" />
								</div>
								<div class="flex items-center justify-between gap-3 border-y border-border py-4">
									<span class="text-sm">Stay in the loop</span>
									<DomToggle v-model="notifications" label="Notifications" />
								</div>
								<DomButton variant="secondary" @click="showToast">Try a toast notification ↗</DomButton>
							</div>
							<RouterLink to="/components/command-palette" class="mt-auto text-sm font-medium">Explore interactions <span aria-hidden="true">→</span>
							</RouterLink>
						</article>
						<article class="flex flex-col rounded-2xl border border-border bg-canvas p-6">
							<p class="text-xs font-medium text-muted-fg">03 / YOUR DESIGN LANGUAGE</p>
							<h3 class="mt-3 text-xl font-semibold tracking-tight">Looks like you. Works like DOM.</h3>
							<p class="mt-2 text-sm leading-6 text-muted-fg">Semantic tokens and editable styles. Turn a shared foundation into your own identity.</p>
							<div class="my-7 flex flex-1 flex-col justify-center gap-5">
								<div class="border border-border bg-secondary/30 p-5 transition-[border-radius] motion-reduce:transition-none" :style="{ borderRadius: `${radius}px` }">
									<div class="mb-4 flex items-center gap-3">
										<span class="grid size-10 place-items-center text-xl text-canvas" :style="{ background: themeColor, borderRadius: `${radius / 2}px` }" aria-hidden="true">✳</span>
										<div>
											<p class="text-sm font-semibold">Make room for your ideas.</p>
											<p class="mt-1 text-xs text-muted-fg">Your next great product</p>
										</div>
									</div>
									<div class="h-2 w-full rounded-full bg-secondary">
										<div class="h-full w-3/4 rounded-full" :style="{ background: themeColor }">
										</div>
									</div>
								</div>
								<div class="flex gap-2" role="group" aria-label="Preview accent colour">
									<button v-for="(color, index) in themeColors" :key="color" type="button" :aria-label="colorNames[index]" :aria-pressed="themeColor === color" class="grid size-9 place-items-center rounded-full border-4 border-canvas outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring" :class="themeColor === color && 'outline-1 outline-border'" :style="{ background: color }" @click="themeColor = color">
										<span v-if="themeColor === color" class="text-canvas" aria-hidden="true">✓</span>
									</button>
								</div>
								<DomRangeInput v-model="radius" label="Corner radius" :min="0" :max="28" suffix="px" />
							</div>
							<RouterLink to="/theming" class="mt-auto text-sm font-medium">Explore theming <span aria-hidden="true">→</span>
							</RouterLink>
						</article>
					</div>
				</div>
			</section>

			<section class="mx-auto max-w-[1320px] px-5 py-16 sm:px-8 lg:py-24">
				<div class="grid min-w-0 grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
					<div class="min-w-0">
						<p class="font-mono text-xs uppercase tracking-[0.18em] text-muted-fg">One system. Your possibilities.</p>
						<h2 class="mt-4 text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">From the first button<br />to the big picture.</h2>
						<p class="mt-5 max-w-md text-base leading-7 text-muted-fg">Build with the pieces. Start from a complete screen. Let your coding agent help. The result is still code you can understand and change.</p>
						<DomCodeBlock :code="installCode" lang="js" filename="app.js" class="mt-7 min-w-0" />
					</div>
					<div class="divide-y divide-border">
						<article v-for="item in foundations" :key="item.number" class="flex gap-5 py-6 first:pt-0">
							<span class="pt-1 font-mono text-xs text-muted-fg">{{ item.number }}</span>
							<div>
								<h3 class="text-xl font-semibold tracking-tight">{{ item.title }}</h3>
								<p class="mt-2 text-sm leading-7 text-muted-fg">{{ item.text }}</p>
								<RouterLink :to="item.to" class="mt-4 inline-block text-sm font-medium">{{ item.link }} ↗</RouterLink>
							</div>
						</article>
					</div>
				</div>
				<div class="mt-16 flex flex-wrap items-center justify-between gap-8 rounded-3xl bg-primary px-7 py-10 text-primary-fg sm:p-12">
					<div>
						<h2 class="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Make something worth using.</h2>
						<p class="mt-3 text-sm opacity-75">Explore locally. Choose a licence when you’re ready to ship.</p>
					</div>
					<div class="flex flex-wrap gap-3">
						<DomButton as="router-link" to="/install" variant="secondary" size="lg">Get started ↗</DomButton>
						<RouterLink to="/pricing" class="inline-flex items-center px-4 py-3 text-sm font-medium underline underline-offset-4">View licences</RouterLink>
					</div>
				</div>
			</section>
		</div>
		<template v-if="mounted">
			<CommandPalette v-if="commandReady" v-model="commandOpen" :commands="commands" shortcut="" @select="runCommand" />
			<DomToastStack :toasts="toasts" position="bottom-right" @dismiss="dismiss" />
		</template>
	</DomStudioLayout>
</template>
