import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { parse } from '@vue/compiler-sfc';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vueEntryPath = path.join(root, 'src/pages/lib/vue/index.js');
const vueTypesPath = path.join(root, 'src/pages/lib/vue/index.d.ts');
const headlessDir = path.join(root, 'src/pages/lib/headless');

const constructorNames = new Map([
	[String, 'String'],
	[Number, 'Number'],
	[Boolean, 'Boolean'],
	[Array, 'Array'],
	[Object, 'Object'],
	[Function, 'Function'],
]);

const typeByConstructor = {
	String: 'string',
	Number: 'number',
	Boolean: 'boolean',
	Array: 'Array<unknown>',
	Object: 'Record<string, unknown>',
	Function: '((...args: Array<unknown>) => unknown)',
};

const manualPropTypes = {
	DomTreeView: {
		items: 'TreeItems',
		openValues: 'Array<string | number>',
		externalDropTypes: 'Array<string>',
		canDropItem: '(payload: TreeDropCandidate) => boolean',
		canDropExternal: '(payload: TreeExternalDropCandidate) => boolean',
	},
	DomDropdown: {
		items: 'Array<DomMenuItemRecord>',
	},
	DomMenu: {
		items: 'Array<DomMenuItemRecord> | null',
	},
	DomContextMenu: {
		items: 'Array<DomMenuItemRecord>',
	},
	DomCommandPalette: {
		items: 'Array<DomCommandPaletteItem>',
	},
	DomDialogStack: {
		dialogs: 'Array<DialogOptions & { id: string }>',
	},
	DomDialogSchemaForm: {
		schema: 'DomFormChildren',
	},
	DomToastStack: {
		toasts: 'Array<ToastOptions & { id: string }>',
	},
	DomToastItem: {
		tone: 'ToastTone',
	},
	DomRadioGroup: {
		options: 'Array<DomOption>',
	},
	DomListbox: {
		options: 'Array<DomOption>',
	},
	DomSelect: {
		options: 'Array<DomOption>',
	},
	DomCombobox: {
		options: 'Array<DomOption>',
	},
	DomAutocomplete: {
		options: 'Array<DomOption>',
	},
	DomTagCombobox: {
		modelValue: 'Array<string>',
		options: 'Array<DomOption>',
		separators: 'Array<string>',
	},
	DomToggleButtonGroup: {
		options: 'Array<DomOption>',
	},
	DomSelectInput: {
		options: 'Array<DomOption>',
	},
	DomNativeSelect: {
		options: 'Array<DomOption>',
	},
	DomJsonListInput: {
		modelValue: 'Array<Record<string, unknown>>',
		schema: 'JsonSchema | Array<DomJsonListSchemaField>',
	},
	DomJsonInput: {
		modelValue: 'JsonValue',
		schema: 'JsonSchema | Array<DomJsonListSchemaField> | Record<string, unknown>',
	},
	DomForm: {
		modelValue: 'Record<string, unknown> | Array<Record<string, unknown>>',
		items: 'DomFormNode | DomFormChildren | null',
		children: 'DomFormChildren',
	},
	DomRenderer: {
		spec: 'DomRenderSpec',
	},
	DomCalendar: {
		weekStartsOn: '0 | 1 | 2 | 3 | 4 | 5 | 6',
	},
	DomMonthCalendar: {
		weekStartsOn: '0 | 1 | 2 | 3 | 4 | 5 | 6',
		weekdayFormat: '\'narrow\' | \'short\' | \'long\'',
		disabledDate: '(cell: MonthCalendarCell) => boolean',
		dayClass: 'string | Array<unknown> | Record<string, boolean> | ((cell: MonthCalendarCell) => unknown)',
		dayStyle: 'string | Record<string, string | number> | ((cell: MonthCalendarCell) => string | Record<string, string | number> | null | undefined)',
	},
	DomAppStack: {
		path: 'Array<string>',
		screens: 'Array<DomAppStackScreenRecord>',
		layout: 'DomAppStackLayout',
	},
	DomAppStackScreen: {
		children: 'Array<string>',
		props: 'Record<string, unknown>',
	},
};

const componentDocTypes = {
	DomTreeView: [
		'TreeItemAction',
		'TreeItem',
		'TreeItems',
		'TreeNode',
		'TreeDropPosition',
		'TreeDropKind',
		'TreeSelectionPayload',
		'TreeActionPayload',
		'TreeTogglePayload',
		'TreeLoadChildrenPayload',
		'TreeDragPreviewPayload',
		'TreeDragPreviewEndPayload',
		'TreeReorderPayload',
		'TreeExternalDropPayload',
	],
};

const sharedPropObjects = loadSharedPropObjects();
const componentExports = parseVueComponentExports();
const components = componentExports.map((component) => ({
	...component,
	props: extractComponentProps(component),
}));

writeFile(vueTypesPath, buildVueTypes(components));
writeHeadlessTypes();

function parseVueComponentExports() {
	const entry = fs.readFileSync(vueEntryPath, 'utf8');
	const seenByPath = new Map();
	const exports = [];
	const pattern = /export\s+\{\s+default\s+as\s+(\w+)\s+\}\s+from\s+'([^']+\.vue)';/g;
	let match;
	while ((match = pattern.exec(entry))) {
		const [, name, request] = match;
		const file = path.normalize(path.join(path.dirname(vueEntryPath), request));
		const sourceKey = path.relative(root, file);
		const originalName = seenByPath.get(sourceKey);
		exports.push({
			name,
			file,
			sourceKey,
			aliasOf: originalName && originalName !== name ? originalName : '',
		});
		if (!originalName) seenByPath.set(sourceKey, name);
	}
	return exports;
}

function loadSharedPropObjects() {
	const objects = {};
	objects.fieldProps = evaluateModuleGlobals(
		path.join(root, 'src/pages/forms/field/fieldProps.js'),
		['fieldProps'],
	).fieldProps;

	objects.popoverProps = evaluateSfcGlobals(
		path.join(root, 'src/pages/components/popover/DomPopover.vue'),
		['popoverProps'],
		objects,
	).popoverProps;

	objects.calendarProps = evaluateSfcGlobals(
		path.join(root, 'src/pages/forms/calendar/DomCalendar.vue'),
		['calendarProps'],
		objects,
	).calendarProps;

	return objects;
}

