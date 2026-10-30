export const builtInIconSelectorItems = [
	{ label: 'Add', group: 'Actions', path: 'M12 5v14M5 12h14', keywords: ['plus', 'new', 'create'] },
	{ label: 'Remove', group: 'Actions', path: 'M5 12h14', keywords: ['minus', 'delete'] },
	{ label: 'Close', group: 'Actions', path: 'M6 6l12 12M18 6 6 18', keywords: ['dismiss', 'x'] },
	{ label: 'Check', group: 'Actions', path: 'M20 6 9 17l-5-5', keywords: ['done', 'success'] },
	{ label: 'Edit', group: 'Actions', path: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Zm11-13 2 2', keywords: ['pencil', 'compose'] },
	{ label: 'Copy', group: 'Actions', path: 'M8 8h11v11H8V8Zm-3 8H4V4h12v1', keywords: ['duplicate'] },
	{ label: 'Share', group: 'Actions', path: 'M8 12h8M15 7l5 5-5 5M4 5v14', keywords: ['send'] },
	{ label: 'Download', group: 'Actions', path: 'M12 4v10M8 10l4 4 4-4M5 19h14', keywords: ['export'] },
	{ label: 'Upload', group: 'Actions', path: 'M12 16V4M8 8l4-4 4 4M5 20h14', keywords: ['import'] },
	{ label: 'Search', group: 'Navigation', path: 'M10.5 18a7.5 7.5 0 1 1 5.3-2.2L21 21', keywords: ['find'] },
	{ label: 'Filter', group: 'Navigation', path: 'M5 6h14M8 12h8M10 18h4', keywords: ['funnel'] },
	{ label: 'Settings', group: 'Navigation', path: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1', keywords: ['gear'] },
	{ label: 'Menu', group: 'Navigation', path: 'M6 7h12M6 12h12M6 17h12', keywords: ['list'] },
	{ label: 'More horizontal', group: 'Navigation', path: 'M5 12h.01M12 12h.01M19 12h.01', keywords: ['ellipsis'] },
	{ label: 'More vertical', group: 'Navigation', path: 'M12 5h.01M12 12h.01M12 19h.01', keywords: ['ellipsis'] },
	{ label: 'Chevron down', group: 'Navigation', path: 'M7 10l5 5 5-5', keywords: ['expand'] },
	{ label: 'Chevron up', group: 'Navigation', path: 'M7 14l5-5 5 5', keywords: ['collapse'] },
	{ label: 'Chevron left', group: 'Navigation', path: 'M14 7l-5 5 5 5', keywords: ['previous'] },
	{ label: 'Chevron right', group: 'Navigation', path: 'M10 7l5 5-5 5', keywords: ['next'] },
	{ label: 'Arrow left', group: 'Navigation', path: 'M19 12H5M12 5l-7 7 7 7', keywords: ['back'] },
	{ label: 'Arrow right', group: 'Navigation', path: 'M5 12h14M12 5l7 7-7 7', keywords: ['forward'] },
	{ label: 'Arrow up', group: 'Navigation', path: 'M12 19V5M5 12l7-7 7 7', keywords: ['top'] },
	{ label: 'Arrow down', group: 'Navigation', path: 'M12 5v14M5 12l7 7 7-7', keywords: ['bottom'] },
	{ label: 'Home', group: 'Navigation', path: 'M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z', keywords: ['house'] },
	{ label: 'External link', group: 'Navigation', path: 'M14 5h5v5M13 11l6-6M19 14v5H5V5h5', keywords: ['open'] },
	{ label: 'Info', group: 'Status', path: 'M12 17v-5M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', keywords: ['notice'] },
	{ label: 'Success', group: 'Status', path: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM8.5 12.5l2.5 2.5 4.5-5', keywords: ['check', 'complete'] },
	{ label: 'Warning', group: 'Status', path: 'M12 4l9 16H3L12 4ZM12 9v4M12 17h.01', keywords: ['alert', 'risk'] },
	{ label: 'Error', group: 'Status', path: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM15 9l-6 6M9 9l6 6', keywords: ['danger', 'failed'] },
	{ label: 'Help', group: 'Status', path: 'M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-.9.7-1.7 1.2-1.7 2.7M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', keywords: ['question'] },
	{ label: 'Lock', group: 'Security', path: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9Zm6 3v2', keywords: ['secure'] },
	{ label: 'Unlock', group: 'Security', path: 'M8 11V8a5 5 0 0 1 9.5-2.2M6 11h12v9H6v-9Zm6 3v2', keywords: ['open'] },
	{ label: 'Shield', group: 'Security', path: 'M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3ZM9.5 12l1.75 1.75L15 10', keywords: ['protect'] },
	{ label: 'User', group: 'People', path: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0', keywords: ['profile'] },
	{ label: 'Users', group: 'People', path: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 1a3 3 0 1 0 0-6M4 20a5 5 0 0 1 10 0M13 20a5 5 0 0 1 7-4.5', keywords: ['team'] },
	{ label: 'Mail', group: 'Communication', path: 'M4 6h16v12H4V6Zm0 0 8 7 8-7', keywords: ['email'] },
	{ label: 'Message', group: 'Communication', path: 'M5 6h14v9H9l-4 4V6Z', keywords: ['chat', 'comment'] },
	{ label: 'Bell', group: 'Communication', path: 'M15 17H9m9-2H6l2-3V9a4 4 0 0 1 8 0v3l2 3ZM10 19a2 2 0 0 0 4 0', keywords: ['notification'] },
	{ label: 'Calendar', group: 'Time', path: 'M7 4v3M17 4v3M5 8h14M6 6h12v13H6V6Zm3 6h2M13 12h2M9 16h2', keywords: ['date'] },
	{ label: 'Clock', group: 'Time', path: 'M12 6v6l4 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', keywords: ['time'] },
	{ label: 'File', group: 'Files', path: 'M6 4h8l4 4v12H6V4Zm8 0v5h5M9 13h6M9 16h4', keywords: ['document'] },
	{ label: 'Folder', group: 'Files', path: 'M4 6h6l2 2h8v10H4V6Z', keywords: ['directory'] },
	{ label: 'Image', group: 'Files', path: 'M5 6h14v12H5V6Zm3 9 3-3 2 2 2-3 3 4M8 9h.01', keywords: ['media'] },
	{ label: 'Code', group: 'Files', path: 'M8 9l-4 3 4 3M16 9l4 3-4 3M14 5l-4 14', keywords: ['developer'] },
	{ label: 'Database', group: 'Data', path: 'M5 7c0-2 14-2 14 0v10c0 2-14 2-14 0V7Zm0 0c0 2 14 2 14 0M5 12c0 2 14 2 14 0', keywords: ['storage'] },
	{ label: 'Table', group: 'Data', path: 'M5 5h14v14H5V5Zm0 5h14M5 14h14M10 5v14M15 5v14', keywords: ['grid'] },
	{ label: 'Chart bar', group: 'Data', path: 'M5 19V9M12 19V5M19 19v-7M4 19h16', keywords: ['analytics'] },
	{ label: 'Chart line', group: 'Data', path: 'M4 17l5-5 4 4 7-9M4 20h16', keywords: ['growth'] },
	{ label: 'Card', group: 'Interface', path: 'M5 7h14v10H5V7Zm3 3h8M8 14h5', keywords: ['panel'] },
	{ label: 'Dashboard', group: 'Interface', path: 'M4 5h7v7H4V5Zm9 0h7v5h-7V5ZM4 14h7v5H4v-5Zm9-2h7v7h-7v-7Z', keywords: ['layout'] },
	{ label: 'Mobile', group: 'Interface', path: 'M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 15h4', keywords: ['phone'] },
	{ label: 'Window', group: 'Interface', path: 'M4 5h16v14H4V5Zm0 4h16M8 7h.01M11 7h.01', keywords: ['browser'] },
	{ label: 'Globe', group: 'Places', path: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c2 2.5 3 5.5 3 9s-1 6.5-3 9M12 3c-2 2.5-3 5.5-3 9s1 6.5 3 9', keywords: ['world', 'web'] },
	{ label: 'Map pin', group: 'Places', path: 'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', keywords: ['location'] },
	{ label: 'Star', group: 'Objects', path: 'M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6-4.4-4.3 6.1-.9L12 3Z', keywords: ['favorite'] },
	{ label: 'Heart', group: 'Objects', path: 'M12 20s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.2-8 11-8 11Z', keywords: ['love'] },
	{ label: 'Sparkles', group: 'Objects', path: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm6 9 .9 2.6 2.6.9-2.6.9L18 20l-.9-2.6-2.6-.9 2.6-.9L18 12Z', keywords: ['magic', 'ai'] },
	{ label: 'Rocket', group: 'Objects', path: 'M5 19c1.5-4 4-6.5 8-8l2-6 4 4-6 2c-1.5 4-4 6.5-8 8Zm4-4-4 4M14 6l4 4', keywords: ['launch'] },
	{ label: 'Tag', group: 'Commerce', path: 'M4 12 12 4h7v7l-8 8-7-7Zm11-5h.01', keywords: ['label'] },
	{ label: 'Credit card', group: 'Commerce', path: 'M4 7h16v10H4V7Zm0 3h16M7 14h4', keywords: ['payment'] },
	{ label: 'Receipt', group: 'Commerce', path: 'M7 4h10v16l-2-1-2 1-2-1-2 1-2-1-2 1V4Zm3 5h4M10 13h4M10 17h2', keywords: ['invoice'] },
];

export const emojiSelectorItems = [
	{ emoji: '😀', label: 'Grinning face', group: 'Smileys', keywords: ['happy', 'smile'] },
	{ emoji: '🙂', label: 'Slightly smiling face', group: 'Smileys', keywords: ['calm', 'smile'] },
	{ emoji: '😍', label: 'Heart eyes', group: 'Smileys', keywords: ['love', 'delight'] },
	{ emoji: '🤔', label: 'Thinking face', group: 'Smileys', keywords: ['question', 'consider'] },
	{ emoji: '😎', label: 'Cool face', group: 'Smileys', keywords: ['confidence', 'sun'] },
	{ emoji: '🙌', label: 'Raised hands', group: 'Gestures', keywords: ['celebrate', 'success'] },
	{ emoji: '👏', label: 'Clapping hands', group: 'Gestures', keywords: ['applause', 'approval'] },
	{ emoji: '👍', label: 'Thumbs up', group: 'Gestures', keywords: ['approve', 'yes'] },
	{ emoji: '👎', label: 'Thumbs down', group: 'Gestures', keywords: ['reject', 'no'] },
	{ emoji: '👋', label: 'Waving hand', group: 'Gestures', keywords: ['hello', 'goodbye'] },
	{ emoji: '🚀', label: 'Rocket', group: 'Objects', keywords: ['launch', 'ship'] },
	{ emoji: '✨', label: 'Sparkles', group: 'Objects', keywords: ['magic', 'polish'] },
	{ emoji: '🔥', label: 'Fire', group: 'Objects', keywords: ['hot', 'urgent'] },
	{ emoji: '💡', label: 'Light bulb', group: 'Objects', keywords: ['idea', 'insight'] },
	{ emoji: '📌', label: 'Pushpin', group: 'Objects', keywords: ['pin', 'important'] },
	{ emoji: '📎', label: 'Paperclip', group: 'Objects', keywords: ['attach', 'file'] },
	{ emoji: '🔒', label: 'Locked', group: 'Objects', keywords: ['security', 'private'] },
	{ emoji: '🔔', label: 'Bell', group: 'Objects', keywords: ['notification', 'alert'] },
	{ emoji: '✅', label: 'Check mark button', group: 'Status', keywords: ['done', 'complete'] },
	{ emoji: '⚠️', label: 'Warning', group: 'Status', keywords: ['caution', 'risk'] },
	{ emoji: '❌', label: 'Cross mark', group: 'Status', keywords: ['error', 'failed'] },
	{ emoji: '🟢', label: 'Green circle', group: 'Status', keywords: ['online', 'healthy'] },
	{ emoji: '🟡', label: 'Yellow circle', group: 'Status', keywords: ['pending', 'warning'] },
	{ emoji: '🔴', label: 'Red circle', group: 'Status', keywords: ['offline', 'blocked'] },
	{ emoji: '📈', label: 'Chart increasing', group: 'Work', keywords: ['growth', 'analytics'] },
	{ emoji: '📉', label: 'Chart decreasing', group: 'Work', keywords: ['decline', 'metrics'] },
	{ emoji: '🧾', label: 'Receipt', group: 'Work', keywords: ['billing', 'invoice'] },
	{ emoji: '📅', label: 'Calendar', group: 'Work', keywords: ['date', 'schedule'] },
	{ emoji: '💬', label: 'Speech balloon', group: 'Work', keywords: ['comment', 'message'] },
	{ emoji: '🧪', label: 'Test tube', group: 'Work', keywords: ['experiment', 'lab'] },
	{ emoji: '🎯', label: 'Direct hit', group: 'Work', keywords: ['target', 'goal'] },
	{ emoji: '🏷️', label: 'Label', group: 'Work', keywords: ['tag', 'price'] },
];

const objectValueIds = new WeakMap();
let objectValueId = 0;

/**
 * Build the selectable item list for the requested built-in kind and custom rows.
 *
 * @param {Object} options
 * @param {string} [options.kind] Built-in collection to include.
 * @param {Array<unknown>} [options.items] Custom icon, emoji, or symbol rows.
 * @param {boolean} [options.includeBuiltIns] Whether built-in rows should be included.
 * @returns {Array<Object>}
 */
export function createIconSelectorItems(options = {}) {
	const kind = options.kind || 'icons';
	const includeBuiltIns = options.includeBuiltIns !== false;
	const builtIns = includeBuiltIns ? builtInItemsForKind(kind) : [];
	const customItems = (options.items || [])
		.map((item, index) => normalizeIconSelectorItem(item, index, 'custom'))
		.filter(Boolean);

	return uniqueIconSelectorItems([...customItems, ...builtIns]);
}

/**
 * Create an item representation for a value that is not present in the option list.
 *
 * @param {unknown} value Current model value.
 * @returns {Object|null}
 */
export function fallbackIconSelectorItem(value) {
	if (value === true) {
		return {
			key: 'default-icon',
			value,
			optionValue: iconSelectorValueKey(value),
			label: 'Default icon',
			group: 'Current value',
			kind: 'default',
			searchText: 'default icon',
		};
	}
	if (value === false) {
		return {
			key: 'no-icon',
			value,
			optionValue: iconSelectorValueKey(value),
			label: 'No icon',
			group: 'Current value',
			kind: 'default',
			searchText: 'no icon',
		};
	}
	if (value == null || value === '') return null;
	if (isObjectValue(value)) {
		return {
			key: `fallback-${iconSelectorValueKey(value)}`,
			value,
			optionValue: iconSelectorValueKey(value),
			label: labelForComponent(value),
			group: 'Current value',
			kind: 'component',
			component: value,
			searchText: labelForComponent(value).toLowerCase(),
		};
	}

	const text = String(value);
	const isPath = looksLikeSvgPath(text);
	return {
		key: `fallback-${iconSelectorValueKey(text)}`,
		value: text,
		optionValue: iconSelectorValueKey(text),
		label: isPath ? 'Custom SVG path' : text,
		group: 'Current value',
		kind: isPath ? 'icon' : 'emoji',
		path: isPath ? text : '',
		emoji: isPath ? '' : text,
		searchText: text.toLowerCase(),
	};
}

/**
 * Build a stable key for comparing selector values.
 *
 * @param {unknown} value Model or option value.
 * @returns {string}
 */
export function iconSelectorValueKey(value) {
	if (isObjectValue(value)) {
		if (!objectValueIds.has(value)) objectValueIds.set(value, `object:${objectValueId += 1}`);
		return objectValueIds.get(value);
	}
	return `${typeof value}:${String(value ?? '')}`;
}

/**
 * Check whether two selector values represent the same option.
 *
 * @param {unknown} first First value to compare.
 * @param {unknown} second Second value to compare.
 * @returns {boolean}
 */
export function iconSelectorValuesMatch(first, second) {
	return first === second || iconSelectorValueKey(first) === iconSelectorValueKey(second);
}

/**
 * Build a stable key for rendering selector option rows.
 *
 * @param {Object} item Normalized selector item.
 * @returns {string}
 */
export function iconSelectorItemKey(item) {
	return item?.key || iconSelectorValueKey(item?.value);
}

/**
 * Build the string value used by the underlying DOM combobox.
 *
 * @param {Object|null|undefined} item Normalized selector item.
 * @returns {string}
 */
export function iconSelectorOptionValue(item) {
	return item?.optionValue || iconSelectorValueKey(item?.value);
}

/**
 * Resolve built-in icon and emoji collections for a selector kind.
 *
 * @param {string} kind Requested collection.
 * @returns {Array<Object>}
 */
function builtInItemsForKind(kind) {
	if (kind === 'custom') return [];
	if (kind === 'emoji') return emojiSelectorItems.map(normalizeEmojiItem).filter(Boolean);
	if (kind === 'mixed') {
		return [
			...builtInIconSelectorItems.map(normalizeBuiltInIcon).filter(Boolean),
			...emojiSelectorItems.map(normalizeEmojiItem).filter(Boolean),
		];
	}
	return builtInIconSelectorItems.map(normalizeBuiltInIcon).filter(Boolean);
}

/**
 * Convert a built-in DOM Studio icon into a selector item.
 *
 * @param {Object} icon Built-in icon row.
 * @returns {Object|null}
 */
function normalizeBuiltInIcon(icon, index) {
	if (!icon?.path) return null;
	return normalizeIconSelectorItem({
		value: icon.path,
		label: icon.label || icon.name,
		group: icon.group,
		path: icon.path,
		viewBox: icon.viewBox || '0 0 24 24',
		keywords: icon.keywords || [],
	}, index, 'icons');
}

/**
 * Convert a built-in emoji record into a selector item.
 *
 * @param {Object} item Emoji row.
 * @returns {Object|null}
 */
function normalizeEmojiItem(item, index) {
	return normalizeIconSelectorItem({
		value: item.emoji,
		label: item.label,
		group: item.group,
		emoji: item.emoji,
		keywords: item.keywords,
	}, index, 'emoji');
}

/**
 * Normalize custom and built-in selector records into one rendering shape.
 *
 * @param {unknown} rawItem User-supplied item value.
 * @param {number} index Item index in its source collection.
 * @param {string} source Source collection name.
 * @returns {Object|null}
 */
function normalizeIconSelectorItem(rawItem, index, source) {
	if (rawItem == null) return null;
	if (typeof rawItem === 'string' || typeof rawItem === 'number' || typeof rawItem === 'boolean') {
		return normalizePrimitiveItem(rawItem, index, source);
	}
	if (typeof rawItem === 'function') {
		return normalizeIconSelectorItem({
			value: rawItem,
			component: rawItem,
			label: labelForComponent(rawItem),
			kind: 'component',
		}, index, source);
	}
	if (typeof rawItem !== 'object') return null;

	const path = String(rawItem.path || '').trim();
	const emoji = String(rawItem.emoji || '').trim();
	const rawComponent = rawItem.component || (looksLikeComponentRecord(rawItem) ? rawItem : null);
	const value = rawItem.value ?? rawComponent ?? (path || emoji || rawItem.label);
	if (value == null || value === '') return null;

	const kind = rawItem.kind || (rawComponent ? 'component' : path ? 'icon' : emoji ? 'emoji' : source);
	const component = rawComponent || (isObjectValue(value) ? value : null);
	const label = rawItem.label || labelForValue(value, kind);
	const item = {
		...rawItem,
		key: rawItem.key || `${source}-${index}-${iconSelectorValueKey(value)}`,
		value,
		optionValue: rawItem.optionValue || iconSelectorValueKey(value),
		label,
		group: rawItem.group || groupForKind(kind),
		kind: component && !path && !emoji ? 'component' : kind,
		path,
		emoji,
		component,
		viewBox: rawItem.viewBox || '0 0 24 24',
		keywords: normalizeKeywords(rawItem.keywords),
	};

	return {
		...item,
		searchText: searchTextForItem(item),
	};
}

/**
 * Normalize a primitive selector value into a renderable item.
 *
 * @param {string|number|boolean} value Primitive item value.
 * @param {number} index Source index.
 * @param {string} source Source collection name.
 * @returns {Object|null}
 */
function normalizePrimitiveItem(value, index, source) {
	if (value === '') return null;
	const text = String(value);
	const isPath = looksLikeSvgPath(text);
	const kind = isPath ? 'icon' : 'emoji';
	const item = {
		key: `${source}-${index}-${iconSelectorValueKey(value)}`,
		value,
		optionValue: iconSelectorValueKey(value),
		label: labelForValue(value, kind),
		group: groupForKind(kind),
		kind,
		path: isPath ? text : '',
		emoji: isPath ? '' : text,
		viewBox: '0 0 24 24',
		keywords: [],
	};

	return {
		...item,
		searchText: searchTextForItem(item),
	};
}

/**
 * Remove duplicate selector records while preserving the first useful label.
 *
 * @param {Array<Object>} items Normalized selector items.
 * @returns {Array<Object>}
 */
function uniqueIconSelectorItems(items) {
	const seen = new Set();
	const out = [];
	for (const item of items) {
		const key = iconSelectorValueKey(item.value);
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(item);
	}
	return out;
}

/**
 * Build the fallback label for a primitive value.
 *
 * @param {unknown} value Item value.
 * @param {string} kind Normalized item kind.
 * @returns {string}
 */
function labelForValue(value, kind) {
	if (kind === 'icon') return 'Custom icon';
	if (kind === 'component') return labelForComponent(value);
	return String(value);
}

/**
 * Build a readable label for a Vue icon component.
 *
 * @param {unknown} component Component value.
 * @returns {string}
 */
function labelForComponent(component) {
	return String(component?.displayName || component?.name || component?.__name || 'Custom component');
}

/**
 * Build the fallback group label for an item kind.
 *
 * @param {string} kind Normalized item kind.
 * @returns {string}
 */
function groupForKind(kind) {
	if (kind === 'icon') return 'Icons';
	if (kind === 'emoji') return 'Emoji';
	if (kind === 'component') return 'Components';
	return 'Custom';
}

/**
 * Normalize keyword input from strings or arrays into an array.
 *
 * @param {unknown} keywords Raw keyword value.
 * @returns {Array<string>}
 */
function normalizeKeywords(keywords) {
	if (Array.isArray(keywords)) return keywords.map(String).filter(Boolean);
	if (typeof keywords === 'string') {
		return keywords
			.split(/[,\s]+/)
			.map((keyword) => keyword.trim())
			.filter(Boolean);
	}
	return [];
}

/**
 * Build normalized text used by search and the headless combobox filter.
 *
 * @param {Object} item Normalized selector item.
 * @returns {string}
 */
function searchTextForItem(item) {
	return [
		item.label,
		searchableValueText(item.value),
		item.group,
		item.kind,
		...(item.keywords || []),
	].filter(Boolean).join(' ').toLowerCase();
}

/**
 * Convert primitive values into searchable text without stringifying components.
 *
 * @param {unknown} value Item value.
 * @returns {string}
 */
function searchableValueText(value) {
	if (isObjectValue(value)) return '';
	return String(value ?? '');
}

/**
 * Check whether a value looks like SVG path data.
 *
 * @param {string} value Candidate path value.
 * @returns {boolean}
 */
function looksLikeSvgPath(value) {
	const text = String(value || '').trim();
	return /^[Mm][MmLlHhVvCcSsQqTtAaZz0-9.\-+,\s]+$/.test(text) && /\d/.test(text);
}

/**
 * Check whether a value should use object identity for selector matching.
 *
 * @param {unknown} value Candidate value.
 * @returns {boolean}
 */
function isObjectValue(value) {
	return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

/**
 * Check whether an object looks like a Vue component rather than an option row.
 *
 * @param {unknown} value Candidate object.
 * @returns {boolean}
 */
function looksLikeComponentRecord(value) {
	return Boolean(value && typeof value === 'object' && (value.render || value.setup || value.__name));
}
