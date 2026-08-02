import { createHash } from 'node:crypto';

const environmentOptions = Object.freeze([
	{ value: 'production', label: 'Production', description: 'Live customer events and production delivery policy.' },
	{ value: 'staging', label: 'Staging', description: 'Pre-production verification with synthetic or test data.' },
	{ value: 'development', label: 'Development', description: 'Developer-owned destinations and local tunnel workflows.' },
]);

const statusOptions = Object.freeze([
	{ value: 'all', label: 'All states', description: 'Healthy, degraded, testing, and disabled endpoints.' },
	{ value: 'healthy', label: 'Healthy', description: 'Recent deliveries and signatures are passing.' },
	{ value: 'degraded', label: 'Needs attention', description: 'Recent failures need operator review.' },
	{ value: 'testing', label: 'Testing', description: 'Non-production endpoints still being verified.' },
	{ value: 'disabled', label: 'Disabled', description: 'Delivery has been intentionally stopped.' },
]);

const deliveryStatusOptions = Object.freeze([
	{ value: 'all', label: 'All deliveries', description: 'Every immutable delivery attempt.' },
	{ value: 'delivered', label: 'Delivered', description: 'The destination returned a successful response.' },
	{ value: 'failed', label: 'Failed', description: 'The destination rejected or timed out.' },
	{ value: 'retrying', label: 'Retrying', description: 'The server will attempt delivery again.' },
]);

const ownerOptions = Object.freeze([
	{ value: 'ari', label: 'Ari Grant', description: 'Application platform' },
	{ value: 'maya', label: 'Maya Chen', description: 'Revenue systems' },
	{ value: 'payments', label: 'Payments Platform', description: 'Billing and checkout reliability' },
	{ value: 'developer-experience', label: 'Developer Experience', description: 'Public API and integration tooling' },
]);

const versionOptions = Object.freeze([
	{ value: '2026-06-01', label: '2026-06-01', description: 'Current stable event envelope and schema.' },
	{ value: '2026-04-15', label: '2026-04-15', description: 'Previous stable schema during migration.' },
]);

const retryPolicyOptions = Object.freeze([
	{ value: 'standard', label: 'Standard retry', description: 'Five attempts over 24 hours with exponential backoff.' },
	{ value: 'fast', label: 'Fast recovery', description: 'Three attempts during the first 30 minutes.' },
	{ value: 'manual', label: 'Manual replay only', description: 'Record failures without scheduling automatic retries.' },
]);

const overlapOptions = Object.freeze([
	{ value: '1', label: '1 hour', description: 'Short overlap for an automated deployment.' },
	{ value: '24', label: '24 hours', description: 'Standard production rollout window.' },
	{ value: '72', label: '72 hours', description: 'Extended overlap for coordinated consumers.' },
]);

const eventCatalog = Object.freeze([
	{ value: 'customer.created', label: 'Customer created', group: 'Customers', description: 'A customer profile was created.' },
	{ value: 'customer.updated', label: 'Customer updated', group: 'Customers', description: 'Profile, metadata, or contact fields changed.' },
	{ value: 'invoice.paid', label: 'Invoice paid', group: 'Billing', description: 'An invoice reached a paid state.' },
	{ value: 'invoice.payment_failed', label: 'Invoice payment failed', group: 'Billing', description: 'A payment attempt needs intervention.' },
	{ value: 'subscription.created', label: 'Subscription created', group: 'Subscriptions', description: 'A subscription became active.' },
	{ value: 'subscription.updated', label: 'Subscription updated', group: 'Subscriptions', description: 'Plan, quantity, or lifecycle state changed.' },
]);

let endpointSequence = 210;
let deliverySequence = 1120;
let receiptSequence = 740;
let endpoints = createInitialEndpoints();

/**
 * Returns the webhook workspace, safe endpoint inventory, options, and default evidence.
 *
 * @returns {Record<string, unknown>} Webhook operations bootstrap payload.
 */
export function getWebhookOperationsBootstrap() {
	const defaultEndpoint = endpoints.get('ep-billing-production') || [...endpoints.values()][0];
	return cloneValue({
		workspace: serializeWorkspace(),
		options: serializeOptions(),
		endpoints: serializeEndpointList(),
		defaultEndpointId: defaultEndpoint?.id || '',
		endpoint: defaultEndpoint ? serializeEndpoint(defaultEndpoint) : null,
		delivery: defaultEndpoint ? serializeDelivery(defaultEndpoint.deliveries[0]) : null,
	});
}

/**
 * Returns one endpoint with safe settings, immutable deliveries, and activity.
 *
 * @param {string} endpointId Endpoint identifier.
 * @returns {Record<string, unknown>} Endpoint detail or a structured API error.
 */
export function getWebhookEndpoint(endpointId) {
	const endpoint = endpoints.get(String(endpointId || ''));
	if (!endpoint) return notFound('Webhook endpoint');
	return success('', {
		workspace: serializeWorkspace(),
		endpoints: serializeEndpointList(),
		endpoint: serializeEndpoint(endpoint),
		delivery: serializeDelivery(endpoint.deliveries[0] || null),
	});
}

/**
 * Returns one immutable delivery attempt for an endpoint.
 *
 * @param {string} endpointId Endpoint identifier.
 * @param {string} deliveryId Delivery identifier.
 * @returns {Record<string, unknown>} Delivery evidence or a structured API error.
 */
export function getWebhookDelivery(endpointId, deliveryId) {
	const endpoint = endpoints.get(String(endpointId || ''));
	if (!endpoint) return notFound('Webhook endpoint');
	const delivery = endpoint.deliveries.find((item) => item.id === String(deliveryId || ''));
	if (!delivery) return notFound('Webhook delivery');
	return success('', {
		endpoint: serializeEndpoint(endpoint),
		endpoints: serializeEndpointList(),
		workspace: serializeWorkspace(),
		delivery: serializeDelivery(delivery),
	});
}

/**
 * Creates an endpoint and returns its signing secret exactly once.
 *
 * @param {Record<string, unknown>} input Endpoint configuration and acknowledgement.
 * @returns {Record<string, unknown>} Created endpoint and one-time secret receipt or a structured API error.
 */
