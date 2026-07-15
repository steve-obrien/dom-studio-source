const handleStates = new WeakMap();
const elementStates = new WeakMap();
const KEYBOARD_STEP = 12;
const KEYBOARD_LARGE_STEP = 32;

/**
 * Clamp a numeric value within an inclusive range.
 *
 * @param {number} value Value to clamp.
 * @param {number} min Minimum permitted value.
 * @param {number} max Maximum permitted value.
 * @returns {number} Clamped value.
 */
function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}

/**
 * Measure the translation limits that keep a surface within its stage.
 *
 * @param {object} state Draggable surface state.
 * @returns {{ minX: number, maxX: number, minY: number, maxY: number }} Translation limits.
 */
function measureBounds(state) {
	const surfaceBounds = state.element.getBoundingClientRect();
	const stageBounds = state.element.parentElement?.getBoundingClientRect();
	if (!stageBounds) {
		return {
			minX: Number.NEGATIVE_INFINITY,
			maxX: Number.POSITIVE_INFINITY,
			minY: Number.NEGATIVE_INFINITY,
			maxY: Number.POSITIVE_INFINITY,
		};
	}

	const firstX = state.x + stageBounds.left - surfaceBounds.left;
	const secondX = state.x + stageBounds.right - surfaceBounds.right;
	const firstY = state.y + stageBounds.top - surfaceBounds.top;
	const secondY = state.y + stageBounds.bottom - surfaceBounds.bottom;

	return {
		minX: Math.min(firstX, secondX),
		maxX: Math.max(firstX, secondX),
		minY: Math.min(firstY, secondY),
		maxY: Math.max(firstY, secondY),
	};
}

/**
 * Apply a translated position through component-local CSS custom properties.
 *
 * @param {object} state Draggable surface state.
 * @param {number} x Horizontal translation in CSS pixels.
 * @param {number} y Vertical translation in CSS pixels.
 * @param {{ minX: number, maxX: number, minY: number, maxY: number }} bounds Translation limits.
 * @returns {void}
 */
function setSurfacePosition(state, x, y, bounds) {
	state.x = clamp(x, bounds.minX, bounds.maxX);
	state.y = clamp(y, bounds.minY, bounds.maxY);
	state.element.style.setProperty('--liquid-glass-drag-x', `${Math.round(state.x)}px`);
	state.element.style.setProperty('--liquid-glass-drag-y', `${Math.round(state.y)}px`);
}

/**
 * Start dragging a surface from its explicit drag handle.
 *
 * @param {PointerEvent} event Pointer-down event from the drag handle.
 * @returns {void}
 */
function startSurfaceDrag(event) {
	if (event.button !== 0) return;

	const state = handleStates.get(event.currentTarget);
	if (!state) return;

	state.pointerId = event.pointerId;
	state.pointerX = event.clientX;
	state.pointerY = event.clientY;
	state.startX = state.x;
	state.startY = state.y;
	state.bounds = measureBounds(state);
	state.element.dataset.dragging = 'true';
	event.currentTarget.setPointerCapture?.(event.pointerId);
	event.preventDefault();
}

/**
 * Move the active surface while its handle owns pointer capture.
 *
 * @param {PointerEvent} event Pointer-move event from the drag handle.
 * @returns {void}
 */
function moveSurface(event) {
	const state = handleStates.get(event.currentTarget);
	if (!state || state.pointerId !== event.pointerId) return;

	setSurfacePosition(
		state,
		state.startX + event.clientX - state.pointerX,
		state.startY + event.clientY - state.pointerY,
		state.bounds,
	);
}

/**
 * Finish a pointer drag and release the active visual state.
 *
 * @param {PointerEvent} event Pointer-up or pointer-cancel event.
 * @returns {void}
 */
function finishSurfaceDrag(event) {
	const state = handleStates.get(event.currentTarget);
	if (!state || state.pointerId !== event.pointerId) return;

	if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
		event.currentTarget.releasePointerCapture(event.pointerId);
	}
	state.pointerId = null;
	delete state.element.dataset.dragging;
}

/**
 * Move or reset a draggable surface with an accessible keyboard control.
 *
 * @param {KeyboardEvent} event Keyboard event from the drag handle.
 * @returns {void}
 */
function moveSurfaceWithKeyboard(event) {
	const state = handleStates.get(event.currentTarget);
	if (!state) return;

	const step = event.shiftKey ? KEYBOARD_LARGE_STEP : KEYBOARD_STEP;
	const movement = {
		ArrowLeft: [-step, 0],
		ArrowRight: [step, 0],
		ArrowUp: [0, -step],
		ArrowDown: [0, step],
	}[event.key];

	if (event.key === 'Home') {
		setSurfacePosition(state, 0, 0, measureBounds(state));
		event.preventDefault();
		return;
	}

	if (!movement) return;
	setSurfacePosition(
		state,
		state.x + movement[0],
		state.y + movement[1],
		measureBounds(state),
	);
	event.preventDefault();
}

export const vDraggableSurface = {
	/**
	 * Register pointer and keyboard interactions for one glass surface.
	 *
	 * @param {HTMLElement} element Surface root element.
	 * @returns {void}
	 */
	mounted(element) {
		const handle = element.querySelector('[data-drag-handle]');
		if (!(handle instanceof HTMLElement)) return;

		const state = {
			element,
			handle,
			x: 0,
			y: 0,
			pointerId: null,
			bounds: null,
		};
		handleStates.set(handle, state);
		elementStates.set(element, state);
		handle.addEventListener('pointerdown', startSurfaceDrag);
		handle.addEventListener('pointermove', moveSurface);
		handle.addEventListener('pointerup', finishSurfaceDrag);
		handle.addEventListener('pointercancel', finishSurfaceDrag);
		handle.addEventListener('keydown', moveSurfaceWithKeyboard);
	},

	/**
	 * Remove interactions owned by a surface before it leaves the document.
	 *
	 * @param {HTMLElement} element Surface root element.
	 * @returns {void}
	 */
	beforeUnmount(element) {
		const state = elementStates.get(element);
		if (!state) return;

		state.handle.removeEventListener('pointerdown', startSurfaceDrag);
		state.handle.removeEventListener('pointermove', moveSurface);
		state.handle.removeEventListener('pointerup', finishSurfaceDrag);
		state.handle.removeEventListener('pointercancel', finishSurfaceDrag);
		state.handle.removeEventListener('keydown', moveSurfaceWithKeyboard);
		handleStates.delete(state.handle);
		elementStates.delete(element);
	},
};
