<script>
/**
 * @typedef {object} KanbanColumn
 * @property {string|number} key Stable value stored on each row by columnKey.
 * @property {string} [label] Visible column label.
 * @property {string} [description] Optional supporting text below the label.
 * @property {number} [limit] Maximum cards accepted from another column.
 * @property {object|Function|string} [component] Vue component used to render cards in this column.
 * @property {boolean} [disabled] Disable card creation, card drops, and column reordering.
 * @property {boolean} [addable] Set false to hide the built-in Add card control for this column.
 * @property {Function} [canDrop] Function that receives a drop context and decides whether the column accepts it.
 * @property {string|Array|object} [class] Classes applied to the column shell.
 * @property {string|Array|object} [cardClass] Classes applied to card wrappers in the column.
 */

/**
 * @typedef {object} KanbanOrder
 * @property {string|number} columnKey Column represented by the order.
 * @property {Array<string|number>} rowKeys Complete ordered row keys for the column.
 */

/**
 * @typedef {object} KanbanCardMove
 * @property {Record<string, unknown>} row Moved resource row.
 * @property {string|number} rowKey Stable key of the moved row.
 * @property {{ column: KanbanColumn, columnKey: string|number, index: number }} source Original placement.
 * @property {{ column: KanbanColumn, columnKey: string|number, index: number }} target Requested placement.
 * @property {Record<string, unknown>} changes Minimal field changes for the moved row.
 * @property {Array<KanbanOrder>} orders Complete orders for affected columns.
 * @property {Array<Record<string, unknown>>} nextRows Immutable local projection of the move.
 * @property {'pointer'|'keyboard'} input Interaction that requested the move.
 */

export const kanbanProps = {
	rows: {
		type: Array,
		default: () => [],
		_edit: { description: 'Resource rows shared with a grid, calendar, API, or application store.' },
	},
	/**
	 * @type {Array<KanbanColumn>}
	 */
	columns: {
		type: Array,
		default: () => [],
		_edit: { description: 'Ordered Kanban column definitions. Keys should match values stored by columnKey.' },
	},
	rowKey: {
		type: [String, Function],
		default: 'id',
		_edit: { description: 'Field name or function used to identify each resource row.' },
	},
	columnKey: {
		type: String,
		default: 'status',
		_edit: { description: 'Row field that assigns a resource to a Kanban column.' },
	},
	orderKey: {
		type: String,
		default: 'position',
		_edit: { description: 'Row field that stores the zero-based order within a column.' },
	},
	titleKey: {
		type: [String, Function],
		default: 'title',
		_edit: { description: 'Field name or function used by the built-in card renderer for its title.' },
	},
	descriptionKey: {
		type: [String, Function],
		default: 'description',
		_edit: { description: 'Field name or function used by the built-in card renderer for supporting text.' },
	},
	cardComponent: {
		type: [Object, Function, String],
		default: null,
		_edit: { description: 'Vue component used to render every card. A column component or card slot can override it.' },
	},
	createCard: {
		type: Function,
		default: null,
		_edit: { group: 'Creation', description: 'Optional async hook that persists a suggested row and returns a row or stable id.' },
	},
	createColumn: {
		type: Function,
		default: null,
		_edit: { group: 'Creation', description: 'Optional async hook that persists a suggested column and returns a column or stable key.' },
	},
	allowAddCards: {
		type: Boolean,
		default: true,
		_edit: { group: 'Creation', description: 'Show a compact title composer at the bottom of each enabled column.' },
	},
	allowAddColumns: {
		type: Boolean,
		default: true,
		_edit: { group: 'Creation', description: 'Show a column composer after the final board column.' },
	},
	dragCards: {
		type: Boolean,
		default: true,
		_edit: { group: 'Interaction', description: 'Allow native pointer drag/drop and Alt+Arrow keyboard card movement.' },
	},
	reorderColumns: {
		type: Boolean,
		default: true,
		_edit: { group: 'Interaction', description: 'Allow columns to be reordered with the grip or Alt+Left/Right.' },
	},
	cardDraggable: {
		type: [Boolean, Function],
		default: true,
		_edit: { group: 'Interaction', description: 'Boolean or function that decides whether an individual card can move.' },
	},
	canDrop: {
		type: Function,
		default: null,
		_edit: { group: 'Interaction', description: 'Optional application rule that receives source and target context before a drop.' },
	},
	disabled: {
		type: Boolean,
		default: false,
		_edit: { group: 'State', description: 'Disable creation and reordering while keeping the board readable.' },
	},
	loading: {
		type: Boolean,
		default: false,
		_edit: { group: 'State', description: 'Show a non-blocking loading indicator over the board.' },
	},
	boardLabel: {
		type: String,
		default: 'Kanban board',
		_edit: { group: 'Labels', description: 'Accessible name for the board region.' },
	},
	resourceLabel: {
		type: String,
		default: 'cards',
		_edit: { group: 'Labels', description: 'Human label used in card counts and announcements.' },
	},
	addCardLabel: {
		type: String,
		default: 'Add card',
		_edit: { group: 'Labels', description: 'Label for each column creation control.' },
	},
	addColumnLabel: {
		type: String,
		default: 'Add column',
		_edit: { group: 'Labels', description: 'Label for the board column creation control.' },
	},
	emptyText: {
		type: String,
		default: 'Drop a card here or add a new one.',
		_edit: { group: 'Labels', description: 'Default text shown in an empty column.' },
	},
	columnWidth: {
		type: [String, Number],
		default: '18rem',
		_edit: { group: 'Layout', description: 'Fixed width of each horizontally scrolling column.' },
	},
	height: {
		type: [String, Number],
		default: '36rem',
		_edit: { group: 'Layout', description: 'Height of the board viewport.' },
	},
};
</script>

<script setup>
import { computed, markRaw, reactive, ref, useId } from 'vue';
import { applyKanbanCardMove } from './kanbanApi.js';

