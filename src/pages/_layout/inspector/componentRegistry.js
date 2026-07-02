import { markRaw } from 'vue';
import { getRuntimeComponentRecords } from '../componentRuntimeRecords.js';
import { getComponentProps, getStudioMeta, inspectComponentRecord } from '../componentInspector.js';

const GROUP_ORDER = ['DOM Studio', 'Forms', 'Visual', 'HTML', 'Content'];

const SAMPLE_PROPS = {
	DomAccordion: {
		items: [
			{ title: 'Section A', content: 'Content for the first section.' },
			{ title: 'Section B', content: 'Content for the second section.' },
		],
	},
	DomAutocomplete: {
		placeholder: 'Search...',
		options: [
			{ label: 'Apple', value: 'apple' },
			{ label: 'Banana', value: 'banana' },
			{ label: 'Cherry', value: 'cherry' },
		],
	},
	DomCalendar: {
		label: 'Date',
		description: 'Pick a date.',
		modelValue: '2026-06-18',
		initialMonth: 6,
		initialYear: 2026,
	},
	DomCard: {
		class: 'w-full max-w-sm',
	},
	DomCheckbox: {
		modelValue: true,
		label: 'Product updates',
	},
	DomCodeInput: {
		label: 'Code',
		lang: 'json',
		modelValue: '{\n\t"name": "DOM Studio"\n}',
		rows: 8,
	},
	DomColorInput: {
		label: 'Accent',
		modelValue: '#0ea5e9',
	},
	DomCombobox: {
		placeholder: 'Search...',
		options: [
			{ label: 'Apple', value: 'apple' },
			{ label: 'Banana', value: 'banana' },
			{ label: 'Cherry', value: 'cherry' },
		],
	},
	DomTagCombobox: {
		label: 'Classes',
		modelValue: ['bg-white', 'text-sm'],
		allowCustom: true,
		options: [
			{ label: 'bg-white', value: 'bg-white' },
			{ label: 'text-sm', value: 'text-sm' },
			{ label: 'rounded-xl', value: 'rounded-xl' },
		],
	},
	DomClassToggleInput: {
		label: 'Classes',
		modelValue: 'flex min-w-0 text-2xl',
		inactiveValues: ['md:h-full'],
		options: [
			'flex',
			'min-w-0',
			'text-2xl',
			'md:h-full',
			'md:overflow-y-auto',
		],
	},
	DomCommandPalette: {
		commands: [
			{ label: 'Open dashboard', value: 'dashboard' },
			{ label: 'Create project', value: 'project' },
			{ label: 'Invite teammate', value: 'invite' },
		],
		placeholder: 'Search commands...',
	},
	DomDropdown: {
		items: [
			{ label: 'First option', value: 'a' },
			{ label: 'Second option', value: 'b' },
			{ label: 'Third option', value: 'c' },
		],
		label: 'Choose...',
		align: 'left',
	},
	DomJsonInput: {
		label: 'JSON',
		description: 'Valid JSON emits parsed data.',
		modelValue: { name: 'DOM Studio', editable: true },
		rows: 8,
	},
	DomJsonListInput: {
		label: 'Items',
		addLabel: '+ Add item',
		modelValue: [
			{ label: 'Item 1', value: 'one' },
			{ label: 'Item 2', value: 'two' },
		],
		schema: [
			{ key: 'label', label: 'Label', placeholder: 'Item label', default: (index) => `Item ${index + 1}` },
			{ key: 'value', label: 'Value', placeholder: 'item-value', default: (index) => `item-${index + 1}` },
		],
	},
	DomListbox: {
		modelValue: 'medium',
		options: [
			{ label: 'Small', value: 'small' },
			{ label: 'Medium', value: 'medium' },
			{ label: 'Large', value: 'large' },
		],
	},
	DomMenu: {
		items: [
			{ label: 'Rename', value: 'rename' },
			{ label: 'Duplicate', value: 'duplicate' },
			{ label: 'Delete', value: 'delete', tone: 'danger' },
		],
	},
	DomNativeSelect: {
		label: 'Workspace',
		options: [
			{ label: 'Design system', value: 'design' },
			{ label: 'Marketing site', value: 'marketing' },
		],
		modelValue: 'design',
	},
	DomNumberInput: {
		label: 'Quantity',
		modelValue: 0,
	},
	DomPasswordInput: {
		label: 'Password',
		description: 'Use a strong password.',
		modelValue: 'correct-horse',
	},
	DomRadioGroup: {
		label: 'Plan',
		modelValue: 'team',
		options: [
			{ label: 'Solo', value: 'solo' },
			{ label: 'Team', value: 'team' },
		],
	},
	DomSelectInput: {
		label: 'Pick one',
		options: ['One', 'Two', 'Three'],
		modelValue: 'One',
	},
	DomTabs: {
		tabs: [
			{ key: 'overview', label: 'Overview' },
			{ key: 'settings', label: 'Settings' },
		],
		modelValue: 'overview',
	},
	DomTextInput: {
		label: 'Label',
		placeholder: 'Type here...',
	},
	DomTextareaInput: {
		label: 'Label',
		placeholder: 'Tell us more...',
		rows: 3,
	},
	DomToastStack: {
		toasts: [
			{ id: 'saved', title: 'Successfully saved', description: 'Your changes have been stored.', tone: 'success', duration: 0 },
		],
	},
	DomTooltip: {
		text: 'Tooltip text',
	},
	DomToggle: {
		modelValue: true,
		label: 'Notifications',
	},
};

