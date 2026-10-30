import assert from 'node:assert/strict';
import { test } from 'node:test';
import { focusTrap } from '../src/pages/lib/headless/base.js';
import { DomDrawerElement } from '../src/pages/lib/headless/drawer.js';
import { keyboardHeight, normalizeSnapPoints, resolveSnapPoint, resolveSwipeRelease } from '../src/pages/mobile/_shared/interactionMath.js';
import { createRenderer, nextTick, ref } from 'vue';
import { useKeyboardViewport } from '../src/pages/mobile/_shared/useKeyboardViewport.js';

/** Mounts the real viewport composable in an isolated Vue lifecycle and fake owner window. */
function keyboardSurface() {
	const viewport = Object.assign(new EventTarget(), { height: 844, scale: 1, offsetTop: 0 });
	const frames = new Map();
	let sequence = 0;
	const view = Object.assign(new EventTarget(), {
		innerHeight: 844, innerWidth: 390, visualViewport: viewport,
		/** Queues a controllable animation frame. */
		requestAnimationFrame(callback) { const id = ++sequence; frames.set(id, callback); return id; },
		/** Cancels an outstanding measurement. */
		cancelAnimationFrame(id) { frames.delete(id); },
		setTimeout, clearTimeout,
	});
	const doc = Object.assign(new EventTarget(), { defaultView: view, documentElement: { clientHeight: 844 }, activeElement: null });
	const input = { matches: () => true, readOnly: false, disabled: false };
	const element = { ownerDocument: doc, top: 0, contains: (node) => node === input, getBoundingClientRect() { return { top: this.top }; } };
	const enabled = ref(true);
	const inset = ref(null);
	let state;
	const renderer = createRenderer({ createComment: () => ({}), insert() {}, remove() {}, parentNode: () => null, nextSibling: () => null });
	const app = renderer.createApp({
		/** Installs the production composable within a mounted component. */
		setup() {
			state = useKeyboardViewport(ref(element), () => enabled.value, () => inset.value);
			return () => null;
		},
	});
	app.mount({});
	/** Flushes coalesced measurement after a real EventTarget notification. */
	function measure() {
		viewport.dispatchEvent(new Event('resize'));
		const pending = [...frames.values()];
		frames.clear();
		pending.forEach((callback) => callback());
	}
	return { viewport, view, doc, input, element, enabled, inset, state, measure, app, frames };
}

test('keyboard viewport follows editing, embedded origin, zoom, and keyboard closure', () => {
	const surface = keyboardSurface();
	const { viewport, doc, input, state, element, measure, app } = surface;
	doc.activeElement = input;
	viewport.height = 520;
	measure();
	assert.equal(state.open.value, true);
	assert.equal(state.height.value, 324);
	assert.equal(state.available.value, 520);
	element.top = 100;
	measure();
	assert.equal(state.available.value, 420);
	viewport.scale = 2;
	measure();
	assert.equal(state.open.value, false);
	viewport.scale = 1;
	viewport.height = 844;
	measure();
	assert.equal(state.open.value, false);
	app.unmount();
	viewport.dispatchEvent(new Event('resize'));
	assert.equal(surface.frames.size, 0);
});

test('native keyboard overrides avoid double shrinking and can be explicitly disabled', async () => {
	const { viewport, view, doc, input, inset, enabled, state, measure, app } = keyboardSurface();
	doc.activeElement = input;
	inset.value = 300;
	await nextTick();
	measure();
	assert.equal(state.available.value, 544);
	view.innerHeight = 544;
	doc.documentElement.clientHeight = 544;
	viewport.height = 544;
	measure();
	assert.equal(state.available.value, 544);
	inset.value = 0;
	await nextTick();
	measure();
	assert.equal(state.open.value, false);
	inset.value = 300;
	enabled.value = false;
	await nextTick();
	measure();
	assert.equal(state.height.value, 0);
	app.unmount();
});

test('sheet stops reject invalid values, sort duplicates, and retain opt-in dismissal', () => {
	assert.deepEqual(normalizeSnapPoints([0.9, 0, -1, 0.5, NaN, 2, 0.5, '0.7']), [0, 0.5, 0.9]);
	assert.deepEqual(normalizeSnapPoints([0]), [0, 0.5, 0.9]);
	assert.deepEqual(normalizeSnapPoints([0.4, 1]), [0.4, 1]);
});

test('sheet releases choose nearby heights and respect the absence of a dismiss stop', () => {
	assert.equal(resolveSnapPoint([0, 0.4, 0.7, 0.95], 0.6), 0.7);
	assert.equal(resolveSnapPoint([0, 0.4, 0.7, 0.95], 0.2, -0.001), 0);
	assert.equal(resolveSnapPoint([0.4, 0.7, 0.95], 0.05, -0.002), 0.4);
	assert.equal(resolveSnapPoint([0, 0.4, 0.7, 0.95], 0.55, 0.002), 0.95);
});

test('swiping needs distance and explicit opt-in before it can commit', () => {
	const row = { rowWidth: 390, actionWidth: 160 };
	assert.equal(resolveSwipeRelease({ ...row, distance: 15, velocity: 0 }), 'close');
	assert.equal(resolveSwipeRelease({ ...row, distance: 65 }), 'reveal');
	assert.equal(resolveSwipeRelease({ ...row, distance: 20, velocity: 3, fullSwipe: true }), 'reveal');
	assert.equal(resolveSwipeRelease({ ...row, distance: 320, fullSwipe: false }), 'reveal');
	assert.equal(resolveSwipeRelease({ ...row, distance: 320, fullSwipe: true }), 'commit');
	assert.equal(resolveSwipeRelease({ ...row, distance: 320, fullSwipe: true, cancelled: true }), 'close');
	assert.equal(resolveSwipeRelease({ ...row, distance: 320, fullSwipe: true, actionWidth: 0 }), 'close');
});