export function createWebhookEndpoint(input = {}) {
	const draft = normalizeEndpointInput(input, null);
	if (draft.error) return draft;
	if (input.acknowledged !== true) {
		return validation('Confirm the endpoint owner and one-time secret handling.', [
			{ field: 'acknowledged', message: 'Confirm the endpoint contract before creating it.' },
		]);
	}
	const duplicate = [...endpoints.values()].find((item) => item.url.toLowerCase() === draft.value.url.toLowerCase() && item.enabled);
	if (duplicate) {
		return conflict('An active endpoint already uses this destination URL.', {
			code: 'webhook_url_in_use',
			endpoint: serializeEndpoint(duplicate),
		});
	}

	const endpointId = `ep-${++endpointSequence}`;
	const secret = createSecret(endpointId);
	const endpoint = createEndpoint({
		id: endpointId,
		...draft.value,
		status: draft.value.environment === 'production' ? 'healthy' : 'testing',
		secret,
		deliveries: [],
		activity: [],
		deliveryVolume: 0,
		failureVolume: 0,
	});
	endpoint.activity.unshift(createActivity('Endpoint created', `${draft.value.url} · ${draft.value.selectedEvents.length} events`, 'Steve O’Brien', 'success'));
	endpoints.set(endpoint.id, endpoint);
	return success(`${endpoint.name} is ready for a test delivery.`, {
		workspace: serializeWorkspace(),
		endpoints: serializeEndpointList(),
		endpoint: serializeEndpoint(endpoint),
		delivery: null,
		secretReceipt: createSecretReceipt(endpoint, secret, 'created'),
	});
}

/**
 * Saves endpoint destination, ownership, subscriptions, and retry policy at an exact revision.
 *
 * @param {string} endpointId Endpoint identifier.
 * @param {Record<string, unknown>} input Editable settings and current revision.
 * @returns {Record<string, unknown>} Updated endpoint or a structured API error.
 */
export function updateWebhookEndpoint(endpointId, input = {}) {
	const endpoint = endpoints.get(String(endpointId || ''));
	if (!endpoint) return notFound('Webhook endpoint');
	const revisionError = validateRevision(endpoint, input.revision);
	if (revisionError) return revisionError;
	if (!endpoint.enabled) return conflict('Enable this endpoint before changing its delivery contract.', { code: 'webhook_endpoint_disabled', endpoint: serializeEndpoint(endpoint) });
	const draft = normalizeEndpointInput(input, endpoint);
	if (draft.error) return draft;
	const duplicate = [...endpoints.values()].find((item) => item.id !== endpoint.id && item.url.toLowerCase() === draft.value.url.toLowerCase() && item.enabled);
	if (duplicate) return conflict('Another active endpoint already uses this destination URL.', { code: 'webhook_url_in_use', endpoint: serializeEndpoint(endpoint) });

	Object.assign(endpoint, draft.value);
	endpoint.revision += 1;
	endpoint.updatedAt = new Date().toISOString();
	endpoint.activity.unshift(createActivity('Endpoint contract updated', `${draft.value.selectedEvents.length} events · ${labelFor(retryPolicyOptions, draft.value.retryPolicy)}`, 'Steve O’Brien', 'neutral'));
	return success('Endpoint settings saved.', endpointPayload(endpoint));
}

/**
 * Sends a synthetic signed delivery through the selected endpoint contract.
 *
 * @param {string} endpointId Endpoint identifier.
 * @param {Record<string, unknown>} input Event type and current endpoint revision.
 * @returns {Record<string, unknown>} Test delivery evidence or a structured API error.
 */
export function sendWebhookTest(endpointId, input = {}) {
	const endpoint = endpoints.get(String(endpointId || ''));
	if (!endpoint) return notFound('Webhook endpoint');
	const revisionError = validateRevision(endpoint, input.revision);
	if (revisionError) return revisionError;
	if (!endpoint.enabled) return conflict('Enable this endpoint before sending a test.', { code: 'webhook_endpoint_disabled', endpoint: serializeEndpoint(endpoint) });
	const eventType = String(input.eventType || '');
	if (!eventCatalog.some((item) => item.value === eventType)) {
		return validation('Choose an event from the server-owned catalog.', [{ field: 'eventType', message: 'Select a valid event type.' }]);
	}
	if (!endpoint.selectedEvents.includes(eventType)) {
		return validation('The test event must be subscribed by this endpoint.', [{ field: 'eventType', message: 'Add this event to the endpoint subscriptions first.' }]);
	}

	const delivery = createDelivery(endpoint, {
		eventType,
		status: 'delivered',
		responseCode: 202,
		latencyMs: 184,
		attemptCount: 1,
		summary: 'Synthetic event accepted and signature verified.',
		isTest: true,
	});
	endpoint.deliveries.unshift(delivery);
	endpoint.deliveryVolume += 1;
	endpoint.revision += 1;
	endpoint.updatedAt = new Date().toISOString();
	endpoint.activity.unshift(createActivity('Test delivery sent', `${eventType} · ${delivery.id}`, 'Steve O’Brien', 'success'));
	refreshEndpointHealth(endpoint);
	return success(`${eventType} test delivered in ${delivery.latencyMs}ms.`, endpointPayload(endpoint, delivery));
}

/**
 * Replays a failed delivery as a new immutable attempt after explicit confirmation.
 *
 * @param {string} endpointId Endpoint identifier.
 * @param {string} deliveryId Source delivery identifier.
 * @param {Record<string, unknown>} input Replay reason, acknowledgement, and current revision.
 * @returns {Record<string, unknown>} Replay evidence and receipt or a structured API error.
 */
