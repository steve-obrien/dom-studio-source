<script setup>
import { computed } from 'vue';

defineOptions({
	__doc: {
		name: 'Alert',
		tag: '<DomAlert>',
		description: 'A persistent inline notice for status messages, policy warnings, empty-flow guidance, and recoverable errors.',
		icon: 'M12 17v-5M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
		playground: {
			initial: {
				tone: 'info',
				variant: 'soft',
				title: 'Information available',
				description: 'Review the latest status details before continuing.',
			},
		},
		slots: [
			{ name: 'icon', description: 'Replace the leading status icon. Prefer the icon prop for SVG path data or imported Vue icon components.' },
			{ name: 'title', description: 'Replace the title content.' },
			{ name: '(default)', description: 'Alert body. Falls back to the description prop.' },
			{ name: 'actions', description: 'Action buttons or links aligned below the message.' },
		],
	},
});

const props = defineProps({
	as: {
		type: String,
		default: 'div',
		_edit: { description: 'Element to render.' },
	},
	tone: {
		type: String,
		default: 'info',
		_edit: {
			options: ['default', 'info', 'neutral', 'primary', 'success', 'warning', 'danger'],
			description: 'Semantic alert tone.',
		},
	},
	variant: {
		type: String,
		default: 'soft',
		_edit: {
			options: ['soft', 'outline', 'solid', 'toast'],
			description: 'Visual weight.',
		},
	},
	title: {
		type: String,
		default: 'Notice',
		_edit: { description: 'Fallback title when the title slot is empty.' },
	},
	description: {
		type: String,
		default: '',
		_edit: { description: 'Fallback body copy when the default slot is empty.' },
	},
	icon: {
		type: [Boolean, String, Object, Function],
		default: true,
		_edit: {
			component: 'DomIconSelector',
			typeRef: 'boolean | string | Component',
			description: 'Show a tone icon, hide it with false, pass SVG path data, or pass an imported Vue icon component.',
			props: {
				kind: 'icons',
				placeholder: 'Search icons',
			},
		},
	},
	role: {
		type: String,
		default: '',
		_edit: { description: 'ARIA role override. Danger and warning default to alert; other tones default to status.' },
	},
});

const toneIconPaths = {
	default: 'M12 17v-5M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
	info: 'M12 17v-5M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
	neutral: 'M12 17v-5M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
	primary: 'M13 3 4 14h7l-1 7 9-11h-7l1-7Z',
	success: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM8.5 12.5l2.5 2.5 4.5-5',
	warning: 'M12 4l9 16H3L12 4ZM12 9v4M12 17h.01',
	danger: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM15 9l-6 6M9 9l6 6',
};

const toneClasses = {
	default: {
		soft: 'border-border bg-secondary/70 text-canvas-fg',
		outline: 'border-border bg-canvas text-canvas-fg',
		solid: 'border-border bg-secondary text-secondary-fg',
		toast: 'skin-popover border-l-4 border-border text-canvas-fg shadow-md',
		icon: 'text-muted-fg',
		solidIcon: 'text-secondary-fg',
		solidDescription: 'text-secondary-fg/80',
	},
	neutral: {
		soft: 'border-border bg-secondary/70 text-canvas-fg',
		outline: 'border-border bg-canvas text-canvas-fg',
		solid: 'border-border bg-secondary text-secondary-fg',
		toast: 'skin-popover border-l-4 border-border text-canvas-fg shadow-md',
		icon: 'text-muted-fg',
		solidIcon: 'text-secondary-fg',
		solidDescription: 'text-secondary-fg/80',
	},
	primary: {
		soft: 'border-primary/20 bg-primary/10 text-canvas-fg',
		outline: 'border-primary/35 bg-canvas text-canvas-fg',
		solid: 'border-primary bg-primary text-primary-fg',
		toast: 'skin-popover border-l-4 border-primary/35 text-canvas-fg shadow-md',
		icon: 'text-primary',
		solidIcon: 'text-primary-fg',
		solidDescription: 'text-primary-fg/80',
	},
	success: {
		soft: 'border-success/25 bg-success/10 text-canvas-fg',
		outline: 'border-success/35 bg-canvas text-canvas-fg',
		solid: 'border-success bg-success text-success-fg',
		toast: 'skin-popover border-l-4 border-success/35 text-canvas-fg shadow-md',
		icon: 'text-success',
		solidIcon: 'text-success-fg',
		solidDescription: 'text-success-fg/85',
	},
	warning: {
		soft: 'border-warning/30 bg-warning/15 text-canvas-fg',
		outline: 'border-warning/40 bg-canvas text-canvas-fg',
		solid: 'border-warning bg-warning text-warning-fg',
		toast: 'skin-popover border-l-4 border-warning/40 text-canvas-fg shadow-md',
		icon: 'text-warning-fg',
		solidIcon: 'text-warning-fg',
		solidDescription: 'text-warning-fg/75',
	},
	danger: {
		soft: 'border-destructive/25 bg-destructive/10 text-canvas-fg',
		outline: 'border-destructive/40 bg-canvas text-canvas-fg',
		solid: 'border-destructive bg-destructive text-destructive-fg',
		toast: 'skin-popover border-l-4 border-destructive/40 text-canvas-fg shadow-md',
		icon: 'text-destructive',
		solidIcon: 'text-destructive-fg',
		solidDescription: 'text-destructive-fg/85',
	},
	info: {
		soft: 'border-primary/20 bg-primary/10 text-canvas-fg',
		outline: 'border-primary/30 bg-canvas text-canvas-fg',
		solid: 'border-primary bg-primary text-primary-fg',
		toast: 'skin-popover border-l-4 border-primary/30 text-canvas-fg shadow-md',
		icon: 'text-primary',
		solidIcon: 'text-primary-fg',
		solidDescription: 'text-primary-fg/80',
	},
};

