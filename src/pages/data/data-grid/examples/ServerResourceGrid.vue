<script setup>
import { computed, onMounted, ref } from 'vue';
import { DomButton, DomDataGrid, DomPagination } from '@getdom/studio/vue';

const pageSize = 8;
const mode = ref('page');
const page = ref(1);
const rows = ref([]);
const loading = ref(false);
const selectedKeys = ref([]);
const search = ref('');
const filters = ref({});
const sort = ref({ key: 'updatedAt', direction: 'desc' });
const currentQuery = ref(queryFromState());
const pageInfo = ref(emptyPageInfo('page'));
const lastRequest = ref(null);
const lastResponse = ref(null);

const columns = [
	{ key: 'name', label: 'Customer', type: 'text', width: '15rem' },
	{
		key: 'status',
		label: 'Status',
		type: 'select',
		width: '8.25rem',
		options: [
			{ label: 'Active', value: 'active', tone: 'green' },
			{ label: 'Trial', value: 'trial', tone: 'blue' },
			{ label: 'Paused', value: 'paused', tone: 'amber' },
			{ label: 'Risk', value: 'risk', tone: 'red' },
		],
	},
	{ key: 'owner', label: 'Owner', type: 'text', width: '11rem' },
	{ key: 'region', label: 'Region', type: 'select', width: '7.5rem' },
	{ key: 'seats', label: 'Seats', type: 'number', width: '6.5rem' },
	{ key: 'arr', label: 'ARR', type: 'currency', currency: 'GBP', width: '8.5rem' },
	{ key: 'updatedAt', label: 'Updated', type: 'date', width: '9rem' },
];

const api = createCustomerResourceApi();
const requestPreview = computed(() => JSON.stringify(lastRequest.value || buildRequest(), null, 2));
const responsePreview = computed(() => JSON.stringify(lastResponse.value || {
	data: [],
	pageInfo: pageInfo.value,
	meta: { total: 0, returned: 0 },
}, null, 2));
const gridHeight = computed(() => mode.value === 'cursor' ? '18rem' : '30rem');

onMounted(() => {
	loadResource();
});

function queryFromState() {
	return {
		search: search.value.trim(),
		filters: filters.value,
		sort: sort.value?.direction ? sort.value : null,
	};
}

function buildRequest(next = {}) {
	const strategy = next.mode || mode.value;
	const query = next.query || currentQuery.value;

	return {
		resource: 'customers',
		query,
		pagination: strategy === 'cursor'
			? {
				strategy: 'cursor',
				cursor: next.cursor || '',
				limit: pageSize,
			}
			: {
				strategy: 'page',
				page: next.page || page.value,
				pageSize,
			},
	};
}

async function loadResource(options = {}) {
	const append = Boolean(options.append);
	const nextPage = options.page || page.value;
	const nextMode = options.mode || mode.value;
	const request = buildRequest({
		mode: nextMode,
		page: nextPage,
		cursor: append ? pageInfo.value.nextCursor : '',
	});

	loading.value = true;
	lastRequest.value = request;

	const response = await api.list(request);

	if (nextMode === 'cursor' && append) {
		rows.value = [...rows.value, ...response.data];
	} else {
		rows.value = response.data;
	}

	page.value = response.pageInfo.page || nextPage;
	pageInfo.value = response.pageInfo;
	lastResponse.value = response;
	loading.value = false;
}

function loadNextCursorPage() {
	if (mode.value !== 'cursor' || loading.value || !pageInfo.value.hasNextPage) return;
	loadResource({ append: true });
}

function handleQueryChange(query) {
	currentQuery.value = query;
	page.value = 1;
	pageInfo.value = emptyPageInfo(mode.value);
	loadResource({ page: 1 });
}

function setMode(nextMode) {
	if (mode.value === nextMode) return;
	mode.value = nextMode;
	page.value = 1;
	rows.value = [];
	pageInfo.value = emptyPageInfo(nextMode);
	loadResource({ mode: nextMode, page: 1 });
}

function emptyPageInfo(strategy) {
	return {
		strategy,
		page: 1,
		pageSize,
		pageCount: 1,
		total: 0,
		hasNextPage: false,
		hasPreviousPage: false,
		nextCursor: '',
	};
}

