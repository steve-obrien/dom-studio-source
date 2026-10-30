import { labelFromExportName, labelFromSlug } from './componentManager.js';

/**
 * Expands a component record with display metadata used by docs and editors.
 *
 * @param {object} record Component discovery record.
 * @returns {object} Component record with normalized docs, labels, and props.
 */
export function inspectComponentRecord(record) {
	const component = record.component;
	const doc = getComponentDoc(record);
	const studio = getStudioMeta(record);
	return {
		...record,
		doc,
		studio,
		label: doc.name || labelFromExportName(record.exportName) || labelFromSlug(record.slug),
		badge: doc.nav?.badge || doc.badge || null,
		icon: doc.nav?.icon || doc.icon || studio.icon || null,
		order: doc.order ?? 100,
		hidden: Boolean(doc.hidden),
		navHidden: Boolean(doc.hidden || doc.nav?.hidden),
		studioHidden: Boolean(doc.hidden || studio.hidden),
		props: getComponentProps(component),
	};
}

/**
 * Reads documentation metadata from either a Vue component or catalog record.
 *
 * @param {object} value Vue component object or component catalog record.
 * @returns {object} Documentation metadata.
 */
export function getComponentDoc(value) {
	return value?.__doc || value?.component?.__doc || value?.doc || {};
}

/**
 * Reads Studio editor metadata from either a Vue component or catalog record.
 *
 * @param {object} value Vue component object or component catalog record.
 * @returns {object} Studio metadata.
 */
export function getStudioMeta(value) {
	const doc = getComponentDoc(value);
	return value?.__studio || value?.component?.__studio || value?.studio || doc.studio || {};
}

/**
 * Normalizes Vue props from a component object for docs/editor inspection.
 *
 * @param {object} component Vue component object.
 * @returns {object} Component props keyed by prop name.
 */
export function getComponentProps(component) {
	const props = component?.props;
	if (!props) return {};
	if (Array.isArray(props)) return Object.fromEntries(props.map((key) => [key, {}]));
	return props;
}
