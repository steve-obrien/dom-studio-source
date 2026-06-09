<script setup>
import { ref } from 'vue';
import { DomField } from '@getdom/studio/vue';

const email = ref('');
</script>

<template>
	<div class="w-full max-w-sm">
		<DomField
			label="Email address"
			description="Used for account notifications and sign-in recovery."
			html-for="field-email"
			required
		>
			<input
				id="field-email"
				v-model="email"
				type="email"
				placeholder="steve@example.com"
				class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-fg outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
			/>
		</DomField>
		<p class="mt-3 text-xs text-muted-fg">Value: <code class="text-fg">{{ email || 'empty' }}</code></p>
	</div>
</template>
