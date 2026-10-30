let revisionCounter = 3;

/**
 * Creates an in-memory document API for editor demos.
 *
 * @returns {Record<string, Function>} API methods for document loading, saving, and rewrite suggestions.
 */
export function createDocumentEditorMockApi() {
	const state = createInitialState();

	/**
	 * Loads a saved document.
	 *
	 * @returns {Promise<Record<string, unknown>>} Document response.
	 */
	async function loadDocument() {
		await wait(220);
		return {
			document: clone(state.document),
			meta: {
				requestedAt: new Date().toISOString(),
				action: 'load-document',
			},
		};
	}

	/**
	 * Saves a document snapshot.
	 *
	 * @param {{ content: Record<string, unknown>|string, html?: string, text?: string }} request Save request.
	 * @returns {Promise<Record<string, unknown>>} Save response.
	 */
	async function saveDocument(request = {}) {
		await wait(260);
		revisionCounter += 1;
		state.document = {
			...state.document,
			content: clone(request.content || state.document.content),
			html: String(request.html || ''),
			text: String(request.text || ''),
			revision: revisionCounter,
			updatedAt: new Date().toISOString(),
		};
		return {
			document: clone(state.document),
			meta: {
				requestedAt: new Date().toISOString(),
				action: 'save-document',
				revision: state.document.revision,
			},
		};
	}

	/**
	 * Generates a rewrite suggestion for the selected editor text.
	 *
	 * @param {{ selectedText?: string, instruction?: string }} request Rewrite request.
	 * @returns {Promise<Record<string, unknown>>} Rewrite response.
	 */
	async function rewriteSelection(request = {}) {
		await wait(680);
		const selectedText = String(request.selectedText || '').trim();
		const instruction = String(request.instruction || '').trim();
		const proposed = proposeRewrite(selectedText, instruction);
		return {
			suggestion: {
				id: `sug_ai_${Date.now()}`,
				type: 'replace',
				original: selectedText,
				proposed,
				instruction,
				author: {
					id: 'ai-editor',
					name: 'AI editor',
					color: '#2563eb',
					type: 'ai',
				},
				createdAt: new Date().toISOString(),
			},
			meta: {
				requestedAt: new Date().toISOString(),
				action: 'rewrite-selection',
			},
		};
	}

	return {
		loadDocument,
		saveDocument,
		rewriteSelection,
	};
}

/**
 * Creates initial demo API state.
 *
 * @returns {{ document: Record<string, unknown> }} Initial mock database state.
 */
function createInitialState() {
	return {
		document: {
			id: 'doc_launch_brief',
			title: 'July launch note',
			revision: revisionCounter,
			updatedAt: '2026-07-07T08:30:00.000Z',
			content: createInitialDocumentContent(),
			html: '',
			text: '',
		},
	};
}

/**
 * Creates the initial editor document in Tiptap JSON format.
 *
 * @returns {Record<string, unknown>} Tiptap document JSON.
 */
function createInitialDocumentContent() {
	return {
		type: 'doc',
		content: [
			{
				type: 'heading',
				attrs: { level: 1 },
				content: [{ type: 'text', text: 'July product launch note' }],
			},
			{
				type: 'paragraph',
				content: [
					{
						type: 'text',
						text: 'The July release introduces a faster way for teams to draft pages, review AI suggestions, and keep every edit connected to structured document data.',
					},
				],
			},
			{
				type: 'heading',
				attrs: { level: 2 },
				content: [{ type: 'text', text: 'Audience' }],
			},
			{
				type: 'paragraph',
				content: [
					{
						type: 'text',
						text: 'This note is for product leads, content teams, and developers who need an editor that feels familiar while still giving the application a reliable content model.',
					},
				],
			},
			{
				type: 'heading',
				attrs: { level: 2 },
				content: [{ type: 'text', text: 'Draft message' }],
			},
			{
				type: 'paragraph',
				content: [
					{
						type: 'text',
						text: 'The new editing workspace should make everyday writing calm and direct. Authors can shape the document by hand, bring in the AI for a specific passage, and review the proposed change before it becomes part of the saved draft.',
					},
				],
			},
			{
				type: 'bulletList',
				content: [
					createListItem('Position the editor as the place where human writing, AI suggestions, and media choices meet.'),
					createListItem('Keep the saved draft as structured JSON so public rendering can be handled by a separate output pipeline.'),
					createListItem('Use the existing media browser for product images, screenshots, and campaign assets.'),
				],
			},
			{
				type: 'blockquote',
				content: [
					{
						type: 'paragraph',
						content: [
							{
								type: 'text',
								text: 'Open question: should accepted AI suggestions become normal text immediately, or should the saved revision keep an audit trail for later review?',
							},
						],
					},
				],
			},
			{
				type: 'heading',
				attrs: { level: 2 },
				content: [{ type: 'text', text: 'Next edit' }],
			},
			{
				type: 'paragraph',
				content: [
					{
						type: 'text',
						text: 'Tighten the draft message, add a product screenshot, and make the audience section less formal before the next review.',
					},
				],
			},
		],
	};
}

/**
 * Creates a Tiptap list item.
 *
 * @param {string} text List item text.
 * @returns {Record<string, unknown>} Tiptap list item node.
 */
function createListItem(text) {
	return {
		type: 'listItem',
		content: [
			{
				type: 'paragraph',
				content: [{ type: 'text', text }],
			},
		],
	};
}

/**
 * Builds a deterministic rewrite from a selected phrase and instruction.
 *
 * @param {string} selectedText Selected editor text.
 * @param {string} instruction Rewrite instruction.
 * @returns {string} Proposed rewrite.
 */
function proposeRewrite(selectedText, instruction) {
	if (!selectedText) return 'Select copy in the editor before asking the AI for a rewrite.';
	const cleaned = selectedText.replace(/\s+/g, ' ').trim();
	if (/short|concise|tight/i.test(instruction)) {
		return tightenCopy(cleaned);
	}
	if (/formal|polish|professional/i.test(instruction)) {
		return `This editor gives teams a controlled writing surface where human edits, AI suggestions, and publishing requirements can move through one reviewable document workflow.`;
	}
	return `The editor should let people write naturally, invite AI into a selected passage, and review the proposed change before it alters the saved document.`;
}

/**
 * Produces a shorter version of selected copy.
 *
 * @param {string} value Selected text.
 * @returns {string} Concise rewrite.
 */
function tightenCopy(value) {
	if (value.length < 120) return value;
	return `${value.slice(0, 112).replace(/[,\s]+$/, '')}.`;
}

/**
 * Waits for a small delay to make loading and pending states visible.
 *
 * @param {number} ms Delay in milliseconds.
 * @returns {Promise<void>} Resolves after the delay.
 */
function wait(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/**
 * Deep-clones JSON-compatible data.
 *
 * @param {unknown} value Value to clone.
 * @returns {unknown} Cloned value.
 */
function clone(value) {
	return JSON.parse(JSON.stringify(value));
}
