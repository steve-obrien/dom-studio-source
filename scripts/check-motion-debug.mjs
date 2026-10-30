import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// CSS is bundled by Vite; these tests exercise the actual keyboard installer in Node.
const source = (await readFile(new URL('../src/motionDebug.js', import.meta.url), 'utf8')).replace("import './motionDebug.css';", '');
const { installMotionDebugging } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

/** Creates a browser-event fixture with inspectable root attributes. */
function fixture() {
	const listeners = new Map();
	const attributes = new Set();
	const target = {
		addEventListener(name, handler) { listeners.set(name, handler); },
		removeEventListener(name) { listeners.delete(name); },
	};
	const root = { toggleAttribute(name, enabled) { if (enabled) attributes.add(name); else attributes.delete(name); } };
	const cleanup = installMotionDebugging(target, root);
	return {
		attributes, cleanup, listeners,
		fire(type, overrides = {}) { listeners.get(type)?.({ key: 'å', code: 'KeyA', altKey: true, timeStamp: 1000, preventDefault() {}, ...overrides }); },
	};
}

test('Alt alone and other Alt shortcuts never activate debugging', () => {
	const f = fixture();
	f.fire('keydown', { key: 'Alt', code: 'AltLeft' });
	f.fire('keyup', { key: 'Alt', code: 'AltLeft' });
	f.fire('keydown', { key: 'Alt', code: 'AltLeft', timeStamp: 1200 });
	f.fire('keydown', { key: 'ArrowUp', code: 'ArrowUp' });
	assert.equal(f.attributes.size, 0);
	f.cleanup();
});

test('physical Alt+A works on macOS and releasing either key stops it', () => {
	const f = fixture();
	f.fire('keydown');
	assert.equal(f.attributes.has('data-dom-studio-motion-debug'), true);
	f.fire('keyup');
	assert.equal(f.attributes.size, 0);
	f.fire('keydown', { timeStamp: 2000 });
	f.fire('keyup', { key: 'Alt', code: 'AltLeft', altKey: false });
	assert.equal(f.attributes.size, 0);
	f.cleanup();
});

test('repeat does not lock; double chord toggles lock; cleanup clears overrides', () => {
	const f = fixture();
	f.fire('keydown');
	f.fire('keydown', { repeat: true, timeStamp: 1100 });
	assert.equal(f.attributes.has('data-dom-studio-motion-debug-locked'), false);
	f.fire('keyup');
	f.fire('keydown', { timeStamp: 1200 });
	f.fire('keyup');
	assert.equal(f.attributes.has('data-dom-studio-motion-debug-locked'), true);
	f.fire('keydown', { timeStamp: 2000 });
	f.fire('keyup');
	f.fire('keydown', { timeStamp: 2200 });
	f.fire('keyup');
	assert.equal(f.attributes.size, 0);
	f.fire('keydown', { timeStamp: 3000 });
	f.cleanup();
	assert.equal(f.attributes.size, 0);
	assert.equal(f.listeners.size, 0);
});

test('editing and composition are ignored; blur resets momentary and double-tap state', () => {
	const f = fixture();
	f.fire('keydown', { target: { closest() { return {}; } } });
	f.fire('keydown', { target: { isContentEditable: true } });
	f.fire('keydown', { isComposing: true });
	assert.equal(f.attributes.size, 0);
	f.fire('keydown');
	f.fire('blur');
	assert.equal(f.attributes.size, 0);
	f.fire('keydown', { timeStamp: 1200 });
	assert.equal(f.attributes.has('data-dom-studio-motion-debug-locked'), false);
	f.cleanup();
});
