<script setup>
import { computed } from 'vue';

defineOptions({
	__doc: {
		name: 'Segmented progress',
		tag: '<DomSegmentedProgress>',
		description: 'An accessible stacked progress bar for workflows that divide a changing total across multiple states.',
		icon: 'M4 7h16M4 12h16M4 17h16',
		playground: {
			initial: {
				value: 2,
				label: 'pages processed',
				tone: 'warning',
				size: 'lg',
				segments: [
					{ key: 'complete', label: 'completed', value: 2, tone: 'success', color: '' },
					{ key: 'processing', label: 'processing', value: 1, tone: 'warning', color: 'var(--warning)' },
					{ key: 'queued', label: 'queued', value: 1, tone: 'neutral', color: '' },
				],
			},
		},
		slots: [
			{ name: 'summary', payload: '{ value, max, percent, label }', description: 'Custom summary content shown above the track.' },
			{ name: 'legend-label', payload: '{ segment }', description: 'Custom label content for each legend entry.' },
		],
	},
});

const props = defineProps({
	segments: {
		type: Array,
		default: () => [],
		_edit: {
			component: 'DomJsonListInput',
			description: 'Ordered progress states. Each segment accepts key, label, value, a semantic tone, and an optional CSS colour override.',
			props: {
				compact: true,
				addLabel: '+ Add segment',
				schema: [
					{ key: 'key', label: 'Key', placeholder: 'queued' },
					{ key: 'label', label: 'Label', placeholder: 'queued' },
					{ key: 'value', label: 'Value', type: 'number', default: 0 },
					{ key: 'tone', label: 'Tone', type: 'select', options: ['neutral', 'primary', 'success', 'warning', 'danger'] },
					{ key: 'color', label: 'Custom colour', placeholder: 'var(--warning)' },
				],
			},
		},
	},
	value: {
		type: Number,
		default: 0,
		_edit: { description: 'Completed or otherwise processed item count used by the summary and accessibility value.' },
	},
	max: {
		type: Number,
		default: null,
		_edit: { description: 'Maximum item count. Defaults to the sum of all segments and expands when segment values grow.' },
	},
	label: {
		type: String,
		default: 'items processed',
		_edit: { description: 'Visible summary label and accessible progress label.' },
	},
	tone: {
		type: String,
		default: 'primary',
		_edit: {
			options: ['neutral', 'primary', 'success', 'warning', 'danger'],
			description: 'Semantic tone used by the percentage summary.',
		},
	},
	size: {
		type: String,
		default: 'md',
		_edit: {
			options: ['sm', 'md', 'lg'],
			description: 'Segmented track height.',
		},
	},
	showSummary: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the processed count, total, label, and optional percentage.' },
	},
	showPercentage: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the processed percentage in the summary.' },
	},
	showLegend: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show segment counts and labels below the track.' },
	},
	showZeroSegments: {
		type: Boolean,
		default: false,
		_edit: { description: 'Keep zero-value states visible in the legend.' },
	},
});

const normalizedSegments = computed(getNormalizedSegments);
const segmentTotal = computed(getSegmentTotal);
const resolvedMax = computed(getResolvedMax);
const safeMax = computed(getSafeMax);
const clampedValue = computed(getClampedValue);
const percent = computed(getPercent);
const renderedSegments = computed(getRenderedSegments);
const legendSegments = computed(getLegendSegments);
const trackClass = computed(getTrackClass);
const percentageClass = computed(getPercentageClass);
const ariaValueText = computed(getAriaValueText);

/**
 * Normalizes consumer-provided segment records into safe render values.
 *
 * @returns {Array<Record<string, unknown>>} Ordered normalized segments.
 */
function getNormalizedSegments() {
	return props.segments.map((segment, index) => {
		const source = segment && typeof segment === 'object' ? segment : {};
		const numericValue = Number(source.value);
		const value = Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0;
		const label = String(source.label || source.key || `Segment ${index + 1}`);
		const color = typeof source.color === 'string' ? source.color.trim() : '';

		return {
			...source,
			key: source.key ?? `${label}-${index}`,
			label,
			value,
			tone: getSegmentTone(source.tone),
			color,
		};
	});
}

/**
 * Resolves an allowed semantic tone for a segment.
 *
 * @param {unknown} tone Candidate segment tone.
 * @returns {'neutral'|'primary'|'success'|'warning'|'danger'} Normalized tone.
 */
function getSegmentTone(tone) {
	return ['neutral', 'primary', 'success', 'warning', 'danger'].includes(tone) ? tone : 'primary';
}

/**
 * Sums all normalized segment values.
 *
 * @returns {number} Current total represented by segments.
 */
function getSegmentTotal() {
	return normalizedSegments.value.reduce((total, segment) => total + segment.value, 0);
}

/**
 * Resolves the displayed maximum while preventing segments from overflowing it.
 *
 * @returns {number} Current progress maximum.
 */
function getResolvedMax() {
	const explicitMax = Number(props.max);
	if (!Number.isFinite(explicitMax)) return segmentTotal.value;
	return Math.max(0, explicitMax, segmentTotal.value);
}

/**
 * Produces a non-zero maximum for percentage and width calculations.
 *
 * @returns {number} Safe calculation maximum.
 */
function getSafeMax() {
	return Math.max(1, resolvedMax.value);
}

