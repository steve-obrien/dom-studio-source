<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import { DomNumberInput } from '../../lib/vue';

import QuantityInput from './examples/QuantityInput.vue';
import QuantityInputSrc from './examples/QuantityInput.vue?raw';
import DecimalAndPercentage from './examples/DecimalAndPercentage.vue';
import DecimalAndPercentageSrc from './examples/DecimalAndPercentage.vue?raw';

const doc = DomNumberInput.__doc;

const installCommand = 'npm install @getdom/studio';
const styleImport = "import '@getdom/studio/style.css';";
const aiPrompt = `Add DOM Studio's Vue 3 number input to this project.

1. Install @getdom/studio.
2. Import DomNumberInput from '@getdom/studio/vue'.
3. Import '@getdom/studio/style.css' once in the app entry file if it is not already imported.
4. Add a ref named quantity and bind it with v-model.
5. Render a labelled Quantity field with min 1, max 99, and step 1.

Use the project's existing package manager and Vue conventions. Do not replace unrelated form code.`;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<div class="prose prose-sm max-w-none text-muted-fg">
				<p>
					Use <code>DomNumberInput</code> when a Vue form needs a real numeric value with native browser
					spinbutton behavior. It works with Vue 3 <code>v-model</code>, emits numbers while the user types,
					and shares DOM Studio's accessible label, description, disabled, required, and error UI.
				</p>
			</div>

			<DocSection eyebrow="Quick start" title="Prompt your AI to add it">
				<p class="mb-4 max-w-3xl text-sm leading-6 text-muted-fg">
					Paste this into your coding agent. It contains the package, imports, model, and constraints needed for a working Vue number input.
				</p>
				<CodeBlock :code="aiPrompt" lang="text" />
			</DocSection>

			<DocSection eyebrow="Quick start" title="Or add it manually in three steps">
				<div class="mb-5 grid gap-4 text-sm leading-6 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border p-4">
						<p class="font-semibold text-canvas-fg">1. Install</p>
						<p class="mt-1">Add the DOM Studio package to your Vue 3 project.</p>
					</div>
					<div class="rounded-lg border border-border p-4">
						<p class="font-semibold text-canvas-fg">2. Load styles once</p>
						<p class="mt-1">Import the complete stylesheet in your app entry file.</p>
					</div>
					<div class="rounded-lg border border-border p-4">
						<p class="font-semibold text-canvas-fg">3. Import and bind</p>
						<p class="mt-1">Import the component in any SFC and use ordinary <code>v-model</code>.</p>
					</div>
				</div>
				<CodeBlock :code="installCommand" lang="shell" />
				<CodeBlock :code="styleImport" lang="js" />
				<Example
					:source="QuantityInputSrc"
					filename="QuantityInput.vue"
					title="Copy the smallest useful implementation"
					description="A ref, one import, v-model, and native numeric boundaries are enough."
					:default-open="true"
					:code-first="true"
				>
					<QuantityInput />
				</Example>
			</DocSection>

			<DocSection eyebrow="Examples" title="Decimal steps and validation">
				<p class="mb-4 max-w-3xl text-sm leading-6 text-muted-fg">
					Use <code>step</code> for fractional values. Native <code>min</code> and <code>max</code> constraints guide browser controls;
					pass your application errors through <code>errors</code> when you need an inline validation message.
				</p>
				<Example
					:source="DecimalAndPercentageSrc"
					filename="DecimalAndPercentage.vue"
					description="A bounded percentage and a decimal number input with quarter-hour increments."
				>
					<DecimalAndPercentage />
				</Example>
			</DocSection>

			<DocSection eyebrow="Behavior" title="What value does v-model receive?">
				<div class="grid gap-4 text-sm leading-6 text-muted-fg md:grid-cols-2">
					<div class="rounded-lg border border-border p-4">
						<p class="font-semibold text-canvas-fg">While filled</p>
						<p class="mt-1"><code>v-model</code> receives a JavaScript number, so calculations do not need a separate string conversion.</p>
					</div>
					<div class="rounded-lg border border-border p-4">
						<p class="font-semibold text-canvas-fg">When cleared</p>
						<p class="mt-1">The value is an empty string. Treat that as missing input and validate it before saving.</p>
					</div>
				</div>
			</DocSection>

			<DocSection eyebrow="Playground" title="Try the Vue number input">
				<Playground
					:inspect="DomNumberInput"
					:initial="doc.playground.initial"
					title="Number input playground"
					description="Change the label, description, value, min, max, step, disabled state, and validation props live."
				/>
			</DocSection>

			<DocSection title="Vue number input API">
				<ComponentProps :component="DomNumberInput" />
				<ComponentEvents :component="DomNumberInput" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
