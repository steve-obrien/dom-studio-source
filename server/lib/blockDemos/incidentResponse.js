const SEVERITY_OPTIONS = [
	{ value: 'SEV-1', label: 'SEV-1 · Critical', description: 'Widespread or safety-critical customer impact.' },
	{ value: 'SEV-2', label: 'SEV-2 · Major', description: 'Material customer impact requiring coordinated response.' },
	{ value: 'SEV-3', label: 'SEV-3 · Minor', description: 'Bounded degradation with a clear owning team.' },
];

const CADENCE_OPTIONS = [
	{ value: 15, label: 'Every 15 minutes', description: 'High-impact incident communication cadence.' },
	{ value: 30, label: 'Every 30 minutes', description: 'Default major-incident communication cadence.' },
	{ value: 60, label: 'Every 60 minutes', description: 'Lower-impact monitoring cadence.' },
];

const AUDIENCE_OPTIONS = [
	{ value: 'internal', label: 'Internal responders', description: 'Incident room and stakeholder channel only.' },
	{ value: 'enterprise', label: 'Affected enterprise accounts', description: 'Account-scoped email plus internal channels.' },
	{ value: 'public', label: 'Public status page', description: 'Status page, subscribers, and affected enterprise accounts.' },
];

const PEOPLE_OPTIONS = [
	{ value: 'maya', label: 'Maya Chen', description: 'Incident commander rotation' },
	{ value: 'sam', label: 'Sam Patel', description: 'Platform engineering' },
	{ value: 'ivy', label: 'Ivy Tan', description: 'Customer reliability' },
	{ value: 'nora', label: 'Nora Lee', description: 'Identity engineering' },
	{ value: 'ari', label: 'Ari Grant', description: 'Technical support' },
	{ value: 'steve', label: "Steve O'Brien", description: 'Reliability operations' },
];

const SERVICE_OPTIONS = [
	{ value: 'checkout_api', label: 'Checkout API', description: 'Checkout creation and payment-session orchestration.' },
	{ value: 'webhook_worker', label: 'Webhook worker', description: 'Asynchronous customer event delivery.' },
	{ value: 'identity_api', label: 'Identity API', description: 'Authentication and enterprise SSO.' },
];

let workspace = createInitialWorkspace();

/**
 * Returns the complete incident command workspace.
 *
 * @returns {Record<string, unknown>} Serialized workspace payload.
 */
export function getIncidentResponseWorkspace() {
	return serializeResponse('Incident command room loaded.');
}

/**
 * Restores the deterministic incident response demo.
 *
 * @returns {Record<string, unknown>} Reset workspace payload.
 */
export function resetIncidentResponseWorkspace() {
	workspace = createInitialWorkspace();
	return serializeResponse('Incident response demo reset.');
}

