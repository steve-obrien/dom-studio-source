<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { DomButton, DomDataGrid, DomNativeSelect } from '../../../lib/vue';

const maxBufferedRows = 640;
const returnedRowLimit = 80;
const slowThresholdMs = 250;
const feedIntervalMs = 1400;

const databases = [
	{ label: 'Primary writer', value: 'primary-writer', tone: 'green' },
	{ label: 'Read replica', value: 'read-replica', tone: 'blue' },
	{ label: 'Analytics', value: 'analytics', tone: 'violet' },
	{ label: 'Billing', value: 'billing', tone: 'amber' },
];

const services = [
	{ label: 'App API', value: 'app-api', tone: 'blue' },
	{ label: 'Worker', value: 'worker', tone: 'neutral' },
	{ label: 'Billing sync', value: 'billing-sync', tone: 'amber' },
	{ label: 'Reporting', value: 'reporting', tone: 'violet' },
	{ label: 'Webhook', value: 'webhook', tone: 'green' },
];

const operations = [
	{ label: 'SELECT', value: 'SELECT', tone: 'blue' },
	{ label: 'INSERT', value: 'INSERT', tone: 'green' },
	{ label: 'UPDATE', value: 'UPDATE', tone: 'amber' },
	{ label: 'DELETE', value: 'DELETE', tone: 'red' },
];

const statuses = [
	{ label: 'OK', value: 'ok', tone: 'green' },
	{ label: 'Slow', value: 'slow', tone: 'amber' },
	{ label: 'Timeout', value: 'timeout', tone: 'red' },
	{ label: 'Error', value: 'error', tone: 'red' },
];

const plans = [
	{ label: 'Index scan', value: 'index scan', tone: 'green' },
	{ label: 'Nested loop', value: 'nested loop', tone: 'amber' },
	{ label: 'Seq scan', value: 'seq scan', tone: 'red' },
	{ label: 'Bitmap heap', value: 'bitmap heap', tone: 'blue' },
];

const tableOptions = [
	'accounts',
	'audit_events',
	'billing_events',
	'content_items',
	'feature_flags',
	'invoices',
	'jobs',
	'organisations',
	'sessions',
	'users',
	'website_pages',
].map((value) => ({ label: value, value }));

const presetOptions = [
	{ label: 'Slowest first', value: 'slowest' },
	{ label: 'Lock waits', value: 'locks' },
	{ label: 'Errors and timeouts', value: 'errors' },
	{ label: 'Recent writes', value: 'writes' },
];

const columns = [
	{ key: 'time', label: 'Time', type: 'text', width: '8rem', filterable: false, searchable: false },
	{ key: 'database', label: 'Database', type: 'select', width: '10rem', options: databases },
	{ key: 'service', label: 'Service', type: 'select', width: '10rem', options: services },
	{ key: 'operation', label: 'Verb', type: 'select', width: '7rem', options: operations },
	{ key: 'table', label: 'Table', type: 'select', width: '10rem', options: tableOptions },
	{
		key: 'durationMs',
		label: 'Duration ms',
		type: 'number',
		width: '9rem',
		align: 'right',
		format: (value) => `${Math.round(Number(value) || 0)} ms`,
	},
	{
		key: 'lockWaitMs',
		label: 'Lock wait',
		type: 'number',
		width: '8rem',
		align: 'right',
		format: (value) => `${Math.round(Number(value) || 0)} ms`,
	},
	{ key: 'rowsExamined', label: 'Rows examined', type: 'number', width: '10rem', align: 'right' },
	{ key: 'status', label: 'Status', type: 'select', width: '8rem', options: statuses },
	{ key: 'plan', label: 'Plan', type: 'select', width: '10rem', options: plans },
	{ key: 'endpoint', label: 'Endpoint', type: 'text', width: '14rem' },
	{ key: 'statement', label: 'SQL statement', type: 'text', width: '34rem' },
];

const sourceRows = ref(createInitialQueries());
const rows = ref([]);
const totalRows = ref(0);
const search = ref('');
const filters = ref({});
const sort = ref({ key: 'durationMs', direction: 'desc', rules: [{ key: 'durationMs', direction: 'desc' }] });
const queryState = ref(queryFromState());
const selectedPreset = ref('slowest');
const selectedKeys = ref([]);
const live = ref(true);
const lastUpdatedAt = ref(formatLogTime(new Date()));
const insertedCount = ref(sourceRows.value.length);
let feedTimer = null;

