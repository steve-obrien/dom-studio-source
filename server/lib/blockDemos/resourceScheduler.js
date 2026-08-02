const RESOURCE_OPTIONS = Object.freeze([
	{
		id: 'resource_maya',
		name: 'Maya Chen',
		initials: 'MC',
		role: 'Installation lead',
		team: 'Field operations',
		capacityHours: 36,
		timezone: 'Europe/London',
		skills: ['installation', 'survey', 'handover'],
		regions: ['London', 'South East'],
	},
	{
		id: 'resource_noah',
		name: 'Noah Williams',
		initials: 'NW',
		role: 'Field engineer',
		team: 'Field operations',
		capacityHours: 40,
		timezone: 'Europe/London',
		skills: ['installation', 'maintenance', 'survey'],
		regions: ['London', 'Midlands'],
	},
	{
		id: 'resource_ava',
		name: 'Ava Brooks',
		initials: 'AB',
		role: 'Design specialist',
		team: 'Customer design',
		capacityHours: 32,
		timezone: 'Europe/London',
		skills: ['design', 'survey', 'handover'],
		regions: ['Remote', 'London'],
	},
	{
		id: 'resource_leo',
		name: 'Leo Harris',
		initials: 'LH',
		role: 'Service engineer',
		team: 'Service',
		capacityHours: 40,
		timezone: 'Europe/London',
		skills: ['maintenance', 'commissioning', 'handover'],
		regions: ['South East', 'London'],
	},
]);

const WORK_OPTIONS = Object.freeze([
	{ value: 'work_northstar', label: 'Northstar Labs · phase two', description: 'Dock 4 · installation', skill: 'installation', region: 'London', customer: 'Northstar Labs', location: 'Dock 4' },
	{ value: 'work_summit', label: 'Summit Finance · controls', description: 'Canary Wharf · commissioning', skill: 'commissioning', region: 'London', customer: 'Summit Finance', location: 'Canary Wharf' },
	{ value: 'work_evergreen', label: 'Evergreen Clinics · survey', description: 'Richmond clinic · survey', skill: 'survey', region: 'South East', customer: 'Evergreen Clinics', location: 'Richmond clinic' },
	{ value: 'work_monarch', label: 'Monarch Education · handover', description: 'Remote · handover', skill: 'handover', region: 'Remote', customer: 'Monarch Education', location: 'Remote session' },
	{ value: 'work_riverline', label: 'Riverline Market · design review', description: 'Remote · design', skill: 'design', region: 'Remote', customer: 'Riverline Market', location: 'Video call' },
	{ value: 'work_internal', label: 'Internal · travel and preparation', description: 'Non-billable internal time', skill: '', region: '', customer: 'Internal', location: 'Field operations' },
]);

const STATUS_OPTIONS = Object.freeze([
	{ value: 'hold', label: 'Tentative hold', tone: 'warning', description: 'Capacity is reserved but the customer is not confirmed.' },
	{ value: 'confirmed', label: 'Confirmed', tone: 'success', description: 'Customer and delivery team have confirmed the assignment.' },
	{ value: 'completed', label: 'Completed', tone: 'neutral', description: 'Delivery is complete and retained as schedule evidence.' },
]);

let workspace = createInitialWorkspace();

/**
 * Returns the complete authoritative resource-scheduler workspace.
 *
 * @returns {Record<string, unknown>} Serialized scheduler payload.
 */
export function getResourceSchedulerWorkspace() {
	return serializeResponse('Resource schedule loaded.');
}

/**
 * Restores the deterministic resource-scheduler demo.
 *
 * @returns {Record<string, unknown>} Reset scheduler payload.
 */
export function resetResourceSchedulerWorkspace() {
	workspace = createInitialWorkspace();
	return serializeResponse('Resource schedule reset.');
}

