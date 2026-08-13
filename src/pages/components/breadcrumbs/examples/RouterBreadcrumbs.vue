<script setup>
import { DomBreadcrumbs } from '../../../lib/vue';

const items = [
	{ label: 'Components', to: '/components' },
	{ label: 'Navigation', to: '/components' },
	{ label: 'Breadcrumbs', to: '/components/breadcrumbs', current: true },
];
</script>

<template>
	<div class="w-full rounded-xl border border-border skin-card p-5">
		<DomBreadcrumbs :items="items" separator="slash" />
	</div>
</template>
