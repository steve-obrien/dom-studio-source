<script setup>
import { computed, ref } from 'vue';
import { DomAvatar, DomDropdown } from '@getdom/studio/vue';

const items = [
	{ value: 'sara', name: 'Sara Patel', role: 'Design', initials: 'SP', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
	{ value: 'tomas', name: 'Tomás Ruiz', role: 'Engineering', initials: 'TR', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
	{ value: 'priya', name: 'Priya Nair', role: 'Product', initials: 'PN', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
	{ value: 'leo', name: 'Leo Almeida', role: 'Operations', initials: 'LA', avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
];
const assigned = ref('sara');
const current = computed(() => items.find((i) => i.value === assigned.value));
</script>

<template>
	<DomDropdown :items="items" width="min-w-[16rem]" @select="(v) => assigned = v">
		<template #trigger>
			<span class="flex items-center gap-2">
				<DomAvatar :src="current?.avatar" :name="current?.name" :initials="current?.initials" size="xs" />
				<span>{{ current?.name }}</span>
			</span>
		</template>

		<template #item="{ item }">
			<div class="flex items-center gap-3">
				<DomAvatar :src="item.avatar" :name="item.name" :initials="item.initials" size="sm" />
				<div class="min-w-0">
					<p class="truncate text-sm font-medium text-fg">{{ item.name }}</p>
					<p class="truncate text-xs text-muted-fg">{{ item.role }}</p>
				</div>
			</div>
		</template>
	</DomDropdown>
</template>
