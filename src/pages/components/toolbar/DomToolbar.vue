<script setup>
import { computed } from 'vue';

const toolbarControlHeights = {
	xs: '1.75rem',
	sm: '2rem',
	md: '2.5rem',
	lg: '3rem',
};
const toolbarControlRadiusValues = {
	none: '0',
	sm: '0.125rem',
	md: '0.375rem',
	lg: '0.5rem',
	xl: '0.75rem',
	'2xl': '1rem',
	full: '9999px',
};
const toolbarSkinClasses = {
	control: 'skin-control rounded-2xl p-1',
	card: 'skin-card rounded-2xl p-1',
	flat: 'bg-transparent',
	none: '',
};

defineOptions({
	__doc: {
		name: 'Toolbar',
		tag: '<DomToolbar>',
		description: 'A compact action surface for icon buttons, segmented controls, filters, and overflow menus.',
		slots: [
			{ name: '(default)', description: 'Toolbar controls.' },
		],
	},
});

const props = defineProps({
	as: {
		type: String,
		default: 'div',
		_edit: { description: 'Element to render.' },
	},
	label: {
		type: String,
		default: 'Toolbar',
		_edit: { description: 'Accessible toolbar label.' },
	},
	orientation: {
		type: String,
		default: 'horizontal',
		_edit: { options: ['horizontal', 'vertical'], description: 'Toolbar direction.' },
	},
	align: {
		type: String,
		default: 'start',
		_edit: { options: ['start', 'center', 'end', 'between'], description: 'Control alignment.' },
	},
	wrap: {
		type: Boolean,
		default: true,
		_edit: { description: 'Allow controls to wrap on narrow screens.' },
	},
	skin: {
		type: [String, Boolean],
		default: null,
		_edit: { options: ['control', 'card', 'flat', 'none', false], description: 'Toolbar surface skin. Use flat when the parent supplies border, padding, or background chrome.' },
	},
	inset: {
		type: Boolean,
		default: false,
		_edit: { description: 'Use card skin instead of control skin. Prefer skin="card" for new usage.' },
	},
	controlSize: {
		type: String,
		default: 'md',
		_edit: { options: ['xs', 'sm', 'md', 'lg'], description: 'Shared toolbar control height for buttons, dropdowns, and select triggers.' },
	},
	controlHeight: {
		type: String,
		default: '',
		_edit: { description: 'Explicit CSS height for toolbar controls. Overrides controlSize when provided.' },
	},
	controlRadius: {
		type: String,
		default: 'full',
		_edit: { options: ['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'], description: 'Shared corner radius for toolbar buttons, dropdowns, and select triggers.' },
	},
});

/**
 * Resolves the toolbar skin while preserving the older inset prop contract.
 *
 * @returns {'control'|'card'|'flat'|'none'} Resolved toolbar skin.
 */
function resolveToolbarSkin() {
	if (props.skin === false || props.skin === 'none') return 'none';
	if (props.skin) return props.skin;
	return props.inset ? 'card' : 'control';
}

/**
 * Resolves the CSS height used to normalize controls inside the toolbar.
 *
 * @returns {string} CSS length for toolbar controls.
 */
function resolveToolbarControlHeight() {
	return props.controlHeight || toolbarControlHeights[props.controlSize] || toolbarControlHeights.md;
}

/**
 * Resolves the CSS border radius used to normalize controls inside the toolbar.
 *
 * @returns {string} CSS radius for toolbar controls.
 */
function resolveToolbarControlRadius() {
	return toolbarControlRadiusValues[props.controlRadius] || toolbarControlRadiusValues.full;
}

const resolvedSkin = computed(resolveToolbarSkin);
const classes = computed(() => [
	'dom-toolbar inline-flex gap-1',
	toolbarSkinClasses[resolvedSkin.value] ?? toolbarSkinClasses.control,
	props.orientation === 'vertical' ? 'flex-col' : 'flex-row items-center',
	props.wrap && props.orientation !== 'vertical' && 'flex-wrap',
	{
		start: 'justify-start',
		center: 'justify-center',
		end: 'justify-end',
		between: 'justify-between',
	}[props.align] || 'justify-start',
]);
const styles = computed(() => ({
	'--dom-toolbar-control-height': resolveToolbarControlHeight(),
	'--dom-toolbar-control-radius': resolveToolbarControlRadius(),
}));
</script>

<template>
	<component :is="as" role="toolbar" :aria-label="label" :aria-orientation="orientation" :class="classes" :style="styles">
		<slot />
	</component>
</template>

<style scoped>
.dom-toolbar {
	--dom-toolbar-control-height: 2.5rem;
	--dom-toolbar-control-radius: 9999px;
}

.dom-toolbar :deep(button),
.dom-toolbar :deep([role="button"]),
.dom-toolbar :deep([slot="trigger"]),
.dom-toolbar :deep(.dom-toolbar-control) {
	border-radius: var(--dom-toolbar-control-radius);
	height: var(--dom-toolbar-control-height);
	min-height: var(--dom-toolbar-control-height);
}
</style>