const slowQueryCount = computed(() => sourceRows.value.filter((row) => row.durationMs >= slowThresholdMs).length);
const timeoutCount = computed(() => sourceRows.value.filter((row) => row.status === 'timeout' || row.status === 'error').length);
const p95Duration = computed(() => percentile(sourceRows.value.map((row) => row.durationMs), 0.95));
const averageMs = computed(() => average(sourceRows.value.map((row) => row.durationMs)));
const liveRate = computed(() => live.value ? '4-9/sec' : 'paused');
const requestPreview = computed(() => JSON.stringify({
	resource: 'observability.query_log',
	query: queryState.value,
	pagination: {
		strategy: 'live-window',
		limit: returnedRowLimit,
		buffered: sourceRows.value.length,
	},
}, null, 2));
const responsePreview = computed(() => JSON.stringify({
	returned: rows.value.length,
	total: totalRows.value,
	buffered: sourceRows.value.length,
	lastUpdatedAt: lastUpdatedAt.value,
}, null, 2));
const sqlPreview = computed(() => buildSqlPreview(queryState.value));

watch(selectedPreset, (value) => {
	applyPreset(value);
}, { immediate: true });

onMounted(() => {
	applyLiveQuery();
	startFeed();
});

onBeforeUnmount(() => {
	stopFeed();
});

/**
* Returns the grid query object from the controlled search, filters, and sort state.
*
* @returns {{ search: string, filters: Record<string, unknown>, sort: Record<string, unknown>|null }}
*/
function queryFromState() {
	return {
		search: search.value.trim(),
		filters: filters.value,
		sort: sort.value?.direction ? sort.value : null,
	};
}

/**
* Starts the simulated busy database feed used by the live log demo.
*
* @returns {void}
*/
function startFeed() {
	if (feedTimer) return;

	feedTimer = window.setInterval(() => {
		if (!live.value) return;
		ingestQueryBatch();
	}, feedIntervalMs);
}

/**
* Stops the simulated database feed and clears the interval handle.
*
* @returns {void}
*/
function stopFeed() {
	if (!feedTimer) return;

	window.clearInterval(feedTimer);
	feedTimer = null;
}

/**
* Toggles whether new simulated query events are appended to the log.
*
* @returns {void}
*/
function toggleFeed() {
	live.value = !live.value;
}

/**
* Adds a small randomized batch of query events and replays the active grid query.
*
* @returns {void}
*/
function ingestQueryBatch() {
	const batchSize = randomBetween(4, 9);
	const nextRows = Array.from({ length: batchSize }, (_, index) => createQueryLogEntry(insertedCount.value + index + 1));

	insertedCount.value += batchSize;
	sourceRows.value = [...nextRows, ...sourceRows.value].slice(0, maxBufferedRows);
	lastUpdatedAt.value = formatLogTime(new Date());
	applyLiveQuery();
}

/**
* Inserts intentionally slow query samples so the duration sort and filters have clear data.
*
* @returns {void}
*/
function addLatencySpike() {
	const spikeRows = Array.from({ length: 8 }, (_, index) => createQueryLogEntry(insertedCount.value + index + 1, {
		durationMs: randomBetween(850, 2400),
		lockWaitMs: randomBetween(120, 620),
		status: index % 3 === 0 ? 'timeout' : 'slow',
		plan: index % 2 === 0 ? 'seq scan' : 'nested loop',
	}));

	insertedCount.value += spikeRows.length;
	sourceRows.value = [...spikeRows, ...sourceRows.value].slice(0, maxBufferedRows);
	lastUpdatedAt.value = formatLogTime(new Date());
	applyLiveQuery();
}

/**
* Clears the in-memory query buffer while preserving the active grid query.
*
* @returns {void}
*/
function clearLog() {
	sourceRows.value = [];
	selectedKeys.value = [];
	lastUpdatedAt.value = formatLogTime(new Date());
	applyLiveQuery();
}

