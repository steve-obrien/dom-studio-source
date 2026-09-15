import assert from 'node:assert/strict';
import { test } from 'node:test';
import { effectScope, nextTick, reactive } from 'vue';
import { useMediaInput } from '../src/pages/components/_shared/media/useMediaInput.js';

/** Models a hardware track with independently observable enable/stop state. */
class Track extends EventTarget {
	/** Creates a track with realistic lifecycle and selection metadata. */
	constructor(kind, id) { super(); this.kind = kind; this.id = id; this.label = id; this.readyState = 'live'; this.enabled = true; this.muted = false; this.stops = 0; }
	/** Returns the selected device without involving physical hardware. */
	getSettings() { return { deviceId: this.id }; }
	/** Records release; like a real stop(), this does not fire an ended event. */
	stop() { this.stops++; this.readyState = 'ended'; }
}
/** Creates the minimal standard stream API required by the capture controller. */
function makeStream(kind, id) {
	const track = new Track(kind, id);
	return { track, getTracks() { return [track]; } };
}
/** Creates a deferred permission/device request to test cancellation ordering. */
function deferred() {
	let resolve;
	let reject;
	const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
	return { promise, resolve, reject };
}
/** Installs a scoped browser boundary; every test restores globals and listeners. */
function fixture(t, kind = 'audio', overrides = {}) {
	const previous = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
	const media = new EventTarget();
	const requests = [];
	media.enumerateDevices = async () => [
		{ kind: 'audioinput', deviceId: 'mic-a', label: 'Desk microphone' },
		{ kind: 'audioinput', deviceId: 'mic-b', label: 'Headset' },
		{ kind: 'audiooutput', deviceId: 'speaker', label: 'Speaker' },
		{ kind: 'videoinput', deviceId: 'camera-a', label: 'Webcam' },
	];
	media.getUserMedia = async (constraints) => { requests.push(constraints); return makeStream(kind, kind === 'audio' ? 'mic-a' : 'camera-a'); };
	Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: media } });
	const props = reactive({ deviceId: '', muted: false, constraints: null, ...overrides });
	const events = [];
	const scope = effectScope();
	const input = scope.run(() => useMediaInput(kind, props, (name, value) => events.push({ name, value })));
	t.after(() => { scope.stop(); if (previous) Object.defineProperty(globalThis, 'navigator', previous); else delete globalThis.navigator; });
	return { input, media, props, events, scope, requests };
}

/** Proves capture is explicit, input-only, and mute changes the actual track. */
test('opens only on start, selects real input metadata, and mutes tracks', async (t) => {
	const { input, requests, events } = fixture(t);
	assert.equal(requests.length, 0);
	const stream = await input.start();
	assert.deepEqual(requests, [{ audio: true, video: false }]);
	assert.equal(input.deviceId.value, 'mic-a');
	assert.equal(input.devices.value.length, 2);
	input.toggleMuted();
	assert.equal(stream.track.enabled, false);
	input.stop();
	assert.equal(stream.track.stops, 1);
	assert.equal(events.filter((event) => event.name === 'stream').at(-1).value, null);
});

/** Proves a late permission grant cannot reactivate a cancelled microphone. */
test('stop cancels pending access and releases the late stream', async (t) => {
	const { input, media, events } = fixture(t);
	const request = deferred();
	media.getUserMedia = () => request.promise;
	const pending = input.start();
	input.stop();
	const late = makeStream('audio', 'late');
	request.resolve(late);
	assert.equal(await pending, null);
	assert.equal(late.track.stops, 1);
	assert.equal(input.stream.value, null);
	assert.equal(events.some((event) => event.name === 'stream'), false);
});

/** Proves scope disposal rejects pending capture and removes device listeners. */
test('unmount releases late streams and removes devicechange discovery', async (t) => {
	const { input, media, scope } = fixture(t);
	const request = deferred();
	let enumerations = 0;
	media.getUserMedia = () => request.promise;
	media.enumerateDevices = async () => { enumerations++; return []; };
	const pending = input.start();
	scope.stop();
	const late = makeStream('audio', 'late');
	request.resolve(late);
	await pending;
	media.dispatchEvent(new Event('devicechange'));
	await nextTick();
	assert.equal(late.track.stops, 1);
	assert.equal(enumerations, 0);
});

