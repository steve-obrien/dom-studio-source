<script setup>
import { computed, ref, watch } from 'vue';

defineOptions({
	__doc: {
		name: 'Avatar',
		tag: '<DomAvatar>',
		description: 'A compact identity primitive for people, teams, workspaces, and accounts.',
		playground: {
			initial: {
				name: 'Mina Patel',
				initials: 'MP',
				src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&crop=faces&w=96&h=96&q=80',
				size: 'md',
			},
		},
		slots: [
			{ name: 'fallback', description: 'Custom fallback content when no image is available.' },
		],
	},
});

const props = defineProps({
	src: {
		type: String,
		default: '',
		_edit: { description: 'Image URL.' },
	},
	alt: {
		type: String,
		default: '',
		_edit: { description: 'Image alt text. Leave empty when adjacent text already names the person or object.' },
	},
	name: {
		type: String,
		default: '',
		_edit: { description: 'Name used to generate fallback initials.' },
	},
	initials: {
		type: String,
		default: '',
		_edit: { description: 'Explicit fallback initials.' },
	},
	size: {
		type: String,
		default: 'md',
		_edit: { options: ['xs', 'sm', 'md', 'lg', 'xl'], description: 'Avatar size.' },
	},
	shape: {
		type: String,
		default: 'circle',
		_edit: { options: ['circle', 'rounded', 'square'], description: 'Avatar shape.' },
	},
});

const imageFailed = ref(false);

watch(() => props.src, () => {
	imageFailed.value = false;
});

const displayInitials = computed(() => {
	if (props.initials) return props.initials.slice(0, 3).toUpperCase();
	return props.name
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0))
		.join('')
		.toUpperCase() || '?';
});

const sizeClasses = {
	xs: 'size-6 text-[10px]',
	sm: 'size-8 text-xs',
	md: 'size-10 text-sm',
	lg: 'size-12 text-base',
	xl: 'size-16 text-lg',
};

const shapeClasses = {
	circle: 'rounded-full',
	rounded: 'rounded-xl',
	square: 'rounded-md',
};

const classes = computed(() => [
	'relative inline-grid shrink-0 place-items-center overflow-hidden bg-secondary font-semibold text-secondary-fg ring-1 ring-border',
	sizeClasses[props.size] || sizeClasses.md,
	shapeClasses[props.shape] || shapeClasses.circle,
]);

const showImage = computed(() => props.src && !imageFailed.value);
</script>

<template>
	<span :class="classes">
		<img
			v-if="showImage"
			:src="src"
			:alt="alt"
			class="size-full object-cover"
			@error="imageFailed = true"
		/>
		<slot v-else name="fallback">
			<span aria-hidden="true">{{ displayInitials }}</span>
		</slot>
	</span>
</template>