export function replayWebhookDelivery(endpointId, deliveryId, input = {}) {
	const endpoint = endpoints.get(String(endpointId || ''));
	if (!endpoint) return notFound('Webhook endpoint');
	const revisionError = validateRevision(endpoint, input.revision);
	if (revisionError) return revisionError;
	if (!endpoint.enabled) return conflict('Enable this endpoint before replaying a delivery.', { code: 'webhook_endpoint_disabled', endpoint: serializeEndpoint(endpoint) });
	const source = endpoint.deliveries.find((item) => item.id === String(deliveryId || ''));
	if (!source) return notFound('Webhook delivery');
	if (source.status === 'delivered') return conflict('Delivered events cannot be replayed from this workflow.', { code: 'webhook_delivery_already_delivered', endpoint: serializeEndpoint(endpoint), delivery: serializeDelivery(source) });
	const errors = [];
	const reason = String(input.reason || '').trim();
	if (reason.length < 12) errors.push({ field: 'reason', message: 'Record at least 12 characters of replay context.' });
	if (input.acknowledged !== true) errors.push({ field: 'acknowledged', message: 'Confirm the payload and destination before replaying.' });
	if (errors.length) return validation('Replay needs operator context and confirmation.', errors);

	const replay = createDelivery(endpoint, {
		eventType: source.eventType,
		status: 'delivered',
		responseCode: 200,
		latencyMs: 236,
		attemptCount: source.attemptCount + 1,
		summary: 'Replay accepted after destination remediation.',
		sourceDeliveryId: source.id,
		payload: source.request.payload,
	});
	endpoint.deliveries.unshift(replay);
	endpoint.deliveryVolume += 1;
	endpoint.revision += 1;
	endpoint.updatedAt = new Date().toISOString();
	endpoint.activity.unshift(createActivity('Delivery replayed', `${source.id} → ${replay.id} · ${reason}`, 'Steve O’Brien', 'success'));
	refreshEndpointHealth(endpoint);
	const receipt = createLifecycleReceipt(endpoint, 'delivery_replayed', { sourceDeliveryId: source.id, deliveryId: replay.id });
	return success(`${source.eventType} replay delivered successfully.`, { ...endpointPayload(endpoint, replay), receipt });
}

/**
 * Rotates the signing secret and returns replacement secret material exactly once.
 *
 * @param {string} endpointId Endpoint identifier.
 * @param {Record<string, unknown>} input Overlap window, reason, acknowledgement, and revision.
 * @returns {Record<string, unknown>} Rotation receipt and safe endpoint or a structured API error.
 */
export function rotateWebhookSecret(endpointId, input = {}) {
	const endpoint = endpoints.get(String(endpointId || ''));
	if (!endpoint) return notFound('Webhook endpoint');
	const revisionError = validateRevision(endpoint, input.revision);
	if (revisionError) return revisionError;
	if (!endpoint.enabled) return conflict('Enable this endpoint before rotating its signing secret.', { code: 'webhook_endpoint_disabled', endpoint: serializeEndpoint(endpoint) });
	const errors = [];
	const overlapHours = String(input.overlapHours || '');
	const reason = String(input.reason || '').trim();
	if (!overlapOptions.some((item) => item.value === overlapHours)) errors.push({ field: 'overlapHours', message: 'Choose a supported overlap window.' });
	if (reason.length < 12) errors.push({ field: 'reason', message: 'Record at least 12 characters explaining the rotation.' });
	if (input.acknowledged !== true) errors.push({ field: 'acknowledged', message: 'Confirm the replacement deployment plan.' });
	if (errors.length) return validation('Secret rotation needs a bounded rollout plan.', errors);

	const previousPrefix = endpoint.secret.prefix;
	const secret = createSecret(endpoint.id);
	endpoint.secret = {
		...secret,
		previousPrefix,
		rotatingUntil: addHours(secret.createdAt, Number(overlapHours)),
	};
	endpoint.revision += 1;
	endpoint.updatedAt = new Date().toISOString();
	endpoint.activity.unshift(createActivity('Signing secret rotated', `${previousPrefix} → ${secret.prefix} · ${overlapHours}h overlap`, 'Steve O’Brien', 'warning'));
	return success('Replacement signing secret created. Store it before closing this receipt.', {
		...endpointPayload(endpoint),
		secretReceipt: createSecretReceipt(endpoint, secret, 'rotated'),
	});
}

/**
 * Disables an endpoint after exact-name confirmation and an auditable reason.
 *
 * @param {string} endpointId Endpoint identifier.
 * @param {Record<string, unknown>} input Confirmation, reason, acknowledgement, and revision.
 * @returns {Record<string, unknown>} Disabled endpoint and receipt or a structured API error.
 */
export function disableWebhookEndpoint(endpointId, input = {}) {
	const endpoint = endpoints.get(String(endpointId || ''));
	if (!endpoint) return notFound('Webhook endpoint');
	const revisionError = validateRevision(endpoint, input.revision);
	if (revisionError) return revisionError;
	if (!endpoint.enabled) return conflict('This endpoint is already disabled.', { code: 'webhook_endpoint_disabled', endpoint: serializeEndpoint(endpoint) });
	const errors = [];
	const reason = String(input.reason || '').trim();
	if (String(input.confirmName || '').trim() !== endpoint.name) errors.push({ field: 'confirmName', message: `Type ${endpoint.name} exactly.` });
	if (reason.length < 12) errors.push({ field: 'reason', message: 'Record at least 12 characters explaining the disablement.' });
	if (input.acknowledged !== true) errors.push({ field: 'acknowledged', message: 'Confirm that new deliveries will stop.' });
	if (errors.length) return validation('Endpoint disablement needs exact confirmation.', errors);

	endpoint.enabled = false;
	endpoint.status = 'disabled';
	endpoint.revision += 1;
	endpoint.updatedAt = new Date().toISOString();
	endpoint.activity.unshift(createActivity('Endpoint disabled', reason, 'Steve O’Brien', 'danger'));
	const receipt = createLifecycleReceipt(endpoint, 'endpoint_disabled', { reason });
	return success(`${endpoint.name} is disabled. Existing delivery evidence remains available.`, { ...endpointPayload(endpoint), receipt });
}

/**
 * Re-enables an endpoint after an explicit delivery-risk acknowledgement.
 *
 * @param {string} endpointId Endpoint identifier.
 * @param {Record<string, unknown>} input Acknowledgement and current revision.
 * @returns {Record<string, unknown>} Enabled endpoint and receipt or a structured API error.
 */
