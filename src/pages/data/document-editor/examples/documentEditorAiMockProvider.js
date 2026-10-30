/**
 * Simulates an application-owned AI editing endpoint.
 *
 * Replace this function with a server request while keeping the selection,
 * extension, and review UI unchanged.
 *
 * @param {{ action?: string, text?: string }} request AI edit request.
 * @returns {Promise<{ proposed: string }>} Proposed paragraph replacement.
 */
export async function requestDocumentEditorAiEdit(request = {}) {
	await wait(720);
	const text = normalizeText(request.text);
	const action = String(request.action || 'improve');
	return {
		proposed: createProposal(text, action),
	};
}

/**
 * Creates a deterministic proposal for the selected paragraph.
 *
 * @param {string} text Selected paragraph.
 * @param {string} action Requested AI action.
 * @returns {string} Proposed replacement.
 */
function createProposal(text, action) {
	if (!text) return '';
	if (action === 'expand') {
		return `${text} Keeping the evidence and reasoning together also gives reviewers enough context to challenge the conclusion and move the work forward with confidence.`;
	}
	if (action === 'simplify') return simplifyText(text);
	return improveText(text);
}

/**
 * Reduces a paragraph to its clearest leading idea.
 *
 * @param {string} text Source paragraph.
 * @returns {string} Simplified paragraph.
 */
function simplifyText(text) {
	if (/Research currently arrives/i.test(text)) {
		return 'Research comes from many sources, but its context is often scattered when teams need to make a decision.';
	}
	const firstSentence = text.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
	if (firstSentence && firstSentence.length >= 48) return firstSentence;
	const words = text.split(' ');
	if (words.length <= 22) return text;
	return `${words.slice(0, 22).join(' ').replace(/[,:;\s]+$/, '')}.`;
}

/**
 * Produces a clearer, more direct rewrite for the demo content.
 *
 * @param {string} text Source paragraph.
 * @returns {string} Improved paragraph.
 */
function improveText(text) {
	if (/Research currently arrives/i.test(text)) {
		return 'Research arrives through interviews, support conversations, analytics, and product reviews, but its context is often fragmented when teams need it most.';
	}
	const improved = text
		.replace(/\bcurrently\b/gi, 'now')
		.replace(/\bdeliberately\b/gi, '')
		.replace(/\bin order to\b/gi, 'to')
		.replace(/\bthe percentage of\b/gi, 'the share of')
		.replace(/\s+/g, ' ')
		.trim();
	if (improved !== text) return improved;
	return `${text.replace(/[.!?]+$/, '')}, with clearer ownership, context, and next steps.`;
}

/**
 * Normalizes selected editor text for a provider request.
 *
 * @param {unknown} value Selected text.
 * @returns {string} Normalized paragraph text.
 */
function normalizeText(value) {
	return String(value || '').replace(/\s+/g, ' ').trim();
}

/**
 * Waits long enough for the demo's pending state to remain visible.
 *
 * @param {number} milliseconds Delay duration.
 * @returns {Promise<void>} Resolves after the delay.
 */
function wait(milliseconds) {
	return new Promise((resolve) => {
		setTimeout(resolve, milliseconds);
	});
}