/**
 * Selects one incident at an exact workspace revision.
 *
 * @param {Record<string, unknown>} input Selection request.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function selectIncidentResponseIncident(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	const incident = findIncident(input.incidentId);
	if (!incident) return notFound('Incident');
	workspace.selectedIncidentId = incident.id;
	workspace.revision += 1;
	return serializeResponse(`${incident.title} opened.`);
}

/**
 * Declares a new incident with initial alert and command evidence.
 *
 * @param {Record<string, unknown>} input Declaration fields and exact revision.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function declareIncidentResponseIncident(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	const values = normalizeDeclaration(input);
	const fields = validateDeclaration(values);
	if (Object.keys(fields).length) return validation('Review the incident declaration.', fields);

	const service = SERVICE_OPTIONS.find((option) => option.value === values.serviceId);
	const incident = {
		id: `inc_${workspace.sequence++}`,
		version: 1,
		title: values.title,
		severity: values.severity,
		lifecycle: 'investigating',
		startedAt: nowIso(),
		elapsedLabel: 'Just now',
		nextUpdateLabel: '15 min',
		customerImpact: {
			accountsAffected: 0,
			regions: ['Under assessment'],
			summary: values.impactSummary,
		},
		roles: {
			commanderId: 'steve',
			liaisonId: '',
			scribeId: '',
		},
		cadenceMinutes: values.severity === 'SEV-1' ? 15 : 30,
		bridge: {
			id: `bridge-${workspace.sequence++}`,
			label: 'Responder bridge ready',
			providerReceipt: `zoom-${workspace.sequence++}`,
		},
		sourceAlert: {
			provider: 'Datadog',
			id: `alert-${workspace.sequence++}`,
			monitor: `${service.label} availability`,
			checksum: checksumFor(`${service.value}:${values.title}`),
		},
		services: [
			{ id: service.value, name: service.label, state: 'Major outage', metric: 'Awaiting first sample', trend: 'unknown', monitorReceipt: `monitor-${workspace.sequence++}` },
		],
		monitoring: {
			errorRate: 8.4,
			p95Ms: 1900,
			stableSamples: 0,
			lastCheckedAt: nowIso(),
			providerReceipt: `datadog-${workspace.sequence++}`,
		},
		actions: [
			{ id: `action-${workspace.sequence++}`, label: `Confirm ${service.label} customer impact`, owner: 'Service on-call', status: 'in_progress', required: true, kind: 'technical', receipt: null },
			{ id: `action-${workspace.sequence++}`, label: 'Assign customer liaison', owner: 'Incident commander', status: 'waiting', required: true, kind: 'role', receipt: null },
			{ id: `action-${workspace.sequence++}`, label: 'Publish first customer update', owner: 'Customer liaison', status: 'waiting', required: true, kind: 'communication', receipt: null },
		],
		updateDraft: {
			audience: 'public',
			message: `We are investigating ${values.title.toLowerCase()}. ${values.impactSummary}`,
			includeMetrics: true,
		},
		updatePreview: null,
		updates: [],
		resolution: null,
		activity: [createActivity('Incident declared', `${values.severity} · ${service.label}`, 'danger', workspace.actor.name)],
	};
	workspace.incidents.unshift(incident);
	workspace.selectedIncidentId = incident.id;
	workspace.revision += 1;
	return serializeResponse('Incident declared and responder bridge created.', {
		mutationReceipt: createMutationReceipt('incident_declared', incident),
	});
}

/**
 * Saves accountable roles, severity, and update cadence.
 *
 * @param {string} incidentId Stable incident identifier.
 * @param {Record<string, unknown>} input Command settings and exact revisions.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function saveIncidentCommand(incidentId, input = {}) {
	const incident = findIncident(incidentId);
	if (!incident) return notFound('Incident');
	const revisionError = requireRevisions(incident, input);
	if (revisionError) return revisionError;
	const mutableError = requireOpenIncident(incident);
	if (mutableError) return mutableError;
	const values = normalizeCommand(input);
	const fields = validateCommand(values);
	if (Object.keys(fields).length) return validation('Review the command assignments.', fields);
	if (new Set([values.commanderId, values.liaisonId, values.scribeId]).size < 3) {
		return validation('Assign one accountable person to each role.', { roles: ['Commander, liaison, and scribe must be different people.'] });
	}

	incident.severity = values.severity;
	incident.roles = {
		commanderId: values.commanderId,
		liaisonId: values.liaisonId,
		scribeId: values.scribeId,
	};
	incident.cadenceMinutes = values.cadenceMinutes;
	const roleAction = incident.actions.find((action) => action.kind === 'role');
	if (roleAction && roleAction.status !== 'done') {
		roleAction.status = 'done';
		roleAction.receipt = `role-assignment-${workspace.sequence++}`;
	}
	advanceIncident(incident);
	appendActivity(incident, 'Command roles confirmed', `${personLabel(values.commanderId)} commands · ${personLabel(values.liaisonId)} owns customer communication`, 'success');
	return serializeResponse('Incident command assignments saved.', {
		mutationReceipt: createMutationReceipt('incident_command_saved', incident),
	});
}

/**
 * Advances one technical response action to its next state.
 *
 * @param {string} incidentId Stable incident identifier.
 * @param {string} actionId Stable action identifier.
 * @param {Record<string, unknown>} input Exact revisions.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function advanceIncidentResponseAction(incidentId, actionId, input = {}) {
	const incident = findIncident(incidentId);
	if (!incident) return notFound('Incident');
	const revisionError = requireRevisions(incident, input);
	if (revisionError) return revisionError;
	const mutableError = requireOpenIncident(incident);
	if (mutableError) return mutableError;
	const action = incident.actions.find((item) => item.id === actionId);
	if (!action) return notFound('Response action');
	if (action.kind === 'communication') {
		return validation('Publish the customer update to complete this action.', { action: ['Communication actions require immutable delivery evidence.'] });
	}
	if (action.kind === 'role') {
		return validation('Save accountable command roles to complete this action.', { action: ['Role actions require unique assignments.'] });
	}
	if (action.status === 'done') return validation('This response action is already complete.', { action: ['Choose an open action.'] });

	action.status = action.status === 'waiting' ? 'in_progress' : 'done';
	if (action.status === 'done') action.receipt = `action-${workspace.sequence++}`;
	advanceIncident(incident);
	appendActivity(incident, action.status === 'done' ? 'Response action completed' : 'Response action started', action.label, action.status === 'done' ? 'success' : 'info');
	return serializeResponse(action.status === 'done' ? 'Response action completed.' : 'Response action started.', {
		mutationReceipt: createMutationReceipt('incident_action_advanced', incident),
	});
}

/**
 * Refreshes deterministic monitoring evidence for one incident.
 *
 * @param {string} incidentId Stable incident identifier.
 * @param {Record<string, unknown>} input Exact revisions.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function refreshIncidentMonitoring(incidentId, input = {}) {
	const incident = findIncident(incidentId);
	if (!incident) return notFound('Incident');
	const revisionError = requireRevisions(incident, input);
	if (revisionError) return revisionError;
	const mutableError = requireOpenIncident(incident);
	if (mutableError) return mutableError;

	incident.monitoring.errorRate = incident.monitoring.stableSamples === 0 ? 0.6 : 0.2;
	incident.monitoring.p95Ms = incident.monitoring.stableSamples === 0 ? 420 : 260;
	incident.monitoring.stableSamples += 1;
	incident.monitoring.lastCheckedAt = nowIso();
	incident.monitoring.providerReceipt = `datadog-${workspace.sequence++}`;
	incident.services = incident.services.map((service) => ({
		...service,
		state: incident.monitoring.stableSamples >= 2 ? 'Operational' : 'Watch',
		metric: `${incident.monitoring.errorRate}% errors · P95 ${incident.monitoring.p95Ms}ms`,
		trend: 'down',
		monitorReceipt: `monitor-${workspace.sequence++}`,
	}));
	advanceIncident(incident);
	appendActivity(incident, 'Monitoring evidence refreshed', `${incident.monitoring.errorRate}% errors · ${incident.monitoring.stableSamples} stable sample${incident.monitoring.stableSamples === 1 ? '' : 's'}`, 'success');
	return serializeResponse('Monitoring evidence refreshed.', {
		mutationReceipt: createMutationReceipt('incident_monitor_refreshed', incident),
	});
}

/**
 * Creates an immutable preview of one incident communication.
 *
 * @param {string} incidentId Stable incident identifier.
 * @param {Record<string, unknown>} input Update fields and exact revisions.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function previewIncidentUpdate(incidentId, input = {}) {
	const incident = findIncident(incidentId);
	if (!incident) return notFound('Incident');
	const revisionError = requireRevisions(incident, input);
	if (revisionError) return revisionError;
	const mutableError = requireOpenIncident(incident);
	if (mutableError) return mutableError;
	const values = normalizeUpdate(input);
	const fields = validateUpdate(values, incident);
	if (Object.keys(fields).length) return validation('Review the incident update.', fields);

	incident.updateDraft = values;
	incident.updatePreview = {
		id: `update-preview-${workspace.sequence++}`,
		checksum: checksumFor(`${incident.id}:${incident.version}:${values.audience}:${values.message}:${values.includeMetrics}`),
		audience: values.audience,
		audienceLabel: audienceLabel(values.audience),
		message: values.message,
		includeMetrics: values.includeMetrics,
		channels: updateChannels(values.audience),
		recipients: updateRecipients(values.audience, incident),
		componentChanges: incident.services.map((service) => `${service.name}: ${service.state}`),
		approvedBy: personLabel(incident.roles.liaisonId),
		createdAt: nowIso(),
	};
	advanceIncident(incident);
	appendActivity(incident, 'Customer update previewed', `${audienceLabel(values.audience)} · ${incident.updatePreview.checksum}`, 'info');
	return serializeResponse('Incident update preview created.', {
		mutationReceipt: createMutationReceipt('incident_update_previewed', incident),
	});
}

/**
 * Publishes an exact previewed communication and records provider receipts.
 *
 * @param {string} incidentId Stable incident identifier.
 * @param {Record<string, unknown>} input Preview checksum, acknowledgement, and revisions.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function publishIncidentUpdate(incidentId, input = {}) {
	const incident = findIncident(incidentId);
	if (!incident) return notFound('Incident');
	const revisionError = requireRevisions(incident, input);
	if (revisionError) return revisionError;
	const mutableError = requireOpenIncident(incident);
	if (mutableError) return mutableError;
	if (!incident.updatePreview) return validation('Preview the update before publishing.', { preview: ['No immutable preview exists.'] });
	if (input.previewChecksum !== incident.updatePreview.checksum) return conflict('The communication preview changed before publication.');
	if (input.acknowledged !== true) return validation('Acknowledge the exact audience and message.', { acknowledged: ['Confirm the immutable communication route.'] });

	const preview = incident.updatePreview;
	const update = {
		id: `incident-update-${workspace.sequence++}`,
		status: 'delivered',
		audience: preview.audience,
		audienceLabel: preview.audienceLabel,
		message: preview.message,
		channels: preview.channels,
		publishedAt: nowIso(),
		publishedBy: workspace.actor.name,
		providerReceipt: `statuspage-${workspace.sequence++}`,
		deliveryReceipts: preview.channels.map((channel) => ({ channel, receipt: `${channel.toLowerCase().replaceAll(' ', '-')}-${workspace.sequence++}` })),
		checksum: preview.checksum,
	};
	incident.updates.unshift(update);
	incident.updatePreview = null;
	const communicationAction = incident.actions.find((action) => action.kind === 'communication');
	if (communicationAction) {
		communicationAction.status = 'done';
		communicationAction.receipt = update.providerReceipt;
	}
	advanceIncident(incident);
	appendActivity(incident, 'Customer update delivered', `${preview.audienceLabel} · ${update.providerReceipt}`, 'success');
	return serializeResponse('Incident update delivered.', {
		publicationReceipt: structuredClone(update),
		mutationReceipt: createMutationReceipt('incident_update_published', incident),
	});
}

/**
 * Moves an incident into monitoring or resolves it after server-owned checks.
 *
 * @param {string} incidentId Stable incident identifier.
 * @param {Record<string, unknown>} input Transition, acknowledgement, and revisions.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function transitionIncidentResponseStatus(incidentId, input = {}) {
	const incident = findIncident(incidentId);
	if (!incident) return notFound('Incident');
	const revisionError = requireRevisions(incident, input);
	if (revisionError) return revisionError;
	const mutableError = requireOpenIncident(incident);
	if (mutableError) return mutableError;

	if (input.transition === 'monitoring') {
		const blockers = monitoringTransitionBlockers(incident);
		if (blockers.length) return validation('Complete the mitigation checks before monitoring.', { transition: blockers });
		incident.lifecycle = 'monitoring';
		incident.nextUpdateLabel = `${incident.cadenceMinutes} min`;
		advanceIncident(incident);
		appendActivity(incident, 'Incident moved to monitoring', `${incident.monitoring.errorRate}% errors · customer update delivered`, 'success');
		return serializeResponse('Incident is now monitoring.', {
			mutationReceipt: createMutationReceipt('incident_monitoring_started', incident),
		});
	}

	if (input.transition === 'resolved') {
		const blockers = resolutionBlockers(incident);
		if (blockers.length) return validation('Complete the resolution checks.', { transition: blockers });
		if (input.acknowledged !== true) return validation('Acknowledge the resolution evidence.', { acknowledged: ['Confirm customer impact, monitoring, and communication evidence.'] });
		incident.lifecycle = 'resolved';
		incident.nextUpdateLabel = 'Complete';
		incident.resolution = {
			id: `resolution-${workspace.sequence++}`,
			resolvedAt: nowIso(),
			resolvedBy: workspace.actor.name,
			monitorReceipt: incident.monitoring.providerReceipt,
			communicationReceipt: incident.updates[0]?.providerReceipt || null,
			postmortemId: `postmortem-${workspace.sequence++}`,
			checksum: checksumFor(`${incident.id}:${incident.version}:resolved`),
		};
		advanceIncident(incident);
		appendActivity(incident, 'Incident resolved', `${incident.resolution.id} · postmortem opened`, 'success');
		return serializeResponse('Incident resolved and postmortem opened.', {
			resolutionReceipt: structuredClone(incident.resolution),
			mutationReceipt: createMutationReceipt('incident_resolved', incident),
		});
	}

	return validation('Choose a supported incident transition.', { transition: ['Use monitoring or resolved.'] });
}

/**
 * Creates the initial deterministic command workspace.
 *
 * @returns {Record<string, unknown>} Initial mutable workspace.
 */
