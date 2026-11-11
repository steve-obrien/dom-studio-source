<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import DomPopover from '../popover/DomPopover.vue';
import PaginationPageInput from './PaginationPageInput.vue';
import { useNumberScrub } from '../../forms/_shared/useNumberScrub.js';

defineOptions({
	__doc: {
		name: 'Pagination',
		tag: '<DomPagination>',
		description: 'A controlled page navigator for data grids, audit logs, search results, and resource lists.',
		icon: 'M7 8l-4 4 4 4M17 8l4 4-4 4M10 12h4',
		events: [
			{ name: 'update:page', payload: 'number', description: 'Fired when the selected page changes.' },
			{ name: 'page-change', payload: '{ page, previousPage, pageCount }', description: 'Fired with page transition metadata.' },
		],
		keyboard: [
			{ keys: 'Tab / Shift+Tab', action: 'Move between navigation buttons, the page field, and Go.' },
			{ keys: 'Enter / Space', action: 'Activate a page button or open a Go to page popover.' },
			{ keys: 'Enter in page field', action: 'Navigate to a valid page. Typing and blur do not navigate.' },
			{ keys: 'Esc', action: 'Cancel a page edit or close the popover and return focus to its trigger.' },
			{ keys: 'Drag ellipsis / Shift + drag', action: 'Preview pages within the omitted range; release to navigate once. Shift moves ten pages per step; Escape cancels.' },
			{ keys: 'Focused wheel / ArrowUp / ArrowDown', action: 'Adjust the page draft within its bounds. Enter or Go commits it.' },
		],
		playground: {
			initial: { page: 4, pageSize: 25, total: 286 },
		},
	},
});

const props = defineProps({
	page: {
		type: Number,
		default: 1,
		_edit: { description: 'Current 1-based page.' },
	},
	pageSize: {
		type: Number,
		default: 25,
		_edit: { description: 'Rows or items per page.' },
	},
	total: {
		type: Number,
		default: 0,
		_edit: { description: 'Total available items.' },
	},
	pageCount: {
		type: Number,
		default: null,
		_edit: { description: 'Explicit total page count. Overrides total/pageSize when provided.' },
	},
	variant: {
		type: String,
		default: 'pages',
		_edit: {
			options: ['pages', 'input'],
			description: 'Numbered page buttons with jump popovers, or a compact editable Page X of Y control for large datasets.',
		},
	},
	siblingCount: {
		type: Number,
		default: 1,
		_edit: { description: 'Pages to show around the current page.' },
	},
	boundaryCount: {
		type: Number,
		default: 1,
		_edit: { description: 'Pages to show at the beginning and end.' },
	},
	disabled: {
		type: Boolean,
		default: false,
		_edit: { description: 'Disable pagination controls.' },
	},
	compact: {
		type: Boolean,
		default: false,
		_edit: { description: 'Hide first and last buttons. The input variant also hides them on small screens.' },
	},
	label: {
		type: String,
		default: 'Pagination',
		_edit: { description: 'Navigation landmark label.' },
	},
	activeStyle: {
		type: String,
		default: 'secondary',
		_edit: {
			options: ['secondary', 'primary'],
			description: 'Visual style for the current page. Use primary to restore the stronger selected treatment.',
		},
	},
});

const emit = defineEmits(['update:page', 'page-change']);
const root = ref(null);
const jumpPopovers = ref([]);
const jumpInputs = new Map();
const dragRange = ref(null);
const dragKey = ref('');
const dragPage = ref(null);