function extractComponentProps(component) {
	if (component.aliasOf) return null;
	const source = fs.readFileSync(component.file, 'utf8');
	const { descriptor } = parse(source, { filename: component.file });
	const content = [
		descriptor.script?.content || '',
		descriptor.scriptSetup?.content || '',
	].filter(Boolean).join('\n\n');

	const globals = {
		...sharedPropObjects,
		...evaluateModuleSource(content, [], sharedPropObjects),
	};

	const definePropsArg = firstDefinePropsArgument(content);
	if (definePropsArg) {
		return evaluatePropsExpression(resolveExpression(definePropsArg, content), globals, component);
	}

	const propsExpression = firstDefineComponentPropsExpression(content);
	if (propsExpression) {
		return evaluatePropsExpression(propsExpression, globals, component);
	}

	return {};
}

function resolveExpression(expression, content) {
	const value = expression.trim();
	if (value.startsWith('{')) return value;
	if (/^[A-Za-z_$][\w$]*$/.test(value)) {
		const assigned = constObjectExpression(content, value);
		if (assigned) return assigned;
	}
	return value;
}

function evaluatePropsExpression(expression, globals, component) {
	try {
		const props = runExpression(expression, globals);
		if (!props || typeof props !== 'object') return {};
		return props;
	} catch (error) {
		console.warn(`Could not evaluate props for ${component.name}: ${error.message}`);
		return {};
	}
}

function firstDefinePropsArgument(source) {
	const index = source.indexOf('defineProps');
	if (index < 0) return '';
	const open = source.indexOf('(', index);
	if (open < 0) return '';
	const close = findMatching(source, open, '(', ')');
	if (close < 0) return '';
	return source.slice(open + 1, close).trim();
}

function firstDefineComponentPropsExpression(source) {
	let index = 0;
	while ((index = source.indexOf('defineComponent', index)) >= 0) {
		const open = source.indexOf('(', index);
		if (open < 0) return '';
		const close = findMatching(source, open, '(', ')');
		if (close < 0) return '';
		const args = source.slice(open + 1, close).trim();
		if (args.startsWith('{')) {
			const prop = objectPropertyExpression(args, 'props');
			if (prop) return prop;
		}
		index = close + 1;
	}
	return '';
}

function constObjectExpression(source, name) {
	const pattern = new RegExp(`(?:export\\s+)?const\\s+${escapeRegExp(name)}\\s*=`, 'm');
	const match = pattern.exec(source);
	if (!match) return '';
	const open = source.indexOf('{', match.index + match[0].length);
	if (open < 0) return '';
	const close = findMatching(source, open, '{', '}');
	if (close < 0) return '';
	return source.slice(open, close + 1);
}

function objectPropertyExpression(objectExpression, propertyName) {
	const open = objectExpression.indexOf('{');
	const close = objectExpression.lastIndexOf('}');
	if (open < 0 || close < open) return '';

	let depth = 0;
	let quote = '';
	let escaped = false;
	let comment = '';

	for (let index = open; index <= close; index += 1) {
		const char = objectExpression[index];
		const next = objectExpression[index + 1];

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
		if (char === '{' || char === '[' || char === '(') {
			depth += 1;
			continue;
		}
		if (char === '}' || char === ']' || char === ')') {
			depth -= 1;
			continue;
		}
		if (depth !== 1) continue;
		if (!identifierAt(objectExpression, index, propertyName)) continue;
		const afterName = index + propertyName.length;
		const colon = skipWhitespace(objectExpression, afterName);
		if (objectExpression[colon] !== ':') continue;
		const start = skipWhitespace(objectExpression, colon + 1);
		return readExpressionValue(objectExpression, start);
	}

	return '';
}

function readExpressionValue(source, start) {
	const first = source[start];
	if (first === '{') {
		const end = findMatching(source, start, '{', '}');
		return source.slice(start, end + 1);
	}
	if (first === '[') {
		const end = findMatching(source, start, '[', ']');
		return source.slice(start, end + 1);
	}
	let end = start;
	while (end < source.length && source[end] !== ',' && source[end] !== '\n') end += 1;
	return source.slice(start, end).trim();
}

function identifierAt(source, index, name) {
	if (source.slice(index, index + name.length) !== name) return false;
	const before = source[index - 1];
	const after = source[index + name.length];
	return !isIdentifierChar(before) && !isIdentifierChar(after);
}

function isIdentifierChar(char = '') {
	return /[A-Za-z0-9_$]/.test(char);
}

function skipWhitespace(source, index) {
	while (/\s/.test(source[index] || '')) index += 1;
	return index;
}