function createInitialWorkspace() {
	return {
		id: 'incident-workspace-1',
		name: 'Northstar reliability',
		revision: 84,
		sequence: 7200,
		selectedIncidentId: 'inc_2048',
		actor: { id: 'steve', name: "Steve O'Brien", role: 'Reliability operations' },
		incidents: [createCheckoutIncident(), createWebhookIncident(), createIdentityIncident()],
	};
}

/**
 * Creates the primary incident and its response evidence.
 *
 * @returns {Record<string, unknown>} Checkout incident.
 */
function createCheckoutIncident() {
	return {
		id: 'inc_2048',
		version: 12,
		title: 'Elevated checkout API errors',
		severity: 'SEV-2',
		lifecycle: 'mitigating',
		startedAt: '2026-08-02T08:42:00.000Z',
		elapsedLabel: '42 min',
		nextUpdateLabel: '12 min',
		customerImpact: {
			accountsAffected: 128,
			regions: ['US', 'EU'],
			summary: 'Checkout creation intermittently returns 502 responses after the edge gateway deploy.',
		},
		roles: { commanderId: 'maya', liaisonId: 'ivy', scribeId: 'sam' },
		cadenceMinutes: 30,
		bridge: { id: 'bridge-checkout-2048', label: 'Responder bridge live', providerReceipt: 'zoom-bridge-2048' },
		sourceAlert: { provider: 'Datadog', id: 'alert-checkout-burn-2048', monitor: 'Checkout error-budget burn', checksum: 'sha256:demo-alert2048' },
		services: [
			{ id: 'checkout_api', name: 'Checkout API', state: 'Degraded', metric: '2.3% errors · P95 1.2s', trend: 'down', monitorReceipt: 'monitor-checkout-611' },
			{ id: 'edge_gateway', name: 'Edge gateway', state: 'Watch', metric: 'Rollback at 100%', trend: 'down', monitorReceipt: 'monitor-edge-288' },
			{ id: 'billing_worker', name: 'Billing worker', state: 'Operational', metric: '0.2% errors', trend: 'flat', monitorReceipt: 'monitor-billing-184' },
		],
		monitoring: { errorRate: 2.3, p95Ms: 1200, stableSamples: 0, lastCheckedAt: '2026-08-02T09:20:00.000Z', providerReceipt: 'datadog-snapshot-2048' },
		actions: [
			{ id: 'action_rollback', label: 'Roll back edge gateway release', owner: 'API on-call', status: 'done', required: true, kind: 'technical', receipt: 'deploy-rollback-2048' },
			{ id: 'action_verify_eu', label: 'Verify checkout creation from EU test tenant', owner: 'QA lead', status: 'in_progress', required: true, kind: 'technical', receipt: null },
			{ id: 'action_customer_update', label: 'Publish mitigation update to affected customers', owner: 'Customer liaison', status: 'waiting', required: true, kind: 'communication', receipt: null },
			{ id: 'action_postmortem', label: 'Open postmortem draft', owner: 'Incident scribe', status: 'waiting', required: false, kind: 'technical', receipt: null },
		],
		updateDraft: {
			audience: 'public',
			message: 'We are mitigating elevated checkout API errors. Checkout creation may fail intermittently for some customers while rollback verification continues.',
			includeMetrics: true,
		},
		updatePreview: null,
		updates: [
			{ id: 'incident-update-2048-1', status: 'delivered', audience: 'public', audienceLabel: 'Public status page', message: 'We identified elevated checkout API errors and started rolling back the edge gateway release.', channels: ['Statuspage', 'Enterprise email'], publishedAt: '2026-08-02T09:07:00.000Z', publishedBy: 'Ivy Tan', providerReceipt: 'statuspage-2048-1', deliveryReceipts: [{ channel: 'Statuspage', receipt: 'statuspage-delivery-2048' }, { channel: 'Enterprise email', receipt: 'email-delivery-2048' }], checksum: 'sha256:demo-update2048' },
		],
		resolution: null,
		activity: [
			createFixedActivity('activity-2048-4', 'Rollback completed', 'Edge gateway v2026.08.02 restored to the previous version.', 'success', 'API on-call', '2026-08-02T09:18:00.000Z'),
			createFixedActivity('activity-2048-3', 'Customer update delivered', 'Public status page · statuspage-2048-1', 'success', 'Ivy Tan', '2026-08-02T09:07:00.000Z'),
			createFixedActivity('activity-2048-2', 'Incident promoted', 'SEV-3 → SEV-2 after customer impact confirmation.', 'warning', 'Maya Chen', '2026-08-02T08:58:00.000Z'),
			createFixedActivity('activity-2048-1', 'Incident declared', 'Datadog alert-checkout-burn-2048 opened the response.', 'danger', 'SRE bot', '2026-08-02T08:42:00.000Z'),
		],
	};
}

