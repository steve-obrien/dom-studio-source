<script>
/**
 * @typedef {string | ((row: Record<string, unknown>, index: number) => unknown)} ResourceFieldResolver
 */

/**
 * @typedef {string | ((row: Record<string, unknown>, index: number) => string | number)} ResourceKeyResolver
 */

/**
 * @typedef {object} ActivityTimelineRecord
 * @property {Record<string, unknown>} row Original application-owned resource row.
 * @property {string|number} rowKey Stable row identity.
 * @property {number} index Source row index.
 * @property {unknown} title Resolved primary label.
 * @property {unknown} description Resolved supporting content.
 * @property {unknown} timestamp Resolved raw timestamp or date label.
 * @property {string} formattedTimestamp Display-ready timestamp.
 * @property {unknown} meta Resolved actor, source, or secondary metadata.
 * @property {unknown} status Resolved workflow status.
 * @property {string} statusLabel Human-readable workflow status.
 * @property {string} tone Normalized semantic tone.
 */

export const activityTimelineProps = {
	rows: {
		type: Array,
		default: () => [],
		_edit: { description: 'Application-owned resource rows in the exact order they should appear.' },
	},
	rowKey: {
		type: [String, Function],
		default: 'id',
		_edit: { typeRef: 'ResourceKeyResolver', description: 'Logical field name or function used to identify each resource row.' },
	},
	titleKey: {
		type: [String, Function],
		default: 'title',
		_edit: { typeRef: 'ResourceFieldResolver', group: 'Fields', description: 'Logical field name or function used for the primary activity label.' },
	},
	descriptionKey: {
		type: [String, Function],
		default: 'description',
		_edit: { typeRef: 'ResourceFieldResolver', group: 'Fields', description: 'Logical field name or function used for supporting activity content.' },
	},
	timestampKey: {
		type: [String, Function],
		default: 'createdAt',
		_edit: { typeRef: 'ResourceFieldResolver', group: 'Fields', description: 'Logical field name or function used for the activity timestamp.' },
	},
	metaKey: {
		type: [String, Function],
		default: 'actor',
		_edit: { typeRef: 'ResourceFieldResolver', group: 'Fields', description: 'Logical field name or function used for actor, source, or secondary metadata.' },
	},
	statusKey: {
		type: [String, Function],
		default: 'status',
		_edit: { typeRef: 'ResourceFieldResolver', group: 'Fields', description: 'Logical field name or function used for an optional status pill.' },
	},
	toneKey: {
		type: [String, Function],
		default: 'tone',
		_edit: { typeRef: 'ResourceFieldResolver', group: 'Fields', description: 'Logical field name or function resolving to a semantic marker and status tone.' },
	},
	formatTimestamp: {
		type: Function,
		default: null,
		_edit: { group: 'Fields', description: 'Optional formatter receiving the raw timestamp, row, and source index.' },
	},
	layout: {
		type: String,
		default: 'stacked',
		_edit: { options: ['stacked', 'split'], group: 'Layout', description: 'Place timestamp metadata above the content or in a separate desktop column.' },
	},
	density: {
		type: String,
		default: 'comfortable',
		_edit: { options: ['compact', 'comfortable'], group: 'Layout', description: 'Spacing and marker scale for the timeline.' },
	},
	loading: {
		type: Boolean,
		default: false,
		_edit: { group: 'State', description: 'Expose busy state and show timeline-shaped skeleton rows when no rows are available.' },
	},
	loadingRows: {
		type: Number,
		default: 4,
		_edit: { group: 'State', description: 'Number of placeholder rows shown during an initial load.' },
	},
	emptyTitle: {
		type: String,
		default: 'No activity yet',
		_edit: { group: 'Labels', description: 'Heading shown when the supplied resource collection is empty.' },
	},
	emptyDescription: {
		type: String,
		default: 'Events will appear here as this resource changes.',
		_edit: { group: 'Labels', description: 'Supporting copy shown for an empty activity collection.' },
	},
	ariaLabel: {
		type: String,
		default: 'Activity timeline',
		_edit: { group: 'Labels', description: 'Accessible label for the ordered activity list.' },
	},
};
</script>

