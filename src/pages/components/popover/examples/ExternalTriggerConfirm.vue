<script setup>
import { ref } from 'vue';
import { DomButton, DomPopover } from '@getdom/studio/vue';

const rows = ref([
	{ id: 1, name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin' },
	{ id: 2, name: 'Grace Hopper', email: 'grace@example.com', role: 'Owner' },
	{ id: 3, name: 'Katherine Johnson', email: 'katherine@example.com', role: 'Viewer' },
]);

function triggerId(row) {
	return `delete-row-${row.id}`;
}

function remove(row) {
	rows.value = rows.value.filter((item) => item.id !== row.id);
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-2xl border border-border bg-canvas">
		<table class="w-full text-left text-sm">
			<thead class="bg-secondary/70 text-xs uppercase tracking-wider text-muted-fg">
				<tr>
					<th class="px-4 py-3 font-medium">Name</th>
					<th class="px-4 py-3 font-medium">Email</th>
					<th class="px-4 py-3 font-medium">Role</th>
					<th class="px-4 py-3 text-right font-medium">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border">
				<tr v-for="row in rows" :key="row.id">
					<td class="px-4 py-3 font-medium text-canvas-fg">{{ row.name }}</td>
					<td class="px-4 py-3 text-muted-fg">{{ row.email }}</td>
					<td class="px-4 py-3 text-muted-fg">{{ row.role }}</td>
					<td class="px-4 py-3 text-right">
						<button
							:id="triggerId(row)"
							type="button"
							class="rounded-full px-3 py-1.5 text-sm font-medium text-destructive transition hover:bg-destructive/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
						>
							Delete
						</button>

						<DomPopover
							:trigger-id="triggerId(row)"
							position="start-bottom"
							width="w-72"
							v-slot="{ close }"
						>
							<div class="space-y-3">
								<div class="space-y-1">
									<p class="font-medium text-canvas-fg">Delete {{ row.name }}?</p>
									<p class="text-sm leading-5 text-muted-fg">
										This removes the row from the local table. The trigger button lives outside the popover.
									</p>
								</div>
								<div class="flex justify-end gap-2">
									<DomButton type="button" size="sm" variant="secondary" @click="close">Cancel</DomButton>
									<DomButton type="button" size="sm" variant="danger" @click="remove(row)">Delete</DomButton>
								</div>
							</div>
						</DomPopover>
					</td>
				</tr>
			</tbody>
		</table>
		<p v-if="!rows.length" class="px-4 py-8 text-center text-sm text-muted-fg">All rows removed.</p>
	</div>
</template>
