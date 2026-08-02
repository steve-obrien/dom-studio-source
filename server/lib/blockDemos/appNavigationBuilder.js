import { createHash } from 'node:crypto';

const visibilityOptions = Object.freeze([
	{ value: 'everyone', label: 'Everyone', description: 'Available to every signed-in workspace member.' },
	{ value: 'roles', label: 'Selected roles', description: 'Shown only to matching roles or plan audiences.' },
	{ value: 'admins', label: 'Admins only', description: 'Reserved for workspace owners and administrators.' },
	{ value: 'hidden', label: 'Hidden draft', description: 'Kept in the draft but removed from every preview.' },
]);

const audienceOptions = Object.freeze([
	{ value: 'all-users', label: 'All users', description: 'Every signed-in workspace member.' },
	{ value: 'workspace-admins', label: 'Workspace admins', description: 'Owners and administrators.' },
	{ value: 'support-agents', label: 'Support agents', description: 'Customer support and success teams.' },
	{ value: 'analysts', label: 'Analysts', description: 'Reporting and data roles.' },
	{ value: 'beta-testers', label: 'Beta testers', description: 'Opted-in product preview cohort.' },
	{ value: 'enterprise-plan', label: 'Enterprise plan', description: 'Customers with enterprise entitlements.' },
]);

const previewAudienceOptions = Object.freeze([
	{ value: 'member', label: 'Workspace member', description: 'Standard signed-in user.' },
	{ value: 'admin', label: 'Workspace admin', description: 'Owner or administrator.' },
	{ value: 'support', label: 'Support agent', description: 'Customer-facing support role.' },
	{ value: 'analyst', label: 'Analyst', description: 'Reporting-focused role.' },
]);

const deviceOptions = Object.freeze([
	{ value: 'desktop', label: 'Desktop shell', description: 'Expanded application sidebar.' },
	{ value: 'compact', label: 'Compact shell', description: 'Collapsed navigation with labels.' },
	{ value: 'mobile', label: 'Mobile drawer', description: 'Narrow app navigation treatment.' },
]);

const iconOptions = Object.freeze([
	{ value: 'M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4v-8.5Z', label: 'Home', group: 'Navigation', keywords: 'home overview house' },
	{ value: 'M4 6h6l2 2h8v10H4V6Z', label: 'Projects', group: 'Navigation', keywords: 'folder projects work' },
	{ value: 'M5 19V5m0 14h14M9 16v-5m4 5V8m4 8v-7', label: 'Analytics', group: 'Navigation', keywords: 'chart reports analytics' },
	{ value: 'M13 3 5 14h6l-1 7 9-12h-6l1-6Z', label: 'Automation', group: 'Navigation', keywords: 'bolt automation workflow' },
	{ value: 'M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Zm8-3.5-2.1-.8a7.2 7.2 0 0 0-.5-1.3l.9-2-2.2-2.2-2 .9a7.2 7.2 0 0 0-1.3-.5L12 4H9l-.8 2.1a7.2 7.2 0 0 0-1.3.5l-2-.9-2.2 2.2.9 2a7.2 7.2 0 0 0-.5 1.3L2 12v3l2.1.8a7.2 7.2 0 0 0 .5 1.3l-.9 2 2.2 2.2 2-.9a7.2 7.2 0 0 0 1.3.5L10 23h3l.8-2.1a7.2 7.2 0 0 0 1.3-.5l2 .9 2.2-2.2-.9-2a7.2 7.2 0 0 0 .5-1.3L21 15v-3Z', label: 'Settings', group: 'Navigation', keywords: 'settings gear admin' },
	{ value: 'M7 10V8a5 5 0 0 1 10 0v2m-11 0h12v10H6V10Zm6 4v2', label: 'Admin', group: 'Navigation', keywords: 'lock admin security' },
	{ value: 'M12 3a9 9 0 1 0 9 9M12 8v4l3 2', label: 'Operations', group: 'Navigation', keywords: 'operations queue clock' },
	{ value: 'M5 5h14v14H5V5Zm3 4h8M8 12h8M8 15h5', label: 'Document', group: 'Navigation', keywords: 'document help page' },
]);

