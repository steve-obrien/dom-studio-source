import { baseParse, NodeTypes } from '@vue/compiler-dom';
import { parse as parseSfc } from '@vue/compiler-sfc';
import { createFrameNode, flattenFrames, frameNodeStyle, isFrameNode } from '../frames/frameDocument.js';

/**
 * Vue template parsing and serialisation.
 *
 * The canvas edits editor documents (`../core/editorDocument.js`); the Vue
 * adapter (`../core/vueAdapter.js`) converts between them and the nested
 * nodes this file parses and prints. It also reads the first saved canvas
 * format, which stored these nested nodes directly.
 *
 * Nodes extend the frame designer's node shape (`tag`, `attrs`, `style`,
 * `layout`, `placements`, `children`) with what a Vue template needs:
 *
 * - `component: true` marks a Vue component tag such as `DomDataGrid`.
 * - `bindings` holds `:prop="expression"` pairs, kept as written.
 * - `directives` holds the remaining attributes verbatim (`v-if`, `v-for`,
 *   `@click`, `v-model`, `#slot`), so a file round-trips without the designer
 *   needing to understand every directive.
 * - `#text` nodes may carry an `expression` for `{{ interpolation }}`.
 */

const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const maxSourceBytes = 200000;
const maxNodes = 3000;
let sequence = 0;

/** Allocates a designer id that never collides with ids from the frame designer. */
export function canvasId(prefix = 'node') {
	sequence += 1;
	return `canvas-${prefix}-${Date.now().toString(36)}-${sequence}`;
}

/** Creates a node with canvas fields present, so edits never need existence checks. */
export function createCanvasNode(options = {}) {
	return createFrameNode({ id: canvasId(), bindings: {}, directives: [], ...options });
}

/** Creates a text node, optionally bound to a template expression. */
export function createTextNode(text, expression = '') {
	return createCanvasNode({ tag: '#text', text, ...(expression ? { expression } : {}) });
}

/** Recognises component tags: PascalCase, or kebab-case names that are not native elements. */
export function isComponentTag(tag) {
	return /^[A-Z]/.test(tag) || (tag.includes('-') && !tag.startsWith('dom-'));
}

/** Canvas containers include component nodes, since most components accept a default slot. */
export function isCanvasContainer(node) {
	if (!node || node.tag === '#text') return false;
	if (node.component) return true;
	return isFrameNode(node);
}

/** Parses a static `style` attribute into the same object shape the frame designer edits. */
export function parseStyleAttribute(value = '') {
	const style = {};
	for (const declaration of String(value).split(';')) {
		const index = declaration.indexOf(':');
		if (index < 1) continue;
		const key = declaration.slice(0, index).trim();
		const css = declaration.slice(index + 1).trim();
		if (!key || !css || /url\s*\(|expression\s*\(|@import/i.test(css)) continue;
		style[key] = css;
	}
	return style;
}

/**
 * Splits an SFC into its template and the blocks the designer must not touch.
 * Plain HTML (no `<template>` block) is treated as the template itself.
 *
 * @param {string} source Vue SFC or HTML fragment.
 * @returns {{ template: string, script: string, style: string, isSfc: boolean }} Parts of the file.
 */
export function splitVueSource(source) {
	const value = String(source || '');
	if (value.length > maxSourceBytes) throw new Error('Use a file under 200 KB.');
	if (!/^\s*(?:<!--[\s\S]*?-->\s*)*<(?:template|script|style)[\s>]/.test(value)) return { template: value, script: '', style: '', isSfc: false };
	const { descriptor, errors } = parseSfc(value, { filename: 'Canvas.vue' });
	if (errors.length) throw new Error(`This Vue file did not parse: ${errors[0].message || errors[0]}`);
	if (!descriptor.template) throw new Error('This Vue file has no <template> block to design.');
	const scripts = [descriptor.script, descriptor.scriptSetup].filter(Boolean).sort((a, b) => a.loc.start.offset - b.loc.start.offset);
	const blockSource = (block) => value.slice(block.loc.start.offset, block.loc.end.offset);
	const fullBlock = (block, tag) => {
		const start = value.lastIndexOf(`<${tag}`, block.loc.start.offset);
		const end = value.indexOf(`</${tag}>`, block.loc.end.offset) + tag.length + 3;
		return start >= 0 && end > start ? value.slice(start, end) : `<${tag}>${blockSource(block)}</${tag}>`;
	};
	return {
		template: descriptor.template.content,
		script: scripts.map((block) => fullBlock(block, 'script')).join('\n\n'),
		style: descriptor.styles.map((block) => fullBlock(block, 'style')).join('\n\n'),
		isSfc: true,
	};
}

const namedEntities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', copy: '©', reg: '®', hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', middot: '·', times: '×', rarr: '→', larr: '←' };

/** Decodes HTML entities without touching the DOM; the browser build of the Vue compiler requires one. */
function decodeEntities(value) {
	return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
		if (entity[0] === '#') {
			const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
			return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
		}
		return namedEntities[entity.toLowerCase()] ?? match;
	});
}

