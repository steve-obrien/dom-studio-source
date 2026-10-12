/**
 * Site-wide header navigation.
 *
 * The header leads with the products a licence pays for: the data grid,
 * scheduler, DOM designer, charts and AI surfaces. Simple primitives (cards,
 * badges, inputs) remain fully documented but sit one level down in the
 * Library menu.
 */

/**
 * Header products, in priority order. These are what a licence pays for, in
 * the style of AG Grid's Grid/Charts/Studio header: each one names a product
 * rather than a documentation section. Items with `groups` open a menu.
 *
 * @type {Array<{ id: string, to: string, label: string, match?: string[], description: string, groups?: Array<{ label: string, items: Array<object> }> }>}
 */
export const primaryNavigation = [
	{ id: 'data-grid', to: '/data/data-grid', label: 'Data Grid', match: ['/data/data-grid', '/data/filter-bar'], description: 'Sorting, filtering, editing and virtualised rows.' },
	{
		id: 'scheduler',
		to: '/data/week-planner',
		label: 'Scheduler',
		match: ['/data/week-planner', '/data/month-calendar', '/data/gantt', '/blocks/operations/scheduling'],
		description: 'Calendars, planners, Gantt and resource scheduling.',
		groups: [
			{
				label: 'Scheduler',
				items: [
					{ to: '/data/week-planner', label: 'Week planner', match: ['/data/week-planner'], description: 'Day swim lanes, drag-to-create and a live time line.' },
					{ to: '/data/month-calendar', label: 'Month calendar', match: ['/data/month-calendar'], description: 'Date-led month views with events.' },
					{ to: '/data/gantt', label: 'Gantt', match: ['/data/gantt'], description: 'Timelines, dependencies and progress.' },
					{ to: '/blocks/operations/scheduling/resource-scheduler', label: 'Resource scheduler', match: ['/blocks/operations/scheduling'], description: 'People and rooms across a schedule.' },
				],
			},
		],
	},
	{ id: 'designer', to: '/designer', label: 'Designer', match: ['/designer'], description: 'DOM-based visual editor for HTML and Vue output.' },
	{ id: 'charts', to: '/charts', label: 'Charts', match: ['/charts'], description: 'Analytics and finance visualisation.' },
	{ id: 'ai', to: '/ai', label: 'AI', match: ['/ai', '/data/agent-chat'], description: 'Agent chat, builders and review surfaces.' },
];

/**
 * The secondary Library menu: everything that ships with a licence but is not
 * a headline product. Simple primitives live here because an LLM can produce
 * a passable card in seconds; it cannot produce a working grid or scheduler.
 *
 * @type {{ id: string, label: string, groups: Array<{ label: string, items: Array<{ to: string, label: string, match?: string[], description: string }> }> }}
 */
export const libraryMenu = {
	id: 'library',
	label: 'Library',
	groups: [
		{
			label: 'Application',
			items: [
				{ to: '/blocks', label: 'Blocks', match: ['/blocks'], description: 'Complete product screens you can copy and own.' },
				{ to: '/data/kanban', label: 'Kanban', match: ['/data/kanban'], description: 'Boards with drag between columns.' },
				{ to: '/data/document-editor', label: 'Document editor', match: ['/data/document-editor'], description: 'Rich text with comments and review.' },
				{ to: '/data', label: 'All data components', match: ['/data'], description: 'Timelines, inboxes, media and more.' },
			],
		},
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
	],
};

/** Every header menu (products with sub-items, then Library), rendered as popovers. */
export const headerMenus = [...primaryNavigation.filter((item) => item.groups), libraryMenu];

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
 * Checks whether a route belongs to the Library rather than a headline product.
 *
 * @param {string} path Current route path.
 * @returns {boolean} Whether the Library trigger should show as active.
 */
export function isLibraryActive(path) {
	if (primaryNavigation.some((item) => isNavigationItemActive(item, path))) return false;
	return libraryMenu.groups.some((group) => group.items.some((item) => isNavigationItemActive(item, path)));
}
