const REGION_OPTIONS = Object.freeze([
	{ value: 'central', label: 'Central London', description: 'City, West End, and inner east service territory.' },
	{ value: 'north', label: 'North depot', description: 'Camden, Islington, and northern service territory.' },
	{ value: 'south', label: 'South depot', description: 'South Bank, Bermondsey, and southern service territory.' },
]);

const SKILL_OPTIONS = Object.freeze([
	{ value: 'installation', label: 'Installation', description: 'Two-person installation and commissioning.' },
	{ value: 'repair', label: 'Repair', description: 'Diagnostics, replacement, and warranty work.' },
	{ value: 'cold-chain', label: 'Cold chain', description: 'Temperature-controlled inventory and handoff.' },
	{ value: 'vip', label: 'VIP account', description: 'High-touch customer commitment.' },
	{ value: 'lift-gate', label: 'Lift gate', description: 'Vehicle must support lift-gate unloading.' },
]);

const CHANNEL_OPTIONS = Object.freeze([
	{ value: 'driver_app', label: 'Driver app push', description: 'Primary route-change channel with delivery receipt.' },
	{ value: 'sms_fallback', label: 'SMS fallback', description: 'Use when the driver app has not acknowledged.' },
	{ value: 'dispatch_radio', label: 'Dispatch radio', description: 'Record a voice instruction and acknowledgement.' },
]);

const MAP_ASSET = '/assets/blocks/field-dispatch-map/london-dispatch-map.png';

let workspace = createInitialWorkspace();

/**
 * Returns the complete authoritative field-dispatch workspace.
 *
 * @returns {Record<string, unknown>} Serialized dispatch workspace.
 */
export function getFieldDispatchWorkspace() {
	return serializeResponse('Live dispatch workspace loaded.');
}

/**
 * Restores the deterministic field-dispatch demo.
 *
 * @returns {Record<string, unknown>} Reset dispatch workspace.
 */
export function resetFieldDispatchWorkspace() {
	workspace = createInitialWorkspace();
	return serializeResponse('Field dispatch demo reset.');
}

