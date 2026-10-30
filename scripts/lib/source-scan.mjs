/**
 * Finds the bracket that closes the one at `openIndex`, skipping strings,
 * template literals and comments.
 *
 * @param {string} source - Source text.
 * @param {number} openIndex - Index of the opening bracket.
 * @param {string} openChar - Opening bracket character.
 * @param {string} closeChar - Closing bracket character.
 * @returns {number} Index of the matching closing bracket, or -1.
 */
export function findMatching(source, openIndex, openChar, closeChar) {
	let depth = 0;
	let quote = '';
	let escaped = false;
	let comment = '';

	for (let index = openIndex; index < source.length; index += 1) {
		const char = source[index];
		const next = source[index + 1];

		if (comment === 'line') {
			if (char === '\n') comment = '';
			continue;
		}
		if (comment === 'block') {
			if (char === '*' && next === '/') {
				comment = '';
				index += 1;
			}
			continue;
		}
		if (quote) {
			if (escaped) escaped = false;
			else if (char === '\\') escaped = true;
			else if (char === quote) quote = '';
			continue;
		}
		if (char === '/' && next === '/') {
			comment = 'line';
			index += 1;
			continue;
		}
		if (char === '/' && next === '*') {
			comment = 'block';
			index += 1;
			continue;
		}
		if (char === '\'' || char === '"' || char === '`') {
			quote = char;
			continue;
		}
		if (char === openChar) depth += 1;
		if (char === closeChar) {
			depth -= 1;
			if (depth === 0) return index;
		}
	}

	return -1;
}
