import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMenuScreens, hasMenuPage } from '../src/pages/components/menu-stack/menuTree.js';

test('nested pages preserve ancestry, component content, and application records', () => {
	const component = {};
	const items = [{ id: 'account', label: 'Account', component, children: [
		{ id: 'settings', label: 'Settings', children: [{ id: 'notifications', slot: 'notifications' }] },
		{ id: 'help', href: '/help' },
	] }];
	const before = JSON.stringify(items);
	const screens = buildMenuScreens(items, 'Workspace');
	assert.deepEqual(screens.map(({ id, parent }) => [id, parent]), [
		['root', undefined], ['account', 'root'], ['settings', 'account'], ['notifications', 'settings'],
	]);
	assert.equal(screens[1].component, component);
	assert.equal(screens[1].items, items[0].children);
	assert.equal(JSON.stringify(items), before);
});

test('empty children and rich content open pages; links and actions stay leaves', () => {
	assert.equal(hasMenuPage({ children: [] }), true);
	assert.equal(hasMenuPage({ component: {} }), true);
	assert.equal(hasMenuPage({ slot: 'profile' }), true);
	assert.equal(hasMenuPage({ to: '/docs' }), false);
	assert.equal(hasMenuPage({ id: 'save' }), false);
	assert.equal(buildMenuScreens([], 'Empty')[0].title, 'Empty');
});

test('ambiguous identifiers and cycles fail clearly instead of sharing cached pages', () => {
	for (const items of [[{ id: 'root' }], [{ id: '' }], [{ label: 'Missing' }], [{ id: 'a', children: [{ id: 'a' }] }]]) {
		assert.throws(() => buildMenuScreens(items, 'Menu'), /unique non-empty string ids/);
	}
	const cyclic = { id: 'cycle', children: [] };
	cyclic.children.push(cyclic);
	assert.throws(() => buildMenuScreens([cyclic], 'Menu'), /unique non-empty string ids/);
});
