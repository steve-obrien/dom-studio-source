const REGION_OPTIONS = [
	{ value: 'global', label: 'All regions', description: 'Show the highest customer impact across every public region.' },
	{ value: 'europe', label: 'Europe', description: 'Frankfurt and Dublin customer traffic.' },
	{ value: 'us-east', label: 'US East', description: 'Virginia and Ohio customer traffic.' },
	{ value: 'asia-pacific', label: 'Asia Pacific', description: 'Singapore and Sydney customer traffic.' },
];

const NOTIFICATION_OPTIONS = [
	{ value: 'incidents', label: 'Incidents', description: 'New incidents and every public update.' },
	{ value: 'maintenance', label: 'Maintenance', description: 'Advance notice and completion updates.' },
	{ value: 'digest', label: 'Weekly reliability digest', description: 'Friday uptime and incident summary.' },
];

const COMPONENT_GROUPS = [
	{ id: 'core', label: 'Core platform', description: 'The paths customers use to sign in and work.' },
	{ id: 'delivery', label: 'Event delivery', description: 'Asynchronous workflows and outbound events.' },
	{ id: 'data', label: 'Data services', description: 'Search, imports, and reporting workloads.' },
];

const STATUS_META = {
	operational: { label: 'Operational', tone: 'success', rank: 0 },
	maintenance: { label: 'Under maintenance', tone: 'info', rank: 1 },
	degraded: { label: 'Degraded performance', tone: 'warning', rank: 2 },
	'partial-outage': { label: 'Partial outage', tone: 'danger', rank: 3 },
	'major-outage': { label: 'Major outage', tone: 'danger', rank: 4 },
};

let workspace;

/**
 * Creates the deterministic public status-page workspace.
 *
 * @returns {Record<string, unknown>} Seeded status-page state.
 */
function createWorkspace() {
	return {
		revision: 31,
		sequence: 8300,
		page: {
			name: 'Northstar Cloud',
			domain: 'status.northstar.example',
			checkedAt: '2026-08-02T09:31:00.000Z',
			subscriberCount: 18420,
			verificationCode: '482614',
		},
		components: createComponents(),
		incidents: createIncidents(),
		maintenance: createMaintenanceWindows(),
		subscriptions: [],
		previews: [],
		lastSubscriptionReceipt: null,
	};
}

/**
 * Creates the public component catalog and regional health evidence.
 *
 * @returns {Array<Record<string, unknown>>} Seeded components.
 */
function createComponents() {
	return [
		createComponent({
			id: 'authentication',
			groupId: 'core',
			name: 'Authentication',
			description: 'Sign in, sessions, SSO, and access policy checks.',
			regions: regionalStates(99.999, 'All authentication paths are within target.'),
			historyMarkers: {},
		}),
		createComponent({
			id: 'dashboard',
			groupId: 'core',
			name: 'Dashboard',
			description: 'Workspace navigation, administration, and reporting.',
			regions: regionalStates(99.997, 'Pages and assets are loading normally.'),
			historyMarkers: { global: { 22: 'degraded' }, europe: { 22: 'degraded' } },
		}),
		createComponent({
			id: 'public-api',
			groupId: 'core',
			name: 'Public API',
			description: 'REST, GraphQL, uploads, and API authentication.',
			regions: {
				global: regionState('operational', 99.991, 'Request success is within target.'),
				europe: regionState('operational', 99.982, 'European API traffic is within target.'),
				'us-east': regionState('operational', 99.999, 'US East API traffic is within target.'),
				'asia-pacific': regionState('operational', 99.994, 'Asia Pacific API traffic is within target.'),
			},
			historyMarkers: { global: { 15: 'degraded' }, europe: { 15: 'partial-outage' }, 'us-east': {}, 'asia-pacific': { 7: 'degraded' } },
		}),
		createComponent({
			id: 'webhooks',
			groupId: 'delivery',
			name: 'Webhook delivery',
			description: 'Signed customer events and retry delivery.',
			regions: {
				global: regionState('degraded', 99.941, 'A subset of European deliveries is delayed.'),
				europe: regionState('degraded', 99.884, 'Seven percent of deliveries are delayed by up to six minutes.'),
				'us-east': regionState('operational', 99.997, 'US East delivery is within target.'),
				'asia-pacific': regionState('operational', 99.996, 'Asia Pacific delivery is within target.'),
			},
			historyMarkers: { global: { 8: 'degraded', 29: 'degraded' }, europe: { 8: 'partial-outage', 9: 'degraded', 29: 'degraded' }, 'us-east': { 8: 'degraded' }, 'asia-pacific': {} },
		}),
		createComponent({
			id: 'automations',
			groupId: 'delivery',
			name: 'Automations',
			description: 'Scheduled workflows, triggers, and background jobs.',
			regions: regionalStates(99.986, 'Automation queues are draining within target.'),
			historyMarkers: { global: { 4: 'degraded' }, 'us-east': { 4: 'partial-outage' } },
		}),
		createComponent({
			id: 'search',
			groupId: 'data',
			name: 'Search and indexing',
			description: 'Workspace search, autocomplete, and indexing.',
			regions: regionalStates(99.978, 'Search freshness is within target.'),
			historyMarkers: { global: { 12: 'degraded' }, europe: { 12: 'degraded' } },
		}),
		createComponent({
			id: 'exports',
			groupId: 'data',
			name: 'Imports and exports',
			description: 'Bulk imports, exports, and scheduled reports.',
			regions: {
				global: regionState('operational', 99.962, 'Data jobs are completing within target.'),
				europe: regionState('operational', 99.975, 'European data jobs are within target.'),
				'us-east': regionState('maintenance', 99.948, 'A warehouse index migration starts August 5.'),
				'asia-pacific': regionState('operational', 99.982, 'Asia Pacific data jobs are within target.'),
			},
			historyMarkers: { global: { 18: 'partial-outage' }, europe: {}, 'us-east': { 18: 'partial-outage', 19: 'degraded' }, 'asia-pacific': {} },
		}),
	];
}