/**
 * Creates a secondary webhook incident.
 *
 * @returns {Record<string, unknown>} Webhook incident.
 */
function createWebhookIncident() {
	return createCompactIncident({
		id: 'inc_2051',
		version: 6,
		title: 'Webhook delivery backlog',
		severity: 'SEV-3',
		lifecycle: 'investigating',
		elapsedLabel: '1h 12m',
		nextUpdateLabel: '24 min',
		accountsAffected: 42,
		regions: ['US'],
		serviceId: 'webhook_worker',
		serviceName: 'Webhook worker',
		summary: 'Delivery attempts are delayed for large-batch customers while workers drain a retry queue.',
		metric: '18k queued events',
	});
}

/**
 * Creates a secondary identity incident.
 *
 * @returns {Record<string, unknown>} Identity incident.
 */
function createIdentityIncident() {
	return createCompactIncident({
		id: 'inc_2054',
		version: 9,
		title: 'Login timeouts for SSO tenants',
		severity: 'SEV-2',
		lifecycle: 'monitoring',
		elapsedLabel: '2h 04m',
		nextUpdateLabel: '18 min',
		accountsAffected: 21,
		regions: ['EU'],
		serviceId: 'identity_api',
		serviceName: 'Identity API',
		summary: 'SAML login latency recovered after cache failover; the team is validating stable customer recovery.',
		metric: '0.3% errors · P95 540ms',
	});
}

