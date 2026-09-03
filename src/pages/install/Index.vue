<script setup>
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
import CodeBlock from '../_layout/CodeBlock.vue';

const installCode = 'npm install @getdom/studio';
const componentCode = `import { DomButton, DomCard } from '@getdom/studio';`;
const quickCode = `import '@getdom/studio/style.css';`;
const recommendedCode = `/* src/app.css */
@import "tailwindcss";
@import "@getdom/studio/tailwind.css";

:root,
[data-theme="light"] {
	color-scheme: light;
	--radius: 0.625rem;
	--shadow-xs: 0 1px 1px rgb(15 23 42 / 0.04);
	--shadow-sm: 0 1px 2px rgb(15 23 42 / 0.06);
	--shadow-md: 0 3px 8px -2px rgb(15 23 42 / 0.12);
	--shadow-lg: 0 8px 20px -6px rgb(15 23 42 / 0.16);
	--shadow-xl: 0 18px 44px -18px rgb(15 23 42 / 0.24);
	--shadow-2xl: 0 24px 60px -18px rgb(15 23 42 / 0.24);
	--canvas: #fff;
	--canvas-fg: oklch(0.145 0 0);
	--primary: oklch(0.205 0 0);
	--primary-fg: oklch(0.985 0 0);
	--secondary: oklch(0.97 0 0);
	--secondary-fg: oklch(0.205 0 0);
	--muted: oklch(0.97 0 0);
	--muted-fg: oklch(0.5 0 0);
	--accent: oklch(0.97 0 0);
	--accent-fg: oklch(0.205 0 0);
	--destructive: oklch(0.577 0.245 27.325);
	--destructive-fg: oklch(0.985 0 0);
	--success: oklch(0.57 0.194 149.35);
	--success-fg: oklch(0.985 0 0);
	--warning: oklch(0.7 0.2 84);
	--warning-fg: oklch(0.28 0.07 46);
	--border: oklch(0.922 0 0);
	--input: oklch(0.922 0 0);
	--ring: oklch(0.708 0 0);
}`;

const darkCode = `[data-theme="dark"] {
	color-scheme: dark;
	--shadow-xs: 0 1px 1px rgb(0 0 0 / 0.28);
	--shadow-sm: 0 1px 2px rgb(0 0 0 / 0.34);
	--shadow-md: 0 8px 18px -10px rgb(0 0 0 / 0.52);
	--shadow-lg: 0 16px 34px -18px rgb(0 0 0 / 0.58);
	--shadow-xl: 0 24px 52px -24px rgb(0 0 0 / 0.68);
	--shadow-2xl: 0 34px 76px -30px rgb(0 0 0 / 0.72);
	--canvas: oklch(0.145 0 0);
	--canvas-fg: oklch(0.985 0 0);
	--primary: oklch(0.922 0 0);
	--primary-fg: oklch(0.205 0 0);
	--secondary: oklch(0.269 0 0);
	--secondary-fg: oklch(0.985 0 0);
	--muted: oklch(0.269 0 0);
	--muted-fg: oklch(0.708 0 0);
	--accent: oklch(0.269 0 0);
	--accent-fg: oklch(0.985 0 0);
	--destructive: oklch(0.704 0.191 22.216);
	--destructive-fg: oklch(0.985 0 0);
	--success: oklch(0.696 0.17 162.48);
	--success-fg: oklch(0.145 0 0);
	--warning: oklch(0.769 0.188 70.08);
	--warning-fg: oklch(0.145 0 0);
	--border: oklch(1 0 0 / 10%);
	--input: oklch(1 0 0 / 15%);
	--ring: oklch(0.556 0 0);
}`;

const headlessCode = `import '@getdom/studio/headless';`;
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Install"
			eyebrow="Getting started"
			tag="Tailwind CSS v4"
			tagline="Start in one line, then move the theme into your app when you want full control."
		>
			<DocSection title="1. Install the package">
				<p class="mb-4 max-w-2xl text-sm leading-6 text-muted-fg">
					DOM Studio requires Vue 3 and Tailwind CSS v4. Install it with your normal package manager, then import only the components you use.
				</p>
				<div class="space-y-4">
					<CodeBlock lang="sh" :code="installCode" />
					<CodeBlock lang="js" :code="componentCode" />
				</div>
			</DocSection>

			<DocSection title="2. Quick start">
				<div class="mb-4 max-w-2xl rounded-xl border border-border bg-secondary/50 p-4">
					<p class="font-medium text-canvas-fg">Best for trying DOM Studio</p>
					<p class="mt-1 text-sm leading-6 text-muted-fg">
						This single import includes Tailwind, DOM Studio's component styles, and its default light and dark themes.
					</p>
				</div>
				<CodeBlock lang="js" :code="quickCode" />
			</DocSection>

			<DocSection title="3. Recommended: own your theme">
				<p class="mb-4 max-w-2xl text-sm leading-6 text-muted-fg">
					Put these imports and theme values in your app's main stylesheet. DOM Studio supplies the Tailwind source and semantic utility names; your project owns the actual colours and radius.
				</p>
				<CodeBlock filename="src/app.css" lang="css" :code="recommendedCode" />
				<p class="my-4 max-w-2xl text-sm leading-6 text-muted-fg">
					Add a dark theme only if your app needs one. These defaults are a starting point, not a required visual identity.
				</p>
				<CodeBlock filename="src/app.css" lang="css" :code="darkCode" />
			</DocSection>

			<DocSection title="Optional headless components">
				<p class="mb-4 max-w-2xl text-sm leading-6 text-muted-fg">
					Register the framework-neutral <code class="rounded bg-secondary px-1.5 py-0.5 text-xs">dom-*</code> custom elements once in your app entry point.
				</p>
				<CodeBlock lang="js" :code="headlessCode" />
			</DocSection>

			<DocSection title="Which stylesheet should I use?">
				<div class="grid gap-3 md:grid-cols-3">
					<div class="rounded-xl border border-border p-4">
						<code class="text-sm font-semibold text-canvas-fg">style.css</code>
						<p class="mt-2 text-sm leading-6 text-muted-fg">Complete quick start. Tailwind and the default theme are included.</p>
					</div>
					<div class="rounded-xl border border-primary/30 bg-primary/5 p-4">
						<code class="text-sm font-semibold text-canvas-fg">tailwind.css</code>
						<p class="mt-2 text-sm leading-6 text-muted-fg">Recommended. Compiles the components against your app-owned theme.</p>
					</div>
					<div class="rounded-xl border border-border p-4">
						<code class="text-sm font-semibold text-canvas-fg">theme.css</code>
						<p class="mt-2 text-sm leading-6 text-muted-fg">Copyable DOM Studio defaults when you want a fuller starting point.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
