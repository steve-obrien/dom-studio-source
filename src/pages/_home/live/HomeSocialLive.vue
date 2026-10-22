<script setup>
import PosterStudio from '../../designer/poster/PosterStudio.vue';
import DomMonacoCodeView from '../../designer/core/MonacoCodeView.vue';
import { loadMonaco } from '../../designer/core/loadMonaco.js';
import { createBrowserStorage } from '../../designer/core/storage.js';
import { createSocialPost } from '../../designer/poster/posterModel.js';
import { socialFormats } from '../../designer/poster/posterResize.js';
import { loadTemplates } from '../../designer/poster/socialTemplates.js';

/**
 * The real Social post studio on the homepage, with every platform size along
 * the bottom, the Monaco code view and saved templates, as on /designer/social.
 */
const presets = socialFormats.map((format) => ({ label: `${format.label} · ${format.width} × ${format.height}`, value: `${format.width}x${format.height}` }));
const templates = loadTemplates(Object.values(import.meta.glob('../../designer/social/templates/*.json', { eager: true, import: 'default' })));
// Shares saved templates with the full studio page in this browser.
const templateStorage = createBrowserStorage({ prefix: 'dom-studio:social-template:' });
const credit = { label: 'Photo: Zhi Xuan Hew / Unsplash', href: 'https://unsplash.com/photos/H3yr77Q_mwg' };
</script>

<template>
	<div class="h-[52rem] overflow-hidden rounded-2xl border border-border shadow-xl shadow-canvas-fg/5">
		<PosterStudio :create="createSocialPost" :presets="presets" :credit="credit" :templates="templates" :template-storage="templateStorage" :code-editor="DomMonacoCodeView" :code-editor-props="{ load: loadMonaco }" name="Social post studio" file-name="dom-studio-social-post.html" frame-label="Post" initial-selection="headline" formats-open embedded />
	</div>
</template>
