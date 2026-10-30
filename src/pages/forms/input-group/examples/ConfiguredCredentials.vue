<script setup>
import { ref } from 'vue';
import { DomButton, DomForm } from '@getdom/studio/vue';

const credentials = ref({
	email: '',
	password: '',
});

const credentialFields = [
	{
		id: 'credentials',
		component: 'DomInputGroup',
		props: {
			ariaLabel: 'Account credentials',
		},
		children: [
			{
				component: 'DomEmailInput',
				props: {
					name: 'email',
					label: 'Email',
					placeholder: 'you@example.com',
					chrome: false,
					required: true,
				},
			},
			{
				component: 'DomPasswordInput',
				props: {
					name: 'password',
					label: 'Password',
					placeholder: 'Enter your password',
					autocomplete: 'new-password',
					chrome: false,
					showStrength: false,
					required: true,
				},
			},
			{
				component: 'DomPasswordStrength',
				slot: 'feedback',
				props: {
					name: 'password',
					descriptionMode: 'tooltip',
				},
			},
		],
	},
];
</script>

<template>
	<DomForm v-model="credentials" :children="credentialFields" class="w-full max-w-md space-y-4">
		<DomButton type="submit" class="w-full">Create account</DomButton>
	</DomForm>
</template>
