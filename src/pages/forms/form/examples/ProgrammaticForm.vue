<script setup>
import { ref } from 'vue';
import { DomButton, DomEmailInput, DomForm, DomTextInput, DomUrlInput, forms } from '../../../lib/vue';

const profile = ref({
	name: 'Grace Hopper',
	email: 'grace@example.com',
	website: 'https://example.com',
});

async function validateProfile() {
	await forms.profile.validate();
}

function setExternalValues() {
	forms.profile.setFieldValue('name', 'Katherine Johnson');
	forms.profile.setFieldValue('email', 'katherine@example.com');
	forms.profile.setFieldValue('website', 'not a url');
}
</script>

<template>
	<div class="w-full max-w-md">
		<DomForm name="profile" v-model="profile" class="space-y-4">
			<DomTextInput name="name" label="Name" />
			<DomEmailInput name="email" label="Email" />
			<DomUrlInput name="website" label="Website" :validate-on-blur="false" />

			<div class="flex flex-wrap gap-2">
				<DomButton type="button" variant="secondary" @click="setExternalValues">Set externally</DomButton>
				<DomButton type="button" @click="validateProfile">Validate</DomButton>
			</div>
		</DomForm>

		<pre class="mt-4 overflow-auto rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-fg">{{ profile }}</pre>
	</div>
</template>
