<script setup>
import { ref } from 'vue';
import { DomButton, DomEmailInput, DomForm } from '@getdom/studio/vue';

const props = defineProps({
	defaultEmail: {
		type: String,
		default: '',
	},
});
const emit = defineEmits(['resolve', 'dismiss']);
const invite = ref({ email: props.defaultEmail });
const formMessage = ref('');

function submit({ values }) {
	emit('resolve', { email: values.email.trim() });
}

function invalid() {
	formMessage.value = 'Enter a valid email address before sending.';
}
</script>

<template>
	<DomForm
		v-model="invite"
		class="space-y-4"
		@change="formMessage = ''"
		@invalid="invalid"
		@submit="submit"
	>
		<DomEmailInput
			name="email"
			label="Email"
			placeholder="maya@example.com"
			required
		/>
		<p v-if="formMessage" class="text-xs text-destructive">{{ formMessage }}</p>
		<div class="flex items-center justify-end gap-2">
			<DomButton variant="secondary" type="button" @click="emit('dismiss')">Cancel</DomButton>
			<DomButton type="submit">Send invite</DomButton>
		</div>
	</DomForm>
</template>