defineOptions({
	__doc: {
		name: 'Kanban',
		tag: '<DomKanban>',
		description: 'A controlled, API-shaped Kanban for shared resource rows, custom Vue card renderers, async creation, and precise card or column ordering.',
		icon: 'M4 5h5v14H4V5Zm7 0h5v9h-5V5Zm7 0h2v11h-2V5Z',
		events: [
			{ name: 'update:rows', payload: 'Array<Record<string, unknown>>', description: 'Immutable local projection after a completed card move or creation. Use v-model:rows for local boards.' },
			{ name: 'update:columns', payload: 'Array<KanbanColumn>', description: 'Immutable ordered columns after a completed reorder or creation.' },
			{ name: 'card-move', payload: 'KanbanCardMove', typeRef: 'KanbanCardMove', description: 'Fired after a valid pointer or keyboard move. Persist changes and orders to a resource API.' },
			{ name: 'card-drop', payload: 'KanbanCardMove', typeRef: 'KanbanCardMove', description: 'Alias emitted with card-move for applications that model drag/drop events.' },
			{ name: 'card-create-request', payload: '({ column, columnKey, index, draft, suggestedRow })', description: 'Fired before the optional createCard hook runs.' },
			{ name: 'card-create', payload: '({ column, columnKey, index, draft, result, row, nextRows })', description: 'Fired when the creation hook succeeds or a local suggested row is accepted.' },
			{ name: 'card-create-error', payload: '({ column, columnKey, draft, error })', description: 'Fired when createCard rejects.' },
			{ name: 'column-move', payload: '({ column, columnKey, sourceIndex, targetIndex, columnKeys, nextColumns, input })', description: 'Fired after a valid pointer or keyboard column reorder.' },
			{ name: 'column-create-request', payload: '({ label, suggestedColumn })', description: 'Fired before the optional createColumn hook runs.' },
			{ name: 'column-create', payload: '({ label, result, column, nextColumns })', description: 'Fired when the column creation hook succeeds or a local suggestion is accepted.' },
			{ name: 'column-create-error', payload: '({ label, error })', description: 'Fired when createColumn rejects.' },
			{ name: 'card-click', payload: '({ row, rowKey, column, columnKey, index, event })', description: 'Fired when a card shell is activated without using an inner interactive control.' },
			{ name: 'card-action', payload: '({ row, rowKey, column, columnKey, index, action, payload })', description: 'Re-emitted when a custom card component emits action.' },
			{ name: 'card-drag-start', payload: '({ row, rowKey, source, event })', description: 'Fired when native card dragging begins.' },
			{ name: 'card-drag-end', payload: '({ row, rowKey, source, event })', description: 'Fired when native card dragging ends.' },
		],
		slots: [
			{ name: 'card', payload: '{ row, rowKey, column, columnKey, index, drag }', description: 'Custom card renderer. The component retains the accessible focus and drag shell.' },
			{ name: 'column-header', payload: '{ column, columnKey, index, rows, count, limit }', description: 'Custom content for a column header.' },
			{ name: 'empty', payload: '{ column, columnKey }', description: 'Custom empty-column state.' },
			{ name: 'card-composer', payload: '{ column, columnKey, draft, setDraft, submit, cancel, creating }', description: 'Custom card creation form.' },
			{ name: 'column-composer', payload: '{ draft, setDraft, submit, cancel, creating }', description: 'Custom column creation form.' },
			{ name: 'column-footer', payload: '{ column, columnKey, rows, count }', description: 'Extra content below a column card list.' },
		],
		keyboard: [
			{ keys: 'Alt + Up / Down', action: 'Move the focused card within its current column.' },
			{ keys: 'Alt + Left / Right', action: 'Move the focused card into the adjacent column.' },
			{ keys: 'Alt + Left / Right on column grip', action: 'Reorder the current column.' },
			{ keys: 'Enter', action: 'Submit the built-in card or column composer.' },
			{ keys: 'Escape', action: 'Close the active composer.' },
		],
	},
});

const props = defineProps(kanbanProps);
const emit = defineEmits([
	'update:rows',
	'update:columns',
	'card-move',
	'card-drop',
	'card-create-request',
	'card-create',
	'card-create-error',
	'column-move',
	'column-create-request',
	'column-create',
	'column-create-error',
	'card-click',
	'card-action',
	'card-drag-start',
	'card-drag-end',
]);

const titleId = `dom-kanban-${useId()}`;
const cardDragType = 'application/x-dom-kanban-card';
const columnDragType = 'application/x-dom-kanban-column';
const liveMessage = ref('');
const cardComposerOpen = reactive({});
const cardDrafts = reactive({});
const cardCreating = reactive({});
const columnComposerOpen = ref(false);
const columnDraft = ref('');
const columnCreating = ref(false);
const dragState = reactive({
	kind: '',
	row: null,
	rowKey: null,
	sourceColumnKey: null,
	sourceIndex: -1,
	sourceColumnIndex: -1,
	targetColumnKey: null,
	targetInsertionIndex: -1,
	targetColumnIndex: -1,
});

const sourceRows = computed(() => Array.isArray(props.rows) ? props.rows : []);
const normalizedColumns = computed(() => {
	const supplied = Array.isArray(props.columns) ? props.columns : [];
	const definitions = supplied.length ? supplied : inferColumns(sourceRows.value);
	return definitions.map(normalizeColumn).filter(function retainValidColumn(column) {
		return column.key !== undefined && column.key !== null && column.key !== '';
	});
});
const columnRecords = computed(() => normalizedColumns.value.map(function createColumnRecord(column, index) {
	return {
		...column,
		index,
		cards: cardsForColumn(column),
	};
}));
const boardStyle = computed(() => ({
	height: cssSize(props.height),
}));
const resolvedColumnStyle = computed(() => ({
	width: cssSize(props.columnWidth),
	minWidth: cssSize(props.columnWidth),
}));

/**
 * Converts a number or CSS value into a usable component size.
 *
 * @param {string|number} value Requested size.
 * @returns {string} CSS size value.
 */
function cssSize(value) {
	return typeof value === 'number' ? `${value}px` : value;
}

/**
 * Converts a column key into a safe reactive-object key.
 *
 * @param {string|number} key Column key.
 * @returns {string} String key for composer maps.
 */
function columnStateKey(key) {
	return String(key);
}

/**
 * Reads a row field using a string key or consumer resolver.
 *
 * @param {Record<string, unknown>} row Resource row.
 * @param {string|Function} key Field name or resolver.
 * @param {number} index Row index within the current column.
 * @returns {unknown} Resolved field value.
 */
function fieldValue(row, key, index) {
	if (typeof key === 'function') return key(row, index);
	return row?.[key];
}

/**
 * Resolves the stable key of a rendered card.
 *
 * @param {Record<string, unknown>} row Resource row.
 * @param {number} index Global row index.
 * @returns {string|number} Stable row key.
 */
function rowKeyFor(row, index) {
	if (typeof props.rowKey === 'function') return props.rowKey(row, index);
	return row?.[props.rowKey] ?? index;
}

/**
 * Resolves a card title for the built-in renderer and announcements.
 *
 * @param {Record<string, unknown>} row Resource row.
 * @param {number} index Index within its column.
 * @returns {string} Card title.
 */
function rowTitle(row, index) {
	return String(fieldValue(row, props.titleKey, index) ?? `Untitled ${props.resourceLabel.slice(0, -1) || 'card'}`);
}

/**
 * Resolves optional supporting copy for the built-in card renderer.
 *
 * @param {Record<string, unknown>} row Resource row.
 * @param {number} index Index within its column.
 * @returns {string} Card description.
 */
function rowDescription(row, index) {
	return String(fieldValue(row, props.descriptionKey, index) ?? '');
}

