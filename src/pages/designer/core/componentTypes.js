import { markRaw } from 'vue';
import { componentRegistry, lookupByName } from '../../_layout/inspector/componentRegistry.js';
import { inferSchema } from '../../_layout/inspector/useInspector.js';
import { classField, createHtmlTypeRegistry } from './typeRegistry.js';

/**
 * Browser-side types for DOM Studio components.
 *
 * Each `vue:<Component>` type is built from the component registry: its
 * schema comes from `inferSchema`, which reads the component's prop
 * definitions and their `_edit` metadata, so the inspector for any DOM Studio
 * component is generated rather than written by hand. Components the registry
 * does not know (local components in an imported project) get a placeholder
 * type that still edits classes and keeps every prop for export.
 */

/** Registry entries that are real Vue components with an export name. */
export function studioComponentEntries() {
	return componentRegistry.filter((entry) => entry.component && typeof entry.component === 'object' && entry.componentName);
}

/** Converts registry starter children (inspector spec shape) into tree descriptions. */
function starterChildren(entry) {
	if (entry.defaults?.text) return [{ type: 'text', props: { value: entry.defaults.text }, children: [] }];
	return [];
}

/** Starter props without functions, which cannot be serialised into a template. */
function starterProps(entry) {
	return Object.fromEntries(Object.entries(entry.defaults?.props || {}).filter(([, value]) => value !== undefined && typeof value !== 'function'));
}

/**
 * Builds the type for a DOM Studio component registry entry.
 *
 * @param {object} entry Component registry entry.
 * @returns {object} Type entry.
 */
export function componentType(entry) {
	const schema = inferSchema({ component: entry.component }).filter((field) => field.key !== 'class' && field.key !== 'modelValue');
	return {
		type: `vue:${entry.componentName}`,
		label: entry.label,
		group: entry.group,
		adapter: 'vue',
		tag: entry.componentName,
		container: entry.accepts !== 'none',
		component: markRaw(entry.component),
		schema: [classField, ...schema.map((field) => ({ ...field, group: field.group || 'Props' }))],
		defaults: { props: starterProps(entry), children: starterChildren(entry) },
	};
}

/**
 * Creates the registry the canvas uses: HTML elements, text, every DOM Studio
 * component (built on first use), and placeholders for anything else.
 *
 * @returns {ReturnType<typeof createHtmlTypeRegistry>}
 */
export function createEditorTypes() {
	return createHtmlTypeRegistry({
		fallback(type) {
			const [adapter, name] = type.split(':');
			if (adapter === 'vue' && name) {
				const entry = lookupByName(name);
				if (entry && typeof entry.component === 'object' && entry.componentName === name) return componentType(entry);
				return { type, label: name, adapter, tag: name, container: true, schema: [classField], placeholder: true };
			}
			if (adapter === 'html' && name) return { type, label: name, adapter, tag: name, container: !['img', 'br', 'hr', 'input'].includes(name), schema: [classField] };
			return null;
		},
	});
}