/**
 * Selects one stop at an exact workspace revision.
 *
 * @param {Record<string, unknown>} input Stop selection request.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function selectFieldDispatchStop(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	const stop = findStop(input.stopId);
	if (!stop) return notFound('Service stop');
	workspace.selectedStopId = stop.id;
	if (stop.routeId) workspace.selectedRouteId = stop.routeId;
	workspace.assignmentPreview = null;
	workspace.revision += 1;
	return serializeResponse(`${stop.customer} opened.`);
}

/**
 * Selects one route at an exact workspace revision.
 *
 * @param {Record<string, unknown>} input Route selection request.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function selectFieldDispatchRoute(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	const route = findRoute(input.routeId);
	if (!route) return notFound('Dispatch route');
	workspace.selectedRouteId = route.id;
	workspace.assignmentPreview = null;
	workspace.revision += 1;
	return serializeResponse(`${route.name}'s route opened.`);
}

/**
 * Creates an immutable, server-evaluated stop assignment preview.
 *
 * @param {Record<string, unknown>} input Assignment target and exact revisions.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function previewFieldDispatchAssignment(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	const stop = findStop(input.stopId);
	const route = findRoute(input.routeId);
	if (!stop) return notFound('Service stop');
	if (!route) return notFound('Dispatch route');
	const entityError = requireEntityRevisions(stop, route, input);
	if (entityError) return entityError;

	const candidate = buildCandidate(stop, route);
	const checksum = checksumFor(JSON.stringify({
		workspaceRevision: workspace.revision,
		stopId: stop.id,
		stopVersion: stop.version,
		routeId: route.id,
		routeVersion: route.version,
		checks: candidate.checks.map((check) => [check.key, check.status]),
		arrivalMinutes: candidate.arrivalMinutes,
		projectedLoadPercent: candidate.projectedLoadPercent,
	}));

	workspace.selectedStopId = stop.id;
	workspace.selectedRouteId = route.id;
	workspace.assignmentPreview = {
		id: `assignment-plan-${workspace.sequence++}`,
		checksum,
		stopId: stop.id,
		stopVersion: stop.version,
		routeId: route.id,
		routeVersion: route.version,
		candidate,
		createdAt: nowIso(),
		expiresAt: futureIso(15),
		requestedBy: workspace.actor.name,
	};
	workspace.revision += 1;
	return serializeResponse('Exact assignment plan created.', {
		mutationReceipt: createMutationReceipt('assignment_previewed', stop, route),
	});
}

/**
 * Commits one acknowledged exact assignment preview.
 *
 * @param {Record<string, unknown>} input Preview checksum, acknowledgement, and exact revisions.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function commitFieldDispatchAssignment(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	const preview = workspace.assignmentPreview;
	if (!preview) return validation('Review an exact assignment before dispatching.', { previewChecksum: ['No active assignment preview exists.'] });
	if (input.previewChecksum !== preview.checksum) return conflict('The assignment plan changed. Review the latest route and stop evidence.');
	if (input.acknowledged !== true) return validation('Acknowledge the exact assignment and customer-window impact.', { acknowledged: ['Acknowledgement is required.'] });

	const stop = findStop(preview.stopId);
	const route = findRoute(preview.routeId);
	if (!stop) return notFound('Service stop');
	if (!route) return notFound('Dispatch route');
	const entityError = requireEntityRevisions(stop, route, {
		stopVersion: preview.stopVersion,
		routeVersion: preview.routeVersion,
	});
	if (entityError) return entityError;
	const failedChecks = preview.candidate.checks.filter((check) => check.status !== 'passed');
	if (failedChecks.length) return validation('Resolve every dispatch check before assignment.', { policy: failedChecks.map((check) => check.detail) });

	stop.routeId = route.id;
	stop.status = 'dispatched';
	stop.etaMinutes = preview.candidate.arrivalMinutes;
	stop.assignedAt = nowIso();
	stop.providerReceipt = `dispatch-${workspace.sequence++}`;
	stop.version += 1;
	route.loadPercent = preview.candidate.projectedLoadPercent;
	route.version += 1;
	workspace.assignmentPreview = null;
	workspace.revision += 1;
	appendActivity('Stop dispatched', `${stop.customer} → ${route.name} · ETA ${formatMinutes(stop.etaMinutes)}`, 'success', stop, route);

	return serializeResponse(`${stop.customer} dispatched to ${route.name}.`, {
		assignmentReceipt: {
			id: `assignment-${workspace.sequence++}`,
			providerReceipt: stop.providerReceipt,
			stopId: stop.id,
			routeId: route.id,
			eta: formatMinutes(stop.etaMinutes),
			checksum: preview.checksum,
			createdAt: nowIso(),
		},
		mutationReceipt: createMutationReceipt('stop_dispatched', stop, route),
	});
}

/**
 * Refreshes deterministic GPS, ETA, and traffic evidence for every active route.
 *
 * @param {Record<string, unknown>} input Exact workspace revision.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function refreshFieldDispatchLive(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	workspace.liveRefreshes += 1;
	const refreshedAt = nowIso();
	workspace.routes = workspace.routes.map((route, index) => ({
		...route,
		version: route.version + 1,
		x: Math.max(6, Math.min(94, route.x + (index % 2 === 0 ? 1.2 : -0.8))),
		y: Math.max(8, Math.min(92, route.y + (index === 1 ? 1.1 : -0.6))),
		lastSeenAt: refreshedAt,
		gpsReceipt: `gps-${workspace.sequence++}`,
	}));
	workspace.map.updatedAt = refreshedAt;
	workspace.map.traffic = workspace.liveRefreshes % 2 === 0 ? 'Light' : 'Moderate';
	workspace.map.providerReceipt = `telemetry-${workspace.sequence++}`;
	workspace.revision += 1;
	appendActivity('Live positions refreshed', `${workspace.routes.length} route positions reconciled with provider telemetry.`, 'info');
	return serializeResponse('Live route positions and ETAs refreshed.', {
		mutationReceipt: createMutationReceipt('telemetry_refreshed'),
	});
}

/**
 * Sends one acknowledged route update through a named provider channel.
 *
 * @param {string} routeId Stable route identifier.
 * @param {Record<string, unknown>} input Update message, channel, acknowledgement, and exact revisions.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function sendFieldDispatchRouteUpdate(routeId, input = {}) {
	const route = findRoute(routeId);
	if (!route) return notFound('Dispatch route');
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	if (Number(input.routeVersion) !== route.version) return conflict('The route changed while the update was open. Review the latest route state.');

	const channel = CHANNEL_OPTIONS.find((option) => option.value === String(input.channel || ''));
	const message = String(input.message || '').trim();
	const fields = {};
	if (!channel) fields.channel = ['Choose a supported delivery channel.'];
	if (message.length < 20) fields.message = ['Explain the route change in at least 20 characters.'];
	if (message.length > 280) fields.message = ['Keep route updates to 280 characters or fewer.'];
	if (input.acknowledged !== true) fields.acknowledged = ['Confirm the driver-facing update and operational impact.'];
	if (Object.keys(fields).length) return validation('Review the route update.', fields);

	const receipt = {
		id: `route-update-${workspace.sequence++}`,
		providerReceipt: `${channel.value}-${workspace.sequence++}`,
		channel: channel.label,
		message,
		state: 'delivered',
		deliveredAt: nowIso(),
		actor: workspace.actor.name,
	};
	route.version += 1;
	route.lastUpdate = receipt;
	workspace.revision += 1;
	appendActivity('Route update delivered', `${route.name} · ${channel.label} · ${receipt.providerReceipt}`, 'success', null, route);
	return serializeResponse(`Route update delivered to ${route.name}.`, {
		routeUpdateReceipt: receipt,
		mutationReceipt: createMutationReceipt('route_update_delivered', null, route),
	});
}

/**
 * Creates the seeded field-dispatch workspace.
 *
 * @returns {Record<string, any>} Mutable workspace state.
 */
