import { createHash } from 'node:crypto';

const categoryOptions = Object.freeze([
	{ value: 'all', label: 'All categories', description: 'Every approved and requestable provider.' },
	{ value: 'crm', label: 'CRM', description: 'Accounts, contacts, pipeline, and lifecycle data.' },
	{ value: 'support', label: 'Support', description: 'Tickets, conversations, SLA, and customer context.' },
	{ value: 'communication', label: 'Communication', description: 'Messages, alerts, approvals, and collaboration.' },
	{ value: 'data', label: 'Data platform', description: 'Warehouses, events, exports, and modelled data.' },
	{ value: 'finance', label: 'Finance', description: 'Subscriptions, invoices, payments, and risk.' },
]);

const statusOptions = Object.freeze([
	{ value: 'all', label: 'All connections', description: 'Connected, attention, and available providers.' },
	{ value: 'connected', label: 'Connected', description: 'Providers with a healthy active connection.' },
	{ value: 'attention', label: 'Needs attention', description: 'Connections blocked by credentials or permissions.' },
	{ value: 'available', label: 'Available', description: 'Approved providers that can be connected.' },
]);

const ownerOptions = Object.freeze([
	{ value: 'maya', label: 'Maya Chen', description: 'Revenue operations' },
	{ value: 'support-ops', label: 'Support Operations', description: 'Customer support systems' },
	{ value: 'data-platform', label: 'Data Platform', description: 'Analytics infrastructure' },
	{ value: 'ari', label: 'Ari Grant', description: 'Application platform' },
]);

const cadenceOptions = Object.freeze([
	{ value: 'manual', label: 'Manual only', description: 'Run synchronisation only when an operator starts it.' },
	{ value: '15m', label: 'Every 15 minutes', description: 'Low-latency operational updates.' },
	{ value: '1h', label: 'Hourly', description: 'Balanced freshness and provider usage.' },
	{ value: '6h', label: 'Every 6 hours', description: 'Periodic enrichment and warehouse exports.' },
	{ value: 'daily', label: 'Daily', description: 'Scheduled batch processing.' },
]);

const regionOptions = Object.freeze([
	{ value: 'us', label: 'United States', description: 'Process and store integration data in the US.' },
	{ value: 'eu', label: 'European Union', description: 'Process and store integration data in the EU.' },
]);

let authorizationSequence = 410;
let receiptSequence = 860;
let runSequence = 1210;
let requestSequence = 70;
let connectors = createInitialConnectors();
let integrationRequests = [];

/**
 * Returns the marketplace workspace, safe provider inventory, rich options, and default detail.
 *
 * @returns {Record<string, unknown>} Integration marketplace bootstrap payload.
 */
export function getIntegrationMarketplaceBootstrap() {
	const defaultConnector = connectors.get('zendesk') || [...connectors.values()][0];
	return cloneValue({
		workspace: serializeWorkspace(),
		options: {
			categories: categoryOptions,
			statuses: statusOptions,
			owners: ownerOptions,
			cadences: cadenceOptions,
			regions: regionOptions,
		},
		connectors: serializeConnectorList(),
		defaultConnectorId: defaultConnector?.id || '',
		connector: defaultConnector ? serializeConnector(defaultConnector) : null,
	});
}

/**
 * Returns one provider with its safe connection contract, scopes, runs, and activity.
 *
 * @param {string} connectorId Provider identifier.
 * @returns {Record<string, unknown>} Connector detail or structured API error.
 */
export function getIntegrationMarketplaceConnector(connectorId) {
	const connector = connectors.get(String(connectorId || ''));
	if (!connector) return notFound('Integration provider');
	return success('', { connector: serializeConnector(connector), connectors: serializeConnectorList(), workspace: serializeWorkspace() });
}

/**
 * Creates a short-lived provider authorization grant without exposing provider tokens.
 *
 * @param {string} connectorId Provider identifier.
 * @param {Record<string, unknown>} input Current revision and workspace context.
 * @returns {Record<string, unknown>} Authorization grant or structured API error.
 */
export function authorizeIntegrationConnector(connectorId, input = {}) {
	const connector = connectors.get(String(connectorId || ''));
	if (!connector) return notFound('Integration provider');
	const revisionError = validateRevision(connector, input.revision);
	if (revisionError) return revisionError;
	if (connector.installMethod !== 'oauth') return validation('This provider uses a credential setup instead of OAuth.', [{ field: 'credential', message: `Enter the ${connector.installMethodLabel.toLowerCase()} supplied by the provider.` }]);
	if (connector.state === 'connected') return conflict('This provider is already connected.', { code: 'integration_already_connected', connector: serializeConnector(connector) });
	const authorization = {
		id: `auth-${connector.id}-${++authorizationSequence}`,
		providerId: connector.id,
		accountLabel: connector.authorizationAccountLabel,
		createdAt: new Date().toISOString(),
		expiresAt: addMinutes(new Date().toISOString(), 10),
		status: 'approved',
	};
	connector.pendingAuthorization = authorization;
	return success(`${connector.name} authorization approved for ${authorization.accountLabel}.`, {
		authorization: cloneValue(authorization),
		connector: serializeConnector(connector),
	});
}

