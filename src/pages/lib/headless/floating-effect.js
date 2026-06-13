const effectTimers = new WeakMap();

export const FLOATING_EFFECT_NAME = 'scale-fade';
export const FLOATING_EFFECT_CLASS = 'dom-floating-transition';
export const FLOATING_EFFECT_DURATION_MS = 320;

function viewFor(element) {
	return element?.ownerDocument?.defaultView || window;
}

function flushFloatingEffectStyle(element) {
	if (!element) return;
	const style = viewFor(element).getComputedStyle(element);
	element.getBoundingClientRect();
	void style.opacity;
	void style.transform;
}

export function prepareFloatingEffect(element, name = FLOATING_EFFECT_NAME) {
	if (!element) return;
	if (!element.dataset.floatingEffect && !element.classList.contains(FLOATING_EFFECT_CLASS)) return;
	element.dataset.floatingEffect ||= name;
	element.classList.add(FLOATING_EFFECT_CLASS);
}

export function hasFloatingEffect(element) {
	return Boolean(element && (
		element.dataset.floatingEffect
		|| element.classList.contains(FLOATING_EFFECT_CLASS)
	));
}

export function clearFloatingEffectTimer(element) {
	if (!element) return;
	const timer = effectTimers.get(element);
	if (!timer) return;
	viewFor(element).clearTimeout(timer);
	effectTimers.delete(element);
}

export function resetFloatingEffectState(element) {
	if (!element) return;
	clearFloatingEffectTimer(element);
	delete element.dataset.floatingOpen;
	delete element.dataset.entering;
	delete element.dataset.leaving;
	delete element.dataset.animatePlacement;
}

export function beginFloatingEffectEnter(element, {
	shouldContinue = () => true,
	beforeMeasure,
	beforeFrame,
	delayFrames = 0,
	durationMs = FLOATING_EFFECT_DURATION_MS,
} = {}) {
	if (!element || !hasFloatingEffect(element)) return false;
	const view = viewFor(element);
	clearFloatingEffectTimer(element);
	delete element.dataset.leaving;
	element.dataset.floatingEffect ||= FLOATING_EFFECT_NAME;
	element.dataset.floatingOpen = 'true';
	element.dataset.animatePlacement = 'true';
	element.dataset.entering = 'from';
	beforeMeasure?.();
	flushFloatingEffectStyle(element);
	const enter = () => {
		if (!shouldContinue() || element.dataset.entering !== 'from') return;
		beforeFrame?.();
		element.dataset.entering = 'to';
		const timer = view.setTimeout(() => {
			if (element.dataset.entering === 'to') delete element.dataset.entering;
			effectTimers.delete(element);
		}, durationMs);
		effectTimers.set(element, timer);
	};
	const queueEnter = (frames) => {
		view.requestAnimationFrame(() => {
			if (frames > 0) queueEnter(frames - 1);
			else enter();
		});
	};
	queueEnter(delayFrames);
	return true;
}

export function beginFloatingEffectLeave(element, {
	finish,
	shouldContinue = () => true,
	immediate = false,
	durationMs = FLOATING_EFFECT_DURATION_MS,
} = {}) {
	if (!element) return;
	const view = viewFor(element);
	clearFloatingEffectTimer(element);
	delete element.dataset.entering;
	if (immediate || !hasFloatingEffect(element)) {
		resetFloatingEffectState(element);
		finish?.();
		return;
	}
	element.dataset.floatingEffect ||= FLOATING_EFFECT_NAME;
	element.dataset.floatingOpen = 'true';
	element.dataset.leaving = 'from';
	flushFloatingEffectStyle(element);
	view.requestAnimationFrame(() => {
		if (!shouldContinue() || element.dataset.leaving !== 'from') return;
		element.dataset.leaving = 'to';
	});
	const timer = view.setTimeout(() => {
		effectTimers.delete(element);
		if (!shouldContinue()) return;
		resetFloatingEffectState(element);
		finish?.();
	}, durationMs);
	effectTimers.set(element, timer);
}
