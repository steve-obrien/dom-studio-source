<script setup>
import { ref } from 'vue';
import { DomButton, DomEmailInput, DomForm, DomSelect } from '@getdom/studio/vue';

const props = defineProps({
	defaultEmail: {
		type: String,
		default: '',
	},
});
const emit = defineEmits(['resolve', 'dismiss']);
const invite = ref({
	email: props.defaultEmail,
	role: 'editor',
});
const formMessage = ref('');
const roleOptions = [
	{ label: 'Admin', value: 'admin', description: 'Can manage billing, settings, and teammates.' },
	{ label: 'Editor', value: 'editor', description: 'Can publish changes and manage content.' },
	{ label: 'Viewer', value: 'viewer', description: 'Can review workspace activity.' },
];

/**
 * Resolve the dialog with normalized invitation data when the form is valid.
 *
 * @param {{ values: { email?: string, role?: string } }} payload Form submission payload.
 * @returns {void}
 */
function submit({ values }) {
	emit('resolve', {
		email: values.email.trim(),
		role: values.role,
	});
}

/**
 * Show validation guidance after DomForm reports an invalid submission.
 *
 * @returns {void}
 */
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
		<DomSelect
			name="role"
			label="Role"
			:options="roleOptions"
			required
		/>
		<p v-if="formMessage" class="text-xs text-destructive">{{ formMessage }}</p>
		<div class="flex items-center justify-end gap-2">
			<DomButton variant="secondary" type="button" @click="emit('dismiss')">Cancel</DomButton>
			<DomButton type="submit">Send invite</DomButton>
		</div>
	</DomForm>
</template>
