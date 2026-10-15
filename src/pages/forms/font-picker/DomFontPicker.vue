<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import DomSelect from '../select/DomSelect.vue';
import FontPreview from './FontPreview.vue';
import { fieldProps, fieldPropNames } from '../field/fieldProps.js';
import { buildGoogleFontsStylesheetUrl, filterFonts, fontStack, normalizeFont } from './fontPicker.js';
import { googleFonts } from './googleFonts.js';

defineOptions({
	inheritAttrs: false,
	__doc: {
		name: 'Font picker',
		tag: '<DomFontPicker>',
		description: 'Searchable Google Fonts picker that previews only visible families and keeps font network loading inside the mounted control.',
		icon: 'M5 5h14M12 5v14M8 19h8',
		playground: {
			initial: {
				label: 'Font family',
				modelValue: 'Lato',
				placeholder: 'Search Google Fonts',
				category: '',
				pageSize: 24,
				previewText: '',
				loadFonts: true,
			},
		},
		events: [
			{ name: 'update:modelValue', payload: 'string', description: 'Fired with the selected font value.' },
			{ name: 'select', payload: '{ item, value, label }', description: 'Fired when a font family is selected.' },
			{ name: 'query', payload: 'string', description: 'Fired as the user searches the catalog.' },
		],
	},
});

const props = defineProps({
	...fieldProps,
	modelValue: {
		type: String,
		default: '',
		_edit: { group: 'Control props', description: 'Selected font family or application-defined font value.' },
	},
	fonts: {
		type: Array,
		/**
		 * Return an empty override so the component can fall back to its built-in catalog.
		 *
		 * @returns {Array<Record<string, string>>} Empty font override.
		 */
		default: () => [],
		_edit: {
			group: 'Control props',
			component: 'DomJsonListInput',
			description: 'Lightweight family metadata. Font files are never bundled in this array. Set source: system for installed fonts, whose value is a CSS stack that is never fetched.',
			props: {
				compact: true,
				addLabel: '+ Add font',
				schema: [
					{ key: 'family', label: 'Family', placeholder: 'Lato' },
					{ key: 'value', label: 'Value', placeholder: 'Lato' },
					{ key: 'category', label: 'Fallback', placeholder: 'sans-serif' },
					{ key: 'source', label: 'Source', placeholder: 'google or system' },
				],
			},
		},
	},
	category: {
		type: String,
		default: '',
		_edit: { group: 'Control props', options: ['', 'sans-serif', 'serif', 'display', 'handwriting', 'monospace'], description: 'Optionally restrict results to one Google Fonts category.' },
	},
	pageSize: {
		type: Number,
		default: 24,
		_edit: { group: 'Control props', min: 6, max: 50, description: 'Number of metadata rows appended near the end. Preview fonts load only near the viewport.' },
	},
	previewText: {
		type: String,
		default: '',
		_edit: { group: 'Control props', description: 'Optional shared sample. Empty uses each family name as its own preview.' },
	},
	loadFonts: {
		type: Boolean,
		default: true,
		_edit: { group: 'Control props', description: 'Load the mounted selected label and visible previews from Google Fonts.' },
	},
	stylesheetUrl: {
		type: String,
		default: 'https://fonts.googleapis.com/css2',
		_edit: { group: 'Control props', description: 'Google Fonts CSS v2 endpoint or an application-controlled compatible proxy.' },
	},
	clearable: {
		type: Boolean,
		default: true,
		_edit: { group: 'Control props', description: 'Show a clear button after a font is selected.' },
	},
	placement: {
		type: String,
		default: 'bottom',
		_edit: { group: 'Control props', options: ['bottom', 'top', 'right', 'left'], description: 'Preferred side before collision handling.' },
	},
	floatingMode: {
		type: String,
		default: 'viewport',
		_edit: { group: 'Control props', options: ['viewport', 'anchor'], description: 'viewport keeps the list inside the browser; anchor keeps it attached while scrolling.' },
	},
});
const emit = defineEmits(['update:modelValue', 'select', 'query', 'focus', 'blur']);

const activated = ref(false);
const isMounted = ref(false);
const searchQuery = ref('');
const resultLimit = ref(props.pageSize);
const intersectingFonts = ref(new Map());
const availableFonts = computed(getAvailableFonts);
const matchingFonts = computed(getMatchingFonts);
const visibleFonts = computed(getVisibleFonts);
const selectedFont = computed(getSelectedFont);
const fontLoadSignature = computed(getFontLoadSignature);
const selectProps = computed(getSelectProps);
let loadTimer = null;
const activeStylesheets = new Set();
const pendingStylesheets = new Map();
const loadedFamilies = new Set();
const pendingFamilies = new Set();