const registeredRoutes = new Set([
	'/app',
	'/app/projects',
	'/app/projects/active',
	'/app/projects/archive',
	'/app/analytics',
	'/app/automations',
	'/app/ops',
	'/app/settings',
	'/app/help',
]);

const registeredFeatureFlags = new Set(['automations_v2', 'navigation_labs']);

let workspace = createInitialWorkspace();
let itemSequence = 120;
let publishSequence = 800;

/**
 * Return the current draft, editor options, validation summary, and signed-in editor.
 *
 * @returns {Record<string, unknown>} Navigation-builder bootstrap payload.
 */
export function getAppNavigationBuilderBootstrap() {
	const validation = validateWorkspaceDraft();
	return cloneValue({
		workspace: workspace.workspace,
		draft: serializeDraft(),
		items: buildTree(),
		validation,
		visibilityOptions,
		audienceOptions,
		previewAudienceOptions,
		deviceOptions,
		iconOptions: iconOptions.map((option) => ({ ...option, path: option.value })),
		currentUser: {
			name: 'Maya Chen',
			email: 'maya@northstar.tools',
			initials: 'MC',
			role: 'Product operations',
		},
	});
}

/**
 * Return a server-filtered navigation preview for one representative audience.
 *
 * @param {Record<string, unknown>} input Preview audience and device query values.
 * @returns {Record<string, unknown>} Filtered navigation tree and preview context.
 */
export function getAppNavigationPreview(input = {}) {
	const audience = normalizeOption(input.audience, previewAudienceOptions, 'member');
	const device = normalizeOption(input.device, deviceOptions, 'desktop');
	const entitlements = entitlementsForAudience(audience);
	const visibleIds = new Set();
	const items = buildTree().map((item) => filterPreviewTree(item, entitlements, visibleIds)).filter(Boolean);
	return cloneValue({
		audience,
		device,
		items,
		meta: {
			visibleCount: visibleIds.size,
			hiddenCount: activeItems().length - visibleIds.size,
			generatedAt: new Date().toISOString(),
			policySource: 'Server-owned preview rules',
		},
	});
}

/**
 * Add a navigation item to the active draft using server-owned hierarchy rules.
 *
 * @param {Record<string, unknown>} input New item fields and optimistic draft revision.
 * @returns {Record<string, unknown>} Updated draft state or validation error.
 */
export function createNavigationItem(input = {}) {
	const revisionError = validateDraftRevision(input.revision);
	if (revisionError) return revisionError;
	const parentId = normalizeNullableId(input.parentId);
	if (parentId && !workspace.items.has(parentId)) return validation('Choose an existing parent item.');
	if (parentId && depthForItem(parentId) >= 2) return validation('Navigation supports up to three levels. Choose a higher parent.');
	const label = normalizeText(input.label, 60);
	if (!label) return validation('Enter a menu label.');
	const url = normalizeRoute(input.url);
	if (!url) return validation('Enter an app-relative route beginning with /.');
	const visibility = normalizeOption(input.visibility, visibilityOptions, 'everyone');
	const now = new Date().toISOString();
	const id = `nav-item-${++itemSequence}`;
	const siblingCount = activeItems().filter((item) => item.parentId === parentId).length;
	const item = {
		id,
		parentId,
		label,
		url,
		description: normalizeText(input.description, 180) || `Navigation destination for ${label}.`,
		icon: normalizeIcon(input.icon),
		visibility,
		audience: visibility === 'everyone' ? ['all-users'] : normalizeAudience(input.audience),
		featureFlag: normalizeText(input.featureFlag, 80),
		requiresAuth: input.requiresAuth !== false,
		openInNewTab: input.openInNewTab === true,
		sortOrder: (siblingCount + 1) * 10,
		archivedAt: null,
		createdAt: now,
		updatedAt: now,
	};
	workspace.items.set(id, item);
	markDraftChanged(id, 'Item added');
	return mutationSuccess(`${label} was added to the navigation draft.`, item);
}