<script setup>
import { computed } from 'vue';
import DomEmptyState from '../../visual/empty-state/DomEmptyState.vue';
import DomSkeleton from '../../visual/skeleton/DomSkeleton.vue';
import DomStatusPill from '../../visual/status-pill/DomStatusPill.vue';
import { resolveResourceKey, resolveResourceValue } from '../_shared/resourceRecord.js';

defineOptions({
	__doc: {
		name: 'Activity timeline',
		tag: '<DomActivityTimeline>',
		description: 'Projects application-owned resource rows into an accessible ordered activity trail without owning loading, ordering, querying, or persistence.',
		icon: 'M6 5h.01M6 12h.01M6 19h.01M10 5h8M10 12h8M10 19h8M6 6v5M6 13v5',
		events: [],
		slots: [
			{ name: 'item', payload: 'ActivityTimelineSlotPayload', typeRef: 'ActivityTimelineSlotPayload', description: 'Replace the default title, description, status, and metadata content while retaining timeline structure.' },
			{ name: 'marker', payload: 'ActivityTimelineSlotPayload', typeRef: 'ActivityTimelineSlotPayload', description: 'Replace the semantic-tone marker for one activity row.' },
			{ name: 'opposite', payload: 'ActivityTimelineSlotPayload', typeRef: 'ActivityTimelineSlotPayload', description: 'Replace timestamp and secondary metadata, including the separate column used by split layout.' },
			{ name: 'actions', payload: 'ActivityTimelineSlotPayload', typeRef: 'ActivityTimelineSlotPayload', description: 'Append application-owned controls to the default activity content.' },
			{ name: 'loading', payload: '{ count }', description: 'Replace the initial loading placeholders.' },
			{ name: 'empty', description: 'Replace the empty collection state.' },
		],
	},
});

const props = defineProps(activityTimelineProps);

const sourceRows = computed(getSourceRows);
const records = computed(getActivityRecords);
const loadingCount = computed(getLoadingCount);
const listClass = computed(getListClass);

/**
 * Normalizes the application-owned collection without changing row identity.
 *
 * @returns {Array<Record<string, unknown>>} Safe resource-row collection.
 */
function getSourceRows() {
	return Array.isArray(props.rows) ? props.rows : [];
}

/**
 * Creates presentation records while retaining every original resource row.
 *
 * @returns {Array<ActivityTimelineRecord>} Timeline presentation records.
 */
function getActivityRecords() {
	return sourceRows.value.map(createActivityRecord);
}

/**
 * Resolves one resource row into the stable slot and default-renderer contract.
 *
 * @param {Record<string, unknown>} row Application-owned resource row.
 * @param {number} index Source row index.
 * @returns {ActivityTimelineRecord} Resolved timeline presentation record.
 */
function createActivityRecord(row, index) {
	const timestamp = resolveResourceValue(row, props.timestampKey, index);
	const status = resolveResourceValue(row, props.statusKey, index);
	return {
		row,
		rowKey: resolveResourceKey(row, props.rowKey, index),
		index,
		title: resolveResourceValue(row, props.titleKey, index),
		description: resolveResourceValue(row, props.descriptionKey, index),
		timestamp,
		formattedTimestamp: formatResolvedTimestamp(timestamp, row, index),
		meta: resolveResourceValue(row, props.metaKey, index),
		status,
		statusLabel: labelFromValue(status),
		tone: normalizeTone(resolveResourceValue(row, props.toneKey, index)),
	};
}

/**
 * Formats a timestamp through the consumer hook or a safe string fallback.
 *
 * @param {unknown} value Raw timestamp or display label.
 * @param {Record<string, unknown>} row Source resource row.
 * @param {number} index Source row index.
 * @returns {string} Display-ready timestamp.
 */