export function enableWebhookEndpoint(endpointId, input = {}) {
	const endpoint = endpoints.get(String(endpointId || ''));
	if (!endpoint) return notFound('Webhook endpoint');
	const revisionError = validateRevision(endpoint, input.revision);
	if (revisionError) return revisionError;
	if (endpoint.enabled) return conflict('This endpoint is already enabled.', { code: 'webhook_endpoint_enabled', endpoint: serializeEndpoint(endpoint) });
	if (input.acknowledged !== true) return validation('Confirm the destination is ready before resuming deliveries.', [{ field: 'acknowledged', message: 'Confirm the endpoint contract has been reviewed.' }]);

	endpoint.enabled = true;
	endpoint.status = endpoint.environment === 'production' ? 'healthy' : 'testing';
	endpoint.revision += 1;
	endpoint.updatedAt = new Date().toISOString();
	endpoint.activity.unshift(createActivity('Endpoint enabled', 'Delivery resumed after operator review.', 'Steve O’Brien', 'success'));
	const receipt = createLifecycleReceipt(endpoint, 'endpoint_enabled');
	return success(`${endpoint.name} is accepting deliveries again.`, { ...endpointPayload(endpoint), receipt });
}

/**
 * Restores the seeded endpoint registry, delivery evidence, and activity.
 *
 * @returns {Record<string, unknown>} Fresh webhook operations bootstrap payload.
 */
export function resetWebhookOperations() {
	endpointSequence = 210;
	deliverySequence = 1120;
	receiptSequence = 740;
	endpoints = createInitialEndpoints();
	return { ...getWebhookOperationsBootstrap(), message: 'Webhook operations reset to the seeded workspace.' };
}

/**
 * Creates the initial endpoint map with realistic health and delivery states.
 *
 * @returns {Map<string, Record<string, unknown>>} Seeded endpoint registry.
 */
function createInitialEndpoints() {
	const map = new Map();
	const billing = createEndpoint({
		id: 'ep-billing-production',
		name: 'Billing production',
		description: 'Subscription and invoice events for the finance data pipeline.',
		url: 'https://events.northstar.example/webhooks/billing',
		environment: 'production',
		status: 'degraded',
		apiVersion: '2026-06-01',
		ownerId: 'payments',
		retryPolicy: 'standard',
		failureAlerts: true,
		selectedEvents: ['invoice.paid', 'invoice.payment_failed', 'subscription.created', 'subscription.updated'],
		secret: createSeedSecret('ep-billing-production', 'whsec_bill_7fd2', 68),
		deliveries: [],
		activity: [],
		deliveryVolume: 3150,
		failureVolume: 69,
	});
	billing.deliveries = [
		createSeedDelivery(billing, 'del-1098', 'invoice.payment_failed', 'failed', 401, 176, 2, 7, 'Destination rejected the signing timestamp after a clock change.'),
		createSeedDelivery(billing, 'del-1097', 'invoice.paid', 'delivered', 200, 242, 1, 14, 'Invoice accepted and queued for finance ingestion.'),
		createSeedDelivery(billing, 'del-1095', 'subscription.updated', 'retrying', 429, 811, 3, 28, 'Destination rate limit reached; another attempt is scheduled.'),
		createSeedDelivery(billing, 'del-1092', 'invoice.paid', 'delivered', 202, 305, 1, 51, 'Invoice accepted for asynchronous processing.'),
	];
	billing.activity = [
		createActivity('Delivery failed', 'del-1098 · HTTP 401 · signature timestamp rejected', 'Delivery monitor', 'warning', 7),
		createActivity('Automatic retry scheduled', 'del-1095 · attempt 4 in 22 minutes', 'Delivery worker', 'neutral', 28),
		createActivity('Event subscriptions updated', 'subscription.updated added', 'Maya Chen', 'neutral', 1440),
	];

	const customer = createEndpoint({
		id: 'ep-customer-platform',
		name: 'Customer platform',
		description: 'Customer lifecycle updates for the account workspace.',
		url: 'https://api.northstar.example/hooks/customers',
		environment: 'production',
		status: 'healthy',
		apiVersion: '2026-06-01',
		ownerId: 'ari',
		retryPolicy: 'standard',
		failureAlerts: true,
		selectedEvents: ['customer.created', 'customer.updated'],
		secret: createSeedSecret('ep-customer-platform', 'whsec_cust_31a0', 22),
		deliveries: [],
		activity: [],
		deliveryVolume: 18742,
		failureVolume: 21,
	});
	customer.deliveries = [
		createSeedDelivery(customer, 'del-1089', 'customer.updated', 'delivered', 200, 163, 1, 4, 'Customer update accepted.'),
		createSeedDelivery(customer, 'del-1087', 'customer.created', 'delivered', 204, 118, 1, 19, 'Customer create processed without a response body.'),
	];
	customer.activity = [createActivity('Connection test passed', 'TLS, signature, and response handling verified.', 'Delivery monitor', 'success', 40)];

	const staging = createEndpoint({
		id: 'ep-checkout-staging',
		name: 'Checkout staging',
		description: 'Pre-production checkout event verification.',
		url: 'https://staging.northstar.example/hooks/checkout',
		environment: 'staging',
		status: 'testing',
		apiVersion: '2026-06-01',
		ownerId: 'developer-experience',
		retryPolicy: 'fast',
		failureAlerts: false,
		selectedEvents: ['invoice.paid', 'invoice.payment_failed', 'subscription.created'],
		secret: createSeedSecret('ep-checkout-staging', 'whsec_test_c018', 4),
		deliveries: [],
		activity: [],
		deliveryVolume: 182,
		failureVolume: 3,
	});
	staging.deliveries = [createSeedDelivery(staging, 'del-test-208', 'subscription.created', 'delivered', 200, 332, 1, 9, 'Synthetic checkout subscription accepted.')];
	staging.activity = [createActivity('Endpoint created', 'Staging validation workflow started.', 'Ari Grant', 'success', 240)];

	const development = createEndpoint({
		id: 'ep-local-tunnel',
		name: 'Local tunnel',
		description: 'Developer destination for event contract debugging.',
		url: 'https://northstar-dev-tunnel.example/webhooks',
		environment: 'development',
		status: 'disabled',
		enabled: false,
		apiVersion: '2026-04-15',
		ownerId: 'developer-experience',
		retryPolicy: 'manual',
		failureAlerts: false,
		selectedEvents: ['customer.created', 'invoice.paid'],
		secret: createSeedSecret('ep-local-tunnel', 'whsec_dev_9a22', 120),
		deliveries: [],
		activity: [createActivity('Endpoint disabled', 'Tunnel owner ended the debugging session.', 'Ari Grant', 'danger', 180)],
		deliveryVolume: 0,
		failureVolume: 0,
	});

	for (const endpoint of [billing, customer, staging, development]) map.set(endpoint.id, endpoint);
	return map;
}

