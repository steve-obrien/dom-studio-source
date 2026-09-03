<script setup>
import { DomButton, DomCard, DomTextInput } from '@getdom/studio';
</script>

<template>
	<main class="mx-auto max-w-lg p-8">
		<DomCard class="space-y-4 p-6">
			<DomTextInput name="email" label="Email" type="email" />
			<DomButton>Continue</DomButton>
		</DomCard>
	</main>
</template>