const SAMPLE_CHILDREN = {
	DomButton: [{ id: null, text: 'Button' }],
	DomCard: [
		{
			id: null,
			component: 'h3',
			props: { class: 'text-lg font-semibold tracking-tight' },
			children: [{ id: null, text: 'Card title' }],
		},
		{
			id: null,
			component: 'p',
			props: { class: 'mt-2 text-sm leading-6 text-muted-fg' },
			children: [{ id: null, text: 'Drop content into this visual surface.' }],
		},
	],
	DomDialog: [{ id: null, text: 'Dialog content.' }],
	DomDrawer: [{ id: null, text: 'Drawer content.' }],
	DomPopover: [{ id: null, text: 'Popover content.' }],
	DomTooltip: [{ id: null, text: 'Hover me' }],
};

/**
 * Builds a palette entry from a discovered DOM Studio component record.
 *
 * @param {object} record Inspected component record.
 * @returns {object} Component palette entry.
 */
function buildComponentEntry(record) {
	const { exportName, component, section } = record;
	const meta = record.studio || getStudioMeta(component);
	const label = meta.label || record.label || labelFromExport(exportName);
	const accepts = meta.accepts || inferAccepts(exportName, component);
	const defaults = {
		props: {
			...inferDefaultProps(exportName, component, label),
			...(meta.defaults?.props || {}),
		},
	};
	const children = meta.defaults?.children || SAMPLE_CHILDREN[exportName];
	if (children) defaults.children = children;
	if (meta.defaults?.text) defaults.text = meta.defaults.text;

	return {
		id: meta.id || idFromExport(exportName),
		label,
		group: meta.group || groupFromSection(section),
		component: markRaw(component),
		componentName: exportName,
		tag: component.__doc?.tag,
		icon: meta.icon || record.icon || label.charAt(0),
		accepts,
		defaults,
		hints: meta.hints || {},
	};
}

/**
 * Infers sensible starter props for a component dropped into the editor.
 *
 * @param {string} exportName Component export name.
 * @param {object} component Vue component object.
 * @param {string} label Display label for label-like props.
 * @returns {object} Default props for a new component node.
 */
function inferDefaultProps(exportName, component, label) {
	const props = {};
	for (const [key, def] of Object.entries(getComponentProps(component))) {
		if (key === 'class' || key === 'modelModifiers') continue;
		const value = propDefaultValue(def);
		if (value !== undefined) props[key] = value;
	}

	const componentProps = getComponentProps(component);
	if ('label' in componentProps && props.label == null) props.label = label;
	if ('placeholder' in componentProps && props.placeholder == null) props.placeholder = 'Type here...';
	if ('description' in componentProps && props.description == null) props.description = '';
	if ('modelValue' in componentProps && props.modelValue == null) {
		props.modelValue = emptyValueForProp(componentProps.modelValue);
	}
	if ('options' in componentProps && !props.options) props.options = defaultOptions();
	if ('items' in componentProps && !props.items) props.items = defaultItems(exportName);
	if ('commands' in componentProps && !props.commands) props.commands = defaultCommands();
	if ('tabs' in componentProps && !props.tabs) props.tabs = defaultTabs();
	if ('toasts' in componentProps && !props.toasts) props.toasts = defaultToasts();

	return {
		...props,
		...(SAMPLE_PROPS[exportName] || {}),
	};
}

/**
 * Reads a prop default without letting unsafe or failing factories break setup.
 *
 * @param {object} def Vue prop definition.
 * @returns {unknown} Default value, or undefined when unavailable.
 */
function propDefaultValue(def) {
	if (!def || typeof def !== 'object' || !('default' in def)) return undefined;
	if (typeof def.default === 'function' && def.type !== Function) {
		try {
			return def.default();
		} catch {
			return undefined;
		}
	}
	return def.default;
}

