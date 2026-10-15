<script setup>
import PosterStudio from '../poster/PosterStudio.vue';
import { createSocialPost } from '../poster/posterModel.js';
import { socialFormats } from '../poster/posterResize.js';

// One social post, previewed live at every platform size. Each layer's pins decide how it follows a resize.
const presets = socialFormats.map((format) => ({ label: `${format.label} · ${format.width} × ${format.height}`, value: `${format.width}x${format.height}` }));
const credit = { label: 'Photo: Zhi Xuan Hew / Unsplash', href: 'https://unsplash.com/photos/H3yr77Q_mwg' };
</script>

<template>
	<PosterStudio :create="createSocialPost" :presets="presets" :credit="credit" name="Social post studio" guide="/designer/assembly#poster" file-name="dom-studio-social-post.html" frame-label="Post" initial-selection="headline" formats-open />
</template>
