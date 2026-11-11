import assert from 'node:assert/strict';
import test from 'node:test';
import { effectScope, ref } from 'vue';
import { clampNumber, useNumberScrub } from '../src/pages/forms/_shared/useNumberScrub.js';

/** Creates a pointer-capable element boundary without a browser or global event listeners. */
class ScrubTarget extends EventTarget {
	/** Owns an isolated document/window and a set of active pointer captures. */
	constructor() {
		super();
		this.ownerDocument = new EventTarget();
		this.ownerDocument.defaultView = new EventTarget();
		this.captures = new Set();
	}
	/** Captures one test pointer. */
	setPointerCapture(id) { this.captures.add(id); }
	/** Reports whether this element owns a pointer. */
	hasPointerCapture(id) { return this.captures.has(id); }
	/** Releases only the named pointer. */
	releasePointerCapture(id) { this.captures.delete(id); }
}

/** Builds cancelable DOM-like input events with explicit coordinates or wheel deltas. */
function inputEvent(type, values = {}) {
	const event = new Event(type, { cancelable: true });
	for (const [key, value] of Object.entries({ pointerId: 1, button: 0, pointerType: 'mouse', clientX: 100, shiftKey: false, ...values })) {
		Object.defineProperty(event, key, { value });
	}
	return event;
}

/** Sets up a controlled numeric model and records previews separately from committed actions. */
function fixture(t, options = {}) {
	const model = ref(50);
	const disabled = ref(false);
	const commits = [];
	const previews = [];
	const cancellations = [];
	const target = new ScrubTarget();
	const scope = effectScope();
	const scrub = scope.run(() => useNumberScrub({
		value: model, min: 1, max: 100, step: 1, disabled,
		onPreview: (value) => { previews.push(value); },
		onCommit: (value) => { commits.push(value); model.value = value; },
		onCancel: (value) => { cancellations.push(value); },
		...options,
	}));
	t.after(() => scope.stop());
	/** Starts a gesture through the same currentTarget contract as a component pointer handler. */
	function press(values = {}) {
		scrub.start(inputEvent('pointerdown', { currentTarget: target, ...values }));
	}
	return { model, disabled, commits, previews, cancellations, target, scrub, scope, press };
}

/** Ordinary clicks and hand jitter must remain clicks, with no navigation or click suppression. */
test('a click below the drag threshold does not commit', (t) => {
	const f = fixture(t);
	f.press();
	f.target.dispatchEvent(inputEvent('pointermove', { clientX: 102 }));
	f.target.dispatchEvent(inputEvent('pointerup', { clientX: 102 }));
	assert.deepEqual(f.commits, []);
	assert.deepEqual(f.previews, []);
	const click = inputEvent('click', { detail: 1 });
	f.scrub.consumeClick(click);
	assert.equal(click.defaultPrevented, false);
	assert.equal(f.target.captures.size, 0);
});

/** A page scrub previews without navigation, then commits once and consumes the trailing click. */
test('dragging commits only on release and does not also click', (t) => {
	const f = fixture(t);
	f.press();
	f.target.dispatchEvent(inputEvent('pointermove', { clientX: 120 }));
	assert.deepEqual(f.previews, [60]);
	assert.equal(f.model.value, 50);
	assert.deepEqual(f.commits, []);
	f.target.dispatchEvent(inputEvent('pointerup', { clientX: 124 }));
	assert.deepEqual(f.commits, [62]);
	assert.equal(f.target.captures.size, 0);
	const click = inputEvent('click', { detail: 1 });
	f.scrub.consumeClick(click);
	assert.equal(click.defaultPrevented, true);
	f.target.dispatchEvent(inputEvent('pointerup', { clientX: 200 }));
	assert.deepEqual(f.commits, [62]);
});

/** At a range boundary, reversing direction must respond without undoing an overshoot first. */
test('ranges clamp both ends and respond immediately after reversing', (t) => {
	const f = fixture(t, { min: 20, max: 70 });
	f.press();
	f.target.dispatchEvent(inputEvent('pointermove', { clientX: 600 }));
	assert.equal(f.scrub.preview.value, 70);
	f.target.dispatchEvent(inputEvent('pointermove', { clientX: 598 }));
	assert.equal(f.scrub.preview.value, 69);
	f.target.dispatchEvent(inputEvent('pointermove', { clientX: -600 }));
	assert.equal(f.scrub.preview.value, 20);
	f.target.dispatchEvent(inputEvent('pointerup', { clientX: -600 }));
	assert.deepEqual(f.commits, [20]);
});

