<script setup>
import { ref } from 'vue';
import { DomButton } from '../lib/vue';
import RichProjectBoard from '../data/kanban/examples/RichProjectBoard.vue';
import CustomerDatabase from '../data/data-grid/examples/CustomerDatabase.vue';

const view = ref('board');
const tabs = [{ key: 'board', label: 'Rich media Kanban' }, { key: 'grid', label: 'Customer data grid' }];
</script>

<template>
	<div class="space-y-5">
		<div class="flex flex-wrap gap-2" role="group" aria-label="Data showcase">
			<DomButton v-for="item in tabs" :key="item.key" :variant="view === item.key ? 'primary' : 'secondary'" :aria-pressed="view === item.key" size="sm" @click="view = item.key">{{ item.label }}</DomButton>
		</div>
		<RichProjectBoard v-show="view === 'board'" />
		<CustomerDatabase v-show="view === 'grid'" />
	</div>
</template>
