<script setup>
import PosterStudio from '../poster/PosterStudio.vue';
import DomMonacoCodeView from '../core/MonacoCodeView.vue';
import { loadMonaco } from '../core/loadMonaco.js';
import { createSocialPost } from '../poster/posterModel.js';
import { socialFormats } from '../poster/posterResize.js';
import { createBrowserStorage } from '../core/storage.js';
import { loadTemplates } from '../poster/socialTemplates.js';

// One social post, previewed live at every platform size. Each layer's pins decide how it follows a resize.
const presets = socialFormats.map((format) => ({ label: `${format.label} · ${format.width} × ${format.height}`, value: `${format.width}x${format.height}` }));
// Templates are JSON files in ./templates, hand-written or made by scripts/generate-social-templates.mjs.
const templates = loadTemplates(Object.values(import.meta.glob('./templates/*.json', { eager: true, import: 'default' })));
// Saved templates stay in this browser. An app passes createHttpStorage({ endpoint }) to keep them in its database instead.
const templateStorage = createBrowserStorage({ prefix: 'dom-studio:social-template:' });
const credit = { label: 'Photo: Zhi Xuan Hew / Unsplash', href: 'https://unsplash.com/photos/H3yr77Q_mwg' };
</script>

<template>
	<PosterStudio :code-editor="DomMonacoCodeView" :code-editor-props="{ load: loadMonaco }" :create="createSocialPost" :presets="presets" :credit="credit" name="Social post studio" guide="/designer/assembly#poster" file-name="dom-studio-social-post.html" frame-label="Post" initial-selection="headline" :templates="templates" :template-storage="templateStorage" formats-open />
</template>