/**
 * Creates one component with a 30-day status history for each region.
 *
 * @param {Record<string, unknown>} input Component seed values.
 * @returns {Record<string, unknown>} Component record.
 */
function createComponent(input) {
	const histories = {};
	for (const region of REGION_OPTIONS) histories[region.value] = createHistory(input.historyMarkers[region.value] || {});
	return { ...input, histories };
}

/**
 * Creates identical healthy regional states with a supplied uptime baseline.
 *
 * @param {number} uptime Global uptime percentage.
 * @param {string} detail Customer-facing status detail.
 * @returns {Record<string, Record<string, unknown>>} Regional state map.
 */
function regionalStates(uptime, detail) {
	return {
		global: regionState('operational', uptime, detail),
		europe: regionState('operational', Math.max(99.9, uptime - 0.004), detail),
		'us-east': regionState('operational', Math.min(99.999, uptime + 0.002), detail),
		'asia-pacific': regionState('operational', Math.max(99.9, uptime - 0.002), detail),
	};
}

/**
 * Creates one regional component state.
 *
 * @param {string} status Status identifier.
 * @param {number} uptime Thirty-day uptime percentage.
 * @param {string} detail Customer-facing status detail.
 * @returns {Record<string, unknown>} Regional state.
 */
function regionState(status, uptime, detail) {
	return { status, uptime, detail };
}

/**
 * Creates 30 daily health samples ending on the deterministic demo date.
 *
 * @param {Record<number, string>} markers Exceptional status values by day index.
 * @returns {Array<Record<string, unknown>>} Daily health samples.
 */
function createHistory(markers) {
	return Array.from({ length: 30 }, (_, index) => {
		const date = new Date(Date.UTC(2026, 6, 4 + index));
		const status = markers[index] || 'operational';
		return {
			date: date.toISOString().slice(0, 10),
			label: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
			status,
			uptime: status === 'operational' ? 100 : status === 'degraded' ? 99.2 : status === 'maintenance' ? 100 : 97.4,
		};
	});
}

/**
 * Creates active and historical customer incidents.
 *
 * @returns {Array<Record<string, unknown>>} Incident records.
 */