/**
 * Creates a compact but fully serializable secondary incident.
 *
 * @param {Record<string, unknown>} values Incident seed values.
 * @returns {Record<string, unknown>} Seeded incident.
 */
function createCompactIncident(values) {
	return {
		id: values.id,
		version: values.version,
		title: values.title,
		severity: values.severity,
		lifecycle: values.lifecycle,
		startedAt: '2026-08-02T07:12:00.000Z',
		elapsedLabel: values.elapsedLabel,
		nextUpdateLabel: values.nextUpdateLabel,
		customerImpact: { accountsAffected: values.accountsAffected, regions: values.regions, summary: values.summary },
		roles: { commanderId: values.serviceId === 'identity_api' ? 'nora' : 'ivy', liaisonId: 'ari', scribeId: 'sam' },
		cadenceMinutes: 30,
		bridge: { id: `bridge-${values.id}`, label: 'Responder bridge live', providerReceipt: `zoom-${values.id}` },
		sourceAlert: { provider: 'Datadog', id: `alert-${values.id}`, monitor: `${values.serviceName} health`, checksum: checksumFor(`${values.id}:alert`) },
		services: [{ id: values.serviceId, name: values.serviceName, state: values.lifecycle === 'monitoring' ? 'Watch' : 'Degraded', metric: values.metric, trend: 'down', monitorReceipt: `monitor-${values.id}` }],
		monitoring: { errorRate: values.lifecycle === 'monitoring' ? 0.3 : 3.8, p95Ms: values.lifecycle === 'monitoring' ? 540 : 980, stableSamples: values.lifecycle === 'monitoring' ? 1 : 0, lastCheckedAt: '2026-08-02T09:18:00.000Z', providerReceipt: `datadog-${values.id}` },
		actions: [
			{ id: `action-${values.id}-1`, label: `Confirm ${values.serviceName} recovery`, owner: 'Service on-call', status: values.lifecycle === 'monitoring' ? 'done' : 'in_progress', required: true, kind: 'technical', receipt: values.lifecycle === 'monitoring' ? `action-${values.id}` : null },
			{ id: `action-${values.id}-2`, label: 'Publish customer update', owner: 'Customer liaison', status: values.lifecycle === 'monitoring' ? 'done' : 'waiting', required: true, kind: 'communication', receipt: values.lifecycle === 'monitoring' ? `statuspage-${values.id}` : null },
		],
		updateDraft: { audience: 'enterprise', message: `We are ${values.lifecycle} ${values.title.toLowerCase()}. ${values.summary}`, includeMetrics: true },
		updatePreview: null,
		updates: values.lifecycle === 'monitoring' ? [{ id: `update-${values.id}`, status: 'delivered', audience: 'enterprise', audienceLabel: 'Affected enterprise accounts', message: values.summary, channels: ['Enterprise email', 'Internal channel'], publishedAt: '2026-08-02T09:10:00.000Z', publishedBy: 'Ari Grant', providerReceipt: `statuspage-${values.id}`, deliveryReceipts: [], checksum: checksumFor(`${values.id}:update`) }] : [],
		resolution: null,
		activity: [createFixedActivity(`activity-${values.id}`, 'Incident state updated', `${lifecycleMeta(values.lifecycle).label} · ${values.metric}`, 'info', personLabel(values.serviceId === 'identity_api' ? 'nora' : 'ivy'), '2026-08-02T09:12:00.000Z')],
	};
}

/**
 * Serializes workspace, catalog, queue, and selected incident state.
 *
 * @param {string} message Human-readable result message.
 * @param {Record<string, unknown>} [extra] Optional mutation evidence.
 * @returns {Record<string, unknown>} API response payload.
 */
function serializeResponse(message, extra = {}) {
	const selectedIncident = findIncident(workspace.selectedIncidentId) || workspace.incidents[0] || null;
	return {
		workspace: {
			id: workspace.id,
			name: workspace.name,
			revision: workspace.revision,
			selectedIncidentId: workspace.selectedIncidentId,
			actor: structuredClone(workspace.actor),
			counts: {
				open: workspace.incidents.filter((incident) => incident.lifecycle !== 'resolved').length,
				major: workspace.incidents.filter((incident) => incident.lifecycle !== 'resolved' && ['SEV-1', 'SEV-2'].includes(incident.severity)).length,
				needsUpdate: workspace.incidents.filter((incident) => incident.lifecycle !== 'resolved' && !incident.updates.length).length,
			},
		},
		catalogs: {
			severities: structuredClone(SEVERITY_OPTIONS),
			cadences: structuredClone(CADENCE_OPTIONS),
			audiences: structuredClone(AUDIENCE_OPTIONS),
			people: structuredClone(PEOPLE_OPTIONS),
			services: structuredClone(SERVICE_OPTIONS),
		},
		incidents: workspace.incidents.map(serializeIncidentSummary),
		selectedIncident: selectedIncident ? serializeIncident(selectedIncident) : null,
		message,
		...extra,
	};
}