/**
 * Creates a readable label from a stored column value.
 *
 * @param {string|number} value Stored column value.
 * @returns {string} Human-readable label.
 */
function labelFromKey(value) {
	return String(value)
		.replace(/[_-]+/g, ' ')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/\b\w/g, function capitalizeCharacter(character) {
			return character.toUpperCase();
		});
}

/**
 * Normalizes a string or object column definition.
 *
 * @param {KanbanColumn|string|number} definition Consumer-supplied definition.
 * @returns {KanbanColumn} Normalized column.
 */
function normalizeColumn(definition) {
	const column = definition && typeof definition === 'object'
		? { ...definition }
		: { key: definition };
	return {
		...column,
		label: column.label || labelFromKey(column.key),
		component: column.component && typeof column.component === 'object' ? markRaw(column.component) : column.component || null,
	};
}

/**
 * Infers columns from the unique stored values in resource order.
 *
 * @param {Array<Record<string, unknown>>} rows Resource rows.
 * @returns {Array<KanbanColumn>} Inferred definitions.
 */
function inferColumns(rows) {
	const keys = [];
	rows.forEach(function collectColumnValue(row) {
		const key = row?.[props.columnKey];
		if (key === undefined || key === null || keys.includes(key)) return;
		keys.push(key);
	});
	return keys.map(function createInferredColumn(key) {
		return { key, label: labelFromKey(key) };
	});
}

/**
 * Compares two cards by their explicit order and stable source index.
 *
 * @param {{ row: Record<string, unknown>, globalIndex: number }} left Left card record.
 * @param {{ row: Record<string, unknown>, globalIndex: number }} right Right card record.
 * @returns {number} Sort comparison.
 */
function compareCardOrder(left, right) {
	const leftOrder = Number(left.row?.[props.orderKey]);
	const rightOrder = Number(right.row?.[props.orderKey]);
	const leftHasOrder = Number.isFinite(leftOrder);
	const rightHasOrder = Number.isFinite(rightOrder);
	if (leftHasOrder && rightHasOrder && leftOrder !== rightOrder) return leftOrder - rightOrder;
	if (leftHasOrder !== rightHasOrder) return leftHasOrder ? -1 : 1;
	return left.globalIndex - right.globalIndex;
}

/**
 * Builds ordered card records for a board column.
 *
 * @param {KanbanColumn} column Column definition.
 * @returns {Array<{ row: Record<string, unknown>, rowKey: string|number, globalIndex: number, index: number }>} Ordered cards.
 */
function cardsForColumn(column) {
	return sourceRows.value
		.map(function mapSourceRow(row, globalIndex) {
			return { row, globalIndex, rowKey: rowKeyFor(row, globalIndex) };
		})
		.filter(function retainColumnCard(card) {
			return card.row?.[props.columnKey] === column.key;
		})
		.sort(compareCardOrder)
		.map(function addColumnIndex(card, index) {
			return { ...card, index };
		});
}

/**
 * Resolves the custom component selected for a column.
 *
 * @param {KanbanColumn} column Column definition.
 * @returns {object|Function|string|null} Vue component or null.
 */
function cardComponentFor(column) {
	return column.component || props.cardComponent || null;
}

/**
 * Reports whether the current card uses a slot or dynamic component renderer.
 *
 * @param {KanbanColumn} column Column definition.
 * @returns {boolean} True when the built-in card content is replaced.
 */
function hasCustomCardRenderer(column) {
	return Boolean(cardComponentFor(column));
}

/**
 * Checks whether a card can begin a drag interaction.
 *
 * @param {object} card Rendered card record.
 * @param {KanbanColumn} column Source column.
 * @returns {boolean} True when the card is draggable.
 */
function canDragCard(card, column) {
	if (!props.dragCards || props.disabled || column.disabled) return false;
	if (typeof props.cardDraggable === 'function') {
		return Boolean(props.cardDraggable({
			row: card.row,
			rowKey: card.rowKey,
			column,
			columnKey: column.key,
			index: card.index,
		}));
	}
	return props.cardDraggable !== false;
}

/**
 * Checks board, column, and capacity rules for a candidate card target.
 *
 * @param {object} card Dragged card record.
 * @param {KanbanColumn} sourceColumn Source column.
 * @param {KanbanColumn} targetColumn Target column.
 * @param {number} targetIndex Requested final index.
 * @returns {boolean} True when the target accepts the card.
 */
function canReceiveCard(card, sourceColumn, targetColumn, targetIndex) {
	if (!card || props.disabled || targetColumn.disabled) return false;
	const targetRecord = columnRecords.value.find(function findTargetColumn(column) {
		return column.key === targetColumn.key;
	});
	if (!targetRecord) return false;
	if (sourceColumn.key !== targetColumn.key && Number.isFinite(targetColumn.limit) && targetRecord.cards.length >= targetColumn.limit) return false;

	const context = {
		row: card.row,
		rowKey: card.rowKey,
		source: { column: sourceColumn, columnKey: sourceColumn.key, index: card.index },
		target: { column: targetColumn, columnKey: targetColumn.key, index: targetIndex },
	};
	if (typeof targetColumn.canDrop === 'function' && !targetColumn.canDrop(context)) return false;
	if (typeof props.canDrop === 'function' && !props.canDrop(context)) return false;
	return true;
}

/**
 * Finds a current column record by its stable key.
 *
 * @param {string|number} key Column key.
 * @returns {object|null} Column record or null.
 */
function columnRecordFor(key) {
	return columnRecords.value.find(function matchColumn(column) {
		return column.key === key;
	}) || null;
}

/**
 * Clears all pointer drag state after completion or cancellation.
 *
 * @returns {void}
 */
function resetDragState() {
	dragState.kind = '';
	dragState.row = null;
	dragState.rowKey = null;
	dragState.sourceColumnKey = null;
	dragState.sourceIndex = -1;
	dragState.sourceColumnIndex = -1;
	dragState.targetColumnKey = null;
	dragState.targetInsertionIndex = -1;
	dragState.targetColumnIndex = -1;
}

/**
 * Stores a serializable native drag payload with a text fallback.
 *
 * @param {DragEvent} event Native drag event.
 * @param {string} type Custom MIME type.
 * @param {Record<string, unknown>} payload Serializable payload.
 * @returns {void}
 */
function setDragTransfer(event, type, payload) {
	if (!event.dataTransfer) return;
	event.dataTransfer.effectAllowed = 'move';
	try {
		event.dataTransfer.setData(type, JSON.stringify(payload));
		event.dataTransfer.setData('text/plain', String(payload.rowKey ?? payload.columnKey ?? ''));
	} catch {
		// Some browsers restrict custom drag data stores; in-memory state remains authoritative.
	}
}

