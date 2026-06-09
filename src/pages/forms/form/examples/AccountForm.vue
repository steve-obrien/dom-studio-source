<script setup>
import { reactive, ref } from 'vue';
import { DomButton, DomEmailInput, DomForm, DomTextInput, DomUrlInput } from '../../../lib/vue';

const account = ref({
	name: '',
	email: '',
	website: '',
});

const lastSubmit = reactive({
	type: '',
	message: '',
});

function onSubmit({ values }) {
	lastSubmit.type = 'success';
	lastSubmit.message = `Ready to save ${values.name || 'this account'}.`;
}

function onInvalid({ errors }) {
	lastSubmit.type = 'danger';
	lastSubmit.message = `Fix ${Object.keys(errors).length} field before continuing.`;
}
</script>

<template>
	<div class="w-full max-w-md">
		<DomForm
			v-slot="{ values, errors, state }"
			v-model="account"
			class="space-y-4"
			@submit="onSubmit"
			@invalid="onInvalid"
		>
			<DomTextInput
				name="name"
				label="Name"
				placeholder="Ada Lovelace"
				required
			/>
			<DomEmailInput
				name="email"
				label="Email"
				required
			/>
			<DomUrlInput
				name="website"
				label="Website"
				:validate-on-blur="false"
			/>

			<div class="flex items-center justify-between gap-3">
				<DomButton type="submit">Create account</DomButton>
				<p class="text-xs text-muted-fg">
					{{ state.valid ? 'Valid' : `${state.errorCount} error${state.errorCount === 1 ? '' : 's'}` }}
				</p>
			</div>

			<p
				v-if="lastSubmit.message"
				class="rounded-lg border px-3 py-2 text-xs"
				:class="lastSubmit.type === 'success'
					? 'border-success/40 bg-success/10 text-success'
					: 'border-destructive/40 bg-destructive/10 text-destructive'"
			>
				{{ lastSubmit.message }}
			</p>

			<div class="grid gap-3 rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-fg sm:grid-cols-2">
				<pre class="overflow-auto font-mono">{{ values }}</pre>
				<pre class="overflow-auto font-mono">{{ errors }}</pre>
			</div>
		</DomForm>
	</div>
</template>