/**
* Applies a query-log preset as controlled grid filters and sort rules.
*
* @param {string} value Selected preset key.
* @returns {void}
*/
function applyPreset(value) {
	if (value === 'locks') {
		filters.value = {
			lockWaitMs: { type: 'number', min: 50, max: '' },
		};
		sort.value = { key: 'lockWaitMs', direction: 'desc', rules: [{ key: 'lockWaitMs', direction: 'desc' }] };
	} else if (value === 'errors') {
		filters.value = {
			status: { type: 'select', values: ['timeout', 'error'] },
		};
		sort.value = { key: 'durationMs', direction: 'desc', rules: [{ key: 'durationMs', direction: 'desc' }] };
	} else if (value === 'writes') {
		filters.value = {
			operation: { type: 'select', values: ['INSERT', 'UPDATE', 'DELETE'] },
		};
		sort.value = { key: 'time', direction: 'desc', rules: [{ key: 'time', field: 'startedAtEpoch', direction: 'desc' }] };
	} else {
		filters.value = {};
		sort.value = { key: 'durationMs', direction: 'desc', rules: [{ key: 'durationMs', direction: 'desc' }] };
	}

	queryState.value = queryFromState();
	applyLiveQuery();
}

/**
* Receives normalized data-grid search, filter, and sort state.
*
* @param {Record<string, unknown>} query Normalized query payload from DomDataGrid.
* @returns {void}
*/
function handleQueryChange(query) {
	queryState.value = cloneQuery(query);
	applyLiveQuery();
}

/**
* Applies the active query to the simulated server-side query-log resource.
*
* @returns {void}
*/
function applyLiveQuery() {
	const result = applyResourceQuery(sourceRows.value, queryState.value);

	totalRows.value = result.length;
	rows.value = result.slice(0, returnedRowLimit);
}

/**
* Creates the initial query buffer shown before live events begin arriving.
*
* @returns {Array<Record<string, unknown>>}
*/
function createInitialQueries() {
	return Array.from({ length: 140 }, (_, index) => createQueryLogEntry(index + 1, {
		startedAt: new Date(Date.now() - index * randomBetween(900, 5200)),
	}));
}

/**
* Creates a single realistic SQL query-log row.
*
* @param {number} index Monotonic query index used for stable ids.
* @param {Record<string, unknown>} overrides Values that should replace generated fields.
* @returns {Record<string, unknown>}
*/
function createQueryLogEntry(index, overrides = {}) {
	const operation = overrides.operation || weightedPick([
		['SELECT', 64],
		['UPDATE', 17],
		['INSERT', 14],
		['DELETE', 5],
	]);
	const table = overrides.table || pick(tableOptions).value;
	const database = overrides.database || pick(databases).value;
	const service = overrides.service || pick(services).value;
	const durationMs = Number(overrides.durationMs ?? createDurationMs(operation));
	const lockWaitMs = Number(overrides.lockWaitMs ?? createLockWaitMs(operation, durationMs));
	const rowsExamined = Number(overrides.rowsExamined ?? createRowsExamined(operation, durationMs));
	const status = overrides.status || createStatus(durationMs);
	const plan = overrides.plan || createPlan(operation, rowsExamined, durationMs);
	const startedAt = overrides.startedAt instanceof Date ? overrides.startedAt : new Date();

	return {
		id: `query-${String(index).padStart(5, '0')}`,
		time: formatLogTime(startedAt),
		startedAtEpoch: startedAt.getTime(),
		database,
		service,
		operation,
		table,
		durationMs,
		lockWaitMs,
		rowsExamined,
		status,
		plan,
		endpoint: createEndpoint(service, operation, table),
		traceId: `trc_${index.toString(16).padStart(6, '0')}`,
		statement: createStatement(operation, table, durationMs),
	};
}

/**
* Creates a plausible SQL statement for the generated operation and table.
*
* @param {string} operation SQL verb.
* @param {string} table Table name.
* @param {number} durationMs Query duration in milliseconds.
* @returns {string}
*/
function createStatement(operation, table, durationMs) {
	if (operation === 'INSERT') {
		return `insert into ${table} (organisation_id, payload, created_at) values (?, ?, now()) returning id`;
	}

	if (operation === 'UPDATE') {
		return `update ${table} set updated_at = now(), metadata = jsonb_set(metadata, ?, ?) where organisation_id = ? and id = ?`;
	}

	if (operation === 'DELETE') {
		return `delete from ${table} where organisation_id = ? and archived_at < now() - interval '90 days'`;
	}

	if (durationMs > slowThresholdMs) {
		return `select * from ${table} where organisation_id = ? and lower(search_text) like ? order by updated_at desc limit 100`;
	}

	return `select id, organisation_id, status, updated_at from ${table} where organisation_id = ? and id = ? limit 1`;
}

