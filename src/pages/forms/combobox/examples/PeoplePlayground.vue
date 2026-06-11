<script setup>
import { reactive } from 'vue';
import { DomAvatar, DomCombobox } from '@getdom/studio/vue';

const data = reactive({
	modelValue: 'ada',
	options: [
		{ value: 'ada', label: 'Ada Lovelace', role: 'Mathematician', initials: 'AL', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
		{ value: 'grace', label: 'Grace Hopper', role: 'Computer scientist', initials: 'GH', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
		{ value: 'katherine', label: 'Katherine Johnson', role: 'NASA mathematician', initials: 'KJ', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&crop=faces&w=96&h=96&q=80' },
	],
	placeholder: 'Assign a person',
	placement: 'bottom',
	floatingMode: 'viewport',
	clearable: true,
	loading: false,
});

defineExpose({ data });
</script>

<template>
	<div class="flex w-full max-w-md flex-col gap-2">
		<DomCombobox
			v-model="data.modelValue"
			:options="data.options"
			:placeholder="data.placeholder"
			:placement="data.placement"
			:floating-mode="data.floatingMode"
			:clearable="data.clearable"
			:loading="data.loading"
			class="w-full"
		>
			<template #item="{ item }">
				<div class="flex min-w-0 items-center gap-3">
					<DomAvatar :src="item.avatar" :name="item.label" :initials="item.initials" size="sm" />
					<span class="min-w-0">
						<span class="block truncate font-medium">{{ item.label }}</span>
						<span class="block truncate text-xs text-muted-fg">{{ item.role }}</span>
					</span>
				</div>
			</template>
		</DomCombobox>
		<p class="text-xs text-muted-fg">Selected value: <code class="text-fg">{{ data.modelValue || '—' }}</code></p>
	</div>
</template>
