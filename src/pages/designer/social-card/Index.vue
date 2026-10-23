<script setup>
import SocialStudio from '../social/SocialStudio.vue';
import DomMonacoCodeView from '../core/MonacoCodeView.vue';
import { loadMonaco } from '../core/loadMonaco.js';
import { createSocialCard } from '../poster/posterModel.js';

// The social card is the Social post studio starting from a link preview, with its code open.
</script>

<template>
	<SocialStudio :code-editor="DomMonacoCodeView" :code-editor-props="{ load: loadMonaco }" :create="createSocialCard" title="Social card" storage-key="dom-studio-social-card-v2" file-name="dom-studio-social-card.html" code-open>
		<template #start><RouterLink to="/designer" class="text-sm text-muted-fg hover:text-canvas-fg">← UI designer</RouterLink></template>
	</SocialStudio>
</template>
