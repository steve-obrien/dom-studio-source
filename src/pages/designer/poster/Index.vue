<script setup>
import SocialStudio from '../social/SocialStudio.vue';
import DomMonacoCodeView from '../core/MonacoCodeView.vue';
import { loadMonaco } from '../core/loadMonaco.js';
import { createPoster } from './posterModel.js';

// The poster is the Social post studio starting from a portrait story: DomDesigner with a post as its file.
const credit = { label: 'Photo: Zhi Xuan Hew / Unsplash', href: 'https://unsplash.com/photos/H3yr77Q_mwg' };
</script>

<template>
	<SocialStudio :code-editor="DomMonacoCodeView" :code-editor-props="{ load: loadMonaco }" :create="createPoster" :credit="credit" title="Poster studio" storage-key="dom-studio-poster-v2" file-name="dom-studio-poster.html">
		<template #start><RouterLink to="/designer" class="text-sm text-muted-fg hover:text-canvas-fg">← UI designer</RouterLink></template>
	</SocialStudio>
</template>