/** Resolves a positive page count from an explicit count or the item total. */
const resolvedPageCount = computed(() => {
	const explicit = Number(props.pageCount);
	if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit);

	const pageSize = Number(props.pageSize);
	const total = Number(props.total);
	if (!Number.isFinite(pageSize) || pageSize <= 0 || !Number.isFinite(total) || total <= 0) return 1;
	return Math.max(1, Math.ceil(total / pageSize));
});
/** Keeps the displayed page inside the currently available range. */
const currentPage = computed(() => clampPage(props.page));
const pageScrub = useNumberScrub({
	value: () => Math.min(dragRange.value?.end ?? 1, Math.max(dragRange.value?.start ?? 1, currentPage.value)),
	min: () => dragRange.value?.start ?? 1,
	max: () => dragRange.value?.end ?? 1,
	step: 1,
	disabled: () => props.disabled,
	onPreview: previewDraggedPage,
	onCommit: commitDraggedPage,
	onCancel: cancelDraggedPage,
});
/** Builds only visible buttons and gap boundaries, never a list of hidden pages. */
const pageItems = computed(() => visiblePageItems(currentPage.value, resolvedPageCount.value));
/** Disables backwards navigation at the first page or while the parent is busy. */
const canGoPrevious = computed(() => !props.disabled && currentPage.value > 1);
/** Disables forwards navigation at the last page or while the parent is busy. */
const canGoNext = computed(() => !props.disabled && currentPage.value < resolvedPageCount.value);
/** Describes the visible item range, or the page count when a total is unavailable. */
const itemRangeLabel = computed(() => {
	const total = Number(props.total);
	const pageSize = Number(props.pageSize);
	if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(pageSize) || pageSize <= 0) {
		return `${resolvedPageCount.value} page${resolvedPageCount.value === 1 ? '' : 's'}`;
	}

	const start = (currentPage.value - 1) * pageSize + 1;
	const end = Math.min(total, currentPage.value * pageSize);
	return `${start}-${end} of ${total}`;
});
/** Composes navigation around either numbered pages or one editable page control. */
const controls = computed(() => {
	const items = [];
	if (!props.compact) {
		items.push({ type: 'action', key: 'first', label: 'First page', disabled: !canGoPrevious.value, target: 1, icon: 'first' });
	}
	items.push({ type: 'action', key: 'previous', label: 'Previous page', disabled: !canGoPrevious.value, target: currentPage.value - 1, icon: 'previous' });
	if (props.variant === 'input') items.push({ type: 'input', key: 'input' });
	else for (const item of pageItems.value) items.push(item);
	items.push({ type: 'action', key: 'next', label: 'Next page', disabled: !canGoNext.value, target: currentPage.value + 1, icon: 'next' });
	if (!props.compact) {
		items.push({ type: 'action', key: 'last', label: 'Last page', disabled: !canGoNext.value, target: resolvedPageCount.value, icon: 'last' });
	}
	return items;
});

/**
 * Normalizes externally controlled pages and button targets to the current bounds.
 *
 * @param {number} page Requested 1-based page.
 * @returns {number} A valid page within the available range.
 */
function clampPage(page) {
	const value = Math.floor(Number(page));
	if (!Number.isFinite(value)) return 1;
	return Math.min(resolvedPageCount.value, Math.max(1, value));
}

/**
 * Builds the visible page window using constant-size records for omitted ranges.
 *
 * @param {number} page Current page.
 * @param {number} count Available page count.
 * @returns {Array<object>} Numbered buttons and labelled gap boundaries.
 */
function visiblePageItems(page, count) {
	const pages = new Set();
	const boundary = Math.max(0, Math.floor(Number(props.boundaryCount) || 0));
	const siblings = Math.max(0, Math.floor(Number(props.siblingCount) || 0));

	for (let index = 1; index <= Math.min(boundary, count); index += 1) pages.add(index);
	for (let index = Math.max(1, count - boundary + 1); index <= count; index += 1) pages.add(index);
	for (let index = Math.max(1, page - siblings); index <= Math.min(count, page + siblings); index += 1) pages.add(index);

	const sorted = [...pages].sort((a, b) => a - b);
	const items = [];
	let previous = 0;

	for (const item of sorted) {
		if (previous && item - previous > 1) {
			if (item - previous === 2) {
				items.push({ type: 'page', page: previous + 1, key: `page-${previous + 1}` });
			} else {
				items.push({ type: 'ellipsis', key: `ellipsis-${previous < page ? 'before' : 'after'}`, start: previous + 1, end: item - 1 });
			}
		}
		items.push({ type: 'page', page: item, key: `page-${item}` });
		previous = item;
	}

	return items;
}

/**
 * Requests a page change while leaving data fetching and committed state with the parent.
 *
 * @param {number} page Requested page.
 */
