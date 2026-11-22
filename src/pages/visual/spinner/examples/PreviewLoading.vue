<script setup>
import { DomSpinner } from '@getdom/studio/vue';
</script>

<template>
	<div
		data-theme="dark"
		class="grid min-h-48 w-full max-w-lg place-content-center justify-items-center gap-4 rounded-xl border border-border bg-canvas px-4 py-8 text-center text-canvas-fg"
		role="status"
	>
		<DomSpinner
			aria-hidden="true"
			variant="tail"
			size="lg"
			foreground="var(--canvas-fg)"
			background="var(--border)"
		/>
		<div class="space-y-1">
			<p class="font-semibold">Starting your preview</p>
			<p class="text-sm text-muted-fg">Your preview will open when it’s ready.</p>
		</div>
	</div>
</template>
