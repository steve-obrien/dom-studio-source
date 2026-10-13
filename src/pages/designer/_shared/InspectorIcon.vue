<script setup>
/**
 * Small 16px line icons for the designer inspector: layout modes, directions,
 * spacing and layer actions. Purely decorative; controls supply the label.
 */
defineProps({ name: { type: String, required: true } });

const paths = {
	'mode-flow': ['M3 4h10', 'M3 8h10', 'M3 12h6'],
	'mode-flex': ['M2.5 4.5h4v7h-4z', 'M9.5 4.5h4v7h-4z'],
	'mode-grid': ['M2.5 2.5h4.5v4.5H2.5z', 'M9 2.5h4.5v4.5H9z', 'M2.5 9h4.5v4.5H2.5z', 'M9 9h4.5v4.5H9z'],
	'mode-absolute': ['M2.5 2.5h7v6h-7z', 'M6.5 7.5h7v6h-7z'],
	'dir-row': ['M2 8h11', 'M9.5 4.5 13 8l-3.5 3.5'],
	'dir-column': ['M8 2v11', 'M4.5 9.5 8 13l3.5-3.5'],
	reverse: ['M3 5.5h10', 'M10.5 3l2.5 2.5L10.5 8', 'M13 10.5H3', 'M5.5 8 3 10.5 5.5 13'],
	wrap: ['M2 4h9.5a2.5 2.5 0 0 1 0 5H6', 'M8 7 6 9l2 2', 'M2 13h5'],
	'gap-x': ['M2.5 3v10', 'M13.5 3v10', 'M6 8h4'],
	'gap-y': ['M3 2.5h10', 'M3 13.5h10', 'M8 6v4'],
	'padding-x': ['M2.5 3v10', 'M13.5 3v10', 'M5.5 5.5h5v5h-5z'],
	'padding-y': ['M3 2.5h10', 'M3 13.5h10', 'M5.5 5.5h5v5h-5z'],
	'padding-sides': ['M2.5 5V2.5H5', 'M11 2.5h2.5V5', 'M13.5 11v2.5H11', 'M5 13.5H2.5V11', 'M6 6h4v4H6z'],
	columns: ['M2.5 2.5h11v11h-11z', 'M6.2 2.5v11', 'M9.8 2.5v11'],
	rows: ['M2.5 2.5h11v11h-11z', 'M2.5 6.2h11', 'M2.5 9.8h11'],
	parent: ['M12.5 13V6.5H4', 'M6.5 4 4 6.5 6.5 9'],
	up: ['M8 13V3', 'M4.5 6.5 8 3l3.5 3.5'],
	down: ['M8 3v10', 'M4.5 9.5 8 13l3.5-3.5'],
	duplicate: ['M5.5 5.5h8v8h-8z', 'M3.5 10.5h-1v-8h8v1'],
	trash: ['M2.5 4.5h11', 'M6 4.5V2.5h4v2', 'M4 4.5l.7 9h6.6l.7-9'],
	stretch: ['M2.5 2.5h11', 'M2.5 13.5h11', 'M5 5h2v6H5z', 'M9 5h2v6H9z'],
};
</script>

<template>
	<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-4 shrink-0">
		<path v-for="(d, index) in paths[name] || []" :key="index" :d="d" />
	</svg>
</template>