/**
 * Starts a native card drag and publishes its source context.
 *
 * @param {object} card Rendered card record.
 * @param {KanbanColumn} column Source column.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function startCardDrag(card, column, event) {
	if (!canDragCard(card, column)) {
		event.preventDefault();
		return;
	}
	dragState.kind = 'card';
	dragState.row = card.row;
	dragState.rowKey = card.rowKey;
	dragState.sourceColumnKey = column.key;
	dragState.sourceIndex = card.index;
	setDragTransfer(event, cardDragType, {
		rowKey: card.rowKey,
		columnKey: column.key,
		index: card.index,
	});
	emit('card-drag-start', {
		row: card.row,
		rowKey: card.rowKey,
		source: { column, columnKey: column.key, index: card.index },
		event,
	});
}

/**
 * Returns the active dragged card with its current source position.
 *
 * @returns {object|null} Active card record or null.
 */
function activeDraggedCard() {
	if (dragState.kind !== 'card') return null;
	const sourceColumn = columnRecordFor(dragState.sourceColumnKey);
	if (!sourceColumn) return null;
	return sourceColumn.cards.find(function matchDraggedCard(card) {
		return card.rowKey === dragState.rowKey;
	}) || null;
}

/**
 * Tracks a card insertion zone as the active drop target.
 *
 * @param {KanbanColumn} targetColumn Target column.
 * @param {number} insertionIndex Index before source-removal normalization.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onCardDragEnter(targetColumn, insertionIndex, event) {
	const card = activeDraggedCard();
	const sourceColumn = columnRecordFor(dragState.sourceColumnKey);
	if (!card || !sourceColumn || !canReceiveCard(card, sourceColumn, targetColumn, insertionIndex)) return;
	event.preventDefault();
	dragState.targetColumnKey = targetColumn.key;
	dragState.targetInsertionIndex = insertionIndex;
}

/**
 * Keeps a valid card insertion zone droppable for the native API.
 *
 * @param {KanbanColumn} targetColumn Target column.
 * @param {number} insertionIndex Index before source-removal normalization.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onCardDragOver(targetColumn, insertionIndex, event) {
	const card = activeDraggedCard();
	const sourceColumn = columnRecordFor(dragState.sourceColumnKey);
	if (!card || !sourceColumn || !canReceiveCard(card, sourceColumn, targetColumn, insertionIndex)) return;
	event.preventDefault();
	if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
}

/**
 * Clears a card target when the pointer leaves its insertion zone.
 *
 * @param {KanbanColumn} targetColumn Target column.
 * @param {number} insertionIndex Target insertion index.
 * @returns {void}
 */
function onCardDragLeave(targetColumn, insertionIndex) {
	if (dragState.targetColumnKey !== targetColumn.key || dragState.targetInsertionIndex !== insertionIndex) return;
	dragState.targetColumnKey = null;
	dragState.targetInsertionIndex = -1;
}

/**
 * Resolves whether a card-body pointer targets the insertion point before or after it.
 *
 * @param {number} cardIndex Target card index.
 * @param {DragEvent} event Native drag event whose current target is the card shell.
 * @returns {number} Insertion index represented by the pointer position.
 */
function cardSurfaceInsertionIndex(cardIndex, event) {
	const target = event.currentTarget;
	if (!(target instanceof Element)) return cardIndex;
	const bounds = target.getBoundingClientRect();
	return event.clientY >= bounds.top + (bounds.height / 2) ? cardIndex + 1 : cardIndex;
}

/**
 * Expands a card shell into a large before-or-after drag-enter target.
 *
 * @param {KanbanColumn} targetColumn Target column.
 * @param {number} cardIndex Target card index.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onCardSurfaceDragEnter(targetColumn, cardIndex, event) {
	onCardDragEnter(targetColumn, cardSurfaceInsertionIndex(cardIndex, event), event);
}

/**
 * Keeps the before-or-after insertion represented by a card shell droppable.
 *
 * @param {KanbanColumn} targetColumn Target column.
 * @param {number} cardIndex Target card index.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onCardSurfaceDragOver(targetColumn, cardIndex, event) {
	const insertionIndex = cardSurfaceInsertionIndex(cardIndex, event);
	onCardDragEnter(targetColumn, insertionIndex, event);
	onCardDragOver(targetColumn, insertionIndex, event);
}

/**
 * Completes a native card drop against the card half under the pointer.
 *
 * @param {KanbanColumn} targetColumn Target column.
 * @param {number} cardIndex Target card index.
 * @param {DragEvent} event Native drop event.
 * @returns {void}
 */
function onCardSurfaceDrop(targetColumn, cardIndex, event) {
	onCardDrop(targetColumn, cardSurfaceInsertionIndex(cardIndex, event), event);
}

/**
 * Builds complete affected-column orders for a final card placement.
 *
 * @param {object} card Dragged card record.
 * @param {object} sourceColumn Source column record.
 * @param {object} targetColumn Target column record.
 * @param {number} targetIndex Final target index.
 * @returns {Array<KanbanOrder>} Complete affected orders.
 */
function cardOrders(card, sourceColumn, targetColumn, targetIndex) {
	const sourceKeys = sourceColumn.cards.map(function mapSourceCard(item) {
		return item.rowKey;
	}).filter(function removeDraggedKey(key) {
		return key !== card.rowKey;
	});
	if (sourceColumn.key === targetColumn.key) {
		sourceKeys.splice(targetIndex, 0, card.rowKey);
		return [{ columnKey: sourceColumn.key, rowKeys: sourceKeys }];
	}

	const targetKeys = targetColumn.cards.map(function mapTargetCard(item) {
		return item.rowKey;
	});
	targetKeys.splice(targetIndex, 0, card.rowKey);
	return [
		{ columnKey: sourceColumn.key, rowKeys: sourceKeys },
		{ columnKey: targetColumn.key, rowKeys: targetKeys },
	];
}

/**
 * Emits a controlled card move and its immutable v-model projection.
 *
 * @param {object} card Dragged card record.
 * @param {object} sourceColumn Source column record.
 * @param {object} targetColumn Target column record.
 * @param {number} requestedIndex Final target index.
 * @param {Event} event Interaction event.
 * @param {'pointer'|'keyboard'} input Interaction type.
 * @returns {void}
 */
