<script setup>
defineOptions({
	__doc: {
		name: 'Card rail',
		tag: '<DomCardRail>',
		description: 'A horizontal rail for composed card groups with native overflow, snap points, and flexible item widths.',
		icon: 'M4 8h5v8H4V8Zm7 0h5v8h-5V8Zm7 0h2v8h-2V8Z',
		slots: [
			{ name: 'header', description: 'Section heading, copy, filters, or controls above the rail.' },
			{ name: 'actions', description: 'Optional controls aligned with the header.' },
			{ name: '(default)', description: 'Rail items. Each direct child becomes fixed-width, snap-aligned content.' },
		],
	},
});

defineProps({
	as: {
		type: String,
		default: 'section',
		_edit: { description: 'Element to render for the rail wrapper.' },
	},
	ariaLabel: {
		type: String,
		default: 'Scrollable card rail',
		_edit: { description: 'Accessible label for the focusable horizontal scroll region.' },
	},
});
</script>

<template>
	<component :is="as" class="dom-card-rail min-w-0">
		<div v-if="$slots.header || $slots.actions" class="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div v-if="$slots.header" class="min-w-0">
				<slot name="header"></slot>
			</div>
			<div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
				<slot name="actions"></slot>
			</div>
		</div>

		<div class="dom-card-rail__viewport" role="region" tabindex="0" :aria-label="ariaLabel">
			<div class="dom-card-rail__track">
				<slot />
			</div>
		</div>
	</component>
</template>

<style scoped>
.dom-card-rail {
	--dom-card-rail-edge: 0rem;
	--dom-card-rail-gap: 1rem;
}

.dom-card-rail__viewport {
	margin-inline: calc(var(--dom-card-rail-edge) * -1);
	overflow-x: auto;
	overflow-y: hidden;
	overscroll-behavior-x: contain;
	scroll-snap-type: x proximity;
	scrollbar-color: var(--border) transparent;
	scrollbar-width: thin;
	-webkit-overflow-scrolling: touch;
}

.dom-card-rail__viewport:focus-visible {
	border-radius: var(--radius-lg);
	outline: 2px solid var(--ring);
	outline-offset: 3px;
}

.dom-card-rail__viewport::-webkit-scrollbar {
	height: 0.7rem;
}

.dom-card-rail__viewport::-webkit-scrollbar-track {
	background: transparent;
}

.dom-card-rail__viewport::-webkit-scrollbar-thumb {
	background: var(--border);
	border: 0.25rem solid transparent;
	border-radius: 999px;
	background-clip: padding-box;
}

.dom-card-rail__track {
	display: flex;
	gap: var(--dom-card-rail-gap);
	min-width: max-content;
	padding-block-end: 0.75rem;
	padding-inline: var(--dom-card-rail-edge);
}

.dom-card-rail__track :slotted(*) {
	flex: 0 0 auto;
	scroll-snap-align: start;
}
</style>