/**
 * Selects one resource and optionally one of its allocations.
 *
 * @param {Record<string, unknown>} input Exact selection request.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function selectResourceSchedulerContext(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	const resource = findResource(input.resourceId);
	if (!resource) return notFound('Resource');

	const requestedAllocationId = String(input.allocationId || '');
	const requestedAllocation = requestedAllocationId ? findAllocation(requestedAllocationId) : null;
	if (requestedAllocationId && (!requestedAllocation || requestedAllocation.resourceId !== resource.id)) {
		return validation('Choose an assignment owned by the selected resource.', { allocationId: ['The assignment is not available for this resource.'] });
	}

	workspace.selectedResourceId = resource.id;
	workspace.selectedAllocationId = requestedAllocation?.id || allocationsForResource(resource.id)[0]?.id || null;
	workspace.allocationPreview = null;
	workspace.revision += 1;
	return serializeResponse(`${resource.name}'s schedule opened.`, {
		mutationReceipt: createMutationReceipt('schedule_context_selected', requestedAllocation),
	});
}

/**
 * Creates a server-evaluated allocation or reschedule preview.
 *
 * @param {Record<string, unknown>} input Exact allocation draft.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function previewResourceAllocation(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	const draft = normalizeAllocationDraft(input);
	const draftError = validateAllocationDraft(draft);
	if (draftError) return draftError;

	const resource = findResource(draft.resourceId);
	if (!resource) return notFound('Resource');
	const existing = draft.allocationId ? findAllocation(draft.allocationId) : null;
	if (draft.allocationId && !existing) return notFound('Assignment');
	if (existing && Number(input.allocationVersion) !== existing.version) {
		return conflict('The assignment changed while the scheduling preview was being prepared.');
	}

	const work = findWork(draft.workId);
	const candidate = buildAllocationCandidate(resource, work, draft, existing);
	const checksum = checksumFor(JSON.stringify({
		workspaceRevision: workspace.revision,
		allocationVersion: existing?.version || 0,
		draft,
		checks: candidate.checks.map((check) => [check.key, check.status]),
		impact: candidate.impact,
	}));

	workspace.selectedResourceId = resource.id;
	workspace.selectedAllocationId = existing?.id || workspace.selectedAllocationId;
	workspace.allocationPreview = {
		id: `allocation-plan-${workspace.sequence++}`,
		checksum,
		mode: existing ? 'reschedule' : 'create',
		allocationId: existing?.id || null,
		allocationVersion: existing?.version || null,
		draft,
		candidate,
		createdAt: nowIso(),
		expiresAt: futureIso(15),
		requestedBy: workspace.actor.name,
	};
	workspace.revision += 1;
	return serializeResponse(existing ? 'Exact reschedule prepared.' : 'Exact allocation prepared.', {
		mutationReceipt: createMutationReceipt('allocation_previewed', existing),
	});
}

/**
 * Commits one acknowledged allocation preview.
 *
 * @param {Record<string, unknown>} input Preview checksum and acknowledgement.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function commitResourceAllocation(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	const preview = workspace.allocationPreview;
	if (!preview) return validation('Review an exact assignment before saving.', { previewChecksum: ['No active scheduling preview exists.'] });
	if (input.previewChecksum !== preview.checksum) return conflict('The scheduling preview changed. Review the latest capacity evidence.');
	if (input.acknowledged !== true) return validation('Acknowledge the assignment and capacity impact.', { acknowledged: ['Acknowledgement is required.'] });

	const failedChecks = preview.candidate.checks.filter((check) => check.status === 'failed');
	if (failedChecks.length) return validation('Resolve every blocking schedule check before saving.', { policy: failedChecks.map((check) => check.detail) });

	let allocation = preview.allocationId ? findAllocation(preview.allocationId) : null;
	if (preview.allocationId && !allocation) return notFound('Assignment');
	if (allocation && allocation.version !== preview.allocationVersion) return conflict('The assignment changed after the scheduling preview was created.');

	const work = findWork(preview.draft.workId);
	const providerReceipt = `schedule-sync-${workspace.sequence++}`;
	if (allocation) {
		Object.assign(allocation, allocationFieldsFromDraft(preview.draft, work), {
			version: allocation.version + 1,
			updatedAt: nowIso(),
			providerReceipt,
		});
	} else {
		allocation = {
			id: `allocation_${workspace.sequence++}`,
			version: 1,
			createdAt: nowIso(),
			updatedAt: nowIso(),
			providerReceipt,
			...allocationFieldsFromDraft(preview.draft, work),
		};
		workspace.allocations.push(allocation);
	}

	workspace.selectedResourceId = allocation.resourceId;
	workspace.selectedAllocationId = allocation.id;
	workspace.allocationPreview = null;
	workspace.unpublishedChanges += 1;
	workspace.revision += 1;
	appendActivity(
		preview.mode === 'reschedule' ? 'Assignment rescheduled' : 'Assignment created',
		`${allocation.title} · ${allocation.date} ${allocation.startTime}–${allocation.endTime}`,
		'success',
		allocation,
		providerReceipt,
	);

	return serializeResponse(preview.mode === 'reschedule' ? 'Assignment rescheduled and synchronized.' : 'Assignment created and synchronized.', {
		allocationReceipt: {
			id: `allocation-receipt-${workspace.sequence++}`,
			providerReceipt,
			allocationId: allocation.id,
			allocationVersion: allocation.version,
			previewChecksum: preview.checksum,
			createdAt: nowIso(),
		},
		mutationReceipt: createMutationReceipt('allocation_committed', allocation),
	});
}

/**
 * Transitions one exact allocation to a supported status.
 *
 * @param {string} allocationId Stable allocation identifier.
 * @param {Record<string, unknown>} input Exact status request.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function updateResourceAllocationStatus(allocationId, input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	const allocation = findAllocation(allocationId);
	if (!allocation) return notFound('Assignment');
	if (Number(input.allocationVersion) !== allocation.version) return conflict('The assignment changed before its status was saved.');

	const status = STATUS_OPTIONS.find((option) => option.value === String(input.status || ''));
	if (!status) return validation('Choose a supported assignment status.', { status: ['Status is not supported.'] });
	if (allocation.status === 'completed') return validation('Completed assignments are retained as evidence.', { status: ['A completed assignment cannot be reopened in this demo.'] });
	if (status.value === 'completed' && input.acknowledged !== true) {
		return validation('Acknowledge completion before retaining delivery evidence.', { acknowledged: ['Acknowledgement is required.'] });
	}

	allocation.status = status.value;
	allocation.version += 1;
	allocation.updatedAt = nowIso();
	allocation.providerReceipt = `schedule-status-${workspace.sequence++}`;
	workspace.unpublishedChanges += 1;
	workspace.allocationPreview = null;
	workspace.revision += 1;
	appendActivity('Assignment status updated', `${allocation.title} · ${status.label}`, status.tone, allocation, allocation.providerReceipt);
	return serializeResponse(`${allocation.title} is now ${status.label.toLowerCase()}.`, {
		mutationReceipt: createMutationReceipt('allocation_status_updated', allocation),
	});
}

/**
 * Publishes all pending schedule changes to the deterministic provider adapter.
 *
 * @param {Record<string, unknown>} input Exact publish request.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function publishResourceSchedule(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	if (workspace.unpublishedChanges < 1) return validation('There are no schedule changes to publish.', { schedule: ['Create, reschedule, or update an assignment first.'] });
	if (input.acknowledged !== true) return validation('Confirm the customer-facing schedule publication.', { acknowledged: ['Acknowledgement is required.'] });

	const receipt = {
		id: `publish-${workspace.sequence++}`,
		provider: 'Workforce Schedule demo adapter',
		providerReceipt: `provider-batch-${workspace.sequence++}`,
		changes: workspace.unpublishedChanges,
		publishedBy: workspace.actor.name,
		createdAt: nowIso(),
	};
	workspace.publishReceipt = receipt;
	workspace.unpublishedChanges = 0;
	workspace.revision += 1;
	appendActivity('Schedule published', `${receipt.changes} change${receipt.changes === 1 ? '' : 's'} delivered to the workforce adapter.`, 'success', null, receipt.providerReceipt);
	return serializeResponse('Schedule changes published.', {
		publishReceipt: receipt,
		mutationReceipt: createMutationReceipt('schedule_published'),
	});
}

/**
 * Creates the deterministic seeded resource-scheduler workspace.
 *
 * @returns {Record<string, any>} Mutable workspace state.
 */
