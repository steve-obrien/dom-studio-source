/**
 * Creates an isolated Tiptap extension and controller for one pending AI edit.
 *
 * The extension owns only the mapped editor decoration. Application code keeps
 * the suggestion text, provider request, and review decision outside Tiptap.
 *
 * @param {Record<string, unknown>} modules Tiptap and ProseMirror runtime modules.
 * @returns {{ extension: unknown, highlight: Function, clear: Function, getRange: Function }} Extension and controller methods.
 */
export function createDocumentEditorAiSuggestionExtension(modules) {
	const pluginKey = new modules.PluginKey('documentEditorAiSuggestion');

	/**
	 * Creates empty state for the decoration plugin.
	 *
	 * @returns {{ decorations: unknown, suggestionId: string|null }} Empty plugin state.
	 */
	function createEmptyState() {
		return {
			decorations: modules.DecorationSet.empty,
			suggestionId: null,
		};
	}

	/**
	 * Creates a decoration for the requested document range.
	 *
	 * @param {Record<string, unknown>} document Current ProseMirror document.
	 * @param {{ id?: string, from?: number, to?: number }} suggestion Suggestion range.
	 * @returns {{ decorations: unknown, suggestionId: string|null }} Next plugin state.
	 */
	function createHighlightedState(document, suggestion = {}) {
		const from = Number(suggestion.from);
		const to = Number(suggestion.to);
		const maximum = Number(document?.content?.size || 0);
		if (!suggestion.id || !Number.isFinite(from) || !Number.isFinite(to) || from < 0 || to <= from || to > maximum) {
			return createEmptyState();
		}
		const decoration = modules.Decoration.inline(
			from,
			to,
			{
				class: 'rounded-sm bg-warning/20 ring-1 ring-inset ring-warning/50',
				'data-ai-suggestion': suggestion.id,
			},
			{ suggestionId: suggestion.id },
		);
		return {
			decorations: modules.DecorationSet.create(document, [decoration]),
			suggestionId: suggestion.id,
		};
	}

	const extension = modules.Extension.create({
		name: 'documentEditorAiSuggestion',

		/**
		 * Adds the range-decoration plugin used by the AI review workflow.
		 *
		 * @returns {Array<unknown>} ProseMirror plugins.
		 */
		addProseMirrorPlugins() {
			return [new modules.Plugin({
				key: pluginKey,
				state: {
					/**
					 * Initializes the plugin without a pending suggestion.
					 *
					 * @returns {{ decorations: unknown, suggestionId: string|null }} Initial plugin state.
					 */
					init() {
						return createEmptyState();
					},

					/**
					 * Maps an existing highlight through edits or handles controller metadata.
					 *
					 * @param {Record<string, unknown>} transaction Applied transaction.
					 * @param {{ decorations: unknown, suggestionId: string|null }} pluginState Previous plugin state.
					 * @returns {{ decorations: unknown, suggestionId: string|null }} Next plugin state.
					 */
					apply(transaction, pluginState) {
						const action = transaction.getMeta(pluginKey);
						if (action?.type === 'clear') return createEmptyState();
						if (action?.type === 'highlight') return createHighlightedState(transaction.doc, action.suggestion);
						return {
							...pluginState,
							decorations: pluginState.decorations.map(transaction.mapping, transaction.doc),
						};
					},
				},
				props: {
					/**
					 * Exposes the current AI highlight to ProseMirror's view.
					 *
					 * @param {Record<string, unknown>} state Current editor state.
					 * @returns {unknown} Decoration set for the current document.
					 */
					decorations(state) {
						return pluginKey.getState(state)?.decorations || modules.DecorationSet.empty;
					},
				},
			})];
		},
	});

	/**
	 * Highlights a suggestion range without adding a step to undo history.
	 *
	 * @param {Record<string, unknown>} editor Tiptap editor instance.
	 * @param {{ id: string, from: number, to: number }} suggestion Pending suggestion.
	 * @returns {void}
	 */
	function highlight(editor, suggestion) {
		if (!editor?.view) return;
		editor.view.dispatch(
			editor.state.tr
				.setMeta(pluginKey, { type: 'highlight', suggestion })
				.setMeta('addToHistory', false),
		);
	}

	/**
	 * Clears the pending highlight without adding a step to undo history.
	 *
	 * @param {Record<string, unknown>} editor Tiptap editor instance.
	 * @returns {void}
	 */
	function clear(editor) {
		if (!editor?.view) return;
		editor.view.dispatch(
			editor.state.tr
				.setMeta(pluginKey, { type: 'clear' })
				.setMeta('addToHistory', false),
		);
	}

	/**
	 * Reads the suggestion's current range after ProseMirror has mapped edits.
	 *
	 * @param {Record<string, unknown>} editor Tiptap editor instance.
	 * @returns {{ from: number, to: number }|null} Current highlighted range.
	 */
	function getRange(editor) {
		const pluginState = editor?.state ? pluginKey.getState(editor.state) : null;
		const decoration = pluginState?.decorations?.find?.()[0];
		if (!decoration) return null;
		return {
			from: decoration.from,
			to: decoration.to,
		};
	}

	return {
		extension,
		highlight,
		clear,
		getRange,
	};
}
