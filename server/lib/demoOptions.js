const givenNames = ['Aisha', 'Alina', 'Benjamin', 'Bianca', 'Camila', 'Caleb', 'Daniel', 'Daphne', 'Elias', 'Elena', 'Fatima', 'Felix', 'Gabriel', 'Grace', 'Hana', 'Hugo', 'Imani', 'Isaac', 'Jasmine', 'Jonah', 'Kai', 'Keira', 'Lena', 'Luca', 'Maya', 'Marcus', 'Nina', 'Noah', 'Olivia', 'Omar'];
const surnames = ['Adams', 'Bennett', 'Chen', 'Diaz', 'Evans', 'Foster', 'Green', 'Hughes', 'Ibrahim', 'Jones', 'Kim', 'Lewis', 'Martin', 'Nguyen', 'Ortiz', 'Patel', 'Quinn', 'Rivera', 'Singh', 'Turner'];
const roles = ['Design', 'Engineering', 'Operations', 'Support'];
const people = [
	{ value: 'steve', label: 'Steve Obrien', email: 'steve@example.com', description: 'Product', role: 'Product' },
	{ value: 'robin', label: 'Robin <Ops>', email: 'robin@example.com', description: 'Operations', role: 'Operations' },
	...givenNames.flatMap((first, firstIndex) => surnames.map((last, lastIndex) => ({
		value: `${first.toLowerCase()}-${last.toLowerCase()}`,
		label: `${first} ${last}`,
		email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
		role: roles[(firstIndex + lastIndex) % roles.length],
		description: roles[(firstIndex + lastIndex) % roles.length],
	}))),
];
const classes = [
	'flex', 'grid', 'block', 'hidden', 'items-center', 'justify-between', 'w-full', 'h-full',
	...['p', 'px', 'py', 'm', 'mx', 'my', 'gap', 'w', 'h'].flatMap((prefix) => Array.from({ length: 65 }, (_, index) => `${prefix}-${index}`)),
].map((value) => ({ value, label: value, description: 'Demo utility catalogue' }));

/**
 * Return a bounded, deterministic page of public synthetic demo data.
 * The cursor is an offset within the current query, not a selected-item locator.
 *
 * @param {{ kind?: string, q?: string, cursor?: string, limit?: string }} params Query parameters.
 * @returns {{ items: Array, nextCursor: string|null, total: number }} One result page.
 * @throws {TypeError} For malformed kinds, cursors, limits or search queries.
 */
export function listDemoOptions({ kind = 'people', q = '', cursor = '0', limit = '12' } = {}) {
	if (!['people', 'classes'].includes(kind) || typeof q !== 'string' || q.length > 120
		|| !/^\d+$/.test(String(cursor)) || !/^\d+$/.test(String(limit))) throw new TypeError('Invalid option query.');
	const offset = Number(cursor);
	const pageSize = Number(limit);
	if (!Number.isSafeInteger(offset) || offset > 10000 || pageSize < 1 || pageSize > 50) throw new TypeError('Invalid option page.');
	const needle = q.trim().toLowerCase();
	const rows = (kind === 'classes' ? classes : people).filter((row) => `${row.label} ${row.email || ''} ${row.description}`.toLowerCase().includes(needle));
	const items = rows.slice(offset, offset + pageSize);
	return { items, nextCursor: offset + items.length < rows.length ? String(offset + items.length) : null, total: rows.length };
}
