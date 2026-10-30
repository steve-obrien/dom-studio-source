import { isExpr } from './editorDocument.js';
import { UNKNOWN, evaluateLiteralAt, expressionReferences, parseFor } from './expression.js';

/**
 * Preview data for bindings.
 *
 * A template such as `{{ project.name }}` or `v-for="metric in metrics"` needs
 * values to look like a finished design. Preview data is assembled from three
 * layers, later ones winning:
 *
 * 1. Generated samples, shaped by what the template reads (`project.name`
 *    becomes a project name, `metrics` becomes a list of three).
 * 2. Literal values from the file's script (`const project = ref({ … })`).
 * 3. Values the designer typed into the Data panel (`document.data`).
 *
 * None of this is written into the exported file.
 */

const ignoredRoots = new Set(['$t', '$tc', '$te', '$d', '$n', '$route', '$router', '$attrs', '$slots', '$props', '$emit', '$el', '$refs', '$event', 'Math', 'Date', 'JSON', 'Number', 'String', 'Object', 'Array', 'Intl', 'window', 'document', 'console', 'props', 'emit']);
const sampleCount = 3;

/**
 * Lists every data path the document's template reads, with `v-for` aliases
 * resolved to their source lists (`metric.label` → `metrics[].label`).
 *
 * @param {object} doc Editor document.
 * @returns {Array<{ path: Array<string>, hint?: string }>} References.
 */
export function collectReferences(doc) {
	const out = [];

	function resolve(references, aliases, hintOverride) {
		for (const reference of references) {
			const [root, ...rest] = reference.path;
			if (ignoredRoots.has(root)) continue;
			const alias = aliases.get(root);
			if (alias === 'index') continue;
			const path = alias ? [...alias, ...rest] : reference.path;
			out.push({ path, hint: hintOverride || reference.hint });
		}
	}

	function visit(id, aliases) {
		const node = doc.nodes[id];
		if (!node) return;
		let scope = aliases;
		for (const source of node.directives || []) {
			const directive = parseDirective(source);
			if (!directive) continue;
			if (directive.name === 'for') {
				const loop = parseFor(directive.value);
				if (!loop) continue;
				const references = expressionReferences(loop.source);
				const list = references.length === 1 ? references[0] : null;
				resolve(references.slice(list ? 1 : 0), scope);
				if (!list) continue;
				const [root, ...rest] = list.path;
				const base = scope.get(root);
				if (base === 'index' || ignoredRoots.has(root)) continue;
				const listPath = base ? [...base, ...rest] : list.path;
				out.push({ path: listPath, hint: 'array' });
				scope = new Map(scope);
				if (loop.value) scope.set(loop.value, [...listPath, '[]']);
				loop.names.forEach((name, index) => scope.set(name, [...listPath, '[]', loop.keys[index] || name]));
				if (loop.key) scope.set(loop.key, 'index');
				if (loop.index) scope.set(loop.index, 'index');
			} else if (['if', 'else-if', 'show'].includes(directive.name)) {
				resolve(expressionReferences(directive.value), scope);
			} else if (['model', 'text', 'html'].includes(directive.name) || (directive.name === 'bind' && directive.arg)) {
				resolve(expressionReferences(directive.value), scope);
			} else if (directive.name === 'slot' && directive.value) {
				// Slot props come from the component, not from data; shadow them.
				scope = new Map(scope);
				for (const name of directive.value.replace(/[{}()[\]\s]/g, '').split(',').map((item) => item.split(':').pop().split('=')[0]).filter(Boolean)) scope.set(name, 'index');
			}
		}
		for (const value of Object.values(node.props || {})) {
			if (!isExpr(value)) continue;
			resolve(expressionReferences(value.expr), scope);
		}
		node.children.forEach((child) => visit(child, scope));
	}

	visit(doc.rootId, new Map());
	return out;
}

/**
 * Splits a verbatim directive (`v-for="item in items"`, `#header`, `@click="go"`)
 * into its name, argument and value.
 *
 * @param {string} source Directive source.
 * @returns {{ name: string, arg: string, modifiers: Array<string>, value: string }|null}
 */