/**
 * Save editable metadata for one navigation item with optimistic locking.
 *
 * @param {string} itemId Stable navigation item identifier.
 * @param {Record<string, unknown>} input Editable fields and optimistic draft revision.
 * @returns {Record<string, unknown>} Updated draft state or API error.
 */
export function updateNavigationItem(itemId, input = {}) {
	const item = workspace.items.get(String(itemId));
	if (!item || item.archivedAt) return notFound('Navigation item');
	const revisionError = validateDraftRevision(input.revision);
	if (revisionError) return revisionError;
	const label = normalizeText(input.label, 60);
	if (!label) return validation('Enter a menu label.');
	const url = normalizeRoute(input.url);
	if (!url) return validation('Enter an app-relative route beginning with /.');
	const visibility = normalizeOption(input.visibility, visibilityOptions, item.visibility);
	const audience = visibility === 'everyone' ? ['all-users'] : normalizeAudience(input.audience);
	if ((visibility === 'roles' || visibility === 'admins') && !audience.length) {
		return validation('Choose at least one audience for this visibility rule.');
	}
	item.label = label;
	item.url = url;
	item.description = normalizeText(input.description, 180);
	item.icon = normalizeIcon(input.icon);
	item.visibility = visibility;
	item.audience = audience;
	item.featureFlag = normalizeText(input.featureFlag, 80);
	item.requiresAuth = input.requiresAuth !== false;
	item.openInNewTab = input.openInNewTab === true;
	item.updatedAt = new Date().toISOString();
	markDraftChanged(item.id, 'Item metadata updated');
	return mutationSuccess(`${item.label} was saved.`, item);
}

/**
 * Persist the entire visible hierarchy after a drag, drop, or keyboard reorder.
 *
 * @param {Record<string, unknown>} input Nested item identifiers and optimistic draft revision.
 * @returns {Record<string, unknown>} Updated draft state or API error.
 */
export function reorderNavigationItems(input = {}) {
	const revisionError = validateDraftRevision(input.revision);
	if (revisionError) return revisionError;
	if (!Array.isArray(input.items)) return validation('Send the reordered navigation tree.');
	const assignments = [];
	const seen = new Set();
	const treeError = collectTreeAssignments(input.items, null, 0, assignments, seen);
	if (treeError) return treeError;
	const expectedIds = activeItems().map((item) => item.id);
	if (seen.size !== expectedIds.length || expectedIds.some((id) => !seen.has(id))) {
		return validation('The reordered tree must include every active navigation item exactly once.');
	}
	for (const assignment of assignments) {
		const item = workspace.items.get(assignment.id);
		item.parentId = assignment.parentId;
		item.sortOrder = assignment.sortOrder;
		item.updatedAt = new Date().toISOString();
	}
	markDraftChanged(assignments.map((assignment) => assignment.id), 'Hierarchy reordered');
	return mutationSuccess('Navigation order saved.');
}

/**
 * Archive a leaf navigation item without deleting its history.
 *
 * @param {string} itemId Stable navigation item identifier.
 * @param {Record<string, unknown>} input Optimistic draft revision and audit reason.
 * @returns {Record<string, unknown>} Updated draft state or API error.
 */
export function archiveNavigationItem(itemId, input = {}) {
	const item = workspace.items.get(String(itemId));
	if (!item || item.archivedAt) return notFound('Navigation item');
	const revisionError = validateDraftRevision(input.revision);
	if (revisionError) return revisionError;
	if (activeItems().some((candidate) => candidate.parentId === item.id)) {
		return validation('Move or archive this item’s children before archiving their parent.');
	}
	const reason = normalizeText(input.reason, 160);
	if (!reason) return validation('Add an archive reason.');
	item.archivedAt = new Date().toISOString();
	item.updatedAt = item.archivedAt;
	markDraftChanged(item.id, 'Item archived', reason);
	return mutationSuccess(`${item.label} was archived.`);
}

/**
 * Run server-owned route, audience, feature-flag, and hierarchy checks.
 *
 * @param {Record<string, unknown>} input Optional optimistic draft revision.
 * @returns {Record<string, unknown>} Current validation report or conflict.
 */
