import { componentCatalog } from './pages/_layout/componentCatalog.generated.js';

export const SITE_NAME = 'DOM Studio';
export const SITE_URL = 'https://getdom.studio';

// Titles describe the search intent; headings use the same topic without the brand.
// Component descriptions otherwise come from the existing source metadata catalogue.
const pageCopy = {
	'/privacy': ['Privacy policy', 'How DB3 Ltd handles personal information, cookies, analytics and licence purchases on getdom.studio, and how to exercise your privacy rights.'],
	'/terms-and-conditions': ['Terms and conditions', 'Terms for getdom.studio and DOM Studio purchases from DB3 Ltd, including software licences, payment, cancellation and consumer rights.'],
	'/releases': ['Release Notes', 'Explore DOM Studio releases, new Vue components, improvements, fixes, and upgrade guidance.'],
	'/': ['Vue UI Component Library', 'Build Vue 3 apps with DOM Studio: UI components, data grids, forms, charts, mobile layouts, headless web components, and editable templates.'],
	'/components': ['Vue UI Components', 'Browse Vue 3 UI components for buttons, dialogs, menus, tabs, navigation, and notifications, with interactive examples and component APIs.'],
	'/data': ['Vue Data Components', 'Build data-driven Vue apps with data grids, Kanban boards, calendars, Gantt charts, media browsers, document editors, and AI chat components.'],
	'/forms': ['Vue Form Components and Validation', 'Build Vue forms with reusable inputs, shared validation, accessible field labels, and schema-based form definitions. Explore examples and APIs.'],
	'/charts': ['Vue Charts and Data Visualisation', 'Explore Vue line, area, bar, donut, and sparkline charts, plus metric cards and date range pickers for application dashboards.'],
	'/charts/finance': ['Vue Finance Charts and Cashflow Examples', 'Explore interactive Vue examples for portfolio performance, banking transactions, income and expenses, and cashflow projections.'],
	'/dev': ['Vue Code and JSON Display Components', 'Display code snippets and JSON payloads in Vue applications with syntax highlighting, collapsible trees, and copy controls.'],
	'/mobile': ['Vue Mobile UI Components', 'Build mobile Vue interfaces with app shells, screen stacks, bottom navigation, action sheets, and safe-area-aware layouts.'],
	'/blocks': ['Vue UI Templates and Application Blocks', 'Explore editable Vue application templates for dashboards, login, billing, chat, scheduling, and business workflows built with DOM Studio components.'],
	'/headless': ['Headless Web Component Library', 'Use framework-neutral custom elements for dialogs, menus, tabs, tooltips, and form controls. Add accessible behaviour to plain HTML or any framework.'],
	'/headless/floating': ['Floating UI Positioning for Web Components', 'Position popovers, dropdowns, tooltips, and custom floating layers with DOM Studio’s shared positioning utilities and examples.'],
	'/install': ['Install the DOM Studio Vue Component Library', 'Install @getdom/studio in a Vue 3 application, import components and styles, and configure Tailwind CSS v4 and your application theme.'],
	'/theming': ['Theme Vue Components with Tailwind CSS', 'Customise DOM Studio components with CSS variables, semantic design tokens, Tailwind CSS v4, and light and dark themes.'],
	'/designer': ['Designer', 'A DOM-based visual designer for HTML and Vue: edit website pages and app-generator output visually, with live components, layers and CSS controls.'],
	'/designer/canvas': ['Canvas designer', 'A Figma-style canvas built from real HTML. Pan and zoom across artboards, edit Vue files visually with live DOM Studio components and export the same source.'],
	'/designer/assembly': ['Build your own designer · Beta', 'Assemble HTML editors and flowcharts with working Vue examples, shared layer selection, CSS controls and complete demo source.'],
	'/designer/composables': ['Designer composables · Beta', 'Build your own visual editor from the parts DomDesigner uses: one editor session, two-way code sync, in-place text editing and a rich text model.'],
	'/designer/composables/editor-session': ['useEditorSession', 'One document, selection and undo history for every part of a visual editor: files, artboards and operations in a Vue composable.'],
	'/designer/composables/code-sync': ['useCodeSync and DomCodePanel', 'Edit a design and its Vue source both ways, with selections, highlights and marks that follow each other between code and canvas.'],
	'/designer/composables/inline-text': ['useInlineText', 'Double-click text on a design stage to edit it in place, with bold, italic, underline and strike written as clean HTML.'],
	'/designer/composables/layout-geometry': ['useLayoutGeometry', 'Drag, resize, align and distribute layers in a visual editor, with multiple selection and every move as one undo step.'],
	'/designer/composables/rich-text': ['Rich text model', 'Marks and edits on a paragraph as plain data, turned into document operations: toggleMark, replaceRange and markOperations.'],
	'/designer/flowchart': ['Flowchart designer · Beta', 'Create flowcharts with editable HTML nodes, connections, an infinite workspace, zoom, a minimap and JSON export.'],
	'/designer/poster': ['Poster studio · Beta', 'Create HTML posters and flyers with editable photo and text layers, typography controls, image filters and HTML export.'],
	'/designer/social-card': ['Social card designer · Beta', 'Create a link-preview social card in real HTML with two-way code, every social format, alignment tools and HTML export.'],
	'/ai': ['AI Components & UI', 'Build AI interfaces with Vue components for agent chat, streaming conversations, voice, and camera input. Explore UI patterns, examples, and design guidance.'],
	'/ai/ui': ['Designing AI Interfaces', 'Design AI UI for prompts, streaming responses, tool actions, review, voice, and recovery, with practical guidance and DOM Studio component examples.'],
	'/ai/builders': ['Build Vue Interfaces with AI', 'Use DOM Studio components, examples, semantic theme tokens, and editable UI specifications when building interfaces with AI.'],
	'/component-spec': ['Component Metadata', 'Use Vue props, __doc, and _edit to document DOM Studio components and configure their editing controls. Explore a working example and metadata reference.'],
	'/icons': ['SVG Icons for Vue Interfaces', 'Browse and copy SVG path icons from DOM Studio components, navigation, and application blocks for use in your own interfaces.'],
	'/pricing': ['Vue Component Library Pricing and Licences', 'Compare DOM Studio Individual and Team licences for Vue components, application blocks, source access, and commercial use.'],
	'/blog': ['Vue UI Development Blog', 'Practical guides to Vue components, UI libraries, form design, application interfaces, and building with DOM Studio.'],
	'/tools/json-unstringifier': ['JSON Unstringifier and Formatter', 'Unescape stringified JSON, format minified data, and copy readable JSON with this browser-based developer tool.'],
	'/components/playground': ['Vue Component Playground', 'Try DOM Studio components in a live playground. Inspect components, edit their properties, and preview changes to the interface.'],
	'/experiments/css-button-creator': ['CSS Button Generator', 'Create and preview custom CSS buttons with controls for colour, shape, borders, shadows, and interactive states.'],
	'/experiments/liquid-glass': ['CSS Liquid Glass Effect Demo', 'Explore an interactive liquid glass surface experiment with adjustable appearance and backdrop effects.'],
	'/auth/sign-in': ['Sign In', 'Sign in to your DOM Studio account and access your component library source.'],
	'/licence': ['Your Licence', 'Recover your DOM Studio licence and download your purchase confirmation.'],
	'/licence/thanks': ['Purchase Confirmation', 'Your DOM Studio licence confirmation.'],
	'/auth/verify': ['Verify Your Email', 'Securely access your DOM Studio account.'],
	'/auth/sign-up': ['Create an Account', 'Create a DOM Studio account to manage your component library licence and source access.'],
	'/paywall': ['Component Library Source Access', 'Unlock DOM Studio component and application block source access.'],
	'/data/data-grid': ['Vue Data Grid with Filtering', 'A Vue data grid with typed column filters, sorting, row selection, virtual rows, and server-side pagination. Explore working examples and APIs.'],
	'/data/kanban': ['Vue Kanban Board with Drag and Drop'],
	'/data/gantt': ['Vue Gantt Chart and Resource Scheduler', 'Plan projects, team resources, and roadmaps with a Vue Gantt chart, working hours, time zoom, and draggable, resizable bookings.'],
	'/data/document-editor': ['Vue Rich Text Editor with Collaboration', 'A Vue rich text editor with tables, code blocks, media, AI rewrite suggestions, and optional Yjs collaboration with shared cursors.'],
	'/data/agent-chat': ['Vue AI Chat Components', 'Build a Vue AI chat interface with a conversation sidebar, streaming messages, tool calls, a composer, and audio or text controls.'],
	'/data/filter-bar': ['Vue Search and Filter Bar'],
	'/data/media-browser': ['Vue Media Browser and File Manager', 'Build a Vue media library with folder navigation, file selection, drag and drop, upload progress, and custom previews for server-backed files.'],
	'/data/month-calendar': ['Vue Month Calendar Component'],
	'/data/week-planner': ['Vue Weekly Calendar and Scheduler'],
	'/data/activity-timeline': ['Vue Activity Timeline Component'],
	'/components/accordion': ['Vue Accordion Component', 'Build collapsible Vue panels with single or multiple open sections, keyboard controls, and accessible expanded-state semantics.'],
	'/components/button': ['Vue Button Component', 'A Vue button component with variants, sizes, icons, loading states, and link support. Try examples and explore the component API.'],
	'/components/dialog': ['Vue Modal Dialog Component'],
	'/components/drawer': ['Vue Drawer and Slide-Out Panel'],
	'/components/dropdown': ['Vue Dropdown Menu Component'],
	'/components/lightbox': ['Vue Lightbox and Image Gallery'],
	'/components/splitter-panel': ['Vue Resizable Split Panels'],
	'/components/tabs': ['Vue Tabs Component', 'Create Vue tab navigation with linked panels, keyboard controls, and accessible ARIA semantics. Explore styles and working examples.'],
	'/components/toast': ['Vue Toast Notifications'],
	'/components/tooltip': ['Vue Tooltip Component', 'Add accessible tooltips to Vue interfaces with hover and focus triggers, floating positioning, and custom content.'],
	'/components/tree-view': ['Vue Tree View with Drag and Drop'],
	'/components/scroll-menu': ['Vue Scrollspy and Table of Contents'],
	'/forms/field': ['Vue Form Field Component'],
	'/forms/form': ['Vue Form Builder and Validation', 'Build Vue forms from components or field schemas, with shared values, validation errors, submission state, and reusable field controls.'],
	'/forms/schema': ['Vue Schema-Based Forms', 'Define typed Vue form schemas, connect field definitions to form data, and understand their relationship to JSON Schema and storage metadata.'],
	'/forms/combobox': ['Vue Searchable Select and Combobox'],
	'/forms/confirmation-code-input': ['Vue OTP and Verification Code Input'],
	'/forms/date-time-picker': ['Vue Date and Time Picker'],
	'/forms/tag-combobox': ['Vue Multi-Select and Tag Input'],
	'/forms/money-input': ['Vue Currency Input Component'],
	'/forms/number-input': ['Vue Number Input Component', 'A Vue number input with labels, validation state, and native minimum, maximum, and step controls.'],
	'/forms/range-input': ['Vue Range Slider Component'],
	'/forms/select-input': ['Vue Segmented Select Input', 'A Vue segmented selector with pill-style choices that wrap into complete buttons on smaller screens.'],
	'/forms/textarea-input': ['Vue Auto-Resizing Textarea'],
	'/forms/textarea-composer': ['Vue Message Composer Component'],
	'/forms/time-selector': ['Vue Time Picker Component'],
	'/forms/toggle': ['Vue Toggle Switch Component'],
	'/forms/wysiwyg': ['Vue WYSIWYG Editor Field'],
	'/mobile/action-sheet': ['Vue Action Sheet Component', 'A Vue bottom action sheet with keyboard and drag dismissal, focus return, and scrollable content. Use it on its own or inside a mobile app shell.'],
	'/mobile/shell': ['Vue Mobile App Shell', 'Build a Vue mobile app layout with safe areas, fixed header and bottom navigation slots, and a scrolling content region.'],
	'/mobile/stack': ['Vue Mobile Stack Navigation', 'Navigate Vue app screens with sliding mobile titles, back buttons, desktop breadcrumbs, and preserved screen state.'],
	'/mobile/bottom-nav': ['Vue Mobile Bottom Navigation'],
	'/mobile/top-bar': ['Vue Mobile Navigation Bar'],
	'/mobile/profile': ['Vue User Profile Header'],
	'/mobile/list-item': ['Vue Mobile List Item Component'],
	'/mobile/safe-area': ['Vue Safe Area Component', 'Apply device safe-area insets to Vue layouts, with examples for mobile webviews and edge-to-edge app interfaces.'],
	'/visual/progress': ['Vue Progress Bars and Circular Progress'],
	'/visual/text-diff': ['Vue Text Diff and Comparison Component'],
};