/** Proves a failed replacement cannot discard the user's last working input. */
test('failed microphone selection retains the old stream and committed device', async (t) => {
	const { input, media } = fixture(t);
	const original = await input.start();
	media.getUserMedia = async () => { throw new DOMException('busy', 'NotReadableError'); };
	await input.select('mic-b');
	assert.equal(input.stream.value, original);
	assert.equal(input.deviceId.value, 'mic-a');
	assert.equal(original.track.stops, 0);
	assert.match(input.error.value, /Close other apps/);
});

/** Proves out-of-order device responses cannot overwrite the latest selection. */
test('rapid switches commit only the newest stream and carry mute forward', async (t) => {
	const { input, media } = fixture(t);
	const original = await input.start();
	input.setMuted(true);
	const first = deferred();
	const second = deferred();
	let calls = 0;
	media.getUserMedia = () => (++calls === 1 ? first.promise : second.promise);
	const pendingFirst = input.select('mic-b');
	const pendingSecond = input.select('mic-c');
	const latest = makeStream('audio', 'mic-c');
	second.resolve(latest);
	await pendingSecond;
	const stale = makeStream('audio', 'mic-b');
	first.resolve(stale);
	await pendingFirst;
	assert.equal(input.stream.value, latest);
	assert.equal(input.deviceId.value, 'mic-c');
	assert.equal(latest.track.enabled, false);
	assert.equal(original.track.stops, 1);
	assert.equal(stale.track.stops, 1);
});

/** Proves selection controls cannot be overridden by unrelated constraints. */
test('applies constraints and controlled mute without opening extra capture', async (t) => {
	const { input, props, requests } = fixture(t, 'audio', { constraints: { deviceId: 'wrong', echoCancellation: true } });
	const stream = await input.start('mic-b');
	assert.deepEqual(requests[0], { video: false, audio: { deviceId: { exact: 'mic-b' }, echoCancellation: true } });
	props.muted = true;
	await nextTick();
	assert.equal(stream.track.enabled, false);
	assert.equal(requests.length, 1);
});

/** Proves unplugging or revocation ends capture and exposes a retryable error. */
test('hardware interruption and track ending are reflected in capture state', async (t) => {
	const { input } = fixture(t);
	const stream = await input.start();
	stream.track.muted = true;
	stream.track.dispatchEvent(new Event('mute'));
	assert.equal(input.interrupted.value, true);
	stream.track.dispatchEvent(new Event('ended'));
	assert.equal(input.stream.value, null);
	assert.match(input.error.value, /disconnected or access ended/);
});

/** Proves camera replacement releases hardware first and never requests audio. */
test('camera switches release the previous camera before opening the next', async (t) => {
	const { input, media, requests } = fixture(t, 'video');
	const original = await input.start();
	assert.deepEqual(requests, [{ audio: false, video: true }]);
	media.getUserMedia = async (constraints) => {
		assert.equal(original.track.stops, 1);
		assert.equal(constraints.audio, false);
		throw new DOMException('missing camera', 'NotFoundError');
	};
	await input.select('camera-b');
	assert.equal(input.stream.value, null);
	assert.match(input.error.value, /No camera was found/);
});

/** Proves device discovery follows hot-plug changes without acquiring a new stream. */
test('devicechange refreshes names without opening another microphone', async (t) => {
	const { input, media, requests } = fixture(t);
	await input.start();
	media.enumerateDevices = async () => [{ kind: 'audioinput', deviceId: 'new', label: 'USB microphone' }];
	media.dispatchEvent(new Event('devicechange'));
	await nextTick();
	assert.deepEqual(input.devices.value, [{ deviceId: 'new', label: 'USB microphone' }]);
	assert.equal(requests.length, 1);
});

/** Proves denied access stays idle with actionable copy and supports retry. */
test('permission denial emits no stream and can be retried', async (t) => {
	const { input, media } = fixture(t);
	media.getUserMedia = async () => { throw new DOMException('denied', 'NotAllowedError'); };
	assert.equal(await input.start(), null);
	assert.equal(input.state.value, 'error');
	assert.match(input.error.value, /browser settings/);
	media.getUserMedia = async () => makeStream('audio', 'mic-a');
	assert.ok(await input.start());
	assert.equal(input.error.value, '');
});