function createInitialWorkspace() {
	return {
		revision: 74,
		sequence: 901,
		liveRefreshes: 0,
		dateLabel: 'Today · 02 Aug',
		timezone: 'Europe/London',
		actor: { id: 'dispatcher-steve', name: "Steve O'Brien", role: 'Central dispatcher' },
		selectedStopId: 'stop-104',
		selectedRouteId: 'route-maya',
		assignmentPreview: null,
		map: {
			asset: MAP_ASSET,
			provider: 'Provider-neutral map raster',
			providerReceipt: 'telemetry-890',
			updatedAt: '2026-08-02T09:28:00.000Z',
			traffic: 'Moderate',
		},
		routes: [
			{
				id: 'route-maya',
				version: 8,
				initials: 'MC',
				name: 'Maya Chen',
				role: 'Senior installation technician',
				status: 'on_track',
				territories: ['central'],
				skills: ['installation', 'vip', 'lift-gate'],
				vehicle: 'Van 14',
				vehicleCapabilities: ['standard', 'lift-gate'],
				loadPercent: 68,
				availableAtMinutes: 735,
				x: 39,
				y: 38,
				lastSeenAt: '2026-08-02T09:28:00.000Z',
				gpsReceipt: 'gps-maya-889',
				phone: '+44 7700 900 414',
				shift: '08:00–17:00',
				lastUpdate: null,
			},
			{
				id: 'route-omar',
				version: 5,
				initials: 'OS',
				name: 'Omar Singh',
				role: 'Repair specialist',
				status: 'at_risk',
				territories: ['central', 'north'],
				skills: ['repair', 'vip'],
				vehicle: 'Van 22',
				vehicleCapabilities: ['standard'],
				loadPercent: 76,
				availableAtMinutes: 742,
				x: 61,
				y: 46,
				lastSeenAt: '2026-08-02T09:27:00.000Z',
				gpsReceipt: 'gps-omar-887',
				phone: '+44 7700 900 522',
				shift: '08:30–17:30',
				lastUpdate: null,
			},
			{
				id: 'route-ines',
				version: 4,
				initials: 'IV',
				name: 'Ines Vale',
				role: 'Cold-chain courier',
				status: 'late',
				territories: ['central', 'south'],
				skills: ['cold-chain', 'repair'],
				vehicle: 'Reefer 03',
				vehicleCapabilities: ['standard', 'cold-chain'],
				loadPercent: 64,
				availableAtMinutes: 760,
				x: 72,
				y: 64,
				lastSeenAt: '2026-08-02T09:26:00.000Z',
				gpsReceipt: 'gps-ines-884',
				phone: '+44 7700 900 603',
				shift: '07:30–16:30',
				lastUpdate: null,
			},
		],
		stops: [
			{
				id: 'stop-101', version: 4, number: 1, customer: 'Aster Labs', address: '24 Banner Street', regionId: 'central',
				windowStartMinutes: 630, windowEndMinutes: 720, etaMinutes: 648, status: 'dispatched', routeId: 'route-maya',
				requirements: ['installation', 'vip'], vehicleRequirements: [], loadPercent: 8, serviceMinutes: 45, x: 34, y: 44,
				priority: 'VIP', note: 'Reception staffed until noon. Serial-number capture and installation photo proof required.',
				assignedAt: '2026-08-02T08:35:00.000Z', providerReceipt: 'dispatch-aster-812',
			},
			{
				id: 'stop-102', version: 6, number: 2, customer: 'North Pier Clinic', address: '118 Bevan Row', regionId: 'central',
				windowStartMinutes: 660, windowEndMinutes: 750, etaMinutes: 675, status: 'at_risk', routeId: 'route-omar',
				requirements: ['repair', 'vip'], vehicleRequirements: [], loadPercent: 7, serviceMinutes: 50, x: 66, y: 39,
				priority: 'High', note: 'Confirm the access code before arrival; intermittent equipment fault reported.',
				assignedAt: '2026-08-02T08:42:00.000Z', providerReceipt: 'dispatch-pier-818',
			},
			{
				id: 'stop-103', version: 3, number: 3, customer: 'Carewell Pharmacy', address: '7 Milton Arcade', regionId: 'south',
				windowStartMinutes: 675, windowEndMinutes: 705, etaMinutes: 712, status: 'late', routeId: 'route-ines',
				requirements: ['cold-chain'], vehicleRequirements: ['cold-chain'], loadPercent: 9, serviceMinutes: 20, x: 76, y: 71,
				priority: 'Critical', note: 'Temperature-controlled handoff has a strict tolerance and requires recipient signature.',
				assignedAt: '2026-08-02T08:15:00.000Z', providerReceipt: 'dispatch-carewell-804',
			},
			{
				id: 'stop-104', version: 2, number: 4, customer: 'Hearthside Lofts', address: '43 Mason Yard', regionId: 'central',
				windowStartMinutes: 720, windowEndMinutes: 840, etaMinutes: null, status: 'unassigned', routeId: null,
				requirements: ['installation', 'lift-gate'], vehicleRequirements: ['lift-gate'], loadPercent: 12, serviceMinutes: 75, x: 51, y: 58,
				priority: 'High', note: 'Building manager requested a tighter arrival window. Lift-gate access is mandatory.',
				assignedAt: null, providerReceipt: null,
			},
			{
				id: 'stop-105', version: 1, number: 5, customer: 'Ridgeway Market', address: '9 Howard Parade', regionId: 'north',
				windowStartMinutes: 780, windowEndMinutes: 900, etaMinutes: null, status: 'unassigned', routeId: null,
				requirements: ['repair'], vehicleRequirements: [], loadPercent: 6, serviceMinutes: 40, x: 23, y: 25,
				priority: 'Normal', note: 'Flexible repair window can fill route slack after the lunch gap.',
				assignedAt: null, providerReceipt: null,
			},
			{
				id: 'stop-106', version: 5, number: 6, customer: 'Merton House', address: '61 Golden Lane', regionId: 'central',
				windowStartMinutes: 855, windowEndMinutes: 960, etaMinutes: 884, status: 'scheduled', routeId: 'route-maya',
				requirements: ['installation'], vehicleRequirements: [], loadPercent: 10, serviceMinutes: 60, x: 42, y: 28,
				priority: 'Normal', note: 'New installation. Loading bay booking starts at 14:15.',
				assignedAt: '2026-08-02T07:50:00.000Z', providerReceipt: 'dispatch-merton-790',
			},
		],
		activity: [
			{ id: 'activity-898', title: 'Carewell Pharmacy window at risk', detail: 'Traffic pushed ETA seven minutes beyond the cold-chain handoff window.', tone: 'danger', createdAt: '2026-08-02T09:24:00.000Z', actor: 'Routing monitor', stopId: 'stop-103', routeId: 'route-ines' },
			{ id: 'activity-894', title: 'Hearthside Lofts requires assignment', detail: 'Installation and lift-gate requirements verified; Maya Chen is the current best match.', tone: 'warning', createdAt: '2026-08-02T09:18:00.000Z', actor: 'Dispatch optimizer', stopId: 'stop-104', routeId: null },
			{ id: 'activity-887', title: 'Live positions reconciled', detail: 'Three active routes matched provider telemetry.', tone: 'info', createdAt: '2026-08-02T09:12:00.000Z', actor: 'GPS provider', stopId: null, routeId: null },
		],
	};
}

