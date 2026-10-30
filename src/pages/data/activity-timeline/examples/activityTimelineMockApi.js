const activityRows = [
	{ id: 'evt_110', type: 'deployment', action: 'Production rollout completed', detail: 'Release 2026.08.4 reached every workspace.', createdAt: '2026-08-12T10:42:00.000Z', actor: 'Deployment worker', status: 'completed', tone: 'success' },
	{ id: 'evt_109', type: 'approval', action: 'Release approved', detail: 'The evidence bundle and checksum were accepted.', createdAt: '2026-08-12T10:16:00.000Z', actor: 'Maya Chen', status: 'approved', tone: 'primary' },
	{ id: 'evt_108', type: 'comment', action: 'Review note added', detail: 'Requested a final check of regional redirect rules.', createdAt: '2026-08-12T09:54:00.000Z', actor: 'Owen Reed', status: 'noted', tone: 'neutral' },
	{ id: 'evt_107', type: 'automation', action: 'Evidence snapshot retained', detail: 'Health checks, policy results, and asset hashes were stored.', createdAt: '2026-08-12T09:31:00.000Z', actor: 'Release worker', status: 'retained', tone: 'neutral' },
	{ id: 'evt_106', type: 'approval', action: 'Accessibility review passed', detail: 'Keyboard and screen-reader checks passed on the release candidate.', createdAt: '2026-08-11T16:48:00.000Z', actor: 'Priya Shah', status: 'approved', tone: 'success' },
	{ id: 'evt_105', type: 'deployment', action: 'Preview rollout completed', detail: 'The candidate was deployed to the preview environment.', createdAt: '2026-08-11T15:22:00.000Z', actor: 'Deployment worker', status: 'completed', tone: 'success' },
	{ id: 'evt_104', type: 'comment', action: 'Release notes updated', detail: 'Added migration guidance for API consumers.', createdAt: '2026-08-11T14:05:00.000Z', actor: 'Nadia Ali', status: 'edited', tone: 'info' },
	{ id: 'evt_103', type: 'automation', action: 'Candidate created', detail: 'Build artifacts and dependency evidence were assembled.', createdAt: '2026-08-11T12:37:00.000Z', actor: 'Release worker', status: 'created', tone: 'neutral' },
];

/**
 * Creates an isolated API adapter matching a cursor-paginated activity endpoint.
 *
 * @returns {{ listActivity: Function }} Activity resource API.
 */
export function createActivityTimelineMockApi() {
	/**
	 * Lists one page of resource activity in server-defined chronological order.
	 *
	 * @param {{ scope: string, scopeId: string, type?: string, cursor?: string, limit?: number }} request Activity query.
	 * @returns {Promise<Record<string, unknown>>} Cursor-paginated resource response.
	 */
	async function listActivity(request) {
		await wait(360);
		const filtered = request.type
			? activityRows.filter(createTypeMatcher(request.type))
			: activityRows;
		const offset = decodeCursor(request.cursor);
		const limit = Math.min(20, Math.max(1, Number(request.limit) || 4));
		const data = filtered.slice(offset, offset + limit).map(cloneRow);
		const nextOffset = offset + data.length;

		return {
			data,
			pageInfo: {
				strategy: 'cursor',
				nextCursor: nextOffset < filtered.length ? encodeCursor(nextOffset) : null,
				hasNextPage: nextOffset < filtered.length,
			},
			meta: {
				scope: request.scope,
				scopeId: request.scopeId,
				type: request.type || null,
				total: filtered.length,
				requestedAt: new Date().toISOString(),
			},
		};
	}

	return { listActivity };
}

/**
 * Creates a row predicate for one activity type.
 *
 * @param {string} type Requested activity type.
 * @returns {(row: Record<string, unknown>) => boolean} Row predicate.
 */
function createTypeMatcher(type) {
	/**
	 * Reports whether one row matches the requested type.
	 *
	 * @param {Record<string, unknown>} row Activity row.
	 * @returns {boolean} True when types match.
	 */
	return function matchesType(row) {
		return row.type === type;
	};
}

/**
 * Clones one API row so the mock database remains server-owned.
 *
 * @param {Record<string, unknown>} row Activity row.
 * @returns {Record<string, unknown>} Cloned activity row.
 */
function cloneRow(row) {
	return { ...row };
}

/**
 * Encodes an offset as an opaque demo cursor.
 *
 * @param {number} offset Next row offset.
 * @returns {string} Opaque cursor.
 */
function encodeCursor(offset) {
	return `cursor_${offset}`;
}

/**
 * Decodes an opaque demo cursor.
 *
 * @param {string} cursor Cursor supplied by the previous response.
 * @returns {number} Starting row offset.
 */
function decodeCursor(cursor) {
	const offset = Number(String(cursor || '').replace('cursor_', ''));
	return Number.isFinite(offset) && offset > 0 ? offset : 0;
}

/**
 * Waits briefly so loading and pagination states are visible in the example.
 *
 * @param {number} duration Delay in milliseconds.
 * @returns {Promise<void>} Resolves after the delay.
 */
function wait(duration) {
	return new Promise(function scheduleWait(resolve) {
		setTimeout(resolve, duration);
	});
}
