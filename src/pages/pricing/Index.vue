<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import CodeBlock from '../_layout/CodeBlock.vue';
import { domStudioSourceUrl } from '../_layout/docs/sourceLinks.js';
import { DomButton, DomAccordion } from '../lib/vue';
import { useBillingOffer } from '../../composable/useBillingOffer.js';
import { formatBillingPrice } from '../../../shared/billing.js';

const { hasIndividualPromotion, hasTeamPromotion, individual, individualPrice, team, teamPrice } = useBillingOffer();

const licences = computed(() => [
	{
		name: 'Individual',
		tagline: 'For one developer building their own products and client projects.',
		price: individualPrice.value,
		originalPrice: individual.value.originalPrice,
		hasPromotion: hasIndividualPromotion.value,
		offerLabel: individual.value.offerLabel,
		priceSuffix: 'Use forever · All v1 updates included',
		cta: 'Buy Individual licence',
		ctaTo: '/api/billing/checkout?licence=individual',
		ctaExternal: true,
		ctaVariant: 'primary',
		highlight: true,
		features: [
			'Commercial production use for one named developer',
			'Unlimited own products and bespoke client projects',
			'Copy, import, or vendor code into your products',
		],
	},
	{
		name: 'Team',
		tagline: 'For a company sharing one editable UI system across its team.',
		price: teamPrice.value,
		originalPrice: team.value.originalPrice,
		hasPromotion: hasTeamPromotion.value,
		offerLabel: team.value.offerLabel,
		priceSuffix: 'Use forever · All v1 updates included',
		cta: 'Buy Team licence',
		ctaTo: '/api/billing/checkout?licence=team',
		ctaExternal: true,
		ctaVariant: 'secondary',
		features: [
			'Commercial production use for one organisation',
			'Unlimited employees and contractors working on its behalf',
			'Unlimited company products and bespoke client projects',
		],
	},
]);

const proPerks = [
	{ title: 'Editable delivery', body: 'Inspect the component source on GitHub. A commercial licence lets you copy it into your product, import the npm package, or vendor the workspace with git subtree.' },
	{ title: 'Portable living docs', body: 'Bring the DOM Studio documentation engine into your own product. It discovers local components, examples, props, and usage notes automatically.' },
	{ title: 'Editable generated apps', body: 'Generated screens are built from the same headless primitives, DomForm, and Vue components you can inspect and change.' },
	{ title: 'Theme ownership', body: 'Styles are token driven and designed to be copied. Your app owns the CSS variables, spacing, radius, and final look.' },
];

const sourceHighlights = [
	'Generated from DOM Studio primitives',
	'Uses DomForm and headless behaviours',
	'Ready to copy into src/pages',
	'Documented automatically when added',
];

const faqs = [
	{ title: 'What can I do for free?', content: 'Anyone can browse the source, clone the repository, install the npm package, and modify the code to evaluate it locally or in a non-public test environment. No account or licence purchase is needed.' },
	{ title: 'When do I need a paid licence?', content: 'Buy an Individual or Team licence for production use, including internal business apps, for products you publish or distribute, and for paid client work.' },
	{ title: 'Can I copy components into my app?', content: 'Yes. You can import the npm package, copy individual components, or vendor the workspace with git subtree. The same licence terms apply whichever method you use.' },
	{ title: 'Can I package the docs with my own app?', content: 'That is the plan. The docs engine is designed to discover your copied components and examples, so each app can carry its own living component library without setting up Storybook.' },
	{ title: 'Can I change the theme?', content: 'Yes. Theme values are CSS variables and component styles are designed to be copied into your project. The host app owns the final tokens, not the package.' },
	{ title: 'What does perpetual use include?', content: 'Pay once and use the versions you receive forever. All v1 updates are included. Future major upgrades are optional and may be sold separately; you can keep using your existing version without paying again.' },
	{ title: 'Can I use Individual for client work?', content: 'Yes. One named developer can use Individual for unlimited personal, commercial, and bespoke client projects. Clients can receive and maintain their finished product, but need their own licence to reuse DOM Studio in other products. Choose Team when multiple developers need to use the component library.' },
	{ title: 'How does the team licence work?', content: 'Team includes unlimited seats inside one organisation, including employees and contractors working on its behalf. It covers your own products and bespoke client projects.' },
	{ title: 'Are architecture reviews included?', content: 'Architecture reviews and consulting are separate services, scoped and priced independently of the software licence.' },
	{ title: 'What happens to existing purchases?', content: 'Existing purchases, including the £1 introductory offer, keep their purchased access. Any additional rights or services promised with your original purchase remain included.' },
];