export function validateNavigationDraft(input = {}) {
	if (input.revision !== undefined) {
		const revisionError = validateDraftRevision(input.revision);
		if (revisionError) return revisionError;
	}
	workspace.draft.lastValidatedAt = new Date().toISOString();
	return {
		validation: cloneValue(validateWorkspaceDraft()),
		draft: cloneValue(serializeDraft()),
		message: 'Navigation checks completed against routes, feature flags, and audience policy.',
	};
}

/**
 * Publish a valid immutable navigation version and return deployment proof.
 *
 * @param {Record<string, unknown>} input Optimistic revision and release note.
 * @returns {Record<string, unknown>} Published version receipt or validation error.
 */
export function publishNavigationDraft(input = {}) {
	const revisionError = validateDraftRevision(input.revision);
	if (revisionError) return revisionError;
	const releaseNote = normalizeText(input.releaseNote, 180);
	if (!releaseNote) return validation('Add a short release note before publishing.');
	const report = validateWorkspaceDraft();
	if (report.blockerCount) {
		return validation('Resolve blocking navigation checks before publishing.', report.issues.filter((issue) => issue.severity === 'blocker'));
	}
	const publishedAt = new Date().toISOString();
	workspace.draft.publishedVersion += 1;
	workspace.draft.status = 'published';
	workspace.draft.changedIds = [];
	workspace.draft.updatedAt = publishedAt;
	workspace.draft.lastPublishedAt = publishedAt;
	workspace.draft.lastPublishedBy = 'Maya Chen';
	workspace.draft.lastValidatedAt = publishedAt;
	workspace.draft.revision += 1;
	const payload = JSON.stringify(activeItems().map(serializeItem));
	const receipt = {
		id: `nav-publish-${++publishSequence}`,
		version: workspace.draft.publishedVersion,
		releaseNote,
		publishedAt,
		publishedBy: workspace.draft.lastPublishedBy,
		itemCount: activeItems().length,
		checksum: createHash('sha256').update(`${payload}:${publishedAt}`).digest('hex').slice(0, 16),
	};
	workspace.draft.activity.unshift({
		id: `activity-${receipt.id}`,
		label: `Version ${receipt.version} published`,
		detail: releaseNote,
		createdAt: publishedAt,
		actor: 'Maya Chen',
	});
	return cloneValue({
		receipt,
		draft: serializeDraft(),
		items: buildTree(),
		validation: validateWorkspaceDraft(),
		message: `Navigation version ${receipt.version} is live.`,
	});
}

/**
 * Create the seeded navigation workspace used by the process-local demo API.
 *
 * @returns {Record<string, unknown>} Seeded workspace state.
 */