/**
 * Creates a normalized endpoint record.
 *
 * @param {Record<string, unknown>} input Endpoint fields.
 * @returns {Record<string, unknown>} Normalized endpoint.
 */
function createEndpoint(input) {
	const createdAt = input.createdAt || new Date().toISOString();
	return {
		id: input.id,
		name: input.name,
		description: input.description,
		url: input.url,
		environment: input.environment,
		status: input.status,
		enabled: input.enabled !== false,
		apiVersion: input.apiVersion,
		ownerId: input.ownerId,
		retryPolicy: input.retryPolicy,
		failureAlerts: Boolean(input.failureAlerts),
		selectedEvents: [...input.selectedEvents],
		secret: input.secret,
		deliveries: [...(input.deliveries || [])],
		activity: [...(input.activity || [])],
		deliveryVolume: Number(input.deliveryVolume || 0),
		failureVolume: Number(input.failureVolume || 0),
		revision: Number(input.revision || 1),
		createdAt,
		updatedAt: input.updatedAt || createdAt,
	};
}

/**
 * Normalizes endpoint settings and validates the server-owned contract.
 *
 * @param {Record<string, unknown>} input Submitted endpoint settings.
 * @param {Record<string, unknown>|null} current Existing endpoint when editing.
 * @returns {Record<string, unknown>} Normalized values or a structured validation error.
 */
function normalizeEndpointInput(input, current) {
	const errors = [];
	const name = String(input.name ?? current?.name ?? '').trim();
	const description = String(input.description ?? current?.description ?? '').trim();
	const url = String(input.url ?? current?.url ?? '').trim();
	const environment = String(input.environment ?? current?.environment ?? 'production');
	const apiVersion = String(input.apiVersion ?? current?.apiVersion ?? '2026-06-01');
	const ownerId = String(input.ownerId ?? current?.ownerId ?? 'ari');
	const retryPolicy = String(input.retryPolicy ?? current?.retryPolicy ?? 'standard');
	const failureAlerts = input.failureAlerts === undefined ? Boolean(current?.failureAlerts) : input.failureAlerts === true;
	const selectedEvents = uniqueStrings(input.selectedEvents ?? current?.selectedEvents ?? []);

	if (name.length < 3 || name.length > 60) errors.push({ field: 'name', message: 'Use 3 to 60 characters for the endpoint name.' });
	if (description.length < 12 || description.length > 180) errors.push({ field: 'description', message: 'Describe this endpoint in 12 to 180 characters.' });
	const urlError = validateHttpsUrl(url);
	if (urlError) errors.push({ field: 'url', message: urlError });
	if (!environmentOptions.some((item) => item.value === environment)) errors.push({ field: 'environment', message: 'Choose a supported environment.' });
	if (!versionOptions.some((item) => item.value === apiVersion)) errors.push({ field: 'apiVersion', message: 'Choose a supported API version.' });
	if (!ownerOptions.some((item) => item.value === ownerId)) errors.push({ field: 'ownerId', message: 'Choose an accountable owner.' });
	if (!retryPolicyOptions.some((item) => item.value === retryPolicy)) errors.push({ field: 'retryPolicy', message: 'Choose a supported retry policy.' });
	if (!selectedEvents.length) errors.push({ field: 'selectedEvents', message: 'Subscribe to at least one event.' });
	const unknownEvents = selectedEvents.filter((value) => !eventCatalog.some((item) => item.value === value));
	if (unknownEvents.length) errors.push({ field: 'selectedEvents', message: 'One or more events are not in the server catalog.' });
	if (environment === 'production' && !failureAlerts) errors.push({ field: 'failureAlerts', message: 'Production endpoints require failure alerts.' });
	if (errors.length) return validation('Review the endpoint contract before saving.', errors);

	return {
		value: { name, description, url, environment, apiVersion, ownerId, retryPolicy, failureAlerts, selectedEvents },
	};
}

/**
 * Validates a safe HTTPS webhook destination URL.
 *
 * @param {string} value URL candidate.
 * @returns {string} Validation message or an empty string.
 */
function validateHttpsUrl(value) {
	try {
		const url = new URL(value);
		if (url.protocol !== 'https:') return 'Webhook destinations must use HTTPS.';
		if (url.username || url.password) return 'Do not place credentials in the destination URL.';
		if (!url.hostname.includes('.')) return 'Use a complete public or demo hostname.';
		return '';
	} catch {
		return 'Enter a complete HTTPS URL.';
	}
}

/**
 * Creates a deterministic delivery attempt from an endpoint contract.
 *
 * @param {Record<string, unknown>} endpoint Owning endpoint.
 * @param {Record<string, unknown>} input Delivery fields.
 * @returns {Record<string, unknown>} Immutable delivery attempt.
 */
function createDelivery(endpoint, input) {
	const id = input.id || `del-${++deliverySequence}`;
	const occurredAt = input.occurredAt || new Date().toISOString();
	const payload = cloneValue(input.payload || createEventPayload(input.eventType, id));
	const delivered = input.status === 'delivered';
	return {
		id,
		eventId: `evt-${id.replace(/[^a-z0-9]/gi, '')}`,
		eventType: input.eventType,
		status: input.status,
		responseCode: input.responseCode,
		latencyMs: input.latencyMs,
		attemptCount: input.attemptCount,
		summary: input.summary,
		occurredAt,
		isTest: Boolean(input.isTest),
		sourceDeliveryId: input.sourceDeliveryId || null,
		request: {
			headers: {
				'content-type': 'application/json',
				'user-agent': 'DOM-Studio-Webhooks/1.0',
				'x-webhook-id': id,
				'x-webhook-signature': `${endpoint.secret.prefix}.redacted`,
				'x-webhook-timestamp': String(Math.floor(new Date(occurredAt).getTime() / 1000)),
			},
			payload,
		},
		response: {
			headers: delivered ? { 'content-type': 'application/json', 'x-request-id': `req-${id}` } : { 'content-type': 'application/json' },
			body: delivered ? { accepted: true, deliveryId: id } : { accepted: false, error: input.summary },
		},
		signature: {
			algorithm: 'HMAC-SHA256',
			prefix: endpoint.secret.prefix,
			verifiedByDestination: delivered,
		},
		timeline: createDeliveryTimeline(input),
	};
}

