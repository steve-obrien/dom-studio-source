/**
 * Inspector fields for a component, read from its prop definitions.
 *
 * Inline hints live on the component's prop definition under the `_edit` key:
 *
 * ```js
 * const props = defineProps({
 * 	items: {
 * 		type: Array,
 * 		required: true,
 * 		_edit: { component: 'DomJsonListInput', props: { label: 'Items', compact: true } },
 * 	},
 * });
 * ```
 *
 * The `component` is an editor name (a string), so rendered output never
 * pulls form components into the bundle. `props` are passed to that editor.
 * Props without a hint get an editor from their type; arrays, objects and
 * functions without one are left out.
 *
 * Each field also carries the prop's `defaultValue` when it is a plain string,
 * number or boolean, so inspectors can show what an unset prop resolves to.
 */

function componentProps(component) {
	if (!component || typeof component === 'string') return {};
	const p = component.props;
	if (!p) return {};
	if (Array.isArray(p)) return Object.fromEntries(p.map((k) => [k, {}]));
	return p;
}

// Default editor for a Vue prop type when no `_edit` hint is given.
function defaultEditorForProp(def) {
	if (!def) return 'DomTextInput';
	const types = propTypes(def);
	if (types.includes(Boolean)) return 'DomToggle';
	if (types.includes(String)) return 'DomTextInput';
	if (types.includes(Number)) return 'DomNumberInput';
	if (types.includes(Array) || types.includes(Object) || types.includes(Function)) return null;
	return 'DomTextInput';
}

function propTypes(def) {
	const t = def?.type ?? def;
	return Array.isArray(t) ? t : [t];
}

/**
 * The value Vue uses when a prop is not passed: its `default` (factories are
 * called), or `false` for a Boolean prop without one. Objects, arrays and
 * functions are left out, since an inspector can only show simple values.
 */
function defaultValueForProp(def) {
	if (!def || typeof def !== 'object') return undefined;
	const types = propTypes(def);
	let value = def.default;
	if (typeof value === 'function' && !types.includes(Function)) {
		try {
			value = value({});
		} catch {
			return undefined;
		}
	}
	if (value === undefined && !('default' in def) && types.includes(Boolean)) value = false;
	return ['string', 'number', 'boolean'].includes(typeof value) ? value : undefined;
}

function resolveComponent(hint, props, def) {
	if (hint.component) return hint.component;
	if (hint.options || hint.enum || props.options || props.enum) return 'DomSelectInput';
	return defaultEditorForProp(def);
}

function normaliseEdit(hint = {}, def) {
	const props = { ...(hint.props || {}) };
	for (const [key, value] of Object.entries(hint)) {
		if (['component', 'props', 'label', 'description', 'group'].includes(key)) continue;
		if (!(key in props)) props[key] = value;
	}
	return {
		component: resolveComponent(hint, props, def),
		label: hint.label ?? props.label,
		description: hint.description ?? props.description,
		group: hint.group ?? props.group,
		props,
	};
}

function prettify(s) {
	return s
		.replace(/([A-Z])/g, ' $1')
		.replace(/^./, (c) => c.toUpperCase())
		.replace(/Model Value/, 'Value');
}

/**
 * Builds inspector fields for a component's props.
 *
 * @param {object|string|null} component Vue component object.
 * @param {Record<string, object>} [hints] Per-prop overrides, stacked on `_edit`.
 * @returns {Array<{ key: string, label: string, description?: string, group?: string, component: string, props: object, defaultValue?: string|number|boolean }>} Fields.
 */
export function schemaForComponent(component, hints = {}) {
	const fields = [];
	for (const [key, def] of Object.entries(componentProps(component))) {
		if (key === 'class' || key === 'modelModifiers' || key.startsWith('_')) continue;
		const inlineEdit = def && typeof def === 'object' && def._edit;
		const edit = normaliseEdit({ ...(inlineEdit || {}), ...(hints[key] || {}) }, def);
		if (!edit.component) continue;
		const field = { key, label: edit.label || prettify(key), description: edit.description, group: edit.group, component: edit.component, props: edit.props };
		const defaultValue = defaultValueForProp(def);
		if (defaultValue !== undefined) field.defaultValue = defaultValue;
		fields.push(field);
	}
	return fields;
}