function createInitialWorkspace() {
	const now = '2026-08-01T09:30:00.000Z';
	const rows = [
		createItem({ id: 'overview', parentId: null, label: 'Overview', url: '/app', icon: iconOptions[0].value, description: 'Workspace home, announcements, and shortcuts.', sortOrder: 10 }),
		createItem({ id: 'projects', parentId: null, label: 'Projects', url: '/app/projects', icon: iconOptions[1].value, description: 'Client work, milestones, and delivery status.', sortOrder: 20 }),
		createItem({ id: 'active-projects', parentId: 'projects', label: 'Active', url: '/app/projects/active', icon: iconOptions[1].value, description: 'Projects currently in delivery.', sortOrder: 10 }),
		createItem({ id: 'project-archive', parentId: 'projects', label: 'Archive', url: '/app/projects/archive', icon: iconOptions[4].value, description: 'Completed and archived projects.', sortOrder: 20 }),
		createItem({ id: 'analytics', parentId: null, label: 'Analytics', url: '/app/analytics', icon: iconOptions[2].value, description: 'Revenue, retention, and delivery reporting.', visibility: 'roles', audience: ['workspace-admins', 'analysts', 'enterprise-plan'], sortOrder: 30 }),
		createItem({ id: 'automations', parentId: null, label: 'Automations', url: '/app/automations', icon: iconOptions[3].value, description: 'Workflow triggers and scheduled actions.', visibility: 'roles', audience: ['workspace-admins', 'beta-testers'], featureFlag: 'automations_v2', sortOrder: 40 }),
		createItem({ id: 'ops-console', parentId: null, label: 'Operations', url: '/app/operations', icon: iconOptions[6].value, description: 'Queues, escalations, and service health.', visibility: 'roles', audience: ['workspace-admins', 'support-agents'], sortOrder: 50 }),
		createItem({ id: 'workspace-settings', parentId: null, label: 'Workspace settings', url: '/app/settings', icon: iconOptions[4].value, description: 'Members, billing, security, and integrations.', visibility: 'admins', audience: ['workspace-admins'], sortOrder: 60 }),
		createItem({ id: 'labs', parentId: null, label: 'Labs', url: '/app/help', icon: iconOptions[7].value, description: 'Hidden product experiments and internal previews.', visibility: 'hidden', audience: ['beta-testers'], featureFlag: 'navigation_labs', sortOrder: 70 }),
	];
	return {
		workspace: {
			id: 'workspace-northstar',
			name: 'Northstar',
			environment: 'Production',
			domain: 'app.northstar.tools',
		},
		draft: {
			id: 'navigation-primary',
			name: 'Primary app navigation',
			status: 'draft',
			revision: 12,
			publishedVersion: 18,
			changedIds: ['ops-console'],
			updatedAt: now,
			lastValidatedAt: null,
			lastPublishedAt: '2026-07-31T15:48:00.000Z',
			lastPublishedBy: 'Jon Bell',
			activity: [{
				id: 'activity-seed-route-change',
				label: 'Operations route changed',
				detail: 'The destination needs to be checked before publishing.',
				createdAt: now,
				actor: 'Maya Chen',
			}],
		},
		items: new Map(rows.map((item) => [item.id, item])),
	};
}

/**
 * Create a normalized seeded navigation item.
 *
 * @param {Record<string, unknown>} input Seed values.
 * @returns {Record<string, unknown>} Navigation item record.
 */
function createItem(input) {
	const createdAt = '2026-07-30T10:00:00.000Z';
	return {
		id: input.id,
		parentId: input.parentId ?? null,
		label: input.label,
		url: input.url,
		description: input.description || '',
		icon: input.icon || iconOptions[7].value,
		visibility: input.visibility || 'everyone',
		audience: input.audience || ['all-users'],
		featureFlag: input.featureFlag || '',
		requiresAuth: input.requiresAuth !== false,
		openInNewTab: input.openInNewTab === true,
		sortOrder: Number(input.sortOrder || 10),
		archivedAt: null,
		createdAt,
		updatedAt: createdAt,
	};
}

/**
 * Serialize the draft without exposing the mutable process-local record.
 *
 * @returns {Record<string, unknown>} Serializable draft record.
 */
function serializeDraft() {
	return {
		...workspace.draft,
		itemCount: activeItems().length,
	};
}

/**
 * Serialize one navigation item for API responses and tree nodes.
 *
 * @param {Record<string, unknown>} item Navigation item record.
 * @returns {Record<string, unknown>} Serializable navigation item.
 */
function serializeItem(item) {
	return {
		...item,
		value: item.id,
		open: item.parentId === null,
		draggable: true,
		acceptsChildren: true,
	};
}

/**
 * Return active items in a stable parent-and-sort order.
 *
 * @returns {Array<Record<string, unknown>>} Active navigation items.
 */
function activeItems() {
	return [...workspace.items.values()]
		.filter((item) => !item.archivedAt)
		.sort((left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label));
}

/**
 * Build the nested tree expected by DomTreeView and app-shell previews.
 *
 * @returns {Array<Record<string, unknown>>} Nested navigation tree.
 */
