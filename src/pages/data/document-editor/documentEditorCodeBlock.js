import {
	CODE_LANGUAGE_OPTIONS,
	codeLanguageOptionValue,
	highlight,
} from '../../lib/vue/codeHighlighter.js';

const DEFAULT_CODE_LANGUAGE = 'txt';
const HIGHLIGHT_DELAY = 80;

export const documentEditorCodeLanguages = CODE_LANGUAGE_OPTIONS;

/**
 * Creates the editable code-block node with a persistent DOM Studio language value.
 *
 * @param {unknown} CodeBlock Tiptap code-block extension.
 * @param {Function} mergeAttributes Tiptap HTML attribute merger.
 * @returns {unknown} Configured code-block extension.
 */
export function createDocumentEditorCodeBlockExtension(CodeBlock, mergeAttributes) {
	return CodeBlock.extend({
		/**
		 * Renders a language-aware pre/code structure for saved editor HTML.
		 *
		 * @param {Record<string, unknown>} context Tiptap render context.
		 * @returns {Array<unknown>} ProseMirror DOM output specification.
		 */
		renderHTML({ node, HTMLAttributes }) {
			const language = codeLanguageOptionValue(node.attrs.language || DEFAULT_CODE_LANGUAGE);
			const classPrefix = this.options.languageClassPrefix || 'language-';
			return [
				'pre',
				mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
					class: 'dom-code-block',
					'data-language': language,
				}),
				[
					'code',
					{ class: `${classPrefix}${language}` },
					0,
				],
			];
		},
	}).configure({
		defaultLanguage: DEFAULT_CODE_LANGUAGE,
	});
}

/**
 * Creates a ProseMirror extension that highlights editable code with shared Shiki output.
 *
 * @param {Record<string, unknown>} modules Tiptap and ProseMirror runtime modules.
 * @returns {unknown} Tiptap highlighting extension.
 */
export function createDocumentEditorCodeHighlightExtension(modules) {
	const pluginKey = new modules.PluginKey('domDocumentEditorCodeHighlight');
	return modules.Extension.create({
		name: 'domDocumentEditorCodeHighlight',

		/**
		 * Installs the asynchronous syntax-decoration plugin.
		 *
		 * @returns {Array<unknown>} ProseMirror plugins.
		 */
		addProseMirrorPlugins() {
			return [createCodeHighlightPlugin(modules, pluginKey)];
		},
	});
}

/**
 * Creates the stateful ProseMirror plugin that schedules syntax decoration refreshes.
 *
 * @param {Record<string, unknown>} modules Tiptap and ProseMirror runtime modules.
 * @param {unknown} pluginKey ProseMirror plugin key.
 * @returns {unknown} ProseMirror plugin.
 */
function createCodeHighlightPlugin(modules, pluginKey) {
	return new modules.Plugin({
		key: pluginKey,
		state: {
			/**
			 * Initializes the editor with no syntax decorations.
			 *
			 * @returns {unknown} Empty ProseMirror decoration set.
			 */
			init() {
				return modules.DecorationSet.empty;
			},

			/**
			 * Maps existing decorations or applies a completed asynchronous refresh.
			 *
			 * @param {unknown} transaction ProseMirror transaction.
			 * @param {unknown} decorations Current decoration set.
			 * @returns {unknown} Next ProseMirror decoration set.
			 */
			apply(transaction, decorations) {
				const highlighted = transaction.getMeta(pluginKey);
				if (highlighted !== undefined) return highlighted;
				return decorations.map(transaction.mapping, transaction.doc);
			},
		},
		props: {
			/**
			 * Returns the current syntax decorations for the editor view.
			 *
			 * @param {unknown} state ProseMirror editor state.
			 * @returns {unknown} Current ProseMirror decoration set.
			 */
			decorations(state) {
				return pluginKey.getState(state);
			},
		},
		/**
		 * Creates the browser view lifecycle that debounces asynchronous highlighting.
		 *
		 * @param {unknown} editorView ProseMirror editor view.
		 * @returns {Record<string, Function>} ProseMirror plugin view handlers.
		 */
		view(editorView) {
			let destroyed = false;
			let lastSignature = '';
			let requestId = 0;
			let timer = null;

			/**
			 * Schedules a highlight refresh when code content or languages change.
			 *
			 * @param {unknown} view Current ProseMirror editor view.
			 * @param {boolean} immediate Skip the typing debounce for initial rendering.
			 * @returns {void}
			 */
			function scheduleHighlight(view, immediate = false) {
				const signature = codeBlockSignature(view.state.doc);
				if (signature === lastSignature) return;
				lastSignature = signature;
				requestId += 1;
				const scheduledRequest = requestId;
				if (timer) window.clearTimeout(timer);
				timer = window.setTimeout(async () => {
					const sourceDocument = view.state.doc;
					const decorations = await buildCodeDecorations(sourceDocument, modules);
					if (destroyed || scheduledRequest !== requestId) return;
					if (codeBlockSignature(view.state.doc) !== signature) return;
					view.dispatch(view.state.tr.setMeta(pluginKey, decorations));
				}, immediate ? 0 : HIGHLIGHT_DELAY);
			}

			scheduleHighlight(editorView, true);
			return {
				/**
				 * Refreshes highlighting after document transactions that affect code blocks.
				 *
				 * @param {unknown} view Updated ProseMirror editor view.
				 * @param {unknown} previousState Previous ProseMirror editor state.
				 * @returns {void}
				 */
				update(view, previousState) {
					if (view.state.doc !== previousState.doc) scheduleHighlight(view);
				},

				/**
				 * Cancels pending syntax work when the editor view is destroyed.
				 *
				 * @returns {void}
				 */
				destroy() {
					destroyed = true;
					requestId += 1;
					if (timer) window.clearTimeout(timer);
				},
			};
		},
	});
}