/**
* Creates a duration with occasional slow outliers.
*
* @param {string} operation SQL verb.
* @returns {number}
*/
function createDurationMs(operation) {
	const base = operation === 'SELECT' ? randomBetween(12, 190) : randomBetween(35, 320);
	const outlier = Math.random() > 0.86 ? randomBetween(260, 1450) : 0;

	return base + outlier;
}

/**
* Creates lock-wait time for write-heavy or already slow queries.
*
* @param {string} operation SQL verb.
* @param {number} durationMs Query duration in milliseconds.
* @returns {number}
*/
function createLockWaitMs(operation, durationMs) {
	const canWait = operation !== 'SELECT' || durationMs > slowThresholdMs;
	if (!canWait || Math.random() > 0.32) return 0;

	return randomBetween(8, Math.min(700, Math.max(80, Math.round(durationMs * 0.55))));
}

/**
* Creates a rows-examined count that scales with slow query shape.
*
* @param {string} operation SQL verb.
* @param {number} durationMs Query duration in milliseconds.
* @returns {number}
*/
function createRowsExamined(operation, durationMs) {
	if (operation !== 'SELECT') return randomBetween(1, 1200);
	if (durationMs > slowThresholdMs) return randomBetween(12000, 780000);

	return randomBetween(1, 9500);
}

/**
* Chooses a query status from duration and random failure probability.
*
* @param {number} durationMs Query duration in milliseconds.
* @returns {string}
*/
function createStatus(durationMs) {
	if (durationMs > 1200 && Math.random() > 0.68) return 'timeout';
	if (Math.random() > 0.97) return 'error';
	if (durationMs >= slowThresholdMs) return 'slow';

	return 'ok';
}

/**
* Chooses a query-plan label from operation, scan volume, and duration.
*
* @param {string} operation SQL verb.
* @param {number} rowsExamined Rows scanned by the database.
* @param {number} durationMs Query duration in milliseconds.
* @returns {string}
*/
function createPlan(operation, rowsExamined, durationMs) {
	if (operation !== 'SELECT') return Math.random() > 0.72 ? 'nested loop' : 'index scan';
	if (rowsExamined > 100000 || durationMs > 900) return 'seq scan';
	if (durationMs > slowThresholdMs) return Math.random() > 0.5 ? 'bitmap heap' : 'nested loop';

	return 'index scan';
}

/**
* Creates a route or worker label that helps search connect queries to code paths.
*
* @param {string} service Service that emitted the query.
* @param {string} operation SQL verb.
* @param {string} table Table name.
* @returns {string}
*/
function createEndpoint(service, operation, table) {
	if (service === 'worker') return `job:${table}:sync`;
	if (service === 'billing-sync') return `stripe:${operation.toLowerCase()}`;
	if (service === 'reporting') return `/reports/${table}`;
	if (service === 'webhook') return `/webhooks/${table}`;

	return `/api/${table}`;
}

/**
* Applies search, typed filters, and ordered sort rules as a server endpoint would.
*
* @param {Array<Record<string, unknown>>} records Buffered query-log records.
* @param {Record<string, unknown>} query Normalized data-grid query.
* @returns {Array<Record<string, unknown>>}
*/
function applyResourceQuery(records, query) {
	const normalized = query || {};
	const activeFilters = normalized.filters || {};
	const needle = String(normalized.search || '').trim().toLowerCase();
	const filtered = records.filter((record) => {
		if (needle && ![
			record.database,
			record.service,
			record.operation,
			record.table,
			record.status,
			record.plan,
			record.endpoint,
			record.traceId,
			record.statement,
		].some((value) => String(value).toLowerCase().includes(needle))) {
			return false;
		}

		return Object.entries(activeFilters).every(([key, filter]) => recordMatchesFilter(record, key, filter));
	});
	const sortRules = normalizedSortRules(normalized.sort);
	const effectiveSort = sortRules.length ? sortRules : [{ key: 'startedAtEpoch', direction: 'desc' }];

	return [...filtered].sort((left, right) => {
		for (const rule of effectiveSort) {
			const direction = rule.direction === 'desc' ? -1 : 1;
			const leftValue = sortableValue(getSortValue(left, rule));
			const rightValue = sortableValue(getSortValue(right, rule));

			if (leftValue > rightValue) return direction;
			if (leftValue < rightValue) return direction * -1;
		}

		return Number(right.startedAtEpoch) - Number(left.startedAtEpoch);
	});
}

