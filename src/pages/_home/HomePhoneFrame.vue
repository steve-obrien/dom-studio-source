<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';

/**
 * A phone-sized iframe that renders its slot with the page's styles. Mobile
 * components use fixed positioning and viewport units (bottom sheets, app
 * shells), so they need their own viewport rather than a div on the homepage.
 */
const iframe = ref(null);
const mountTarget = shallowRef(null);
let headObserver;
let frame = 0;

/**
 * Writes an empty document and remembers where the slot mounts. The sheet
 * elements are defined first: an element created before its definition and
 * then moved into the iframe is never upgraded.
 *
 * @returns {Promise<void>}
 */
async function writeDocument() {
	await Promise.all([import('../lib/headless/drawer.js'), import('../lib/headless/dialog.js')]);
	const doc = iframe.value?.contentDocument;
	if (!doc) return;
	doc.open();
	doc.write('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="home-phone-root"></div></body></html>');
	doc.close();
	syncStyles();
	mountTarget.value = doc.getElementById('home-phone-root');
}

/** Copies the page's stylesheets and theme into the phone. @returns {void} */
function syncStyles() {
	const doc = iframe.value?.contentDocument;
	if (!doc?.head) return;
	doc.head.querySelectorAll('[data-home-phone-style]').forEach((node) => node.remove());
	for (const source of document.querySelectorAll('link[rel="stylesheet"], style')) {
		const clone = source.cloneNode(true);
		if (clone.tagName === 'LINK') clone.href = source.href;
		clone.setAttribute('data-home-phone-style', '');
		doc.head.appendChild(clone);
	}
	const base = doc.createElement('style');
	base.setAttribute('data-home-phone-style', '');
	base.textContent = 'html, body, #home-phone-root { height: 100%; } body { margin: 0; background: var(--canvas); color: var(--canvas-fg); font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif; -webkit-font-smoothing: antialiased; } :root { --dom-safe-area-top: 0px; --dom-safe-area-bottom: 0px; --dom-safe-area-left: 0px; --dom-safe-area-right: 0px; }';
	doc.head.appendChild(base);
	doc.documentElement.className = document.documentElement.className;
	const theme = document.documentElement.getAttribute('data-theme');
	if (theme) doc.documentElement.setAttribute('data-theme', theme);
	else doc.documentElement.removeAttribute('data-theme');
}

/** Batches style changes from development reloads and theme switches. @returns {void} */
function scheduleSync() {
	cancelAnimationFrame(frame);
	frame = requestAnimationFrame(syncStyles);
}

onMounted(() => {
	writeDocument();
	headObserver = new MutationObserver(scheduleSync);
	headObserver.observe(document.head, { childList: true, subtree: true, characterData: true });
	headObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
});
onBeforeUnmount(() => {
	headObserver?.disconnect();
	cancelAnimationFrame(frame);
});
</script>

<template>
	<div class="h-[36rem] w-full max-w-[18.5rem] overflow-hidden rounded-[2.25rem] border-[6px] border-canvas-fg/85 bg-canvas shadow-lg">
		<iframe ref="iframe" title="Phone preview" class="block size-full border-0 bg-canvas" />
		<Teleport v-if="mountTarget" :to="mountTarget">
			<slot />
		</Teleport>
	</div>
</template>