const resolvedTone = computed(getResolvedTone);
const resolvedVariant = computed(getResolvedVariant);
const classes = computed(getClasses);
const iconClass = computed(getIconClass);
const descriptionClass = computed(getDescriptionClass);
const showIcon = computed(getShowIcon);
const iconPath = computed(getIconPath);
const iconComponent = computed(getIconComponent);
const resolvedRole = computed(getResolvedRole);

/**
 * Resolves unknown tones to the general information treatment.
 *
 * @returns {string}
 */
function getResolvedTone() {
	return toneClasses[props.tone] ? props.tone : 'info';
}

/**
 * Resolves unknown variants to the soft alert treatment.
 *
 * @returns {string}
 */
function getResolvedVariant() {
	return toneClasses[resolvedTone.value][props.variant] ? props.variant : 'soft';
}

/**
 * Builds the outer alert class list for the active tone and variant.
 *
 * @returns {Array<string>}
 */
function getClasses() {
	return [
		'rounded-lg border px-4 py-3 text-sm shadow-sm',
		toneClasses[resolvedTone.value][resolvedVariant.value],
	];
}

/**
 * Builds the icon class list while preserving solid alert contrast.
 *
 * @returns {Array<string>}
 */
function getIconClass() {
	const tone = toneClasses[resolvedTone.value];
	return [
		'mt-0.5 size-5 shrink-0',
		resolvedVariant.value === 'solid' ? tone.solidIcon : tone.icon,
	];
}

/**
 * Builds the body-copy class list while preserving solid alert contrast.
 *
 * @returns {Array<string>}
 */
function getDescriptionClass() {
	return [
		'mt-1 leading-6',
		resolvedVariant.value === 'solid'
			? toneClasses[resolvedTone.value].solidDescription
			: 'text-muted-fg',
	];
}

/**
 * Determines whether the leading icon slot or fallback icon should render.
 *
 * @returns {boolean}
 */
function getShowIcon() {
	return props.icon !== false;
}

/**
 * Resolves SVG path data from an explicit path string or the active tone.
 *
 * @returns {string}
 */
function getIconPath() {
	if (typeof props.icon === 'string') return props.icon;
	if (iconComponent.value) return '';
	return toneIconPaths[resolvedTone.value] || toneIconPaths.info;
}

/**
 * Resolves imported Vue icon components without treating SVG path strings as component names.
 *
 * @returns {import('vue').Component|null}
 */
function getIconComponent() {
	if (!props.icon || typeof props.icon === 'boolean' || typeof props.icon === 'string') return null;
	return props.icon;
}

/**
 * Resolves the live-region role from explicit props and the alert tone.
 *
 * @returns {string}
 */
function getResolvedRole() {
	if (props.role) return props.role;
	return ['danger', 'warning'].includes(resolvedTone.value) ? 'alert' : 'status';
}
</script>

<template>
	<component :is="as" :class="classes" :role="resolvedRole">
		<div class="flex gap-3">
			<slot v-if="showIcon" name="icon">
				<component v-if="iconComponent" :is="iconComponent" :class="iconClass" aria-hidden="true" focusable="false" />
				<svg v-else-if="iconPath" :class="iconClass" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path :d="iconPath" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</slot>
			<div class="min-w-0 flex-1">
				<p class="font-semibold leading-6">
					<slot name="title">{{ title }}</slot>
				</p>
				<div v-if="$slots.default || description" :class="descriptionClass">
					<slot>{{ description }}</slot>
				</div>
				<div v-if="$slots.actions" class="mt-3 flex flex-wrap gap-2">
					<slot name="actions"></slot>
				</div>
			</div>
		</div>
	</component>
</template>