/**
 * Serializes one compact incident queue row.
 *
 * @param {Record<string, unknown>} incident Incident record.
 * @returns {Record<string, unknown>} Queue summary.
 */
function serializeIncidentSummary(incident) {
	const checks = responseChecks(incident);
	return {
		id: incident.id,
		title: incident.title,
		severity: incident.severity,
		lifecycle: incident.lifecycle,
		statusMeta: lifecycleMeta(incident.lifecycle),
		elapsedLabel: incident.elapsedLabel,
		nextUpdateLabel: incident.nextUpdateLabel,
		accountsAffected: incident.customerImpact.accountsAffected,
		serviceName: incident.services[0]?.name || 'Service under assessment',
		blockers: checks.filter((check) => check.status === 'blocked').length,
	};
}

/**
 * Serializes one incident with derived checks and capabilities.
 *
 * @param {Record<string, unknown>} incident Incident record.
 * @returns {Record<string, unknown>} Detailed incident payload.
 */
function serializeIncident(incident) {
	const checks = responseChecks(incident);
	const requiredActions = incident.actions.filter((action) => action.required);
	const completedRequiredActions = requiredActions.filter((action) => action.status === 'done').length;
	const canMonitor = monitoringTransitionBlockers(incident).length === 0 && incident.lifecycle !== 'monitoring';
	const canResolve = resolutionBlockers(incident).length === 0;
	return {
		...structuredClone(incident),
		statusMeta: lifecycleMeta(incident.lifecycle),
		severityMeta: severityMeta(incident.severity),
		roleLabels: {
			commander: personLabel(incident.roles.commanderId),
			liaison: personLabel(incident.roles.liaisonId),
			scribe: personLabel(incident.roles.scribeId),
		},
		responseChecks: checks,
		blockers: checks.filter((check) => check.status === 'blocked').length,
		warnings: checks.filter((check) => check.status === 'warning').length,
		actionProgress: {
			completed: completedRequiredActions,
			total: requiredActions.length,
			percent: requiredActions.length ? Math.round((completedRequiredActions / requiredActions.length) * 100) : 100,
		},
		capabilities: {
			canEdit: incident.lifecycle !== 'resolved',
			canPreviewUpdate: incident.lifecycle !== 'resolved',
			canPublishUpdate: incident.lifecycle !== 'resolved' && Boolean(incident.updatePreview),
			canRefreshMonitoring: incident.lifecycle !== 'resolved',
			canTransitionMonitoring: canMonitor,
			canResolve,
		},
	};
}

/**
 * Derives server-owned response checks for one incident.
 *
 * @param {Record<string, unknown>} incident Incident record.
 * @returns {Array<Record<string, unknown>>} Response checks.
 */
function responseChecks(incident) {
	const rolesAssigned = ['commanderId', 'liaisonId', 'scribeId'].every((key) => incident.roles[key]);
	const technicalActions = incident.actions.filter((action) => action.required && action.kind !== 'communication');
	const technicalComplete = technicalActions.every((action) => action.status === 'done');
	const communicationComplete = incident.actions.filter((action) => action.required && action.kind === 'communication').every((action) => action.status === 'done');
	return [
		{ key: 'source', label: 'Source alert retained', status: incident.sourceAlert?.checksum ? 'passed' : 'blocked', detail: incident.sourceAlert?.checksum ? `${incident.sourceAlert.provider} · ${incident.sourceAlert.id}` : 'Attach source alert evidence.' },
		{ key: 'roles', label: 'Accountable command roles', status: rolesAssigned ? 'passed' : 'blocked', detail: rolesAssigned ? `${personLabel(incident.roles.commanderId)} · ${personLabel(incident.roles.liaisonId)} · ${personLabel(incident.roles.scribeId)}` : 'Assign commander, liaison, and scribe.' },
		{ key: 'actions', label: 'Mitigation actions', status: technicalComplete ? 'passed' : 'blocked', detail: technicalComplete ? 'Required technical actions have immutable receipts.' : 'Complete required technical actions.' },
		{ key: 'monitoring', label: 'Recovery evidence', status: incident.monitoring.errorRate <= 1 ? incident.monitoring.stableSamples >= 2 ? 'passed' : 'warning' : 'blocked', detail: `${incident.monitoring.errorRate}% errors · ${incident.monitoring.stableSamples} stable sample${incident.monitoring.stableSamples === 1 ? '' : 's'} · ${incident.monitoring.providerReceipt}` },
		{ key: 'communications', label: 'Customer communication', status: communicationComplete ? 'passed' : 'blocked', detail: communicationComplete ? `${incident.updates[0]?.audienceLabel || 'Customer update'} · ${incident.updates[0]?.providerReceipt || 'delivery retained'}` : 'Publish an exact reviewed update.' },
	];
}

/**
 * Returns blockers for moving an incident into monitoring.
 *
 * @param {Record<string, unknown>} incident Incident record.
 * @returns {string[]} Blocking messages.
 */
function monitoringTransitionBlockers(incident) {
	const blockers = [];
	if (incident.lifecycle === 'resolved') blockers.push('Resolved incidents cannot return to monitoring.');
	if (!['investigating', 'mitigating'].includes(incident.lifecycle)) blockers.push('Incident is already monitoring.');
	if (incident.actions.some((action) => action.required && action.status !== 'done')) blockers.push('Complete required response actions.');
	if (incident.monitoring.errorRate > 1) blockers.push('Error rate must be at or below 1%.');
	if (incident.monitoring.stableSamples < 1) blockers.push('Record at least one stable monitoring sample.');
	if (!incident.updates.length) blockers.push('Deliver a customer update before monitoring.');
	return blockers;
}