function emitCardMove(card, sourceColumn, targetColumn, requestedIndex, event, input) {
	const targetLength = targetColumn.cards.length - (sourceColumn.key === targetColumn.key ? 1 : 0);
	const targetIndex = Math.max(0, Math.min(requestedIndex, targetLength));
	if (!canReceiveCard(card, sourceColumn, targetColumn, targetIndex)) return;
	if (sourceColumn.key === targetColumn.key && card.index === targetIndex) return;

	const changes = {};
	if (props.columnKey) changes[props.columnKey] = targetColumn.key;
	if (props.orderKey) changes[props.orderKey] = targetIndex;
	const orders = cardOrders(card, sourceColumn, targetColumn, targetIndex);
	const basePayload = {
		row: card.row,
		rowKey: card.rowKey,
		source: { column: sourceColumn, columnKey: sourceColumn.key, index: card.index },
		target: { column: targetColumn, columnKey: targetColumn.key, index: targetIndex },
		changes,
		orders,
		input,
		event,
	};
	const nextRows = applyKanbanCardMove(sourceRows.value, basePayload, {
		rowKey: props.rowKey,
		columnKey: props.columnKey,
		orderKey: props.orderKey,
	});
	const payload = { ...basePayload, nextRows };
	emit('update:rows', nextRows);
	emit('card-move', payload);
	emit('card-drop', payload);
	liveMessage.value = `Moved ${rowTitle(card.row, card.index)} to ${targetColumn.label}, position ${targetIndex + 1}.`;
}

/**
 * Completes a native card drop at an insertion zone.
 *
 * @param {KanbanColumn} targetColumn Target column.
 * @param {number} insertionIndex Index before source removal.
 * @param {DragEvent} event Native drop event.
 * @returns {void}
 */
function onCardDrop(targetColumn, insertionIndex, event) {
	const card = activeDraggedCard();
	const sourceColumn = columnRecordFor(dragState.sourceColumnKey);
	const currentTarget = columnRecordFor(targetColumn.key);
	if (!card || !sourceColumn || !currentTarget || !canReceiveCard(card, sourceColumn, currentTarget, insertionIndex)) return;
	event.preventDefault();
	let finalIndex = insertionIndex;
	if (sourceColumn.key === currentTarget.key && card.index < insertionIndex) finalIndex -= 1;
	emitCardMove(card, sourceColumn, currentTarget, finalIndex, event, 'pointer');
	resetDragState();
}

/**
 * Emits drag completion context and clears native drag state.
 *
 * @param {object} card Dragged card record.
 * @param {KanbanColumn} column Source column.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function endCardDrag(card, column, event) {
	emit('card-drag-end', {
		row: card.row,
		rowKey: card.rowKey,
		source: { column, columnKey: column.key, index: card.index },
		event,
	});
	resetDragState();
}

/**
 * Reports whether a rendered card is the current drag source.
 *
 * @param {object} card Rendered card record.
 * @returns {boolean} True for the source card.
 */
function isDraggedCard(card) {
	return dragState.kind === 'card' && dragState.rowKey === card.rowKey;
}

/**
 * Reports whether an insertion zone is the current card target.
 *
 * @param {KanbanColumn} column Target column.
 * @param {number} index Insertion index.
 * @returns {boolean} True for the active drop zone.
 */
function isCardDropTarget(column, index) {
	return dragState.kind === 'card'
		&& dragState.targetColumnKey === column.key
		&& dragState.targetInsertionIndex === index;
}

/**
 * Handles accessible Alt+Arrow card movement from the focused card shell.
 *
 * @param {object} card Focused card record.
 * @param {KanbanColumn} column Current column.
 * @param {KeyboardEvent} event Native keyboard event.
 * @returns {void}
 */
function onCardKeydown(card, column, event) {
	if (event.target !== event.currentTarget || !event.altKey || !canDragCard(card, column)) return;
	const sourceColumn = columnRecordFor(column.key);
	if (!sourceColumn) return;
	let targetColumn = sourceColumn;
	let targetIndex = card.index;

	if (event.key === 'ArrowUp') targetIndex -= 1;
	else if (event.key === 'ArrowDown') targetIndex += 1;
	else if (event.key === 'ArrowLeft') targetColumn = columnRecords.value[sourceColumn.index - 1];
	else if (event.key === 'ArrowRight') targetColumn = columnRecords.value[sourceColumn.index + 1];
	else return;

	if (!targetColumn) return;
	if (targetColumn.key !== sourceColumn.key) targetIndex = Math.min(card.index, targetColumn.cards.length);
	if (targetIndex < 0 || (targetColumn.key === sourceColumn.key && targetIndex >= sourceColumn.cards.length)) return;
	event.preventDefault();
	emitCardMove(card, sourceColumn, targetColumn, targetIndex, event, 'keyboard');
}

/**
 * Emits card-click unless an interactive descendant handled the activation.
 *
 * @param {object} card Clicked card record.
 * @param {KanbanColumn} column Current column.
 * @param {MouseEvent} event Native click event.
 * @returns {void}
 */
function onCardClick(card, column, event) {
	if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select, [role="button"]')) return;
	emit('card-click', {
		row: card.row,
		rowKey: card.rowKey,
		column,
		columnKey: column.key,
		index: card.index,
		event,
	});
}

/**
 * Re-emits an action from a dynamic card component with its resource context.
 *
 * @param {object} card Card record.
 * @param {KanbanColumn} column Current column.
 * @param {unknown} payload Custom component action payload.
 * @returns {void}
 */
function onCardAction(card, column, payload) {
	emit('card-action', {
		row: card.row,
		rowKey: card.rowKey,
		column,
		columnKey: column.key,
		index: card.index,
		action: payload?.action ?? payload?.type ?? payload,
		payload,
	});
}

/**
 * Opens a built-in card composer for one column.
 *
 * @param {KanbanColumn} column Target column.
 * @returns {void}
 */
function openCardComposer(column) {
	if (props.disabled || column.disabled) return;
	cardComposerOpen[columnStateKey(column.key)] = true;
	cardDrafts[columnStateKey(column.key)] ||= '';
}

/**
 * Closes and clears a built-in card composer.
 *
 * @param {KanbanColumn} column Target column.
 * @returns {void}
 */
function closeCardComposer(column) {
	const key = columnStateKey(column.key);
	cardComposerOpen[key] = false;
	cardDrafts[key] = '';
}

/**
 * Updates a card composer draft from a custom slot.
 *
 * @param {KanbanColumn} column Target column.
 * @param {string} value New draft title.
 * @returns {void}
 */
function setCardDraft(column, value) {
	cardDrafts[columnStateKey(column.key)] = String(value ?? '');
}

/**
 * Creates a browser-safe optimistic key for local card or column creation.
 *
 * @param {string} prefix Key prefix.
 * @returns {string} Stable optimistic key.
 */
