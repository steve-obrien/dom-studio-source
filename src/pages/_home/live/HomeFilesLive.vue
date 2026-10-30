<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import DomMediaBrowser from '../../data/media-browser/DomMediaBrowser.vue';
import ImageMediaDetail from '../../data/media-browser/examples/ImageMediaDetail.vue';
import PdfMediaDetail from '../../data/media-browser/examples/PdfMediaDetail.vue';
import { useMediaBrowserDemoStore } from '../../data/media-browser/examples/useMediaBrowserDemoStore.js';

/**
 * The real media browser on the homepage, backed by the docs demo's in-memory
 * API. Folders open in place; the page URL never changes.
 */
const store = useMediaBrowserDemoStore();
const { items, breadcrumbs, currentPath, selectedKeys, mode, loading, uploadProgress } = storeToRefs(store);
const detailComponents = {
	image: { component: ImageMediaDetail, mode: 'dialog', width: 'min(94vw, 76rem)' },
	pdf: { component: PdfMediaDetail, mode: 'inline' },
};

onMounted(() => store.loadFolder('/Images'));
</script>

<template>
	<div class="h-[640px] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-canvas shadow-xl shadow-canvas-fg/5">
		<DomMediaBrowser
			:items="items"
			:breadcrumbs="breadcrumbs"
			:current-path="currentPath"
			:selected-keys="selectedKeys"
			:mode="mode"
			:loading="loading"
			:upload-progress="uploadProgress || null"
			:detail-components="detailComponents"
			title="Brand media"
			@update:selected-keys="store.setSelectedKeys"
			@update:mode="store.setMode"
			@navigate="store.loadFolder($event.path)"
			@create-folder="store.createFolder"
			@rename="store.renameItem"
			@move="store.moveItems"
			@upload="store.uploadFiles"
			@metadata-update="store.updateMetadata"
			@make-folder-with-items="store.makeFolderWithItems"
		/>
	</div>
</template>