function buildTree() {
	const rows = activeItems();
	const byParent = new Map();
	for (const item of rows) {
		const parentKey = item.parentId || 'root';
		if (!byParent.has(parentKey)) byParent.set(parentKey, []);
		byParent.get(parentKey).push(item);
	}
	/**
	 * Recursively serialize children under one parent.
	 *
	 * @param {string|null} parentId Parent item identifier.
	 * @returns {Array<Record<string, unknown>>} Nested child rows.
	 */
	function childrenFor(parentId) {
		return (byParent.get(parentId || 'root') || []).map((item) => ({
			...serializeItem(item),
			children: childrenFor(item.id),
		}));
	}
	return childrenFor(null);
}

/**
 * Filter a navigation branch through server-owned role and feature-flag rules.
 *
 * @param {Record<string, unknown>} item Tree item.
 * @param {Set<string>} entitlements Audience entitlements.
 * @param {Set<string>} visibleIds Collector for visible item ids.
 * @returns {Record<string, unknown>|null} Visible tree item or null.
 */
function filterPreviewTree(item, entitlements, visibleIds) {
	if (!isItemVisible(item, entitlements)) return null;
	visibleIds.add(item.id);
	return {
		...item,
		children: (item.children || []).map((child) => filterPreviewTree(child, entitlements, visibleIds)).filter(Boolean),
	};
}

/**
 * Decide whether one item is visible for a server-resolved entitlement set.
 *
 * @param {Record<string, unknown>} item Navigation item.
 * @param {Set<string>} entitlements Audience entitlements.
 * @returns {boolean} True when the item should be present in the preview.
 */
function isItemVisible(item, entitlements) {
	if (item.visibility === 'hidden') return false;
	if (item.featureFlag && !registeredFeatureFlags.has(item.featureFlag)) return false;
	if (item.visibility === 'everyone') return true;
	if (item.visibility === 'admins') return entitlements.has('workspace-admins');
	return item.audience.some((audience) => entitlements.has(audience));
}

/**
 * Resolve representative server entitlements for one preview persona.
 *
 * @param {string} audience Preview audience value.
 * @returns {Set<string>} Audience entitlement values.
 */
function entitlementsForAudience(audience) {
	const values = {
		member: ['all-users'],
		admin: ['all-users', 'workspace-admins', 'enterprise-plan', 'beta-testers'],
		support: ['all-users', 'support-agents'],
		analyst: ['all-users', 'analysts', 'enterprise-plan'],
	};
	return new Set(values[audience] || values.member);
}

/**
 * Compute every blocking issue and warning in the current draft.
 *
 * @returns {Record<string, unknown>} Validation report with counts and item issues.
 */
function validateWorkspaceDraft() {
	const issues = [];
	const paths = new Map();
	for (const item of activeItems()) {
		if (!item.label) issues.push(issue(item.id, 'label', 'blocker', 'Add a menu label.'));
		if (!item.url.startsWith('/')) issues.push(issue(item.id, 'url', 'blocker', 'Use an app-relative route beginning with /.'));
		if (paths.has(item.url)) issues.push(issue(item.id, 'url', 'blocker', `This route is already used by ${paths.get(item.url)}.`));
		paths.set(item.url, item.label);
		if (!registeredRoutes.has(item.url)) issues.push(issue(item.id, 'url', 'blocker', `${item.url} is not registered in the application router.`));
		if ((item.visibility === 'roles' || item.visibility === 'admins') && !item.audience.length) {
			issues.push(issue(item.id, 'audience', 'blocker', 'Choose at least one audience.'));
		}
		if (item.featureFlag && !registeredFeatureFlags.has(item.featureFlag)) {
			issues.push(issue(item.id, 'featureFlag', 'blocker', `${item.featureFlag} is not a registered feature flag.`));
		}
		if (!item.requiresAuth && item.url.startsWith('/app')) {
			issues.push(issue(item.id, 'requiresAuth', 'warning', 'App routes normally require sign in. Confirm server authorization.'));
		}
		if (item.label.length > 24) issues.push(issue(item.id, 'label', 'warning', 'Long labels may truncate in compact navigation.'));
		if (depthForItem(item.id) > 2) issues.push(issue(item.id, 'parentId', 'blocker', 'Navigation supports up to three levels.'));
	}
	return {
		status: issues.some((item) => item.severity === 'blocker') ? 'blocked' : issues.length ? 'warning' : 'ready',
		issues,
		blockerCount: issues.filter((item) => item.severity === 'blocker').length,
		warningCount: issues.filter((item) => item.severity === 'warning').length,
		checkedAt: new Date().toISOString(),
		checks: [
			{ key: 'routes', label: 'Registered routes', healthy: !issues.some((item) => item.field === 'url') },
			{ key: 'audiences', label: 'Audience policy', healthy: !issues.some((item) => item.field === 'audience') },
			{ key: 'flags', label: 'Feature flags', healthy: !issues.some((item) => item.field === 'featureFlag') },
			{ key: 'hierarchy', label: 'Hierarchy depth', healthy: !issues.some((item) => item.field === 'parentId') },
		],
	};
}