/**
 * Serializes the current workspace and derived records for API consumers.
 *
 * @param {string} message Human-readable response message.
 * @param {Record<string, unknown>} extra Mutation-specific response fields.
 * @returns {Record<string, unknown>} Complete API payload.
 */
function serializeResponse(message = '', extra = {}) {
	const routes = workspace.routes.map(serializeRoute);
	const stops = workspace.stops.map(serializeStop);
	const selectedRoute = routes.find((route) => route.id === workspace.selectedRouteId) || routes[0] || null;
	const selectedStop = stops.find((stop) => stop.id === workspace.selectedStopId) || stops[0] || null;
	const activeRoutes = routes.filter((route) => route.status !== 'offline').length;
	const attentionStops = stops.filter((stop) => ['unassigned', 'at_risk', 'late'].includes(stop.status)).length;

	return {
		message,
		workspace: {
			revision: workspace.revision,
			dateLabel: workspace.dateLabel,
			timezone: workspace.timezone,
			actor: workspace.actor,
			map: { ...workspace.map },
			counts: {
				routes: routes.length,
				activeRoutes,
				stops: stops.length,
				unassigned: stops.filter((stop) => stop.status === 'unassigned').length,
				atRisk: stops.filter((stop) => ['at_risk', 'late'].includes(stop.status)).length,
				attention: attentionStops,
			},
		},
		catalogs: {
			regions: REGION_OPTIONS.map((option) => ({ ...option })),
			skills: SKILL_OPTIONS.map((option) => ({ ...option })),
			channels: CHANNEL_OPTIONS.map((option) => ({ ...option })),
			routes: routes.map((route) => ({ value: route.id, label: route.name, description: `${route.vehicle} · ${route.loadPercent}% load · ${route.stateMeta.label}` })),
		},
		routes,
		stops,
		selectedRoute,
		selectedStop: selectedStop ? { ...selectedStop, candidates: buildCandidates(findStop(selectedStop.id)) } : null,
		assignmentPreview: workspace.assignmentPreview ? serializeAssignmentPreview(workspace.assignmentPreview) : null,
		activity: workspace.activity.map((item) => ({ ...item })),
		...extra,
	};
}

