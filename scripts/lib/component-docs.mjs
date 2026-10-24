import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { findMatching } from './source-scan.mjs';

/**
 * Component guides are Markdown files that sit beside their component, such
 * as `DomDataGrid.md` next to `DomDataGrid.vue`. The same file feeds the docs
 * site page and the Markdown shipped in the npm package, so there is one
 * place to write each guide.
 *
 * Guides use plain Markdown plus one marker for live examples:
 *
 *     <!-- example: TradingDeskGrid -->
 *     <!-- example: CustomColumnComponents files: EditNameCell, RowActionsCell -->
 *
 * The name is a file in the component's `examples/` folder. The site renders
 * it as a live demo with its source; the package links to a copy of the file.
 */

const examplePattern = /^<!--\s*example:\s*([A-Za-z0-9_-]+)(?:\s+files:\s*([A-Za-z0-9_,\s-]+?))?\s*-->$/;

/**
 * Splits a guide into sections at `##` and `###` headings. Each section holds
 * Markdown, fenced code and example blocks in order.
 *
 * @param {string} markdown - Guide source.
 * @returns {Array<{ level: number, title: string, parent: string, blocks: Array<{ type: 'markdown', text: string } | { type: 'code', lang: string, source: string } | { type: 'example', name: string, files: Array<string> }> }>} Sections in order. A level 0 section holds text before the first heading.
 */
