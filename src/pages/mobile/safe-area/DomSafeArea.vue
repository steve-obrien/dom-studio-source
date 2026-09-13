<script setup>
const edgeClasses = {
	top: 'pt-[var(--dom-safe-area-top,env(safe-area-inset-top,0px))]',
	bottom: 'pb-[var(--dom-safe-area-bottom,env(safe-area-inset-bottom,0px))]',
	left: 'pl-[var(--dom-safe-area-left,env(safe-area-inset-left,0px))]',
	right: 'pr-[var(--dom-safe-area-right,env(safe-area-inset-right,0px))]',
};

defineOptions({
	__doc: {
		name: 'Safe area',
		tag: '<DomSafeArea>',
		description: 'Applies selected device safe-area insets in any layout. App shell and app stack already reserve their own insets, so no extra wrapper is needed there. Enable viewport-fit=cover in the app viewport meta tag for edge-to-edge iOS layouts.',
		slots: [
			{ name: '(default)', description: 'Content that should avoid device cutouts and home indicators.' },
		],
		playground: {
			mobileSlot: 'safe-area',
		},
	},
});

defineProps({
	edges: {
		type: Array,
		default: () => ['top', 'bottom'],
		_edit: {
			component: 'DomJsonListInput',
			description: 'Safe-area edges to apply: top, bottom, left, right.',
		},
	},
});
</script>

<template>
	<div :class="edges.map((edge) => edgeClasses[edge]).filter(Boolean)">
		<slot />
	</div>
</template>
