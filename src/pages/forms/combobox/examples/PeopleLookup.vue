<script setup>
import { DomAvatar, DomCombobox } from '@getdom/studio/vue';
import { ref } from 'vue';
import { highlightMatches } from '../../_shared/highlightMatches.js';

const value = ref('');
const people = [
	{ value: 'steve', label: 'Steve Obrien', role: 'Product designer', initials: 'SO' },
	{ value: 'robin', label: 'Robin <Ops>', role: 'Literal markup remains plain text', initials: 'RO' },
	{ value: 'ada', label: 'Ada Lovelace', role: 'Mathematician', initials: 'AL', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
	{ value: 'grace', label: 'Grace Hopper', role: 'Computer scientist', initials: 'GH', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
	{ value: 'katherine', label: 'Katherine Johnson', role: 'NASA mathematician', initials: 'KJ', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
];
</script>

<template>
	<div class="flex w-full max-w-md flex-col gap-2">
		<DomCombobox v-model="value" :options="people" label="Highlighted people" placeholder="Try typing ob or <Ops>" class="w-full">
			<template #item="{ item, query }">
				<div class="flex items-center gap-3">
					<DomAvatar :src="item.avatar" :name="item.label" :initials="item.initials" size="sm" />
					<span class="min-w-0">
						<span class="block truncate font-medium"><template v-for="(part, index) in highlightMatches(item.label, query)" :key="index"><mark v-if="part.matched" class="rounded-sm bg-primary/20 text-inherit">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></span>
						<span class="block truncate text-xs text-muted-fg">{{ item.role }}</span>
					</span>
				</div>
			</template>
		</DomCombobox>
		<p class="text-xs text-muted-fg">Selected value: <code class="text-canvas-fg">{{ value || '—' }}</code></p>
	</div>
</template>