function createCustomerResourceApi() {
	const records = createCustomers();

	return {
		async list(request) {
			await wait(420);

			const queried = applyResourceQuery(records, request.query);
			const total = queried.length;
			const pagination = request.pagination || {};

			if (pagination.strategy === 'cursor') {
				const limit = positiveInteger(pagination.limit, pageSize);
				const start = cursorToIndex(pagination.cursor);
				const data = queried.slice(start, start + limit);
				const nextIndex = start + data.length;
				const hasNextPage = nextIndex < total;

				return {
					data,
					pageInfo: {
						strategy: 'cursor',
						limit,
						total,
						returned: data.length,
						hasNextPage,
						hasPreviousPage: start > 0,
						nextCursor: hasNextPage ? indexToCursor(nextIndex) : '',
					},
					meta: responseMeta(request, total, data.length),
				};
			}

			const pageSizeValue = positiveInteger(pagination.pageSize, pageSize);
			const pageCount = Math.max(1, Math.ceil(total / pageSizeValue));
			const requestedPage = positiveInteger(pagination.page, 1);
			const safePage = Math.min(pageCount, requestedPage);
			const start = (safePage - 1) * pageSizeValue;
			const data = queried.slice(start, start + pageSizeValue);

			return {
				data,
				pageInfo: {
					strategy: 'page',
					page: safePage,
					pageSize: pageSizeValue,
					pageCount,
					total,
					returned: data.length,
					hasNextPage: safePage < pageCount,
					hasPreviousPage: safePage > 1,
					nextCursor: safePage < pageCount ? indexToCursor(start + data.length) : '',
				},
				meta: responseMeta(request, total, data.length),
			};
		},
	};
}

function applyResourceQuery(records, query) {
	const normalized = query || {};
	const activeFilters = normalized.filters || {};
	const needle = String(normalized.search || '').trim().toLowerCase();
	const filtered = records.filter((record) => {
		if (needle && ![record.name, record.owner, record.region, record.status].some((value) => String(value).toLowerCase().includes(needle))) {
			return false;
		}

		return Object.entries(activeFilters).every(([key, filter]) => recordMatchesFilter(record, key, filter));
	});

	const sortRules = normalizedSortRules(normalized.sort);
	if (!sortRules.length) return filtered;

	return [...filtered].sort((a, b) => {
		for (const rule of sortRules) {
			const direction = rule.direction === 'desc' ? -1 : 1;
			const left = sortableValue(a[rule.field || rule.key]);
			const right = sortableValue(b[rule.field || rule.key]);
			if (left > right) return direction;
			if (left < right) return direction * -1;
		}
		return 0;
	});
}

function normalizedSortRules(sort) {
	if (!sort) return [];
	if (Array.isArray(sort.rules)) {
		return sort.rules.filter((rule) => rule?.key && (rule.direction === 'asc' || rule.direction === 'desc'));
	}
	if (sort.key && (sort.direction === 'asc' || sort.direction === 'desc')) return [sort];
	return [];
}

function recordMatchesFilter(record, key, filter) {
	if (!filter) return true;
	const value = record[key];

	if (filter.type === 'select') {
		const values = Array.isArray(filter.values) ? filter.values.map(String) : [];
		return !values.length || values.includes(String(value));
	}

	if (filter.type === 'number' || filter.type === 'currency') {
		const number = Number(value);
		if (filter.min !== '' && filter.min !== null && filter.min !== undefined && number < Number(filter.min)) return false;
		if (filter.max !== '' && filter.max !== null && filter.max !== undefined && number > Number(filter.max)) return false;
		return true;
	}

	if (filter.type === 'date') {
		const date = String(value).slice(0, 10);
		if (filter.start && date < filter.start) return false;
		if (filter.end && date > filter.end) return false;
		return true;
	}

	const haystack = String(value ?? '').toLowerCase();
	const text = String(filter.value ?? '').trim().toLowerCase();
	if (!text) return true;
	if (filter.operator === 'equals') return haystack === text;
	if (filter.operator === 'starts') return haystack.startsWith(text);
	return haystack.includes(text);
}

function sortableValue(value) {
	if (typeof value === 'number') return value;
	return String(value ?? '').toLowerCase();
}

function responseMeta(request, total, returned) {
	return {
		total,
		returned,
		requestedAt: new Date().toISOString(),
		resource: request.resource,
		query: request.query,
	};
}

function positiveInteger(value, fallback) {
	const number = Math.floor(Number(value));
	return Number.isFinite(number) && number > 0 ? number : fallback;
}

function indexToCursor(index) {
	return `customer:${index}`;
}

function cursorToIndex(cursor) {
	const match = String(cursor || '').match(/^customer:(\d+)$/);
	return match ? Number(match[1]) : 0;
}

