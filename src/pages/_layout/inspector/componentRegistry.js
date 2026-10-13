import { getRuntimeComponentRecords } from '../componentRuntimeRecords.js';
import { inspectComponentRecord } from '../componentInspector.js';
import { createComponentCatalog } from '../../designer/core/componentCatalog.js';

/**
 * The docs site's component palette: every discovered DOM Studio component
 * plus the HTML primitives. The catalog logic lives in
 * `designer/core/componentCatalog.js`, which the packaged designer shares.
 */
const catalog = createComponentCatalog(getRuntimeComponentRecords().map(inspectComponentRecord).filter((record) => !record.studioHidden));
const entries = catalog.entries;

export const componentRegistry = entries;
export const groupedRegistry = entries.reduce((acc, entry) => {
	(acc[entry.group] ||= []).push(entry);
	return acc;
}, {});
export const { lookupEntry, lookupById, lookupByName } = catalog;

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