function createInitialWorkspace() {
	return {
		revision: 18,
		sequence: 430,
		selectedResourceId: 'resource_maya',
		selectedAllocationId: 'allocation_northstar_install',
		allocationPreview: null,
		unpublishedChanges: 0,
		publishReceipt: {
			id: 'publish-426',
			provider: 'Workforce Schedule demo adapter',
			providerReceipt: 'provider-batch-427',
			changes: 3,
			publishedBy: 'Nadia Park',
			createdAt: '2026-08-02T08:42:00.000Z',
		},
		actor: { id: 'usr-schedule-1', name: 'Nadia Park', role: 'Resource planner' },
		allocations: [
			seedAllocation({ id: 'allocation_northstar_install', version: 6, resourceId: 'resource_maya', workId: 'work_northstar', date: '2026-08-03', startTime: '08:30', endTime: '12:00', status: 'confirmed', note: 'Replacement shutters, access lift, and site induction are confirmed.' }),
			seedAllocation({ id: 'allocation_evergreen_survey', version: 3, resourceId: 'resource_maya', workId: 'work_evergreen', date: '2026-08-04', startTime: '09:30', endTime: '12:30', status: 'confirmed', note: 'Survey the plant room and confirm loading access.' }),
			seedAllocation({ id: 'allocation_monarch_handover', version: 2, resourceId: 'resource_maya', workId: 'work_monarch', date: '2026-08-05', startTime: '14:00', endTime: '16:30', status: 'hold', note: 'Hold pending final attendee confirmation from the school.' }),
			seedAllocation({ id: 'allocation_maya_travel', version: 1, resourceId: 'resource_maya', workId: 'work_internal', date: '2026-08-06', startTime: '08:00', endTime: '10:00', status: 'confirmed', note: 'Travel and equipment preparation for the Summit site.' }),
			seedAllocation({ id: 'allocation_maya_summit', version: 4, resourceId: 'resource_maya', workId: 'work_summit', date: '2026-08-06', startTime: '10:30', endTime: '15:30', status: 'confirmed', note: 'Support Leo during controls commissioning and customer sign-off.' }),
			seedAllocation({ id: 'allocation_maya_northstar_two', version: 2, resourceId: 'resource_maya', workId: 'work_northstar', date: '2026-08-07', startTime: '09:00', endTime: '14:00', status: 'confirmed', note: 'Complete second-floor installation and photograph the finished work.' }),
			seedAllocation({ id: 'allocation_noah_install', version: 5, resourceId: 'resource_noah', workId: 'work_northstar', date: '2026-08-03', startTime: '08:00', endTime: '16:30', status: 'confirmed', note: 'Primary engineer for phase two installation.' }),
			seedAllocation({ id: 'allocation_noah_survey', version: 2, resourceId: 'resource_noah', workId: 'work_evergreen', date: '2026-08-04', startTime: '08:00', endTime: '16:30', status: 'confirmed', note: 'Full-day survey and measurement capture.' }),
			seedAllocation({ id: 'allocation_noah_internal', version: 1, resourceId: 'resource_noah', workId: 'work_internal', date: '2026-08-05', startTime: '08:00', endTime: '17:30', status: 'confirmed', note: 'Depot inventory, training, and van maintenance.' }),
			seedAllocation({ id: 'allocation_noah_install_two', version: 2, resourceId: 'resource_noah', workId: 'work_northstar', date: '2026-08-06', startTime: '08:00', endTime: '17:00', status: 'confirmed', note: 'Installation support and completion checks.' }),
			seedAllocation({ id: 'allocation_noah_survey_two', version: 1, resourceId: 'resource_noah', workId: 'work_evergreen', date: '2026-08-07', startTime: '08:00', endTime: '16:00', status: 'hold', note: 'Tentative follow-up if the plant room needs a second survey.' }),
			seedAllocation({ id: 'allocation_ava_design', version: 4, resourceId: 'resource_ava', workId: 'work_riverline', date: '2026-08-03', startTime: '09:00', endTime: '13:00', status: 'confirmed', note: 'Approve the revised material and signage palette.' }),
			seedAllocation({ id: 'allocation_ava_handover', version: 3, resourceId: 'resource_ava', workId: 'work_monarch', date: '2026-08-05', startTime: '09:30', endTime: '12:30', status: 'confirmed', note: 'Prepare training materials and lead the client handover.' }),
			seedAllocation({ id: 'allocation_ava_survey', version: 2, resourceId: 'resource_ava', workId: 'work_evergreen', date: '2026-08-06', startTime: '10:00', endTime: '15:30', status: 'hold', note: 'Design review pending results of the field survey.' }),
			seedAllocation({ id: 'allocation_leo_maintenance', version: 5, resourceId: 'resource_leo', workId: 'work_summit', date: '2026-08-03', startTime: '09:00', endTime: '12:30', status: 'confirmed', note: 'Controls diagnostics and commissioning preparation.' }),
			seedAllocation({ id: 'allocation_leo_commission', version: 4, resourceId: 'resource_leo', workId: 'work_summit', date: '2026-08-06', startTime: '10:00', endTime: '16:00', status: 'confirmed', note: 'Commission the control system and retain customer sign-off.' }),
		],
		activity: [
			{ id: 'activity-429', title: 'Schedule synchronized', detail: 'Three confirmed changes were delivered to the workforce adapter.', tone: 'success', actor: 'Nadia Park', allocationId: null, providerReceipt: 'provider-batch-427', createdAt: '2026-08-02T08:42:00.000Z' },
			{ id: 'activity-428', title: 'Capacity reviewed', detail: 'Noah Williams remains over planned capacity for the active week.', tone: 'warning', actor: 'Nadia Park', allocationId: 'allocation_noah_install', providerReceipt: 'capacity-review-428', createdAt: '2026-08-02T08:31:00.000Z' },
		],
	};
}