function generatedKey(prefix) {
	if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Resolves the writable row-key field used by suggested records.
 *
 * @returns {string} Row key field.
 */
function writableRowKey() {
	return typeof props.rowKey === 'string' ? props.rowKey : 'id';
}

/**
 * Normalizes a createCard hook result into a complete resource row.
 *
 * @param {unknown} result Hook result.
 * @param {Record<string, unknown>} suggestedRow Suggested resource fields.
 * @returns {Record<string, unknown>} Created row.
 */
function normalizeCreatedRow(result, suggestedRow) {
	if (result && typeof result === 'object' && !Array.isArray(result)) return { ...suggestedRow, ...result };
	if (typeof result === 'string' || typeof result === 'number') {
		return { ...suggestedRow, [writableRowKey()]: result };
	}
	return suggestedRow;
}

/**
 * Submits a card draft through the optional async persistence hook.
 *
 * @param {KanbanColumn} column Target column.
 * @returns {Promise<void>} Resolves after creation succeeds or fails.
 */
async function submitCard(column) {
	const key = columnStateKey(column.key);
	const title = String(cardDrafts[key] ?? '').trim();
	if (!title || cardCreating[key] || props.disabled || column.disabled) return;
	const currentColumn = columnRecordFor(column.key);
	const index = currentColumn?.cards.length || 0;
	const suggestedRow = {
		[writableRowKey()]: generatedKey('card'),
		[props.columnKey]: column.key,
		[props.orderKey]: index,
		[typeof props.titleKey === 'string' ? props.titleKey : 'title']: title,
	};
	const request = {
		column,
		columnKey: column.key,
		index,
		draft: { title },
		suggestedRow,
	};
	emit('card-create-request', request);
	cardCreating[key] = true;
	try {
		const result = props.createCard ? await props.createCard(request) : suggestedRow;
		const row = normalizeCreatedRow(result, suggestedRow);
		const nextRows = [...sourceRows.value, row];
		emit('update:rows', nextRows);
		emit('card-create', { ...request, result, row, nextRows });
		liveMessage.value = `Added ${title} to ${column.label}.`;
		closeCardComposer(column);
	} catch (error) {
		emit('card-create-error', { ...request, error });
		liveMessage.value = `Could not add ${title} to ${column.label}.`;
	} finally {
		cardCreating[key] = false;
	}
}

/**
 * Starts a native column drag from its dedicated grip.
 *
 * @param {KanbanColumn} column Source column.
 * @param {number} index Source column index.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function startColumnDrag(column, index, event) {
	if (!props.reorderColumns || props.disabled || column.disabled) {
		event.preventDefault();
		return;
	}
	dragState.kind = 'column';
	dragState.sourceColumnKey = column.key;
	dragState.sourceColumnIndex = index;
	setDragTransfer(event, columnDragType, { columnKey: column.key, index });
}

/**
 * Tracks a column insertion zone as the active drop target.
 *
 * @param {number} insertionIndex Index before source removal.
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onColumnDragEnter(insertionIndex, event) {
	if (dragState.kind !== 'column') return;
	event.preventDefault();
	dragState.targetColumnIndex = insertionIndex;
}

/**
 * Keeps a column insertion zone active for native drag/drop.
 *
 * @param {DragEvent} event Native drag event.
 * @returns {void}
 */
function onColumnDragOver(event) {
	if (dragState.kind !== 'column') return;
	event.preventDefault();
	if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
}

/**
 * Moves an array item without mutating the source.
 *
 * @template T
 * @param {Array<T>} items Source items.
 * @param {number} sourceIndex Existing index.
 * @param {number} targetIndex Final index.
 * @returns {Array<T>} Reordered items.
 */
function moveArrayItem(items, sourceIndex, targetIndex) {
	const nextItems = [...items];
	const [item] = nextItems.splice(sourceIndex, 1);
	nextItems.splice(targetIndex, 0, item);
	return nextItems;
}

/**
 * Emits a controlled column reorder and immutable v-model projection.
 *
 * @param {KanbanColumn} column Moved column.
 * @param {number} sourceIndex Existing index.
 * @param {number} requestedIndex Final index.
 * @param {Event} event Interaction event.
 * @param {'pointer'|'keyboard'} input Interaction type.
 * @returns {void}
 */
function emitColumnMove(column, sourceIndex, requestedIndex, event, input) {
	const targetIndex = Math.max(0, Math.min(requestedIndex, normalizedColumns.value.length - 1));
	if (sourceIndex === targetIndex) return;
	const nextColumns = moveArrayItem(normalizedColumns.value, sourceIndex, targetIndex);
	const columnKeys = nextColumns.map(function mapColumnKey(item) {
		return item.key;
	});
	const payload = {
		column,
		columnKey: column.key,
		sourceIndex,
		targetIndex,
		columnKeys,
		nextColumns,
		input,
		event,
	};
	emit('update:columns', nextColumns);
	emit('column-move', payload);
	liveMessage.value = `Moved ${column.label} to column ${targetIndex + 1}.`;
}

/**
 * Completes a native column reorder at an insertion zone.
 *
 * @param {number} insertionIndex Index before source removal.
 * @param {DragEvent} event Native drop event.
 * @returns {void}
 */
function onColumnDrop(insertionIndex, event) {
	if (dragState.kind !== 'column') return;
	event.preventDefault();
	const sourceIndex = dragState.sourceColumnIndex;
	const column = normalizedColumns.value[sourceIndex];
	let targetIndex = insertionIndex;
	if (sourceIndex < insertionIndex) targetIndex -= 1;
	if (column) emitColumnMove(column, sourceIndex, targetIndex, event, 'pointer');
	resetDragState();
}

/**
 * Reports whether a column insertion zone is active.
 *
 * @param {number} index Insertion index.
 * @returns {boolean} True for the active column target.
 */
function isColumnDropTarget(index) {
	return dragState.kind === 'column' && dragState.targetColumnIndex === index;
}

/**
 * Handles accessible Alt+Left/Right reordering from a column grip.
 *
 * @param {KanbanColumn} column Current column.
 * @param {number} index Current index.
 * @param {KeyboardEvent} event Native keyboard event.
 * @returns {void}
 */
function onColumnKeydown(column, index, event) {
	if (!event.altKey || !props.reorderColumns || props.disabled || column.disabled) return;
	let targetIndex = index;
	if (event.key === 'ArrowLeft') targetIndex -= 1;
	else if (event.key === 'ArrowRight') targetIndex += 1;
	else return;
	if (targetIndex < 0 || targetIndex >= normalizedColumns.value.length) return;
	event.preventDefault();
	emitColumnMove(column, index, targetIndex, event, 'keyboard');
}

/**
 * Creates a unique slug-like column key from a label.
 *
 * @param {string} label New column label.
 * @returns {string} Unique suggested key.
 */
function suggestedColumnKey(label) {
	const base = label.toLowerCase().trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '') || 'column';
	const used = new Set(normalizedColumns.value.map(function collectColumnKey(column) {
		return String(column.key);
	}));
	let key = base;
	let suffix = 2;
	while (used.has(key)) {
		key = `${base}-${suffix}`;
		suffix += 1;
	}
	return key;
}

/**
 * Normalizes a createColumn hook result into a complete column definition.
 *
 * @param {unknown} result Hook result.
 * @param {KanbanColumn} suggestedColumn Suggested definition.
 * @returns {KanbanColumn} Created column.
 */