/**
* Normalizes simple and multi-rule sort payloads emitted by the grid.
*
* @param {Record<string, unknown>|null} sortValue Sort payload.
* @returns {Array<Record<string, unknown>>}
*/
function normalizedSortRules(sortValue) {
	if (!sortValue) return [];

	if (Array.isArray(sortValue.rules)) {
		return sortValue.rules.filter((rule) => rule?.key && (rule.direction === 'asc' || rule.direction === 'desc'));
	}

	if (sortValue.key && (sortValue.direction === 'asc' || sortValue.direction === 'desc')) {
		return [sortValue];
	}

	return [];
}

/**
* Checks a single row against one typed data-grid filter.
*
* @param {Record<string, unknown>} record Query-log row.
* @param {string} key Column key.
* @param {Record<string, unknown>} filter Filter payload.
* @returns {boolean}
*/
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

	const text = String(filter.value ?? '').trim().toLowerCase();
	const haystack = String(value ?? '').toLowerCase();
	if (!text) return true;
	if (filter.operator === 'equals') return haystack === text;
	if (filter.operator === 'starts') return haystack.startsWith(text);

	return haystack.includes(text);
}

/**
* Reads the value used by the server-side sort simulation.
*
* @param {Record<string, unknown>} record Query-log row.
* @param {Record<string, unknown>} rule Sort rule.
* @returns {unknown}
*/
function getSortValue(record, rule) {
	if (rule.field) return record[rule.field];
	if (rule.key === 'time') return record.startedAtEpoch;

	return record[rule.key];
}

/**
* Normalizes values before comparison.
*
* @param {unknown} value Value to compare.
* @returns {string|number}
*/
function sortableValue(value) {
	if (typeof value === 'number') return value;

	return String(value ?? '').toLowerCase();
}

/**
* Clones a grid query payload so previews do not retain mutable references.
*
* @param {Record<string, unknown>} query Grid query payload.
* @returns {Record<string, unknown>}
*/
function cloneQuery(query) {
	return {
		search: String(query?.search || ''),
		filters: { ...(query?.filters || {}) },
		sort: query?.sort ? cloneSort(query.sort) : null,
	};
}

/**
* Clones simple or rule-based sort payloads.
*
* @param {Record<string, unknown>} value Sort payload.
* @returns {Record<string, unknown>}
*/
function cloneSort(value) {
	return {
		...value,
		rules: Array.isArray(value.rules) ? value.rules.map((rule) => ({ ...rule })) : undefined,
	};
}

/**
* Builds the SQL preview equivalent for the current grid query.
*
* @param {Record<string, unknown>} query Grid query state.
* @returns {string}
*/
function buildSqlPreview(query) {
	const clauses = [];
	const filtersValue = query?.filters || {};
	const searchValue = String(query?.search || '').trim();

	if (searchValue) {
		clauses.push(`(statement ilike ${literal(`%${searchValue}%`)} or endpoint ilike ${literal(`%${searchValue}%`)} or trace_id = ${literal(searchValue)})`);
	}

	for (const [key, filter] of Object.entries(filtersValue)) {
		const clause = sqlFilterClause(key, filter);
		if (clause) clauses.push(clause);
	}

	const sortRules = normalizedSortRules(query?.sort);
	const orderBy = sortRules.length
		? sortRules.map((rule) => `${sqlColumn(rule.field || rule.key)} ${String(rule.direction).toUpperCase()}`).join(', ')
		: 'started_at DESC';

	return [
		'select',
		'\tid, started_at, database_name, service_name, operation, table_name,',
		'\tduration_ms, lock_wait_ms, rows_examined, status, plan, endpoint, statement',
		'from observability.query_log',
		clauses.length ? `where ${clauses.join('\n\tand ')}` : '',
		`order by ${orderBy}`,
		`limit ${returnedRowLimit};`,
	].filter(Boolean).join('\n');
}

