/**
 * Site-wide header navigation.
 *
 * The header leads with the parts of DOM Studio that are hard to generate:
 * the DOM designer, AI surfaces, data-heavy application components, charts
 * and full product blocks. Simple primitives (cards, badges, inputs) remain
 * fully documented but sit one level down in the Library menu, because an
 * LLM can produce a passable card in seconds; it cannot produce a working
 * designer, data grid or Gantt chart.
 */

/**
 * Primary header links, in priority order.
 *
 * @type {Array<{ to: string, label: string, match?: string[], description: string }>}
 */
export const primaryNavigation = [
	{ to: '/designer', label: 'Designer', match: ['/designer'], description: 'DOM-based visual editor for HTML and Vue output.' },
	{ to: '/ai', label: 'AI', match: ['/ai'], description: 'Agent chat, builders and review surfaces.' },
	{ to: '/data', label: 'Data', match: ['/data'], description: 'Grids, Gantt, kanban, scheduling and document editing.' },
	{ to: '/charts', label: 'Charts', match: ['/charts'], description: 'Analytics and finance visualisation.' },
	{ to: '/blocks', label: 'Blocks', match: ['/blocks'], description: 'Complete product screens you can copy and own.' },
];

/**
 * The secondary Library menu: building blocks that remain available but no
 * longer compete with the advanced tools for header space.
 *
 * @type {Array<{ label: string, items: Array<{ to: string, label: string, match?: string[], description: string }> }>}
 */
export const libraryNavigation = [
	{
		label: 'Primitives',
		items: [
			{ to: '/components', label: 'Components', match: ['/components'], description: 'Menus, dialogs, tabs and other app primitives.' },
			{ to: '/forms', label: 'Forms', match: ['/forms'], description: 'Inputs, pickers and schema-driven forms.' },
			{ to: '/visual/card', label: 'Visual', match: ['/visual'], description: 'Cards, badges, avatars and status display.' },
			{ to: '/mobile', label: 'Mobile', match: ['/mobile'], description: 'App shells and touch-first navigation.' },
			{ to: '/headless', label: 'Headless', match: ['/headless'], description: 'Framework-neutral custom elements.' },
			{ to: '/dev', label: 'Dev', match: ['/dev'], description: 'Code blocks and JSON viewers.' },
			{ to: '/icons', label: 'Icons', match: ['/icons'], description: 'The icon set used across DOM Studio.' },
		],
	},
	{
		label: 'Get started',
		items: [
			{ to: '/install', label: 'Install', match: ['/install'], description: 'Add the package to a Vue or HTML app.' },
			{ to: '/theming', label: 'Theming', match: ['/theming'], description: 'Tokens, skins and the AI theme editor.' },
			{ to: '/component-spec', label: 'Component metadata', match: ['/component-spec'], description: 'The contract humans and agents share.' },
		],
	},
];

/** Commercial link shown after the product navigation. */
export const pricingLink = { to: '/pricing', label: 'Pricing', match: ['/pricing', '/licence'] };

/**
 * Checks whether a navigation item matches a route path.
 *
 * @param {{ to: string, match?: string[] }} item Navigation item.
 * @param {string} path Current route path.
 * @returns {boolean} Whether the item is active.
 */
export function isNavigationItemActive(item, path) {
	return (item.match || [item.to]).some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/**
 * Checks whether any Library entry matches a route path.
 *
 * @param {string} path Current route path.
 * @returns {boolean} Whether the Library trigger should show as active.
 */
export function isLibraryActive(path) {
	return libraryNavigation.some((group) => group.items.some((item) => isNavigationItemActive(item, path)));
}
