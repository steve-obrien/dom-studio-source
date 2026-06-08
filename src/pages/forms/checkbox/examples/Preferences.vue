<script setup>
import { ref } from 'vue';
import { DomCheckbox } from '@getdom/studio/vue';

const product = ref(true);
const security = ref(false);
</script>

<template>
	<div class="grid w-full max-w-md gap-4">
		<DomCheckbox v-model="product" label="Product updates" description="Occasional release notes and feature announcements." />
		<DomCheckbox v-model="security" label="Security alerts" description="Important account and login notifications." />
	</div>
</template>
