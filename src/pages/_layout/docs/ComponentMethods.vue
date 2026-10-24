<script setup>
import { computed } from 'vue';

const props = defineProps({
	component: { required: true },
	title: { type: String, default: 'Methods' },
});

// Methods come from `__doc.methods` on the component: { name, signature, description }.
const methods = computed(() => props.component?.__doc?.methods || []);
</script>

<template>
	<section v-if="methods.length" class="space-y-3">
		<h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-fg">{{ title }}</h3>
		<p class="text-sm text-muted-fg">Call these on a template ref.</p>
		<div class="overflow-x-auto rounded-2xl border border-border">
			<table class="w-full text-left text-sm">
				<thead class="bg-secondary text-xs uppercase tracking-wider text-muted-fg">
					<tr>
						<th class="px-4 py-2 font-medium">Name</th>
						<th class="px-4 py-2 font-medium">Signature</th>
						<th class="px-4 py-2 font-medium">Description</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					<tr v-for="method in methods" :key="method.name">
						<td class="px-4 py-3 font-mono text-[12.5px] text-canvas-fg">{{ method.name }}</td>
						<td class="px-4 py-3 font-mono text-[12.5px] text-muted-fg">{{ method.signature }}</td>
						<td class="px-4 py-3 text-muted-fg">{{ method.description }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</template>