/**
 * Applies work metadata and deterministic evidence to one seeded allocation.
 *
 * @param {Record<string, any>} input Allocation fields.
 * @returns {Record<string, any>} Complete mutable allocation.
 */
function seedAllocation(input) {
	const work = findWorkOption(input.workId);
	return {
		createdAt: '2026-08-01T09:00:00.000Z',
		updatedAt: '2026-08-02T08:00:00.000Z',
		providerReceipt: `schedule-seed-${input.id}`,
		title: work?.label.split(' · ')[0] || 'Assignment',
		customer: work?.customer || 'Internal',
		location: work?.location || 'Field operations',
		requiredSkill: work?.skill || '',
		region: work?.region || '',
		...input,
	};
}

/**
 * Serializes the workspace into a client-facing response.
 *
 * @param {string} message Human-readable response message.
 * @param {Record<string, unknown>} [extra={}] Extra receipt fields.
 * @returns {Record<string, unknown>} Client-safe payload.
 */
function serializeResponse(message, extra = {}) {
	const resources = RESOURCE_OPTIONS.map(serializeResource);
	const allocations = workspace.allocations.map(serializeAllocation);
	const selectedResource = resources.find((resource) => resource.id === workspace.selectedResourceId) || resources[0];
	const selectedAllocation = allocations.find((allocation) => allocation.id === workspace.selectedAllocationId) || null;
	return {
		message,
		workspace: {
			revision: workspace.revision,
			weekStart: '2026-08-03',
			weekEnd: '2026-08-09',
			weekLabel: '3–9 August 2026',
			actor: workspace.actor,
			unpublishedChanges: workspace.unpublishedChanges,
			publishReceipt: workspace.publishReceipt,
			summary: calculateWorkspaceSummary(resources, allocations),
		},
		catalogs: {
			resources: resources.map((resource) => ({ value: resource.id, label: resource.name, description: `${resource.role} · ${resource.utilization}% planned` })),
			work: WORK_OPTIONS,
			statuses: STATUS_OPTIONS,
			dates: dateOptions(),
			times: timeOptions(),
		},
		resources,
		allocations,
		selectedResource,
		selectedAllocation,
		allocationPreview: workspace.allocationPreview ? serializeAllocationPreview(workspace.allocationPreview) : null,
		activity: workspace.activity.slice(0, 40),
		...extra,
	};
}