function findMatching(source, openIndex, openChar, closeChar) {
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

function evaluateSfcGlobals(file, names, globals = {}) {
	const source = fs.readFileSync(file, 'utf8');
	const { descriptor } = parse(source, { filename: file });
	const content = [
		descriptor.script?.content || '',
		descriptor.scriptSetup?.content || '',
	].filter(Boolean).join('\n\n');
	return evaluateModuleSource(content, names, globals);
}

function evaluateModuleGlobals(file, names, globals = {}) {
	return evaluateModuleSource(fs.readFileSync(file, 'utf8'), names, globals);
}

function evaluateModuleSource(source, names = [], globals = {}) {
	const sandbox = buildSandbox(globals);
	const transformed = stripImports(source)
		.replace(/export\s+const\s+([A-Za-z_$][\w$]*)\s*=/g, 'const $1 = globalThis.$1 =')
		.replace(/export\s+function\s+([A-Za-z_$][\w$]*)\s*\(/g, 'function $1(')
		.replace(/export\s+\{[\s\S]*?\};?/g, '');

	try {
		vm.runInNewContext(transformed, sandbox, { timeout: 1000 });
	} catch {
		return {};
	}

	const out = {};
	const keys = names.length ? names : Object.keys(sandbox).filter((key) => !key.startsWith('__'));
	for (const name of keys) {
		if (sandbox[name] !== undefined) out[name] = sandbox[name];
	}
	return out;
}

function runExpression(expression, globals = {}) {
	return vm.runInNewContext(`(${expression})`, buildSandbox(globals), { timeout: 1000 });
}

function buildSandbox(globals = {}) {
	return {
		...globals,
		String,
		Number,
		Boolean,
		Array,
		Object,
		Function,
		Date,
		RegExp,
		Set,
		Map,
		console,
		treeItemsFormSchema: [],
	};
}

function stripImports(source) {
	return source
		.split('\n')
		.filter((line) => !line.trim().startsWith('import '))
		.join('\n');
}

function buildVueTypes(componentEntries) {
	const lines = [
		'/* eslint-disable */',
		'// Generated by scripts/generate-types.mjs. Do not edit by hand.',
		'import type { Component, ComputedRef, DefineComponent, InjectionKey, Ref } from \'vue\';',
		'',
		...sharedVueTypes(),
		'',
	];

	const emittedInterfaces = new Set();
	for (const component of componentEntries) {
		if (component.aliasOf) {
			lines.push(`export type ${component.name}Props = ${component.aliasOf}Props;`);
			lines.push(`export declare const ${component.name}: typeof ${component.aliasOf};`);
			lines.push('');
			continue;
		}

		const interfaceName = `${component.name}Props`;
		emittedInterfaces.add(interfaceName);
		lines.push(...componentInterfaceLines(component, interfaceName));
		lines.push(`export declare const ${component.name}: DomComponent<${interfaceName}>;`);
		lines.push('');
	}

	lines.push(...libraryFunctionTypes());
	return `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`;
}

function sharedVueTypes() {
	return [
		'export type JsonPrimitive = string | number | boolean | null;',
		'export type JsonValue = JsonPrimitive | { [key: string]: JsonValue } | Array<JsonValue>;',
		'export type DomUnknownRecord = Record<string, unknown>;',
		'export type DomComponent<Props = Record<string, unknown>> = DefineComponent<Props, {}, any>;',
		'export type DomOptionValue = string | number | boolean | null;',
		'export interface DomOption<T = DomOptionValue> {',
		'\tlabel?: string;',
		'\tvalue?: T;',
		'\tdescription?: string;',
		'\tdisabled?: boolean;',
		'\tgroup?: string;',
		'\t[key: string]: unknown;',
		'}',
		'export interface DomRuntimePropEdit {',
		'\tlabel?: string;',
		'\tdescription?: string;',
		'\tgroup?: string;',
		'\tcomponent?: string;',
		'\toptions?: ReadonlyArray<unknown>;',
		'\tenum?: ReadonlyArray<unknown>;',
		'\tprops?: Record<string, unknown>;',
		'\tschema?: unknown;',
		'\tdetails?: unknown;',
		'\ttypeRef?: string;',
		'\t[key: string]: unknown;',
		'}',
		'export interface DomRuntimePropDefinition<T = unknown> {',
		'\ttype?: unknown;',
		'\tdefault?: T | (() => T);',
		'\trequired?: boolean;',
		'\tvalidator?: (value: T) => boolean;',
		'\t_edit?: DomRuntimePropEdit;',
		'\t[key: string]: unknown;',
		'}',
		'export type DomRuntimeProps = Record<string, DomRuntimePropDefinition | Function | Array<Function> | null>;',
		'export interface DomMenuItemRecord {',
		'\tlabel?: string;',
		'\tvalue?: string | number;',
		'\tdescription?: string;',
		'\ticon?: string;',
		'\tdisabled?: boolean;',
		'\tseparator?: boolean;',
		'\tchildren?: Array<DomMenuItemRecord>;',
		'\t[key: string]: unknown;',
		'}',
		'export interface DomCommandPaletteItem extends DomMenuItemRecord {',
		'\tkeywords?: Array<string>;',
		'\tshortcut?: string;',
		'}',
		'export interface DomJsonListSchemaField {',
		'\tkey?: string;',
		'\tname?: string;',
		'\tlabel?: string;',
		'\ttype?: string;',
		'\tplaceholder?: string;',
		'\tdefault?: unknown;',
		'\toptions?: Array<DomOption>;',
		'\t[key: string]: unknown;',
		'}',
		'export interface JsonSchema {',
		'\t$schema?: string;',
		'\ttype?: string | Array<string>;',
		'\ttitle?: string;',
		'\tdescription?: string;',
		'\tproperties?: Record<string, JsonSchema>;',
		'\titems?: JsonSchema;',
		'\trequired?: Array<string>;',
		'\tenum?: Array<unknown>;',
		'\tconst?: unknown;',
		'\tdefault?: unknown;',
		'\tformat?: string;',
		'\t[key: string]: unknown;',
		'}',
		'export interface DomFormNode {',
		'\tid?: string;',
		'\ttype?: string;',
		'\tcomponent?: string | Component;',
		'\tchildren?: DomFormChildren;',
		'\tproperties?: DomFormChildren;',
		'\titems?: DomFormNode;',
		'\tprops?: Record<string, unknown>;',
		'\ttext?: string;',
		'\tschema?: unknown;',
		'\t[key: string]: unknown;',
		'}',
		'export type DomFormChildren = Array<DomFormNode | string | number> | Record<string, DomFormNode | string | number>;',
		'export interface DomRenderSpec {',
		'\ttype?: string;',
		'\ttag?: string;',
		'\tcomponent?: string | Component;',
		'\tlabel?: string;',
		'\tprops?: Record<string, unknown>;',
		'\tchildren?: Array<DomRenderSpec | string>;',
		'\ttext?: string;',
		'\t[key: string]: unknown;',
		'}',
		'export type DomAppStackLayout = \'auto\' | \'mobile\' | \'desktop\';',
		'export interface DomAppStackScreenRecord {',
		'\tid: string;',
		'\ttitle?: string;',
		'\tlabel?: string;',
		'\tdescription?: string;',
		'\tmeta?: string;',
		'\ticon?: string;',
		'\tparent?: string;',
		'\tchildren?: Array<string>;',
		'\tcomponent?: Component | (() => Promise<unknown>);',
		'\tloader?: () => Promise<unknown>;',
		'\tprops?: Record<string, unknown>;',
		'\tdisabled?: boolean;',
		'\tloadingTitle?: string;',
		'\t[key: string]: unknown;',
		'}',
		'export interface MonthCalendarCell {',
		'\tdate: Date;',
		'\tvalue: string;',
		'\tday: number;',
		'\tweekday: string;',
		'\tlabel: string;',
		'\tcurrentMonth: boolean;',
		'\thidden: boolean;',
		'\tmonthValue: string;',
		'\trow: number;',
		'\tcolumn: number;',
		'\ttoday: boolean;',
		'\tpast: boolean;',
		'\tfuture: boolean;',
		'\tmuted: boolean;',
		'\tdisabled: boolean;',
		'}',
		'export interface MonthCalendarMonth {',
		'\tdate: Date;',
		'\tvalue: string;',
		'\tid: string;',
		'\tmonth: number;',
		'\tyear: number;',
		'\tlabel: string;',
		'\tcells: Array<MonthCalendarCell>;',
		'\tweeks: Array<{ index: number; days: Array<MonthCalendarCell> }>;',
		'}',
		...treeTypes(),
		...toastDialogTypes(),
		...validatorTypes(),
		'export interface FieldComposableState {',
		'\tid: ComputedRef<string>;',
		'\tname: ComputedRef<string>;',
		'\tpath: ComputedRef<string>;',
		'\thtmlName: ComputedRef<string>;',
		'\thtmlId: ComputedRef<string>;',
		'\tvalue: ComputedRef<unknown>;',
		'\terrors: ComputedRef<Array<string>>;',
		'\tinvalid: ComputedRef<boolean>;',
		'\tvisible: ComputedRef<boolean>;',
		'\tdisabled: ComputedRef<boolean>;',
		'\treadOnly: ComputedRef<boolean>;',
		'\tinputAttrs: ComputedRef<Record<string, unknown>>;',
		'\tfieldAttrs: ComputedRef<Record<string, unknown>>;',
		'\tsetValue(value: unknown): void;',
		'\tonInput(value: unknown): void;',
		'\tonFocus(event: FocusEvent): void;',
		'\tonBlur(event: FocusEvent): Promise<void>;',
		'\tvalidate(extraContext?: Record<string, unknown>): Promise<Array<ValidatorIssue>>;',
		'\tsetErrors(errors: unknown): void;',
		'\tclearErrors(): void;',
		'\t[key: string]: unknown;',
		'}',
	];
}

function treeTypes() {
	return [
		'export interface TreeItemAction {',
		'\tvalue?: string;',
		'\tlabel?: string;',
		'\ticon?: string;',
		'\tdisabled?: boolean;',
		'\t[key: string]: unknown;',
		'}',
		'export interface TreeItem {',
		'\tid?: string | number;',
		'\tvalue?: string | number;',
		'\tlabel?: string;',
		'\tname?: string;',
		'\ticon?: string;',
		'\trightIcon?: string;',
		'\trightIconAction?: string;',
		'\trightIconLabel?: string;',
		'\topen?: boolean;',
		'\tlazy?: boolean;',
		'\tloading?: boolean;',
		'\tdisabled?: boolean;',
		'\tdraggable?: boolean;',
		'\tacceptsChildren?: boolean;',
		'\tslot?: string;',
		'\tactions?: Array<TreeItemAction>;',
		'\tchildren?: Array<TreeItem>;',
		'\t[key: string]: unknown;',
		'}',
		'export type TreeItems = Array<TreeItem>;',
		'export interface TreeNode {',
		'\titem: TreeItem;',
		'\tvalue: string | number;',
		'\tlabel: string | number;',
		'\tdepth: number;',
		'\tparent: TreeNode | null;',
		'\tpath: Array<number>;',
		'\topen: boolean;',
		'\tloading: boolean;',
		'\texpandable: boolean;',
		'}',
		'export type TreeDropPosition = \'before\' | \'inside\' | \'after\';',
		'export type TreeDropKind = \'tree\' | \'external\';',
		'export interface TreeSelectionPayload { item: TreeItem; value: string | number; node: TreeNode; }',
		'export interface TreeActionPayload extends TreeSelectionPayload { action: TreeItemAction; }',
		'export interface TreeTogglePayload { item: TreeItem; value: string | number; open: boolean; }',
		'export interface TreeLoadChildrenPayload { item: TreeItem; value: string | number; }',
		'export interface TreeDragPreviewPayload extends TreeSelectionPayload { position: TreeDropPosition; kind: TreeDropKind; }',
		'export interface TreeDragPreviewEndPayload { value: string | number; position: TreeDropPosition; kind: TreeDropKind; }',
		'export interface TreeReorderPayload {',
		'\titems: TreeItems;',
		'\titem: TreeItem;',
		'\tsourceValue: string | number;',
		'\tsourceNode: TreeNode;',
		'\ttarget: TreeItem;',
		'\ttargetValue: string | number;',
		'\ttargetNode: TreeNode;',
		'\tposition: TreeDropPosition;',
		'}',
		'export interface TreeExternalDropPayload extends TreeSelectionPayload {',
		'\tevent: DragEvent;',
		'\tdataTransfer: DataTransfer | null;',
		'\ttypes: Array<string>;',
		'\tgetData(type: string): string;',
		'\tposition: TreeDropPosition;',
		'}',
		'export interface TreeDropCandidate {',
		'\titems: TreeItems;',
		'\titem: TreeItem;',
		'\tsourceValue: string | number;',
		'\ttarget: TreeItem;',
		'\ttargetValue: string | number;',
		'\tposition: TreeDropPosition;',
		'}',
		'export interface TreeExternalDropCandidate {',
		'\tevent: DragEvent;',
		'\tdataTransfer: DataTransfer | null;',
		'\ttypes: Array<string>;',
		'\titem: TreeItem;',
		'\tvalue: string | number;',
		'\tposition: TreeDropPosition;',
		'}',
	];
}

function toastDialogTypes() {
	return [
		'export type ToastTone = \'default\' | \'success\' | \'danger\' | \'warning\' | string;',
		'export interface ToastOptions {',
		'\tid?: string;',
		'\ttone?: ToastTone;',
		'\tduration?: number;',
		'\tdismissible?: boolean;',
		'\ttitle?: string;',
		'\tdescription?: string;',
		'\tcomponent?: Component | string;',
		'\tprops?: Record<string, unknown>;',
		'\t[key: string]: unknown;',
		'}',
		'export type ToastInput = string | ToastOptions | Component;',
		'export interface ToastApi {',
		'\ttoasts: Ref<Array<ToastOptions & { id: string }>>;',
		'\tshow(input?: ToastInput, propsOrOverrides?: Record<string, unknown> | ToastOptions, options?: ToastOptions): string;',
		'\tnormal(input?: ToastInput, propsOrOverrides?: Record<string, unknown> | ToastOptions, options?: ToastOptions): string;',
		'\tsuccess(input?: ToastInput, propsOrOverrides?: Record<string, unknown> | ToastOptions, options?: ToastOptions): string;',
		'\tdanger(input?: ToastInput, propsOrOverrides?: Record<string, unknown> | ToastOptions, options?: ToastOptions): string;',
		'\tdismiss(id: string): void;',
		'\tclear(): void;',
		'}',
		'export type DialogTone = \'default\' | \'danger\' | string;',
		'export type DialogType = \'dialog\' | \'confirm\' | \'form\' | string;',
		'export type DialogFormSchema = Array<DomFormNode>;',
		'export interface DialogOptions {',
		'\tid?: string;',
		'\ttitle?: string;',
		'\tdescription?: string;',
		'\tmessage?: string;',
		'\tcomponent?: Component | string;',
		'\tprops?: Record<string, unknown>;',
		'\tformSchema?: DialogFormSchema;',
		'\tformValues?: Record<string, unknown>;',
		'\tbackdrop?: boolean;',
		'\tstatic?: boolean;',
		'\tshowCancel?: boolean;',
		'\tfooter?: boolean;',
		'\tcancelText?: string;',
		'\tconfirmText?: string;',
		'\tinvalidMessage?: string;',
		'\ttone?: DialogTone;',
		'\ttype?: DialogType;',
		'\t[key: string]: unknown;',
		'}',
		'export type DialogInput = string | DialogOptions | Component;',
		'export type DialogPromise<T = unknown> = Promise<T> & { id: string };',
		'export interface DialogApi {',
		'\tdialogStack: Ref<Array<DialogOptions & { id: string }>>;',
		'\tshowDialog(input?: DialogInput, propsOrOptions?: Record<string, unknown> | DialogOptions, options?: DialogOptions): DialogPromise;',
		'\tconfirmDialog(input?: string | DialogOptions, options?: DialogOptions): Promise<boolean>;',
		'\tdialogForm(input: Component | DialogFormSchema, propsOrOptions?: Record<string, unknown> | DialogOptions, options?: DialogOptions): DialogPromise;',
		'\tresolveDialog(id: string, value?: unknown): void;',
		'\tdismissDialog(id: string, value?: unknown): void;',
		'\tclearDialogs(): void;',
		'}',
	];
}

function validatorTypes() {
	return [
		'export type ValidatorResult = boolean | string | null | undefined | ValidatorIssue;',
		'export interface ValidatorIssue {',
		'\tname?: string;',
		'\tcode?: string;',
		'\tmessage: string;',
		'\tmeta?: unknown;',
		'\tvalid?: boolean;',
		'}',
		'export interface ValidatorContext {',
		'\tprops?: Record<string, unknown>;',
		'\tvalidator?: ValidatorInput;',
		'\t[key: string]: unknown;',
		'}',
		'export interface DomValidator {',
		'\tname: string;',
		'\tmessage: string;',
		'\tlabel?: string;',
		'\tdescription?: string;',
		'\tprops?: DomRuntimeProps;',
		'\tvalidate(value: unknown, context?: ValidatorContext): ValidatorResult | Promise<ValidatorResult>;',
		'\t[key: string]: unknown;',
		'}',
		'export type ValidatorFunction = (value: unknown, context?: ValidatorContext) => ValidatorResult | Promise<ValidatorResult>;',
		'export type ValidatorInput = string | ValidatorFunction | DomValidator | {',
		'\tname?: string;',
		'\trule?: string;',
		'\ttype?: string;',
		'\tvalidator?: string;',
		'\tmessage?: string;',
		'\tprops?: Record<string, unknown>;',
		'\toptions?: Record<string, unknown>;',
		'\t[key: string]: unknown;',
		'};',
	];
}

function componentInterfaceLines(component, interfaceName) {
	const lines = [];
	const props = component.props || {};
	const propEntries = Object.entries(props)
		.filter(([name]) => name !== 'class' && !name.startsWith('_'));

	lines.push(`export interface ${interfaceName} {`);
	if (!propEntries.length) {
		lines.push('\t[key: string]: unknown;');
	} else {
		for (const [name, definition] of propEntries) {
			const description = propDescription(definition);
			if (description) lines.push(...jsdocLines(description, 1));
			const optional = propRequired(definition) ? '' : '?';
			lines.push(`\t${quoteProperty(name)}${optional}: ${propType(component, name, definition)};`);
		}
	}
	lines.push('}');

	if (componentDocTypes[component.name]?.length) {
		lines.unshift(`/** ${componentDocTypes[component.name].join(', ')} payload types are exported from this module. */`);
	}

	return lines;
}

function propDescription(definition) {
	if (!definition || typeof definition !== 'object') return '';
	const edit = definition._edit || {};
	const editProps = edit.props || {};
	return edit.description || editProps.description || '';
}

function propRequired(definition) {
	return Boolean(definition && typeof definition === 'object' && definition.required);
}

function propType(component, name, definition) {
	const manual = manualPropTypes[component.name]?.[name];
	if (manual) return manual;

	if (!definition || definition === String || definition === Number || definition === Boolean || definition === Array || definition === Object || definition === Function) {
		return constructorType(definition);
	}

	if (Array.isArray(definition)) {
		return unique(definition.map(constructorType)).join(' | ') || 'unknown';
	}

	if (typeof definition !== 'object') return 'unknown';

	const edit = definition._edit || {};
	const editProps = edit.props || {};
	const options = edit.options || edit.enum || editProps.options || editProps.enum;
	if (Array.isArray(options) && options.length && options.every((item) => ['string', 'number', 'boolean'].includes(typeof item))) {
		return literalUnion(options);
	}

	if (definition.type !== undefined) {
		return constructorType(definition.type);
	}

	return inferTypeFromDefault(definition.default);
}

function constructorType(value) {
	if (Array.isArray(value)) {
		return unique(value.map(constructorType)).join(' | ') || 'unknown';
	}
	if (constructorNames.has(value)) {
		return typeByConstructor[constructorNames.get(value)] || 'unknown';
	}
	if (typeof value === 'function') {
		return typeByConstructor[value.name] || 'unknown';
	}
	return 'unknown';
}

function inferTypeFromDefault(value) {
	if (Array.isArray(value)) return 'Array<unknown>';
	if (value === null || value === undefined) return 'unknown';
	if (typeof value === 'function') return 'unknown';
	if (typeof value === 'string') return 'string';
	if (typeof value === 'number') return 'number';
	if (typeof value === 'boolean') return 'boolean';
	if (typeof value === 'object') return 'Record<string, unknown>';
	return 'unknown';
}

function literalUnion(values) {
	return unique(values.map((value) => JSON.stringify(value))).join(' | ');
}

function quoteProperty(name) {
	return /^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name);
}

function jsdocLines(text, depth = 0) {
	const indent = '\t'.repeat(depth);
	const normalized = String(text).replace(/\*\//g, '* /').split('\n').map((line) => line.trim());
	return [
		`${indent}/**`,
		...normalized.map((line) => `${indent} * ${line}`),
		`${indent} */`,
	];
}

function libraryFunctionTypes() {
	return [
		'export declare const popoverProps: DomRuntimeProps;',
		'export declare const calendarProps: DomRuntimeProps;',
		'export declare const monthCalendarProps: DomRuntimeProps;',
		'export declare const fieldProps: DomRuntimeProps;',
		'export declare const fieldLayoutProviderKey: InjectionKey<unknown>;',
		'export declare const formFieldProviderKey: InjectionKey<unknown>;',
		'export declare const fieldDisplayProviderKey: InjectionKey<unknown>;',
		'export declare const FORM_NODE_RESERVED_KEYS: Set<string>;',
		'export declare const defaultComponentByType: Record<string, string>;',
		'export declare const typeByComponent: Record<string, string>;',
		'export declare const forms: Record<string, unknown>;',
		'',
		'export declare function useToasts(defaults?: ToastOptions): ToastApi;',
		'export declare function useDialogs(defaults?: DialogOptions): DialogApi;',
		'export declare function sha1PasswordHash(password: string): Promise<string>;',
		'export declare function checkCompromisedPassword(password: string, options?: { signal?: AbortSignal }): Promise<number>;',
		'export declare function normalizeErrors(errors: unknown): Array<string>;',
		'export declare function useField(props: Record<string, unknown>, emit?: (event: string, ...args: Array<unknown>) => void, options?: Record<string, unknown>): FieldComposableState;',
		'',
		'export declare function treeItemValue(item: TreeItem | null | undefined): string | number | undefined;',
		'export declare function treeItemLabel(item: TreeItem | null | undefined): string | number | undefined;',
		'export declare function treeItemChildren(item: TreeItem | null | undefined): Array<TreeItem>;',
		'export declare function visitTreeItems(items: TreeItems, callback: (item: TreeItem) => void): void;',
		'export declare function seedTreeOpenValues(items: TreeItems, controlled?: Array<string | number>, previous?: Set<string>): Array<string>;',
		'export declare function treeItemHasChildren(item: TreeItem | null | undefined): boolean;',
		'export declare function treeItemCanAcceptChildren(item: TreeItem | null | undefined): boolean;',
		'export declare function flattenTreeItems(items: TreeItems, openValues: Set<string>, depth?: number, parent?: TreeNode | null, path?: Array<number>): Array<TreeNode>;',
		'export declare function indexTreeItems(items: TreeItems): Map<string, { item: TreeItem; path: Array<number>; parent: TreeItem | null }>;',
		'export declare function cloneTreeItems<T extends TreeItem>(items: Array<T>): Array<T>;',
		'export declare function moveTreeItem(items: TreeItems, sourceValue: string | number, targetValue: string | number, position: TreeDropPosition): { items: TreeItems; item: TreeItem } | null;',
		'export declare function isSameOrDescendantPath(path: Array<number>, possibleParentPath: Array<number>): boolean;',
		'',
		'export declare function createValidator(name: string, validate: ValidatorFunction, message?: string, options?: Record<string, unknown>): DomValidator;',
		'export declare function defineValidator(definition: DomValidator): DomValidator | null;',
		'export declare function getValidator(name: string): DomValidator | null;',
		'export declare function listValidators(): Array<DomValidator>;',
		'export declare function compileValidator(validator: ValidatorInput): DomValidator | null;',
		'export declare function compileValidators(validators?: Array<ValidatorInput>): Array<DomValidator>;',
		'export declare function normalizeValidatorResult(result: ValidatorResult, validator: DomValidator): ValidatorIssue | null;',
		'export declare const requiredValidator: DomValidator;',
		'export declare const emailValidator: DomValidator;',
		'export declare const urlValidator: DomValidator;',
		'export declare const minLengthValidator: DomValidator;',
		'export declare const maxLengthValidator: DomValidator;',
		'export declare const lengthValidator: DomValidator;',
		'export declare const patternValidator: DomValidator;',
		'export declare const minValidator: DomValidator;',
		'export declare const maxValidator: DomValidator;',
		'export declare const betweenValidator: DomValidator;',
		'export declare const numberValidator: DomValidator;',
		'export declare const integerValidator: DomValidator;',
		'export declare const oneOfValidator: DomValidator;',
		'',
		'export declare function createFormRegistry(): Record<string, unknown>;',
		'export declare function getPathValue(source: unknown, path: string): unknown;',
		'export declare function setPathValue(source: Record<string, unknown> | Array<unknown>, path: string, value: unknown): void;',
		'export declare function registerFormType(name: string, definition: DomFormNode): DomFormNode | null;',
		'export declare function getFormType(name: string): DomFormNode | null;',
		'export declare function normalizeFormNode(node: unknown, context?: Record<string, unknown>): DomFormNode | null;',
		'export declare function normalizeFormChildren(children: DomFormChildren): Array<DomFormNode>;',
		'export declare function formNodeDefaultValue(node: DomFormNode, context?: Record<string, unknown>): unknown;',
		'export declare function formDefinitionToJsonSchema(definition: DomFormNode | DomFormChildren): JsonSchema;',
		'export declare function formNodeToJsonSchema(node: DomFormNode): JsonSchema;',
		'export declare function schemaToChildren(schema: unknown, options?: Record<string, unknown>, adapters?: Array<SchemaAdapter>): Array<DomFormNode>;',
		'export declare function isJsonSchema(schema: unknown): schema is JsonSchema;',
		'export declare function jsonSchemaToChildren(schema: JsonSchema, options?: Record<string, unknown>): Array<DomFormNode>;',
		'export declare function isZodLikeSchema(schema: unknown): boolean;',
		'export declare function zodSchemaToChildren(schema: unknown, options?: Record<string, unknown>): Array<DomFormNode>;',
		'export interface SchemaAdapter {',
		'\tname: string;',
		'\tmatches(schema: unknown, options?: Record<string, unknown>): boolean;',
		'\ttoChildren(schema: unknown, options?: Record<string, unknown>): Array<DomFormNode>;',
		'}',
		'export declare const jsonSchemaAdapter: SchemaAdapter;',
		'export declare const zodSchemaAdapter: SchemaAdapter;',
		'export declare const builtInSchemaAdapters: Array<SchemaAdapter>;',
	];
}

function writeHeadlessTypes() {
	const files = {
		'base.d.ts': headlessBaseTypes(),
		'floating.d.ts': headlessFloatingTypes(),
		'popover-panel.d.ts': headlessPopoverPanelTypes(),
		'transitions.d.ts': headlessTransitionTypes(),
		'dropdown.d.ts': elementType('DomDropdownElement', ['open: boolean;', 'toggle(): void;']),
		'popover.d.ts': elementType('DomPopoverElement', ['open: boolean;', 'toggle(): void;']),
		'dialog.d.ts': elementType('DomDialogElement', ['isOpen: boolean;', 'open(): void;', 'close(): void;', 'toggle(): void;', 'show(): void;', 'hide(): void;']),
		'drawer.d.ts': elementType('DomDrawerElement', ['open: boolean;', 'show(): void;', 'hide(): void;', 'toggle(): void;']),
		'toggle.d.ts': elementType('DomToggleElement', ['checked: boolean;', 'toggle(): void;']),
		'checkbox.d.ts': elementType('DomCheckboxElement', ['checked: boolean;', 'toggle(): void;']),
		'radio-group.d.ts': elementType('DomRadioGroupElement', ['value: string;', 'readonly radios: Array<HTMLElement>;']),
		'listbox.d.ts': elementType('DomListboxElement', ['value: string;', 'readonly options: Array<HTMLElement>;']),
		'menu.d.ts': elementType('DomMenuElement', ['readonly items: Array<HTMLElement>;']),
		'tabs.d.ts': elementType('DomTabsElement', ['value: string | null;']),
		'combobox.d.ts': comboTypes(),
		'autocomplete.d.ts': autocompleteTypes(),
		'tooltip.d.ts': elementType('DomTooltipElement'),
		'accordion.d.ts': accordionTypes(),
		'toast.d.ts': toastTypes(),
		'index.d.ts': [
			'export * from \'./base.js\';',
			'export * from \'./floating.js\';',
			'export * from \'./dropdown.js\';',
			'export * from \'./dialog.js\';',
			'export * from \'./popover.js\';',
			'export * from \'./tabs.js\';',
			'export * from \'./toggle.js\';',
			'export * from \'./checkbox.js\';',
			'export * from \'./radio-group.js\';',
			'export * from \'./tooltip.js\';',
			'export * from \'./accordion.js\';',
			'export * from \'./menu.js\';',
			'export * from \'./listbox.js\';',
			'export * from \'./combobox.js\';',
			'export * from \'./autocomplete.js\';',
			'export * from \'./drawer.js\';',
			'export * from \'./toast.js\';',
			'',
		].join('\n'),
	};

	for (const [name, contents] of Object.entries(files)) {
		writeFile(path.join(headlessDir, name), withGeneratedHeader(contents));
	}
}

function headlessBaseTypes() {
	return [
		'export declare const isBrowser: boolean;',
		'export declare function uid(prefix?: string): string;',
		'export declare function defineDomElement(name: string, ctor: CustomElementConstructor): void;',
		'export declare class DomElementBase extends HTMLElement {',
		'\temit<T = unknown>(type: string, detail?: T): void;',
		'\ton(target: EventTarget, type: string, handler: EventListenerOrEventListenerObject, opts?: AddEventListenerOptions | boolean): () => void;',
		'\tdisconnectedCallback(): void;',
		'\tboolAttr(name: string): boolean;',
		'\tsetBoolAttr(name: string, value: boolean): void;',
		'}',
		'export declare function focusTrap(container: HTMLElement): () => void;',
		'export interface RovingOptions {',
		'\titems?: Array<HTMLElement>;',
		'\torientation?: \'horizontal\' | \'vertical\';',
		'\tloop?: boolean;',
		'\tonSelect?: (index: number, item: HTMLElement) => void;',
		'}',
		'export interface RovingController {',
		'\treadonly index: number;',
		'\tsetActive(index: number, options?: { focus?: boolean; select?: boolean }): void;',
		'\tonKey(event: KeyboardEvent): void;',
		'}',
		'export declare function createRoving(options?: RovingOptions): RovingController;',
		'',
	].join('\n');
}

function headlessFloatingTypes() {
	return [
		'export type FloatingSide = \'top\' | \'right\' | \'bottom\' | \'left\';',
		'export type FloatingAlign = \'start\' | \'center\' | \'end\' | \'left\' | \'right\';',
		'export type FloatingMode = \'viewport\' | \'anchor\' | \'element\';',
		'export interface FloatingPositionOptions {',
		'\tplacement?: FloatingSide | `${FloatingSide}-${\'start\' | \'center\' | \'end\'}`;',
		'\talign?: FloatingAlign;',
		'\toffset?: number;',
		'\tpadding?: number;',
		'\tmode?: FloatingMode;',
		'\tfloatingMode?: FloatingMode;',
		'\tflip?: boolean;',
		'\tshift?: boolean;',
		'\tstrategy?: \'fixed\' | \'absolute\';',
		'}',
		'export interface FloatingPositionResult {',
		'\tx: number;',
		'\ty: number;',
		'\tmode: \'viewport\' | \'anchor\';',
		'\tside: FloatingSide;',
		'\talign: \'start\' | \'center\' | \'end\';',
		'\tplacement: string;',
		'\tflipped: boolean;',
		'\tcollision: Record<FloatingSide, number>;',
		'\tcollisionSides: Array<FloatingSide>;',
		'\toverflow: Record<FloatingSide, number>;',
		'\toverflowSides: Array<FloatingSide>;',
		'\tavailableWidth: number;',
		'\tavailableHeight: number;',
		'}',
		'export declare function computeFloatingPosition(referenceEl: Element, floatingEl: HTMLElement, options?: FloatingPositionOptions): FloatingPositionResult | null;',
		'export declare function applyFloatingPosition(referenceEl: Element, floatingEl: HTMLElement, options?: FloatingPositionOptions): FloatingPositionResult | null;',
		'export declare function autoUpdateFloating(referenceEl: Element, floatingEl: HTMLElement, update: () => void): () => void;',
		'',
	].join('\n');
}

function headlessPopoverPanelTypes() {
	return [
		'import type { FloatingPositionOptions, FloatingPositionResult } from \'./floating.js\';',
		'export declare function preparePopoverPanel(panel: HTMLElement | null, trigger?: HTMLElement | null): void;',
		'export declare function setPopoverOpen(panel: HTMLElement | null, open: boolean): void;',
		'export declare function openPopoverPanel(panel: HTMLElement | null, trigger?: HTMLElement | null, options?: FloatingPositionOptions, afterPlace?: () => void): void;',
		'export declare function closePopoverPanel(panel: HTMLElement | null, options?: { immediate?: boolean }): void;',
		'export declare function isPopoverOpen(panel: HTMLElement | null): boolean;',
		'export declare function positionPopoverPanel(panel: HTMLElement | null, trigger: HTMLElement | null, options?: FloatingPositionOptions & { animatePlacement?: boolean }): FloatingPositionResult | undefined;',
		'export declare function attachPopoverReflow(panel: HTMLElement, trigger: HTMLElement, options?: FloatingPositionOptions): () => void;',
		'export declare function readFloatingPositionOptions(host: HTMLElement, defaults?: FloatingPositionOptions): FloatingPositionOptions;',
		'export declare function bindFloatingReflow(host: HTMLElement & { _reflowOff?: (() => void) | null }, panel: HTMLElement, trigger: HTMLElement, options?: FloatingPositionOptions): void;',
		'export declare function unbindFloatingReflow(host: HTMLElement & { _reflowOff?: (() => void) | null }): void;',
		'export declare function syncFloatingScrollLock(host: HTMLElement & Record<string, unknown>, panel: HTMLElement, next: boolean, stateKey?: string): void;',
		'export declare function bindPopoverToggle(panel: HTMLElement, handler: (open: boolean) => void): () => void;',
		'export declare function lockDocumentScroll(panel?: HTMLElement | null): void;',
		'export declare function unlockDocumentScroll(panel?: HTMLElement | null): void;',
		'export declare function ensurePopoverPanelStyles(): void;',
		'',
	].join('\n');
}

function headlessTransitionTypes() {
	return [
		'export declare function hasCustomTransitions(host: HTMLElement): boolean;',
		'export declare function runEnter(host: HTMLElement, el: HTMLElement, options?: { signal?: AbortSignal }): Promise<void>;',
		'export declare function runLeave(host: HTMLElement, el: HTMLElement, options?: { signal?: AbortSignal }): Promise<void>;',
		'',
	].join('\n');
}

function elementType(className, members = []) {
	return [
		'import { DomElementBase } from \'./base.js\';',
		'export declare class ' + className + ' extends DomElementBase {',
		'\tstatic readonly observedAttributes?: Array<string>;',
		'\tstatic readonly __doc?: HeadlessElementDoc;',
		...members.map((member) => `\t${member}`),
		'}',
		'export interface HeadlessElementDoc {',
		'\tname?: string;',
		'\tdescription?: string;',
		'\tslots?: Array<Record<string, unknown>>;',
		'\tattributes?: Array<Record<string, unknown>>;',
		'\tevents?: Array<Record<string, unknown>>;',
		'\tkeyboard?: Array<Record<string, unknown>>;',
		'\texample?: string;',
		'\t[key: string]: unknown;',
		'}',
		'',
	].join('\n');
}

function comboTypes() {
	return [
		'import { DomElementBase } from \'./base.js\';',
		'export declare class ComboBase extends DomElementBase {',
		'\tvalue: string;',
		'}',
		'export declare class DomComboboxElement extends ComboBase {}',
		'',
	].join('\n');
}

function autocompleteTypes() {
	return [
		'import { ComboBase } from \'./combobox.js\';',
		'export declare class DomAutocompleteElement extends ComboBase {}',
		'',
	].join('\n');
}

function accordionTypes() {
	return [
		'import { DomElementBase } from \'./base.js\';',
		'export declare class DomAccordionItemElement extends DomElementBase {',
		'\ttoggle(): void;',
		'}',
		'export declare class DomAccordionElement extends DomElementBase {}',
		'',
	].join('\n');
}

function toastTypes() {
	return [
		'import { DomElementBase } from \'./base.js\';',
		'export interface HeadlessToastOptions {',
		'\ttitle?: string;',
		'\tdescription?: string;',
		'\tduration?: number;',
		'\ttone?: string;',
		'\t[key: string]: unknown;',
		'}',
		'export declare class DomToastRegionElement extends DomElementBase {',
		'\tshow(options?: HeadlessToastOptions): string;',
		'}',
		'',
	].join('\n');
}

function withGeneratedHeader(contents) {
	return [
		'/* eslint-disable */',
		'// Generated by scripts/generate-types.mjs. Do not edit by hand.',
		contents.trimEnd(),
		'',
	].join('\n');
}

function writeFile(file, contents) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, contents);
}

function unique(values) {
	return [...new Set(values.filter(Boolean))];
}

function escapeRegExp(value) {
	return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