function createIncidents() {
	return [
		{
			id: 'incident-webhook-latency',
			status: 'monitoring',
			title: 'Delayed webhook delivery in Europe',
			impact: 'Some customers in Europe are receiving webhook events up to six minutes late. No events have been lost.',
			startedAt: '2026-08-02T08:14:00.000Z',
			updatedAt: '2026-08-02T09:26:00.000Z',
			resolvedAt: null,
			regionIds: ['europe'],
			componentIds: ['webhooks'],
			updates: [
				{ id: 'update-1', state: 'monitoring', label: 'Monitoring', publishedAt: '2026-08-02T09:26:00.000Z', body: 'Delivery delay has fallen below one minute. We are monitoring the recovered workers before resolving this incident.' },
				{ id: 'update-2', state: 'identified', label: 'Identified', publishedAt: '2026-08-02T08:41:00.000Z', body: 'A retry queue in our Frankfurt region became saturated. We have moved new deliveries to healthy workers and are draining the backlog.' },
				{ id: 'update-3', state: 'investigating', label: 'Investigating', publishedAt: '2026-08-02T08:14:00.000Z', body: 'We are investigating delayed webhook delivery for a subset of customers in Europe.' },
			],
		},
		{
			id: 'incident-automation-queue',
			status: 'resolved',
			title: 'Automation runs delayed in US East',
			impact: 'Scheduled automations started up to eleven minutes late.',
			startedAt: '2026-07-08T14:06:00.000Z',
			updatedAt: '2026-07-08T15:18:00.000Z',
			resolvedAt: '2026-07-08T15:18:00.000Z',
			regionIds: ['us-east'],
			componentIds: ['automations'],
			postmortemUrl: '/postmortems/automation-queue-july-2026',
			updates: [
				{ id: 'update-4', state: 'resolved', label: 'Resolved', publishedAt: '2026-07-08T15:18:00.000Z', body: 'The queue has recovered and delayed automations have completed.' },
			],
		},
		{
			id: 'incident-export-workers',
			status: 'resolved',
			title: 'Export workers unavailable in US East',
			impact: 'New exports remained queued for 38 minutes.',
			startedAt: '2026-07-22T10:02:00.000Z',
			updatedAt: '2026-07-22T10:40:00.000Z',
			resolvedAt: '2026-07-22T10:40:00.000Z',
			regionIds: ['us-east'],
			componentIds: ['exports'],
			postmortemUrl: '/postmortems/export-workers-july-2026',
			updates: [
				{ id: 'update-5', state: 'resolved', label: 'Resolved', publishedAt: '2026-07-22T10:40:00.000Z', body: 'Export capacity has recovered and all queued jobs are processing normally.' },
			],
		},
	];
}

/**
 * Creates upcoming planned maintenance windows.
 *
 * @returns {Array<Record<string, unknown>>} Maintenance windows.
 */
function createMaintenanceWindows() {
	return [
		{
			id: 'maintenance-warehouse-index',
			title: 'US East warehouse index migration',
			status: 'scheduled',
			startsAt: '2026-08-05T01:00:00.000Z',
			endsAt: '2026-08-05T02:00:00.000Z',
			impact: 'Scheduled exports in US East may start up to ten minutes late. Interactive product traffic is unaffected.',
			regionIds: ['us-east'],
			componentIds: ['exports'],
		},
		{
			id: 'maintenance-edge-certificates',
			title: 'Edge certificate rotation',
			status: 'scheduled',
			startsAt: '2026-08-12T22:00:00.000Z',
			endsAt: '2026-08-12T22:20:00.000Z',
			impact: 'No customer-visible interruption is expected.',
			regionIds: ['europe', 'us-east', 'asia-pacific'],
			componentIds: ['authentication', 'public-api'],
		},
	];
}

/**
 * Returns the customer-facing status page for one region.
 *
 * @param {unknown} regionId Requested region identifier.
 * @returns {Record<string, unknown>} Status-page workspace or validation error.
 */
export function getStatusPageWorkspace(regionId = 'global') {
	const region = String(regionId || 'global');
	if (!REGION_OPTIONS.some((option) => option.value === region)) return validation('Choose a public status region.', { region: ['Choose a listed region.'] });
	const components = workspace.components.map((component) => componentForRegion(component, region));
	const overall = overallStatus(components);
	return clone({
		revision: workspace.revision,
		page: workspace.page,
		catalog: {
			regions: REGION_OPTIONS,
			notifications: NOTIFICATION_OPTIONS,
			componentGroups: COMPONENT_GROUPS,
			statuses: STATUS_META,
		},
		region,
		overall,
		components,
		activeIncidents: workspace.incidents.filter((incident) => incident.status !== 'resolved' && incidentAppliesToRegion(incident, region)),
		incidentHistory: workspace.incidents.filter((incident) => incident.status === 'resolved' && incidentAppliesToRegion(incident, region)),
		maintenance: workspace.maintenance.filter((window) => incidentAppliesToRegion(window, region)),
		lastSubscriptionReceipt: workspace.lastSubscriptionReceipt,
	});
}

