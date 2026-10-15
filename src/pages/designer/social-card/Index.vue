<script setup>
import PosterStudio from '../poster/PosterStudio.vue';
import DomMonacoCodeView from '../core/MonacoCodeView.vue';
import { loadMonaco } from '../core/loadMonaco.js';
import { createSocialCard } from '../poster/posterModel.js';

// The social card is the poster studio at link-preview sizes, with the linked HTML open.
const presets = [{ label: 'Link preview · 1200 × 630', value: '1200x630' }, { label: 'Wide · 1600 × 900', value: '1600x900' }, { label: 'Square · 1080 × 1080', value: '1080x1080' }];
</script>

<template>
	<PosterStudio :code-editor="DomMonacoCodeView" :code-editor-props="{ load: loadMonaco }" :create="createSocialCard" :presets="presets" name="Social card" guide="/designer/assembly#social-card" file-name="dom-studio-social-card.html" frame-label="Card" initial-selection="headline" code-open />
</template>