const componentByRoute = new Map();
for (const record of componentCatalog) {
	if (!componentByRoute.has(record.route)) componentByRoute.set(record.route, record);
}

/**
 * Normalises route identity without retaining a query, fragment, or trailing slash.
 *
 * @param {string} value Route path or local URL.
 * @returns {string} Absolute local path.
 */
export function normalizePagePath(value = '/') {
	const path = String(value).split(/[?#]/, 1)[0].replace(/\/{2,}/g, '/').replace(/\/+$/, '');
	return path.startsWith('/') ? path || '/' : `/${path}`;
}

/**
 * Converts a route slug or component name into readable, acronym-aware title text.
 *
 * @param {string} value Slug or source label.
 * @returns {string} Public-facing label.
 */
export function pageLabel(value) {
	return String(value).replace(/^Dom(?=[A-Z])/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
		.replace(/\b(?:Ai|Api|Css|Html|Json|Otp|Svg|Ui|Url|Wysiwyg|Sso)\b/g, (word) => word.toUpperCase());
}

/**
 * Builds searchable page copy while preserving explicit route policy and block summaries.
 *
 * @param {string} routePath Public route path.
 * @param {object} [existing] Existing route metadata.
 * @returns {object} Route metadata with a search title, visible heading, and description.
 */
export function getPageSeo(routePath, existing = {}) {
	const path = normalizePagePath(routePath);
	const component = componentByRoute.get(path);
	const label = pageLabel(component?.doc?.name || component?.exportName || path.split('/').pop());
	const copy = pageCopy[path];
	let title = copy?.[0];
	let description = copy?.[1] || component?.doc?.description || existing.description;
	if (!title && path.startsWith('/headless/')) {
		title = `Headless ${label} Web Component`;
		description ||= `Use the DOM Studio ${label.toLowerCase()} custom element in plain HTML or any framework. Explore live examples, attributes, events, and keyboard behaviour.`;
	} else if (!title && path.startsWith('/blocks/')) {
		title = `Vue ${pageLabel(existing.title || label)} Template`;
		description ||= `Explore a Vue ${label.toLowerCase()} template built with DOM Studio components, with a working preview and editable source.`;
	} else if (!title && component) {
		title = `Vue ${label} Component`;
	}
	title ||= existing.title || label || 'Vue UI Component Library';
	description ||= `Explore ${title} in DOM Studio, with documentation, interactive examples, and editable source for your application.`;
	return {
		...existing,
		title,
		heading: title,
		canonicalPath: path.includes(':') ? undefined : path,
		description: String(description).replace(/\s+/g, ' ').trim(),
		...(!isIndexablePage(path) ? { robots: existing.robots || 'noindex,follow' } : {}),
	};
}

/**
 * Keeps account screens, private tools, isolated previews, and aliases out of search.
 *
 * @param {string} routePath Route to classify.
 * @returns {boolean} Whether this concrete route belongs in the public sitemap.
 */
export function isIndexablePage(routePath) {
	const path = normalizePagePath(routePath);
	return !/^\/(?:auth(?:\/|$)|licence(?:\/|$)|paywall$)/.test(path)
		&& !path.includes('/preview/')
		&& !['/components/studio', '/designer/studio', '/experiments/template-editor', '/tools', '/data/json-viewer', '/visual/code-block'].includes(path)
		&& !path.split('/').some((segment) => segment.startsWith('_') || /^\(.+\)$/.test(segment));
}

/**
 * Returns one production canonical, retaining only pagination that changes blog content.
 *
 * @param {object} route Resolved Vue Router location.
 * @returns {string} Canonical URL, or an empty string for a missing/private page.
 */
export function getCanonicalUrl(route) {
	let path = normalizePagePath(route.meta?.canonicalPath || route.path);
	if (route.name === 'NotFound' || /noindex/.test(route.meta?.robots || '') || !isIndexablePage(path)) return '';
	if (path.startsWith('/data/media-browser/')) path = '/data/media-browser';
	const page = getBlogPage(route);
	return `${SITE_URL}${path}${path === '/blog' && page > 1 ? `?page=${page}` : ''}`;
}

/**
 * Reads the same positive page number used by the blog pagination controls.
 *
 * @param {object} route Resolved route and query.
 * @returns {number} Positive page number, defaulting to one.
 */
export function getBlogPage(route) {
	const value = route.query?.page;
	const number = Math.floor(Number(Array.isArray(value) ? value[0] : value));
	return Number.isFinite(number) && number > 0 ? number : 1;
}

/**
 * Builds the shared SSR and browser head; loaded articles can supply request-local copy.
 *
 * @param {object} route Resolved route.
 * @returns {{ title: string, meta: object[], link: object[] }} Renderable head tags.
 */
export function getRouteHead(route) {
	if (route.meta?.articleHead?.path === route.path) return route.meta.articleHead.head;
	const meta = route.meta || {};
	const page = getBlogPage(route);
	const pageSuffix = normalizePagePath(route.path) === '/blog' && page > 1 ? ` - Page ${page}` : '';
	const title = `${meta.title || 'Vue UI Component Library'}${pageSuffix} | ${SITE_NAME}`;
	const canonical = getCanonicalUrl(route);
	return {
		title,
		meta: [
			meta.description ? { name: 'description', content: meta.description } : null,
			meta.robots ? { name: 'robots', content: meta.robots } : null,
			/^\/(?:auth|licence)(?:\/|$)/.test(route.path) ? { name: 'referrer', content: 'no-referrer' } : null,
			{ property: 'og:title', content: title },
			meta.description ? { property: 'og:description', content: meta.description } : null,
			canonical ? { property: 'og:url', content: canonical } : null,
			{ property: 'og:type', content: 'website' },
			{ property: 'og:site_name', content: SITE_NAME },
			{ name: 'twitter:card', content: 'summary' },
			{ name: 'twitter:title', content: title },
			meta.description ? { name: 'twitter:description', content: meta.description } : null,
		].filter(Boolean),
		link: canonical ? [{ rel: 'canonical', href: canonical }] : [],
	};
}