/**
 * Adds capacity and status metadata to one resource.
 *
 * @param {Record<string, any>} resource Seeded resource.
 * @returns {Record<string, any>} Decorated client resource.
 */
function serializeResource(resource) {
	const allocations = allocationsForResource(resource.id);
	const scheduledHours = roundHours(allocations.reduce((total, allocation) => total + durationHours(allocation), 0));
	const confirmedHours = roundHours(allocations.filter((allocation) => allocation.status === 'confirmed').reduce((total, allocation) => total + durationHours(allocation), 0));
	const utilization = Math.round(scheduledHours / resource.capacityHours * 100);
	const remainingHours = roundHours(resource.capacityHours - scheduledHours);
	return {
		...resource,
		scheduledHours,
		confirmedHours,
		remainingHours,
		utilization,
		capacityState: utilization > 100 ? 'over' : utilization >= 85 ? 'near' : 'available',
		capacityTone: utilization > 100 ? 'danger' : utilization >= 85 ? 'warning' : 'success',
		assignmentCount: allocations.length,
	};
}

/**
 * Adds display metadata to one allocation.
 *
 * @param {Record<string, any>} allocation Mutable allocation.
 * @returns {Record<string, any>} Decorated client allocation.
 */
function serializeAllocation(allocation) {
	const resource = findResource(allocation.resourceId);
	const status = STATUS_OPTIONS.find((option) => option.value === allocation.status) || STATUS_OPTIONS[0];
	const work = findWork(allocation.workId);
	return {
		...allocation,
		durationHours: durationHours(allocation),
		resource: resource ? { id: resource.id, name: resource.name, initials: resource.initials, role: resource.role } : null,
		statusMeta: status,
		work,
		tone: allocation.status === 'confirmed' ? 'success' : allocation.status === 'completed' ? 'neutral' : 'warning',
		evidence: {
			version: allocation.version,
			providerReceipt: allocation.providerReceipt,
			createdAt: allocation.createdAt,
			updatedAt: allocation.updatedAt,
			requiredSkill: allocation.requiredSkill,
			region: allocation.region,
		},
	};
}

/**
 * Serializes an active scheduling preview.
 *
 * @param {Record<string, any>} preview Mutable preview.
 * @returns {Record<string, any>} Client scheduling preview.
 */
function serializeAllocationPreview(preview) {
	return {
		...preview,
		resource: serializeResource(findResource(preview.draft.resourceId)),
		work: findWork(preview.draft.workId),
	};
}

/**
 * Calculates schedule-wide capacity and workflow metrics.
 *
 * @param {Array<Record<string, any>>} resources Decorated resources.
 * @param {Array<Record<string, any>>} allocations Decorated allocations.
 * @returns {Record<string, number>} Workspace summary.
 */