/**
 * Creates a seeded delivery at a relative time.
 *
 * @param {Record<string, unknown>} endpoint Owning endpoint.
 * @param {string} id Delivery identifier.
 * @param {string} eventType Event catalog key.
 * @param {string} status Delivery status.
 * @param {number} responseCode HTTP response code.
 * @param {number} latencyMs Delivery latency.
 * @param {number} attemptCount Attempt number.
 * @param {number} minutesAgo Relative age.
 * @param {string} summary Delivery result.
 * @returns {Record<string, unknown>} Seeded delivery.
 */
function createSeedDelivery(endpoint, id, eventType, status, responseCode, latencyMs, attemptCount, minutesAgo, summary) {
	return createDelivery(endpoint, {
		id,
		eventType,
		status,
		responseCode,
		latencyMs,
		attemptCount,
		summary,
		occurredAt: addMinutes(new Date().toISOString(), -minutesAgo),
	});
}

/**
 * Creates readable timing evidence for a delivery attempt.
 *
 * @param {Record<string, unknown>} input Delivery fields.
 * @returns {Record<string, unknown>[]} Delivery timeline.
 */
function createDeliveryTimeline(input) {
	const delivered = input.status === 'delivered';
	return [
		{ label: 'Event serialized', detail: 'Server-owned schema version and event snapshot frozen.', duration: '8ms', tone: 'success' },
		{ label: 'Payload signed', detail: 'HMAC signature and timestamp added without exposing secret material.', duration: '3ms', tone: 'success' },
		{ label: 'Destination response', detail: input.summary, duration: `${Math.max(1, Number(input.latencyMs || 0) - 11)}ms`, tone: delivered ? 'success' : 'danger' },
	];
}

/**
 * Creates a realistic event payload without customer-sensitive values.
 *
 * @param {string} eventType Event catalog key.
 * @param {string} deliveryId Delivery identifier.
 * @returns {Record<string, unknown>} Event payload.
 */
function createEventPayload(eventType, deliveryId) {
	return {
		id: `evt_${deliveryId.replace(/[^a-z0-9]/gi, '')}`,
		type: eventType,
		created: new Date().toISOString(),
		apiVersion: '2026-06-01',
		data: {
			object: eventType.startsWith('invoice.') ? 'invoice' : eventType.startsWith('subscription.') ? 'subscription' : 'customer',
			id: eventType.startsWith('invoice.') ? 'in_demo_1048' : eventType.startsWith('subscription.') ? 'sub_demo_781' : 'cus_demo_291',
			workspaceId: 'ws_northstar',
		},
	};
}

/**
 * Creates new secret material and safe metadata.
 *
 * @param {string} endpointId Endpoint identifier.
 * @returns {Record<string, unknown>} Secret and safe metadata.
 */
function createSecret(endpointId) {
	const entropy = `${endpointId}:${Date.now()}:${receiptSequence}:${Math.random()}`;
	const digest = createHash('sha256').update(entropy).digest('hex');
	const secret = `whsec_${digest.slice(0, 8)}_${digest.slice(8, 40)}`;
	return {
		value: secret,
		prefix: secret.slice(0, 14),
		fingerprint: createHash('sha256').update(secret).digest('hex'),
		createdAt: new Date().toISOString(),
		previousPrefix: null,
		rotatingUntil: null,
	};
}

/**
 * Creates safe seeded secret metadata without retaining plain text.
 *
 * @param {string} endpointId Endpoint identifier.
 * @param {string} prefix Visible prefix.
 * @param {number} ageDays Secret age in days.
 * @returns {Record<string, unknown>} Seeded secret metadata.
 */
function createSeedSecret(endpointId, prefix, ageDays) {
	return {
		value: null,
		prefix,
		fingerprint: createHash('sha256').update(`${endpointId}:seeded`).digest('hex'),
		createdAt: addDays(new Date().toISOString(), -ageDays),
		previousPrefix: null,
		rotatingUntil: null,
	};
}

/**
 * Creates a one-time secret receipt for a create or rotate response.
 *
 * @param {Record<string, unknown>} endpoint Endpoint record.
 * @param {Record<string, unknown>} secret Newly generated secret.
 * @param {string} action Lifecycle action.
 * @returns {Record<string, unknown>} One-time secret receipt.
 */
function createSecretReceipt(endpoint, secret, action) {
	return {
		id: `receipt-${++receiptSequence}`,
		action,
		endpointId: endpoint.id,
		endpointName: endpoint.name,
		secret: secret.value,
		prefix: secret.prefix,
		fingerprint: secret.fingerprint,
		createdAt: secret.createdAt,
		rotatingUntil: endpoint.secret.rotatingUntil,
	};
}

/**
 * Creates a safe lifecycle receipt for replay and endpoint state changes.
 *
 * @param {Record<string, unknown>} endpoint Endpoint record.
 * @param {string} action Lifecycle action.
 * @param {Record<string, unknown>} details Receipt details.
 * @returns {Record<string, unknown>} Lifecycle receipt.
 */
function createLifecycleReceipt(endpoint, action, details = {}) {
	return {
		id: `receipt-${++receiptSequence}`,
		action,
		endpointId: endpoint.id,
		endpointRevision: endpoint.revision,
		createdAt: new Date().toISOString(),
		...cloneValue(details),
	};
}

/**
 * Creates an activity record at a relative or current time.
 *
 * @param {string} title Activity title.
 * @param {string} detail Activity detail.
 * @param {string} actor Activity actor.
 * @param {string} tone Visual tone.
 * @param {number|null} minutesAgo Optional relative age.
 * @returns {Record<string, unknown>} Activity record.
 */
function createActivity(title, detail, actor, tone = 'neutral', minutesAgo = null) {
	return {
		id: `activity-${++receiptSequence}`,
		title,
		detail,
		actor,
		tone,
		createdAt: minutesAgo === null ? new Date().toISOString() : addMinutes(new Date().toISOString(), -minutesAgo),
	};
}