const comparisonRows = [
	{ feature: 'Public source and local evaluation', evaluation: true, individual: true, team: true },
	{ feature: 'Production use in your own products', evaluation: false, individual: true, team: true },
	{ feature: 'Paid client projects', evaluation: false, individual: true, team: true },
	{ feature: 'Unlimited team seats for production', evaluation: false, individual: false, team: true },
];

const generatedSource = [
	'<script setup>',
	"import { DomButton, DomForm } from '@getdom/studio/vue';",
	'',
	'const schema = {',
	"	title: 'Invite teammate',",
	'	fields: [',
	"		{ name: 'email', type: 'email', label: 'Email', required: true },",
	"		{ name: 'role', type: 'select', label: 'Role', options: ['Admin', 'Editor'] },",
	'	],',
	'};',
	'</' + 'script>',
	'',
	'<template>',
	'	<dom-dialog>',
	'		<DomButton slot="trigger">Invite teammate</DomButton>',
	'		<DomForm :schema="schema" submit-label="Send invite" />',
	'	</dom-dialog>',
	'</template>',
].join('\n');
</script>

<template>
	<DomStudioLayout>


		<section class="-mt-6 pb-16 pt-10 text-center">
			<p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted-fg">Pricing</p>
			<h1 class="mt-3 text-5xl font-bold leading-[1.05] tracking-tight text-canvas-fg sm:text-6xl">Vue component library pricing and licences.</h1>
			<p class="mx-auto mt-5 max-w-2xl text-lg text-muted-fg">
				Browse the complete Vue and Web Component UI system on GitHub and evaluate it for free. Choose an Individual or Team licence when you’re ready to use it in production or for paid client work.
			</p>
			<div class="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
				<DomButton as="a" :href="domStudioSourceUrl" variant="secondary">Browse source on GitHub</DomButton>
				<a :href="domStudioSourceUrl + '/blob/main/LICENSE.md'" class="text-sm text-primary underline underline-offset-4">Read the licence</a>
			</div>
			<div class="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-fg">
				<span class="size-1.5 rounded-full bg-success"></span>
				One-time payment · Perpetual use · No subscription
			</div>
		</section>

		<section class="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
			<div
				v-for="t in licences"
				:key="t.name"
				class="relative flex flex-col rounded-3xl border bg-canvas p-7 transition"
				:class="t.highlight ? 'border-primary shadow-2xl shadow-black/10 ring-1 ring-ring/10' : 'border-border'"
			>
				<span v-if="t.highlight" class="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-fg">For solo developers</span>
				<div>
					<p class="text-sm font-semibold tracking-tight text-canvas-fg">{{ t.name }}</p>
					<p class="mt-1 text-sm text-muted-fg">{{ t.tagline }}</p>
				</div>
				<div class="mt-6 flex items-baseline gap-1">
					<span class="text-5xl font-bold tracking-tight text-canvas-fg">{{ formatBillingPrice(t.price) }}</span>
					<span class="text-sm text-muted-fg">USD · once</span>
				</div>
				<p v-if="t.offerLabel" class="mt-2 text-xs font-semibold uppercase tracking-wider text-success">{{ t.offerLabel }}</p>
				<p v-if="t.hasPromotion" class="mt-1 text-sm text-muted-fg">Regular price: {{ formatBillingPrice(t.originalPrice) }} USD</p>
				<p v-if="t.priceSuffix" class="mt-1 text-xs font-medium uppercase tracking-wider text-muted-fg">{{ t.priceSuffix }}</p>
				<p class="mt-2 text-xs text-muted-fg">Future major upgrades are optional.</p>
				<ul class="mt-6 space-y-2.5 text-sm">
					<li v-for="f in t.features" :key="f" class="flex items-start gap-2 text-muted-fg">
						<svg viewBox="0 0 20 20" class="mt-0.5 size-4 shrink-0" fill="none">
							<path d="M5 10.5l3 3 7-7.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" :class="t.highlight ? 'text-canvas-fg' : 'text-success'" />
						</svg>
						<span>{{ f }}</span>
					</li>
				</ul>
				<div class="mt-auto pt-8">
					<DomButton
						:as="t.ctaExternal ? 'a' : t.ctaTo.startsWith('/') ? 'router-link' : 'a'"
						:to="t.ctaTo"
						:href="t.ctaTo"
						:variant="t.ctaVariant"
						size="lg"
						class="w-full"
					>{{ t.cta }}</DomButton>
					<p class="mt-3 text-xs leading-5 text-muted-fg">
						Read our <RouterLink to="/terms-and-conditions" class="text-primary underline underline-offset-4">Terms and conditions</RouterLink>
						and <RouterLink to="/privacy" class="text-primary underline underline-offset-4">Privacy policy</RouterLink> before purchasing.
					</p>
				</div>
			</div>
		</section>

		<section class="mt-24 border-t border-border pt-16">
			<div class="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
				<div>
					<h2 class="text-3xl font-bold tracking-tight text-canvas-fg">Explore the source locally.</h2>
					<p class="mt-4 text-sm leading-relaxed text-muted-fg">
						Clone the repository or install the npm package to try components, blocks, and their examples. The source shows how they fit together and how to adapt them to your app.
					</p>
					<ul class="mt-6 grid gap-3 text-sm">
						<li v-for="item in sourceHighlights" :key="item" class="flex items-start gap-2 text-muted-fg">
							<span class="mt-2 size-1.5 rounded-full bg-success"></span>
							<span>{{ item }}</span>
						</li>
					</ul>
				</div>
				<div class="overflow-hidden rounded-2xl border border-border bg-secondary/30">
					<div class="flex items-center justify-between border-b border-border px-4 py-3 text-xs uppercase tracking-wider text-muted-fg">
						<span>Generated source</span>
						<span>InviteDialog.vue</span>
					</div>
					<CodeBlock
						class="max-h-[30rem]"
						:code="generatedSource"
						:framed="false"
						lang="vue"
					/>
				</div>
			</div>
		</section>

		<section class="mt-24 border-t border-border pt-16">
			<div class="mb-10 text-center">
				<p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-fg">What's included</p>
				<h2 class="mt-2 text-3xl font-bold tracking-tight text-canvas-fg">A component library you can fold into your product.</h2>
			</div>
			<div class="grid gap-6 sm:grid-cols-2">
				<div v-for="p in proPerks" :key="p.title" class="rounded-2xl border border-border bg-secondary/40 p-6">
					<h3 class="text-base font-semibold tracking-tight text-canvas-fg">{{ p.title }}</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-fg">{{ p.body }}</p>
				</div>
			</div>
		</section>

		<section class="mt-24 border-t border-border pt-16">
			<div class="mb-8 text-center">
				<p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-fg">Compare</p>
				<h2 class="mt-2 text-3xl font-bold tracking-tight text-canvas-fg">Choose the licence that matches how you ship.</h2>
			</div>
			<div class="overflow-hidden rounded-2xl border border-border">
				<table class="w-full text-left text-sm">
					<thead class="bg-secondary text-xs uppercase tracking-wider text-muted-fg">
						<tr>
							<th scope="col" class="px-2 py-3 font-medium sm:px-4">Permission</th>
							<th scope="col" class="px-2 py-3 text-center font-medium sm:px-4">Evaluation</th>
							<th scope="col" class="px-2 py-3 text-center font-medium sm:px-4">Individual</th>
							<th scope="col" class="px-2 py-3 text-center font-medium sm:px-4">Team</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						<tr v-for="r in comparisonRows" :key="r.feature">
							<th scope="row" class="px-2 py-3 font-normal text-canvas-fg sm:px-4">{{ r.feature }}</th>
							<td class="px-2 py-3 text-center text-muted-fg sm:px-4">{{ r.evaluation ? 'Yes' : '—' }}</td>
							<td class="px-2 py-3 text-center text-muted-fg sm:px-4">{{ r.individual ? 'Yes' : '—' }}</td>
							<td class="px-2 py-3 text-center text-muted-fg sm:px-4">{{ r.team ? 'Yes' : '—' }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<section class="mt-24 border-t border-border pt-16">
			<div class="mb-8 text-center">
				<p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-fg">FAQ</p>
				<h2 class="mt-2 text-3xl font-bold tracking-tight text-canvas-fg">Questions, answered.</h2>
			</div>
			<div class="mx-auto max-w-2xl">
				<DomAccordion :items="faqs" />
			</div>
		</section>

		<section id="checkout" class="mt-24 border-t border-border pt-16 text-center">
			<div class="mx-auto max-w-2xl rounded-3xl border border-border bg-secondary/40 p-10">
				<h2 class="text-3xl font-bold tracking-tight text-canvas-fg">Own, edit, and ship your UI system.</h2>
				<p class="mt-3 text-muted-fg">Buy a perpetual production licence for DOM Studio, with all v1 updates included.</p>
				<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
					<DomButton :as="'a'" href="/api/billing/checkout?licence=individual" size="lg">Individual - {{ formatBillingPrice(individualPrice) }} USD once</DomButton>
					<DomButton :as="'a'" href="/api/billing/checkout?licence=team" variant="secondary" size="lg">Team - {{ formatBillingPrice(teamPrice) }} USD once</DomButton>
				</div>
				<p class="mt-4 text-xs text-muted-fg">14-day refund. No subscription required.</p>
			</div>
		</section>
	</DomStudioLayout>
</template>
