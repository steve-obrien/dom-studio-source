/**
 * Type registry: what each kind of node is and how it is edited.
 *
 * A node's `type` (`html:div`, `vue:DomButton`, `text`) names an entry here.
 * The entry tells every editor what it needs, so no editor hand-writes an
 * inspector per type:
 *
 * ```js
 * {
 * 	type: 'html:a',
 * 	label: 'Link',
 * 	adapter: 'html',          // html | vue | react | poster
 * 	tag: 'a',                 // the element or component name in markup
 * 	container: true,          // whether it accepts child nodes
 * 	schema: [                 // inspector fields, rendered by InspectorField
 * 		{ key: 'href', label: 'Link to', component: 'DomTextInput' },
 * 	],
 * 	defaults: { props: { href: '#' }, children: [{ type: 'text', props: { value: 'Learn more' } }] },
 * }
 * ```
 *
 * Schema fields use the same shape as `inferSchema` in the inspector, so
 * component `_edit` metadata and hand-written HTML fields are interchangeable.
 */

/**
 * Creates a registry. `fallback` builds an entry for a type nobody defined,
 * such as a local component in an imported file.
 *
 * @param {{ fallback?: (type: string) => object|null }} [options] Fallback factory.
 * @returns {{ define: (entry: object) => object, get: (type: string) => object|null, has: (type: string) => boolean, list: () => Array<object> }}
 */
export function createTypeRegistry({ fallback = defaultFallback } = {}) {
	const entries = new Map();
	const fallbacks = new Map();
	return {
		define(entry) {
			if (!entry?.type) throw new Error('A type needs a name.');
			const normalised = normaliseType(entry);
			entries.set(entry.type, normalised);
			fallbacks.delete(entry.type);
			return normalised;
		},
		get(type) {
			if (entries.has(type)) return entries.get(type);
			if (!fallbacks.has(type)) fallbacks.set(type, fallback(type) ? normaliseType(fallback(type)) : null);
			return fallbacks.get(type);
		},
		has: (type) => entries.has(type),
		list: () => [...entries.values()],
	};
}

/** Fills optional fields so editors never need existence checks. */
function normaliseType(entry) {
	const [adapter = 'html', name = entry.type] = entry.type.includes(':') ? entry.type.split(':') : ['', entry.type];
	return {
		label: entry.label || name,
		adapter: entry.adapter || adapter || 'html',
		tag: entry.tag || name,
		container: entry.container ?? false,
		schema: entry.schema || [],
		defaults: entry.defaults || { props: {}, children: [] },
		...entry,
	};
}

/** Unknown `html:` and `vue:` types still render and edit, with a class field. */
function defaultFallback(type) {
	const [adapter, name] = type.split(':');
	if (!name) return null;
	if (adapter === 'html') return { type, label: name, adapter, tag: name, container: !voidTags.has(name), schema: commonFields };
	if (adapter === 'vue') return { type, label: name, adapter, tag: name, container: true, schema: [classField], placeholder: true };
	return null;
}

/* HTML ------------------------------------------------------------------------- */

export const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

/** The Tailwind class field every visual node shares. */
export const classField = { key: 'class', label: 'Tailwind classes', component: 'DomTextareaInput', group: 'Style', props: { rows: 3 }, description: 'Utilities and theme classes, such as p-6 bg-canvas text-canvas-fg.' };
const idField = { key: 'id', label: 'Id', component: 'DomTextInput', group: 'Attributes' };
const titleField = { key: 'title', label: 'Tooltip', component: 'DomTextInput', group: 'Attributes' };
const commonFields = [classField, idField, titleField];
const select = (key, label, options, extra = {}) => ({ key, label, component: 'DomSelectInput', group: 'Attributes', props: { options: options.map((value) => (typeof value === 'string' ? { label: value || 'Default', value } : value)) }, ...extra });
const textField = (key, label, extra = {}) => ({ key, label, component: 'DomTextInput', group: 'Attributes', ...extra });

const htmlGroups = {
	Layout: ['div', 'section', 'main', 'article', 'aside', 'header', 'footer', 'nav', 'figure', 'form', 'fieldset'],
	Text: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'strong', 'em', 'small', 'blockquote', 'code', 'pre', 'label', 'time', 'figcaption'],
	Lists: ['ul', 'ol', 'li'],
	Media: ['img', 'hr', 'br'],
	Interactive: ['a', 'button', 'input', 'textarea', 'select', 'option', 'details', 'summary'],
};

