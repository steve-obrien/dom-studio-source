<script setup>
import PosterStudio from './PosterStudio.vue';
import DomMonacoCodeView from '../core/MonacoCodeView.vue';
import { loadMonaco } from '../core/loadMonaco.js';
import { createPoster } from './posterModel.js';

const presets = [{ label: 'Story · 1080 × 1920', value: '1080x1920' }, { label: 'Portrait · 1080 × 1350', value: '1080x1350' }, { label: 'Square · 1080 × 1080', value: '1080x1080' }];
const credit = { label: 'Photo: Zhi Xuan Hew / Unsplash', href: 'https://unsplash.com/photos/H3yr77Q_mwg' };
</script>

<template>
	<PosterStudio :code-editor="DomMonacoCodeView" :code-editor-props="{ load: loadMonaco }" :create="createPoster" :presets="presets" :credit="credit" initial-selection="headline" />
</template>
