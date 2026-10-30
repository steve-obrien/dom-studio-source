<script setup>
import { ref } from 'vue';
import {
	DomButton,
	DomForm,
	DomInputGroup,
	DomTextInput,
} from '@getdom/studio/vue';

const paymentCard = ref({
	cardNumber: '',
	expiry: '',
	cvc: '',
});
</script>

<template>
	<DomForm
		v-model="paymentCard"
		label="Card information"
		class="w-full max-w-md space-y-4"
	>
		<DomInputGroup aria-label="Card information">
			<DomTextInput
				name="cardNumber"
				label="Card number"
				placeholder="1234 1234 1234 1234"
				autocomplete="cc-number"
				:chrome="false"
				required
			/>

			<div class="grid grid-cols-2">
				<DomTextInput
					name="expiry"
					label="Expiry"
					placeholder="MM / YY"
					autocomplete="cc-exp"
					:chrome="false"
					required
				/>
				<div class="border-l border-border">
					<DomTextInput
						name="cvc"
						label="CVC"
						placeholder="CVC"
						autocomplete="cc-csc"
						:chrome="false"
						required
					/>
				</div>
			</div>
		</DomInputGroup>

		<DomButton type="submit" class="w-full">Continue</DomButton>
	</DomForm>
</template>
