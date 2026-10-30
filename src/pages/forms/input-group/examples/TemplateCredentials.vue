<script setup>
import { ref } from 'vue';
import {
	DomButton,
	DomEmailInput,
	DomForm,
	DomInputGroup,
	DomPasswordInput,
	DomPasswordStrength,
} from '@getdom/studio/vue';

const credentials = ref({
	email: '',
	password: '',
});
</script>

<template>
	<DomForm v-model="credentials" class="w-full max-w-md space-y-4">
		<DomInputGroup aria-label="Account credentials">
			<DomEmailInput
				name="email"
				label="Email"
				placeholder="you@example.com"
				:chrome="false"
				required
			/>
			<DomPasswordInput
				name="password"
				label="Password"
				placeholder="Enter your password"
				autocomplete="new-password"
				:chrome="false"
				:show-strength="false"
				required
			/>

			<template #feedback>
				<DomPasswordStrength name="password" description-mode="tooltip" />
			</template>
		</DomInputGroup>

		<DomButton type="submit" class="w-full">Create account</DomButton>
	</DomForm>
</template>
