/**
 * Creates a word-level diff between original and proposed text.
 *
 * @param {string} original Original text.
 * @param {string} proposed Proposed replacement text.
 * @returns {Array<{ id: string, type: 'same'|'added'|'removed', value: string }>} Ordered inline diff segments.
 */
export function createInlineDiff(original = '', proposed = '') {
	return createSequenceDiff(tokenizeWords(original), tokenizeWords(proposed));
}

/**
 * Creates unified line rows with word-level emphasis inside paired replacements.
 *
 * @param {string} original Original text.
 * @param {string} proposed Proposed replacement text.
 * @returns {Array<Record<string, unknown>>} Unified diff rows.
 */
export function createUnifiedDiff(original = '', proposed = '') {
	const operations = createSequenceDiff(splitLines(original), splitLines(proposed), false);
	const rows = createLineRows(operations);
	return addReplacementSegments(rows);
}

/**
 * Creates aligned side-by-side rows from a unified line diff.
 *
 * @param {string} original Original text.
 * @param {string} proposed Proposed replacement text.
 * @returns {Array<Record<string, unknown>>} Split diff rows.
 */
export function createSplitDiff(original = '', proposed = '') {
	const unifiedRows = createUnifiedDiff(original, proposed);
	const rows = [];
	let index = 0;

	while (index < unifiedRows.length) {
		const row = unifiedRows[index];
		if (row.type === 'same') {
			rows.push(createSplitRow(row, row));
			index += 1;
			continue;
		}

		const changeRows = [];
		while (index < unifiedRows.length && unifiedRows[index].type !== 'same') {
			changeRows.push(unifiedRows[index]);
			index += 1;
		}

		const removedRows = changeRows.filter(isRemovedRow);
		const addedRows = changeRows.filter(isAddedRow);
		const pairCount = Math.max(removedRows.length, addedRows.length);
		for (let pairIndex = 0; pairIndex < pairCount; pairIndex += 1) {
			rows.push(createSplitRow(removedRows[pairIndex], addedRows[pairIndex]));
		}
	}

	return rows;
}

/**
 * Tokenizes prose while preserving whitespace and punctuation for faithful rendering.
 *
 * @param {string} value Text to tokenize.
 * @returns {Array<string>} Word, punctuation, and whitespace tokens.
 */
function tokenizeWords(value) {
	return String(value ?? '').match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]+/gu) || [];
}

/**
 * Splits text into normalized lines while preserving blank and trailing lines.
 *
 * @param {string} value Text to split.
 * @returns {Array<string>} Normalized lines.
 */
function splitLines(value) {
	return String(value ?? '').replace(/\r\n?/g, '\n').split('\n');
}

/**
 * Creates a longest-common-subsequence diff for two token sequences.
 *
 * @param {Array<string>} originalTokens Original sequence.
 * @param {Array<string>} proposedTokens Proposed sequence.
 * @param {boolean} mergeAdjacent Whether neighbouring operations should be merged.
 * @returns {Array<{ id: string, type: 'same'|'added'|'removed', value: string }>} Ordered diff operations.
 */
function createSequenceDiff(originalTokens, proposedTokens, mergeAdjacent = true) {
	const table = buildDiffTable(originalTokens, proposedTokens);
	const operations = [];
	let originalIndex = originalTokens.length;
	let proposedIndex = proposedTokens.length;

	while (originalIndex > 0 || proposedIndex > 0) {
		if (
			originalIndex > 0
			&& proposedIndex > 0
			&& originalTokens[originalIndex - 1] === proposedTokens[proposedIndex - 1]
		) {
			operations.unshift(createDiffOperation('same', originalTokens[originalIndex - 1], originalIndex, proposedIndex));
			originalIndex -= 1;
			proposedIndex -= 1;
			continue;
		}

		if (
			proposedIndex > 0
			&& (originalIndex === 0 || table[originalIndex][proposedIndex - 1] >= table[originalIndex - 1][proposedIndex])
		) {
			operations.unshift(createDiffOperation('added', proposedTokens[proposedIndex - 1], originalIndex, proposedIndex));
			proposedIndex -= 1;
			continue;
		}

		operations.unshift(createDiffOperation('removed', originalTokens[originalIndex - 1], originalIndex, proposedIndex));
		originalIndex -= 1;
	}

	return mergeAdjacent ? mergeAdjacentOperations(operations) : operations;
}

/**
 * Builds the longest-common-subsequence table used by the diff backtracker.
 *
 * @param {Array<string>} originalTokens Original sequence.
 * @param {Array<string>} proposedTokens Proposed sequence.
 * @returns {Array<Uint32Array>} LCS length table.
 */
function buildDiffTable(originalTokens, proposedTokens) {
	const table = [];
	for (let rowIndex = 0; rowIndex <= originalTokens.length; rowIndex += 1) {
		table.push(new Uint32Array(proposedTokens.length + 1));
	}

	for (let originalIndex = 1; originalIndex <= originalTokens.length; originalIndex += 1) {
		for (let proposedIndex = 1; proposedIndex <= proposedTokens.length; proposedIndex += 1) {
			if (originalTokens[originalIndex - 1] === proposedTokens[proposedIndex - 1]) {
				table[originalIndex][proposedIndex] = table[originalIndex - 1][proposedIndex - 1] + 1;
			} else {
				table[originalIndex][proposedIndex] = Math.max(
					table[originalIndex - 1][proposedIndex],
					table[originalIndex][proposedIndex - 1],
				);
			}
		}
	}

	return table;
}