/**
* Converts one data-grid filter into a readable SQL WHERE fragment.
*
* @param {string} key Column key.
* @param {Record<string, unknown>} filter Filter payload.
* @returns {string}
*/
function sqlFilterClause(key, filter) {
	const column = sqlColumn(key);

	if (filter.type === 'select') {
		const values = Array.isArray(filter.values) ? filter.values : [];
		if (!values.length) return '';

		return `${column} in (${values.map(literal).join(', ')})`;
	}

	if (filter.type === 'number' || filter.type === 'currency') {
		const clauses = [];
		if (filter.min !== '' && filter.min !== null && filter.min !== undefined) clauses.push(`${column} >= ${Number(filter.min)}`);
		if (filter.max !== '' && filter.max !== null && filter.max !== undefined) clauses.push(`${column} <= ${Number(filter.max)}`);
		return clauses.join(' and ');
	}

	const text = String(filter.value ?? '').trim();
	if (!text) return '';
	if (filter.operator === 'equals') return `${column} = ${literal(text)}`;
	if (filter.operator === 'starts') return `${column} ilike ${literal(`${text}%`)}`;

	return `${column} ilike ${literal(`%${text}%`)}`;
}

/**
* Maps data-grid keys to the database column names used in the SQL preview.
*
* @param {string} key Grid column key.
* @returns {string}
*/
function sqlColumn(key) {
	const columnsByKey = {
		database: 'database_name',
		durationMs: 'duration_ms',
		lockWaitMs: 'lock_wait_ms',
		rowsExamined: 'rows_examined',
		service: 'service_name',
		startedAtEpoch: 'started_at',
		table: 'table_name',
		time: 'started_at',
	};

	return columnsByKey[key] || key;
}

/**
* Formats a JavaScript value as a compact SQL literal for preview purposes.
*
* @param {unknown} value Value to format.
* @returns {string}
*/
function literal(value) {
	return `'${String(value).replaceAll("'", "''")}'`;
}

/**
* Returns the value at a percentile in a numeric sample set.
*
* @param {Array<number>} values Numeric values.
* @param {number} percentileValue Percentile expressed between 0 and 1.
* @returns {number}
*/
function percentile(values, percentileValue) {
	const sorted = values.filter(Number.isFinite).sort((left, right) => left - right);
	if (!sorted.length) return 0;

	const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * percentileValue) - 1));
	return sorted[index];
}

/**
* Returns an integer average for the supplied numeric values.
*
* @param {Array<number>} values Numeric values.
* @returns {number}
*/
function average(values) {
	const filtered = values.filter(Number.isFinite);
	if (!filtered.length) return 0;

	return Math.round(filtered.reduce((total, value) => total + value, 0) / filtered.length);
}

/**
* Picks a random item from an array.
*
* @template T
* @param {Array<T>} values Candidate values.
* @returns {T}
*/
function pick(values) {
	return values[Math.floor(Math.random() * values.length)];
}

/**
* Picks a random value from weighted tuple options.
*
* @param {Array<[string, number]>} options Weighted value tuples.
* @returns {string}
*/
function weightedPick(options) {
	const total = options.reduce((sum, option) => sum + option[1], 0);
	let cursor = Math.random() * total;

	for (const [value, weight] of options) {
		cursor -= weight;
		if (cursor <= 0) return value;
	}

	return options[0][0];
}

