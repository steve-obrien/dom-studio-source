<script setup>
import { ref } from 'vue';
import { DomScrollMenu, DomScrollMenuItem } from '@getdom/studio/vue';

const activeHref = ref('');
const sections = [
	{
		id: 'custom-scroll-menu-overview',
		label: 'Overview',
		description: 'What the component watches',
		depth: 0,
	},
	{
		id: 'custom-scroll-menu-fragment-links',
		label: 'Fragment links',
		description: 'Native URLs and browser history',
		depth: 1,
	},
	{
		id: 'custom-scroll-menu-scroll-root',
		label: 'Scroll containers',
		description: 'Viewport or nested panel',
		depth: 1,
	},
	{
		id: 'custom-scroll-menu-accessibility',
		label: 'Accessibility',
		description: 'Current-location semantics',
		depth: 0,
	},
];
</script>

<template>
	<div class="grid w-full gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
		<aside class="lg:pt-2">
			<DomScrollMenu
				v-model="activeHref"
				scroll-root="#custom-scroll-menu-content"
			>
				<DomScrollMenuItem
					v-for="section in sections"
					:key="section.id"
					:depth="section.depth"
				>
					<template #default="{ active }">
						<a
							:href="`#${section.id}`"
							:title="`Jump to ${section.label}`"
						>
							<span class="flex items-start justify-between gap-3">
								<span class="min-w-0">
									<span class="block">{{ section.label }}</span>
									<span class="mt-0.5 block text-xs font-normal text-muted-fg">
										{{ section.description }}
									</span>
								</span>
								<span
									v-if="active"
									class="mt-0.5 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
								>
									Reading
								</span>
							</span>
						</a>
					</template>
				</DomScrollMenuItem>
			</DomScrollMenu>
		</aside>

		<div
			id="custom-scroll-menu-content"
			class="h-[28rem] overflow-y-auto rounded-2xl border border-border bg-canvas px-6"
		>
			<section
				v-for="(section, index) in sections"
				:id="section.id"
				:key="section.id"
				class="min-h-72 scroll-mt-6 border-b border-border py-8 last:min-h-[24rem] last:border-b-0"
			>
				<p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-fg">
					Section {{ index + 1 }}
				</p>
				<h2 class="mt-2 text-2xl font-semibold tracking-tight text-canvas-fg">
					{{ section.label }}
				</h2>
				<p class="mt-3 max-w-xl text-sm leading-6 text-muted-fg">
					{{ section.description }}. Scroll this panel or use the custom fragment link in the menu.
				</p>
			</section>
		</div>
	</div>
</template>