/**
 * Returns blockers for resolving an incident.
 *
 * @param {Record<string, unknown>} incident Incident record.
 * @returns {string[]} Blocking messages.
 */
function resolutionBlockers(incident) {
	const blockers = [];
	if (incident.lifecycle !== 'monitoring') blockers.push('Move the incident to monitoring first.');
	if (incident.actions.some((action) => action.required && action.status !== 'done')) blockers.push('Complete every required response action.');
	if (incident.monitoring.errorRate > 1) blockers.push('Recovery error rate must remain at or below 1%.');
	if (incident.monitoring.stableSamples < 2) blockers.push('Record two stable monitoring samples.');
	if (!incident.updates.length) blockers.push('Retain a delivered customer update.');
	return blockers;
}

/**
 * Normalizes declaration values.
 *
 * @param {Record<string, unknown>} input Raw declaration input.
 * @returns {Record<string, unknown>} Normalized values.
 */
function normalizeDeclaration(input) {
	return {
		title: String(input.title || '').trim(),
		severity: String(input.severity || ''),
		serviceId: String(input.serviceId || ''),
		impactSummary: String(input.impactSummary || '').trim(),
	};
}

/**
 * Validates declaration fields.
 *
 * @param {Record<string, unknown>} values Normalized declaration values.
 * @returns {Record<string, string[]>} Field errors.
 */
function validateDeclaration(values) {
	const fields = {};
	if (values.title.length < 8) fields.title = ['Use at least 8 characters.'];
	if (!SEVERITY_OPTIONS.some((option) => option.value === values.severity)) fields.severity = ['Choose a severity.'];
	if (!SERVICE_OPTIONS.some((option) => option.value === values.serviceId)) fields.serviceId = ['Choose an affected service.'];
	if (values.impactSummary.length < 30) fields.impactSummary = ['Describe customer impact in at least 30 characters.'];
	return fields;
}

/**
 * Normalizes command assignment values.
 *
 * @param {Record<string, unknown>} input Raw command input.
 * @returns {Record<string, unknown>} Normalized command values.
 */
function normalizeCommand(input) {
	return {
		severity: String(input.severity || ''),
		commanderId: String(input.commanderId || ''),
		liaisonId: String(input.liaisonId || ''),
		scribeId: String(input.scribeId || ''),
		cadenceMinutes: Number(input.cadenceMinutes),
	};
}

/**
 * Validates command assignments.
 *
 * @param {Record<string, unknown>} values Normalized command values.
 * @returns {Record<string, string[]>} Field errors.
 */
function validateCommand(values) {
	const fields = {};
	if (!SEVERITY_OPTIONS.some((option) => option.value === values.severity)) fields.severity = ['Choose a severity.'];
	for (const key of ['commanderId', 'liaisonId', 'scribeId']) {
		if (!PEOPLE_OPTIONS.some((option) => option.value === values[key])) fields[key] = ['Choose an incident responder.'];
	}
	if (!CADENCE_OPTIONS.some((option) => option.value === values.cadenceMinutes)) fields.cadenceMinutes = ['Choose an update cadence.'];
	return fields;
}

/**
 * Normalizes communication values.
 *
 * @param {Record<string, unknown>} input Raw update input.
 * @returns {Record<string, unknown>} Normalized update values.
 */
function normalizeUpdate(input) {
	return {
		audience: String(input.audience || ''),
		message: String(input.message || '').trim(),
		includeMetrics: Boolean(input.includeMetrics),
	};
}

/**
 * Validates an incident communication draft.
 *
 * @param {Record<string, unknown>} values Normalized update values.
 * @param {Record<string, unknown>} incident Incident record.
 * @returns {Record<string, string[]>} Field errors.
 */
function validateUpdate(values, incident) {
	const fields = {};
	if (!AUDIENCE_OPTIONS.some((option) => option.value === values.audience)) fields.audience = ['Choose a communication audience.'];
	if (values.message.length < 40) fields.message = ['Give customers at least 40 characters of useful context.'];
	if (values.message.length > 600) fields.message = ['Keep the update below 600 characters.'];
	if (values.audience !== 'internal' && !incident.roles.liaisonId) fields.audience = ['Assign a customer liaison before external communication.'];
	return fields;
}

/**
 * Resolves delivery channels for an audience.
 *
 * @param {string} audience Audience value.
 * @returns {string[]} Delivery channels.
 */
function updateChannels(audience) {
	if (audience === 'public') return ['Statuspage', 'Enterprise email', 'Internal channel'];
	if (audience === 'enterprise') return ['Enterprise email', 'Internal channel'];
	return ['Internal channel'];
}

/**
 * Resolves the deterministic recipient count for an update.
 *
 * @param {string} audience Audience value.
 * @param {Record<string, unknown>} incident Incident record.
 * @returns {string} Recipient summary.
 */
function updateRecipients(audience, incident) {
	if (audience === 'public') return `2,418 subscribers · ${incident.customerImpact.accountsAffected} affected accounts`;
	if (audience === 'enterprise') return `${incident.customerImpact.accountsAffected} affected accounts`;
	return '17 incident stakeholders';
}

/**
 * Requires exact workspace and incident revisions.
 *
 * @param {Record<string, unknown>} incident Incident record.
 * @param {Record<string, unknown>} input Mutation input.
 * @returns {Record<string, unknown> | null} Conflict response or null.
 */
function requireRevisions(incident, input) {
	return requireWorkspaceRevision(input.revision) || requireIncidentVersion(incident, input.incidentVersion);
}

