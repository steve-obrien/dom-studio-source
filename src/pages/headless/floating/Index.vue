<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Example from '../../_layout/docs/Example.vue';
import HtmlDemo from '../../_layout/docs/HtmlDemo.vue';

import PopoverSrc from './examples/popover.html?raw';

const directUsage = `import {
\tapplyFloatingPosition,
\tautoUpdateFloating,
} from '@getdom/studio/headless/floating.js';

const trigger = document.querySelector('#filter-button');
const panel = document.querySelector('#filter-panel');

function update() {
\tapplyFloatingPosition(trigger, panel, {
\t\tplacement: 'bottom-end',
\t\toffset: 8,
\t\tpadding: 12,
\t\tmode: 'viewport',
\t});
}

const stop = autoUpdateFloating(trigger, panel, update);
update();

// Call stop() when the panel is removed or no longer needs to track layout.`;

const popoverUsage = `<dom-popover placement="bottom-end" offset="8" collision-padding="12" flip>
\t<button slot="trigger" type="button">Filters</button>
\t<form slot="panel" class="dom-popover-panel dom-floating-transition">
\t\t<!-- any content: menu, form, picker, command list -->
\t</form>
</dom-popover>

<script type="module">
\timport '@getdom/studio/headless/popover.js';
<\/script>`;

const handledProblems = [
	'Escapes parent overflow, transforms, and z-index traps through the native Popover top layer.',
	'Keeps panels inside the visual viewport with collision padding, side flipping, and coordinate shifting.',
	'Tracks scroll parents, viewport resize, visual viewport movement, and element resize with one update per animation frame.',
	'Publishes placement state through data attributes so CSS can adapt transitions, arrows, and origin.',
	'Exposes available width and height CSS variables for long menus, command palettes, calendars, and suggestion lists.',
	'Shares one positioning contract across popover, dropdown, autocomplete, combobox, tooltip, and custom menus.',
];
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Floating layers"
			tagline="The shared positioning engine behind DOM Studio popovers, dropdowns, comboboxes, autocomplete lists, tooltips, and menu surfaces."
			tag="@getdom/studio/headless/floating.js"
		>
			<DocSection eyebrow="Why" title="The hard parts are already handled">
				<div class="rounded-xl border border-border bg-secondary/40 p-6">
					<p class="text-sm leading-relaxed text-muted-fg">
						Floating UI is where ordinary JavaScript tends to get fragile: nested scroll containers, clipped parents,
						transformed ancestors, mobile visual viewports, tiny windows, long menus, arrow positioning, focus return,
						and light-dismiss all meet in one place. DOM Studio centralizes those mechanics in
						<code>floating.js</code> and layers the native Popover API on top through
						<code>&lt;dom-popover&gt;</code> and friends.
					</p>
					<ul class="mt-4 grid gap-2 text-sm text-muted-fg md:grid-cols-2">
						<li v-for="problem in handledProblems" :key="problem" class="flex gap-2">
							<span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-fg"></span>
							<span>{{ problem }}</span>
						</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Use first" title="Prefer the popover panel">
				<p class="max-w-3xl text-sm leading-relaxed text-muted-fg">
					Reach for <code>&lt;dom-popover&gt;</code>, <code>&lt;dom-dropdown&gt;</code>, <code>&lt;dom-combobox&gt;</code>,
					or <code>&lt;dom-autocomplete&gt;</code> when the UI is trigger-driven. Those controls combine
					<code>floating.js</code> positioning with native top-layer rendering, light-dismiss, keyboard behavior, ARIA
					wiring, scroll locking, and open/close events.
				</p>
				<div class="mt-4">
					<CodeBlock :code="popoverUsage" lang="html" />
				</div>
			</DocSection>

			<DocSection eyebrow="Demo" title="Anchored top-layer panel">
				<Example
					:source="PopoverSrc"
					lang="html"
					filename="popover.html"
					description="This is the recommended route for app UI: native popover top layer plus DOM Studio floating placement."
				>
					<HtmlDemo :source="PopoverSrc" />
				</Example>
			</DocSection>

			<DocSection eyebrow="Low level" title="Use floating.js directly">
				<p class="max-w-3xl text-sm leading-relaxed text-muted-fg">
					Use the direct helper when you are building a custom surface that is not one of the headless elements yet,
					or when you need position metadata without the Popover API. <code>computeFloatingPosition</code> returns
					coordinates and collision data. <code>applyFloatingPosition</code> writes the standard DOM Studio inline
					styles, CSS variables, and <code>data-*</code> placement attributes. <code>autoUpdateFloating</code> keeps
					the result fresh while layout changes.
				</p>
				<div class="mt-4">
					<CodeBlock :code="directUsage" lang="js" filename="floating.js" />
				</div>
			</DocSection>

			<DocSection eyebrow="Contract" title="CSS hooks">
				<div class="grid gap-4 text-sm text-muted-fg md:grid-cols-2">
					<div class="rounded-xl border border-border bg-background p-4">
						<p class="font-semibold text-fg">Attributes</p>
						<p class="mt-2">
							<code>data-placement</code>, <code>data-side</code>, <code>data-align</code>,
							<code>data-floating-mode</code>, <code>data-flipped</code>, <code>data-collision-*</code>,
							and <code>data-overflow-*</code> let CSS react to the resolved placement.
						</p>
					</div>
					<div class="rounded-xl border border-border bg-background p-4">
						<p class="font-semibold text-fg">Variables</p>
						<p class="mt-2">
							<code>--dom-floating-available-width</code>, <code>--dom-floating-available-height</code>,
							<code>--dom-popover-arrow-x</code>, and <code>--dom-popover-arrow-y</code> power scroll limits
							and placement-aware arrows.
						</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
