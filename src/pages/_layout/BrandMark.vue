<script setup>
defineProps({
	title: { type: String, default: '' },
});
</script>

<template>
	<svg
		width="64"
		height="64"
		viewBox="0 0 64 64"
		fill="none"
		:aria-hidden="title ? undefined : 'true'"
		:aria-label="title || undefined"
		focusable="false"
	>
		<rect width="64" height="64" rx="14" fill="#0B0F14" />
		<rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.25" stroke="currentColor" stroke-opacity="0.16" stroke-width="1.5" />
		<path
			d="M32 16v14M20 42V30h24v12"
			stroke="#F6F7F7"
			stroke-width="5"
			stroke-linecap="round"
			stroke-linejoin="round"
			opacity="0.94"
		/>
		<rect x="24" y="10" width="16" height="12" rx="4" fill="#F6F7F7" />
		<rect x="12" y="38" width="16" height="12" rx="4" fill="#F6F7F7" />
		<rect x="36" y="38" width="16" height="12" rx="4" fill="#66E2B4" />
	</svg>
</template>