const htmlLabels = { div: 'Box', section: 'Section', main: 'Main', article: 'Article', aside: 'Aside', header: 'Header', footer: 'Footer', nav: 'Navigation', figure: 'Figure', form: 'Form', fieldset: 'Fieldset', h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3', h4: 'Heading 4', h5: 'Heading 5', h6: 'Heading 6', p: 'Paragraph', span: 'Inline text', strong: 'Bold', em: 'Italic', small: 'Small text', blockquote: 'Quote', code: 'Code', pre: 'Preformatted', label: 'Label', time: 'Time', figcaption: 'Caption', ul: 'Bulleted list', ol: 'Numbered list', li: 'List item', img: 'Image', hr: 'Divider', br: 'Line break', a: 'Link', button: 'Button', input: 'Input', textarea: 'Text area', select: 'Select', option: 'Option', details: 'Disclosure', summary: 'Summary' };

const htmlFields = {
	a: [textField('href', 'Link to', { placeholder: 'https://' }), select('target', 'Open in', [{ label: 'Same tab', value: '' }, { label: 'New tab', value: '_blank' }]), textField('rel', 'Rel')],
	img: [textField('src', 'Image URL', { placeholder: 'https://' }), textField('alt', 'Alt text', { description: 'Describe the image for screen readers. Leave empty for decoration.' }), select('loading', 'Loading', ['', 'lazy', 'eager'])],
	button: [select('type', 'Type', ['button', 'submit', 'reset']), { key: 'disabled', label: 'Disabled', component: 'DomToggle', group: 'Attributes' }],
	input: [select('type', 'Type', ['text', 'email', 'password', 'number', 'search', 'tel', 'url', 'date', 'checkbox', 'radio']), textField('name', 'Name'), textField('placeholder', 'Placeholder'), textField('value', 'Value')],
	textarea: [textField('name', 'Name'), textField('placeholder', 'Placeholder'), { key: 'rows', label: 'Rows', component: 'DomNumberInput', group: 'Attributes' }],
	label: [textField('for', 'For')],
	time: [textField('datetime', 'Machine date', { placeholder: '2026-10-12' })],
	ol: [{ key: 'start', label: 'Start at', component: 'DomNumberInput', group: 'Attributes' }],
	details: [{ key: 'open', label: 'Open', component: 'DomToggle', group: 'Attributes' }],
	option: [textField('value', 'Value')],
	form: [textField('action', 'Action'), select('method', 'Method', ['', 'get', 'post'])],
};

const htmlDefaults = {
	h1: 'Heading', h2: 'Heading', h3: 'Heading', h4: 'Heading', h5: 'Heading', h6: 'Heading',
	p: 'Write something useful.', span: 'Text', strong: 'Bold text', em: 'Italic text', small: 'Small print', blockquote: 'A quote worth sharing.', code: 'code', pre: 'preformatted', label: 'Label', time: 'Oct 12, 2026', figcaption: 'Caption', li: 'List item', a: 'Learn more', button: 'Button', option: 'Option', summary: 'Details',
};

/** Starter props that make a freshly inserted element look intentional. */
const htmlStarterProps = {
	section: { class: 'space-y-4 p-6' }, div: { class: 'rounded-xl border border-border p-4' },
	h1: { class: 'text-4xl font-semibold tracking-tight' }, h2: { class: 'text-2xl font-semibold tracking-tight' }, h3: { class: 'text-lg font-semibold' },
	p: { class: 'text-sm leading-6 text-muted-fg' }, a: { href: '#', class: 'text-sm font-medium text-primary underline underline-offset-4' },
	img: { src: 'https://placehold.co/480x320', alt: '', class: 'w-full rounded-xl' }, button: { type: 'button', class: 'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg' },
	ul: { class: 'list-disc space-y-1 pl-5 text-sm' }, ol: { class: 'list-decimal space-y-1 pl-5 text-sm' }, hr: { class: 'border-border' },
	input: { type: 'text', placeholder: 'Type here', class: 'rounded-lg border border-border px-3 py-2 text-sm' },
};

/**
 * Builds the HTML element types: grouped, labelled, with attribute fields and
 * starter content. Shared by every adapter that renders native elements.
 *
 * @returns {Array<object>} Type entries.
 */
export function htmlTypes() {
	return Object.entries(htmlGroups).flatMap(([group, tags]) => tags.map((tag) => {
		const children = htmlDefaults[tag] ? [{ type: 'text', props: { value: htmlDefaults[tag] } }] : tag === 'ul' || tag === 'ol' ? [{ type: 'html:li', props: {}, children: [{ type: 'text', props: { value: 'First item' } }] }, { type: 'html:li', props: {}, children: [{ type: 'text', props: { value: 'Second item' } }] }] : [];
		return {
			type: `html:${tag}`,
			label: htmlLabels[tag] || tag,
			group,
			adapter: 'html',
			tag,
			container: !voidTags.has(tag),
			schema: [classField, ...(htmlFields[tag] || []), idField, titleField],
			defaults: { props: htmlStarterProps[tag] || {}, children },
		};
	}));
}

/** The text node type: a literal string or a bound expression. */
export const textType = {
	type: 'text',
	label: 'Text',
	adapter: 'html',
	tag: '#text',
	container: false,
	schema: [{ key: 'value', label: 'Text', component: 'DomTextareaInput', group: 'Content', props: { rows: 3 } }],
	defaults: { props: { value: 'Text' }, children: [] },
};

/**
 * Creates a registry with HTML elements and text defined.
 *
 * @param {{ fallback?: (type: string) => object|null }} [options] Fallback factory.
 * @returns {ReturnType<typeof createTypeRegistry>}
 */
export function createHtmlTypeRegistry(options) {
	const registry = createTypeRegistry(options);
	registry.define(textType);
	htmlTypes().forEach((entry) => registry.define(entry));
	return registry;
}

/**
 * Turns a type's defaults into a tree description ready for `fromTree`.
 *
 * @param {object} entry Type entry.
 * @param {object} [overrides] Extra node fields or props.
 * @returns {object} Tree description.
 */
export function treeFromType(entry, overrides = {}) {
	const copy = (value) => JSON.parse(JSON.stringify(value ?? null));
	return {
		type: entry.type,
		props: { ...copy(entry.defaults?.props || {}), ...(overrides.props || {}) },
		children: copy(entry.defaults?.children || []),
		...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'props')),
	};
}
