import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue';

/**
 * Owns one local capture stream. A replacement is emitted before the previous
 * microphone is released; cameras are released first for mobile camera switching.
 * Pending permission requests are invalidated on stop/disposal and late streams
 * are immediately released. No media is recorded, played back, or transmitted.
 *
 * @param {'audio'|'video'} kind The only media kind to request.
 * @param {object} props Reactive deviceId, muted, and constraints preferences.
 * @param {Function} emit Vue event emitter for stream, state, errors and models.
 * @returns {object} Reactive capture state and explicit start/stop/select actions.
 */
export function useMediaInput(kind, props, emit) {
	const stream = shallowRef(null);
	const devices = shallowRef([]);
	const deviceId = ref(props.deviceId || '');
	const muted = ref(Boolean(props.muted));
	const pending = ref(false);
	const error = ref('');
	const interrupted = ref(false);
	let request = 0;
	let enumeration = 0;
	let disposed = false;
	let mediaDevices;
	let removeTrackListeners = () => {};

	/** Describes local capture only; it does not imply a remote connection. */
	const state = computed(() => pending.value ? 'requesting' : stream.value ? 'active' : error.value ? 'error' : 'idle');
	/** Resolves a usable label without exposing a device identifier to the viewer. */
	const deviceLabel = computed(() => devices.value.find(matchesDevice)?.label || stream.value?.getTracks()[0]?.label || (kind === 'audio' ? 'Microphone' : 'Camera'));
	/** Tests the current committed input selection. */
	function matchesDevice(device) { return device.deviceId === deviceId.value; }
	/** Emits each meaningful local capture state transition. */
	watch(state, (value) => emit('state', value));
	/** Applies externally controlled device changes through the same capture path. */
	watch(() => props.deviceId, (value) => { if ((value || '') !== deviceId.value) select(value || ''); });
	/** Applies an externally controlled mute preference to current and future tracks. */
	watch(() => props.muted, (value) => setMuted(Boolean(value)));

	/** Returns the secure-context media API, attaching device discovery once. */
	function api() {
		if (globalThis.isSecureContext === false || !globalThis.navigator?.mediaDevices?.getUserMedia) {
			throw new Error('Device access needs HTTPS or localhost and a browser that supports media capture.');
		}
		if (!mediaDevices) {
			mediaDevices = globalThis.navigator.mediaDevices;
			mediaDevices.addEventListener?.('devicechange', refresh);
		}
		return mediaDevices;
	}

	/** Refreshes permission-filtered inputs without requesting or opening a device. */
	async function refresh() {
		const version = ++enumeration;
		try {
			const list = await api().enumerateDevices();
			if (disposed || version !== enumeration) return;
			devices.value = list.filter(isInput).map(labelDevice);
		} catch {
			// Discovery can be unavailable while a tab is hidden; capture still works.
		}
	}
	/** Keeps only selectable inputs of the requested kind. */
	function isInput(device) { return device.kind === `${kind}input` && Boolean(device.deviceId); }
	/** Supplies stable fallback labels until browser permission reveals real names. */
	function labelDevice(device, index) {
		return { deviceId: device.deviceId, label: device.label || `${kind === 'audio' ? 'Microphone' : 'Camera'} ${index + 1}` };
	}

	/** Stops every track owned by the provided capture stream. */
	function release(value) { for (const track of value?.getTracks() || []) track.stop(); }
	/** Detaches listeners and releases the current stream, notifying consumers first. */
	function clearStream() {
		removeTrackListeners();
		removeTrackListeners = () => {};
		const previous = stream.value;
		stream.value = null;
		interrupted.value = false;
		if (previous) emit('stream', null);
		release(previous);
	}

	/** Converts browser capture errors into actionable, provider-independent copy. */
	function report(cause) {
		const input = kind === 'audio' ? 'microphone' : 'camera';
		const messages = {
			NotAllowedError: `Allow ${input} access in your browser settings, then try again.`,
			SecurityError: `This page is not allowed to use your ${input}. Check the browser or embedded-page permissions.`,
			NotFoundError: `No ${input} was found. Connect one and try again.`,
			NotReadableError: `The ${input} is unavailable. Close other apps using it and try again.`,
			OverconstrainedError: `The selected ${input} or its settings are unavailable. Choose another input or retry with the system default.`,
			AbortError: `The ${input} could not start. Try again.`,
		};
		error.value = messages[cause?.name] || cause?.message || `Could not start the ${input}. Try again.`;
		emit('error', { name: cause?.name || 'Error', message: error.value });
	}

	/**
	 * Requests capture after a user action. Resolves with the committed stream or
	 * null on failure/cancellation; consumers receive all changes via stream events.
	 * @param {string} selected Device identifier, or an empty string for the default.
	 * @returns {Promise<MediaStream|null>} Active local stream, if still requested.
	 */
	async function start(selected = deviceId.value) {
		if (disposed) return null;
		const version = ++request;
		pending.value = true;
		error.value = '';
		try {
			const capture = api();
			if (kind === 'video') clearStream();
			const constraints = { ...(props.constraints || {}) };
			// Selection owns deviceId; caller constraints cannot silently override it.
			delete constraints.deviceId;
			if (selected) constraints.deviceId = { exact: selected };
			const next = await capture.getUserMedia({ audio: false, video: false, [kind]: Object.keys(constraints).length ? constraints : true });
			if (disposed || version !== request) { release(next); return null; }
			const track = next.getTracks().find(isCaptureTrack);
			if (!track || track.readyState === 'ended') {
				release(next);
				throw new Error('The input stopped before it was ready. Try again.');
			}
			removeTrackListeners();
			const previous = stream.value;
			stream.value = next;
			track.enabled = !muted.value;
			interrupted.value = track.muted;
			track.addEventListener('ended', ended);
			track.addEventListener('mute', trackMuted);
			track.addEventListener('unmute', trackMuted);
			/** Removes listeners before stopping a replaced or disposed track. */
			removeTrackListeners = () => {
				track.removeEventListener('ended', ended);
				track.removeEventListener('mute', trackMuted);
				track.removeEventListener('unmute', trackMuted);
			};
			deviceId.value = selected || track.getSettings().deviceId || '';
			emit('update:deviceId', deviceId.value);
			emit('stream', next);
			release(previous);
			await refresh();
			return version === request ? next : null;
		} catch (cause) {
			if (!disposed && version === request) {
				report(cause);
				// The last working microphone stays selected when replacement fails.
				emit('update:deviceId', deviceId.value);
			}
			return null;
		} finally {
			if (!disposed && version === request) pending.value = false;
		}
	}
	/** Matches the requested media track without depending on track ordering. */
	function isCaptureTrack(track) { return track.kind === kind; }
	/** Surfaces hardware interruptions without pretending that silence is speech. */
	function trackMuted() { interrupted.value = Boolean(stream.value?.getTracks().find(isCaptureTrack)?.muted); }
	/** Reports a removed/revoked device and leaves retry under the user's control. */
	function ended() {
		stop();
		report(new Error(`The ${kind === 'audio' ? 'microphone' : 'camera'} disconnected or access ended. Reconnect it and try again.`));
		refresh();
	}

	/** Cancels pending capture and releases all currently owned media tracks. */
	function stop() {
		request++;
		pending.value = false;
		error.value = '';
		clearStream();
	}
	/** Selects a future input or replaces the active stream without recording it. */
	async function select(value) {
		if (disposed) return;
		if (stream.value || pending.value) return start(value);
		deviceId.value = value;
		error.value = '';
		emit('update:deviceId', value);
	}
	/** Changes capture track enabled state, retaining the device until Stop. */
	function setMuted(value) {
		muted.value = value;
		for (const track of stream.value?.getTracks() || []) track.enabled = !value;
		emit('update:muted', value);
	}
	/** Toggles the microphone without opening a second capture stream. */
	function toggleMuted() { setMuted(!muted.value); }
	/** Releases hardware on navigation, including pages entering the back-forward cache. */
	globalThis.window?.addEventListener('pagehide', stop);
	/** Invalidates async work and removes all device/page listeners on scope disposal. */
	onScopeDispose(() => {
		disposed = true;
		enumeration++;
		stop();
		mediaDevices?.removeEventListener?.('devicechange', refresh);
		globalThis.window?.removeEventListener('pagehide', stop);
	});
	return { stream, devices, deviceId, deviceLabel, muted, interrupted, pending, error, state, start, stop, select, refresh, setMuted, toggleMuted };
}
