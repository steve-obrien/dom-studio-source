/**
 * Reports whether an item opens a contained page instead of selecting a leaf.
 * @param {object} item Application-owned menu item.
 * @returns {boolean} Whether the item supplies child navigation or page content.
 */
export function hasMenuPage(item) {
	return Array.isArray(item.children) || !!item.component || !!item.slot;
}

/**
 * Flattens nested menu pages for DomAppStack without mutating application data.
 * Every item needs a unique, non-empty string id; "root" is reserved.
 * @param {Array<object>} items Nested links, actions, and pages.
 * @param {string} title Root page title.
 * @returns {Array<object>} Stack screen registrations with original child items.
 */
export function buildMenuScreens(items, title) {
	const screens = [{ id: 'root', title, items, slot: 'root' }];
	const ids = new Set(['root']);
	/** Validates each item once and registers its page under its parent. */
	function visit(children, parent) {
		for (const item of children) {
			if (!item || typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id)) {
				throw new Error('DomMenuStack items require unique non-empty string ids; "root" is reserved.');
			}
			ids.add(item.id);
			if (!hasMenuPage(item)) continue;
			const nested = Array.isArray(item.children) ? item.children : [];
			screens.push({ ...item, title: item.title || item.label || item.id, parent, items: nested });
			visit(nested, item.id);
		}
	}
	visit(items, 'root');
	return screens;
}