/**
 * Serializes one route with derived stop and status data.
 *
 * @param {Record<string, any>} route Mutable route record.
 * @returns {Record<string, unknown>} Route API record.
 */
function serializeRoute(route) {
	const assignedStops = workspace.stops.filter((stop) => stop.routeId === route.id);
	const nextStop = assignedStops
		.filter((stop) => stop.etaMinutes !== null && stop.status !== 'completed')
		.sort((left, right) => left.etaMinutes - right.etaMinutes)[0] || null;
	return {
		...route,
		stateMeta: routeStateMeta(route.status),
		skillsMeta: route.skills.map((skill) => ({ value: skill, label: skillLabel(skill) })),
		assignedStops: assignedStops.length,
		nextStop: nextStop ? nextStop.customer : 'Route complete',
		nextEta: nextStop ? formatMinutes(nextStop.etaMinutes) : '—',
		lastSeenLabel: route.lastSeenAt === workspace.map.updatedAt ? 'Just now' : '2 min ago',
		providerEvidence: {
			gpsReceipt: route.gpsReceipt,
			lastSeenAt: route.lastSeenAt,
			lastUpdate: route.lastUpdate,
		},
	};
}

/**
 * Serializes one stop with human-readable window, route, and requirement data.
 *
 * @param {Record<string, any>} stop Mutable stop record.
 * @returns {Record<string, unknown>} Stop API record.
 */