watch(fontLoadSignature, scheduleFontLoad);
watch(() => props.category, resetResultsAndFonts);
watch(() => props.fonts, resetResultsAndFonts, { deep: true });
watch(() => props.pageSize, resetResultsAndFonts);
watch(() => [props.previewText, props.stylesheetUrl], resetResultsAndFonts);
onMounted(startFontLoading);
onBeforeUnmount(removeFontStylesheets);

/**
 * Allow browser-only preview requests after Vue has mounted the component.
 *
 * @returns {void}
 */
function startFontLoading() {
	isMounted.value = true;
	scheduleFontLoad();
}

/**
 * Normalize the supplied metadata without loading any font assets.
 *
 * @returns {Array<Record<string, string>>} Normalized font records.
 */
function getAvailableFonts() {
	const fonts = props.fonts.length ? props.fonts : googleFonts;
	return fonts.map(normalizeFont).filter(Boolean);
}

/**
 * Filter the complete metadata catalog without loading font assets.
 *
 * @returns {Array<Record<string, string>>} All matching font records.
 */
function getMatchingFonts() {
	return filterFonts(availableFonts.value, searchQuery.value, Number.MAX_SAFE_INTEGER, props.category);
}

/**
 * Return the incrementally revealed result window.
 *
 * @returns {Array<Record<string, string>>} Visible picker options.
 */
function getVisibleFonts() {
	return matchingFonts.value.slice(0, Math.max(1, resultLimit.value));
}

/**
 * Resolve selected font metadata, including application-defined values.
 *
 * @returns {Record<string, string>|null} Selected font record.
 */
function getSelectedFont() {
	if (!props.modelValue) return null;
	return availableFonts.value.find((font) => font.value === props.modelValue || font.family === props.modelValue)
		|| normalizeFont({ family: props.modelValue, value: props.modelValue });
}

/**
 * Create a stable trigger when visible preview families or loading options change.
 *
 * @returns {string} Font loading signature.
 */
function getFontLoadSignature() {
	if (!props.loadFonts) return '';
	const records = getPreviewFontRecords();
	return `${props.stylesheetUrl}|${props.previewText}|${records.map((font) => font.family).join('\u0000')}`;
}

/**
 * Pass field and selection behaviour through to the shared searchable select.
 *
 * @returns {Record<string, unknown>} Props for DomSelect.
 */
function getSelectProps() {
	const shared = Object.fromEntries(fieldPropNames.map((name) => [name, props[name]]));
	return {
		...shared,
		modelValue: props.modelValue,
		options: visibleFonts.value,
		selectedOptions: selectedFont.value ? [selectedFont.value] : [],
		searchable: true,
		filterOptions: false,
		hasMore: resultLimit.value < matchingFonts.value.length,
		width: 'w-[min(28rem,calc(100vw-2rem))]',
		clearable: props.clearable,
		placement: props.placement,
		floatingMode: props.floatingMode,
	};
}

/**
 * Update search results and mark preview loading as user-initiated.
 *
 * @param {string} query Current transient select-panel query.
 * @returns {void}
 */
function handleQuery(query) {
	if (searchQuery.value !== query) {
		resultLimit.value = props.pageSize;
		clearFontStylesheets();
	}
	searchQuery.value = query;
	if (!query) {
		const selectedIndex = matchingFonts.value.findIndex((font) => font.value === props.modelValue);
		resultLimit.value = Math.max(props.pageSize, Math.ceil((selectedIndex + 2) / Math.max(1, props.pageSize)) * Math.max(1, props.pageSize));
	}
	scheduleFontLoad();
	emit('query', query);
}

/**
 * Activate visible-row preview loading when the shared select panel opens.
 *
 * @returns {void}
 */
function handleOpen() {
	activated.value = true;
}

/** Stop observing previews when the select closes, leaving the chosen label intact. */
function handleClose() {
	activated.value = false;
	intersectingFonts.value.clear();
}

/** Track only rows intersecting the select's scroll viewport, plus a small overscan. */
function handleVisibility(font, visible) {
	if (visible && activated.value) intersectingFonts.value.set(font.family, font);
	else intersectingFonts.value.delete(font.family);
}

/**
 * Adapt the select's option detail to the font picker's existing item contract.
 *
 * @param {Record<string, unknown>} detail Selection detail.
 * @returns {void}
 */
function handleSelect(detail) {
	emit('select', { ...detail, item: detail.option });
}

/**
 * Append metadata when the list nears its end; visibility owns font loading.
 *
 * @returns {void}
 */
