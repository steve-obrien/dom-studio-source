<script setup>
import { DomProgress, DomSpinner } from '../../../lib/vue';
</script>

<template>
	<div class="w-full max-w-xl rounded-2xl border border-border bg-canvas p-6 shadow-sm">
		<div class="mb-4 flex items-center gap-3">
			<DomSpinner
				label="Reading getdom.studio"
				size="md"
				background="color-mix(in oklab, var(--warning) 20%, transparent)"
				foreground="var(--warning)"
			/>
			<p class="text-sm font-semibold text-muted-fg">Reading getdom.studio...</p>
		</div>
		<DomProgress
			label="Reading getdom.studio"
			:show-label="false"
			indeterminate
			size="md"
			tone="warning"
		/>
	</div>
</template>