function goTo(page) {
	const nextPage = clampPage(page);
	if (props.disabled || nextPage === currentPage.value) return;

	emit('update:page', nextPage);
	emit('page-change', {
		page: nextPage,
		previousPage: currentPage.value,
		pageCount: resolvedPageCount.value,
	});
}

/**
 * Arms a mouse scrub inside the particular omitted range represented by the dots.
 *
 * @param {object} item Ellipsis record with inclusive start/end bounds.
 * @param {PointerEvent} event Primary pointer press.
 */
function startJumpDrag(item, event) {
	dragRange.value = item;
	dragKey.value = item.key;
	dragPage.value = null;
	pageScrub.start(event);
}

/** Displays a candidate on the dots without emitting navigation or fetching rows. */
function previewDraggedPage(page) {
	dragPage.value = page;
}

/** Clears a cancelled drag preview without changing the controlled page. */
function cancelDraggedPage() {
	dragKey.value = '';
	dragPage.value = null;
}

/** Commits the final scrubbed page once and leaves focus on the resulting page button. */
async function commitDraggedPage(page) {
	cancelDraggedPage();
	goTo(page);
	await nextTick();
	root.value?.querySelector('[aria-current="page"]')?.focus();
}

/**
 * Tracks the private input instances belonging to each stable ellipsis trigger.
 *
 * @param {string} key Ellipsis key.
 * @param {{ focus: Function } | null} instance Mounted page field, or null on removal.
 */
function setJumpInput(key, instance) {
	if (instance) jumpInputs.set(key, instance);
	else jumpInputs.delete(key);
}

/**
 * Starts a fresh, selected page edit after a popover opens.
 *
 * @param {string} key Ellipsis key.
 */
function focusJump(key) {
	jumpInputs.get(key)?.focus();
}

/**
 * Restores keyboard focus when dismissal leaves it in a hidden panel.
 *
 * @param {string} key Ellipsis key.
 */
function restoreJumpFocus(key) {
	const trigger = root.value?.querySelector(`[data-page-jump="${key}"]`);
	if (trigger?.closest('dom-popover')?.contains(document.activeElement) || document.activeElement === document.body) {
		trigger?.focus();
	}
}

/**
 * Closes a committed jump and focuses the resulting current-page button.
 *
 * @param {number} page Validated destination page.
 * @param {Function} close Popover dismissal helper.
 */
async function submitJump(page, close) {
	close();
	goTo(page);
	await nextTick();
	root.value?.querySelector('[aria-current="page"]')?.focus();
}

/** Returns the parent state whose changes make an open jump popover stale. */
function navigationState() {
	return [props.page, props.pageCount, props.total, props.pageSize, props.disabled, props.variant];
}

/** Dismisses open jump controls when navigation, limits, or availability change. */
function closeJumpPopovers() {
	pageScrub.cancel(false);
	cancelDraggedPage();
	for (const popover of jumpPopovers.value) popover.close();
}

watch(navigationState, closeJumpPopovers);

/**
 * Explains the omitted range while advertising that any page can be entered.
 *
 * @param {{ start: number, end: number }} item Omitted page range.
 * @returns {string} Accessible trigger label.
 */
function hiddenPagesLabel(item) {
	return `Go to page; pages ${item.start} to ${item.end} omitted`;
}

/** Returns the theme-aware treatment for the selected numbered page. */
function activePageClasses() {
	const styles = {
		primary: 'bg-primary text-primary-fg',
		secondary: 'bg-secondary text-canvas-fg font-semibold shadow-[inset_0_1px_3px_rgb(0_0_0/0.14)] dark:shadow-[inset_0_1px_3px_rgb(0_0_0/0.5)]',
	};
	return styles[props.activeStyle] || styles.secondary;
}

/**
 * Shares navigation sizing and interaction states across numbered and action buttons.
 *
 * @param {boolean} active Whether this is the current numbered page.
 * @returns {Array<string>} Tailwind class list.
 */