/**
 * Connects or repairs a provider after validating its server-owned contract.
 *
 * @param {string} connectorId Provider identifier.
 * @param {Record<string, unknown>} input Connection configuration and proof.
 * @returns {Record<string, unknown>} Connected provider and immutable receipt or structured API error.
 */
export function connectIntegrationConnector(connectorId, input = {}) {
	const connector = connectors.get(String(connectorId || ''));
	if (!connector) return notFound('Integration provider');
	const revisionError = validateRevision(connector, input.revision);
	if (revisionError) return revisionError;
	if (connector.state === 'connected') return conflict('This provider is already connected.', { code: 'integration_already_connected', connector: serializeConnector(connector) });
	const draft = normalizeConnectionInput(connector, input);
	if (draft.error) return draft;
	const proof = validateConnectionProof(connector, input);
	if (proof.error) return proof;

	const connectedAt = new Date().toISOString();
	const wasRepair = connector.state === 'attention';
	connector.state = 'connected';
	connector.statusLabel = 'Connected';
	connector.statusTone = 'success';
	connector.health = 'Healthy';
	connector.healthTone = 'success';
	connector.connection = {
		name: draft.value.connectionName,
		accountLabel: proof.value.accountLabel,
		ownerId: draft.value.ownerId,
		cadence: draft.value.cadence,
		region: draft.value.region,
		scheduledSync: draft.value.scheduledSync,
		selectedScopes: draft.value.selectedScopes,
		connectedAt,
		credentialFingerprint: proof.value.credentialFingerprint,
	};
	connector.lastSyncAt = null;
	connector.nextSyncAt = draft.value.scheduledSync && draft.value.cadence !== 'manual' ? cadenceNextRun(connectedAt, draft.value.cadence) : null;
	connector.revision += 1;
	connector.pendingAuthorization = null;
	connector.runs.unshift(createRun(connector, 'connection_test', 'passed', 'Connection established and required provider scopes verified.'));
	connector.activity.unshift(createActivity(
		wasRepair ? 'Connection repaired' : 'Connection established',
		`${proof.value.accountLabel} · ${scopeSummary(connector, draft.value.selectedScopes)}`,
		'Steve O’Brien',
		'success',
	));
	const receipt = createReceipt(connector, wasRepair ? 'reconnected' : 'connected');
	return success(wasRepair ? `${connector.name} was reconnected and passed its connection test.` : `${connector.name} is connected and ready to sync.`, {
		connector: serializeConnector(connector),
		connectors: serializeConnectorList(),
		workspace: serializeWorkspace(),
		receipt,
	});
}

/**
 * Persists connection ownership, schedule, region, and optional scopes at an exact revision.
 *
 * @param {string} connectorId Provider identifier.
 * @param {Record<string, unknown>} input Editable settings and current revision.
 * @returns {Record<string, unknown>} Updated provider or structured API error.
 */
export function updateIntegrationConnectorSettings(connectorId, input = {}) {
	const connector = connectors.get(String(connectorId || ''));
	if (!connector) return notFound('Integration provider');
	const revisionError = validateRevision(connector, input.revision);
	if (revisionError) return revisionError;
	if (!connector.connection || connector.state === 'available') return conflict('Connect this provider before changing its runtime settings.', { code: 'integration_not_connected', connector: serializeConnector(connector) });
	const draft = normalizeConnectionInput(connector, { ...input, connectionName: connector.connection.name });
	if (draft.error) return draft;
	const addedScopes = draft.value.selectedScopes.filter((scope) => !connector.connection.selectedScopes.includes(scope));
	const elevatedAdded = connector.optionalScopes.some((scope) => addedScopes.includes(scope.key) && scope.risk === 'elevated');
	if (elevatedAdded && input.elevatedAcknowledged !== true) return validation('Expanded provider access needs explicit acknowledgement.', [{ field: 'elevatedAcknowledged', message: 'Confirm the elevated write access is intended.' }]);

	connector.connection.ownerId = draft.value.ownerId;
	connector.connection.cadence = draft.value.cadence;
	connector.connection.region = draft.value.region;
	connector.connection.scheduledSync = draft.value.scheduledSync;
	connector.connection.selectedScopes = draft.value.selectedScopes;
	connector.nextSyncAt = draft.value.scheduledSync && draft.value.cadence !== 'manual' ? cadenceNextRun(new Date().toISOString(), draft.value.cadence) : null;
	connector.revision += 1;
	connector.activity.unshift(createActivity('Connection settings updated', `${scopeSummary(connector, draft.value.selectedScopes)} · ${cadenceLabel(draft.value.cadence)}`, 'Steve O’Brien', 'neutral'));
	return success('Connection settings saved.', { connector: serializeConnector(connector), connectors: serializeConnectorList(), workspace: serializeWorkspace() });
}