function wait(ms) {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

function createCustomers() {
	const names = [
		'Northstar Analytics',
		'Atlas Finance',
		'Brightwell Studio',
		'Cinder Labs',
		'Orchid Health',
		'Juniper Works',
		'Signal Harbor',
		'Pioneer Retail',
		'Forge Robotics',
		'Lakehouse Legal',
		'Verde Energy',
		'Kite Education',
	];
	const owners = ['Amelia Hart', 'Ravi Patel', 'Mina Okafor', 'Theo Grant', 'Laura Chen', 'Sam Rivera'];
	const regions = ['EMEA', 'NA', 'APAC', 'LATAM'];
	const statuses = ['active', 'trial', 'paused', 'risk'];

	return Array.from({ length: 48 }, (_, index) => {
		const status = statuses[index % statuses.length];
		return {
			id: `acc-${String(index + 1001).padStart(4, '0')}`,
			name: names[index % names.length],
			status,
			owner: owners[index % owners.length],
			region: regions[index % regions.length],
			seats: 8 + (index * 17) % 260,
			arr: 7800 + (index * 13750) % 318000,
			updatedAt: `2026-06-${String(index % 18 + 1).padStart(2, '0')}`,
		};
	});
}
</script>

<template>
	<div class="w-full min-w-0 space-y-4">
		<div class="flex flex-col gap-3 rounded-lg border border-border bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<p class="text-sm font-semibold text-canvas-fg">Remote customer resource</p>
				<p class="mt-1 text-sm leading-6 text-muted-fg">
					The grid asks for rows; the mock API applies search, filters, sort, and pagination.
				</p>
			</div>
			<div class="inline-grid grid-cols-2 rounded-full border border-border bg-secondary/60 p-1 text-sm font-medium">
				<button
					type="button"
					class="rounded-full px-3 py-1.5 transition"
					:class="mode === 'page' ? 'bg-canvas text-canvas-fg shadow-sm' : 'text-muted-fg hover:text-canvas-fg'"
					@click="setMode('page')"
				>
					Pages
				</button>
				<button
					type="button"
					class="rounded-full px-3 py-1.5 transition"
					:class="mode === 'cursor' ? 'bg-canvas text-canvas-fg shadow-sm' : 'text-muted-fg hover:text-canvas-fg'"
					@click="setMode('cursor')"
				>
					Forever
				</button>
			</div>
		</div>

		<DomDataGrid
			v-model:filters="filters"
			v-model:sort="sort"
			v-model:search="search"
			v-model:selected-keys="selectedKeys"
			:rows="rows"
			:columns="columns"
			:loading="loading && !rows.length"
			:total-rows="pageInfo.total"
			remote
			title="Customers"
			resource-label="customers"
			:height="gridHeight"
			@query-change="handleQueryChange"
			@viewport-end="loadNextCursorPage"
		>
			<template #toolbar-actions>
				<span class="hidden rounded-md border border-border bg-canvas px-2.5 py-1.5 text-xs font-medium text-muted-fg lg:inline-flex">
					{{ pageInfo.returned || rows.length }} returned / {{ pageInfo.total || 0 }} total
				</span>
			</template>
		</DomDataGrid>

		<DomPagination
			v-if="mode === 'page'"
			:page="page"
			:page-size="pageSize"
			:total="pageInfo.total"
			:disabled="loading"
			@update:page="loadResource({ page: $event })"
		/>

		<div v-else class="flex flex-col gap-3 rounded-lg border border-border bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
			<p class="text-sm text-muted-fg">
				Loaded {{ rows.length }} of {{ pageInfo.total || 0 }} customers with cursor pagination.
			</p>
			<DomButton
				variant="secondary"
				size="sm"
				:loading="loading"
				:disabled="!pageInfo.hasNextPage"
				@click="loadNextCursorPage"
			>
				Load next page
			</DomButton>
		</div>

		<div class="grid gap-3 lg:grid-cols-2">
			<div class="rounded-lg border border-border bg-canvas p-4">
				<p class="text-sm font-semibold text-canvas-fg">Request</p>
				<pre class="mt-3 max-h-72 overflow-auto rounded-md bg-secondary/40 p-3 text-xs leading-5 text-canvas-fg">{{ requestPreview }}</pre>
			</div>
			<div class="rounded-lg border border-border bg-canvas p-4">
				<p class="text-sm font-semibold text-canvas-fg">Response</p>
				<pre class="mt-3 max-h-72 overflow-auto rounded-md bg-secondary/40 p-3 text-xs leading-5 text-canvas-fg">{{ responsePreview }}</pre>
			</div>
		</div>
	</div>
</template>