/**
 * Creates an empty v-model value that matches a prop constructor.
 *
 * @param {object} def Vue prop definition.
 * @returns {unknown} Empty value for the prop type.
 */
function emptyValueForProp(def) {
	const type = Array.isArray(def?.type) ? def.type : [def?.type];
	if (type.includes(Boolean)) return false;
	if (type.includes(Number)) return 0;
	if (type.includes(Array)) return [];
	if (type.includes(Object)) return {};
	return '';
}

/**
 * Provides generic option records for controls that need selectable choices.
 *
 * @returns {Array<object>} Default option records.
 */
function defaultOptions() {
	return [
		{ label: 'Small', value: 'small' },
		{ label: 'Medium', value: 'medium' },
		{ label: 'Large', value: 'large' },
	];
}

/**
 * Provides generic item records for list-like DOM Studio components.
 *
 * @param {string} exportName Component export name.
 * @returns {Array<object>} Default item records.
 */
function defaultItems(exportName) {
	if (exportName === 'DomAccordion') {
		return [
			{ title: 'Section A', content: 'Content for the first section.' },
			{ title: 'Section B', content: 'Content for the second section.' },
		];
	}
	return [
		{ label: 'First option', value: 'a' },
		{ label: 'Second option', value: 'b' },
		{ label: 'Third option', value: 'c' },
	];
}

/**
 * Provides generic command records for command-palette-like components.
 *
 * @returns {Array<object>} Default command records.
 */
function defaultCommands() {
	return [
		{ label: 'Open dashboard', value: 'dashboard' },
		{ label: 'Create project', value: 'project' },
		{ label: 'Invite teammate', value: 'invite' },
	];
}

/**
 * Provides generic tab records for tab-like components.
 *
 * @returns {Array<object>} Default tab records.
 */
function defaultTabs() {
	return [
		{ key: 'overview', label: 'Overview' },
		{ key: 'settings', label: 'Settings' },
	];
}

/**
 * Provides a generic toast record for toast stack previews.
 *
 * @returns {Array<object>} Default toast records.
 */
function defaultToasts() {
	return [
		{ id: 'saved', title: 'Successfully saved', description: 'Your changes have been stored.', tone: 'success', duration: 0 },
	];
}

/**
 * Infers whether a component can accept child nodes in the editor.
 *
 * @param {string} exportName Component export name.
 * @param {object} component Vue component object.
 * @returns {'children'|'none'} Editor child-acceptance mode.
 */
function inferAccepts(exportName, component) {
	if (SAMPLE_CHILDREN[exportName]) return 'children';
	const slots = component.__doc?.slots || [];
	return slots.some((slot) => slot.name === '(default)' || slot.name === 'default') ? 'children' : 'none';
}

/**
 * Maps a source section to an editor palette group.
 *
 * @param {string} section Component source section.
 * @returns {string} Palette group label.
 */
function groupFromSection(section) {
	return {
		components: 'DOM Studio',
		forms: 'Forms',
		visual: 'Visual',
	}[section] || 'DOM Studio';
}

/**
 * Creates a stable palette id from a component export name.
 *
 * @param {string} name Component export name.
 * @returns {string} Palette id.
 */
function idFromExport(name) {
	return name
		.replace(/^El/, 'el')
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.toLowerCase();
}

/**
 * Creates a human-readable label from a component export name.
 *
 * @param {string} name Component export name.
 * @returns {string} Display label.
 */
function labelFromExport(name) {
	return name
		.replace(/^El/, '')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/^./, (c) => c.toUpperCase());
}

/**
 * Sorts palette entries by group priority and then label.
 *
 * @param {object} a First palette entry.
 * @param {object} b Second palette entry.
 * @returns {number} Sort comparison result.
 */
function sortEntries(a, b) {
	const groupDelta = GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group);
	if (groupDelta) return groupDelta;
	return a.label.localeCompare(b.label);
}