/**
 * Build one normalized validation issue.
 *
 * @param {string} itemId Navigation item identifier.
 * @param {string} field Field related to the issue.
 * @param {'blocker'|'warning'} severity Issue severity.
 * @param {string} message Human-readable recovery guidance.
 * @returns {Record<string, string>} Validation issue.
 */
function issue(itemId, field, severity, message) {
	return { id: `${itemId}-${field}-${severity}`, itemId, field, severity, message };
}

/**
 * Collect and validate item assignments from a nested reorder payload.
 *
 * @param {Array<Record<string, unknown>>} items Nested item rows.
 * @param {string|null} parentId Parent identifier.
 * @param {number} depth Current tree depth.
 * @param {Array<Record<string, unknown>>} assignments Mutable assignment collector.
 * @param {Set<string>} seen Mutable unique-id collector.
 * @returns {Record<string, unknown>|null} API validation error or null.
 */
function collectTreeAssignments(items, parentId, depth, assignments, seen) {
	if (depth > 2) return validation('Navigation supports up to three levels.');
	for (let index = 0; index < items.length; index += 1) {
		const id = normalizeText(items[index]?.id || items[index]?.value, 100);
		if (!id || !workspace.items.has(id) || workspace.items.get(id).archivedAt) return validation('The reordered tree contains an unknown item.');
		if (seen.has(id)) return validation('Each navigation item can appear only once.');
		seen.add(id);
		assignments.push({ id, parentId, sortOrder: (index + 1) * 10 });
		const childError = collectTreeAssignments(Array.isArray(items[index].children) ? items[index].children : [], id, depth + 1, assignments, seen);
		if (childError) return childError;
	}
	return null;
}

/**
 * Count ancestor links for one navigation item.
 *
 * @param {string} itemId Navigation item identifier.
 * @returns {number} Zero-based hierarchy depth.
 */
function depthForItem(itemId) {
	let depth = 0;
	let item = workspace.items.get(String(itemId));
	const seen = new Set();
	while (item?.parentId && !seen.has(item.parentId)) {
		seen.add(item.parentId);
		depth += 1;
		item = workspace.items.get(item.parentId);
	}
	return depth;
}

/**
 * Mark one or more items changed and advance the optimistic draft revision.
 *
 * @param {string|Array<string>} itemIds Changed item identifiers.
 * @param {string} label Activity label.
 * @param {string} [detail=''] Optional activity detail.
 * @returns {void}
 */
function markDraftChanged(itemIds, label, detail = '') {
	const ids = Array.isArray(itemIds) ? itemIds : [itemIds];
	workspace.draft.changedIds = [...new Set([...workspace.draft.changedIds, ...ids])];
	workspace.draft.status = 'draft';
	workspace.draft.revision += 1;
	workspace.draft.updatedAt = new Date().toISOString();
	workspace.draft.activity.unshift({
		id: `activity-${workspace.draft.revision}-${Date.now()}`,
		label,
		detail: detail || `${ids.length} navigation item${ids.length === 1 ? '' : 's'} changed.`,
		createdAt: workspace.draft.updatedAt,
		actor: 'Maya Chen',
	});
	workspace.draft.activity = workspace.draft.activity.slice(0, 8);
}

/**
 * Return the complete post-mutation payload used to resynchronize the editor.
 *
 * @param {string} message Success message.
 * @param {Record<string, unknown>|null} [item=null] Optional changed item.
 * @returns {Record<string, unknown>} Mutation response.
 */