function calculateWorkspaceSummary(resources, allocations) {
	const capacityHours = resources.reduce((total, resource) => total + resource.capacityHours, 0);
	const scheduledHours = roundHours(resources.reduce((total, resource) => total + resource.scheduledHours, 0));
	return {
		capacityHours,
		scheduledHours,
		utilization: Math.round(scheduledHours / capacityHours * 100),
		overCapacity: resources.filter((resource) => resource.capacityState === 'over').length,
		tentative: allocations.filter((allocation) => allocation.status === 'hold').length,
		confirmed: allocations.filter((allocation) => allocation.status === 'confirmed').length,
	};
}

/**
 * Normalizes an allocation draft from an HTTP payload.
 *
 * @param {Record<string, unknown>} input Allocation request.
 * @returns {Record<string, any>} Normalized allocation draft.
 */
function normalizeAllocationDraft(input) {
	return {
		allocationId: String(input.allocationId || ''),
		resourceId: String(input.resourceId || ''),
		workId: String(input.workId || ''),
		date: String(input.date || ''),
		startTime: String(input.startTime || ''),
		endTime: String(input.endTime || ''),
		status: String(input.status || 'hold'),
		note: String(input.note || '').trim(),
	};
}

/**
 * Validates allocation field shape before policy evaluation.
 *
 * @param {Record<string, any>} draft Normalized draft.
 * @returns {Record<string, unknown>|null} Validation error or null.
 */
function validateAllocationDraft(draft) {
	const fields = {};
	if (!findResource(draft.resourceId)) fields.resourceId = ['Choose a supported resource.'];
	if (!findWork(draft.workId)) fields.workId = ['Choose scheduled work.'];
	if (!dateOptions().some((option) => option.value === draft.date)) fields.date = ['Choose a day in the active schedule week.'];
	if (!timeOptions().some((option) => option.value === draft.startTime)) fields.startTime = ['Choose a supported start time.'];
	if (!timeOptions().some((option) => option.value === draft.endTime)) fields.endTime = ['Choose a supported end time.'];
	if (parseTime(draft.endTime) <= parseTime(draft.startTime)) fields.endTime = ['End time must be after start time.'];
	if (!STATUS_OPTIONS.some((option) => option.value === draft.status)) fields.status = ['Choose a supported assignment status.'];
	if (draft.note.length < 12) fields.note = ['Retain at least 12 characters of delivery context.'];
	return Object.keys(fields).length ? validation('Review the assignment details.', fields) : null;
}

/**
 * Builds server-owned availability and capacity checks for an allocation.
 *
 * @param {Record<string, any>} resource Selected resource.
 * @param {Record<string, any>} work Selected work item.
 * @param {Record<string, any>} draft Normalized draft.
 * @param {Record<string, any>|null} existing Existing allocation when rescheduling.
 * @returns {Record<string, any>} Candidate checks and capacity impact.
 */
function buildAllocationCandidate(resource, work, draft, existing) {
	const duration = roundHours((parseTime(draft.endTime) - parseTime(draft.startTime)) / 60);
	const otherAllocations = allocationsForResource(resource.id).filter((allocation) => allocation.id !== existing?.id);
	const overlapping = otherAllocations.filter((allocation) => allocation.date === draft.date && rangesOverlap(allocation.startTime, allocation.endTime, draft.startTime, draft.endTime));
	const dayHoursBefore = roundHours(otherAllocations.filter((allocation) => allocation.date === draft.date).reduce((total, allocation) => total + durationHours(allocation), 0));
	const weekHoursBefore = roundHours(otherAllocations.reduce((total, allocation) => total + durationHours(allocation), 0));
	const projectedDayHours = roundHours(dayHoursBefore + duration);
	const projectedWeekHours = roundHours(weekHoursBefore + duration);
	const skillPassed = !work.skill || resource.skills.includes(work.skill);
	const regionPassed = !work.region || resource.regions.includes(work.region);
	const insideHours = parseTime(draft.startTime) >= parseTime('08:00') && parseTime(draft.endTime) <= parseTime('18:00');
	const checks = [
		check('availability', 'No assignment overlap', overlapping.length === 0 ? 'passed' : 'failed', overlapping.length ? `Conflicts with ${overlapping.map((allocation) => allocation.title).join(', ')}.` : 'The selected interval is open.'),
		check('skill', 'Required skill is available', skillPassed ? 'passed' : 'failed', skillPassed ? (work.skill ? `${resource.name} has ${work.skill} capability.` : 'No specialist skill is required.') : `${resource.name} does not have ${work.skill} capability.`),
		check('region', 'Delivery region is covered', regionPassed ? 'passed' : 'failed', regionPassed ? (work.region ? `${work.region} is in the resource service area.` : 'No service-area restriction applies.') : `${resource.name} is not assigned to ${work.region}.`),
		check('working_hours', 'Inside working hours', insideHours ? 'passed' : 'warning', insideHours ? 'The assignment is inside the 08:00–18:00 working window.' : 'The assignment requires an out-of-hours acknowledgement.'),
		check('daily_capacity', 'Daily capacity', projectedDayHours <= 8 ? 'passed' : 'warning', `${projectedDayHours}h planned on ${draft.date}; standard day is 8h.`),
		check('weekly_capacity', 'Weekly capacity', projectedWeekHours <= resource.capacityHours ? 'passed' : 'warning', `${projectedWeekHours}h projected against ${resource.capacityHours}h capacity.`),
	];
	return {
		checks,
		impact: {
			durationHours: duration,
			dayHoursBefore,
			projectedDayHours,
			weekHoursBefore,
			projectedWeekHours,
			capacityHours: resource.capacityHours,
			projectedUtilization: Math.round(projectedWeekHours / resource.capacityHours * 100),
			overlapCount: overlapping.length,
		},
	};
}