export function parseGuide(markdown) {
	const sections = [{ level: 0, title: '', parent: '', blocks: [] }];
	let parent = '';
	let prose = [];
	let fence = null;

	const current = () => sections[sections.length - 1];
	const flushProse = () => {
		const text = prose.join('\n').trim();
		if (text) current().blocks.push({ type: 'markdown', text });
		prose = [];
	};

	for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
		if (fence) {
			if (/^```\s*$/.test(line)) {
				current().blocks.push({ type: 'code', lang: fence.lang, source: fence.lines.join('\n') });
				fence = null;
			} else {
				fence.lines.push(line);
			}
			continue;
		}

		const fenceOpen = /^```(\w*)\s*$/.exec(line);
		if (fenceOpen) {
			flushProse();
			fence = { lang: fenceOpen[1] || 'text', lines: [] };
			continue;
		}

		const heading = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
		if (heading) {
			flushProse();
			const level = heading[1].length;
			const title = heading[2];
			if (level === 2) parent = title;
			sections.push({ level, title, parent: level === 3 ? parent : '', blocks: [] });
			continue;
		}

		const example = examplePattern.exec(line.trim());
		if (example) {
			flushProse();
			const files = (example[2] || '').split(',').map((file) => file.trim()).filter(Boolean);
			current().blocks.push({ type: 'example', name: example[1], files });
			continue;
		}

		prose.push(line);
	}

	if (fence) throw new Error('Unclosed code fence in component guide.');
	flushProse();
	return sections.filter((section) => section.level > 0 || section.blocks.length);
}

/**
 * Reads the `__doc` metadata (name, description, events, slots, methods,
 * keyboard) from a component file.
 *
 * @param {string} file - Absolute path to a `.vue` file.
 * @returns {Record<string, any> | null} Evaluated metadata, or null when absent.
 */
export function readComponentDoc(file) {
	const source = fs.readFileSync(file, 'utf8');
	const index = source.indexOf('__doc:');
	if (index < 0) return null;
	const open = source.indexOf('{', index);
	const close = findMatching(source, open, '{', '}');
	if (open < 0 || close < 0) return null;
	return vm.runInNewContext(`(${source.slice(open, close + 1)})`, {}, { timeout: 1000 });
}

/**
 * Reads the members of a generated interface in `index.d.ts`.
 *
 * @param {string} declarations - Generated declaration file contents.
 * @param {string} interfaceName - Interface to read.
 * @returns {Array<{ name: string, type: string, optional: boolean, description: string, defaultValue: string }>} Members in order.
 */
export function readInterfaceMembers(declarations, interfaceName) {
	const body = interfaceBody(declarations, interfaceName);
	if (!body) return [];
	const members = [];
	const memberPattern = /(?:\/\*\*([\s\S]*?)\*\/\s*)?\n\t("[^"]+"|[\w$]+)(\?)?: ([^\n]+);/g;
	let match;
	while ((match = memberPattern.exec(`\n${body}`))) {
		const doc = (match[1] || '').split('\n').map((line) => line.replace(/^\s*\*\s?/, '').trim()).filter(Boolean);
		const defaultLine = doc.find((line) => line.startsWith('@default '));
		members.push({
			name: match[2].replace(/^"|"$/g, ''),
			type: match[4].trim(),
			optional: Boolean(match[3]),
			description: doc.filter((line) => !line.startsWith('@')).join(' '),
			defaultValue: defaultLine ? defaultLine.slice('@default '.length) : '',
		});
	}
	return members;
}

/**
 * Builds the Markdown shipped in the npm package for one component: the guide
 * with examples turned into links, then an API reference generated from the
 * declarations and `__doc`.
 *
 * @param {{ name: string, doc: Record<string, any> | null, guide: string, declarations: string, examplesPath: string }} options - Component name, metadata, guide source, generated declarations and the relative folder holding copied examples.
 * @returns {string} Markdown document.
 */
export function buildPackageDoc({ name, doc, guide, declarations, examplesPath }) {
	const lines = [`# ${name}`, ''];
	if (doc?.description) lines.push(doc.description.split('\n').map((line) => line.trim()).join(' '), '');
	lines.push(
		'```js',
		`import { ${name} } from '@getdom/studio';`,
		'```',
		'',
		`Types: \`${name}Props\`${interfaceBody(declarations, `${name}Slots`) ? `, \`${name}Slots\`` : ''}${interfaceBody(declarations, `${name}Exposed`) ? `, \`${name}Exposed\`` : ''} and the types listed under API reference, all exported from \`@getdom/studio\`.`,
		'',
	);

	for (const section of parseGuide(guide)) {
		if (section.level) lines.push(`${'#'.repeat(section.level)} ${section.title}`, '');
		for (const block of section.blocks) {
			if (block.type === 'markdown') lines.push(block.text, '');
			if (block.type === 'code') lines.push(`\`\`\`${block.lang}`, block.source, '```', '');
			if (block.type === 'example') {
				const files = [block.name, ...block.files].map((file) => `[${file}.vue](${examplesPath}/${file}.vue)`);
				lines.push(`Full example: ${files.join(', ')}`, '');
			}
		}
	}

	lines.push('## API reference', '');
	lines.push(...propsTable(readInterfaceMembers(declarations, `${name}Props`)));
	lines.push(...eventsTable(doc?.events || [], readInterfaceMembers(declarations, `${name}Props`)));
	lines.push(...slotsTable(doc?.slots || [], readInterfaceMembers(declarations, `${name}Slots`)));
	lines.push(...methodsTable(readInterfaceMembers(declarations, `${name}Exposed`)));
	lines.push(...keyboardTable(doc?.keyboard || []));
	lines.push(...typesSection(declarations, [`${name}Props`, `${name}Slots`, `${name}Exposed`]));

	return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

/**
 * Copies a component's guide examples into the package docs, rewriting
 * repository imports to the package entry point.
 *
 * @param {{ guide: string, examplesDir: string, outputDir: string }} options - Guide source, source examples folder and destination folder.
 * @returns {Array<string>} Copied file names.
 */
export function copyGuideExamples({ guide, examplesDir, outputDir }) {
	const names = new Set();
	for (const section of parseGuide(guide)) {
		for (const block of section.blocks) {
			if (block.type !== 'example') continue;
			names.add(block.name);
			for (const file of block.files) names.add(file);
		}
	}

	const copied = [];
	for (const name of names) {
		const source = path.join(examplesDir, `${name}.vue`);
		if (!fs.existsSync(source)) throw new Error(`Guide example does not exist: ${source}`);
		fs.mkdirSync(outputDir, { recursive: true });
		fs.writeFileSync(path.join(outputDir, `${name}.vue`), packageImports(fs.readFileSync(source, 'utf8')));
		copied.push(`${name}.vue`);
	}
	return copied;
}

function propsTable(members) {
	const props = members.filter((member) => !/^on[A-Z]/.test(member.name));
	if (!props.length) return [];
	return [
		'### Props',
		'',
		'Use kebab-case in templates, such as `show-row-numbers`.',
		'',
		'| Prop | Type | Default | Description |',
		'| --- | --- | --- | --- |',
		...props.map((prop) => `| \`${prop.name}\` | ${code(prop.type)} | ${prop.defaultValue ? code(prop.defaultValue) : ''} | ${cell(prop.description)} |`),
		'',
	];
}

function eventsTable(events, members) {
	if (!events.length) return [];
	const listenerTypes = new Map(members.map((member) => [member.name, member.type]));
	return [
		'### Events',
		'',
		'| Event | Payload | Description |',
		'| --- | --- | --- |',
		...events.map((event) => {
			const typed = /\(payload: (.+)\) => void$/.exec(listenerTypes.get(listenerName(event.name)) || '');
			const payload = typed && typed[1] !== 'any' ? typed[1] : event.payload || '';
			return `| \`${event.name}\` | ${payload ? code(payload) : ''} | ${cell(event.description)} |`;
		}),
		'',
	];
}

function slotsTable(slots, members) {
	if (!slots.length) return [];
	const slotTypes = new Map(members.map((member) => [member.name, member.type]));
	return [
		'### Slots',
		'',
		'| Slot | Slot props | Description |',
		'| --- | --- | --- |',
		...slots.map((slot) => {
			const typed = /\(props: (.+)\) => any$/.exec(slotTypes.get(slot.name) || '');
			const payload = typed && typed[1] !== 'any' ? typed[1] : slot.payload || '';
			return `| \`${slot.name}\` | ${payload ? code(payload) : ''} | ${cell(slot.description)} |`;
		}),
		'',
	];
}

function methodsTable(members) {
	if (!members.length) return [];
	return [
		'### Methods',
		'',
		'Call these on a template ref.',
		'',
		'| Method | Signature | Description |',
		'| --- | --- | --- |',
		...members.map((method) => `| \`${method.name}\` | ${code(method.type)} | ${cell(method.description)} |`),
		'',
	];
}

function keyboardTable(keyboard) {
	if (!keyboard.length) return [];
	return [
		'### Keyboard',
		'',
		'| Keys | Action |',
		'| --- | --- |',
		...keyboard.map((row) => `| ${cell(row.keys)} | ${cell(row.action)} |`),
		'',
	];
}

/**
 * Collects every exported type the component's interfaces refer to, directly
 * or through other types, and prints their declarations.
 */
function typesSection(declarations, roots) {
	const exported = new Map();
	const declarationPattern = /^(?:\/\*\*[\s\S]*?\*\/\n)?export (?:interface|type) (\w+)[\s\S]*?(?=\n(?:\/\*\*|export )|(?![\s\S]))/gm;
	let match;
	while ((match = declarationPattern.exec(declarations))) exported.set(match[1], match[0].trim());

	const seen = new Set(roots);
	const pending = roots.map((name) => exported.get(name) || '');
	const found = [];
	while (pending.length) {
		const text = pending.pop();
		for (const [name, declaration] of exported) {
			if (seen.has(name) || !new RegExp(`\\b${name}\\b`).test(text)) continue;
			seen.add(name);
			found.push(name);
			pending.push(declaration);
		}
	}
	if (!found.length) return [];

	const ordered = [...exported.keys()].filter((name) => found.includes(name));
	return [
		'### Types',
		'',
		'```ts',
		...ordered.map((name) => `${exported.get(name)}\n`),
		'```',
		'',
	];
}

function interfaceBody(declarations, interfaceName) {
	const start = declarations.indexOf(`export interface ${interfaceName} {`);
	if (start < 0) return '';
	const open = declarations.indexOf('{', start);
	const close = findMatching(declarations, open, '{', '}');
	return close < 0 ? '' : declarations.slice(open + 1, close);
}

function listenerName(eventName) {
	const camel = eventName.replace(/-(\w)/g, (_match, char) => char.toUpperCase());
	return `on${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
}

function packageImports(source) {
	return source
		.replace(/import\s+(Dom[A-Za-z0-9]+)\s+from\s+['"](?:\.\.\/)+Dom[A-Za-z0-9]+\.vue['"];?/g, (_match, componentName) => `import { ${componentName} } from '@getdom/studio';`)
		.replace(/from\s+['"](?:\.\.\/)+(?:lib\/vue(?:\/index\.js)?|Dom[A-Za-z0-9]+\.vue)['"]/g, 'from \'@getdom/studio\'');
}

function code(text) {
	return `\`${String(text).replace(/\|/g, '\\|').replace(/`/g, '\'')}\``;
}

function cell(text = '') {
	return String(text).replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim();
}