function formatResolvedTimestamp(value, row, index) {
	if (typeof props.formatTimestamp === 'function') {
		const formatted = props.formatTimestamp(value, row, index);
		return formatted === null || formatted === undefined ? '' : String(formatted);
	}
	return value === null || value === undefined ? '' : String(value);
}

/**
 * Converts a stored status value into a compact human-readable label.
 *
 * @param {unknown} value Raw status value.
 * @returns {string} Human-readable status label.
 */
function labelFromValue(value) {
	if (value === null || value === undefined || value === '') return '';
	return String(value)
		.replace(/[_-]+/g, ' ')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/^\w/, capitalizeFirstLetter);
}

/**
 * Uppercases the leading character in a generated status label.
 *
 * @param {string} character Matched leading character.
 * @returns {string} Uppercase character.
 */
function capitalizeFirstLetter(character) {
	return character.toUpperCase();
}

/**
 * Restricts resource-provided tone values to DOM Studio semantic tones.
 *
 * @param {unknown} value Candidate tone value.
 * @returns {'neutral'|'primary'|'success'|'warning'|'danger'|'info'} Semantic tone.
 */
function normalizeTone(value) {
	const tone = String(value || 'neutral');
	return ['neutral', 'primary', 'success', 'warning', 'danger', 'info'].includes(tone)
		? tone
		: 'neutral';
}

/**
 * Builds semantic marker classes for one resolved activity tone.
 *
 * @param {string} tone Normalized semantic tone.
 * @returns {string} Tailwind marker classes.
 */
function markerClass(tone) {
	return {
		neutral: 'border-border bg-canvas text-muted-fg',
		primary: 'border-primary/35 bg-primary/15 text-primary',
		success: 'border-success/35 bg-success/15 text-success',
		warning: 'border-warning/40 bg-warning/15 text-warning',
		danger: 'border-destructive/35 bg-destructive/15 text-destructive',
		info: 'border-primary/35 bg-primary/15 text-primary',
	}[tone] || 'border-border bg-canvas text-muted-fg';
}

/**
 * Clamps initial skeleton count to a small useful range.
 *
 * @returns {number} Number of loading records to render.
 */
function getLoadingCount() {
	return Math.min(12, Math.max(1, Number(props.loadingRows) || 1));
}

/**
 * Builds layout-aware classes for the ordered list.
 *
 * @returns {Array<string>} Timeline list classes.
 */
function getListClass() {
	return [
		'grid',
		props.density === 'compact' ? 'gap-0' : 'gap-1',
	];
}

/**
 * Builds responsive grid classes for one activity row.
 *
 * @returns {string} Activity row grid classes.
 */
function itemGridClass() {
	if (props.layout === 'split') {
		return 'grid-cols-[1.5rem_minmax(0,1fr)] md:grid-cols-[9rem_1.5rem_minmax(0,1fr)]';
	}
	return 'grid-cols-[1.5rem_minmax(0,1fr)]';
}

/**
 * Positions timestamp metadata without rendering responsive slot duplicates.
 *
 * @returns {string} Opposite-column layout classes.
 */
function oppositeClass() {
	const shared = 'col-start-2 row-start-1 mb-1 min-w-0 text-xs text-muted-fg';
	if (props.layout === 'split') {
		return `${shared} md:col-start-1 md:mb-0 md:pr-4 md:text-right`;
	}
	return shared;
}

/**
 * Positions the timeline rail across metadata and content rows.
 *
 * @returns {string} Marker-column layout classes.
 */
function markerColumnClass() {
	return props.layout === 'split'
		? 'col-start-1 row-span-2 row-start-1 md:col-start-2'
		: 'col-start-1 row-span-2 row-start-1';
}

/**
 * Builds spacing classes for the default or slotted activity content.
 *
 * @returns {string} Content spacing classes.
 */
