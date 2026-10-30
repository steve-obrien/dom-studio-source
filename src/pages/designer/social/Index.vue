<script setup>
import SocialStudio from './SocialStudio.vue';
import DomMonacoCodeView from '../core/MonacoCodeView.vue';
import { loadMonaco } from '../core/loadMonaco.js';
import { createSocialPost } from '../poster/posterModel.js';
import { createBrowserStorage } from '../core/storage.js';
import { loadTemplates } from '../poster/socialTemplates.js';

// One social post, previewed live at every platform size. Each layer's pins decide how it follows a resize.
// Templates are JSON files in ./templates, hand-written or made by scripts/generate-social-templates.mjs.
const templates = loadTemplates(Object.values(import.meta.glob('./templates/*.json', { eager: true, import: 'default' })));
// Saved templates stay in this browser. An app passes createHttpStorage({ endpoint }) to keep them in its database instead.
const templateStorage = createBrowserStorage({ prefix: 'dom-studio:social-template:' });
const credit = { label: 'Photo: Zhi Xuan Hew / Unsplash', href: 'https://unsplash.com/photos/H3yr77Q_mwg' };
</script>

<template>
	<SocialStudio :code-editor="DomMonacoCodeView" :code-editor-props="{ load: loadMonaco }" :create="createSocialPost" :credit="credit" :templates="templates" :template-storage="templateStorage" file-name="dom-studio-social-post.html" code-open>
		<template #start><RouterLink to="/designer" class="text-sm text-muted-fg hover:text-canvas-fg">← UI designer</RouterLink></template>
	</SocialStudio>
</template>