/**
 * Converts a Vue template (or HTML) into canvas nodes using the Vue compiler.
 * Nothing executes: expressions are stored as strings.
 *
 * @param {string} template Template source.
 * @returns {{ root: object, unsupported: number }} Root frame and a count of dropped nodes.
 */
export function parseTemplate(template) {
	const ast = baseParse(template, { comments: false, decodeEntities, isVoidTag: (tag) => voidTags.has(tag) });
	let count = 0;
	let unsupported = 0;

	/** Converts one AST node, keeping directives verbatim and literal bindings evaluable. */
	function visit(node) {
		if (++count > maxNodes) throw new Error('Use a template with fewer than 3,000 nodes.');
		if (node.type === NodeTypes.TEXT) return node.content.trim() ? createTextNode(node.content.replace(/\s+/g, ' ')) : null;
		if (node.type === NodeTypes.INTERPOLATION) {
			const expression = node.content.content.trim();
			return createTextNode(`{{ ${expression} }}`, expression);
		}
		if (node.type !== NodeTypes.ELEMENT) { unsupported++; return null; }
		if (['script', 'style', 'iframe', 'object', 'embed'].includes(node.tag)) { unsupported++; return null; }
		const attrs = {};
		const bindings = {};
		const directives = [];
		let style = {};
		for (const prop of node.props) {
			if (prop.type === NodeTypes.ATTRIBUTE) {
				if (prop.name === 'style') style = parseStyleAttribute(prop.value?.content);
				else if (/^on/i.test(prop.name)) unsupported++;
				else attrs[prop.name] = prop.value?.content ?? '';
				continue;
			}
			if (prop.name === 'bind' && prop.arg?.isStatic && prop.exp && !prop.modifiers?.length) {
				bindings[prop.arg.content] = prop.exp.content.trim();
				continue;
			}
			directives.push(prop.loc.source);
		}
		const children = node.children.map(visit).filter(Boolean);
		return createCanvasNode({ tag: node.tag, component: isComponentTag(node.tag), attrs, bindings, directives, style, children });
	}

	const children = ast.children.map(visit).filter(Boolean);
	if (!children.length) throw new Error('Paste a Vue template or HTML with at least one element.');
	const single = children.length === 1 && children[0].tag !== '#text' && !children[0].directives.length;
	const root = single ? children[0] : createCanvasNode({ tag: 'div', label: 'Template', children });
	return { root, unsupported };
}

/**
 * Imports a Vue SFC or HTML fragment as a canvas file. Script and style blocks
 * are carried through untouched so the exported file is the same file with a
 * new template.
 *
 * @param {string} source Vue SFC or HTML.
 * @param {string} name File name shown in the canvas.
 * @returns {{ file: object, unsupported: number }} Canvas file and dropped node count.
 */
export function importVueFile(source, name = 'Component.vue') {
	const parts = splitVueSource(source);
	const { root, unsupported } = parseTemplate(parts.template);
	return {
		file: { id: canvasId('file'), name, root, script: parts.script, style: parts.style },
		unsupported,
	};
}

/** Serialises a preview value back into a Vue binding expression with single-quoted strings. */
export function toTemplateLiteral(value) {
	if (value === null) return 'null';
	if (Array.isArray(value)) return `[${value.map(toTemplateLiteral).join(', ')}]`;
	if (typeof value === 'object') {
		return `{ ${Object.entries(value).map(([key, item]) => `${/^[A-Za-z_$][\w$]*$/.test(key) ? key : `'${key}'`}: ${toTemplateLiteral(item)}`).join(', ')} }`;
	}
	if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
	return String(value);
}

