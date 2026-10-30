<script setup>
defineProps({
	rows: { type: Array, required: true }, // [{ name, type, default, description }]
	title: { type: String, default: 'Props' },
});
</script>

<template>
	<section class="space-y-3">
		<h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-fg">{{ title }}</h3>
		<div class="overflow-x-auto overflow-y-hidden rounded-2xl border border-border">
			<table class="min-w-full text-left text-sm">
				<thead class="bg-secondary text-xs uppercase tracking-wider text-muted-fg">
					<tr>
						<th class="px-4 py-2 font-medium">Name</th>
						<th class="px-4 py-2 font-medium">Type</th>
						<th class="px-4 py-2 font-medium">Default</th>
						<th class="px-4 py-2 font-medium">Description</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					<tr v-for="r in rows" :key="r.name">
						<td class="px-4 py-3 font-mono text-[12.5px] text-canvas-fg">{{ r.name }}</td>
						<td class="px-4 py-3 font-mono text-[12.5px] text-muted-fg">{{ r.type }}</td>
						<td class="px-4 py-3 font-mono text-[12.5px] text-muted-fg">{{ r.default || '—' }}</td>
						<td class="px-4 py-3 text-muted-fg">{{ r.description }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</template>