/** Shift changes subsequent movement speed without recomputing the whole drag from its origin. */
test('Shift accelerates incremental dragging and decimal steps stay precise', (t) => {
	const f = fixture(t, { step: 0.25 });
	f.press();
	f.target.dispatchEvent(inputEvent('pointermove', { clientX: 104 }));
	assert.equal(f.scrub.preview.value, 50.5);
	f.target.dispatchEvent(inputEvent('pointerup', { clientX: 106, shiftKey: true }));
	assert.deepEqual(f.commits, [53]);
	assert.equal(clampNumber(0.1 + 0.2, { step: 0.1 }), 0.3);
});

/** Designer CSS values survive cancelling a temporary numeric preview. */
test('cancellation can restore a nonnumeric designer value', (t) => {
	const f = fixture(t, { restoreValue: 'auto' });
	f.press();
	f.target.dispatchEvent(inputEvent('pointermove', { clientX: 110 }));
	f.scrub.cancel();
	assert.deepEqual(f.cancellations, ['auto']);
	assert.deepEqual(f.commits, []);
});

/** Escape, capture loss, and pointer cancellation must never navigate on a later mouse release. */
test('cancellation restores previews and removes every release path', (t) => {
	for (const reason of ['Escape', 'pointercancel', 'lostpointercapture', 'blur']) {
		const f = fixture(t);
		f.press();
		f.target.dispatchEvent(inputEvent('pointermove', { clientX: 120 }));
		if (reason === 'Escape') f.target.ownerDocument.dispatchEvent(inputEvent('keydown', { key: 'Escape' }));
		else if (reason === 'blur') f.target.ownerDocument.defaultView.dispatchEvent(new Event('blur'));
		else f.target.dispatchEvent(inputEvent(reason));
		f.target.dispatchEvent(inputEvent('pointerup', { clientX: 120 }));
		assert.deepEqual(f.commits, [], reason);
		assert.deepEqual(f.cancellations, [50], reason);
		assert.equal(f.target.captures.size, 0, reason);
	}
});

/** Disabled controls, touch scrolling, and unmounted controls must not retain gestures. */
test('disabled, touch and scope disposal do not commit or leak capture', (t) => {
	const f = fixture(t);
	f.press({ pointerType: 'touch' });
	assert.equal(f.target.captures.size, 0);
	f.disabled.value = true;
	f.press();
	assert.equal(f.target.captures.size, 0);
	f.disabled.value = false;
	f.press();
	f.target.dispatchEvent(inputEvent('pointermove', { clientX: 110 }));
	f.disabled.value = true;
	assert.equal(f.target.captures.size, 0);
	assert.deepEqual(f.commits, []);
	f.disabled.value = false;
	f.press();
	f.target.dispatchEvent(inputEvent('pointermove', { clientX: 110 }));
	f.scope.stop();
	f.target.dispatchEvent(inputEvent('pointerup', { clientX: 110 }));
	assert.equal(f.target.captures.size, 0);
	assert.deepEqual(f.commits, []);
});

/** Consumers can disable a control synchronously while receiving the release's final preview. */
test('disabling during the final preview cancels release without a stale commit', (t) => {
	const disabled = ref(false);
	const f = fixture(t, {
		disabled,
		onPreview: () => { disabled.value = true; },
	});
	f.press();
	f.target.dispatchEvent(inputEvent('pointerup', { clientX: 120 }));
	assert.deepEqual(f.commits, []);
	assert.equal(f.target.captures.size, 0);
});

/** Trackpads accumulate deliberate movement, while pinch zoom remains untouched. */
test('wheel adjustment is bounded, accelerated, and preserves pinch zoom', (t) => {
	const f = fixture(t);
	f.scrub.wheel(inputEvent('wheel', { deltaY: -20, deltaMode: 0 }));
	assert.deepEqual(f.previews, []);
	f.scrub.wheel(inputEvent('wheel', { deltaY: -20, deltaMode: 0 }));
	assert.deepEqual(f.previews, [51]);
	f.scrub.wheel(inputEvent('wheel', { deltaY: 40, deltaMode: 0, shiftKey: true }));
	assert.equal(f.previews.at(-1), 40);
	const zoom = inputEvent('wheel', { deltaY: 100, deltaMode: 0, ctrlKey: true });
	f.scrub.wheel(zoom);
	assert.equal(zoom.defaultPrevented, false);
	assert.deepEqual(f.commits, []);
});
