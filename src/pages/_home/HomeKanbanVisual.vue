<script setup>
const columns = [
	{ label: 'Discovery', cards: [{ title: 'Live dispatch overview', area: 'Operations', cover: '/assets/blocks/field-dispatch-map/london-dispatch-map.png', tags: ['Research', 'Maps'], owner: 'MC', done: 3, total: 7 }] },
	{ label: 'Delivery', cards: [{ title: 'Receipt capture review', area: 'Finance', cover: '/assets/blocks/expense-capture/receipt-northstar-coffee.png', tags: ['OCR', 'Review'], owner: 'OR', done: 6, total: 9 }, { title: 'Saved operational views', tags: ['Data', 'Preferences'], owner: 'PS', done: 4, total: 6 }] },
	{ label: 'Validation', cards: [{ title: 'Keyboard move semantics', tags: ['Keyboard', 'QA'], owner: 'MC', done: 8, total: 8 }] },
];
</script>

<template>
	<div class="h-[38rem] overflow-hidden rounded-2xl border border-border bg-secondary/25 p-3 shadow-xl shadow-canvas-fg/5">
		<div class="flex h-full gap-3 overflow-hidden">
			<div v-for="column in columns" :key="column.label" class="w-[20rem] shrink-0 space-y-3 rounded-xl border border-border bg-canvas p-3">
				<p class="flex items-center justify-between text-sm font-semibold">{{ column.label }} <span class="text-xs font-normal text-muted-fg">{{ column.cards.length }}</span></p>
				<div v-for="card in column.cards" :key="card.title" class="overflow-hidden rounded-xl border border-border bg-canvas shadow-sm">
					<div v-if="card.cover" class="flex min-h-32 items-end bg-cover bg-center p-3" :style="{ backgroundImage: `url(${card.cover})` }">
						<span class="rounded-full bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">{{ card.area }}</span>
					</div>
					<div class="space-y-3 p-3">
						<div class="flex gap-1.5">
							<span v-for="tag in card.tags" :key="tag" class="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-fg ring-1 ring-border">{{ tag }}</span>
						</div>
						<p class="text-sm font-semibold">{{ card.title }}</p>
						<div class="h-1.5 overflow-hidden rounded-full bg-secondary ring-1 ring-border">
							<div class="h-full rounded-full bg-primary" :style="{ width: `${(card.done / card.total) * 100}%` }"></div>
						</div>
						<span class="grid size-7 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-fg">{{ card.owner }}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
