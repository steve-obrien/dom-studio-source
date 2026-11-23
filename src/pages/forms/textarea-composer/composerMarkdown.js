import MarkdownIt from 'markdown-it';
import { TaskItem } from '@tiptap/extension-list';
import { InputRule, wrappingInputRule } from '@tiptap/vue-3';

const markdown = new MarkdownIt({ html: false });
const standaloneTask = /^( {0,3})(?:([-+*])[\t ]+)?\[([ xX]?)\](?=[\t ]|$)/;
const taskInput = /^\[([ xX]?)\][\t ]$/;

/**
 * Normalizes shorthand task lines before loading or pasting Markdown.
 * Code blocks retain their literal examples.
 *
 * @param {string} text Prompt or clipboard text.
 * @returns {string} Markdown with standard task markers.
 */
export function normalizeComposerMarkdown(text) {
	const lines = text.split(/\r\n?|\n/);
	if (!lines.some((line) => standaloneTask.test(line))) return text;
	const codeLines = new Set();
	for (const token of markdown.parse(text, {})) {
		if (token.type !== 'fence' && token.type !== 'code_block') continue;
		for (let line = token.map[0]; line < token.map[1]; line++) codeLines.add(line);
	}
	return lines.map((line, index) => {
		if (codeLines.has(index)) return line;
		const match = standaloneTask.exec(line);
		if (!match) return line;
		const [, indent, bullet = '-', checked] = match;
		return `${indent}${bullet} [${checked.toLowerCase() || ' '}]${line.slice(match[0].length) || ' '}`;
	}).join('\n');
}

/**
 * Turns the current top-level bullet into a task when a checkbox marker follows
 * the bullet shortcut. Other list items stay in their existing lists.
 *
 * @param {object} context Tiptap input rule context.
 * @returns {null|undefined} Null when the input does not start an eligible bullet.
 */
function convertBulletToTask({ state, range, match, chain, can }) {
	const { $from } = state.selection;
	if ($from.depth !== 3 || $from.node(1).type.name !== 'bulletList' || $from.index(2) !== 0 || !can().liftListItem('listItem')) return null;
	chain()
		.deleteRange(range)
		.liftListItem('listItem')
		.toggleTaskList()
		.updateAttributes('taskItem', { checked: match[1].toLowerCase() === 'x' })
		.run();
}

export const ComposerTaskItem = TaskItem.extend({
	/** Creates tasks from bracket shortcuts in paragraphs and after a bullet marker. */
	addInputRules() {
		return [
			new InputRule({ find: taskInput, handler: convertBulletToTask }),
			wrappingInputRule({
				find: taskInput,
				type: this.type,
				getAttributes: (match) => ({ checked: match[1].toLowerCase() === 'x' }),
			}),
		];
	},
}).configure({ nested: true });