/**
 * Tests current provider credentials and server-owned required scopes.
 *
 * @param {string} connectorId Provider identifier.
 * @param {Record<string, unknown>} input Current provider revision.
 * @returns {Record<string, unknown>} Test evidence and refreshed provider or structured API error.
 */
export function testIntegrationConnector(connectorId, input = {}) {
	const connector = connectors.get(String(connectorId || ''));
	if (!connector) return notFound('Integration provider');
	const revisionError = validateRevision(connector, input.revision);
	if (revisionError) return revisionError;
	if (connector.state === 'available') return conflict('Connect this provider before running a connection test.', { code: 'integration_not_connected', connector: serializeConnector(connector) });
	const failed = connector.state === 'attention';
	const run = createRun(
		connector,
		'connection_test',
		failed ? 'failed' : 'passed',
		failed ? connector.attentionReason : 'Credentials, required scopes, and provider reachability verified.',
	);
	connector.runs.unshift(run);
	connector.revision += 1;
	connector.activity.unshift(createActivity('Connection test completed', run.summary, 'Connection monitor', failed ? 'warning' : 'success'));
	return success(failed ? `${connector.name} still needs attention.` : `${connector.name} passed its connection test.`, {
		connector: serializeConnector(connector),
		connectors: serializeConnectorList(),
		run: cloneValue(run),
	});
}

/**
 * Runs a deterministic manual synchronisation for a healthy connection.
 *
 * @param {string} connectorId Provider identifier.
 * @param {Record<string, unknown>} input Current provider revision.
 * @returns {Record<string, unknown>} Synchronisation evidence or structured API error.
 */
export function syncIntegrationConnector(connectorId, input = {}) {
	const connector = connectors.get(String(connectorId || ''));
	if (!connector) return notFound('Integration provider');
	const revisionError = validateRevision(connector, input.revision);
	if (revisionError) return revisionError;
	if (connector.state !== 'connected') return conflict('Repair this connection before starting a sync.', { code: 'integration_sync_blocked', connector: serializeConnector(connector) });
	const completedAt = new Date().toISOString();
	const run = createRun(connector, 'manual_sync', 'passed', connector.syncSummary);
	connector.runs.unshift(run);
	connector.lastSyncAt = completedAt;
	connector.nextSyncAt = connector.connection?.scheduledSync && connector.connection.cadence !== 'manual' ? cadenceNextRun(completedAt, connector.connection.cadence) : null;
	connector.revision += 1;
	connector.activity.unshift(createActivity('Manual sync completed', run.summary, 'Steve O’Brien', 'success'));
	return success(`${connector.name} sync completed.`, { connector: serializeConnector(connector), connectors: serializeConnectorList(), run: cloneValue(run) });
}

/**
 * Disconnects a provider after exact-name confirmation and an audit reason.
 *
 * @param {string} connectorId Provider identifier.
 * @param {Record<string, unknown>} input Confirmation, reason, and current revision.
 * @returns {Record<string, unknown>} Available provider and disconnection receipt or structured API error.
 */
export function disconnectIntegrationConnector(connectorId, input = {}) {
	const connector = connectors.get(String(connectorId || ''));
	if (!connector) return notFound('Integration provider');
	const revisionError = validateRevision(connector, input.revision);
	if (revisionError) return revisionError;
	if (connector.state === 'available') return conflict('This provider is not connected.', { code: 'integration_not_connected', connector: serializeConnector(connector) });
	const reason = normalizeText(input.reason, 320);
	const fields = [];
	if (String(input.confirmName || '').trim() !== connector.name) fields.push({ field: 'confirmName', message: `Type ${connector.name} exactly.` });
	if (reason.length < 12) fields.push({ field: 'reason', message: 'Record a reason of at least 12 characters.' });
	if (input.acknowledged !== true) fields.push({ field: 'acknowledged', message: 'Confirm scheduled syncs and provider access will stop.' });
	if (fields.length) return validation('Disconnection needs explicit confirmation.', fields);
	const accountLabel = connector.connection?.accountLabel || connector.authorizationAccountLabel;
	connector.state = 'available';
	connector.statusLabel = 'Available';
	connector.statusTone = 'neutral';
	connector.health = 'Ready to connect';
	connector.healthTone = 'neutral';
	connector.connection = null;
	connector.lastSyncAt = null;
	connector.nextSyncAt = null;
	connector.revision += 1;
	connector.activity.unshift(createActivity('Connection disconnected', `${accountLabel} · ${reason}`, 'Steve O’Brien', 'warning'));
	const receipt = createReceipt(connector, 'disconnected');
	return success(`${connector.name} was disconnected and scheduled syncs were stopped.`, {
		connector: serializeConnector(connector),
		connectors: serializeConnectorList(),
		workspace: serializeWorkspace(),
		receipt,
	});
}