/**
 * Returns one component detail with related incidents and maintenance.
 *
 * @param {unknown} componentId Component identifier.
 * @param {unknown} regionId Requested region identifier.
 * @returns {Record<string, unknown>} Component detail or API error.
 */
export function getStatusPageComponent(componentId, regionId = 'global') {
	const component = workspace.components.find((item) => item.id === componentId);
	if (!component) return notFound('Component');
	const workspaceResult = getStatusPageWorkspace(regionId);
	if (workspaceResult.error) return workspaceResult;
	return clone({
		component: componentForRegion(component, String(regionId || 'global')),
		incidents: workspace.incidents.filter((incident) => incident.componentIds.includes(component.id)),
		maintenance: workspace.maintenance.filter((window) => window.componentIds.includes(component.id)),
	});
}

/**
 * Previews a subscription before confirmation email delivery.
 *
 * @param {Record<string, unknown>} input Raw subscription input.
 * @returns {Record<string, unknown>} Immutable preview or validation error.
 */
export function previewStatusSubscription(input) {
	const draft = normalizeSubscription(input);
	const fields = validateSubscription(draft);
	if (Object.keys(fields).length) return validation('Review the subscription details.', fields);
	const preview = {
		id: `preview-${workspace.sequence++}`,
		checksum: checksumFor(JSON.stringify(draft)),
		workspaceRevision: workspace.revision,
		draft,
		emailMasked: maskEmail(draft.email),
		componentLabels: draft.componentIds.map(componentLabel),
		notificationLabels: draft.notificationIds.map(notificationLabel),
		regionLabel: regionLabel(draft.region),
		confirmationExpiresAt: '2026-08-02T10:31:00.000Z',
	};
	workspace.previews.unshift(preview);
	workspace.previews = workspace.previews.slice(0, 8);
	return clone({ preview });
}

/**
 * Creates a pending subscription from an exact preview.
 *
 * @param {Record<string, unknown>} input Subscription commit input.
 * @returns {Record<string, unknown>} Pending subscription and delivery receipt or API error.
 */
export function createStatusSubscription(input) {
	const preview = workspace.previews.find((item) => item.id === input.previewId);
	if (!preview) return conflict('The subscription preview is no longer available. Preview it again.');
	if (preview.checksum !== input.previewChecksum) return conflict('The subscription details changed after preview. Preview them again.');
	if (preview.workspaceRevision !== Number(input.revision) || preview.workspaceRevision !== workspace.revision) return conflict(`Status page changed from revision ${input.revision} to ${workspace.revision}.`);
	const subscription = {
		id: `subscription-${workspace.sequence++}`,
		version: 1,
		status: 'pending-verification',
		...preview.draft,
		createdAt: nowIso(),
		verifiedAt: null,
	};
	workspace.subscriptions.push(subscription);
	workspace.previews = workspace.previews.filter((item) => item.id !== preview.id);
	workspace.revision += 1;
	const receipt = {
		id: `delivery-${workspace.sequence++}`,
		provider: 'Northstar Mail',
		status: 'accepted',
		recipient: preview.emailMasked,
		message: 'Confirm your Northstar status subscription',
		createdAt: nowIso(),
	};
	workspace.lastSubscriptionReceipt = { ...receipt, subscriptionId: subscription.id, subscriptionStatus: subscription.status };
	return clone({
		revision: workspace.revision,
		subscription: publicSubscription(subscription),
		deliveryReceipt: receipt,
		demoVerificationCode: workspace.page.verificationCode,
	});
}

/**
 * Verifies a pending subscription with the deterministic demo code.
 *
 * @param {unknown} subscriptionId Subscription identifier.
 * @param {Record<string, unknown>} input Verification input.
 * @returns {Record<string, unknown>} Active subscription and immutable receipt or API error.
 */
