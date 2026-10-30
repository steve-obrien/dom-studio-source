<script setup>
import { computed } from 'vue';
import DomDropdown from '../dropdown/DomDropdown.vue';

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
		_edit: { description: 'Hide first and last buttons.' },
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

const resolvedPageCount = computed(() => {
	const explicit = Number(props.pageCount);
	if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit);

	const pageSize = Number(props.pageSize);
	const total = Number(props.total);
	if (!Number.isFinite(pageSize) || pageSize <= 0 || !Number.isFinite(total) || total <= 0) return 1;
	return Math.max(1, Math.ceil(total / pageSize));
});
const currentPage = computed(() => clampPage(props.page));
const pageItems = computed(() => visiblePageItems(currentPage.value, resolvedPageCount.value));
const canGoPrevious = computed(() => !props.disabled && currentPage.value > 1);
const canGoNext = computed(() => !props.disabled && currentPage.value < resolvedPageCount.value);
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
const controls = computed(() => {
	const items = [];
	if (!props.compact) {
		items.push({ type: 'action', key: 'first', label: 'First page', disabled: !canGoPrevious.value, target: 1, icon: 'first' });
	}
	items.push({ type: 'action', key: 'previous', label: 'Previous page', disabled: !canGoPrevious.value, target: currentPage.value - 1, icon: 'previous' });
	for (const item of pageItems.value) items.push(item);
	items.push({ type: 'action', key: 'next', label: 'Next page', disabled: !canGoNext.value, target: currentPage.value + 1, icon: 'next' });
	if (!props.compact) {
		items.push({ type: 'action', key: 'last', label: 'Last page', disabled: !canGoNext.value, target: resolvedPageCount.value, icon: 'last' });
	}
	return items;
});

function clampPage(page) {
	const value = Math.floor(Number(page));
	if (!Number.isFinite(value)) return 1;
	return Math.min(resolvedPageCount.value, Math.max(1, value));
}

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
			const hiddenPages = range(previous + 1, item - 1);
			if (hiddenPages.length === 1) {
				items.push({ type: 'page', page: hiddenPages[0], key: `page-${hiddenPages[0]}` });
			} else {
				items.push({ type: 'ellipsis', key: `ellipsis-${previous}-${item}`, pages: hiddenPages });
			}
		}
		items.push({ type: 'page', page: item, key: `page-${item}` });
		previous = item;
	}

	return items;
}

function range(start, end) {
	const pages = [];
	for (let page = start; page <= end; page += 1) pages.push(page);
	return pages;
}

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

function onHiddenPageSelect(value) {
	const page = Number(value);
	if (Number.isFinite(page)) goTo(page);
}

function hiddenPageOptions(item) {
	return (item.pages || []).map((page) => ({
		label: `Page ${page}`,
		value: String(page),
	}));
}

function hiddenPagesLabel(item) {
	const pages = item.pages || [];
	if (!pages.length) return 'Hidden pages';
	return `Pages ${pages[0]} to ${pages[pages.length - 1]}`;
}

function activePageClasses() {
	const styles = {
		primary: 'z-20 border-primary bg-primary text-primary-fg shadow-sm',
		secondary: 'z-20 border-border bg-secondary bg-[linear-gradient(rgb(0_0_0/6%)_0_0)] text-secondary-fg shadow-[inset_0_2px_4px_rgba(0,0,0,0.28)]',
	};
	return styles[props.activeStyle] || styles.secondary;
}

function buttonClasses(active = false) {
	return [
		'relative grid size-9 place-items-center border text-sm font-medium transition hover:z-30 focus:z-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-45',
		active
			? activePageClasses()
			: 'border-border bg-canvas text-canvas-fg hover:border-primary/40 hover:bg-secondary',
	];
}

function controlClasses(item, index) {
	return [
		buttonClasses(item.type === 'page' && item.page === currentPage.value),
		index === 0 ? 'ml-0' : '-ml-px',
		index === 0 && 'rounded-l-md',
		index === controls.value.length - 1 && 'rounded-r-md',
	];
}
</script>

<template>
	<nav class="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between" :aria-label="label">
		<p class="text-muted-fg">{{ itemRangeLabel }}</p>
		<div class="inline-flex items-center rounded-md shadow-sm">
			<template v-for="(item, index) in controls" :key="item.key">
				<DomDropdown
					v-if="item.type === 'ellipsis'"
					class="!contents"
					align="left"
					placement="bottom"
					width="min-w-28"
					:items="hiddenPageOptions(item)"
					:label="hiddenPagesLabel(item)"
					:focus-value="String(item.pages?.[0] || '')"
					:disabled="disabled || !item.pages?.length"
					:trigger-class="controlClasses(item, index)"
					:show-indicator="false"
					@select="onHiddenPageSelect"
				>
					<template #trigger>
						<span class="sr-only">{{ hiddenPagesLabel(item) }}</span>
						<span aria-hidden="true">...</span>
					</template>
				</DomDropdown>
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
