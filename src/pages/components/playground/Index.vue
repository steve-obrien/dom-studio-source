<script setup>
import { markRaw } from 'vue';
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import { RouterLink } from 'vue-router';
import DemoInspector from '../../_layout/inspector/Inspector.vue';
import { DomButton, DomToggle, DomTooltip } from '../../lib/vue';

// --- Demo 1 — simple button ----------------------------------------------------
const buttonSpec = {
	id: 'btn',
	label: 'Button',
	component: markRaw(DomButton),
	props: { variant: 'primary', size: 'lg', loading: false },
	text: 'Get lifetime access',
	schema: [
		{ key: 'variant', label: 'Variant', type: 'select', options: ['primary', 'secondary', 'ghost', 'danger'] },
		{ key: 'size', label: 'Size', type: 'select', options: ['sm', 'md', 'lg'] },
		{ key: 'loading', label: 'Loading', type: 'boolean' },
		{ key: 'text', label: 'Label', type: 'string', target: 'text' },
	],
};

// --- Demo 1b — same component, schema omitted (auto-inferred) -----------------
const inferredButtonSpec = {
	id: 'btn-auto',
	label: 'Button (auto)',
	component: markRaw(DomButton),
	props: { variant: 'primary', size: 'md' },
	text: 'Auto-inferred fields',
	// No `schema` — the inspector reads DomButton.props and the registry hints to
	// generate variant/size selects, a `loading` boolean, and a Tailwind classes field.
};

// --- Demo 2 — multi-node "pricing card" ---------------------------------------
const cardSpec = {
	id: 'card',
	label: 'Card',
	component: 'div',
	props: { class: 'skin-card flex w-[320px] flex-col items-start gap-4 rounded-3xl p-7' },
	schema: [],
	children: [
		{
			id: 'badge',
			label: 'Badge',
			component: 'span',
			props: { class: 'rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-fg' },
			text: 'Lifetime',
			schema: [
				{ key: 'text', label: 'Text', type: 'string', target: 'text' },
			],
		},
		{
			id: 'title',
			label: 'Title',
			component: 'h3',
			props: { class: 'text-2xl font-bold tracking-tight text-canvas-fg' },
			text: 'Pro',
			schema: [
				{ key: 'text', label: 'Text', type: 'string', target: 'text' },
			],
		},
		{
			id: 'price',
			label: 'Price',
			component: 'p',
			props: { class: 'text-muted-fg' },
			text: '$149 once · forever yours',
			schema: [
				{ key: 'text', label: 'Text', type: 'string', target: 'text' },
			],
		},
		{
			id: 'cta',
			label: 'CTA Button',
			component: markRaw(DomButton),
			props: { variant: 'primary', size: 'md' },
			text: 'Get access',
			schema: [
				{ key: 'variant', label: 'Variant', type: 'select', options: ['primary', 'secondary', 'ghost', 'danger'] },
				{ key: 'size', label: 'Size', type: 'select', options: ['sm', 'md', 'lg'] },
				{ key: 'text', label: 'Label', type: 'string', target: 'text' },
			],
		},
	],
};

const specCode = `const cardSpec = {
  id: 'card',
  label: 'Card',
  component: 'div',
  props: { class: 'rounded-3xl border bg-canvas p-7 …' },
  children: [
    {
      id: 'title',
      label: 'Title',
      component: 'h3',
      text: 'Pro',
      schema: [{ key: 'text', target: 'text', type: 'string' }],
    },
    {
      id: 'cta',
      label: 'CTA Button',
      component: DomButton,
      props: { variant: 'primary', size: 'md' },
      text: 'Get access',
      schema: [
        { key: 'variant', type: 'select',
          options: ['primary', 'secondary', 'ghost', 'danger'] },
        { key: 'size',    type: 'select', options: ['sm', 'md', 'lg'] },
        { key: 'text',    target: 'text', type: 'string' },
      ],
    },
  ],
};`;

const usage = `<script setup>
import DemoInspector from '@getdom/inspector';
import { DomButton } from '@getdom/studio/vue';
import { markRaw } from 'vue';

const spec = {
  id: 'btn',
  label: 'Button',
  component: markRaw(DomButton),
  props: { variant: 'primary', size: 'md' },
  text: 'Click me',
  schema: [
    { key: 'variant', type: 'select', options: ['primary', 'secondary'] },
    { key: 'size',    type: 'select', options: ['sm', 'md', 'lg'] },
    { key: 'text',    target: 'text', type: 'string' },
  ],
};
<\/script>

<template>
  <DemoInspector :spec="spec" title="Button playground" />
</template>`;
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Playground"
			tagline="A live inspector. Click a component on the stage, edit its properties in the form, watch the change land instantly."
			tag="<DemoInspector>"
		>
			<DocSection eyebrow="Demo" title="Single component">
				<DemoInspector :spec="buttonSpec" title="Button" />
				<p class="mt-3 text-sm text-muted-fg">
					Click <strong>Pick</strong> in the inspector, then click the button on the stage to select it. Edit variant, size, or label — the stage updates live.
				</p>
			</DocSection>

			<DocSection eyebrow="Auto-schema" title="Schema inferred from the component's props">
				<DemoInspector :spec="inferredButtonSpec" title="Button (no schema declared)" />
				<p class="mt-3 text-sm text-muted-fg">
					Same component, but the spec doesn't declare a <code>schema</code>. The inspector walks <code>DomButton.props</code>, looks up registry hints (variant + size), and adds a Tailwind classes editor at the end — automatically.
				</p>
			</DocSection>

			<DocSection eyebrow="Demo" title="Nested arrangement">
				<DemoInspector :spec="cardSpec" title="Pricing card" stage-class="min-h-[360px]" />
				<p class="mt-3 text-sm text-muted-fg">
					Multiple selectable nodes — pick any layer in the stage or use the layer list to drill in.
				</p>
			</DocSection>

			<DocSection eyebrow="Canvas" title="Build full layouts in the canvas">
				<div class="rounded-2xl border border-border bg-gradient-to-br from-secondary to-transparent p-6">
					<p class="text-sm leading-relaxed text-muted-fg">
						The <strong class="text-canvas-fg">canvas</strong> gives you a full-width designer with every component to insert,
						layers, an inspector generated from these same specs, and a two-way Vue code view that keeps the stage and
						source selected together.
					</p>
					<RouterLink
						to="/designer/canvas"
						class="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-fg hover:opacity-90"
					>Open the canvas →</RouterLink>
				</div>
			</DocSection>

			<DocSection eyebrow="Spec" title="Author a playground in a few lines">
				<CodeBlock :code="specCode" lang="js" />
			</DocSection>

			<DocSection eyebrow="Usage" title="Vue">
				<CodeBlock :code="usage" lang="vue" />
			</DocSection>

			<DocSection title="Field types">
				<div class="grid gap-3 sm:grid-cols-2">
					<div v-for="f in [
						{ name: 'string', desc: 'Single-line text input.' },
						{ name: 'text', desc: 'Multi-line textarea.' },
						{ name: 'number', desc: 'Numeric input with optional min/max/step.' },
						{ name: 'boolean', desc: 'Renders the DomToggle switch.' },
						{ name: 'select', desc: 'Pill group of options.' },
						{ name: 'color', desc: 'Native color picker plus hex input.' },
					]" :key="f.name" class="rounded-xl border border-border bg-secondary/40 p-4">
						<code class="text-sm font-semibold text-canvas-fg">{{ f.name }}</code>
						<p class="mt-1 text-sm text-muted-fg">{{ f.desc }}</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
