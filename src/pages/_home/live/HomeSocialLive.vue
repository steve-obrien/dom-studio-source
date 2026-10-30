<script setup>
import SocialStudio from '../../designer/social/SocialStudio.vue';
import DomMonacoCodeView from '../../designer/core/MonacoCodeView.vue';
import { loadMonaco } from '../../designer/core/loadMonaco.js';
import { createBrowserStorage } from '../../designer/core/storage.js';
import { createSocialPost } from '../../designer/poster/posterModel.js';
import { loadTemplates } from '../../designer/poster/socialTemplates.js';

/**
 * The real Social post studio on the homepage, with every platform size along
 * the bottom, the Monaco code view and saved templates, as on /designer/social.
 */
const templates = loadTemplates(Object.values(import.meta.glob('../../designer/social/templates/*.json', { eager: true, import: 'default' })));
// Shares saved templates with the full studio page in this browser.
const templateStorage = createBrowserStorage({ prefix: 'dom-studio:social-template:' });
// The homepage always opens on the sample post; nothing is kept between visits.
const storage = { kind: 'memory', async load() { return null; }, async save() {} };
const credit = { label: 'Photo: Zhi Xuan Hew / Unsplash', href: 'https://unsplash.com/photos/H3yr77Q_mwg' };
</script>

<template>
	<div class="h-[52rem] overflow-hidden rounded-2xl border border-border shadow-xl shadow-canvas-fg/5">
		<SocialStudio :create="createSocialPost" :credit="credit" :templates="templates" :template-storage="templateStorage" :storage="storage" storage-key="dom-studio-home-social" :code-editor="DomMonacoCodeView" :code-editor-props="{ load: loadMonaco }" file-name="dom-studio-social-post.html" embedded />
	</div>
</template>
