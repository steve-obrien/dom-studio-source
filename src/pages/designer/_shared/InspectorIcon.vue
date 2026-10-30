<script setup>
/**
 * Small 16px line icons for the designer inspector: layout modes, directions,
 * spacing, layer actions, paints, effects and text. Purely decorative;
 * controls supply the label. A path starting with `!` is filled.
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
	pointer: ['M3.5 2.5l9 5.4-4 1.2-1.9 4.4z'],
	hand: ['M11.5 7.5V4a1.25 1.25 0 0 0-2.5 0', 'M9 7V2.75a1.25 1.25 0 0 0-2.5 0V4', 'M6.5 7.5V4a1.25 1.25 0 0 0-2.5 0v5.5', 'M11.5 5.25a1.25 1.25 0 0 1 2.5 0v3.75a5.5 5.5 0 0 1-5.5 5.5H7.5c-1.9 0-3-.6-4-1.6L1.9 11a1.25 1.25 0 0 1 1.8-1.8L4 9.5'],
	plus: ['M8 3v10', 'M3 8h10'],
	minus: ['M3.5 8h9'],
	close: ['M4.5 4.5l7 7', 'M11.5 4.5l-7 7'],
	eye: ['M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z', 'M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
	'eye-off': ['M2.5 2.5l11 11', 'M6.6 6.6a2 2 0 0 0 2.8 2.8', 'M4.3 4.9C2.6 6 1.5 8 1.5 8s2.5 4.5 6.5 4.5c1 0 2-.3 2.9-.7', 'M12.6 10.6C13.8 9.5 14.5 8 14.5 8S12 3.5 8 3.5c-.6 0-1.1.1-1.6.2'],
	lock: ['M3.5 7.5h9v6h-9z', 'M5.5 7.5V5a2.5 2.5 0 0 1 5 0v2.5'],
	unlock: ['M3.5 7.5h9v6h-9z', 'M5.5 7.5V5a2.5 2.5 0 0 1 4.9-.7'],
	settings: ['M2.5 4.5h6', 'M11.5 4.5h2', 'M2.5 11.5h2', 'M7.5 11.5h6', 'M10 3v3', 'M6 10v3'],
	'fill-solid': ['!M3 3h10v10H3z'],
	'fill-linear': ['M2.5 2.5h11v11h-11z', '!M2.5 2.5h4v11h-4z', 'M9.5 2.5v11'],
	'fill-radial': ['M2.5 2.5h11v11h-11z', '!M8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z', 'M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
	'shadow-drop': ['M2.5 2.5h8v8h-8z', 'M12.5 5v7.5H5'],
	'shadow-inset': ['M2.5 2.5h11v11h-11z', 'M5 11V5h6'],
	'shadow-ring': ['M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z', 'M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z'],
	spread: ['M5.5 5.5h5v5h-5z', 'M2.5 8H4', 'M12 8h1.5', 'M8 2.5V4', 'M8 12v1.5'],
	blur: ['M8 2.5a5.5 5.5 0 1 0 0 11', 'M8 2.5v11', 'M10.5 3.2v9.6', 'M13 5.5v5'],
	saturate: ['M8 2.5 4.6 7.6a3.9 3.9 0 1 0 6.8 0z'],
	angle: ['M2.5 13h11', 'M2.5 13 11 4.5', 'M7.5 13a5 5 0 0 0-1.5-3.5'],
	'stroke-weight': ['M2.5 4h11', 'M2.5 8h11', 'M2.5 12h11'],
	'stroke-style': ['M2.5 8h2.5', 'M6.75 8h2.5', 'M11 8h2.5'],
	radius: ['M2.5 13.5V8a5.5 5.5 0 0 1 5.5-5.5h5.5'],
	opacity: ['M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z', '!M8 2.5a5.5 5.5 0 0 1 0 11z'],
	text: ['M3 3.5h10', 'M8 3.5v9', 'M6 12.5h4'],
	'font-size': ['M2 5V3.5h7V5', 'M5.5 3.5v9', 'M4 12.5h3', 'M10 8.5V7.5h4.5v1', 'M12.25 7.5v5', 'M11.25 12.5h2'],
	'line-height': ['M2.5 2.5h11', 'M2.5 13.5h11', 'M5.5 11 8 5l2.5 6', 'M6.3 9.2h3.4'],
	'letter-spacing': ['M2 2.5v11', 'M14 2.5v11', 'M5.5 11 8 5l2.5 6', 'M6.3 9.2h3.4'],
	'align-left': ['M2.5 3.5h11', 'M2.5 6.5h7', 'M2.5 9.5h11', 'M2.5 12.5h7'],
	'align-center': ['M2.5 3.5h11', 'M4.5 6.5h7', 'M2.5 9.5h11', 'M4.5 12.5h7'],
	'align-right': ['M2.5 3.5h11', 'M6.5 6.5h7', 'M2.5 9.5h11', 'M6.5 12.5h7'],
	'align-justify': ['M2.5 3.5h11', 'M2.5 6.5h11', 'M2.5 9.5h11', 'M2.5 12.5h11'],
	bold: ['M4.5 2.5h4.25a2.75 2.75 0 0 1 0 5.5H4.5z', 'M4.5 8h5a2.75 2.75 0 0 1 0 5.5h-5z'],
	italic: ['M7 2.5h5', 'M4 13.5h5', 'M10 2.5 6 13.5'],
	underline: ['M4.5 2.5v4.5a3.5 3.5 0 0 0 7 0V2.5', 'M3.5 13.5h9'],
	strike: ['M2.5 8h11', 'M11 4.6C10.5 3.3 9.4 2.5 8 2.5c-1.8 0-3 .9-3 2.3 0 .9.6 1.6 1.7 2', 'M5 11.2c.4 1.4 1.6 2.3 3.2 2.3 1.9 0 3.3-1 3.3-2.5 0-.6-.2-1-.5-1.4'],
};
</script>

<template>
	<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-4 shrink-0">
		<path v-for="(d, index) in paths[name] || []" :key="index" :d="d.replace(/^!/, '')" :fill="d.startsWith('!') ? 'currentColor' : undefined" :stroke="d.startsWith('!') ? 'none' : undefined" />
	</svg>
</template>
