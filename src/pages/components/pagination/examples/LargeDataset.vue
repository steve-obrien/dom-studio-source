<script setup>
import { ref } from 'vue';
import { DomPagination } from '../../../lib/vue';

const page = ref(207);
const total = 5218;
const pageSize = 25;
</script>

<template>
	<div class="w-full min-w-0 space-y-6">
		<section class="rounded-lg border border-border bg-canvas p-4 sm:p-5">
			<div class="mb-5">
				<h3 class="text-sm font-semibold text-canvas-fg">Conversation history</h3>
				<p class="mt-1 text-sm text-muted-fg">5,218 conversations · 25 rows per page</p>
			</div>
			<DomPagination
				v-model:page="page"
				variant="input"
				label="Conversation history pages"
				:page-size="pageSize"
				:total="total"
			/>
		</section>
		<section class="rounded-lg border border-border bg-canvas p-4 sm:p-5">
			<div class="mb-5">
				<h3 class="text-sm font-semibold text-canvas-fg">Numbered navigation</h3>
				<p class="mt-1 text-sm text-muted-fg">Click the dots to choose a page, or drag them and release to jump. Hold Shift to move faster.</p>
			</div>
			<DomPagination
				v-model:page="page"
				label="Numbered conversation pages"
				:page-size="pageSize"
				:total="total"
			/>
		</section>
	</div>
</template>