/**
 * Copies normalized draft and work metadata into an allocation record.
 *
 * @param {Record<string, any>} draft Normalized allocation draft.
 * @param {Record<string, any>} work Selected work item.
 * @returns {Record<string, any>} Mutable allocation fields.
 */
function allocationFieldsFromDraft(draft, work) {
	return {
		resourceId: draft.resourceId,
		workId: draft.workId,
		date: draft.date,
		startTime: draft.startTime,
		endTime: draft.endTime,
		status: draft.status,
		note: draft.note,
		title: work.label.split(' · ')[0],
		customer: work.customer,
		location: work.location,
		requiredSkill: work.skill,
		region: work.region,
	};
}

/**
 * Creates one normalized policy check.
 *
 * @param {string} key Stable check key.
 * @param {string} label Human-readable label.
 * @param {'passed'|'warning'|'failed'} status Check state.
 * @param {string} detail Evidence or remediation.
 * @returns {Record<string, string>} Serialized check.
 */
function check(key, label, status, detail) {
	return { key, label, status, detail };
}

/**
 * Lists every allocation for one resource.
 *
 * @param {string} resourceId Stable resource identifier.
 * @returns {Array<Record<string, any>>} Matching mutable allocations.
 */
function allocationsForResource(resourceId) {
	return workspace.allocations.filter((allocation) => allocation.resourceId === resourceId);
}

/**
 * Finds one resource by identifier.
 *
 * @param {unknown} resourceId Resource identifier.
 * @returns {Record<string, any>|null} Matching resource or null.
 */
function findResource(resourceId) {
	return RESOURCE_OPTIONS.find((resource) => resource.id === String(resourceId || '')) || null;
}

/**
 * Finds one allocation by identifier.
 *
 * @param {unknown} allocationId Allocation identifier.
 * @returns {Record<string, any>|null} Matching allocation or null.
 */
function findAllocation(allocationId) {
	return workspace.allocations.find((allocation) => allocation.id === String(allocationId || '')) || null;
}

/**
 * Finds one client-facing work item by identifier.
 *
 * @param {unknown} workId Work identifier.
 * @returns {Record<string, any>|null} Matching work item or null.
 */
function findWork(workId) {
	const work = findWorkOption(workId);
	return work ? { ...work, id: work.value } : null;
}

/**
 * Finds one immutable work option by identifier.
 *
 * @param {unknown} workId Work identifier.
 * @returns {Record<string, any>|null} Matching work option or null.
 */
function findWorkOption(workId) {
	return WORK_OPTIONS.find((work) => work.value === String(workId || '')) || null;
}

/**
 * Lists the active schedule week as select options.
 *
 * @returns {Array<Record<string, string>>} Day options.
 */
function dateOptions() {
	return [
		{ value: '2026-08-03', label: 'Monday 3 August' },
		{ value: '2026-08-04', label: 'Tuesday 4 August' },
		{ value: '2026-08-05', label: 'Wednesday 5 August' },
		{ value: '2026-08-06', label: 'Thursday 6 August' },
		{ value: '2026-08-07', label: 'Friday 7 August' },
		{ value: '2026-08-08', label: 'Saturday 8 August' },
		{ value: '2026-08-09', label: 'Sunday 9 August' },
	];
}

/**
 * Lists half-hour schedule intervals as select options.
 *
 * @returns {Array<Record<string, string>>} Time options.
 */
function timeOptions() {
	const options = [];
	for (let minutes = 7 * 60; minutes <= 20 * 60; minutes += 30) {
		const value = formatTime(minutes);
		options.push({ value, label: value });
	}
	return options;
}