function normalizeCreatedColumn(result, suggestedColumn) {
	if (result && typeof result === 'object' && !Array.isArray(result)) return normalizeColumn({ ...suggestedColumn, ...result });
	if (typeof result === 'string' || typeof result === 'number') return normalizeColumn({ ...suggestedColumn, key: result });
	return normalizeColumn(suggestedColumn);
}

/**
 * Updates a column composer draft from a custom slot.
 *
 * @param {string} value New column label.
 * @returns {void}
 */
function setColumnDraft(value) {
	columnDraft.value = String(value ?? '');
}

/**
 * Closes and clears the board column composer.
 *
 * @returns {void}
 */
function closeColumnComposer() {
	columnComposerOpen.value = false;
	columnDraft.value = '';
}

/**
 * Submits a column draft through the optional async persistence hook.
 *
 * @returns {Promise<void>} Resolves after creation succeeds or fails.
 */
async function submitColumn() {
	const label = columnDraft.value.trim();
	if (!label || columnCreating.value || props.disabled) return;
	const suggestedColumn = { key: suggestedColumnKey(label), label };
	const request = { label, suggestedColumn };
	emit('column-create-request', request);
	columnCreating.value = true;
	try {
		const result = props.createColumn ? await props.createColumn(request) : suggestedColumn;
		const column = normalizeCreatedColumn(result, suggestedColumn);
		const nextColumns = [...normalizedColumns.value, column];
		emit('update:columns', nextColumns);
		emit('column-create', { ...request, result, column, nextColumns });
		liveMessage.value = `Added ${column.label} column.`;
		closeColumnComposer();
	} catch (error) {
		emit('column-create-error', { ...request, error });
		liveMessage.value = `Could not add ${label} column.`;
	} finally {
		columnCreating.value = false;
	}
}
</script>

