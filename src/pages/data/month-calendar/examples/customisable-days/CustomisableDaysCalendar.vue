<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { DomButton, DomMonthCalendar } from '../../../../lib/vue';

/**
 * @typedef {object} CalendarPoint
 * @property {number} x Horizontal position normalised between zero and one.
 * @property {number} y Vertical position normalised between zero and one.
 */

/**
 * @typedef {object} CalendarStroke
 * @property {string} id Stable stroke identifier.
 * @property {string} color CSS colour used to draw the stroke.
 * @property {number} width Stroke width in CSS pixels.
 * @property {Array<CalendarPoint>} points Normalised points captured from pointer movement.
 */

/**
 * @typedef {object} DayCustomisation
 * @property {string} image Background image URL or data URL.
 * @property {string} imageLabel Human-readable image name.
 */

/**
 * @typedef {object} CalendarEvent
 * @property {string} id Stable event identifier.
 * @property {string} date YYYY-MM-DD date key.
 * @property {string} title Visible event title.
 * @property {string} color User-selected CSS background colour.
 */

const startDate = '2026-07-01';
const activeDate = ref('2026-07-13');
const activeTool = ref('select');
const brushColor = ref('#2563eb');
const imageInput = ref(null);
const uploadError = ref('');
const drawingRevision = ref(0);
let nextStrokeId = 4;
let nextEventId = 7;
let activePointerId = null;
let activeStroke = null;
let activeCanvas = null;
let activeCanvasBounds = null;
let resizeObserver = null;
const canvasRefs = new Map();
const canvasRefCallbacks = new Map();

const backgroundChoices = [
	{
		label: 'Garden',
		image: createIllustrationBackground({
			sky: '#dbeafe',
			ground: '#4d7c0f',
			foreground: '#14532d',
			accent: '#facc15',
		}),
	},
	{
		label: 'Coast',
		image: createIllustrationBackground({
			sky: '#cffafe',
			ground: '#0e7490',
			foreground: '#164e63',
			accent: '#fef3c7',
		}),
	},
	{
		label: 'Sunset',
		image: createIllustrationBackground({
			sky: '#fed7aa',
			ground: '#c2410c',
			foreground: '#7c2d12',
			accent: '#fef08a',
		}),
	},
];
const brushColours = ['#2563eb', '#db2777', '#16a34a', '#f59e0b', '#ffffff'];
const eventColours = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#15803d', '#0f766e'];
const dayCustomisations = reactive({
	'2026-07-08': {
		image: backgroundChoices[0].image,
		imageLabel: backgroundChoices[0].label,
	},
	'2026-07-13': {
		image: backgroundChoices[1].image,
		imageLabel: backgroundChoices[1].label,
	},
	'2026-07-19': {
		image: backgroundChoices[2].image,
		imageLabel: backgroundChoices[2].label,
	},
});
const dayDrawings = new Map([
	['2026-07-13', [
		{
			id: 'stroke-1',
			color: '#ffffff',
			width: 4,
			points: [
				{ x: 0.09, y: 0.72 },
				{ x: 0.22, y: 0.58 },
				{ x: 0.34, y: 0.69 },
				{ x: 0.47, y: 0.47 },
				{ x: 0.63, y: 0.63 },
				{ x: 0.78, y: 0.35 },
				{ x: 0.92, y: 0.51 },
			],
		},
	]],
	['2026-07-19', [
		{
			id: 'stroke-2',
			color: '#fef08a',
			width: 5,
			points: [
				{ x: 0.20, y: 0.50 },
				{ x: 0.28, y: 0.35 },
				{ x: 0.38, y: 0.29 },
				{ x: 0.47, y: 0.43 },
				{ x: 0.50, y: 0.58 },
				{ x: 0.57, y: 0.70 },
				{ x: 0.68, y: 0.68 },
				{ x: 0.80, y: 0.50 },
			],
		},
		{
			id: 'stroke-3',
			color: '#ffffff',
			width: 3,
			points: [
				{ x: 0.32, y: 0.78 },
				{ x: 0.44, y: 0.68 },
				{ x: 0.57, y: 0.68 },
				{ x: 0.69, y: 0.78 },
			],
		},
	]],
]);
const events = ref([
	{ id: 'event-1', date: '2026-07-08', title: 'Garden lunch', color: '#15803d' },
	{ id: 'event-2', date: '2026-07-13', title: 'Coastal walk', color: '#0f766e' },
	{ id: 'event-3', date: '2026-07-13', title: 'Book dinner', color: '#db2777' },
	{ id: 'event-4', date: '2026-07-19', title: 'Sunset picnic', color: '#ea580c' },
	{ id: 'event-5', date: '2026-07-23', title: 'Studio review', color: '#7c3aed' },
	{ id: 'event-6', date: '2026-07-28', title: 'Publish update', color: '#2563eb' },
]);