/**
 * Records a request for a provider that is not already in the approved catalog.
 *
 * @param {Record<string, unknown>} input Provider request details.
 * @returns {Record<string, unknown>} Request receipt or structured API error.
 */
export function requestIntegrationConnector(input = {}) {
	const providerName = normalizeText(input.providerName, 80);
	const useCase = normalizeText(input.useCase, 500);
	const category = String(input.category || '');
	const fields = [];
	if (providerName.length < 2) fields.push({ field: 'providerName', message: 'Enter the provider name.' });
	if (useCase.length < 12) fields.push({ field: 'useCase', message: 'Describe the intended workflow in at least 12 characters.' });
	if (!categoryOptions.some((option) => option.value === category && option.value !== 'all')) fields.push({ field: 'category', message: 'Choose the closest provider category.' });
	if (fields.length) return validation('The integration request needs a little more detail.', fields);
	const existing = [...connectors.values()].find((connector) => connector.name.toLowerCase() === providerName.toLowerCase());
	if (existing) return conflict(`${existing.name} is already available in the catalog.`, { code: 'integration_already_available', connector: serializeConnector(existing) });
	const request = {
		id: `request-${++requestSequence}`,
		providerName,
		category,
		useCase,
		status: 'triage',
		statusLabel: 'Platform review',
		statusTone: 'info',
		requestedBy: 'Steve O’Brien',
		createdAt: new Date().toISOString(),
	};
	integrationRequests.unshift(request);
	return success(`${providerName} was sent to platform review.`, { request: cloneValue(request), workspace: serializeWorkspace() });
}

/**
 * Restores the seeded catalog, connection states, and activity.
 *
 * @returns {Record<string, unknown>} Fresh marketplace bootstrap payload.
 */
export function resetIntegrationMarketplace() {
	authorizationSequence = 410;
	receiptSequence = 860;
	runSequence = 1210;
	requestSequence = 70;
	connectors = createInitialConnectors();
	integrationRequests = [];
	return success('Integration marketplace reset to the seeded workspace.', getIntegrationMarketplaceBootstrap());
}

/**
 * Creates the initial provider catalog with realistic operational states.
 *
 * @returns {Map<string, Record<string, unknown>>} Seeded connector map.
 */
