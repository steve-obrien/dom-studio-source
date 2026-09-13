import assert from 'node:assert/strict';
import { test } from 'node:test';
import { focusTrap } from '../src/pages/lib/headless/base.js';
import { DomDrawerElement } from '../src/pages/lib/headless/drawer.js';

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