test('deliberate flicks project momentum into full actions while pauses and reversals do not', () => {
	const row = { rowWidth: 390, actionWidth: 100, fullSwipe: true };
	assert.equal(resolveSwipeRelease({ ...row, distance: 110, velocity: 1.2 }), 'commit');
	assert.equal(resolveSwipeRelease({ ...row, distance: 110, velocity: 0 }), 'reveal');
	assert.equal(resolveSwipeRelease({ ...row, distance: 20, velocity: 4 }), 'reveal');
	assert.equal(resolveSwipeRelease({ ...row, distance: 300, velocity: -1 }), 'reveal');
	assert.equal(resolveSwipeRelease({ ...row, distance: 110, velocity: 1.2, fullSwipe: false }), 'reveal');
	assert.equal(resolveSwipeRelease({ ...row, distance: 110, velocity: 1.2, cancelled: true }), 'close');
});

test('keyboard detection excludes browser chrome, pinch zoom, and unfocused resize', () => {
	assert.equal(keyboardHeight({ baseline: 844, viewportHeight: 520, editing: true }), 324);
	assert.equal(keyboardHeight({ baseline: 844, viewportHeight: 760, editing: true }), 0);
	assert.equal(keyboardHeight({ baseline: 844, viewportHeight: 422, editing: true, scale: 2 }), 0);
	assert.equal(keyboardHeight({ baseline: 844, viewportHeight: 520, editing: false }), 0);
	assert.equal(keyboardHeight({ baseline: 520, viewportHeight: 844, editing: true }), 0);
});

/** Creates a minimal focus surface with the ownership rules of an iframe. */
function focusSurface() {
	const ownerDocument = { activeElement: null };
	let listener;
	const container = {
		ownerDocument,
		nodes: [],
		/** Returns the currently focusable descendants for the trap. */
		querySelectorAll() { return this.nodes; },
		/** Captures the keyboard listener for a deterministic regression test. */
		addEventListener(_type, callback) { listener = callback; },
		/** Releases the captured listener during cleanup. */
		removeEventListener() { listener = null; },
		/** Focuses the panel in its own document. */
		focus() { ownerDocument.activeElement = this; },
	};
	/** Creates a visible, hidden, or inert focus candidate. */
	function control({ hidden = false, inert = false } = {}) {
		return {
			/** Reports whether the candidate has an inert ancestor. */
			closest() { return inert ? {} : null; },
			/** Reports whether the candidate participates in layout. */
			getClientRects() { return hidden ? [] : [{}]; },
			/** Moves focus within the candidate's owner document. */
			focus() { ownerDocument.activeElement = this; },
		};
	}
	/** Dispatches Tab and reports whether the browser default was prevented. */
	function tab(shiftKey = false) {
		let prevented = false;
		listener?.({ key: 'Tab', shiftKey, preventDefault() { prevented = true; } });
		return prevented;
	}
	return { container, control, tab, ownerDocument };
}

test('iframe focus wraps and ignores hidden or inert controls', () => {
	const { container, control, tab, ownerDocument } = focusSurface();
	const first = control();
	const last = control();
	container.nodes = [control({ hidden: true }), first, last, control({ inert: true })];
	const cleanup = focusTrap(container);
	last.focus();
	assert.equal(tab(), true);
	assert.equal(ownerDocument.activeElement, first);
	assert.equal(tab(true), true);
	assert.equal(ownerDocument.activeElement, last);
	cleanup();
	assert.equal(tab(), false);
});

test('initial panel focus supports both Tab directions and an empty panel', () => {
	const { container, control, tab, ownerDocument } = focusSurface();
	const first = control();
	const last = control();
	container.nodes = [first, last];
	focusTrap(container);
	container.focus();
	assert.equal(tab(true), true);
	assert.equal(ownerDocument.activeElement, last);
	container.focus();
	assert.equal(tab(), true);
	assert.equal(ownerDocument.activeElement, first);
	container.nodes = [];
	assert.equal(tab(), true);
	assert.equal(ownerDocument.activeElement, container);
});

/** Creates a drawer with a distinct document or a containing app scroll region. */
function drawerFor(body, appMain = null) {
	const drawer = Object.create(DomDrawerElement.prototype);
	drawer.ownerDocument = { body };
	drawer.closest = () => appMain ? { querySelector: () => appMain } : null;
	return drawer;
}

test('overlapping drawers restore the original overflow only after the final close', () => {
	const body = { style: { overflow: 'clip' } };
	const first = drawerFor(body);
	const second = drawerFor(body);
	first._lockScroll();
	first._lockScroll();
	second._lockScroll();
	assert.equal(body.style.overflow, 'hidden');
	first._unlockScroll();
	assert.equal(body.style.overflow, 'hidden');
	second._unlockScroll();
	assert.equal(body.style.overflow, 'clip');
	second._unlockScroll();
	assert.equal(body.style.overflow, 'clip');
});

test('embedded sheets lock their app and never lock a different document', () => {
	const body = { style: { overflow: 'auto' } };
	const main = { style: { overflow: '' } };
	const otherBody = { style: { overflow: 'scroll' } };
	const contained = drawerFor(body, main);
	const standalone = drawerFor(otherBody);
	contained._lockScroll();
	standalone._lockScroll();
	assert.equal(body.style.overflow, 'auto');
	assert.equal(main.style.overflow, 'hidden');
	contained._unlockScroll();
	assert.equal(main.style.overflow, '');
	assert.equal(otherBody.style.overflow, 'hidden');
	standalone._unlockScroll();
	assert.equal(otherBody.style.overflow, 'scroll');
});