function createInitialConnectors() {
	const records = [
		createConnector({
			id: 'salesforce', name: 'Salesforce', category: 'crm', categoryLabel: 'CRM', description: 'Keep accounts, contacts, owners, opportunities, and lifecycle stages aligned.',
			state: 'connected', installMethod: 'oauth', installMethodLabel: 'OAuth 2.0', authorizationAccountLabel: 'Northstar Production', ownerId: 'maya', cadence: '15m', region: 'us',
			capabilities: ['Account enrichment', 'Opportunity signals', 'Two-way contacts'],
			requiredScopes: [scope('accounts.read', 'Read accounts', 'Import account identity, tier, and owner.', 'standard'), scope('contacts.read', 'Read contacts', 'Import contact identity and lifecycle state.', 'standard')],
			optionalScopes: [scope('opportunities.read', 'Read opportunities', 'Use pipeline for health and expansion signals.', 'standard'), scope('contacts.write', 'Write contact updates', 'Push lifecycle and product-qualified state back.', 'elevated')],
			selectedScopes: ['accounts.read', 'contacts.read', 'opportunities.read'], lastSyncAt: '2026-08-01T19:52:00.000Z', nextSyncAt: '2026-08-01T20:07:00.000Z', syncSummary: '18,420 account and contact records reconciled.',
			recordMetric: '18.4k records', successRate: '99.2%', revision: 4,
		}),
		createConnector({
			id: 'zendesk', name: 'Zendesk', category: 'support', categoryLabel: 'Support', description: 'Bring ticket volume, SLA state, CSAT, and support history into account views.',
			state: 'attention', installMethod: 'oauth', installMethodLabel: 'OAuth 2.0', authorizationAccountLabel: 'northstar-support.zendesk.com', ownerId: 'support-ops', cadence: '1h', region: 'us',
			capabilities: ['Ticket timeline', 'SLA alerts', 'Internal notes'], attentionReason: 'The provider revoked the users.read permission. Reauthorize to resume syncs.',
			requiredScopes: [scope('tickets.read', 'Read tickets', 'Import requester, tags, priority, and SLA state.', 'standard'), scope('users.read', 'Read users', 'Match ticket requesters to product contacts.', 'standard')],
			optionalScopes: [scope('comments.read', 'Read comments', 'Show recent support context in account timelines.', 'standard'), scope('tickets.write', 'Write internal notes', 'Create private notes from success workflows.', 'elevated')],
			selectedScopes: ['tickets.read'], lastSyncAt: '2026-08-01T17:58:00.000Z', nextSyncAt: null, syncSummary: '4,802 tickets and customer links reconciled.',
			recordMetric: '4.8k tickets', successRate: '91.7%', revision: 3,
		}),
		createConnector({
			id: 'slack', name: 'Slack', category: 'communication', categoryLabel: 'Communication', description: 'Route approvals, customer-room alerts, and workflow updates into Slack.',
			state: 'available', installMethod: 'oauth', installMethodLabel: 'OAuth 2.0', authorizationAccountLabel: 'Northstar HQ', ownerId: 'ari', cadence: 'manual', region: 'us',
			capabilities: ['Approval routing', 'Channel alerts', 'Workflow shortcuts'],
			requiredScopes: [scope('channels.read', 'Read channels', 'Select approved alert and approval destinations.', 'standard'), scope('chat.write', 'Send messages', 'Post workflow updates to selected channels.', 'standard')],
			optionalScopes: [scope('users.read', 'Read workspace users', 'Map product users to Slack members for mentions.', 'standard'), scope('commands.write', 'Install shortcuts', 'Add workflow shortcuts for support and approvals.', 'elevated')],
			selectedScopes: ['channels.read', 'chat.write'], syncSummary: '14 workflow events delivered to approved channels.', recordMetric: '22.8k installs', successRate: '4 min setup', revision: 1,
		}),
		createConnector({
			id: 'bigquery', name: 'BigQuery', category: 'data', categoryLabel: 'Data platform', description: 'Export product events, account snapshots, and billing state into warehouse tables.',
			state: 'connected', installMethod: 'service_account', installMethodLabel: 'Service account', authorizationAccountLabel: 'northstar-analytics-prod', ownerId: 'data-platform', cadence: '1h', region: 'us',
			capabilities: ['Warehouse export', 'Schema checks', 'Daily compaction'],
			requiredScopes: [scope('datasets.write', 'Write datasets', 'Create and update managed analytics datasets.', 'standard'), scope('tables.write', 'Write tables', 'Append events and account snapshots.', 'standard')],
			optionalScopes: [scope('jobs.read', 'Read job status', 'Surface export failures and duration.', 'standard'), scope('datasets.read', 'Read datasets', 'Inspect existing schemas before migration.', 'standard')],
			selectedScopes: ['datasets.write', 'tables.write', 'jobs.read'], lastSyncAt: '2026-08-01T19:38:00.000Z', nextSyncAt: '2026-08-01T20:38:00.000Z', syncSummary: '2.6 million warehouse rows exported.',
			recordMetric: '2.6m rows', successRate: '98.6%', revision: 5,
		}),
		createConnector({
			id: 'stripe', name: 'Stripe', category: 'finance', categoryLabel: 'Finance', description: 'Import subscription state, invoices, payment risk, and customer revenue metrics.',
			state: 'available', installMethod: 'api_key', installMethodLabel: 'Restricted API key', authorizationAccountLabel: 'Northstar Billing', ownerId: 'maya', cadence: '1h', region: 'us',
			capabilities: ['MRR snapshots', 'Invoice timeline', 'Payment status'],
			requiredScopes: [scope('customers.read', 'Read customers', 'Match billing customers to product accounts.', 'standard'), scope('subscriptions.read', 'Read subscriptions', 'Import renewal and cancellation state.', 'standard')],
			optionalScopes: [scope('invoices.read', 'Read invoices', 'Show open, paid, and failed invoice history.', 'standard'), scope('webhooks.write', 'Create webhooks', 'Register billing event callbacks automatically.', 'elevated')],
			selectedScopes: ['customers.read', 'subscriptions.read'], syncSummary: '6,240 customer and subscription records reconciled.', recordMetric: '17.2k installs', successRate: '6 min setup', revision: 1,
		}),
		createConnector({
			id: 'hubspot', name: 'HubSpot', category: 'crm', categoryLabel: 'CRM', description: 'Map companies, contacts, deals, and marketing lifecycle stages into your workspace.',
			state: 'available', installMethod: 'oauth', installMethodLabel: 'OAuth 2.0', authorizationAccountLabel: 'Northstar Marketing', ownerId: 'maya', cadence: '1h', region: 'eu',
			capabilities: ['Deal sync', 'Company fields', 'Marketing lifecycle'],
			requiredScopes: [scope('contacts.read', 'Read contacts', 'Import identity, lifecycle stage, and owner.', 'standard'), scope('companies.read', 'Read companies', 'Import firmographics and account ownership.', 'standard')],
			optionalScopes: [scope('deals.read', 'Read deals', 'Bring pipeline amount and stage into health.', 'standard'), scope('contacts.write', 'Write contact updates', 'Push product-qualified lifecycle changes back.', 'elevated')],
			selectedScopes: ['contacts.read', 'companies.read'], syncSummary: '11,830 company and contact records reconciled.', recordMetric: '15.1k installs', successRate: '5 min setup', revision: 1,
		}),
	];
	return new Map(records.map((connector) => [connector.id, connector]));
}