export function verifyStatusSubscription(subscriptionId, input) {
	const subscription = workspace.subscriptions.find((item) => item.id === subscriptionId);
	if (!subscription) return notFound('Subscription');
	if (subscription.status === 'active') return conflict('This subscription is already active.');
	if (Number(input.version) !== subscription.version) return conflict(`Subscription changed from version ${input.version} to ${subscription.version}.`);
	const code = String(input.code || '').replace(/\s/g, '');
	if (code !== workspace.page.verificationCode) return validation('The confirmation code is not valid.', { code: ['Enter the six-digit code from the confirmation email.'] });
	subscription.status = 'active';
	subscription.version += 1;
	subscription.verifiedAt = nowIso();
	workspace.revision += 1;
	workspace.page.subscriberCount += 1;
	const receipt = {
		id: `verification-${workspace.sequence++}`,
		type: 'subscription.verified',
		subscriptionId: subscription.id,
		workspaceRevision: workspace.revision,
		subscriptionVersion: subscription.version,
		createdAt: nowIso(),
		checksum: checksumFor(`${subscription.id}:${subscription.version}:${subscription.verifiedAt}`),
	};
	workspace.lastSubscriptionReceipt = {
		id: receipt.id,
		provider: 'Northstar Status',
		status: 'verified',
		recipient: maskEmail(subscription.email),
		message: `${subscription.componentIds.length} components · ${subscription.notificationIds.length} notification types`,
		createdAt: receipt.createdAt,
		subscriptionId: subscription.id,
		subscriptionStatus: subscription.status,
	};
	return clone({ revision: workspace.revision, subscription: publicSubscription(subscription), receipt });
}

/**
 * Returns a JSON Feed-compatible incident stream.
 *
 * @returns {Record<string, unknown>} Public reliability feed.
 */
export function getStatusPageFeed() {
	return clone({
		version: 'https://jsonfeed.org/version/1.1',
		title: `${workspace.page.name} status updates`,
		home_page_url: `https://${workspace.page.domain}`,
		feed_url: `https://${workspace.page.domain}/api/feed`,
		items: workspace.incidents.flatMap((incident) => incident.updates.map((update) => ({
			id: `${incident.id}:${update.id}`,
			url: `https://${workspace.page.domain}/incidents/${incident.id}`,
			title: `${incident.title} · ${update.label}`,
			content_text: update.body,
			date_published: update.publishedAt,
		}))),
	});
}

/**
 * Restores the deterministic status-page demo state.
 *
 * @returns {Record<string, unknown>} Reset workspace.
 */
export function resetStatusPageWorkspace() {
	workspace = createWorkspace();
	return getStatusPageWorkspace('global');
}

/**
 * Shapes one component for the selected region.
 *
 * @param {Record<string, unknown>} component Component record.
 * @param {string} region Region identifier.
 * @returns {Record<string, unknown>} Region-specific component record.
 */
function componentForRegion(component, region) {
	const state = component.regions[region];
	return {
		id: component.id,
		groupId: component.groupId,
		name: component.name,
		description: component.description,
		status: state.status,
		statusLabel: STATUS_META[state.status].label,
		tone: STATUS_META[state.status].tone,
		uptime: state.uptime,
		detail: state.detail,
		history: component.histories[region],
	};
}

/**
 * Calculates the top-level status from all visible component states.
 *
 * @param {Array<Record<string, unknown>>} components Region-specific components.
 * @returns {Record<string, unknown>} Overall status metadata.
 */
function overallStatus(components) {
	const highest = components.reduce((current, component) => STATUS_META[component.status].rank > STATUS_META[current].rank ? component.status : current, 'operational');
	const affectedCount = components.filter((component) => component.status !== 'operational').length;
	const content = {
		operational: { title: 'All systems operational', summary: 'Every public component is operating within target.' },
		maintenance: { title: 'Scheduled maintenance', summary: 'One component has planned work. Customer impact is described below.' },
		degraded: { title: 'Degraded performance', summary: 'Some customers may experience slower or delayed service.' },
		'partial-outage': { title: 'Partial service outage', summary: 'A subset of customers cannot use one or more services.' },
		'major-outage': { title: 'Major service outage', summary: 'One or more critical services are unavailable.' },
	}[highest];
	return { status: highest, tone: STATUS_META[highest].tone, affectedCount, ...content };
}

/**
 * Checks whether an incident or maintenance window applies to a region.
 *
 * @param {Record<string, unknown>} item Incident or maintenance record.
 * @param {string} region Region identifier.
 * @returns {boolean} Whether the item is visible for the region.
 */
function incidentAppliesToRegion(item, region) {
	return region === 'global' || item.regionIds.includes(region);
}

/**
 * Normalizes raw subscription form values.
 *
 * @param {Record<string, unknown>} input Raw form values.
 * @returns {Record<string, unknown>} Normalized subscription draft.
 */
function normalizeSubscription(input) {
	return {
		email: String(input.email || '').trim().toLowerCase(),
		region: String(input.region || ''),
		componentIds: [...new Set(Array.isArray(input.componentIds) ? input.componentIds.map(String) : [])],
		notificationIds: [...new Set(Array.isArray(input.notificationIds) ? input.notificationIds.map(String) : [])],
	};
}

