<script setup>
import { RouterLink } from 'vue-router';
import DomStudioLayout from './_layout/DomStudioLayout.vue';
import { DomButton, DomDropdown, DomToggle, DomTooltip } from './lib/vue';

import DomDatePicker from './forms/date-picker/DomDatePicker.vue';
import { ref } from 'vue';

const toggle = ref(true);
const features = [
	{
		title: 'Headless web components',
		body: 'Behaviour ships as plain custom elements — <dom-dropdown>, <dom-dialog> — that work in any HTML, with no framework lock-in.',
	},
	{
		title: 'First-class Vue integration',
		body: 'A thin Vue layer wraps every primitive so you get reactive props, v-model, and slots — without re-implementing keyboard and ARIA.',
	},
	{
		title: 'AI-editable by design',
		body: 'Components carry docs, inspector hints, and Studio specs so generated apps can be inspected, edited, and improved after the first pass.',
	},
	{
		title: 'Accessibility, by default',
		body: 'WAI-ARIA roles, focus management, keyboard navigation, and screen-reader behaviour are part of every primitive.',
	},
	{
		title: 'Tree-shakeable, tiny',
		body: 'Import only what you need. Each headless module averages under 2kb gzipped — no runtime style framework.',
	},
	{
		title: 'Production-grade primitives',
		body: 'Dropdowns, dialogs, tabs, comboboxes, toggles, tooltips, accordions — all crafted to ship in real products.',
	},
];

const components = [
	{ name: 'Button', tag: 'dom-button', to: '/docs/components/button' },
	{ name: 'Menu', tag: 'dom-menu', to: '/docs/components/menu' },
	{ name: 'Listbox', tag: 'dom-listbox', to: '/docs/forms/listbox' },
	{ name: 'Dropdown', tag: 'dom-dropdown', to: '/docs/components/dropdown' },
	{ name: 'Dialog', tag: 'dom-dialog', to: '/docs/components/dialog' },
	{ name: 'Drawer', tag: 'dom-drawer', to: '/docs/components/drawer' },
	{ name: 'Tabs', tag: 'dom-tabs', to: '/docs/components/tabs' },
	{ name: 'Toggle', tag: 'dom-toggle', to: '/docs/forms/toggle' },
	{ name: 'Tooltip', tag: 'dom-tooltip', to: '/docs/components/tooltip' },
	{ name: 'Accordion', tag: 'dom-accordion', to: '/docs/components/accordion' },
	{ name: 'Combobox', tag: 'dom-combobox', to: '/docs/forms/combobox' },
	{ name: 'Autocomplete', tag: 'dom-autocomplete', to: '/docs/forms/autocomplete' },
	{ name: 'Tag combobox', tag: 'DomTagCombobox', to: '/docs/forms/tag-combobox' },
	{ name: 'Class toggle input', tag: 'DomClassToggleInput', to: '/docs/forms/class-toggle-input' },
	{ name: 'Toast', tag: 'dom-toast-region', to: '/docs/components/toast' },
	{ name: 'Command palette', tag: 'DomCommandPalette', to: '/docs/components/command-palette' },
];
</script>

<template>
	<DomStudioLayout>
		<section class="relative -mt-6 pb-20 pt-10">
			<div class="absolute inset-x-0 top-0 -z-10 mx-auto h-72 w-3/4 rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-3xl"></div>
			<div class="mx-auto max-w-3xl text-center">
				<p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">A component library worth owning</p>
				<h1 class="mt-4 text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
					Build high-end AI ready interfaces.
				</h1>
				<p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
					<strong class="text-foreground">DOM Studio</strong> is a professional component library: headless web component primitives, a polished Vue layer, and Tailwind CSS 4 styling. Designed for serious products.
				</p>
				<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
					<DomButton :as="'router-link'" :to="'/docs/components/button'" variant="primary" size="lg">Browse components</DomButton>
					<DomButton :as="'router-link'" :to="'/docs/ai'" variant="secondary" size="lg">AI builder guide</DomButton>
					<DomButton :as="'router-link'" :to="'/docs/theming'" variant="secondary" size="lg">View theming</DomButton>
					<DomButton :as="'router-link'" :to="'/docs/pricing'" variant="secondary" size="lg">See pricing →</DomButton>
				</div>
			</div>

			<div class="mx-auto mt-16 max-w-4xl rounded-3xl border border-border bg-secondary/40 p-8 shadow-xl shadow-black/[0.04] ring-1 ring-border/40">
				<div class="flex items-center justify-between border-b border-border pb-4 text-xs uppercase tracking-wider text-muted-foreground">
					<span>Live preview</span>
					<span>DOM Studio / playground</span>
				</div>
				<div class="grid grid-cols-1 items-center gap-8 py-8 sm:grid-cols-3">
					<div class="flex flex-col items-start gap-3">
						<span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Button</span>
						<DomButton variant="primary">Get started</DomButton>
					</div>
					<div class="flex flex-col items-start gap-3">
						<span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dropdown</span>
						<DomDropdown :items="[{ label: 'Profile', value: 'p' }, { label: 'Billing', value: 'b' }, { label: 'Sign out', value: 'o' }]" label="Account" />
					</div>
					<div class="flex flex-col items-start gap-3">
						<span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Toggle</span>
						<DomToggle v-model="toggle" label="Notifications" />
					</div>
					<div class="flex flex-col items-start gap-3">
						<DomDatePicker label="Appointment date" />
					</div>
				</div>
			</div>
		</section>

		<section class="border-t border-border py-20">
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				<div v-for="f in features" :key="f.title" class="rounded-2xl border border-border bg-background p-6">
					<h3 class="text-base font-semibold tracking-tight text-foreground">{{ f.title }}</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{{ f.body }}</p>
				</div>
			</div>
		</section>

		<section class="border-t border-border py-20">
			<div class="mb-10 flex items-end justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Library</p>
					<h2 class="mt-1 text-3xl font-bold tracking-tight text-foreground">Every primitive you need.</h2>
				</div>
				<RouterLink to="/docs/components/button" class="text-sm font-medium text-foreground hover:underline">Browse all →</RouterLink>
			</div>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<RouterLink
					v-for="c in components"
					:key="c.tag"
					:to="c.to"
					class="group flex items-center justify-between rounded-xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
				>
					<div>
						<p class="text-sm font-semibold tracking-tight text-foreground">{{ c.name }}</p>
						<code class="text-[11px] text-muted-foreground">&lt;{{ c.tag }}&gt;</code>
					</div>
					<span class="text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground">→</span>
				</RouterLink>
			</div>
		</section>

		<section class="border-t border-border py-20 text-center">
			<h2 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Ready to ship interfaces that feel right?</h2>
			<p class="mx-auto mt-3 max-w-xl text-muted-foreground">Pro adds blueprints, real app templates, and the components teams reach for first.</p>
			<div class="mt-6 flex items-center justify-center gap-3">
				<DomButton :as="'router-link'" :to="'/docs/pricing'" size="lg">Get access</DomButton>
				<DomTooltip text="Open-source primitives included" placement="bottom">
					<DomButton :as="'router-link'" :to="'/docs/components/button'" variant="ghost" size="lg">Try the free tier</DomButton>
				</DomTooltip>
			</div>
		</section>
	</DomStudioLayout>
</template>