/**
 * Builds a stable signature for the code blocks that affect syntax decorations.
 *
 * @param {unknown} documentNode ProseMirror document node.
 * @returns {string} Serialized code-block signature.
 */
function codeBlockSignature(documentNode) {
	return JSON.stringify(collectCodeBlocks(documentNode).map((block) => [block.position, block.language, block.code]));
}

/**
 * Collects language-aware code blocks and their ProseMirror positions.
 *
 * @param {unknown} documentNode ProseMirror document node.
 * @returns {Array<{ position: number, code: string, language: string }>} Code-block records.
 */
function collectCodeBlocks(documentNode) {
	const blocks = [];
	documentNode.descendants((node, position) => {
		if (node.type.name !== 'codeBlock') return;
		blocks.push({
			position,
			code: node.textContent,
			language: codeLanguageOptionValue(node.attrs.language || DEFAULT_CODE_LANGUAGE),
		});
	});
	return blocks;
}

/**
 * Highlights every code block and combines the results into one decoration set.
 *
 * @param {unknown} documentNode ProseMirror document node.
 * @param {Record<string, unknown>} modules Tiptap and ProseMirror runtime modules.
 * @returns {Promise<unknown>} ProseMirror decoration set.
 */
async function buildCodeDecorations(documentNode, modules) {
	const blocks = collectCodeBlocks(documentNode);
	const results = await Promise.all(blocks.map((block) => buildBlockDecorations(block, modules.Decoration)));
	return modules.DecorationSet.create(documentNode, results.flat());
}

/**
 * Converts one Shiki-rendered code block into editable inline decorations.
 *
 * @param {{ position: number, code: string, language: string }} block Code-block record.
 * @param {unknown} Decoration ProseMirror decoration factory.
 * @returns {Promise<Array<unknown>>} Inline syntax decorations.
 */
async function buildBlockDecorations(block, Decoration) {
	const highlighted = await highlight(block.code, block.language);
	if (!highlighted) return [];
	return highlightedStyleRanges(highlighted)
		.filter((range) => range.from < range.to && range.from < block.code.length)
		.map((range) => Decoration.inline(
			block.position + 1 + range.from,
			block.position + 1 + Math.min(range.to, block.code.length),
			{
				class: 'dom-code-token',
				style: range.style,
			},
		));
}

/**
 * Extracts Shiki token styles and UTF-16 text offsets from highlighted HTML.
 *
 * @param {string} highlightedHtml Shiki HTML output.
 * @returns {Array<{ from: number, to: number, style: string }>} Styled text ranges.
 */
function highlightedStyleRanges(highlightedHtml) {
	if (typeof DOMParser === 'undefined') return [];
	const parsed = new DOMParser().parseFromString(highlightedHtml, 'text/html');
	const code = parsed.querySelector('pre.shiki code') || parsed.querySelector('code');
	if (!code) return [];
	const ranges = [];
	let offset = 0;

	/**
	 * Walks highlighted nodes while carrying inherited inline token styles.
	 *
	 * @param {Node} node Current highlighted DOM node.
	 * @param {string} inheritedStyle Nearest ancestor token style.
	 * @returns {void}
	 */
	function visit(node, inheritedStyle = '') {
		if (node.nodeType === 3) {
			const length = node.nodeValue?.length || 0;
			if (length && inheritedStyle) {
				ranges.push({
					from: offset,
					to: offset + length,
					style: inheritedStyle,
				});
			}
			offset += length;
			return;
		}
		if (node.nodeType !== 1) return;
		const style = node.getAttribute('style') || inheritedStyle;
		node.childNodes.forEach((child) => visit(child, style));
	}

	visit(code);
	return ranges;
}