/**
 * Recalculates endpoint status from enabled state and recent delivery evidence.
 *
 * @param {Record<string, unknown>} endpoint Endpoint record.
 * @returns {void}
 */
function refreshEndpointHealth(endpoint) {
	if (!endpoint.enabled) {
		endpoint.status = 'disabled';
		return;
	}
	if (endpoint.environment !== 'production') {
		endpoint.status = 'testing';
		return;
	}
	const recent = endpoint.deliveries.slice(0, 4);
	endpoint.status = recent.some((item) => item.status === 'failed' || item.status === 'retrying') ? 'degraded' : 'healthy';
}

/**
 * Serializes workspace-level health and inventory counts.
 *
 * @returns {Record<string, unknown>} Workspace summary.
 */
function serializeWorkspace() {
	const inventory = [...endpoints.values()];
	const active = inventory.filter((item) => item.enabled);
	const attentionCount = inventory.filter((item) => item.status === 'degraded').length;
	return {
		id: 'ws-northstar',
		name: 'Northstar Platform',
		endpointCount: inventory.length,
		activeCount: active.length,
		attentionCount,
		deliveryCount: 42816,
		successRate: 99.4,
		policy: {
			signature: 'HMAC-SHA256',
			secretStorage: 'SHA-256 fingerprint only in demo responses',
			replayRetention: '30 days',
			maxPayload: '256 KB',
		},
	};
}

/**
 * Serializes rich control options and the server-owned event catalog.
 *
 * @returns {Record<string, unknown>} Webhook control options.
 */
function serializeOptions() {
	return {
		environments: environmentOptions,
		statuses: statusOptions,
		deliveryStatuses: deliveryStatusOptions,
		owners: ownerOptions,
		versions: versionOptions,
		retryPolicies: retryPolicyOptions,
		overlaps: overlapOptions,
		events: eventCatalog,
	};
}

/**
 * Serializes every endpoint into safe inventory rows.
 *
 * @returns {Record<string, unknown>[]} Safe endpoint inventory.
 */
function serializeEndpointList() {
	return [...endpoints.values()].map((endpoint) => serializeEndpointSummary(endpoint));
}

/**
 * Serializes one endpoint row without delivery payloads.
 *
 * @param {Record<string, unknown>} endpoint Endpoint record.
 * @returns {Record<string, unknown>} Safe endpoint summary.
 */
function serializeEndpointSummary(endpoint) {
	const metrics = calculateMetrics(endpoint);
	return {
		id: endpoint.id,
		name: endpoint.name,
		description: endpoint.description,
		url: endpoint.url,
		environment: endpoint.environment,
		environmentLabel: labelFor(environmentOptions, endpoint.environment),
		status: endpoint.status,
		statusLabel: statusLabel(endpoint.status),
		statusTone: statusTone(endpoint.status),
		enabled: endpoint.enabled,
		eventCount: endpoint.selectedEvents.length,
		failureCount: metrics.failureCount,
		successRate: metrics.successRate,
		lastDeliveryAt: endpoint.deliveries[0]?.occurredAt || null,
		revision: endpoint.revision,
	};
}

/**
 * Serializes complete safe endpoint detail.
 *
 * @param {Record<string, unknown>} endpoint Endpoint record.
 * @returns {Record<string, unknown>} Safe endpoint detail.
 */
function serializeEndpoint(endpoint) {
	const metrics = calculateMetrics(endpoint);
	return {
		...serializeEndpointSummary(endpoint),
		apiVersion: endpoint.apiVersion,
		ownerId: endpoint.ownerId,
		ownerLabel: labelFor(ownerOptions, endpoint.ownerId),
		retryPolicy: endpoint.retryPolicy,
		retryPolicyLabel: labelFor(retryPolicyOptions, endpoint.retryPolicy),
		failureAlerts: endpoint.failureAlerts,
		selectedEvents: [...endpoint.selectedEvents],
		secret: {
			prefix: endpoint.secret.prefix,
			fingerprint: endpoint.secret.fingerprint,
			createdAt: endpoint.secret.createdAt,
			ageDays: Math.max(0, Math.floor((Date.now() - new Date(endpoint.secret.createdAt).getTime()) / 86400000)),
			previousPrefix: endpoint.secret.previousPrefix,
			rotatingUntil: endpoint.secret.rotatingUntil,
		},
		metrics,
		deliveries: endpoint.deliveries.map((delivery) => serializeDeliverySummary(delivery)),
		activity: endpoint.activity.map((item) => cloneValue(item)),
		createdAt: endpoint.createdAt,
		updatedAt: endpoint.updatedAt,
	};
}

/**
 * Serializes safe endpoint and inventory state for mutation responses.
 *
 * @param {Record<string, unknown>} endpoint Endpoint record.
 * @param {Record<string, unknown>|null} delivery Selected delivery.
 * @returns {Record<string, unknown>} Mutation response payload.
 */
function endpointPayload(endpoint, delivery = null) {
	return {
		workspace: serializeWorkspace(),
		endpoints: serializeEndpointList(),
		endpoint: serializeEndpoint(endpoint),
		delivery: serializeDelivery(delivery || endpoint.deliveries[0] || null),
	};
}

/**
 * Calculates delivery health from the endpoint evidence set.
 *
 * @param {Record<string, unknown>} endpoint Endpoint record.
 * @returns {Record<string, unknown>} Endpoint delivery metrics.
 */
function calculateMetrics(endpoint) {
	const deliveries = endpoint.deliveries;
	const delivered = deliveries.filter((item) => item.status === 'delivered');
	const failures = deliveries.filter((item) => item.status === 'failed' || item.status === 'retrying');
	const sortedLatency = delivered.map((item) => item.latencyMs).sort((a, b) => a - b);
	const medianLatencyMs = sortedLatency.length ? sortedLatency[Math.floor(sortedLatency.length / 2)] : 0;
	const deliveryVolume = Math.max(endpoint.deliveryVolume, deliveries.length);
	const failureVolume = Math.max(endpoint.failureVolume, failures.length);
	return {
		successRate: deliveryVolume ? Number((((deliveryVolume - failureVolume) / deliveryVolume) * 100).toFixed(1)) : 100,
		failureCount: failureVolume,
		deliveryCount: deliveryVolume,
		medianLatencyMs,
		latestDeliveryAt: deliveries[0]?.occurredAt || null,
	};
}