function serializeStop(stop) {
	const route = stop.routeId ? findRoute(stop.routeId) : null;
	return {
		...stop,
		window: `${formatMinutes(stop.windowStartMinutes)}–${formatMinutes(stop.windowEndMinutes)}`,
		eta: stop.etaMinutes === null ? 'Unassigned' : formatMinutes(stop.etaMinutes),
		stateMeta: stopStateMeta(stop.status),
		routeName: route?.name || 'Unassigned',
		requirementsMeta: stop.requirements.map((requirement) => ({ value: requirement, label: skillLabel(requirement) })),
		canAssign: stop.status === 'unassigned',
		evidence: {
			providerReceipt: stop.providerReceipt,
			assignedAt: stop.assignedAt,
		},
	};
}

/**
 * Serializes an exact assignment preview for the UI.
 *
 * @param {Record<string, any>} preview Mutable preview record.
 * @returns {Record<string, unknown>} Assignment preview API record.
 */
function serializeAssignmentPreview(preview) {
	const stop = findStop(preview.stopId);
	const route = findRoute(preview.routeId);
	return {
		...preview,
		stop: stop ? serializeStop(stop) : null,
		route: route ? serializeRoute(route) : null,
		candidate: { ...preview.candidate, checks: preview.candidate.checks.map((check) => ({ ...check })) },
	};
}

/**
 * Builds ranked route candidates for one selected stop.
 *
 * @param {Record<string, any>|null} stop Stop to evaluate.
 * @returns {Array<Record<string, unknown>>} Sorted assignment candidates.
 */
function buildCandidates(stop) {
	if (!stop) return [];
	return workspace.routes
		.map((route) => buildCandidate(stop, route))
		.sort((left, right) => right.score - left.score)
		.map((candidate, index) => ({ ...candidate, recommended: index === 0 && candidate.checks.every((check) => check.status === 'passed') }));
}

/**
 * Evaluates one route against a stop's operational constraints.
 *
 * @param {Record<string, any>} stop Stop requiring assignment.
 * @param {Record<string, any>} route Candidate route.
 * @returns {Record<string, unknown>} Ranked route candidate.
 */
function buildCandidate(stop, route) {
	const travel = travelMinutes(stop, route);
	const arrivalMinutes = route.availableAtMinutes + travel;
	const projectedLoadPercent = route.loadPercent + stop.loadPercent;
	const checks = buildAssignmentChecks(stop, route, { arrivalMinutes, projectedLoadPercent });
	const failedCount = checks.filter((check) => check.status !== 'passed').length;
	const score = Math.max(0, 100 - travel - Math.max(0, projectedLoadPercent - 80) - failedCount * 24);
	return {
		routeId: route.id,
		routeVersion: route.version,
		name: route.name,
		vehicle: route.vehicle,
		statusMeta: routeStateMeta(route.status),
		travelMinutes: travel,
		arrivalMinutes,
		arrivalLabel: formatMinutes(arrivalMinutes),
		projectedLoadPercent,
		score,
		checks,
	};
}

/**
 * Produces server-owned assignment checks for a stop and route.
 *
 * @param {Record<string, any>} stop Stop requiring assignment.
 * @param {Record<string, any>} route Candidate route.
 * @param {{arrivalMinutes: number, projectedLoadPercent: number}} projection Route projection.
 * @returns {Array<Record<string, string>>} Policy checks.
 */
