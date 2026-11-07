import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { releaseNotes, suggestVersion, parseStableVersion } from './release-npm-package.mjs';
import { publicReleases, listReleases } from '../server/lib/releases.js';
import { validateReleaseHistory } from '../server/lib/releaseRecords.js';
import { fetchReleaseHistory } from './export-release-history.mjs';

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
	let now = Date.now();
	context.mock.method(Date, 'now', () => now);
	assert.ok((await listReleases()).some((record) => record.version === '0.2.0'));
	now += 61_000;
	process.env.RELEASES_GITHUB_TOKEN = 'test-only-token';
	let requests = 0;
	context.mock.method(globalThis, 'fetch', async () => {
		requests += 1;
		return { ok: true, json: async () => [{ tag_name: 'v0.2.1', name: 'Release', published_at: '2026-09-21T12:00:00Z', body: '<script>alert(1)</script>\n\n[unsafe](javascript:alert(1))' }] };
	});
	const [first, second] = await Promise.all([listReleases(), listReleases()]);
	assert.equal(requests, 1);
	assert.deepEqual(first, second);
	const fetched = first.find((record) => record.version === '0.2.1');
	assert.ok(fetched);
	assert.ok(!fetched.html.includes('<script>'));
	assert.ok(!fetched.html.includes('href="javascript:'));
	await listReleases();
	assert.equal(requests, 1);
	now += 61_000;
	context.mock.method(globalThis, 'fetch', async () => { throw new Error('Upstream unavailable'); });
	const warning = context.mock.method(console, 'warn', () => {});
	assert.deepEqual(await listReleases(), first);
	assert.equal(warning.mock.callCount(), 1);
});

test('workflow export paginates, strips private fields, and excludes unpublished releases', async () => {
	const record = { tag_name: 'v0.2.4', name: 'Release', published_at: '2026-10-08T12:00:00Z', body: 'Notes', author: { login: 'private' } };
	let requests = 0;
	const records = await fetchReleaseHistory('test-only-token', async (url, options) => {
		requests += 1;
		assert.ok(url.endsWith(`page=${requests}`));
		assert.equal(options.headers.Authorization, 'Bearer test-only-token');
		return { ok: true, json: async () => requests === 1 ? Array.from({ length: 100 }, () => ({ ...record, draft: true })) : [record, { ...record, prerelease: true }] };
	});
	assert.equal(requests, 2);
	assert.deepEqual(records, [{ version: '0.2.4', title: 'Release', publishedAt: record.published_at, body: 'Notes' }]);
	await assert.rejects(fetchReleaseHistory('', async () => {}), /token/);
	await assert.rejects(fetchReleaseHistory('test-only-token', async () => ({ ok: false, status: 403 })), /403/);
	await assert.rejects(fetchReleaseHistory('test-only-token', async () => ({ ok: true, json: async () => [] })), /non-empty/);
});

test('snapshot validation rejects incomplete data and discards injected HTML fields', () => {
	const record = { version: '0.2.4', title: 'Release', publishedAt: '2026-10-08T12:00:00Z', body: 'Notes' };
	assert.deepEqual(validateReleaseHistory([{ ...record, html: '<script>bad()</script>', private: true }]), [record]);
	assert.throws(() => validateReleaseHistory([record, record]), /Invalid/);
	assert.throws(() => validateReleaseHistory([{ ...record, publishedAt: 'invalid' }]), /Invalid/);
	assert.throws(() => validateReleaseHistory([{ ...record, body: null }]), /Invalid/);
});

test('shared snapshots survive restart, refresh atomically, and retain last good notes on corruption', async (context) => {
	const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'dom-release-history-'));
	const originalFile = process.env.RELEASES_FILE;
	const originalToken = process.env.RELEASES_GITHUB_TOKEN;
	context.after(async () => {
		if (originalFile === undefined) delete process.env.RELEASES_FILE;
		else process.env.RELEASES_FILE = originalFile;
		if (originalToken === undefined) delete process.env.RELEASES_GITHUB_TOKEN;
		else process.env.RELEASES_GITHUB_TOKEN = originalToken;
		await fs.rm(directory, { recursive: true, force: true });
	});
	process.env.RELEASES_FILE = path.join(directory, 'releases.json');
	delete process.env.RELEASES_GITHUB_TOKEN;
	const record = { version: '0.2.4', title: 'Release', publishedAt: '2026-10-08T12:00:00Z', body: '<script>bad()</script>\n\nOriginal notes' };
	await fs.writeFile(process.env.RELEASES_FILE, JSON.stringify([record]));
	let now = Date.now();
	context.mock.method(Date, 'now', () => now);
	const request = context.mock.method(globalThis, 'fetch', async () => { throw new Error('No server GitHub access expected'); });
	const source = await import('../server/lib/releases.js?snapshot-test');
	const first = await source.listReleases();
	const snapshotRecord = first.find((entry) => entry.version === '0.2.4');
	assert.ok(snapshotRecord);
	assert.ok(!snapshotRecord.html.includes('<script>'));
	await fs.writeFile(`${process.env.RELEASES_FILE}.tmp`, JSON.stringify([{ ...record, body: 'Edited published notes' }]));
	await fs.rename(`${process.env.RELEASES_FILE}.tmp`, process.env.RELEASES_FILE);
	assert.deepEqual(await source.listReleases(), first);
	now += 61_000;
	const updated = await source.listReleases();
	assert.equal(updated.find((entry) => entry.version === '0.2.4')?.body, 'Edited published notes');
	const restarted = await import('../server/lib/releases.js?snapshot-restart-test');
	assert.deepEqual(await restarted.listReleases(), updated);
	await fs.writeFile(process.env.RELEASES_FILE, 'partial JSON');
	now += 61_000;
	const warning = context.mock.method(console, 'warn', () => {});
	assert.deepEqual(await source.listReleases(), updated);
	assert.equal(warning.mock.callCount(), 1);
	assert.equal(request.mock.callCount(), 0);
});
