<script setup>
import { ref } from 'vue';
import { DomJsonInput } from '../../../lib/vue';

const config = ref({
	teamName: 'Platform team',
	ownerEmail: 'platform@example.com',
	defaultRole: 'member',
	active: true,
	billing: {
		name: 'Alex Morgan',
		email: 'billing@example.com',
	},
	invites: [
		{ email: 'maya@example.com', role: 'admin' },
		{ email: 'noah@example.com', role: 'viewer' },
	],
});

const schema = {
	type: 'DomForm',
	properties: {
		teamName: {
			type: 'string',
			label: 'Team name',
			required: true,
			placeholder: 'Platform team',
		},
		ownerEmail: {
			type: 'email',
			label: 'Owner email',
			required: true,
		},
		defaultRole: {
			type: 'string',
			component: 'DomSelectInput',
			label: 'Default role',
			options: [
				{ label: 'Admin', value: 'admin' },
				{ label: 'Member', value: 'member' },
				{ label: 'Viewer', value: 'viewer' },
			],
		},
		active: {
			type: 'boolean',
			label: 'Active team',
		},
		billing: {
			type: 'DomForm',
			label: 'Billing contact',
			properties: {
				name: {
					type: 'string',
					label: 'Contact name',
				},
				email: {
					type: 'email',
					label: 'Contact email',
				},
			},
		},
		invites: {
			type: 'array',
			label: 'Invites',
			items: {
				type: 'DomForm',
				properties: {
					email: {
						type: 'email',
						label: 'Invitee email',
						required: true,
					},
					role: {
						type: 'string',
						component: 'DomSelectInput',
						label: 'Role',
						options: [
							'admin',
							'member',
							'viewer',
						],
					},
				},
			},
		},
	},
};
</script>

<template>
	<div class="grid w-full max-w-4xl gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
		<DomJsonInput
			v-model="config"
			label="Team setup"
			description="The same schema renders field controls and a raw JSON editor."
			:schema="schema"
			:rows="15"
		/>
		<pre class="max-h-[34rem] overflow-auto rounded-xl border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">{{ config }}</pre>
	</div>
</template>