/**
 * Resolves the selected day's customisation without creating state during render.
 *
 * @returns {DayCustomisation|null} Existing day customisation or null.
 */
const activeCustomisation = computed(() => dayCustomisations[activeDate.value] || null);

/**
 * Filters calendar events down to the selected date.
 *
 * @returns {Array<CalendarEvent>} Events belonging to the selected date.
 */
const activeEvents = computed(() => events.value.filter((event) => event.date === activeDate.value));

/**
 * Formats the selected date for the editor heading.
 *
 * @returns {string} Localised long date label.
 */
const activeDateLabel = computed(() => formatDateLabel(activeDate.value));

/**
 * Reports whether the selected day has at least one stored canvas stroke.
 *
 * drawingRevision intentionally updates only after a stroke completes or is
 * cleared, so live pointer movement never enters Vue's reactive render cycle.
 *
 * @returns {boolean} True when the selected day has stored drawing content.
 */
const activeHasDrawing = computed(() => {
	return drawingRevision.value >= 0 && Boolean(dayDrawings.get(activeDate.value)?.length);
});

onMounted(mountCanvasLayer);
onBeforeUnmount(unmountCanvasLayer);

/**
 * Creates an embedded SVG landscape suitable for an offline image preset.
 *
 * @param {{ sky: string, ground: string, foreground: string, accent: string }} colours Illustration colours.
 * @returns {string} Encoded SVG data URL.
 */