<template>
	<section
		class="relative w-full min-w-0 overflow-hidden rounded-xl border border-border bg-secondary/25 text-canvas-fg shadow-sm"
		:aria-labelledby="titleId"
		:data-disabled="disabled ? '' : undefined"
	>
		<h2 :id="titleId" class="sr-only">{{ boardLabel }}</h2>
		<p class="sr-only" aria-live="polite">{{ liveMessage }}</p>

		<div class="overflow-x-auto overflow-y-hidden overscroll-x-contain" :style="boardStyle">
			<div role="list" :aria-label="boardLabel" class="flex h-full min-w-max items-stretch p-3">
				<template v-for="(column, columnIndex) in columnRecords" :key="column.key">
					<div
						aria-hidden="true"
						class="mx-1 w-2 shrink-0 rounded-full transition-colors"
						:class="isColumnDropTarget(columnIndex) ? 'bg-primary' : 'bg-transparent'"
						@dragenter="onColumnDragEnter(columnIndex, $event)"
						@dragover="onColumnDragOver"
						@drop="onColumnDrop(columnIndex, $event)"
					></div>

					<section
						role="listitem"
						class="flex h-full shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-secondary/55"
						:class="column.class"
						:style="resolvedColumnStyle"
						:data-column-key="column.key"
					>
						<header class="flex shrink-0 items-start gap-2 border-b border-border bg-canvas/90 px-3 py-3 backdrop-blur">
							<div class="min-w-0 flex-1">
								<slot
									name="column-header"
									:column="column"
									:column-key="column.key"
									:index="columnIndex"
									:rows="column.cards.map((card) => card.row)"
									:count="column.cards.length"
									:limit="column.limit"
								>
									<div class="flex min-w-0 items-center gap-2">
										<h3 class="truncate text-sm font-semibold tracking-tight">{{ column.label }}</h3>
										<span class="inline-flex min-w-6 items-center justify-center rounded-full bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-muted-fg ring-1 ring-border">
											{{ column.cards.length }}<template v-if="Number.isFinite(column.limit)">/{{ column.limit }}</template>
										</span>
									</div>
									<p v-if="column.description" class="mt-1 line-clamp-2 text-xs leading-4 text-muted-fg">{{ column.description }}</p>
								</slot>
							</div>

							<button
								v-if="reorderColumns"
								type="button"
								class="grid size-7 shrink-0 cursor-grab place-items-center rounded-md text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:cursor-grabbing disabled:pointer-events-none disabled:opacity-40"
								:disabled="disabled || column.disabled"
								:draggable="!disabled && !column.disabled"
								:aria-label="`Reorder ${column.label} column`"
								:title="`Drag to reorder ${column.label}; Alt+Left or Alt+Right also works`"
								@dragstart.stop="startColumnDrag(column, columnIndex, $event)"
								@dragend="resetDragState"
								@keydown="onColumnKeydown(column, columnIndex, $event)"
							>
								<svg class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<circle cx="8" cy="7" r="1.3" /><circle cx="16" cy="7" r="1.3" />
									<circle cx="8" cy="12" r="1.3" /><circle cx="16" cy="12" r="1.3" />
									<circle cx="8" cy="17" r="1.3" /><circle cx="16" cy="17" r="1.3" />
								</svg>
							</button>
						</header>

						<div role="list" :aria-label="`${column.label} ${resourceLabel}`" class="min-h-0 flex-1 overflow-y-auto px-2">
							<template v-for="(card, cardIndex) in column.cards" :key="card.rowKey">
								<div
									aria-hidden="true"
									class="h-2 rounded-full transition-colors"
									:class="isCardDropTarget(column, cardIndex) ? 'bg-primary' : 'bg-transparent'"
									@dragenter="onCardDragEnter(column, cardIndex, $event)"
									@dragover="onCardDragOver(column, cardIndex, $event)"
									@dragleave="onCardDragLeave(column, cardIndex)"
									@drop="onCardDrop(column, cardIndex, $event)"
								></div>

								<article
									role="listitem"
									tabindex="0"
									class="group/card relative cursor-default rounded-lg outline-none transition focus-visible:ring-2 focus-visible:ring-ring/60"
									:class="[
										hasCustomCardRenderer(column) || $slots.card
											? 'bg-transparent'
											: 'border border-border bg-canvas p-3 shadow-xs hover:border-ring/35 hover:shadow-sm',
										canDragCard(card, column) && 'cursor-grab active:cursor-grabbing',
										isDraggedCard(card) && 'opacity-45',
										column.cardClass,
									]"
									:draggable="canDragCard(card, column)"
									:data-card-key="card.rowKey"
									:aria-label="`${rowTitle(card.row, cardIndex)}. ${column.label}, position ${cardIndex + 1}. Hold Alt and use arrow keys to move.`"
									@dragstart.stop="startCardDrag(card, column, $event)"
									@dragend="endCardDrag(card, column, $event)"
									@dragenter="onCardSurfaceDragEnter(column, cardIndex, $event)"
									@dragover="onCardSurfaceDragOver(column, cardIndex, $event)"
									@drop="onCardSurfaceDrop(column, cardIndex, $event)"
									@keydown="onCardKeydown(card, column, $event)"
									@click="onCardClick(card, column, $event)"
								>
									<slot
										name="card"
										:row="card.row"
										:row-key="card.rowKey"
										:column="column"
										:column-key="column.key"
										:index="cardIndex"
										:drag="{ active: dragState.kind === 'card', source: isDraggedCard(card) }"
									>
										<component
											:is="cardComponentFor(column)"
											v-if="cardComponentFor(column)"
											:row="card.row"
											:row-key="card.rowKey"
											:column="column"
											:column-key="column.key"
											:index="cardIndex"
											@action="onCardAction(card, column, $event)"
										/>
										<div v-else>
											<h4 class="text-sm font-semibold leading-5 text-canvas-fg">{{ rowTitle(card.row, cardIndex) }}</h4>
											<p v-if="rowDescription(card.row, cardIndex)" class="mt-1.5 line-clamp-3 text-xs leading-5 text-muted-fg">
												{{ rowDescription(card.row, cardIndex) }}
											</p>
										</div>
									</slot>
								</article>
							</template>

							<div
								aria-hidden="true"
								class="h-2 rounded-full transition-colors"
								:class="isCardDropTarget(column, column.cards.length) ? 'bg-primary' : 'bg-transparent'"
								@dragenter="onCardDragEnter(column, column.cards.length, $event)"
								@dragover="onCardDragOver(column, column.cards.length, $event)"
								@dragleave="onCardDragLeave(column, column.cards.length)"
								@drop="onCardDrop(column, column.cards.length, $event)"
							></div>

							<div v-if="!column.cards.length && dragState.kind !== 'card'" class="rounded-lg border border-dashed border-border bg-canvas/50 px-4 py-8 text-center text-xs leading-5 text-muted-fg">
								<slot name="empty" :column="column" :column-key="column.key">{{ emptyText }}</slot>
							</div>
						</div>

						<footer class="shrink-0 border-t border-border bg-secondary/40 p-2">
							<slot name="column-footer" :column="column" :column-key="column.key" :rows="column.cards.map((card) => card.row)" :count="column.cards.length" />

							<template v-if="allowAddCards && column.addable !== false">
								<template v-if="cardComposerOpen[columnStateKey(column.key)]">
									<slot
										name="card-composer"
										:column="column"
										:column-key="column.key"
										:draft="cardDrafts[columnStateKey(column.key)]"
										:set-draft="(value) => setCardDraft(column, value)"
										:submit="() => submitCard(column)"
										:cancel="() => closeCardComposer(column)"
										:creating="Boolean(cardCreating[columnStateKey(column.key)])"
									>
										<form class="grid gap-2" @submit.prevent="submitCard(column)">
											<label class="grid gap-1.5">
												<span class="sr-only">Card title</span>
												<input
													v-model="cardDrafts[columnStateKey(column.key)]"
													type="text"
													class="skin-input min-h-20 resize-none rounded-lg px-3 py-2 text-sm"
													placeholder="Card title"
													autofocus
													:disabled="Boolean(cardCreating[columnStateKey(column.key)])"
													@keydown.escape.prevent="closeCardComposer(column)"
												/>
											</label>
											<div class="flex items-center gap-2">
												<button type="submit" class="skin-action inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50" :disabled="!String(cardDrafts[columnStateKey(column.key)] || '').trim() || Boolean(cardCreating[columnStateKey(column.key)])">
													{{ cardCreating[columnStateKey(column.key)] ? 'Adding…' : 'Add card' }}
												</button>
												<button type="button" class="inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold text-muted-fg transition hover:bg-secondary hover:text-canvas-fg" :disabled="Boolean(cardCreating[columnStateKey(column.key)])" @click="closeCardComposer(column)">
													Cancel
												</button>
											</div>
										</form>
									</slot>
								</template>
								<button
									v-else
									type="button"
									class="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs font-semibold text-muted-fg transition hover:bg-canvas hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40"
									:disabled="disabled || column.disabled || (Number.isFinite(column.limit) && column.cards.length >= column.limit)"
									@click="openCardComposer(column)"
								>
									<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
									{{ addCardLabel }}
								</button>
							</template>
						</footer>
					</section>
				</template>

				<div
					aria-hidden="true"
					class="mx-1 w-2 shrink-0 rounded-full transition-colors"
					:class="isColumnDropTarget(columnRecords.length) ? 'bg-primary' : 'bg-transparent'"
					@dragenter="onColumnDragEnter(columnRecords.length, $event)"
					@dragover="onColumnDragOver"
					@drop="onColumnDrop(columnRecords.length, $event)"
				></div>

				<div v-if="allowAddColumns" class="shrink-0" :style="resolvedColumnStyle">
					<template v-if="columnComposerOpen">
						<slot name="column-composer" :draft="columnDraft" :set-draft="setColumnDraft" :submit="submitColumn" :cancel="closeColumnComposer" :creating="columnCreating">
							<form class="grid gap-2 rounded-xl border border-border bg-secondary/70 p-3 shadow-sm" @submit.prevent="submitColumn">
								<label class="grid gap-1.5">
									<span class="text-xs font-semibold text-muted-fg">Column name</span>
									<input v-model="columnDraft" type="text" class="skin-input h-10 rounded-lg" placeholder="For example: Review" autofocus :disabled="columnCreating" @keydown.escape.prevent="closeColumnComposer" />
								</label>
								<div class="flex items-center gap-2">
									<button type="submit" class="skin-action inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50" :disabled="!columnDraft.trim() || columnCreating">
										{{ columnCreating ? 'Adding…' : 'Add column' }}
									</button>
									<button type="button" class="inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold text-muted-fg transition hover:bg-canvas hover:text-canvas-fg" :disabled="columnCreating" @click="closeColumnComposer">Cancel</button>
								</div>
							</form>
						</slot>
					</template>
					<button
						v-else
						type="button"
						class="flex h-12 w-full items-center gap-2 rounded-xl border border-border bg-secondary/70 px-4 text-left text-sm font-semibold text-muted-fg shadow-sm transition hover:bg-canvas hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40"
						:disabled="disabled"
						@click="columnComposerOpen = true"
					>
						<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
						{{ addColumnLabel }}
					</button>
				</div>
			</div>
		</div>

		<div v-if="loading" class="pointer-events-none absolute inset-0 grid place-items-center bg-canvas/55 backdrop-blur-[1px]" aria-live="polite">
			<span class="inline-flex items-center gap-2 rounded-full border border-border bg-canvas px-3 py-2 text-xs font-semibold text-muted-fg shadow-sm">
				<svg class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" stroke-opacity=".25" /><path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
				Loading {{ resourceLabel }}…
			</span>
		</div>
	</section>
</template>
