/**
 * Resolves a stable row key using the same string-or-function contract as DomDataGrid.
 *
 * @param {Record<string, unknown>} row Resource row to identify.
 * @param {string|Function} rowKey Field name or custom key resolver.
 * @param {number} index Fallback source index.
 * @returns {string|number} Stable key for the row.
 */
export function resolveKanbanRowKey(row, rowKey = 'id', index = 0) {
	if (typeof rowKey === 'function') return rowKey(row, index);
	return row?.[rowKey] ?? index;
}

/**
 * Applies a DomKanban card-move payload to a resource array without mutating the source.
 *
 * The payload carries complete row-key orders for each affected column. This keeps the
 * helper deterministic for same-column sorting and cross-column moves while allowing an
 * application to persist the same order transaction to a remote API.
 *
 * @param {Array<Record<string, unknown>>} rows Current resource rows.
 * @param {{ orders?: Array<{ columnKey: string|number, rowKeys: Array<string|number> }> }} payload Card-move payload emitted by DomKanban.
 * @param {{ rowKey?: string|Function, columnKey?: string, orderKey?: string }} [options] Resource field mapping.
 * @returns {Array<Record<string, unknown>>} New rows with updated column and order fields.
 */
export function applyKanbanCardMove(rows, payload, options = {}) {
	const sourceRows = Array.isArray(rows) ? rows : [];
	const orders = Array.isArray(payload?.orders) ? payload.orders : [];
	if (!orders.length) return [...sourceRows];

	const rowKey = options.rowKey || 'id';
	const columnKey = options.columnKey || 'status';
	const orderKey = options.orderKey === undefined ? 'position' : options.orderKey;
	const placements = new Map();

	orders.forEach(function indexColumnOrder(order) {
		if (!Array.isArray(order?.rowKeys)) return;
		order.rowKeys.forEach(function indexRowKey(key, index) {
			placements.set(key, { columnKey: order.columnKey, index });
		});
	});

	return sourceRows.map(function applyPlacement(row, index) {
		const key = resolveKanbanRowKey(row, rowKey, index);
		const placement = placements.get(key);
		if (!placement) return row;

		const nextRow = { ...row };
		if (columnKey) nextRow[columnKey] = placement.columnKey;
		if (orderKey) nextRow[orderKey] = placement.index;
		return nextRow;
	});
}

/**
 * Applies a DomKanban column-move payload without mutating the supplied definitions.
 *
 * @param {Array<Record<string, unknown>>} columns Current Kanban column definitions.
 * @param {{ columnKeys?: Array<string|number> }} payload Column-move payload emitted by DomKanban.
 * @returns {Array<Record<string, unknown>>} New column array in the requested order.
 */
export function applyKanbanColumnMove(columns, payload) {
	const sourceColumns = Array.isArray(columns) ? columns : [];
	const columnKeys = Array.isArray(payload?.columnKeys) ? payload.columnKeys : [];
	if (!columnKeys.length) return [...sourceColumns];

	const byKey = new Map(sourceColumns.map(function mapColumn(column) {
		return [column?.key, column];
	}));
	const ordered = columnKeys.map(function resolveColumn(key) {
		return byKey.get(key);
	}).filter(Boolean);
	const knownKeys = new Set(columnKeys);
	const remaining = sourceColumns.filter(function retainUnknownColumn(column) {
		return !knownKeys.has(column?.key);
	});

	return [...ordered, ...remaining];
}
