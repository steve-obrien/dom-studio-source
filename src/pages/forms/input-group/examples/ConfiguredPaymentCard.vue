<script setup>
import { ref } from 'vue';
import { DomButton, DomForm } from '@getdom/studio/vue';

const paymentCard = ref({
	cardNumber: '',
	expiry: '',
	cvc: '',
});

const paymentCardFields = [
	{
		id: 'card-information',
		component: 'DomInputGroup',
		props: {
			ariaLabel: 'Card information',
		},
		children: [
			{
				component: 'DomTextInput',
				props: {
					name: 'cardNumber',
					label: 'Card number',
					placeholder: '1234 1234 1234 1234',
					autocomplete: 'cc-number',
					chrome: false,
					required: true,
				},
			},
			{
				component: 'div',
				props: {
					class: 'grid grid-cols-2',
				},
				children: [
					{
						component: 'DomTextInput',
						props: {
							name: 'expiry',
							label: 'Expiry',
							placeholder: 'MM / YY',
							autocomplete: 'cc-exp',
							chrome: false,
							required: true,
						},
					},
					{
						component: 'div',
						props: {
							class: 'border-l border-border',
						},
						children: [
							{
								component: 'DomTextInput',
								props: {
									name: 'cvc',
									label: 'CVC',
									placeholder: 'CVC',
									autocomplete: 'cc-csc',
									chrome: false,
									required: true,
								},
							},
						],
					},
				],
			},
		],
	},
];
</script>

<template>
	<DomForm
		v-model="paymentCard"
		:children="paymentCardFields"
		label="Card information"
		class="w-full max-w-md space-y-4"
	>
		<DomButton type="submit" class="w-full">Continue</DomButton>
	</DomForm>
</template>