/** Escapes text for a Vue template; interpolation braces are escaped so text stays text. */
function encodeText(value) {
	return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\{\{/g, '{<!-- -->{');
}

/** Escapes an attribute value for a double-quoted attribute. */
function encodeAttribute(value) {
	return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Converts camelCase style keys to CSS property names. */
function cssName(key) {
	return key.startsWith('--') ? key : key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Serialises a canvas node tree back to an indented Vue template, using tabs.
 *
 * @param {object} root Root node.
 * @returns {string} Template markup without the surrounding `<template>` tag.
 */
export function buildTemplate(root) {
	const lines = [];
	/** Emits one node; elements whose only children are text stay on one line. */
	function emit(node, parent, depth) {
		const indent = '\t'.repeat(depth);
		if (node.tag === '#text') {
			const text = node.expression ? `{{ ${node.expression} }}` : encodeText(node.text).trim();
			if (text) lines.push(`${indent}${text}`);
			return;
		}
		const style = Object.entries(frameNodeStyle(node, parent)).map(([key, value]) => `${cssName(key)}: ${value}`).join('; ');
		const attributes = [
			...node.directives.filter((source) => /^(v-(if|else-if|else|for)\b)/.test(source)),
			...Object.entries(node.attrs).map(([key, value]) => (value === '' ? key : `${key}="${encodeAttribute(value)}"`)),
			...(style ? [`style="${encodeAttribute(style)}"`] : []),
			...Object.entries(node.bindings || {}).map(([key, value]) => `:${key}="${encodeAttribute(value)}"`),
			...node.directives.filter((source) => !/^(v-(if|else-if|else|for)\b)/.test(source)),
		];
		const open = `${indent}<${node.tag}${attributes.length ? ` ${attributes.join(' ')}` : ''}`;
		if (voidTags.has(node.tag)) { lines.push(`${open} />`); return; }
		if (!node.children.length) { lines.push(node.component ? `${open} />` : `${open}></${node.tag}>`); return; }
		if (node.children.every((child) => child.tag === '#text')) {
			const text = node.children.map((child) => (child.expression ? `{{ ${child.expression} }}` : encodeText(child.text))).join('').trim();
			if (text.length + open.length < 120) { lines.push(`${open}>${text}</${node.tag}>`); return; }
		}
		lines.push(`${open}>`);
		node.children.forEach((child) => emit(child, node, depth + 1));
		lines.push(`${indent}</${node.tag}>`);
	}
	emit(root, null, 0);
	return lines.join('\n');
}

/** Lists component tags used by a tree, sorted and unique. */
export function usedComponents(root) {
	return [...new Set(flattenFrames(root).map(({ node }) => node).filter((node) => node.component).map((node) => node.tag))].sort();
}

/**
 * Builds a complete Vue SFC. Imported files keep their own script and style
 * blocks; new files get a script that imports the DOM Studio components used.
 *
 * @param {object} file Canvas file.
 * @param {(tag: string) => boolean} isStudioComponent Whether a tag is exported by `@getdom/studio/vue`.
 * @returns {string} Vue SFC source.
 */
export function buildVueFile(file, isStudioComponent = () => true) {
	const template = buildTemplate(file.root).split('\n').map((line) => `\t${line}`).join('\n');
	let script = file.script;
	if (!script) {
		const imports = usedComponents(file.root).filter(isStudioComponent);
		script = imports.length ? `<script setup>\nimport { ${imports.join(', ')} } from '@getdom/studio/vue';\n</script>` : '';
	}
	return [script, `<template>\n${template}\n</template>`, file.style].filter(Boolean).join('\n\n') + '\n';
}

/** Literal class tokens for the on-demand Tailwind compiler. */
export function canvasTailwindContent(files) {
	const tokens = new Set();
	for (const file of files) {
		for (const { node } of flattenFrames(file.root)) {
			String(node.attrs?.class || '').split(/\s+/).filter(Boolean).forEach((token) => tokens.add(token));
		}
	}
	return [...tokens].filter((token) => !/["'`]/.test(token)).map((token) => `class="${token}"`).join('\n');
}

export const sampleVueFile = `<script setup>
import { ref } from 'vue';
import { DomBadge, DomButton } from '@getdom/studio/vue';

const project = ref({ name: 'Launch OS', owner: 'Product team' });
const metrics = [
	{ label: 'Tasks shipped', value: '38' },
	{ label: 'Open risks', value: '4' },
	{ label: 'Readiness', value: '82%' },
];
</script>

<template>
	<section class="min-h-full space-y-6 bg-canvas p-6 text-canvas-fg md:p-10">
		<header class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<p class="text-sm text-muted-fg">Workspace</p>
				<h1 class="text-3xl font-semibold tracking-tight">{{ project.name }}</h1>
			</div>
			<div class="flex items-center gap-2">
				<DomBadge label="Beta" tone="success" />
				<DomButton variant="secondary">Share</DomButton>
				<DomButton @click="createTask">New task</DomButton>
			</div>
		</header>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<article v-for="metric in metrics" :key="metric.label" class="rounded-xl border border-border p-5">
				<p class="text-sm text-muted-fg">{{ metric.label }}</p>
				<p class="mt-2 text-3xl font-semibold">{{ metric.value }}</p>
			</article>
		</div>
		<div class="rounded-xl border border-border p-5">
			<h2 class="font-semibold">Next milestone</h2>
			<p class="mt-2 text-sm leading-6 text-muted-fg">Edit this layout visually, then export the same Vue file with its script intact.</p>
		</div>
	</section>
</template>
`;