/**
 * Creates one diff operation with a deterministic rendering key.
 *
 * @param {'same'|'added'|'removed'} type Operation type.
 * @param {string} value Operation text.
 * @param {number} originalIndex Original backtrack index.
 * @param {number} proposedIndex Proposed backtrack index.
 * @returns {{ id: string, type: 'same'|'added'|'removed', value: string }} Diff operation.
 */
function createDiffOperation(type, value, originalIndex, proposedIndex) {
	return {
		id: `${type}-${originalIndex}-${proposedIndex}-${String(value).length}`,
		type,
		value,
	};
}

/**
 * Merges neighbouring operations of the same type for compact inline rendering.
 *
 * @param {Array<{ id: string, type: 'same'|'added'|'removed', value: string }>} operations Diff operations.
 * @returns {Array<{ id: string, type: 'same'|'added'|'removed', value: string }>} Merged operations.
 */
function mergeAdjacentOperations(operations) {
	const merged = [];
	for (const operation of operations) {
		const previous = merged[merged.length - 1];
		if (previous && previous.type === operation.type) {
			previous.value += operation.value;
			previous.id = `${previous.id}-${operation.id}`;
			continue;
		}
		merged.push({ ...operation });
	}
	return merged;
}

/**
 * Converts line diff operations into numbered unified rows.
 *
 * @param {Array<Record<string, unknown>>} operations All line operations.
 * @returns {Array<Record<string, unknown>>} Numbered line rows.
 */
function createLineRows(operations) {
	const rows = [];
	let originalNumber = 0;
	let proposedNumber = 0;

	for (const operation of operations) {
		if (operation.type !== 'added') originalNumber += 1;
		if (operation.type !== 'removed') proposedNumber += 1;
		rows.push({
			...operation,
			originalNumber: operation.type === 'added' ? null : originalNumber,
			proposedNumber: operation.type === 'removed' ? null : proposedNumber,
			segments: [{ id: `${operation.id}-same`, type: 'same', value: operation.value }],
		});
	}

	return rows;
}

/**
 * Adds word-level segments to corresponding removed and added rows.
 *
 * @param {Array<Record<string, unknown>>} rows Unified line rows.
 * @returns {Array<Record<string, unknown>>} Rows with replacement emphasis.
 */
function addReplacementSegments(rows) {
	let index = 0;
	while (index < rows.length) {
		if (rows[index].type === 'same') {
			index += 1;
			continue;
		}

		const changeRows = [];
		while (index < rows.length && rows[index].type !== 'same') {
			changeRows.push(rows[index]);
			index += 1;
		}

		const removedRows = changeRows.filter(isRemovedRow);
		const addedRows = changeRows.filter(isAddedRow);
		const pairCount = Math.min(removedRows.length, addedRows.length);
		for (let pairIndex = 0; pairIndex < pairCount; pairIndex += 1) {
			const segments = createInlineDiff(removedRows[pairIndex].value, addedRows[pairIndex].value);
			removedRows[pairIndex].segments = segments.filter(isVisibleOnOriginalSide);
			addedRows[pairIndex].segments = segments.filter(isVisibleOnProposedSide);
		}
	}
	return rows;
}

/**
 * Checks whether a row represents removed content.
 *
 * @param {Record<string, unknown>} row Diff row.
 * @returns {boolean} Whether the row is removed.
 */
function isRemovedRow(row) {
	return row?.type === 'removed';
}

/**
 * Checks whether a row represents added content.
 *
 * @param {Record<string, unknown>} row Diff row.
 * @returns {boolean} Whether the row is added.
 */
function isAddedRow(row) {
	return row?.type === 'added';
}

/**
 * Checks whether an inline segment belongs on the original side.
 *
 * @param {Record<string, unknown>} segment Inline segment.
 * @returns {boolean} Whether the segment should be shown.
 */
function isVisibleOnOriginalSide(segment) {
	return segment.type !== 'added';
}

/**
 * Checks whether an inline segment belongs on the proposed side.
 *
 * @param {Record<string, unknown>} segment Inline segment.
 * @returns {boolean} Whether the segment should be shown.
 */
function isVisibleOnProposedSide(segment) {
	return segment.type !== 'removed';
}

/**
 * Creates one aligned split-view row.
 *
 * @param {Record<string, unknown>|undefined} original Original-side row.
 * @param {Record<string, unknown>|undefined} proposed Proposed-side row.
 * @returns {Record<string, unknown>} Split-view row.
 */
function createSplitRow(original, proposed) {
	return {
		id: `split-${original?.id || 'blank'}-${proposed?.id || 'blank'}`,
		original: original || null,
		proposed: proposed || null,
	};
}
