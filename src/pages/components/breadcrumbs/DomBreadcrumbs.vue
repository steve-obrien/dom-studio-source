<script>
/**
 * @typedef {object} BreadcrumbItem
 * @property {string|number} [key] Stable item key.
 * @property {string} label Human-readable location label.
 * @property {string|Record<string, unknown>} [to] Vue Router destination.
 * @property {string} [href] Native link destination.
 * @property {boolean} [current] Mark this item as the current location.
 * @property {boolean} [disabled] Render the item without navigation.
 */

/**
 * @typedef {object} BreadcrumbNavigatePayload
 * @property {BreadcrumbItem} item Selected breadcrumb item.
 * @property {number} index Original item index.
 * @property {boolean} current Whether the item is the current location.
 * @property {MouseEvent} event Native click event.
 */

/**
 * @typedef {object} BreadcrumbSlotPayload
 * @property {BreadcrumbItem} item Breadcrumb item.
 * @property {number} index Original item index.
 * @property {boolean} current Whether the item is the current location.
 */

export const breadcrumbsProps = {
	items: {
		type: Array,
		default: () => [],
		_edit: { typeRef: 'Array<BreadcrumbItem>', description: 'Ordered application-owned breadcrumb records.' },
	},
	maxItems: {
		type: Number,
		default: 0,
		_edit: { description: 'Maximum visible entries before the middle path collapses. Use 0 to show every item.' },
	},
	currentAsLink: {
		type: Boolean,
		default: false,
		_edit: { description: 'Keep the current location interactive when it has a destination.' },
	},
	separator: {
		type: String,
		default: 'chevron',
		_edit: { options: ['chevron', 'slash'], description: 'Built-in separator treatment.' },
	},
	size: {
		type: String,
		default: 'md',
		_edit: { options: ['sm', 'md'], description: 'Text and spacing density.' },
	},
	ariaLabel: {
		type: String,
		default: 'Breadcrumb',
		_edit: { description: 'Accessible label for the navigation landmark.' },
	},
	collapseLabel: {
		type: String,
		default: 'Show hidden breadcrumbs',
		_edit: { description: 'Accessible label for the collapsed-path control.' },
	},
};
</script>