function buildAssignmentChecks(stop, route, projection) {
	const missingSkills = stop.requirements.filter((requirement) => !route.skills.includes(requirement));
	const missingVehicle = stop.vehicleRequirements.filter((requirement) => !route.vehicleCapabilities.includes(requirement));
	return [
		check('stop_available', 'Stop is available', stop.status === 'unassigned', stop.status === 'unassigned' ? `${stop.customer} is not assigned to another route.` : `${stop.customer} is already ${stop.status}.`),
		check('territory', 'Territory is covered', route.territories.includes(stop.regionId), route.territories.includes(stop.regionId) ? `${route.name} serves ${regionLabel(stop.regionId)}.` : `${route.name} is outside ${regionLabel(stop.regionId)}.`),
		check('skills', 'Required skills match', missingSkills.length === 0, missingSkills.length ? `Missing ${missingSkills.map(skillLabel).join(', ')}.` : `${route.name} covers ${stop.requirements.map(skillLabel).join(', ')}.`),
		check('vehicle', 'Vehicle capability matches', missingVehicle.length === 0, missingVehicle.length ? `${route.vehicle} lacks ${missingVehicle.map(skillLabel).join(', ')}.` : `${route.vehicle} satisfies vehicle requirements.`),
		check('capacity', 'Route remains within capacity', projection.projectedLoadPercent <= 100, `${projection.projectedLoadPercent}% projected route load.`),
		check('window', 'Arrival fits the customer window', projection.arrivalMinutes >= stop.windowStartMinutes && projection.arrivalMinutes <= stop.windowEndMinutes, `${formatMinutes(projection.arrivalMinutes)} projected arrival · ${formatMinutes(stop.windowStartMinutes)}–${formatMinutes(stop.windowEndMinutes)} window.`),
	];
}

/**
 * Creates one semantic assignment check.
 *
 * @param {string} key Stable check key.
 * @param {string} label Human-readable label.
 * @param {boolean} passed Whether the check passed.
 * @param {string} detail Evidence detail.
 * @returns {Record<string, string>} Assignment check.
 */
function check(key, label, passed, detail) {
	return { key, label, status: passed ? 'passed' : 'failed', detail };
}

/**
 * Returns deterministic travel time for one stop-route pair.
 *
 * @param {Record<string, any>} stop Stop record.
 * @param {Record<string, any>} route Route record.
 * @returns {number} Travel minutes.
 */
function travelMinutes(stop, route) {
	const routeBase = { 'route-maya': 18, 'route-omar': 24, 'route-ines': 29 }[route.id] || 22;
	return routeBase + Math.abs(stop.number - 4) * 2;
}

/**
 * Returns semantic metadata for one route state.
 *
 * @param {string} status Route status.
 * @returns {{label: string, tone: string}} Status metadata.
 */
function routeStateMeta(status) {
	return {
		on_track: { label: 'On track', tone: 'success' },
		at_risk: { label: 'Travel risk', tone: 'warning' },
		late: { label: 'Late window', tone: 'danger' },
		offline: { label: 'Offline', tone: 'neutral' },
	}[status] || { label: status, tone: 'neutral' };
}

/**
 * Returns semantic metadata for one stop state.
 *
 * @param {string} status Stop status.
 * @returns {{label: string, tone: string}} Status metadata.
 */
function stopStateMeta(status) {
	return {
		unassigned: { label: 'Unassigned', tone: 'warning' },
		scheduled: { label: 'Scheduled', tone: 'info' },
		dispatched: { label: 'Dispatched', tone: 'success' },
		at_risk: { label: 'At risk', tone: 'warning' },
		late: { label: 'Late', tone: 'danger' },
		completed: { label: 'Completed', tone: 'neutral' },
	}[status] || { label: status, tone: 'neutral' };
}

/**
 * Resolves a skill value to a human-readable label.
 *
 * @param {string} value Skill value.
 * @returns {string} Skill label.
 */
function skillLabel(value) {
	return SKILL_OPTIONS.find((option) => option.value === value)?.label || value;
}

/**
 * Resolves a region value to a human-readable label.
 *
 * @param {string} value Region value.
 * @returns {string} Region label.
 */
function regionLabel(value) {
	return REGION_OPTIONS.find((option) => option.value === value)?.label || value;
}

/**
 * Formats minutes after midnight as a 24-hour time.
 *
 * @param {number|null} value Minutes after midnight.
 * @returns {string} Formatted time.
 */