/**
 * Requires an exact workspace revision.
 *
 * @param {unknown} revision Expected revision.
 * @returns {Record<string, unknown> | null} Conflict response or null.
 */
function requireWorkspaceRevision(revision) {
	if (Number(revision) !== workspace.revision) return conflict(`Workspace changed from revision ${revision} to ${workspace.revision}.`);
	return null;
}

/**
 * Requires an exact incident version.
 *
 * @param {Record<string, unknown>} incident Incident record.
 * @param {unknown} version Expected version.
 * @returns {Record<string, unknown> | null} Conflict response or null.
 */
function requireIncidentVersion(incident, version) {
	if (Number(version) !== incident.version) return conflict(`${incident.title} changed from version ${version} to ${incident.version}.`);
	return null;
}

/**
 * Rejects mutations after resolution.
 *
 * @param {Record<string, unknown>} incident Incident record.
 * @returns {Record<string, unknown> | null} Validation response or null.
 */
function requireOpenIncident(incident) {
	if (incident.lifecycle === 'resolved') return validation('Resolved incidents are immutable.', { status: ['Open the postmortem or select another incident.'] });
	return null;
}

/**
 * Advances workspace and incident revisions together.
 *
 * @param {Record<string, unknown>} incident Incident record.
 * @returns {void}
 */
function advanceIncident(incident) {
	incident.version += 1;
	workspace.revision += 1;
}

/**
 * Finds one incident by identifier.
 *
 * @param {unknown} incidentId Incident identifier.
 * @returns {Record<string, unknown> | null} Incident or null.
 */
function findIncident(incidentId) {
	return workspace.incidents.find((incident) => incident.id === incidentId) || null;
}

/**
 * Appends one immutable activity record.
 *
 * @param {Record<string, unknown>} incident Incident record.
 * @param {string} title Activity title.
 * @param {string} detail Activity detail.
 * @param {string} tone Semantic tone.
 * @returns {void}
 */
function appendActivity(incident, title, detail, tone) {
	incident.activity.unshift(createActivity(title, detail, tone, workspace.actor.name));
}

/**
 * Creates one activity record at the deterministic current time.
 *
 * @param {string} title Activity title.
 * @param {string} detail Activity detail.
 * @param {string} tone Semantic tone.
 * @param {string} actor Activity actor.
 * @returns {Record<string, unknown>} Activity record.
 */
function createActivity(title, detail, tone, actor) {
	return createFixedActivity(`activity-${workspace?.sequence || 7000}`, title, detail, tone, actor, nowIso());
}

/**
 * Creates one activity record at a supplied timestamp.
 *
 * @param {string} id Activity identifier.
 * @param {string} title Activity title.
 * @param {string} detail Activity detail.
 * @param {string} tone Semantic tone.
 * @param {string} actor Activity actor.
 * @param {string} createdAt ISO timestamp.
 * @returns {Record<string, unknown>} Activity record.
 */
function createFixedActivity(id, title, detail, tone, actor, createdAt) {
	return { id, title, detail, tone, actor, createdAt };
}

/**
 * Creates immutable mutation evidence.
 *
 * @param {string} type Mutation type.
 * @param {Record<string, unknown>} incident Incident record.
 * @returns {Record<string, unknown>} Mutation receipt.
 */
function createMutationReceipt(type, incident) {
	return {
		id: `audit-${workspace.sequence++}`,
		type,
		workspaceRevision: workspace.revision,
		incidentId: incident.id,
		incidentVersion: incident.version,
		createdAt: nowIso(),
		createdBy: workspace.actor.name,
		checksum: checksumFor(`${type}:${workspace.revision}:${incident.id}:${incident.version}`),
	};
}

/**
 * Resolves one person label.
 *
 * @param {string} personId Person identifier.
 * @returns {string} Person label.
 */
function personLabel(personId) {
	return PEOPLE_OPTIONS.find((option) => option.value === personId)?.label || 'Unassigned';
}

/**
 * Resolves one audience label.
 *
 * @param {string} audience Audience identifier.
 * @returns {string} Audience label.
 */
function audienceLabel(audience) {
	return AUDIENCE_OPTIONS.find((option) => option.value === audience)?.label || audience;
}

/**
 * Returns lifecycle display metadata.
 *
 * @param {string} lifecycle Lifecycle identifier.
 * @returns {{label: string, tone: string}} Display metadata.
 */
function lifecycleMeta(lifecycle) {
	return {
		investigating: { label: 'Investigating', tone: 'danger' },
		mitigating: { label: 'Mitigating', tone: 'warning' },
		monitoring: { label: 'Monitoring', tone: 'info' },
		resolved: { label: 'Resolved', tone: 'success' },
	}[lifecycle] || { label: lifecycle, tone: 'neutral' };
}

/**
 * Returns severity display metadata.
 *
 * @param {string} severity Severity identifier.
 * @returns {{label: string, tone: string}} Display metadata.
 */
function severityMeta(severity) {
	return {
		'SEV-1': { label: 'SEV-1', tone: 'danger' },
		'SEV-2': { label: 'SEV-2', tone: 'warning' },
		'SEV-3': { label: 'SEV-3', tone: 'info' },
	}[severity] || { label: severity, tone: 'neutral' };
}

/**
 * Returns a deterministic ISO timestamp.
 *
 * @returns {string} ISO timestamp.
 */
function nowIso() {
	const sequence = workspace?.sequence || 7000;
	return new Date(Date.UTC(2026, 7, 2, 9, 30, 0) + (sequence - 7000) * 1000).toISOString();
}

/**
 * Creates a deterministic demo checksum.
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
 * Creates a structured conflict response.
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
