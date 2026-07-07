/**
 * Creates a word-level diff between an original and proposed rewrite.
 *
 * @param {string} original Original selected text.
 * @param {string} proposed Proposed replacement text.
 * @returns {Array<{ id: string, type: 'same'|'added'|'removed', value: string }>} Diff tokens for display.
 */
export function createWordDiff(original = '', proposed = '') {
	const originalTokens = splitDiffTokens(original);
	const proposedTokens = splitDiffTokens(proposed);
	const table = buildDiffTable(originalTokens, proposedTokens);
	const tokens = [];
	let i = originalTokens.length;
	let j = proposedTokens.length;

	while (i > 0 || j > 0) {
		if (i > 0 && j > 0 && originalTokens[i - 1] === proposedTokens[j - 1]) {
			tokens.unshift(createDiffToken('same', originalTokens[i - 1], i, j));
			i -= 1;
			j -= 1;
			continue;
		}
		if (j > 0 && (i === 0 || table[i][j - 1] >= table[i - 1][j])) {
			tokens.unshift(createDiffToken('added', proposedTokens[j - 1], i, j));
			j -= 1;
			continue;
		}
		if (i > 0) {
			tokens.unshift(createDiffToken('removed', originalTokens[i - 1], i, j));
			i -= 1;
		}
	}

	return mergeAdjacentDiffTokens(tokens);
}

/**
 * Splits text into whitespace-aware diff tokens.
 *
 * @param {string} value Text to tokenize.
 * @returns {Array<string>} Tokens including whitespace groups.
 */
function splitDiffTokens(value) {
	return String(value || '').match(/\s+|[^\s]+/g) || [];
}

/**
 * Builds the longest-common-subsequence table used by the diff backtracker.
 *
 * @param {Array<string>} originalTokens Original tokens.
 * @param {Array<string>} proposedTokens Proposed tokens.
 * @returns {Array<Array<number>>} LCS length table.
 */
function buildDiffTable(originalTokens, proposedTokens) {
	const table = Array.from({ length: originalTokens.length + 1 }, createDiffTableRow(proposedTokens.length + 1));
	for (let i = 1; i <= originalTokens.length; i += 1) {
		for (let j = 1; j <= proposedTokens.length; j += 1) {
			if (originalTokens[i - 1] === proposedTokens[j - 1]) {
				table[i][j] = table[i - 1][j - 1] + 1;
			} else {
				table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
			}
		}
	}
	return table;
}

/**
 * Creates a row factory for an LCS table.
 *
 * @param {number} length Row length.
 * @returns {Function} Factory that returns a zero-filled row.
 */
function createDiffTableRow(length) {
	/**
	 * Creates a zero-filled LCS table row.
	 *
	 * @returns {Array<number>} Table row.
	 */
	return function createRow() {
		return Array.from({ length }, createZero);
	};
}

/**
 * Returns the initial numeric value for an LCS table cell.
 *
 * @returns {number} Zero.
 */
function createZero() {
	return 0;
}

/**
 * Creates a display token with a stable id.
 *
 * @param {'same'|'added'|'removed'} type Token type.
 * @param {string} value Token text.
 * @param {number} originalIndex Original backtrack index.
 * @param {number} proposedIndex Proposed backtrack index.
 * @returns {{ id: string, type: 'same'|'added'|'removed', value: string }} Display token.
 */
function createDiffToken(type, value, originalIndex, proposedIndex) {
	return {
		id: `${type}-${originalIndex}-${proposedIndex}-${String(value).length}`,
		type,
		value,
	};
}

/**
 * Merges neighbouring tokens of the same type to keep the rendered diff compact.
 *
 * @param {Array<{ id: string, type: 'same'|'added'|'removed', value: string }>} tokens Diff tokens.
 * @returns {Array<{ id: string, type: 'same'|'added'|'removed', value: string }>} Merged diff tokens.
 */
function mergeAdjacentDiffTokens(tokens) {
	const merged = [];
	for (const token of tokens) {
		const previous = merged[merged.length - 1];
		if (previous && previous.type === token.type) {
			previous.value += token.value;
			previous.id = `${previous.id}-${token.id}`;
			continue;
		}
		merged.push({ ...token });
	}
	return merged;
}
