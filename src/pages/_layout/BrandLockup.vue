<script setup>
import BrandMark from './BrandMark.vue';

defineProps({
	showDomain: { type: Boolean, default: false },
	showBadge: { type: Boolean, default: false },
	markClass: { type: String, default: 'size-7' },
});
</script>

<template>
	<span class="flex min-w-0 items-center gap-2">
		<BrandMark :class="`${markClass} shrink-0`" title="DOM Studio" />
		<span class="min-w-0 truncate font-semibold tracking-tight">DOM Studio</span>
		<span v-if="showDomain" class="hidden text-[11px] font-medium text-muted-fg sm:inline">getdom.studio</span>
		<span
			v-if="showBadge"
			class="ml-2 hidden rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-fg ring-1 ring-border md:inline"
		>v1.0</span>
	</span>
</template>