/**
 * Serializes one delivery row without request or response bodies.
 *
 * @param {Record<string, unknown>} delivery Delivery record.
 * @returns {Record<string, unknown>} Delivery summary.
 */
function serializeDeliverySummary(delivery) {
	return {
		id: delivery.id,
		eventId: delivery.eventId,
		eventType: delivery.eventType,
		eventLabel: labelFor(eventCatalog, delivery.eventType),
		status: delivery.status,
		statusLabel: deliveryStatusLabel(delivery.status),
		statusTone: deliveryStatusTone(delivery.status),
		responseCode: delivery.responseCode,
		latencyMs: delivery.latencyMs,
		attemptCount: delivery.attemptCount,
		summary: delivery.summary,
		occurredAt: delivery.occurredAt,
		isTest: delivery.isTest,
		sourceDeliveryId: delivery.sourceDeliveryId,
		canReplay: delivery.status !== 'delivered',
	};
}

/**
 * Serializes complete immutable delivery evidence.
 *
 * @param {Record<string, unknown>|null} delivery Delivery record.
 * @returns {Record<string, unknown>|null} Safe delivery evidence.
 */
function serializeDelivery(delivery) {
	if (!delivery) return null;
	return {
		...serializeDeliverySummary(delivery),
		request: cloneValue(delivery.request),
		response: cloneValue(delivery.response),
		signature: cloneValue(delivery.signature),
		timeline: cloneValue(delivery.timeline),
	};
}

/**
 * Validates an exact endpoint revision for optimistic writes.
 *
 * @param {Record<string, unknown>} endpoint Endpoint record.
 * @param {unknown} revision Submitted revision.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function validateRevision(endpoint, revision) {
	if (Number(revision) === endpoint.revision) return null;
	return conflict('This endpoint changed after it was loaded. The latest contract has been restored.', {
		code: 'webhook_revision_conflict',
		endpoint: serializeEndpoint(endpoint),
		endpoints: serializeEndpointList(),
		workspace: serializeWorkspace(),
		delivery: serializeDelivery(endpoint.deliveries[0] || null),
	});
}

/**
 * Returns a human label from an option list.
 *
 * @param {ReadonlyArray<Record<string, unknown>>} options Option list.
 * @param {string} value Option value.
 * @returns {string} Matching label or the original value.
 */
function labelFor(options, value) {
	return String(options.find((item) => item.value === value)?.label || value || '—');
}

/**
 * Returns the endpoint status label.
 *
 * @param {string} status Endpoint status.
 * @returns {string} Human-readable label.
 */
function statusLabel(status) {
	return { healthy: 'Healthy', degraded: 'Needs attention', testing: 'Testing', disabled: 'Disabled' }[status] || 'Unknown';
}

/**
 * Returns the endpoint status tone.
 *
 * @param {string} status Endpoint status.
 * @returns {string} DOM Studio tone.
 */
function statusTone(status) {
	return { healthy: 'success', degraded: 'warning', testing: 'info', disabled: 'neutral' }[status] || 'neutral';
}

/**
 * Returns the delivery status label.
 *
 * @param {string} status Delivery status.
 * @returns {string} Human-readable label.
 */
function deliveryStatusLabel(status) {
	return { delivered: 'Delivered', failed: 'Failed', retrying: 'Retrying' }[status] || status;
}

/**
 * Returns the delivery status tone.
 *
 * @param {string} status Delivery status.
 * @returns {string} DOM Studio tone.
 */
function deliveryStatusTone(status) {
	return { delivered: 'success', failed: 'danger', retrying: 'warning' }[status] || 'neutral';
}

/**
 * Deduplicates and normalizes an array of string values.
 *
 * @param {unknown} value Submitted list.
 * @returns {string[]} Unique non-empty values.
 */
function uniqueStrings(value) {
	if (!Array.isArray(value)) return [];
	return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
}

/**
 * Creates a structured successful API response.
 *
 * @param {string} message Human-readable result.
 * @param {Record<string, unknown>} data Response data.
 * @returns {Record<string, unknown>} Success response.
 */
function success(message, data = {}) {
	return { message, ...cloneValue(data) };
}

/**
 * Creates a structured validation response.
 *
 * @param {string} message Human-readable error.
 * @param {Record<string, unknown>[]} fields Field errors.
 * @returns {Record<string, unknown>} Validation response.
 */
function validation(message, fields = []) {
	return { error: true, status: 422, code: 'validation_error', message, fields: cloneValue(fields) };
}

/**
 * Creates a structured conflict response.
 *
 * @param {string} message Human-readable error.
 * @param {Record<string, unknown>} data Conflict recovery data.
 * @returns {Record<string, unknown>} Conflict response.
 */
function conflict(message, data = {}) {
	return { error: true, status: 409, message, ...cloneValue(data) };
}

/**
 * Creates a structured not-found response.
 *
 * @param {string} resource Missing resource label.
 * @returns {Record<string, unknown>} Not-found response.
 */
function notFound(resource) {
	return { error: true, status: 404, code: 'not_found', message: `${resource} was not found.` };
}

/**
 * Clones serializable demo state before returning it to callers.
 *
 * @template T
 * @param {T} value Serializable value.
 * @returns {T} Deep clone.
 */
function cloneValue(value) {
	return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

/**
 * Adds minutes to an ISO timestamp.
 *
 * @param {string} value ISO timestamp.
 * @param {number} minutes Minutes to add.
 * @returns {string} Shifted ISO timestamp.
 */
function addMinutes(value, minutes) {
	return new Date(new Date(value).getTime() + (minutes * 60000)).toISOString();
}

/**
 * Adds hours to an ISO timestamp.
 *
 * @param {string} value ISO timestamp.
 * @param {number} hours Hours to add.
 * @returns {string} Shifted ISO timestamp.
 */
function addHours(value, hours) {
	return new Date(new Date(value).getTime() + (hours * 3600000)).toISOString();
}

/**
 * Adds days to an ISO timestamp.
 *
 * @param {string} value ISO timestamp.
 * @param {number} days Days to add.
 * @returns {string} Shifted ISO timestamp.
 */
function addDays(value, days) {
	return new Date(new Date(value).getTime() + (days * 86400000)).toISOString();
}