<script setup>
import { computed, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

defineOptions({
	__doc: {
		name: 'Breadcrumbs',
		tag: '<DomBreadcrumbs>',
		description: 'Accessible route or resource-path navigation with application-owned destinations and optional middle-path collapsing.',
		icon: 'M4 7h5l3 5-3 5H4m8-10h5l3 5-3 5h-5',
		events: [
			{ name: 'navigate', payload: 'BreadcrumbNavigatePayload', typeRef: 'BreadcrumbNavigatePayload', description: 'Fired whenever an interactive breadcrumb is selected. Link navigation continues normally.' },
			{ name: 'expand', payload: 'BreadcrumbItem[]', description: 'Fired after a collapsed middle path is revealed.' },
		],
		slots: [
			{ name: 'item', payload: 'BreadcrumbSlotPayload', typeRef: 'BreadcrumbSlotPayload', description: 'Replace an item label inside its semantic link, button, or current-location element.' },
			{ name: 'separator', payload: '{ previous, next, index }', description: 'Replace the separator before each item after the first.' },
			{ name: 'collapsed', payload: '{ items, count, expand }', description: 'Replace the control used to reveal a collapsed middle path.' },
		],
	},
});

const props = defineProps(breadcrumbsProps);
const emit = defineEmits(['navigate', 'expand']);

const expanded = ref(false);
const normalizedItems = computed(getNormalizedItems);
const currentIndex = computed(getCurrentIndex);
const visibleEntries = computed(getVisibleEntries);
const listClass = computed(getListClass);

watch(() => props.items, collapseChangedPath);

/**
 * Collapses a newly supplied path so its middle can be expanded deliberately.
 *
 * @returns {void}
 */
function collapseChangedPath() {
	expanded.value = false;
}

/**
 * Normalizes supplied items and their stable rendering keys.
 *
 * @returns {Array<BreadcrumbItem & { key: string|number }>} Safe breadcrumb records.
 */
function getNormalizedItems() {
	return (Array.isArray(props.items) ? props.items : [])
		.filter(hasBreadcrumbLabel)
		.map(normalizeBreadcrumb);
}

/**
 * Reports whether a candidate has a visible label.
 *
 * @param {BreadcrumbItem} item Candidate breadcrumb.
 * @returns {boolean} True when the item can be rendered.
 */
function hasBreadcrumbLabel(item) {
	return Boolean(item && String(item.label || '').trim());
}

/**
 * Adds a stable fallback key to one breadcrumb.
 *
 * @param {BreadcrumbItem} item Source breadcrumb.
 * @param {number} index Original item index.
 * @returns {BreadcrumbItem & { key: string|number }} Normalized breadcrumb.
 */
function normalizeBreadcrumb(item, index) {
	return {
		...item,
		key: item.key ?? item.href ?? `breadcrumb-${index}`,
		label: String(item.label),
	};
}

/**
 * Finds the explicitly current location or defaults to the final item.
 *
 * @returns {number} Current breadcrumb index or -1.
 */
function getCurrentIndex() {
	for (let index = normalizedItems.value.length - 1; index >= 0; index -= 1) {
		if (normalizedItems.value[index].current) return index;
	}
	return normalizedItems.value.length - 1;
}

/**
 * Builds complete or middle-collapsed entries for the rendered list.
 *
 * @returns {Array<Record<string, unknown>>} Visible item and collapse-control entries.
 */
function getVisibleEntries() {
	const items = normalizedItems.value;
	const limit = Math.max(0, Math.floor(Number(props.maxItems) || 0));
	if (expanded.value || limit < 3 || items.length <= limit) return items.map(createItemEntry);

	const itemSlots = limit - 1;
	const leadingCount = Math.ceil(itemSlots / 2);
	const trailingCount = Math.floor(itemSlots / 2);
	const hiddenStart = leadingCount;
	const hiddenEnd = items.length - trailingCount;
	const leading = items.slice(0, leadingCount).map(createItemEntry);
	const hiddenItems = items.slice(hiddenStart, hiddenEnd);
	const trailing = items.slice(hiddenEnd).map(createTrailingEntry(hiddenEnd));

	return [
		...leading,
		{ key: '__collapsed__', collapsed: true, items: hiddenItems },
		...trailing,
	];
}

/**
 * Creates a visible entry using its current array index.
 *
 * @param {BreadcrumbItem} item Breadcrumb item.
 * @param {number} index Original item index.
 * @returns {Record<string, unknown>} Visible item entry.
 */
function createItemEntry(item, index) {
	return { key: item.key, item, index, collapsed: false };
}

/**
 * Creates a mapper that restores indices for the trailing path segment.
 *
 * @param {number} offset First trailing item index.
 * @returns {(item: BreadcrumbItem, index: number) => Record<string, unknown>} Trailing entry mapper.
 */
function createTrailingEntry(offset) {
	/**
	 * Restores one trailing breadcrumb's original path index.
	 *
	 * @param {BreadcrumbItem} item Breadcrumb item.
	 * @param {number} index Trailing segment index.
	 * @returns {Record<string, unknown>} Visible item entry.
	 */
	return function mapTrailingEntry(item, index) {
		return createItemEntry(item, offset + index);
	};
}

/**
 * Builds size-aware list classes.
 *
 * @returns {string} Ordered-list classes.
 */
function getListClass() {
	return props.size === 'sm' ? 'gap-1 text-xs' : 'gap-1.5 text-sm';
}

/**
 * Reports whether a visible item is the current location.
 *
 * @param {Record<string, unknown>} entry Visible item entry.
 * @returns {boolean} True for the current location.
 */
function isCurrent(entry) {
	return !entry.collapsed && entry.index === currentIndex.value;
}

/**
 * Reports whether a current item should render without navigation.
 *
 * @param {Record<string, unknown>} entry Visible item entry.
 * @returns {boolean} True when the item is plain current-location text.
 */
function isPlainCurrent(entry) {
	return isCurrent(entry) && !props.currentAsLink;
}

/**
 * Reveals the hidden middle path and reports the expanded items.
 *
 * @param {Array<BreadcrumbItem>} items Hidden breadcrumb items.
 * @returns {void}
 */
function expandPath(items) {
	expanded.value = true;
	emit('expand', items);
}

/**
 * Emits application navigation metadata without blocking native routing.
 *
 * @param {Record<string, unknown>} entry Visible item entry.
 * @param {MouseEvent} event Native click event.
 * @returns {void}
 */
function emitNavigate(entry, event) {
	if (entry.item.disabled) {
		event.preventDefault();
		return;
	}
	emit('navigate', {
		item: entry.item,
		index: entry.index,
		current: isCurrent(entry),
		event,
	});
}

/**
 * Builds the public item slot payload.
 *
 * @param {Record<string, unknown>} entry Visible item entry.
 * @returns {BreadcrumbSlotPayload} Item slot payload.
 */
function itemSlotPayload(entry) {
	return { item: entry.item, index: entry.index, current: isCurrent(entry) };
}

/**
 * Returns the separator's accessible-hidden glyph.
 *
 * @returns {string} Separator glyph.
 */
function separatorGlyph() {
	return props.separator === 'slash' ? '/' : '›';
}
</script>

<template>
	<nav :aria-label="ariaLabel" class="min-w-0 text-canvas-fg">
		<ol class="flex min-w-0 flex-wrap items-center" :class="listClass">
			<li v-for="(entry, visibleIndex) in visibleEntries" :key="entry.key" class="flex min-w-0 items-center gap-1.5">
				<slot v-if="visibleIndex > 0" name="separator" :previous="visibleEntries[visibleIndex - 1]?.item" :next="entry.item" :index="visibleIndex">
					<span class="select-none text-muted-fg/70" aria-hidden="true">{{ separatorGlyph() }}</span>
				</slot>

				<slot v-if="entry.collapsed" name="collapsed" :items="entry.items" :count="entry.items.length" :expand="() => expandPath(entry.items)">
					<button
						type="button"
						class="rounded-md px-1.5 py-1 font-semibold text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						:aria-label="`${collapseLabel}: ${entry.items.length} hidden`"
						@click="expandPath(entry.items)"
					>
						<span aria-hidden="true">…</span>
					</button>
				</slot>

				<span v-else-if="isPlainCurrent(entry) || entry.item.disabled" class="truncate px-1 py-1 font-semibold" :class="entry.item.disabled ? 'text-muted-fg/60' : 'text-canvas-fg'" :aria-current="isCurrent(entry) ? 'page' : undefined">
					<slot name="item" v-bind="itemSlotPayload(entry)">{{ entry.item.label }}</slot>
				</span>

				<RouterLink
					v-else-if="entry.item.to"
					:to="entry.item.to"
					class="truncate rounded-md px-1 py-1 font-medium text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					:aria-current="isCurrent(entry) ? 'page' : undefined"
					@click="emitNavigate(entry, $event)"
				>
					<slot name="item" v-bind="itemSlotPayload(entry)">{{ entry.item.label }}</slot>
				</RouterLink>

				<a
					v-else-if="entry.item.href"
					:href="entry.item.href"
					class="truncate rounded-md px-1 py-1 font-medium text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					:aria-current="isCurrent(entry) ? 'page' : undefined"
					@click="emitNavigate(entry, $event)"
				>
					<slot name="item" v-bind="itemSlotPayload(entry)">{{ entry.item.label }}</slot>
				</a>

				<button
					v-else
					type="button"
					class="truncate rounded-md px-1 py-1 font-medium text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					:aria-current="isCurrent(entry) ? 'page' : undefined"
					@click="emitNavigate(entry, $event)"
				>
					<slot name="item" v-bind="itemSlotPayload(entry)">{{ entry.item.label }}</slot>
				</button>
			</li>
		</ol>
	</nav>
</template>