export function parseDirective(source) {
	const match = /^(v-[\w-]+|@|:|#)([^=\s]*)\s*(?:=\s*(["'])([\s\S]*)\3)?\s*$/.exec(String(source || '').trim());
	if (!match) return null;
	const [, prefix, rawArg = '', , value = ''] = match;
	const shorthand = { '@': 'on', ':': 'bind', '#': 'slot' };
	const name = shorthand[prefix] || prefix.slice(2);
	const [arg, ...modifiers] = (prefix.startsWith('v-') ? rawArg.replace(/^:/, '') : rawArg).split('.');
	return { name, arg, modifiers, value };
}

/* Shapes and samples ------------------------------------------------------------ */

function createShape() { return { kind: 'leaf', hint: undefined }; }

function addPath(shape, path, hint) {
	let current = shape;
	path.forEach((segment, index) => {
		const isLast = index === path.length - 1;
		if (segment === '[]') {
			if (current.kind !== 'array') Object.assign(current, { kind: 'array', item: createShape(), fields: undefined });
			current = current.item;
		} else {
			if (current.kind !== 'object') Object.assign(current, { kind: 'object', fields: {}, item: undefined });
			current.fields[segment] ??= createShape();
			current = current.fields[segment];
		}
		if (isLast && hint) {
			if (hint === 'array' && current.kind !== 'array') Object.assign(current, { kind: 'array', item: current.kind === 'object' ? { kind: 'object', fields: current.fields } : createShape(), fields: undefined });
			else if (current.kind === 'leaf') current.hint = hint;
		}
	});
}

function singular(name = '') {
	if (/ies$/i.test(name)) return name.replace(/ies$/i, 'y');
	if (/(ss|us)$/i.test(name)) return name;
	if (/ses$/i.test(name)) return name.replace(/es$/i, '');
	return name.replace(/s$/i, '');
}

function words(name = '') {
	return String(name).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim();
}

function titleCase(value) {
	return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const people = ['Ana Ruiz', 'Ben Okafor', 'Chloe Park', 'Dev Patel'];
const projects = ['Website relaunch', 'Mobile onboarding', 'Billing migration', 'Partner portal'];
const titles = ['Quarterly review', 'Launch checklist', 'Customer feedback', 'Design system audit'];
const sentences = ['A short summary that reads like real content.', 'Everything the team needs in one place.', 'Clear next steps, owners and dates.', 'Notes from the last review.'];
const statuses = ['Active', 'In review', 'Planned', 'Done'];
const dates = ['Oct 14, 2026', 'Nov 3, 2026', 'Dec 1, 2026', 'Jan 12, 2027'];
const companies = ['Northwind', 'Acme Co.', 'Globex', 'Initech'];
const cities = ['Lisbon', 'Toronto', 'Melbourne', 'Berlin'];

/**
 * Generates a believable value for a data key.
 *
 * @param {string} key Key name, such as `ownerName` or `price`.
 * @param {string} [hint] `number`, `string`, `boolean` or `array`.
 * @param {number} [index] Position in a list, so rows differ.
 * @param {string} [context] Parent key, such as `project` for `project.name`.
 * @returns {unknown} Sample value.
 */
export function sampleValue(key, hint, index = 0, context = '') {
	const name = String(key || '').toLowerCase();
	const pick = (list) => list[index % list.length];
	if (hint === 'boolean' || /^(is|has|can|should|show|enable|allow)[A-Z_]|^(open|active|enabled|visible|disabled|loading|selected|checked|done|completed)$/.test(key || '')) return index % 3 !== 2;
	if (/email/.test(name)) return `${pick(people).split(' ')[0].toLowerCase()}@example.com`;
	if (/(url|href|link|website)$/.test(name)) return '#';
	if (/(image|avatar|photo|picture|logo|thumbnail|cover|src)/.test(name)) return `https://placehold.co/${index % 2 ? '160x160' : '320x200'}`;
	if (/(percent|progress|completion|rate|ratio|readiness)/.test(name)) return [72, 45, 88, 30][index % 4];
	if (/(price|amount|total|cost|revenue|balance|budget|salary|fee|mrr|arr)/.test(name)) return [1280, 640, 2495, 99][index % 4];
	if (/(count|qty|quantity|number|num|size|score|age|views|votes|stars|tasks|items|days|hours)$/.test(name) || hint === 'number') return [38, 12, 7, 54][index % 4];
	if (/(date|time|deadline|due|created|updated|at)$/.test(name) && !/(status|state)/.test(name)) return pick(dates);
	if (/(status|state|stage)$/.test(name)) return pick(statuses);
	if (/(^|[^a-z])(first)?name$|owner|author|user|assignee|customer|member|person|manager|lead/.test(name) && /(owner|author|user|assignee|customer|member|person|manager|lead|first|full|contact)/.test(`${name} ${context.toLowerCase()}`)) return pick(people);
	if (/(company|organisation|organization|org|team|client|account)$/.test(name)) return pick(companies);
	if (/(city|location|place|region)$/.test(name)) return pick(cities);
	if (/(description|summary|body|text|content|subtitle|message|note|excerpt|bio)$/.test(name)) return pick(sentences);
	if (/(name|project|product)$/.test(name)) return pick(projects);
	if (/(title|label|heading|caption)$/.test(name)) return pick(titles);
	if (/(id|key|slug|code)$/.test(name)) return `${singular(context || 'item').toLowerCase() || 'item'}-${index + 1}`;
	if (/(color|colour|tone|variant)$/.test(name)) return ['primary', 'success', 'warning', 'neutral'][index % 4];
	if (/(value|amount)$/.test(name)) return ['38', '4', '82%', '12'][index % 4];
	if (hint === 'array') return [];
	const label = titleCase(words(key || 'Value'));
	return index ? `${label} ${index + 1}` : label;
}

function materialise(shape, key, index, context) {
	if (shape.kind === 'object') return Object.fromEntries(Object.entries(shape.fields).map(([field, child]) => [field, materialise(child, field, index, key)]));
	if (shape.kind === 'array') {
		const item = singular(key);
		return Array.from({ length: sampleCount }, (_, position) => materialise(shape.item, item, position, key));
	}
	return sampleValue(key, shape.hint, index, context);
}

/**
 * Generates sample data shaped by what the template reads.
 *
 * @param {object} doc Editor document.
 * @returns {object} Sample data.
 */
export function generateSampleData(doc) {
	const root = { kind: 'object', fields: {} };
	for (const { path, hint } of collectReferences(doc)) if (path.length) addPath(root, path, hint);
	return materialise(root, '', 0, '');
}

/**
 * Reads literal values from a `<script setup>` block: `const x = ref(…)`,
 * `reactive(…)`, and plain `const x = […]`. Calls and functions are skipped.
 *
 * @param {string} script Script source, with or without the `<script>` tag.
 * @returns {object} Values by variable name.
 */
export function scriptData(script = '') {
	const out = {};
	const pattern = /(?:^|[\n;])\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:(ref|reactive|shallowRef|shallowReactive)\s*(?:<[^>]*>)?\s*\()?/g;
	let match;
	while ((match = pattern.exec(script))) {
		const start = pattern.lastIndex;
		const candidates = match[2] ? [')'] : [';', '\n'];
		for (const terminator of candidates) {
			const value = evaluateLiteralAt(script, start, terminator);
			if (value !== UNKNOWN && value !== undefined) { out[match[1]] = value; break; }
		}
	}
	return out;
}

/**
 * Deep-merges preview layers. Objects merge by key; a later list replaces an
 * earlier one, but its items are filled from the earlier list's items so
 * fields the template needs are never missing.
 *
 * @param {...object} layers Layers, lowest priority first.
 * @returns {object} Merged data.
 */
export function mergeData(...layers) {
	return layers.reduce((base, layer) => mergeValue(base, layer), {});
}

function mergeValue(base, layer) {
	if (layer === undefined) return base;
	if (Array.isArray(layer)) {
		if (!Array.isArray(base) || !base.length) return layer;
		return layer.map((item, index) => mergeValue(base[index % base.length], item));
	}
	if (layer && typeof layer === 'object') {
		const out = base && typeof base === 'object' && !Array.isArray(base) ? { ...base } : {};
		for (const [key, value] of Object.entries(layer)) out[key] = mergeValue(out[key], value);
		return out;
	}
	return layer;
}

/**
 * Builds the data the canvas renders with.
 *
 * @param {object} doc Editor document.
 * @param {{ script?: string }} [file] File whose script supplies literal values.
 * @returns {object} Preview data.
 */
export function previewData(doc, file = {}) {
	return mergeData(generateSampleData(doc), scriptData(file.script || ''), doc.data || {});
}