function loadMore() {
	resultLimit.value = Math.min(matchingFonts.value.length, resultLimit.value + Math.max(1, props.pageSize));
}

/**
 * Reset incremental results and component-owned preview stylesheets.
 *
 * @returns {void}
 */
function resetResultsAndFonts() {
	resultLimit.value = props.pageSize;
	clearFontStylesheets();
	scheduleFontLoad();
}

/**
 * Debounce loading for newly revealed preview families while the user types.
 *
 * @returns {void}
 */
function scheduleFontLoad() {
	if (!isMounted.value) return;
	if (loadTimer) window.clearTimeout(loadTimer);
	if (!props.loadFonts) {
		clearFontStylesheets();
		return;
	}
	loadTimer = window.setTimeout(loadVisibleFontBatch, 120);
}

/**
 * Request one stylesheet for the newly visible family batch.
 *
 * @returns {void}
 */
function loadVisibleFontBatch() {
	const records = getPreviewFontRecords().filter((font) => !loadedFamilies.has(font.family) && !pendingFamilies.has(font.family));
	if (!records.length) return;
	const families = records.map((font) => font.family);
	const previewText = props.previewText + records.map((font) => font.label).join('');
	const url = buildGoogleFontsStylesheetUrl(families, previewText, props.stylesheetUrl);
	if (!url) return;
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = url;
	link.dataset.domFontPicker = '';
	link.addEventListener('load', () => activateFontStylesheet(link), { once: true });
	link.addEventListener('error', () => discardPendingStylesheet(link), { once: true });
	pendingStylesheets.set(link, families);
	families.forEach((family) => pendingFamilies.add(family));
	document.head.append(link);
}

/**
 * Collect currently visible rows plus a selected family that may be outside the result window.
 *
 * @returns {Array<Record<string, string>>} Unique font records eligible for preview loading.
 */
function getPreviewFontRecords() {
	const visibleFamilies = new Set(visibleFonts.value.map((font) => font.family));
	const records = activated.value ? [...intersectingFonts.value.values()].filter((font) => visibleFamilies.has(font.family)) : [];
	if (selectedFont.value) records.push(selectedFont.value);
	// Installed fonts (`source: 'system'`) are never requested from Google Fonts.
	return [...new Map(records.filter((font) => font.source !== 'system').map((font) => [font.family, font])).values()];
}

/**
 * Keep a successfully loaded batch active for the lifetime of the current query.
 *
 * @param {HTMLLinkElement} link Loaded stylesheet element.
 * @returns {void}
 */
function activateFontStylesheet(link) {
	const families = pendingStylesheets.get(link);
	if (!families) {
		link.remove();
		return;
	}
	pendingStylesheets.delete(link);
	families.forEach((family) => {
		pendingFamilies.delete(family);
		loadedFamilies.add(family);
	});
	activeStylesheets.add(link);
}

/**
 * Remove a failed batch so it can be retried after the result set changes.
 *
 * @param {HTMLLinkElement} link Failed stylesheet element.
 * @returns {void}
 */
function discardPendingStylesheet(link) {
	const families = pendingStylesheets.get(link) || [];
	link.remove();
	pendingStylesheets.delete(link);
	families.forEach((family) => pendingFamilies.delete(family));
}

/**
 * Clear current-query stylesheet batches while leaving the component mounted.
 *
 * @returns {void}
 */
function clearFontStylesheets() {
	if (loadTimer) window.clearTimeout(loadTimer);
	loadTimer = null;
	activeStylesheets.forEach((link) => link.remove());
	pendingStylesheets.forEach((_families, link) => link.remove());
	activeStylesheets.clear();
	pendingStylesheets.clear();
	loadedFamilies.clear();
	pendingFamilies.clear();
}

/**
 * Clear timers and component-owned stylesheet elements before unmounting.
 *
 * @returns {void}
 */
function removeFontStylesheets() {
	isMounted.value = false;
	clearFontStylesheets();
}
</script>

<template>
	<DomSelect
		v-bind="{ ...selectProps, ...$attrs }"
		class="dom-font-picker"
		@update:model-value="emit('update:modelValue', $event)"
		@query="handleQuery"
		@select="handleSelect"
		@load-more="loadMore"
		@open="handleOpen"
		@close="handleClose"
		@focus="emit('focus', $event)"
		@blur="emit('blur', $event)"
	>
		<template #value="{ label, placeholder }">
			<span :style="{ fontFamily: fontStack(selectedFont) }">{{ label || placeholder }}</span>
		</template>
		<template #option="{ option }">
			<FontPreview :font="option" :text="previewText" :active="activated" @visibility="handleVisibility" />
		</template>
	</DomSelect>
</template>
