<script setup>
import { DomScrollMenu, DomScrollMenuItem } from '@getdom/studio/vue';

const sections = [
	{ id: 'basic-scroll-menu-overview', label: 'Overview' },
	{ id: 'basic-scroll-menu-installation', label: 'Installation' },
	{ id: 'basic-scroll-menu-usage', label: 'Usage' },
];
</script>

<template>
	<div class="grid w-full gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
		<aside class="lg:pt-2">
			<DomScrollMenu scroll-root="#basic-scroll-menu-content">
				<DomScrollMenuItem
					v-for="section in sections"
					:key="section.id"
					:href="`#${section.id}`"
				>
					{{ section.label }}
				</DomScrollMenuItem>
			</DomScrollMenu>
		</aside>

		<div
			id="basic-scroll-menu-content"
			class="h-[24rem] overflow-y-auto rounded-2xl border border-border bg-canvas px-6"
		>
			<section
				v-for="section in sections"
				:id="section.id"
				:key="section.id"
				class="min-h-64 scroll-mt-6 border-b border-border py-8 last:min-h-[20rem] last:border-b-0"
			>
				<h2 class="text-2xl font-semibold tracking-tight text-canvas-fg">
					{{ section.label }}
				</h2>
				<p class="mt-3 max-w-xl text-sm leading-6 text-muted-fg">
					Scroll the panel or select this section from the menu.
				</p>
			</section>
		</div>
	</div>
</template>
