<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { DomFontPicker } from '@getdom/studio/vue';

const family = ref('Lato');
const fonts = ref([]); // Empty means use DOM Studio's bundled catalogue.
const catalogueNotice = ref('');
let requestController;

/**
 * Fetch application-owned metadata only while this view is mounted.
 * Preserve the bundled catalogue and selected family if the endpoint fails.
 *
 * @returns {Promise<void>} Resolves after applying records or a fallback notice.
 */
async function loadCatalogue() {
	requestController = new AbortController();
	try {
		const response = await fetch('/api/fonts', { signal: requestController.signal });
		if (!response.ok) throw new Error('Catalogue unavailable.');
		const catalogue = await response.json();
		if (!Array.isArray(catalogue.fonts) || !catalogue.fonts.length) {
			throw new Error('Empty or invalid catalogue.');
		}
		if (!requestController.signal.aborted) fonts.value = catalogue.fonts;
	} catch {
		if (!requestController.signal.aborted) {
			catalogueNotice.value = 'Using the bundled font list. The latest catalogue is unavailable.';
		}
	}
}

/**
 * Cancel an outstanding metadata request when the owning view leaves the page.
 *
 * @returns {void}
 */
function cancelCatalogueRequest() {
	requestController?.abort();
}

onMounted(loadCatalogue);
onBeforeUnmount(cancelCatalogueRequest);
</script>

<template>
	<div class="grid gap-3">
		<DomFontPicker v-model="family" :fonts="fonts" label="Font family" />
		<p v-if="catalogueNotice" role="status" class="text-sm text-muted-fg">
			{{ catalogueNotice }}
		</p>
	</div>
</template>
