<script setup>
import { ref } from 'vue';
import { DomToggle } from '@getdom/studio/vue';

const compact = ref(true);
const notifications = ref(false);
const sync = ref(true);
</script>

<template>
	<div class="grid w-full max-w-md gap-5">
		<DomToggle v-model="compact" show-state size="sm" label="Compact view" />
		<DomToggle v-model="notifications" show-state label="Notifications" />
		<DomToggle v-model="sync" show-state size="lg" label="Automatic sync" />
	</div>
</template>