/**
 * Creates a normalized provider record and seeded operational evidence.
 *
 * @param {Record<string, unknown>} input Provider catalog values.
 * @returns {Record<string, unknown>} Normalized connector.
 */
function createConnector(input) {
	const connected = input.state !== 'available';
	const statusLabel = input.state === 'connected' ? 'Connected' : input.state === 'attention' ? 'Needs attention' : 'Available';
	const statusTone = input.state === 'connected' ? 'success' : input.state === 'attention' ? 'warning' : 'neutral';
	return {
		...input,
		statusLabel,
		statusTone,
		health: input.state === 'connected' ? 'Healthy' : input.state === 'attention' ? 'Permission blocked' : 'Ready to connect',
		healthTone: input.state === 'connected' ? 'success' : input.state === 'attention' ? 'warning' : 'neutral',
		connection: connected ? {
			name: `${input.name} production`,
			accountLabel: input.authorizationAccountLabel,
			ownerId: input.ownerId,
			cadence: input.cadence,
			region: input.region,
			scheduledSync: input.cadence !== 'manual',
			selectedScopes: [...input.selectedScopes],
			connectedAt: '2026-06-11T09:20:00.000Z',
			credentialFingerprint: `${input.installMethodLabel} · managed`,
		} : null,
		pendingAuthorization: null,
		runs: [createRun({ id: input.id, name: input.name }, input.state === 'attention' ? 'connection_test' : 'scheduled_sync', input.state === 'attention' ? 'failed' : 'passed', input.state === 'attention' ? input.attentionReason : input.syncSummary)],
		activity: [
			createActivity(input.state === 'attention' ? 'Sync paused' : input.state === 'connected' ? 'Scheduled sync completed' : 'Provider approved', input.state === 'attention' ? input.attentionReason : input.state === 'connected' ? input.syncSummary : `${input.installMethodLabel} contract reviewed by Platform Security.`, input.state === 'available' ? 'Platform Security' : 'Integration worker', input.state === 'attention' ? 'warning' : 'success'),
			createActivity('Provider contract reviewed', `${input.requiredScopes.length} required and ${input.optionalScopes.length} optional scopes documented.`, 'Platform Security', 'neutral'),
		],
	};
}

/**
 * Creates one server-owned provider scope record.
 *
 * @param {string} key Scope identifier.
 * @param {string} label Human-readable scope name.
 * @param {string} description Data-access explanation.
 * @param {string} risk Risk classification.
 * @returns {Record<string, unknown>} Provider scope.
 */
function scope(key, label, description, risk) {
	return { key, label, description, risk, required: false };
}

/**
 * Normalizes editable connection settings and validates server-owned scope requirements.
 *
 * @param {Record<string, unknown>} connector Provider record.
 * @param {Record<string, unknown>} input Submitted settings.
 * @returns {Record<string, unknown>} Normalized values or structured validation error.
 */
function normalizeConnectionInput(connector, input) {
	const connectionName = normalizeText(input.connectionName, 80);
	const ownerId = String(input.ownerId || '');
	const cadence = String(input.cadence || '');
	const region = String(input.region || '');
	const selectedScopes = [...new Set(Array.isArray(input.selectedScopes) ? input.selectedScopes.map(String) : [])];
	const allowedScopes = [...connector.requiredScopes, ...connector.optionalScopes].map((item) => item.key);
	const requiredScopes = connector.requiredScopes.map((item) => item.key);
	const fields = [];
	if (connectionName.length < 3) fields.push({ field: 'connectionName', message: 'Name this connection with at least 3 characters.' });
	if (!ownerOptions.some((option) => option.value === ownerId)) fields.push({ field: 'ownerId', message: 'Choose an accountable owner.' });
	if (!cadenceOptions.some((option) => option.value === cadence)) fields.push({ field: 'cadence', message: 'Choose a supported sync cadence.' });
	if (!regionOptions.some((option) => option.value === region)) fields.push({ field: 'region', message: 'Choose a processing region.' });
	if (selectedScopes.some((item) => !allowedScopes.includes(item))) fields.push({ field: 'selectedScopes', message: 'One or more provider scopes are not part of the approved contract.' });
	if (requiredScopes.some((item) => !selectedScopes.includes(item))) fields.push({ field: 'selectedScopes', message: 'All server-required scopes must remain enabled.' });
	if (input.acknowledged !== true) fields.push({ field: 'acknowledged', message: 'Confirm the provider account, access, and processing region.' });
	if (fields.length) return validation('The connection plan needs attention.', fields);
	return { value: { connectionName, ownerId, cadence, region, selectedScopes, scheduledSync: input.scheduledSync === true } };
}

/**
 * Validates an OAuth grant or credential without storing secret material.
 *
 * @param {Record<string, unknown>} connector Provider record.
 * @param {Record<string, unknown>} input Submitted connection proof.
 * @returns {Record<string, unknown>} Safe account proof or validation error.
 */
