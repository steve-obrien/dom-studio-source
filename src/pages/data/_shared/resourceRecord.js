/**
 * Resolves a value from an application-owned resource row.
 *
 * Data components use the same string-or-function contract so applications can
 * pass ActiveRecord logical field names directly while retaining an escape hatch
 * for computed presentation values.
 *
 * @param {Record<string, unknown>} row Resource row to inspect.
 * @param {string|Function} field Logical field name or custom resolver.
 * @param {number} index Source row index supplied to custom resolvers.
 * @returns {unknown} Resolved row value.
 */
export function resolveResourceValue(row, field, index = 0) {
	if (typeof field === 'function') return field(row, index);
	if (!field || typeof field !== 'string') return undefined;
	return row?.[field];
}

/**
 * Resolves a stable resource-row key with an index fallback.
 *
 * @param {Record<string, unknown>} row Resource row to identify.
 * @param {string|Function} rowKey Logical key field or custom resolver.
 * @param {number} index Source row index used when no key is available.
 * @returns {string|number} Stable key or the supplied fallback index.
 */
export function resolveResourceKey(row, rowKey = 'id', index = 0) {
	return resolveResourceValue(row, rowKey, index) ?? index;
}