function mutationSuccess(message, item = null) {
	return cloneValue({
		message,
		item: item ? serializeItem(item) : null,
		draft: serializeDraft(),
		items: buildTree(),
		validation: validateWorkspaceDraft(),
	});
}

/**
 * Validate an optimistic revision against the current draft.
 *
 * @param {unknown} value Client revision.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function validateDraftRevision(value) {
	const revision = Number(value);
	if (!Number.isInteger(revision)) return validation('Send the draft revision with this change.');
	if (revision !== workspace.draft.revision) {
		return conflict('This navigation draft changed in another session. Refresh before saving.', {
			currentRevision: workspace.draft.revision,
			draft: serializeDraft(),
			items: buildTree(),
		});
	}
	return null;
}

/**
 * Normalize an option value against a finite option list.
 *
 * @param {unknown} value Candidate option value.
 * @param {Array<Record<string, string>>} options Allowed options.
 * @param {string} fallback Fallback value.
 * @returns {string} Normalized option value.
 */
function normalizeOption(value, options, fallback) {
	const candidate = String(value || '');
	return options.some((option) => option.value === candidate) ? candidate : fallback;
}

/**
 * Normalize a user-facing text field to a safe length.
 *
 * @param {unknown} value Candidate text.
 * @param {number} maxLength Maximum returned length.
 * @returns {string} Trimmed text.
 */
function normalizeText(value, maxLength) {
	return String(value ?? '').trim().slice(0, maxLength);
}

/**
 * Normalize an application-relative route.
 *
 * @param {unknown} value Candidate route.
 * @returns {string} Valid route or an empty string.
 */
function normalizeRoute(value) {
	const route = normalizeText(value, 180);
	return route.startsWith('/') && !route.startsWith('//') ? route : '';
}

/**
 * Normalize an optional identifier.
 *
 * @param {unknown} value Candidate identifier.
 * @returns {string|null} Normalized identifier or null.
 */
function normalizeNullableId(value) {
	const id = normalizeText(value, 100);
	return id && id !== 'root' ? id : null;
}

/**
 * Normalize audience values against the server-owned option list.
 *
 * @param {unknown} value Candidate audience array.
 * @returns {Array<string>} Unique valid audience values.
 */
function normalizeAudience(value) {
	const allowed = new Set(audienceOptions.map((option) => option.value));
	return [...new Set((Array.isArray(value) ? value : []).map((item) => String(item)).filter((item) => allowed.has(item)))];
}

/**
 * Normalize icon path data against the curated icon options.
 *
 * @param {unknown} value Candidate SVG path data.
 * @returns {string} Selected icon path.
 */
function normalizeIcon(value) {
	const candidate = normalizeText(value, 900);
	return iconOptions.some((option) => option.value === candidate) ? candidate : iconOptions[7].value;
}

/**
 * Build a validation API response.
 *
 * @param {string} message Human-readable validation message.
 * @param {Array<Record<string, unknown>>} [details=[]] Optional field details.
 * @returns {Record<string, unknown>} Validation error response.
 */
function validation(message, details = []) {
	return { error: 'validation_error', status: 422, message, details };
}

/**
 * Build an optimistic concurrency error response.
 *
 * @param {string} message Human-readable conflict message.
 * @param {Record<string, unknown>} [details={}] Current server state.
 * @returns {Record<string, unknown>} Conflict response.
 */
function conflict(message, details = {}) {
	return { error: 'revision_conflict', status: 409, message, ...details };
}

/**
 * Build a not-found API response.
 *
 * @param {string} resource Resource label.
 * @returns {Record<string, unknown>} Not-found response.
 */
function notFound(resource) {
	return { error: 'not_found', status: 404, message: `${resource} was not found.` };
}

/**
 * Clone serializable data before it crosses the demo API boundary.
 *
 * @template T
 * @param {T} value Serializable value.
 * @returns {T} Detached clone.
 */
function cloneValue(value) {
	return structuredClone(value);
}
