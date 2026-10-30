<script setup>
import { ref } from 'vue';
import { DomJsonListInput } from '../../../lib/vue';

const people = ref([
	{
		value: 'person-1',
		label: 'Maya Patel',
		role: 'Product lead',
		avatar: 'https://i.pravatar.cc/96?img=47',
		meta: { team: 'Design systems', timezone: 'GMT' },
	},
	{
		value: 'person-2',
		label: 'Noah Hughes',
		role: 'Frontend engineer',
		avatar: 'https://i.pravatar.cc/96?img=12',
		meta: { team: 'Studio', timezone: 'CET' },
	},
]);

const schema = {
	type: 'array',
	label: 'People',
	items: {
		type: 'DomForm',
		properties: {
			value: {
				type: 'string',
				label: 'Value',
				placeholder: 'person-id',
			},
			label: {
				type: 'string',
				label: 'Name',
				placeholder: 'Person name',
			},
			role: {
				type: 'string',
				label: 'Role',
				placeholder: 'Role or title',
			},
			avatar: {
				type: 'url',
				label: 'Avatar URL',
				placeholder: 'https://...',
			},
			meta: {
				type: 'DomForm',
				label: 'Meta',
				properties: {
					team: {
						type: 'string',
						label: 'Team',
					},
					timezone: {
						type: 'string',
						label: 'Timezone',
					},
				},
			},
		},
	},
};
</script>

<template>
	<div class="w-full max-w-md rounded-2xl border border-border skin-card p-4 text-canvas-fg">
		<DomJsonListInput
			v-model="people"
			label="People"
			description="Compact mode is intended for inspectors and narrow panels."
			add-label="+ Add person"
			:schema="schema"
			compact
		/>
	</div>
</template>