function createIllustrationBackground(colours) {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
		<defs>
			<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="${colours.sky}"/>
				<stop offset="1" stop-color="${colours.ground}"/>
			</linearGradient>
		</defs>
		<rect width="800" height="600" fill="url(#sky)"/>
		<circle cx="620" cy="145" r="76" fill="${colours.accent}" fill-opacity=".9"/>
		<path d="M0 420 C150 300 270 360 390 410 C520 465 655 305 800 350 V600 H0Z" fill="${colours.ground}" fill-opacity=".86"/>
		<path d="M0 500 C175 405 315 520 455 470 C590 420 700 455 800 410 V600 H0Z" fill="${colours.foreground}" fill-opacity=".9"/>
	</svg>`;
	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Formats a YYYY-MM-DD key without introducing UTC date drift.
 *
 * @param {string} value Date key to format.
 * @returns {string} Long date label.
 */
function formatDateLabel(value) {
	const [year, month, day] = value.split('-').map(Number);
	return new Intl.DateTimeFormat('en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(new Date(year, month - 1, day));
}

/**
 * Returns existing customisation state or creates an empty record for a date.
 *
 * @param {string} value Date key that should own the customisation.
 * @returns {DayCustomisation} Mutable reactive customisation record.
 */
function customisationFor(value) {
	if (!dayCustomisations[value]) {
		dayCustomisations[value] = {
			image: '',
			imageLabel: '',
		};
	}
	return dayCustomisations[value];
}

/**
 * Selects a current-month day from the calendar's app-owned click payload.
 *
 * @param {{ cell: { currentMonth: boolean, value: string } }} payload Calendar day click payload.
 * @returns {void}
 */
function selectDay({ cell }) {
	if (!cell.currentMonth) return;
	activeDate.value = cell.value;
}

/**
 * Switches between selecting days and drawing directly on them.
 *
 * @param {'select'|'draw'} tool Tool to activate.
 * @returns {void}
 */
function setTool(tool) {
	activeTool.value = tool;
}

/**
 * Resolves calendar cell classes that expose the selected and image-backed states.
 *
 * @param {{ currentMonth: boolean, value: string }} cell Calendar day cell.
 * @returns {Array<string|boolean>} Classes accepted by Vue's class binding.
 */
function dayClass(cell) {
	if (!cell.currentMonth) return [];
	const hasImage = Boolean(dayCustomisations[cell.value]?.image);
	return [
		'relative isolate overflow-hidden',
		hasImage && 'text-white',
		cell.value === activeDate.value && 'ring-2 ring-inset ring-primary',
	];
}

/**
 * Builds the layered background style for an image-backed calendar day.
 *
 * @param {{ currentMonth: boolean, value: string }} cell Calendar day cell.
 * @returns {Record<string, string>} Inline style object for the day cell.
 */
function dayStyle(cell) {
	const image = cell.currentMonth ? dayCustomisations[cell.value]?.image : '';
	if (!image) return {};
	return {
		backgroundImage: `linear-gradient(rgb(15 23 42 / 18%), rgb(15 23 42 / 42%)), url("${image}")`,
		backgroundPosition: 'center',
		backgroundRepeat: 'no-repeat',
		backgroundSize: 'cover',
		textShadow: '0 1px 2px rgb(15 23 42 / 70%)',
	};
}

/**
 * Finds the events assigned to a date.
 *
 * @param {string} value Date key to inspect.
 * @returns {Array<CalendarEvent>} Events assigned to the date.
 */
function eventsFor(value) {
	return events.value.filter((event) => event.date === value);
}

/**
 * Applies a preset image to the selected day.
 *
 * @param {{ label: string, image: string }} choice Selected background preset.
 * @returns {void}
 */
function setBackground(choice) {
	const customisation = customisationFor(activeDate.value);
	customisation.image = choice.image;
	customisation.imageLabel = choice.label;
	uploadError.value = '';
}

/**
 * Removes the background image from the selected day without touching drawings.
 *
 * @returns {void}
 */
function clearBackground() {
	const customisation = customisationFor(activeDate.value);
	customisation.image = '';
	customisation.imageLabel = '';
	uploadError.value = '';
}

/**
 * Opens the isolated file input used for per-day image uploads.
 *
 * @returns {void}
 */
function chooseBackgroundFile() {
	imageInput.value?.click();
}

/**
 * Reads an image file and stores it as a self-contained data URL on the active day.
 *
 * @param {Event} event Native file-input change event.
 * @returns {Promise<void>}
 */
async function uploadBackground(event) {
	const input = event.target;
	const file = input.files?.[0];
	if (!file) return;

	try {
		const image = await readFileAsDataUrl(file);
		const customisation = customisationFor(activeDate.value);
		customisation.image = image;
		customisation.imageLabel = file.name;
		uploadError.value = '';
	} catch {
		uploadError.value = 'That image could not be read. Please try another file.';
	} finally {
		input.value = '';
	}
}

/**
 * Converts a local file into a data URL without introducing server or shared state.
 *
 * @param {File} file Image file to read.
 * @returns {Promise<string>} Data URL containing the file contents.
 */
function readFileAsDataUrl(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.addEventListener('load', () => resolve(String(reader.result || '')), { once: true });
		reader.addEventListener('error', () => reject(reader.error), { once: true });
		reader.readAsDataURL(file);
	});
}

/**
 * Builds a preview style for a background preset button.
 *
 * @param {{ image: string }} choice Background preset.
 * @returns {Record<string, string>} Inline preview style.
 */
function backgroundPreviewStyle(choice) {
	return {
		backgroundImage: `linear-gradient(rgb(15 23 42 / 8%), rgb(15 23 42 / 28%)), url("${choice.image}")`,
		backgroundPosition: 'center',
		backgroundSize: 'cover',
	};
}

/**
 * Selects the active freehand brush colour.
 *
 * @param {string} colour CSS colour value.
 * @returns {void}
 */
function setBrushColour(colour) {
	brushColor.value = colour;
}

/**
 * Returns a stable Vue function ref for one day's canvas.
 *
 * @param {string} value Date key represented by the canvas.
 * @returns {(element: HTMLCanvasElement|null) => void} Stable canvas ref callback.
 */
function canvasRefFor(value) {
	if (!canvasRefCallbacks.has(value)) {
		canvasRefCallbacks.set(value, (element) => setCanvasRef(value, element));
	}
	return canvasRefCallbacks.get(value);
}

/**
 * Registers or removes a day canvas without placing the element in reactive state.
 *
 * @param {string} value Date key represented by the canvas.
 * @param {HTMLCanvasElement|null} element Mounted canvas element or null on removal.
 * @returns {void}
 */
function setCanvasRef(value, element) {
	const previous = canvasRefs.get(value);
	if (!element) {
		if (previous) resizeObserver?.unobserve(previous);
		canvasRefs.delete(value);
		return;
	}

	canvasRefs.set(value, element);
	resizeObserver?.observe(element);
	resizeCanvas(value, element);
}

/**
 * Starts responsive canvas observation and paints all seeded drawings.
 *
 * @returns {void}
 */
function mountCanvasLayer() {
	if (typeof ResizeObserver !== 'undefined') {
		resizeObserver = new ResizeObserver(handleCanvasResize);
	}
	for (const [value, canvas] of canvasRefs) {
		resizeObserver?.observe(canvas);
		resizeCanvas(value, canvas);
	}
}

/**
 * Disconnects canvas observation and releases imperative element references.
 *
 * @returns {void}
 */
function unmountCanvasLayer() {
	resizeObserver?.disconnect();
	resizeObserver = null;
	canvasRefs.clear();
	canvasRefCallbacks.clear();
	activeCanvas = null;
	activeCanvasBounds = null;
	activeStroke = null;
	activePointerId = null;
}

/**
 * Repaints canvases whose CSS dimensions changed.
 *
 * @param {Array<ResizeObserverEntry>} entries Canvas resize observations.
 * @returns {void}
 */
function handleCanvasResize(entries) {
	for (const entry of entries) {
		const canvas = entry.target;
		const value = canvas.dataset.drawingDate;
		if (value) resizeCanvas(value, canvas);
	}
}

/**
 * Sizes a canvas for its CSS box and current device pixel ratio, then repaints it.
 *
 * @param {string} value Date key represented by the canvas.
 * @param {HTMLCanvasElement} canvas Canvas element to size.
 * @returns {void}
 */
function resizeCanvas(value, canvas) {
	const bounds = canvas.getBoundingClientRect();
	if (!bounds.width || !bounds.height) return;

	const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
	const width = Math.max(1, Math.round(bounds.width * pixelRatio));
	const height = Math.max(1, Math.round(bounds.height * pixelRatio));
	if (canvas.width !== width || canvas.height !== height) {
		canvas.width = width;
		canvas.height = height;
	}

	const context = canvas.getContext('2d');
	if (!context) return;
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
	paintDayCanvas(value, canvas, bounds);
}

/**
 * Clears and repaints every stored stroke for a day.
 *
 * @param {string} value Date key represented by the canvas.
 * @param {HTMLCanvasElement} canvas Canvas receiving the drawing.
 * @param {DOMRect|DOMRectReadOnly} bounds Current CSS bounds for the canvas.
 * @returns {void}
 */
function paintDayCanvas(value, canvas, bounds) {
	const context = canvas.getContext('2d');
	if (!context) return;
	context.clearRect(0, 0, bounds.width, bounds.height);
	for (const stroke of dayDrawings.get(value) || []) {
		paintStoredStroke(context, stroke, bounds);
	}
}

/**
 * Paints one stored stroke using normalised coordinates.
 *
 * @param {CanvasRenderingContext2D} context Canvas rendering context.
 * @param {CalendarStroke} stroke Stroke to paint.
 * @param {DOMRect|DOMRectReadOnly} bounds Current CSS bounds for the canvas.
 * @returns {void}
 */
function paintStoredStroke(context, stroke, bounds) {
	const firstPoint = stroke.points[0];
	if (!firstPoint) return;
	if (stroke.points.length === 1) {
		paintPoint(context, firstPoint, stroke, bounds);
		return;
	}

	context.beginPath();
	context.moveTo(firstPoint.x * bounds.width, firstPoint.y * bounds.height);
	for (const point of stroke.points.slice(1)) {
		context.lineTo(point.x * bounds.width, point.y * bounds.height);
	}
	applyStrokeStyle(context, stroke);
	context.stroke();
}

/**
 * Applies the shared round freehand style to a canvas context.
 *
 * @param {CanvasRenderingContext2D} context Canvas rendering context.
 * @param {CalendarStroke} stroke Stroke supplying colour and width.
 * @returns {void}
 */
function applyStrokeStyle(context, stroke) {
	context.strokeStyle = stroke.color;
	context.fillStyle = stroke.color;
	context.lineWidth = stroke.width;
	context.lineCap = 'round';
	context.lineJoin = 'round';
}

/**
 * Paints a single-point stroke as a round dot.
 *
 * @param {CanvasRenderingContext2D} context Canvas rendering context.
 * @param {CalendarPoint} point Point to paint.
 * @param {CalendarStroke} stroke Stroke supplying colour and width.
 * @param {DOMRect|DOMRectReadOnly} bounds Current CSS bounds for the canvas.
 * @returns {void}
 */
function paintPoint(context, point, stroke, bounds) {
	applyStrokeStyle(context, stroke);
	context.beginPath();
	context.arc(
		point.x * bounds.width,
		point.y * bounds.height,
		Math.max(1, stroke.width / 2),
		0,
		Math.PI * 2,
	);
	context.fill();
}

/**
 * Paints one new segment directly into the active canvas bitmap.
 *
 * @param {CanvasRenderingContext2D} context Canvas rendering context.
 * @param {CalendarPoint} from Segment starting point.
 * @param {CalendarPoint} to Segment ending point.
 * @param {CalendarStroke} stroke Stroke supplying colour and width.
 * @param {DOMRect|DOMRectReadOnly} bounds Current CSS bounds for the canvas.
 * @returns {void}
 */
function paintSegment(context, from, to, stroke, bounds) {
	applyStrokeStyle(context, stroke);
	context.beginPath();
	context.moveTo(from.x * bounds.width, from.y * bounds.height);
	context.lineTo(to.x * bounds.width, to.y * bounds.height);
	context.stroke();
}

/**
 * Starts a freehand canvas stroke for the day under the pointer.
 *
 * @param {{ currentMonth: boolean, value: string }} cell Calendar day cell.
 * @param {PointerEvent} event Native pointer event from the drawing surface.
 * @returns {void}
 */
function startDrawing(cell, event) {
	if (activeTool.value !== 'draw' || !cell.currentMonth) return;
	const canvas = event.currentTarget;
	const bounds = canvas.getBoundingClientRect();
	const point = pointerPosition(event, bounds);
	const stroke = {
		id: `stroke-${nextStrokeId++}`,
		color: brushColor.value,
		width: 4,
		points: [point],
	};
	const strokes = dayDrawings.get(cell.value) || [];
	strokes.push(stroke);
	dayDrawings.set(cell.value, strokes);
	activeStroke = {
		date: cell.value,
		stroke,
	};
	activeCanvas = canvas;
	activeCanvasBounds = bounds;
	activePointerId = event.pointerId;
	canvas.setPointerCapture?.(event.pointerId);

	const context = canvas.getContext('2d');
	if (context) paintPoint(context, point, stroke, bounds);
}

/**
 * Paints pointer samples directly into the active canvas without reactive writes.
 *
 * @param {PointerEvent} event Native pointer event from the drawing surface.
 * @returns {void}
 */
function continueDrawing(event) {
	if (!activeStroke || !activeCanvas || !activeCanvasBounds || event.pointerId !== activePointerId) return;
	const context = activeCanvas.getContext('2d');
	if (!context) return;

	const samples = typeof event.getCoalescedEvents === 'function'
		? event.getCoalescedEvents()
		: [event];
	for (const sample of samples.length ? samples : [event]) {
		const point = pointerPosition(sample, activeCanvasBounds);
		const points = activeStroke.stroke.points;
		const previous = points[points.length - 1];
		if (pointsAreTooClose(previous, point, activeCanvasBounds)) continue;
		points.push(point);
		paintSegment(context, previous, point, activeStroke.stroke, activeCanvasBounds);
	}
}

/**
 * Finishes the active freehand stroke and releases pointer capture.
 *
 * @param {PointerEvent} event Native pointer event from the drawing surface.
 * @returns {void}
 */
function finishDrawing(event) {
	if (event.pointerId !== activePointerId) return;
	if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
		event.currentTarget.releasePointerCapture(event.pointerId);
	}
	const completedDate = activeStroke?.date || '';
	activeStroke = null;
	activeCanvas = null;
	activeCanvasBounds = null;
	activePointerId = null;
	if (completedDate) {
		activeDate.value = completedDate;
		drawingRevision.value += 1;
	}
}

/**
 * Converts a pointer position into normalised canvas coordinates.
 *
 * @param {PointerEvent} event Native pointer event from a canvas drawing surface.
 * @param {DOMRect|DOMRectReadOnly} bounds Cached canvas bounds from pointerdown.
 * @returns {CalendarPoint} Clamped normalised canvas coordinates.
 */
function pointerPosition(event, bounds) {
	const x = (event.clientX - bounds.left) / bounds.width;
	const y = (event.clientY - bounds.top) / bounds.height;
	return {
		x: clampCoordinate(x),
		y: clampCoordinate(y),
	};
}

/**
 * Keeps a drawing coordinate inside the normalised canvas range.
 *
 * @param {number} value Candidate coordinate.
 * @returns {number} Coordinate clamped between zero and one.
 */
function clampCoordinate(value) {
	return Math.min(1, Math.max(0, value));
}

/**
 * Avoids painting points whose movement is visually insignificant.
 *
 * @param {CalendarPoint} previous Previous stored point.
 * @param {CalendarPoint} next Candidate next point.
 * @param {DOMRect|DOMRectReadOnly} bounds Current CSS bounds for the canvas.
 * @returns {boolean} True when the points are less than one CSS pixel apart.
 */
function pointsAreTooClose(previous, next, bounds) {
	const horizontalDistance = (next.x - previous.x) * bounds.width;
	const verticalDistance = (next.y - previous.y) * bounds.height;
	return (horizontalDistance ** 2) + (verticalDistance ** 2) < 1;
}

/**
 * Removes every freehand stroke from the selected day.
 *
 * @returns {void}
 */
function clearDrawing() {
	dayDrawings.delete(activeDate.value);
	const canvas = canvasRefs.get(activeDate.value);
	if (canvas) resizeCanvas(activeDate.value, canvas);
	drawingRevision.value += 1;
}

/**
 * Adds a sample event to the selected day so its colour can be customised.
 *
 * @returns {void}
 */
function addEvent() {
	events.value = [
		...events.value,
		{
			id: `event-${nextEventId++}`,
			date: activeDate.value,
			title: 'New event',
			color: eventColours[0],
		},
	];
}

/**
 * Updates an event's background colour while keeping its other data intact.
 *
 * @param {string} eventId Event identifier to update.
 * @param {string} colour New CSS background colour.
 * @returns {void}
 */
function setEventColour(eventId, colour) {
	events.value = events.value.map((event) => event.id === eventId
		? { ...event, color: colour }
		: event);
}

/**
 * Builds readable foreground and background styles for a coloured event.
 *
 * @param {CalendarEvent} event Calendar event to style.
 * @returns {{ backgroundColor: string, color: string }} Inline event styles.
 */
function eventStyle(event) {
	return {
		backgroundColor: event.color,
		color: readableTextColour(event.color),
	};
}

/**
 * Chooses black or white text from a six-digit hexadecimal background colour.
 *
 * @param {string} colour Hexadecimal background colour.
 * @returns {string} Accessible high-contrast text colour.
 */
function readableTextColour(colour) {
	const hex = colour.replace('#', '');
	if (!/^[0-9a-f]{6}$/i.test(hex)) return '#ffffff';
	const red = Number.parseInt(hex.slice(0, 2), 16);
	const green = Number.parseInt(hex.slice(2, 4), 16);
	const blue = Number.parseInt(hex.slice(4, 6), 16);
	const luminance = ((red * 299) + (green * 587) + (blue * 114)) / 1000;
	return luminance > 150 ? '#111827' : '#ffffff';
}
</script>

<template>
	<div class="w-[96rem] max-w-full space-y-5" data-testid="customisable-days-calendar-example">
		<header class="rounded-2xl border border-border bg-canvas p-4 shadow-sm">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div class="max-w-2xl">
					<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Personal calendar canvas</p>
					<h3 class="mt-1 text-2xl font-bold tracking-tight text-canvas-fg">Make each day your own</h3>
					<p class="mt-1 text-sm leading-6 text-muted-fg">Select a day to add an image or change event colours. Switch to Draw, then drag directly across any day.</p>
				</div>

				<div class="flex items-center gap-2 rounded-full border border-border bg-secondary/40 p-1" role="group" aria-label="Calendar editing tool">
					<DomButton
						size="sm"
						:variant="activeTool === 'select' ? 'primary' : 'ghost'"
						:aria-pressed="activeTool === 'select'"
						@click="setTool('select')"
					>
						Select days
					</DomButton>
					<DomButton
						size="sm"
						:variant="activeTool === 'draw' ? 'primary' : 'ghost'"
						:aria-pressed="activeTool === 'draw'"
						@click="setTool('draw')"
					>
						Draw on days
					</DomButton>
				</div>
			</div>
		</header>

		<div class="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_21rem]">
			<div class="min-w-0">
				<DomMonthCalendar
					:start-date="startDate"
					:months="1"
					:fixed-weeks="true"
					:show-adjacent-days="true"
					:hoverable-days="false"
					:day-class="dayClass"
					:day-style="dayStyle"
					:clickable="activeTool === 'select'"
					@day-click="selectDay"
				>
					<template #month-header>
						<span>{{ activeTool === 'draw' ? 'Drag to draw' : 'Select a day to edit' }}</span>
					</template>

					<template #default="{ cell }">
						<div v-if="cell.currentMonth" class="relative flex h-full min-h-[6.5rem] flex-col">
							<canvas
								:ref="canvasRefFor(cell.value)"
								:data-drawing-date="cell.value"
								class="absolute inset-0 h-full w-full"
								:class="activeTool === 'draw' ? 'z-20 cursor-crosshair touch-none pointer-events-auto' : 'z-0 pointer-events-none'"
								:role="activeTool === 'draw' ? 'application' : undefined"
								:aria-hidden="activeTool === 'draw' ? undefined : 'true'"
								:aria-label="activeTool === 'draw' ? `Drawing surface for ${cell.label}` : undefined"
								@pointerdown.stop.prevent="startDrawing(cell, $event)"
								@pointermove.stop.prevent="continueDrawing"
								@pointerup.stop.prevent="finishDrawing"
								@pointercancel.stop.prevent="finishDrawing"
								@click.stop.prevent
							></canvas>

							<div class="relative z-10 mt-auto space-y-1.5 pointer-events-none">
								<article
									v-for="event in eventsFor(cell.value)"
									:key="event.id"
									class="truncate rounded-md px-2 py-1.5 text-xs font-semibold shadow-sm"
									:style="eventStyle(event)"
								>
									{{ event.title }}
								</article>
								<span
									v-if="cell.value === activeDate"
									class="inline-flex w-fit rounded-full bg-canvas/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-canvas-fg shadow-sm"
								>
									Selected
								</span>
							</div>
						</div>
					</template>
				</DomMonthCalendar>
			</div>

			<aside class="overflow-hidden rounded-2xl border border-border bg-canvas shadow-sm">
				<header class="border-b border-border bg-secondary/30 px-4 py-3">
					<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Editing</p>
					<h4 class="mt-1 text-base font-bold text-canvas-fg">{{ activeDateLabel }}</h4>
				</header>

				<section class="border-b border-border p-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<h5 class="text-sm font-bold text-canvas-fg">Background image</h5>
							<p class="mt-0.5 max-w-[15rem] truncate text-xs text-muted-fg">{{ activeCustomisation?.imageLabel || 'No image selected' }}</p>
						</div>
						<DomButton v-if="activeCustomisation?.image" size="xs" variant="ghost" @click="clearBackground">Remove</DomButton>
					</div>

					<div class="mt-3 grid grid-cols-3 gap-2">
						<button
							v-for="choice in backgroundChoices"
							:key="choice.label"
							type="button"
							class="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-secondary shadow-xs outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring/60"
							:class="activeCustomisation?.image === choice.image && 'ring-2 ring-primary'"
							:style="backgroundPreviewStyle(choice)"
							:aria-label="`Use ${choice.label} background`"
							:aria-pressed="activeCustomisation?.image === choice.image"
							@click="setBackground(choice)"
						>
							<span class="absolute inset-x-0 bottom-0 bg-canvas/85 px-1.5 py-1 text-[10px] font-bold text-canvas-fg backdrop-blur-sm">{{ choice.label }}</span>
						</button>
					</div>

					<input ref="imageInput" type="file" class="sr-only" accept="image/*" @change="uploadBackground">
					<DomButton class="mt-3 w-full" size="sm" variant="secondary" @click="chooseBackgroundFile">Upload your own image</DomButton>
					<p v-if="uploadError" class="mt-2 text-xs font-medium text-destructive" role="alert">{{ uploadError }}</p>
				</section>

				<section class="border-b border-border p-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<h5 class="text-sm font-bold text-canvas-fg">Freehand drawing</h5>
							<p class="mt-0.5 text-xs text-muted-fg">Choose a brush, then use Draw on days.</p>
						</div>
						<DomButton v-if="activeHasDrawing" size="xs" variant="ghost" @click="clearDrawing">Clear</DomButton>
					</div>

					<div class="mt-3 flex flex-wrap items-center gap-2">
						<button
							v-for="colour in brushColours"
							:key="colour"
							type="button"
							class="size-7 rounded-full border-2 border-canvas shadow-sm outline outline-1 outline-border transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring/60"
							:class="brushColor === colour && 'ring-2 ring-primary ring-offset-2 ring-offset-canvas'"
							:style="{ backgroundColor: colour }"
							:aria-label="`Use ${colour} brush`"
							:aria-pressed="brushColor === colour"
							@click="setBrushColour(colour)"
						></button>
						<label class="relative size-7 overflow-hidden rounded-full border-2 border-canvas bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)] shadow-sm outline outline-1 outline-border" aria-label="Choose custom brush colour">
							<input v-model="brushColor" type="color" class="absolute inset-0 size-10 cursor-pointer opacity-0">
						</label>
					</div>
				</section>

				<section class="p-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<h5 class="text-sm font-bold text-canvas-fg">Event colours</h5>
							<p class="mt-0.5 text-xs text-muted-fg">Each event keeps its own background.</p>
						</div>
						<DomButton size="xs" variant="secondary" @click="addEvent">Add event</DomButton>
					</div>

					<div v-if="activeEvents.length" class="mt-3 space-y-3">
						<div v-for="event in activeEvents" :key="event.id" class="rounded-xl border border-border p-3">
							<div class="rounded-md px-2 py-1.5 text-xs font-semibold" :style="eventStyle(event)">{{ event.title }}</div>
							<div class="mt-2 flex flex-wrap items-center gap-1.5">
								<button
									v-for="colour in eventColours"
									:key="colour"
									type="button"
									class="size-6 rounded-full border-2 border-canvas shadow-sm outline outline-1 outline-border transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring/60"
									:class="event.color === colour && 'ring-2 ring-primary ring-offset-1 ring-offset-canvas'"
									:style="{ backgroundColor: colour }"
									:aria-label="`Set ${event.title} to ${colour}`"
									:aria-pressed="event.color === colour"
									@click="setEventColour(event.id, colour)"
								></button>
								<label class="relative size-6 overflow-hidden rounded-full border-2 border-canvas bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)] shadow-sm outline outline-1 outline-border" :aria-label="`Choose custom colour for ${event.title}`">
									<input :value="event.color" type="color" class="absolute inset-0 size-9 cursor-pointer opacity-0" @input="setEventColour(event.id, $event.target.value)">
								</label>
							</div>
						</div>
					</div>
					<p v-else class="mt-3 rounded-lg bg-secondary/45 px-3 py-2 text-xs text-muted-fg">No events on this day yet.</p>
				</section>
			</aside>
		</div>
	</div>
</template>
