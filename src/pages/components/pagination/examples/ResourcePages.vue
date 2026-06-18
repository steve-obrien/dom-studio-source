<script setup>
import { computed, ref } from 'vue';
import { DomPagination } from '../../../lib/vue';

const page = ref(4);
const pageSize = 25;
const total = 286;
const queryPayload = computed(() => ({
	page: page.value,
	pageSize,
	offset: (page.value - 1) * pageSize,
	limit: pageSize,
}));
</script>

<template>
	<div class="w-full max-w-3xl rounded-lg border border-border bg-canvas p-5 shadow-sm">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<p class="text-sm font-semibold text-canvas-fg">Customers</p>
				<p class="mt-1 text-sm text-muted-fg">Page state can be sent beside grid filters, sort, and search.</p>
			</div>
			<code class="rounded-md bg-secondary px-2 py-1 text-xs text-muted-fg">
				offset {{ queryPayload.offset }} / limit {{ queryPayload.limit }}
			</code>
		</div>
		<div class="mt-5 rounded-md border border-border bg-secondary/40 p-4">
			<div class="grid gap-2">
				<div v-for="index in 4" :key="index" class="h-10 rounded-md bg-canvas shadow-sm"></div>
			</div>
		</div>
		<DomPagination
			v-model:page="page"
			class="mt-5"
			:page-size="pageSize"
			:total="total"
		/>
	</div>
</template>
