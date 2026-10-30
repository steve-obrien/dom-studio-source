/**
 * Split literal text into matched and unmatched segments for escaped Vue text
 * bindings. No HTML construction or regular-expression interpolation is involved.
 *
 * @param {string} text Original label, including any literal markup characters.
 * @param {string} query Case-insensitive substring to highlight.
 * @returns {Array<{ text: string, matched: boolean }>} Lossless text segments.
 */
export function highlightMatches(text, query) {
	const label = String(text ?? '');
	const needle = String(query ?? '').trim().toLowerCase();
	if (!needle) return [{ text: label, matched: false }];
	const lower = label.toLowerCase();
	const parts = [];
	let start = 0;
	let index = lower.indexOf(needle);
	while (index !== -1) {
		if (index > start) parts.push({ text: label.slice(start, index), matched: false });
		parts.push({ text: label.slice(index, index + needle.length), matched: true });
		start = index + needle.length;
		index = lower.indexOf(needle, start);
	}
	if (start < label.length) parts.push({ text: label.slice(start), matched: false });
	return parts;
}
