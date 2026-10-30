<script setup>
import { DomAlert } from '../../../lib/vue';
import CloudSyncIcon from './CloudSyncIcon.vue';

const SHIELD_ICON = 'M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3ZM9.5 12l1.75 1.75L15 10';
</script>

<template>
	<div class="grid gap-3">
		<DomAlert
			tone="primary"
			title="Protected workflow"
			description="This alert uses SVG path data passed through the icon prop."
			:icon="SHIELD_ICON"
		/>

		<DomAlert
			tone="info"
			variant="outline"
			title="Cloud sync queued"
			description="This alert uses an imported Vue icon component, the same pattern as DomIconButton."
			:icon="CloudSyncIcon"
		/>

		<DomAlert
			tone="default"
			variant="toast"
			title="Text-only notice"
			description="Set icon to false when the message should rely on text and layout alone."
			:icon="false"
		/>
	</div>
</template>
