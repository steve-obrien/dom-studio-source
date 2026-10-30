<script setup>
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useBillingOffer } from '../../composable/useBillingOffer.js';
import { formatBillingPrice } from '../../../shared/billing.js';

/** Public list prices, checked October 2026; re-check before changing the copy. `per` is how each is charged. */
const competitors = [
	{ name: 'AG Grid Enterprise + AG Charts', covers: 'Data grid and charts', price: 1498, per: 'developer' },
	{ name: 'Bryntum Gantt', covers: 'Gantt', price: 940, per: 'developer' },
	{ name: 'Bryntum Scheduler', covers: 'Resource scheduling', price: 680, per: 'developer' },
	{ name: 'shadcn/designer', covers: 'Design-tool components', price: 1499, per: 'year' },
];
const teamSizes = [1, 5, 10];
const developers = ref(5);
const { teamPrice } = useBillingOffer();
const theirs = computed(() => competitors.reduce((sum, item) => sum + cost(item), 0));

/** What one product costs this team: per-developer licences scale with the team, a business licence does not. */
function cost(item) {
	return item.per === 'developer' ? item.price * developers.value : item.price;
}
</script>

<template>
	<div class="grid gap-8 rounded-3xl border border-border bg-canvas p-6 sm:p-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
		<div>
			<p class="font-mono text-xs uppercase tracking-[0.18em] text-muted-fg">The numbers</p>
			<h2 class="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-[2.6rem]">Less than one seat elsewhere.</h2>
			<p class="mt-4 max-w-md text-base leading-7 text-muted-fg">Grid, charts, scheduling and design tools are usually bought per product, often per developer. DOM Studio’s team licence covers every product, every block and your whole team, once.</p>
			<div class="mt-6 inline-flex rounded-lg border border-border p-1 text-sm" role="group" aria-label="Developers on the team">
				<button v-for="size in teamSizes" :key="size" type="button" class="rounded-md px-3 py-1.5" :class="developers === size ? 'bg-secondary font-medium' : 'text-muted-fg'" :aria-pressed="developers === size" @click="developers = size">{{ size }} {{ size === 1 ? 'developer' : 'developers' }}</button>
			</div>
		</div>
		<div class="min-w-0">
			<table class="w-full text-left text-sm tabular-nums">
				<tbody>
					<tr v-for="item in competitors" :key="item.name" class="border-b border-border">
						<td class="py-3 pr-3"><span class="block font-medium">{{ item.name }}</span><span class="text-xs text-muted-fg">{{ item.covers }} · {{ formatBillingPrice(item.price) }} {{ item.per === 'developer' ? 'per developer' : 'a year, business licence' }}</span></td>
						<td class="py-3 text-right">{{ formatBillingPrice(cost(item)) }}</td>
					</tr>
					<tr class="border-b border-border">
						<td class="py-3 pr-3 font-semibold">Typical stack for {{ developers }} {{ developers === 1 ? 'developer' : 'developers' }}</td>
						<td class="py-3 text-right font-semibold">{{ formatBillingPrice(theirs) }}</td>
					</tr>
					<tr>
						<td class="py-4 pr-3"><span class="block text-base font-semibold">DOM Studio Team</span><span class="text-xs text-muted-fg">Every product, block and component · your whole team</span></td>
						<td class="py-4 text-right text-2xl font-semibold text-success">{{ formatBillingPrice(teamPrice) }}</td>
					</tr>
				</tbody>
			</table>
			<p class="mt-3 text-xs leading-5 text-muted-fg">Competitor figures are public list prices checked October 2026: AG Grid and Bryntum per developer, perpetual with one year of updates; shadcn/designer as its yearly business licence. None of them include a document editor or media library. <RouterLink to="/pricing" class="underline underline-offset-2">See DOM Studio licences</RouterLink>.</p>
		</div>
	</div>
</template>