/**
 * Validates a customer subscription draft.
 *
 * @param {Record<string, unknown>} draft Normalized subscription draft.
 * @returns {Record<string, string[]>} Field errors.
 */
function validateSubscription(draft) {
	const fields = {};
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) fields.email = ['Enter a valid email address.'];
	if (!REGION_OPTIONS.some((option) => option.value === draft.region)) fields.region = ['Choose a listed region.'];
	if (!draft.componentIds.length) fields.componentIds = ['Choose at least one component.'];
	if (draft.componentIds.some((id) => !workspace.components.some((component) => component.id === id))) fields.componentIds = ['Choose only public components.'];
	if (!draft.notificationIds.length) fields.notificationIds = ['Choose at least one notification type.'];
	if (draft.notificationIds.some((id) => !NOTIFICATION_OPTIONS.some((option) => option.value === id))) fields.notificationIds = ['Choose only listed notification types.'];
	return fields;
}

/**
 * Returns a subscription without its full email address.
 *
 * @param {Record<string, unknown>} subscription Subscription record.
 * @returns {Record<string, unknown>} Public subscription record.
 */
function publicSubscription(subscription) {
	return {
		id: subscription.id,
		version: subscription.version,
		status: subscription.status,
		emailMasked: maskEmail(subscription.email),
		region: subscription.region,
		componentIds: subscription.componentIds,
		notificationIds: subscription.notificationIds,
		createdAt: subscription.createdAt,
		verifiedAt: subscription.verifiedAt,
	};
}

/**
 * Masks an email address for public receipts.
 *
 * @param {string} email Email address.
 * @returns {string} Masked email address.
 */
function maskEmail(email) {
	const [local, domain] = String(email).split('@');
	if (!domain) return email;
	return `${local.slice(0, 2)}${'*'.repeat(Math.max(2, local.length - 2))}@${domain}`;
}

/**
 * Resolves a component label.
 *
 * @param {string} componentId Component identifier.
 * @returns {string} Component label.
 */
function componentLabel(componentId) {
	return workspace.components.find((component) => component.id === componentId)?.name || componentId;
}

/**
 * Resolves a notification label.
 *
 * @param {string} notificationId Notification identifier.
 * @returns {string} Notification label.
 */
function notificationLabel(notificationId) {
	return NOTIFICATION_OPTIONS.find((option) => option.value === notificationId)?.label || notificationId;
}

/**
 * Resolves a region label.
 *
 * @param {string} regionId Region identifier.
 * @returns {string} Region label.
 */
function regionLabel(regionId) {
	return REGION_OPTIONS.find((option) => option.value === regionId)?.label || regionId;
}

/**
 * Returns a deterministic timestamp for demo receipts.
 *
 * @returns {string} ISO timestamp.
 */
function nowIso() {
	return new Date(Date.UTC(2026, 7, 2, 9, 31, 0) + (workspace.sequence - 8300) * 1000).toISOString();
}

/**
 * Creates a stable demo checksum.
 *
 * @param {string} value Checksum input.
 * @returns {string} Demo checksum.
 */
function checksumFor(value) {
	let hash = 2166136261;
	for (const character of value) {
		hash ^= character.charCodeAt(0);
		hash = Math.imul(hash, 16777619);
	}
	return `sha256:demo-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Clones JSON-compatible demo data.
 *
 * @param {unknown} value Value to clone.
 * @returns {unknown} Deep-cloned value.
 */
function clone(value) {
	return JSON.parse(JSON.stringify(value));
}

/**
 * Creates a structured validation response.
 *
 * @param {string} message Validation message.
 * @param {Record<string, string[]>} fields Field errors.
 * @returns {Record<string, unknown>} Validation response.
 */
function validation(message, fields) {
	return { error: 'validation_failed', status: 422, message, fields };
}

/**
 * Creates a structured revision-conflict response.
 *
 * @param {string} message Conflict message.
 * @returns {Record<string, unknown>} Conflict response.
 */
function conflict(message) {
	return { error: 'revision_conflict', status: 409, message };
}

/**
 * Creates a structured not-found response.
 *
 * @param {string} resource Resource label.
 * @returns {Record<string, unknown>} Not-found response.
 */
function notFound(resource) {
	return { error: 'not_found', status: 404, message: `${resource} not found.` };
}

workspace = createWorkspace();