/**
* Returns a random integer inside an inclusive range.
*
* @param {number} min Minimum value.
* @param {number} max Maximum value.
* @returns {number}
*/
function randomBetween(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
* Formats a log timestamp as a compact local time string.
*
* @param {Date} date Date to format.
* @returns {string}
*/
function formatLogTime(date) {
	return new Intl.DateTimeFormat('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	}).format(date);
}
</script>

<template>
	<div class="w-full min-w-0 space-y-4">
		<div class="grid gap-3 rounded-lg border border-border bg-canvas p-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
			<div class="min-w-0">
				<div class="flex flex-wrap items-center gap-2">
					<span class="inline-flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-muted-fg">
						<span class="relative flex size-2">
							<span v-if="live" class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60"></span>
							<span class="relative inline-flex size-2 rounded-full" :class="live ? 'bg-emerald-500' : 'bg-muted-fg'"></span>
						</span>
						Live query log
					</span>
					<span class="rounded-md border border-border bg-canvas px-2.5 py-1 text-xs font-medium text-muted-fg">
						{{ liveRate }}
					</span>
					<span class="rounded-md border border-border bg-canvas px-2.5 py-1 text-xs font-medium text-muted-fg">
						Last event {{ lastUpdatedAt }}
					</span>
				</div>

				<div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<div class="rounded-md border border-border bg-secondary/35 p-3">
						<p class="text-xs font-medium uppercase tracking-wide text-muted-fg">Buffered</p>
						<p class="mt-1 text-2xl font-semibold text-canvas-fg">{{ sourceRows.length }}</p>
					</div>
					<div class="rounded-md border border-border bg-secondary/35 p-3">
						<p class="text-xs font-medium uppercase tracking-wide text-muted-fg">P95 duration</p>
						<p class="mt-1 text-2xl font-semibold text-canvas-fg">{{ p95Duration }} ms</p>
					</div>
					<div class="rounded-md border border-border bg-secondary/35 p-3">
						<p class="text-xs font-medium uppercase tracking-wide text-muted-fg">Slow queries</p>
						<p class="mt-1 text-2xl font-semibold text-canvas-fg">{{ slowQueryCount }}</p>
					</div>
					<div class="rounded-md border border-border bg-secondary/35 p-3">
						<p class="text-xs font-medium uppercase tracking-wide text-muted-fg">Errors</p>
						<p class="mt-1 text-2xl font-semibold text-canvas-fg">{{ timeoutCount }}</p>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-3">
				<DomNativeSelect
					v-model="selectedPreset"
					label="View preset"
					:options="presetOptions"
					placeholder=""
				/>
				<div class="grid grid-cols-2 gap-2">
					<DomButton variant="secondary" size="sm" @click="toggleFeed">
						{{ live ? 'Pause' : 'Resume' }}
					</DomButton>
					<DomButton variant="secondary" size="sm" @click="addLatencySpike">
						Spike
					</DomButton>
					<DomButton class="col-span-2" variant="ghost" size="sm" @click="clearLog">
						Clear buffer
					</DomButton>
				</div>
			</div>
		</div>

		<DomDataGrid
			v-model:filters="filters"
			v-model:sort="sort"
			v-model:search="search"
			v-model:selected-keys="selectedKeys"
			:rows="rows"
			:columns="columns"
			:total-rows="totalRows"
			:selectable="false"
			:show-column-letters="false"
			remote
			multi-sort
			title="SQL log"
			resource-label="queries"
			height="33rem"
			empty-text="No query events match the current search, filters, or duration order."
			@query-change="handleQueryChange"
		>
			<template #toolbar-actions>
				<span class="hidden rounded-md border border-border bg-canvas px-2.5 py-1.5 text-xs font-medium text-muted-fg xl:inline-flex">
					{{ rows.length }} returned / {{ totalRows }} matching
				</span>
				<span class="hidden rounded-md border border-border bg-canvas px-2.5 py-1.5 text-xs font-medium text-muted-fg xl:inline-flex">
					avg {{ averageMs }} ms
				</span>
			</template>
		</DomDataGrid>

		<div class="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
			<div class="rounded-lg border border-border bg-canvas p-4">
				<p class="text-sm font-semibold text-canvas-fg">SQL generated from grid state</p>
				<pre class="mt-3 max-h-80 overflow-auto rounded-md bg-secondary/40 p-3 text-xs leading-5 text-canvas-fg">{{ sqlPreview }}</pre>
			</div>

			<div class="grid gap-3 lg:grid-cols-2 xl:grid-cols-1">
				<div class="rounded-lg border border-border bg-canvas p-4">
					<p class="text-sm font-semibold text-canvas-fg">Request</p>
					<pre class="mt-3 max-h-56 overflow-auto rounded-md bg-secondary/40 p-3 text-xs leading-5 text-canvas-fg">{{ requestPreview }}</pre>
				</div>
				<div class="rounded-lg border border-border bg-canvas p-4">
					<p class="text-sm font-semibold text-canvas-fg">Response window</p>
					<pre class="mt-3 max-h-56 overflow-auto rounded-md bg-secondary/40 p-3 text-xs leading-5 text-canvas-fg">{{ responsePreview }}</pre>
				</div>
			</div>
		</div>
	</div>
</template>