function buttonClasses(active = false) {
	return [
		'grid h-9 min-w-9 place-items-center px-2 text-sm font-medium tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-40',
		active
			? activePageClasses()
			: 'text-muted-fg hover:bg-secondary/40 hover:text-canvas-fg disabled:hover:bg-transparent disabled:hover:text-muted-fg',
	];
}

/**
 * Applies joined borders to numbered pagination or separate controls to the input variant.
 *
 * @param {object} item Navigation control.
 * @param {number} index Position in the rendered controls.
 * @returns {Array<unknown>} Tailwind class list.
 */
function controlClasses(item, index) {
	if (props.variant === 'input') {
		return [buttonClasses(), 'skin-control shrink-0 rounded-md @max-[18rem]:min-w-8', ['first', 'last'].includes(item.key) && 'hidden sm:grid'];
	}
	return [
		buttonClasses(item.type === 'page' && item.page === currentPage.value),
		index > 0 && 'border-l border-[color:var(--skin-control-border,var(--border))]',
		index === 0 && 'rounded-l-[calc(var(--radius-md)-1px)]',
		index === controls.value.length - 1 && 'rounded-r-[calc(var(--radius-md)-1px)]',
	];
}
</script>

<template>
	<nav ref="root" class="@container flex w-full min-w-0 flex-wrap items-center justify-between gap-3 text-sm" :aria-label="label">
		<p class="whitespace-nowrap text-muted-fg tabular-nums">{{ itemRangeLabel }}</p>
		<div
			class="inline-flex max-w-full items-start overflow-x-auto"
			:class="variant === 'input' ? 'gap-1' : 'skin-control rounded-md'"
		>
			<template v-for="(item, index) in controls" :key="item.key">
				<PaginationPageInput
					v-if="item.type === 'input'"
					class="mx-1 !w-auto shrink-0 @max-[18rem]:mx-0"
					inline
					:page="currentPage"
					:page-count="resolvedPageCount"
					:disabled="disabled"
					@submit="goTo"
				/>
				<DomPopover
					v-else-if="item.type === 'ellipsis'"
					ref="jumpPopovers"
					class="!contents"
					position="top-end"
					width="w-64 max-w-[calc(100vw-1rem)]"
					:arrow="false"
					@open="focusJump(item.key)"
					@close="restoreJumpFocus(item.key)"
				>
					<template #trigger>
						<button
							type="button"
							:data-page-jump="item.key"
							:aria-label="hiddenPagesLabel(item)"
							:class="[controlClasses(item, index), !disabled && 'cursor-ew-resize select-none']"
							:style="{ minWidth: `calc(${Math.max(3, String(item.end).length)}ch + 1rem)` }"
							:title="`Click to choose a page, or drag through pages ${item.start}–${item.end}. Shift speeds up; Escape cancels.`"
							:disabled="disabled"
							@pointerdown="startJumpDrag(item, $event)"
							@click.capture="pageScrub.consumeClick"
						>
							<span aria-hidden="true">{{ pageScrub.dragging.value && dragKey === item.key ? dragPage : '...' }}</span>
						</button>
					</template>
					<template #default="{ close }">
						<PaginationPageInput
							:ref="(instance) => setJumpInput(item.key, instance)"
							role="dialog"
							aria-label="Go to page"
							:page="currentPage"
							:page-count="resolvedPageCount"
							:disabled="disabled"
							@submit="submitJump($event, close)"
							@cancel="close"
						/>
					</template>
				</DomPopover>
				<button
					v-else
					type="button"
					:class="controlClasses(item, index)"
					:disabled="item.disabled || disabled"
					:aria-current="item.type === 'page' && item.page === currentPage ? 'page' : undefined"
					:aria-label="item.label || `Page ${item.page}`"
					@click="goTo(item.target ?? item.page)"
				>
					<template v-if="item.type === 'page'">{{ item.page }}</template>
					<svg v-else-if="item.icon === 'first'" viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
						<path d="M11 7l-5 5 5 5M18 7l-5 5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
					<svg v-else-if="item.icon === 'previous'" viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
						<path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
					<svg v-else-if="item.icon === 'next'" viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
						<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
					<svg v-else viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
						<path d="M13 7l5 5-5 5M6 7l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</template>
		</div>
	</nav>
</template>