// ---------------- HTML primitives ------------------------------------------
const htmlEntries = [
	{
		id: 'html-div',
		label: 'Container',
		group: 'HTML',
		component: 'div',
		icon: '▢',
		accepts: 'children',
		defaults: {
			props: { class: 'flex flex-col gap-3 rounded-2xl border border-border bg-canvas p-6' },
		},
	},
	{
		id: 'html-row',
		label: 'Row',
		group: 'HTML',
		component: 'div',
		icon: '⇆',
		accepts: 'children',
		defaults: { props: { class: 'flex items-center gap-3' } },
	},
	{
		id: 'html-heading',
		label: 'Heading',
		group: 'HTML',
		component: 'h3',
		icon: 'H',
		accepts: 'children',
		defaults: {
			props: { class: 'text-2xl font-bold tracking-tight text-canvas-fg' },
			children: [{ id: null, text: 'Heading' }],
		},
	},
	{
		id: 'html-paragraph',
		label: 'Paragraph',
		group: 'HTML',
		component: 'p',
		icon: '¶',
		accepts: 'children',
		defaults: {
			props: { class: 'text-sm leading-relaxed text-muted-fg' },
			children: [{ id: null, text: 'Body copy lives here.' }],
		},
	},
	{
		id: 'html-span',
		label: 'Span',
		group: 'HTML',
		component: 'span',
		icon: '⎯',
		accepts: 'children',
		defaults: {
			props: {},
			children: [{ id: null, text: 'inline' }],
		},
	},
	{
		id: 'html-badge',
		label: 'Badge',
		group: 'HTML',
		component: 'span',
		icon: '▣',
		accepts: 'children',
		defaults: {
			props: { class: 'inline-flex rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-fg' },
			children: [{ id: null, text: 'New' }],
		},
	},
	{
		id: 'html-img',
		label: 'Image',
		group: 'HTML',
		component: 'img',
		icon: '◧',
		accepts: 'none',
		defaults: { props: { src: 'https://placehold.co/240x160', alt: '', class: 'rounded-xl' } },
	},
	{
		id: 'html-text',
		label: 'Text',
		group: 'Content',
		component: null,
		icon: 'T',
		accepts: 'none',
		defaults: { text: 'Edit me' },
	},
];

const discoveredEntries = getRuntimeComponentRecords()
	.map(inspectComponentRecord)
	.filter((record) => !record.studioHidden)
	.map(buildComponentEntry)
	.sort(sortEntries);
const entries = [...discoveredEntries, ...htmlEntries];

export const componentRegistry = entries;
export const groupedRegistry = entries.reduce((acc, entry) => {
	(acc[entry.group] ||= []).push(entry);
	return acc;
}, {});

/**
 * Finds the palette entry for a rendered component, component name, or node type.
 *
 * @param {object|string|null} component Component object, component name, native tag, or null text node.
 * @returns {object|undefined|null} Matching palette entry.
 */
export function lookupEntry(component) {
	if (component == null) return entries.find((e) => e.id === 'html-text');
	const direct = entries.find((e) => e.component === component);
	if (direct) return direct;
	if (typeof component === 'string') return lookupByName(component);
	return lookupByName(component?.name || component?.__name || component?.__doc?.tag || component?.__doc?.name);
}

/**
 * Finds a palette entry by its stable type id.
 *
 * @param {string} typeId Palette type id.
 * @returns {object|undefined} Matching palette entry.
 */
export function lookupById(typeId) {
	return entries.find((e) => e.id === typeId);
}

/**
 * Finds a palette entry by any normalized component or display name.
 *
 * @param {string} name Component name, tag, id, or display label.
 * @returns {object|null} Matching palette entry.
 */
export function lookupByName(name) {
	if (!name) return null;
	const normalized = normalizeName(name);
	return entries.find((entry) => {
		const names = [
			entry.id,
			entry.label,
			entry.componentName,
			entry.tag,
			typeof entry.component === 'string' ? entry.component : null,
			entry.component?.name,
			entry.component?.__name,
			entry.component?.__doc?.tag,
			entry.component?.__doc?.name,
		];
		return names.some((candidate) => normalizeName(candidate) === normalized);
	}) || null;
}

/**
 * Normalizes component names, tags, and labels for fuzzy registry lookup.
 *
 * @param {string} name Source name.
 * @returns {string} Normalized lookup key.
 */
function normalizeName(name) {
	return String(name || '')
		.replace(/[<>]/g, '')
		.replace(/^El/, 'el')
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

/**
 * Determines whether an inspector node is a pure text node.
 *
 * @param {object} node Inspector node.
 * @returns {boolean} True when the node carries text content instead of a component.
 */
export function isTextNode(node) {
	return !!(node && node.component == null && node.text != null);
}

/**
 * Determines whether an inspector node can contain child nodes.
 *
 * @param {object} node Inspector node.
 * @returns {boolean} True when children can be inserted.
 */
export function canHaveChildren(node) {
	if (!node) return false;
	if (isTextNode(node)) return false;
	const entry = lookupEntry(node.component);
	if (entry) return entry.accepts !== 'none';
	if (typeof node.component === 'string') {
		return !['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr'].includes(node.component);
	}
	return false;
}