/**
 * Determines whether two time intervals overlap.
 *
 * @param {string} leftStart First interval start.
 * @param {string} leftEnd First interval end.
 * @param {string} rightStart Second interval start.
 * @param {string} rightEnd Second interval end.
 * @returns {boolean} Whether the intervals overlap.
 */
function rangesOverlap(leftStart, leftEnd, rightStart, rightEnd) {
	return parseTime(leftStart) < parseTime(rightEnd) && parseTime(rightStart) < parseTime(leftEnd);
}

/**
 * Calculates one allocation duration in hours.
 *
 * @param {Record<string, any>} allocation Allocation with HH:mm boundaries.
 * @returns {number} Duration in hours.
 */
function durationHours(allocation) {
	return roundHours((parseTime(allocation.endTime) - parseTime(allocation.startTime)) / 60);
}

/**
 * Parses HH:mm into minutes after midnight.
 *
 * @param {string} value Time key.
 * @returns {number} Minutes after midnight, or zero for invalid values.
 */
function parseTime(value) {
	const match = /^(\d{2}):(\d{2})$/.exec(String(value || ''));
	if (!match) return 0;
	return (Number(match[1]) * 60) + Number(match[2]);
}

/**
 * Formats minutes after midnight as HH:mm.
 *
 * @param {number} minutes Minutes after midnight.
 * @returns {string} Time key.
 */
function formatTime(minutes) {
	return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/**
 * Rounds hours to one decimal place.
 *
 * @param {number} value Raw hour value.
 * @returns {number} Rounded hours.
 */
function roundHours(value) {
	return Math.round(value * 10) / 10;
}

/**
 * Appends one immutable workspace activity record.
 *
 * @param {string} title Activity title.
 * @param {string} detail Activity detail.
 * @param {string} tone Semantic tone.
 * @param {Record<string, any>|null} [allocation=null] Related allocation.
 * @param {string} [providerReceipt=''] Provider receipt.
 * @returns {void}
 */
function appendActivity(title, detail, tone, allocation = null, providerReceipt = '') {
	workspace.activity.unshift({
		id: `activity-${workspace.sequence++}`,
		title,
		detail,
		tone,
		actor: workspace.actor.name,
		allocationId: allocation?.id || null,
		providerReceipt,
		createdAt: nowIso(),
	});
}

/**
 * Creates a mutation receipt for one scheduler state change.
 *
 * @param {string} action Stable mutation action.
 * @param {Record<string, any>|null} [allocation=null] Related allocation.
 * @returns {Record<string, unknown>} Mutation receipt.
 */
function createMutationReceipt(action, allocation = null) {
	return {
		id: `mutation-${workspace.sequence++}`,
		action,
		workspaceRevision: workspace.revision,
		allocationId: allocation?.id || null,
		allocationVersion: allocation?.version || null,
		actor: workspace.actor.name,
		createdAt: nowIso(),
	};
}

/**
 * Requires an exact workspace revision.
 *
 * @param {unknown} revision Submitted revision.
 * @returns {Record<string, unknown>|null} Conflict error or null.
 */
function requireWorkspaceRevision(revision) {
	return Number(revision) === workspace.revision
		? null
		: conflict(`Workspace revision ${workspace.revision} is current. Refresh before continuing.`);
}

/**
 * Creates a structured validation response.
 *
 * @param {string} message Human-readable message.
 * @param {Record<string, string[]>} fields Field-specific errors.
 * @returns {Record<string, unknown>} Validation response.
 */
function validation(message, fields) {
	return { status: 422, error: 'validation_failed', message, fields };
}

/**
 * Creates a structured conflict response.
 *
 * @param {string} message Human-readable message.
 * @returns {Record<string, unknown>} Conflict response.
 */
function conflict(message) {
	return { status: 409, error: 'revision_conflict', message };
}

/**
 * Creates a structured missing-resource response.
 *
 * @param {string} resource Resource label.
 * @returns {Record<string, unknown>} Not-found response.
 */
function notFound(resource) {
	return { status: 404, error: 'not_found', message: `${resource} was not found.` };
}

/**
 * Returns the current ISO timestamp.
 *
 * @returns {string} ISO timestamp.
 */
function nowIso() {
	return new Date().toISOString();
}

/**
 * Returns a future ISO timestamp.
 *
 * @param {number} minutes Minutes from now.
 * @returns {string} Future ISO timestamp.
 */
function futureIso(minutes) {
	return new Date(Date.now() + (minutes * 60000)).toISOString();
}

/**
 * Creates a compact deterministic checksum for demo plans.
 *
 * @param {string} value Source value.
 * @returns {string} Demo checksum.
 */
function checksumFor(value) {
	let hash = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return `sha256:demo-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
