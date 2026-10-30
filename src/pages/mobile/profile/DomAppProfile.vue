<script setup>
import DomAvatar from '../../visual/avatar/DomAvatar.vue';
import DomButton from '../../components/button/DomButton.vue';

defineOptions({
	__doc: {
		name: 'App profile',
		tag: '<DomAppProfile>',
		description: 'An iOS-style account header with a circular profile image, name, email, and an optional action. Place it above settings rows or inside any app stack screen.',
		slots: [{ name: 'actions', description: 'Replace the default profile action with account controls.' }],
		events: [{ name: 'action', payload: '()', description: 'Fired when the profile action is selected. The application owns navigation or editing.' }],
		playground: {
			mobileSlot: 'content',
			initial: {
				name: 'Alex Morgan',
				email: 'alex@example.com',
				src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&crop=faces&w=192&h=192&q=80',
			},
		},
	},
});

defineProps({
	name: { type: String, required: true, _edit: { description: 'Account holder name; also supplies initials if the image is unavailable.' } },
	email: { type: String, default: '', _edit: { description: 'Optional account email shown below the name.' } },
	src: { type: String, default: '', _edit: { description: 'Profile image URL. Falls back to initials if it cannot load.' } },
	actionLabel: { type: String, default: 'Edit profile', _edit: { description: 'Profile action label. Set to an empty string to hide the default action.' } },
});

defineEmits(['action']);
</script>

<template>
	<section class="flex flex-col items-center px-4 pt-5 pb-2 text-center" :aria-label="`${name} profile`">
		<DomAvatar :name="name" :src="src" size="xl" class="size-20! bg-primary/10! text-2xl! text-primary! ring-0!" />
		<h2 class="mt-4 max-w-full break-words text-2xl font-semibold tracking-tight text-canvas-fg">{{ name }}</h2>
		<p v-if="email" class="mt-1 max-w-full break-words text-sm text-muted-fg">{{ email }}</p>
		<slot name="actions">
			<DomButton v-if="actionLabel" type="button" variant="ghost" class="mt-1 min-h-11 text-primary" @click="$emit('action')">{{ actionLabel }}</DomButton>
		</slot>
	</section>
</template>