function contentClass() {
	const spacing = props.density === 'compact' ? 'pb-4 pl-3' : 'pb-7 pl-4';
	const position = props.layout === 'split'
		? 'col-start-2 row-start-2 md:col-start-3 md:row-start-1'
		: 'col-start-2 row-start-2';
	return `${spacing} ${position}`;
}

/**
 * Builds marker dimensions that match the selected density.
 *
 * @returns {string} Marker size classes.
 */
function markerSizeClass() {
	return props.density === 'compact' ? 'mt-0.5 size-4' : 'mt-0.5 size-5';
}

/**
 * Builds connector offsets that continue cleanly into the next row.
 *
 * @returns {string} Connector position classes.
 */
function connectorClass() {
	return props.density === 'compact' ? 'top-4 bottom-0' : 'top-5 -bottom-1';
}
</script>

<template>
	<div :aria-busy="loading ? 'true' : 'false'">
		<slot v-if="loading && !records.length" name="loading" :count="loadingCount">
			<ol class="grid gap-0" :aria-label="ariaLabel">
				<li v-for="index in loadingCount" :key="index" class="grid grid-cols-[1.5rem_minmax(0,1fr)]">
					<div class="relative flex justify-center">
						<span v-if="index < loadingCount" class="absolute top-4 bottom-0 w-px bg-border" aria-hidden="true"></span>
						<DomSkeleton variant="circle" class="relative z-10 mt-0.5" width="1rem" height="1rem" />
					</div>
					<div class="pb-4 pl-3">
						<DomSkeleton variant="text" :lines="2" width="min(100%, 34rem)" />
					</div>
				</li>
			</ol>
		</slot>

		<slot v-else-if="!records.length" name="empty">
			<DomEmptyState :title="emptyTitle" :description="emptyDescription" size="sm" />
		</slot>

		<ol v-else :class="listClass" :aria-label="ariaLabel">
			<li
				v-for="(record, index) in records"
				:key="record.rowKey"
				class="relative grid min-w-0"
				:class="itemGridClass()"
				:data-row-key="record.rowKey"
			>
				<div :class="oppositeClass()">
					<slot name="opposite" v-bind="record">
						<span v-if="record.formattedTimestamp" class="font-medium text-canvas-fg">{{ record.formattedTimestamp }}</span>
						<span v-if="record.formattedTimestamp && record.meta" class="mx-1" :class="layout === 'split' ? 'md:hidden' : ''" aria-hidden="true">&middot;</span>
						<span v-if="record.meta" class="truncate" :class="layout === 'split' ? 'md:mt-1 md:block' : ''">{{ record.meta }}</span>
					</slot>
				</div>

				<div class="relative flex justify-center" :class="markerColumnClass()">
					<span
						v-if="index < records.length - 1"
						class="absolute w-px bg-border"
						:class="connectorClass()"
						aria-hidden="true"
					></span>
					<slot name="marker" v-bind="record">
						<span
							class="relative z-10 grid place-items-center rounded-full border"
							:class="[markerSizeClass(), markerClass(record.tone)]"
							aria-hidden="true"
						>
							<span class="size-1.5 rounded-full bg-current"></span>
						</span>
					</slot>
				</div>

				<article class="min-w-0" :class="contentClass()">
					<slot name="item" v-bind="record">
						<div class="flex min-w-0 flex-wrap items-start justify-between gap-2">
							<h3 class="min-w-0 flex-1 text-sm font-semibold leading-5 text-canvas-fg">{{ record.title || 'Untitled activity' }}</h3>
							<DomStatusPill
								v-if="record.statusLabel"
								:tone="record.tone"
								:label="record.statusLabel"
								size="sm"
							/>
						</div>
						<p v-if="record.description" class="mt-1 text-sm leading-6 text-muted-fg">{{ record.description }}</p>
						<div v-if="$slots.actions" class="mt-3 flex flex-wrap gap-2">
							<slot name="actions" v-bind="record" />
						</div>
					</slot>
				</article>
			</li>
		</ol>
	</div>
</template>