function formatMinutes(value) {
	if (!Number.isFinite(value)) return '—';
	const hours = Math.floor(value / 60) % 24;
	const minutes = value % 60;
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Finds one route by stable identifier.
 *
 * @param {string} routeId Route identifier.
 * @returns {Record<string, any>|null} Route record or null.
 */
function findRoute(routeId) {
	return workspace.routes.find((route) => route.id === routeId) || null;
}

/**
 * Finds one stop by stable identifier.
 *
 * @param {string} stopId Stop identifier.
 * @returns {Record<string, any>|null} Stop record or null.
 */
function findStop(stopId) {
	return workspace.stops.find((stop) => stop.id === stopId) || null;
}

/**
 * Validates an exact workspace revision.
 *
 * @param {unknown} revision Requested revision.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function requireWorkspaceRevision(revision) {
	if (Number(revision) === workspace.revision) return null;
	return conflict(`Dispatch workspace changed from revision ${revision} to ${workspace.revision}.`);
}

/**
 * Validates exact stop and route versions.
 *
 * @param {Record<string, any>} stop Current stop.
 * @param {Record<string, any>} route Current route.
 * @param {Record<string, unknown>} input Requested versions.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function requireEntityRevisions(stop, route, input) {
	if (Number(input.stopVersion) !== stop.version || Number(input.routeVersion) !== route.version) {
		return conflict('The stop or route changed. Review the latest dispatch evidence.');
	}
	return null;
}

/**
 * Appends one immutable dispatch activity record.
 *
 * @param {string} title Activity title.
 * @param {string} detail Activity detail.
 * @param {string} tone Semantic tone.
 * @param {Record<string, any>|null} stop Optional stop.
 * @param {Record<string, any>|null} route Optional route.
 * @returns {void}
 */
function appendActivity(title, detail, tone, stop = null, route = null) {
	workspace.activity.unshift({
		id: `activity-${workspace.sequence++}`,
		title,
		detail,
		tone,
		createdAt: nowIso(),
		actor: workspace.actor.name,
		stopId: stop?.id || null,
		routeId: route?.id || null,
	});
}

/**
 * Creates a mutation receipt for deterministic API evidence.
 *
 * @param {string} action Mutation action.
 * @param {Record<string, any>|null} stop Optional stop.
 * @param {Record<string, any>|null} route Optional route.
 * @returns {Record<string, unknown>} Mutation receipt.
 */
function createMutationReceipt(action, stop = null, route = null) {
	return {
		id: `mutation-${workspace.sequence++}`,
		action,
		workspaceRevision: workspace.revision,
		stopId: stop?.id || null,
		stopVersion: stop?.version || null,
		routeId: route?.id || null,
		routeVersion: route?.version || null,
		actor: workspace.actor.name,
		createdAt: nowIso(),
	};
}

/**
 * Creates a structured validation response.
 *
 * @param {string} message Validation message.
 * @param {Record<string, string[]>} fields Field messages.
 * @returns {Record<string, unknown>} Validation response.
 */
function validation(message, fields) {
	return { status: 422, error: 'validation_failed', message, fields };
}

/**
 * Creates an exact-revision conflict response.
 *
 * @param {string} message Conflict message.
 * @returns {Record<string, unknown>} Conflict response.
 */
function conflict(message) {
	return { status: 409, error: 'revision_conflict', message };
}

/**
 * Creates a not-found response.
 *
 * @param {string} resource Resource label.
 * @returns {Record<string, unknown>} Not-found response.
 */
function notFound(resource) {
	return { status: 404, error: 'not_found', message: `${resource} was not found.` };
}

/**
 * Produces a deterministic ISO timestamp from workspace sequence.
 *
 * @returns {string} ISO timestamp.
 */
function nowIso() {
	return new Date(Date.UTC(2026, 7, 2, 9, 30, workspace.sequence % 60)).toISOString();
}

/**
 * Produces an ISO timestamp a fixed number of minutes after now.
 *
 * @param {number} minutes Minutes to add.
 * @returns {string} Future timestamp.
 */
function futureIso(minutes) {
	return new Date(new Date(nowIso()).getTime() + minutes * 60_000).toISOString();
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