/**
 * Clamps the processed value inside the current progress range.
 *
 * @returns {number} Safe processed value.
 */
function getClampedValue() {
	const numericValue = Number(props.value);
	if (!Number.isFinite(numericValue)) return 0;
	return Math.min(resolvedMax.value, Math.max(0, numericValue));
}

/**
 * Converts the processed value into a rounded percentage.
 *
 * @returns {number} Processed percentage.
 */
function getPercent() {
	if (resolvedMax.value === 0) return 0;
	return Math.round((clampedValue.value / safeMax.value) * 100);
}

/**
 * Adds semantic color classes and proportional widths to visible track segments.
 *
 * @returns {Array<Record<string, unknown>>} Non-zero rendered track segments.
 */
function getRenderedSegments() {
	return normalizedSegments.value
		.filter((segment) => segment.value > 0)
		.map((segment) => ({
			...segment,
			class: getToneBackgroundClass(segment.tone),
			style: {
				width: `${(segment.value / safeMax.value) * 100}%`,
				...getSegmentColorStyle(segment.color),
			},
		}));
}

/**
 * Selects the states that should appear in the visual legend.
 *
 * @returns {Array<Record<string, unknown>>} Legend segments.
 */
function getLegendSegments() {
	if (props.showZeroSegments) return normalizedSegments.value;
	return normalizedSegments.value.filter((segment) => segment.value > 0);
}

/**
 * Maps a semantic tone to the solid color used by tracks and legend dots.
 *
 * @param {string} tone Normalized semantic tone.
 * @returns {string} Tailwind background utility.
 */
function getToneBackgroundClass(tone) {
	return {
		neutral: 'bg-muted-fg/40',
		primary: 'bg-primary',
		success: 'bg-success',
		warning: 'bg-warning',
		danger: 'bg-destructive',
	}[tone] || 'bg-primary';
}

/**
 * Builds an inline background override when a segment supplies a CSS colour.
 *
 * Invalid CSS values are ignored by the browser, leaving the semantic tone as
 * the visible fallback.
 *
 * @param {unknown} color Candidate CSS colour.
 * @returns {Record<string, string>} Inline colour style or an empty style object.
 */
function getSegmentColorStyle(color) {
	if (typeof color !== 'string' || !color.trim()) return {};
	return { backgroundColor: color.trim() };
}

/**
 * Builds the track classes for the selected height.
 *
 * @returns {Array<string>} Track class list.
 */
function getTrackClass() {
	return [
		'flex w-full overflow-hidden rounded-full bg-secondary',
		{
			sm: 'h-2',
			md: 'h-3',
			lg: 'h-4',
		}[props.size] || 'h-3',
	];
}

/**
 * Maps the overall tone to a summary text color.
 *
 * @returns {string} Percentage text utility.
 */
function getPercentageClass() {
	return {
		neutral: 'text-muted-fg',
		primary: 'text-primary',
		success: 'text-success',
		warning: 'text-warning',
		danger: 'text-destructive',
	}[props.tone] || 'text-primary';
}

/**
 * Describes both processed progress and the state distribution for assistive technology.
 *
 * @returns {string} Accessible progress value text.
 */
function getAriaValueText() {
	const distribution = normalizedSegments.value
		.filter((segment) => segment.value > 0)
		.map((segment) => `${segment.value} ${segment.label}`)
		.join(', ');
	const summary = `${clampedValue.value} of ${resolvedMax.value} ${props.label}`;
	return distribution ? `${summary}. ${distribution}.` : summary;
}
</script>

<template>
	<div class="w-full">
		<div v-if="showSummary" class="mb-4 flex items-end justify-between gap-4">
			<slot name="summary" :value="clampedValue" :max="resolvedMax" :percent="percent" :label="label">
				<div class="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
					<span class="text-2xl font-bold tabular-nums tracking-tight text-canvas-fg sm:text-3xl">
						{{ clampedValue }} <span class="text-muted-fg">/</span> {{ resolvedMax }}
					</span>
					<span v-if="label" class="text-sm font-semibold text-muted-fg sm:text-base">{{ label }}</span>
				</div>
			</slot>
			<span v-if="showPercentage" class="shrink-0 text-lg font-bold tabular-nums" :class="percentageClass">{{ percent }}%</span>
		</div>

		<div
			:class="trackClass"
			role="progressbar"
			:aria-label="label || 'Progress'"
			:aria-valuemin="0"
			:aria-valuemax="safeMax"
			:aria-valuenow="clampedValue"
			:aria-valuetext="ariaValueText"
		>
			<div
				v-for="segment in renderedSegments"
				:key="segment.key"
				class="h-full shrink-0 transition-[width] duration-300"
				:class="segment.class"
				:style="segment.style"
				aria-hidden="true"
			></div>
		</div>

		<ul v-if="showLegend && legendSegments.length" class="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-muted-fg" aria-label="Progress states">
			<li v-for="segment in legendSegments" :key="segment.key" class="inline-flex items-center gap-1.5">
				<span
					class="size-2.5 shrink-0 rounded-full"
					:class="getToneBackgroundClass(segment.tone)"
					:style="getSegmentColorStyle(segment.color)"
					aria-hidden="true"
				></span>
				<slot name="legend-label" :segment="segment">
					<span><span class="tabular-nums">{{ segment.value }}</span> {{ segment.label }}</span>
				</slot>
			</li>
		</ul>
	</div>
</template>