function validateConnectionProof(connector, input) {
	if (connector.installMethod === 'oauth') {
		const authorization = connector.pendingAuthorization;
		if (!authorization || input.authorizationId !== authorization.id || authorization.status !== 'approved') {
			return validation(`Authorize ${connector.name} before completing this connection.`, [{ field: 'authorizationId', message: 'Complete the provider authorization step.' }]);
		}
		if (Date.parse(authorization.expiresAt) <= Date.now()) return conflict('The provider authorization expired. Start authorization again.', { code: 'integration_authorization_expired', connector: serializeConnector(connector) });
		return { value: { accountLabel: authorization.accountLabel, credentialFingerprint: 'OAuth grant · token encrypted' } };
	}
	const credential = String(input.credential || '').trim();
	if (connector.installMethod === 'api_key' && (!credential.startsWith('rk_test_') || credential.length < 18)) {
		return validation('The provider rejected this restricted key.', [{ field: 'credential', message: 'Use a demo restricted key beginning with rk_test_ and at least 18 characters.' }]);
	}
	if (connector.installMethod === 'service_account' && (!credential.startsWith('{') || !credential.includes('client_email'))) {
		return validation('The service account payload is incomplete.', [{ field: 'credential', message: 'Provide JSON containing client_email.' }]);
	}
	return { value: { accountLabel: connector.authorizationAccountLabel, credentialFingerprint: `${connector.installMethodLabel} · ${fingerprint(credential)}` } };
}

/**
 * Validates an optimistic connector revision.
 *
 * @param {Record<string, unknown>} connector Provider record.
 * @param {unknown} revision Submitted revision.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function validateRevision(connector, revision) {
	if (Number(revision) === connector.revision) return null;
	return conflict('This connection changed after it was loaded. Review the latest state and try again.', {
		code: 'integration_revision_conflict',
		connector: serializeConnector(connector),
		connectors: serializeConnectorList(),
	});
}

/**
 * Returns a safe, detailed provider representation.
 *
 * @param {Record<string, unknown>} connector Internal provider record.
 * @returns {Record<string, unknown>} Serialized connector.
 */
function serializeConnector(connector) {
	return cloneValue({
		id: connector.id,
		name: connector.name,
		category: connector.category,
		categoryLabel: connector.categoryLabel,
		description: connector.description,
		state: connector.state,
		statusLabel: connector.statusLabel,
		statusTone: connector.statusTone,
		health: connector.health,
		healthTone: connector.healthTone,
		installMethod: connector.installMethod,
		installMethodLabel: connector.installMethodLabel,
		capabilities: connector.capabilities,
		requiredScopes: connector.requiredScopes.map((item) => ({ ...item, required: true })),
		optionalScopes: connector.optionalScopes,
		connection: connector.connection,
		attentionReason: connector.attentionReason || null,
		lastSyncAt: connector.lastSyncAt || null,
		nextSyncAt: connector.nextSyncAt || null,
		recordMetric: connector.recordMetric,
		successRate: connector.successRate,
		revision: connector.revision,
		runs: connector.runs.slice(0, 6),
		activity: connector.activity.slice(0, 8),
		pendingAuthorization: connector.pendingAuthorization,
	});
}

/**
 * Returns compact providers for the discovery rail.
 *
 * @returns {Record<string, unknown>[]} Safe provider summaries.
 */
function serializeConnectorList() {
	return [...connectors.values()].map((connector) => ({
		id: connector.id,
		name: connector.name,
		category: connector.category,
		categoryLabel: connector.categoryLabel,
		description: connector.description,
		state: connector.state,
		statusLabel: connector.statusLabel,
		statusTone: connector.statusTone,
		health: connector.health,
		healthTone: connector.healthTone,
		installMethodLabel: connector.installMethodLabel,
		recordMetric: connector.recordMetric,
		lastSyncAt: connector.lastSyncAt || null,
		revision: connector.revision,
	}));
}

/**
 * Returns dynamic workspace counts without exposing connector credentials.
 *
 * @returns {Record<string, unknown>} Marketplace workspace summary.
 */
function serializeWorkspace() {
	const values = [...connectors.values()];
	return {
		name: 'Northstar Platform',
		area: 'Connections',
		actor: 'Steve O’Brien',
		catalogCount: values.length,
		connectedCount: values.filter((item) => item.state === 'connected').length,
		attentionCount: values.filter((item) => item.state === 'attention').length,
		availableCount: values.filter((item) => item.state === 'available').length,
		requestCount: integrationRequests.length,
		policy: 'Approved providers · least privilege · US or EU processing',
	};
}

/**
 * Creates deterministic run evidence for connection tests and syncs.
 *
 * @param {Record<string, unknown>} connector Provider record.
 * @param {string} type Run type.
 * @param {string} status Run outcome.
 * @param {string} summary Human-readable evidence.
 * @returns {Record<string, unknown>} Run record.
 */
