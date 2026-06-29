<script setup>
import { ref } from 'vue';
import { DomIconSelector } from '../../../lib/vue';

const reaction = ref('🚀');
</script>

<template>
	<div class="grid gap-4 sm:grid-cols-[minmax(0,22rem)_1fr] sm:items-start">
		<DomIconSelector
			v-model="reaction"
			kind="emoji"
			label="Reaction"
			description="Use the same searchable selector shape for emoji values."
			placeholder="Search emoji"
		/>

		<div class="flex min-h-24 items-center justify-center rounded-xl border border-border bg-secondary/40 text-5xl">
			{{ reaction }}
		</div>
	</div>
</template>
