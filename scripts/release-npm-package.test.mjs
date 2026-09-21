import assert from 'node:assert/strict';
import test from 'node:test';
import { releaseNotes, suggestVersion, parseStableVersion } from './release-npm-package.mjs';
import { publicReleases, listReleases } from '../server/lib/releases.js';

test('release candidates do not reuse a published version', () => {
	assert.equal(suggestVersion('0.2.1', '0.2.0'), '0.2.1');
	assert.equal(suggestVersion('0.2.1', '0.2.1'), '0.2.2');
	assert.throws(() => parseStableVersion('0.2.1; echo bad'));
});

test('notes must be complete, unique and bounded to the requested release', () => {
	const source = '# Changelog\n\n## 0.2.1 - 2026-09-21\n\nRouter support.\n\n## 0.2.0 - 2026-09-20\n\nPrevious.\n';
	assert.equal(releaseNotes(source, '0.2.1'), 'Router support.');
	assert.equal(releaseNotes(source, '0.2.0'), 'Previous.');
	assert.throws(() => releaseNotes(source + source, '0.2.1'));
	assert.throws(() => releaseNotes(source, '0.3.0'));
	assert.throws(() => releaseNotes(source.replace('Router support.', 'TODO'), '0.2.1'));
});

test('public projection excludes drafts, prereleases and private GitHub metadata', () => {
	const record = { tag_name: 'v0.2.1', name: 'Router support', body: 'Notes', published_at: '2026-09-21T12:00:00Z', author: { login: 'private' }, assets: ['private'] };
	assert.deepEqual(publicReleases([record, { ...record, draft: true }, { ...record, prerelease: true }, { ...record, tag_name: 'internal' }]), [{ version: '0.2.1', title: 'Router support', body: 'Notes', publishedAt: record.published_at }]);
});

test('feed caches successful notes and safely retains them during an outage', async (context) => {
	const token = process.env.RELEASES_GITHUB_TOKEN;
	context.after(() => {
		if (token === undefined) delete process.env.RELEASES_GITHUB_TOKEN;
		else process.env.RELEASES_GITHUB_TOKEN = token;
	});
	delete process.env.RELEASES_GITHUB_TOKEN;
	assert.equal((await listReleases())[0].version, '0.2.0');
	process.env.RELEASES_GITHUB_TOKEN = 'test-only-token';
	let requests = 0;
	let now = Date.now();
	context.mock.method(Date, 'now', () => now);
	context.mock.method(globalThis, 'fetch', async () => {
		requests += 1;
		return { ok: true, json: async () => [{ tag_name: 'v0.2.1', name: 'Release', published_at: '2026-09-21T12:00:00Z', body: '<script>alert(1)</script>\n\n[unsafe](javascript:alert(1))' }] };
	});
	const [first, second] = await Promise.all([listReleases(), listReleases()]);
	assert.equal(requests, 1);
	assert.deepEqual(first, second);
	assert.equal(first[0].version, '0.2.1');
	assert.ok(!first[0].html.includes('<script>'));
	assert.ok(!first[0].html.includes('href="javascript:'));
	await listReleases();
	assert.equal(requests, 1);
	now += 61_000;
	context.mock.method(globalThis, 'fetch', async () => { throw new Error('Upstream unavailable'); });
	const warning = context.mock.method(console, 'warn', () => {});
	assert.deepEqual(await listReleases(), first);
	assert.equal(warning.mock.callCount(), 1);
});