function createRun(connector, type, status, summary) {
	const createdAt = new Date().toISOString();
	return {
		id: `run-${++runSequence}`,
		type,
		typeLabel: type === 'manual_sync' ? 'Manual sync' : type === 'scheduled_sync' ? 'Scheduled sync' : 'Connection test',
		status,
		statusLabel: status === 'passed' ? 'Passed' : 'Failed',
		statusTone: status === 'passed' ? 'success' : 'danger',
		summary,
		createdAt,
		durationMs: status === 'passed' ? 1284 : 642,
		providerId: connector.id,
		providerName: connector.name,
	};
}

/**
 * Creates one provider activity event.
 *
 * @param {string} label Event label.
 * @param {string} detail Event detail.
 * @param {string} actor Event actor.
 * @param {string} tone Visual tone.
 * @returns {Record<string, unknown>} Activity record.
 */
function createActivity(label, detail, actor, tone) {
	return { id: `event-${++receiptSequence}`, label, detail, actor, tone, createdAt: new Date().toISOString() };
}

/**
 * Creates an immutable lifecycle receipt without secret material.
 *
 * @param {Record<string, unknown>} connector Provider record.
 * @param {string} action Lifecycle action.
 * @returns {Record<string, unknown>} Receipt.
 */
function createReceipt(connector, action) {
	return {
		id: `receipt-${++receiptSequence}`,
		action,
		providerId: connector.id,
		providerName: connector.name,
		workspace: 'Northstar Platform',
		connectionRevision: connector.revision,
		createdAt: new Date().toISOString(),
		createdBy: 'Steve O’Brien',
	};
}

/**
 * Returns a concise scope count for audit messages.
 *
 * @param {Record<string, unknown>} connector Provider record.
 * @param {string[]} selectedScopes Selected scope identifiers.
 * @returns {string} Scope summary.
 */
function scopeSummary(connector, selectedScopes) {
	return `${connector.requiredScopes.length} required · ${Math.max(0, selectedScopes.length - connector.requiredScopes.length)} optional scopes`;
}

/**
 * Returns a safe human-readable cadence label.
 *
 * @param {string} cadence Cadence value.
 * @returns {string} Cadence label.
 */
function cadenceLabel(cadence) {
	return cadenceOptions.find((option) => option.value === cadence)?.label || cadence;
}

/**
 * Calculates the next scheduled run for a supported cadence.
 *
 * @param {string} value Starting ISO timestamp.
 * @param {string} cadence Cadence identifier.
 * @returns {string|null} Next ISO timestamp.
 */
function cadenceNextRun(value, cadence) {
	const minutes = { '15m': 15, '1h': 60, '6h': 360, daily: 1440 }[cadence];
	return minutes ? addMinutes(value, minutes) : null;
}

/**
 * Adds minutes to an ISO timestamp.
 *
 * @param {string} value ISO timestamp.
 * @param {number} minutes Minutes to add.
 * @returns {string} Shifted ISO timestamp.
 */
function addMinutes(value, minutes) {
	return new Date(Date.parse(value) + (minutes * 60 * 1000)).toISOString();
}

/**
 * Creates a non-secret credential fingerprint.
 *
 * @param {string} value Secret credential.
 * @returns {string} Short fingerprint.
 */
function fingerprint(value) {
	return createHash('sha256').update(value).digest('hex').slice(0, 8).toUpperCase();
}

/**
 * Normalizes bounded text.
 *
 * @param {unknown} value Submitted value.
 * @param {number} maxLength Maximum length.
 * @returns {string} Trimmed text.
 */
function normalizeText(value, maxLength) {
	return String(value || '').trim().slice(0, maxLength);
}

/**
 * Creates a successful API response.
 *
 * @param {string} message Human-readable result.
 * @param {Record<string, unknown>} data Response data.
 * @returns {Record<string, unknown>} Success response.
 */
function success(message, data = {}) {
	return { ok: true, status: 200, message, ...cloneValue(data) };
}

/**
 * Creates a structured field validation response.
 *
 * @param {string} message Human-readable result.
 * @param {Array<{ field: string, message: string }>} fields Field issues.
 * @returns {Record<string, unknown>} Validation response.
 */
function validation(message, fields) {
	return { ok: false, error: 'validation_error', status: 422, message, fields };
}

/**
 * Creates a structured optimistic or state conflict response.
 *
 * @param {string} message Human-readable result.
 * @param {Record<string, unknown>} data Conflict evidence.
 * @returns {Record<string, unknown>} Conflict response.
 */
function conflict(message, data = {}) {
	return { ok: false, error: 'conflict', status: 409, message, ...cloneValue(data) };
}

/**
 * Creates a structured missing-resource response.
 *
 * @param {string} resource Resource name.
 * @returns {Record<string, unknown>} Not-found response.
 */
function notFound(resource) {
	return { ok: false, error: 'not_found', status: 404, message: `${resource} was not found.` };
}

/**
 * Clones JSON-compatible demo data.
 *
 * @param {unknown} value Value to clone.
 * @returns {any} Deep clone.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}
