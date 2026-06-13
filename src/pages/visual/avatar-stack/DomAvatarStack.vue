<script setup>
import { computed } from 'vue';
import DomAvatar from '../avatar/DomAvatar.vue';

defineOptions({
	__doc: {
		name: 'Avatar stack',
		tag: '<DomAvatarStack>',
		description: 'A grouped identity primitive for collaborators, assignees, reviewers, and participants.',
		playground: {
			initial: {
				items: [
					{ name: 'Mina Patel', initials: 'MP', src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
					{ name: 'Ari Chen', initials: 'AC', src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
					{ name: 'Noah Kim', initials: 'NK', src: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
					{ name: 'Leah Stone', initials: 'LS', src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
					{ name: 'Theo Grant', initials: 'TG', src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
				],
				max: 4,
			},
		},
		slots: [
			{ name: 'avatar', payload: '{ item, index }', description: 'Custom avatar rendering for each visible item.' },
		],
	},
});

const props = defineProps({
	items: {
		type: Array,
		default: () => [],
		_edit: {
			component: 'DomJsonListInput',
			description: 'People, teams, or workspace records.',
			props: {
				compact: true,
				schema: [
					{ key: 'name', label: 'Name', placeholder: 'Ada Lovelace' },
					{ key: 'src', label: 'Image URL', type: 'url', placeholder: 'https://...' },
					{ key: 'initials', label: 'Initials', placeholder: 'AL' },
				],
			},
		},
	},
	max: {
		type: Number,
		default: 4,
		_edit: { description: 'Maximum avatars to show before the overflow count.' },
	},
	size: {
		type: String,
		default: 'sm',
		_edit: { options: ['xs', 'sm', 'md', 'lg'], description: 'Avatar size.' },
	},
	label: {
		type: String,
		default: 'Participants',
		_edit: { description: 'Accessible label for the stack.' },
	},
});

const visibleItems = computed(() => props.items.slice(0, Math.max(0, props.max)));
const overflow = computed(() => Math.max(0, props.items.length - visibleItems.value.length));
</script>

<template>
	<div class="inline-flex items-center -space-x-2" role="group" :aria-label="label">
		<template v-for="(item, index) in visibleItems" :key="item.value || item.name || index">
			<slot name="avatar" :item="item" :index="index">
				<DomAvatar
					:src="item.src || item.avatar"
					:alt="item.alt || ''"
					:name="item.name || item.label"
					:initials="item.initials"
					:size="size"
					class="ring-2 ring-canvas"
				/>
			</slot>
		</template>
		<span
			v-if="overflow"
			class="grid shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-fg ring-2 ring-canvas"
			:class="{ xs: 'size-6 text-[10px]', sm: 'size-8', md: 'size-10', lg: 'size-12' }[size] || 'size-8'"
			:aria-label="`${overflow} more`"
		>
			+{{ overflow }}
		</span>
	</div>
</template>
