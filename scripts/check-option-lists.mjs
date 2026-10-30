import assert from 'node:assert/strict';
import test from 'node:test';
import { computed, effectScope, ref } from 'vue';
import { listDemoOptions } from '../server/lib/demoOptions.js';
import { get } from '../server/api/form-options.get.js';
import { highlightMatches } from '../src/pages/forms/_shared/highlightMatches.js';
import { useSelectedOptions } from '../src/pages/forms/_shared/useSelectedOptions.js';

test('all people and utility pages are reachable without duplicate values', () => {
	for (const kind of ['people', 'classes']) {
		const values = [];
		let cursor = '0';
		let total = 0;
		do {
			const page = listDemoOptions({ kind, cursor });
			assert.ok(page.items.length <= 12);
			values.push(...page.items.map((item) => item.value));
			total = page.total;
			cursor = page.nextCursor;
		} while (cursor !== null);
		assert.ok(total > 500);
		assert.equal(values.length, total);
		assert.equal(new Set(values).size, total);
	}
});

test('searching starts a new query-scoped page and supports empty results', () => {
	const page = listDemoOptions({ q: 'ob' });
	assert.deepEqual(page.items.map((item) => item.value), ['steve', 'robin']);
	assert.equal(page.nextCursor, null);
	assert.deepEqual(listDemoOptions({ q: 'does not exist' }), { items: [], total: 0, nextCursor: null });
	assert.notDeepEqual(listDemoOptions({ cursor: '48' }).items, listDemoOptions().items);
});

test('public endpoint bounds cursor, query, catalogue and page size', () => {
	for (const query of [{ kind: 'private' }, { q: [] }, { q: 'a'.repeat(121) }, { cursor: '-1' }, { cursor: '10001' }, { limit: '9999' }, { limit: '0' }]) {
		let status = 200;
		const result = get({ query }, { status: (value) => { status = value; }, setHeader() {} });
		assert.equal(status, 400);
		assert.match(result.error, /Invalid/);
	}
});

test('highlight segments preserve literal HTML and regex characters as plain text', () => {
	assert.deepEqual(highlightMatches('Steve Obrien', 'ob'), [
		{ text: 'Steve ', matched: false }, { text: 'Ob', matched: true }, { text: 'rien', matched: false },
	]);
	for (const [text, query] of [['Robin <Ops>', '<Ops>'], ['[a.*] [a.*]', '[a.*]'], ['banana', 'an'], ['None', ''], ['No match', 'zzz']]) {
		assert.equal(highlightMatches(text, query).map((part) => part.text).join(''), text);
	}
	assert.equal(highlightMatches('banana', 'an').filter((part) => part.matched).length, 2);
});

test('selected labels survive server page replacement without inserting result rows', () => {
	const scope = effectScope();
	try {
		scope.run(() => {
			const options = ref([{ value: 12, label: 'Twelve' }, { value: 'b', label: 'Bee' }]);
			const values = ref([12]);
			const selected = useSelectedOptions(computed(() => options.value), computed(() => values.value));
			assert.equal(selected.value[0].label, 'Twelve');
			options.value = [{ value: 'c', label: 'Sea' }];
			assert.equal(selected.value[0].label, 'Twelve');
			assert.equal(options.value.length, 1);
			values.value = [12, 'c'];
			assert.deepEqual(selected.value.map((item) => item.label), ['Twelve', 'Sea']);
			values.value = [];
			assert.deepEqual(selected.value, []);
		});
	} finally { scope.stop(); }
});

test('initial missing selections can be resolved separately and retain numeric values', () => {
	const scope = effectScope();
	try {
		scope.run(() => {
			const selected = useSelectedOptions(computed(() => []), computed(() => [99]), () => [{ value: 99, label: 'Page five' }]);
			assert.deepEqual(selected.value, [{ value: 99, label: 'Page five' }]);
		});
	} finally { scope.stop(); }
});
