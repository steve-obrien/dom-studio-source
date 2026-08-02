const PROJECTS = Object.freeze([
	{ value: 'commerce-prod', label: 'Commerce production', budget: 1200, quota: 18, requiresBackup: true, publicIpv4Allowed: false },
	{ value: 'analytics', label: 'Analytics platform', budget: 760, quota: 12, requiresBackup: true, publicIpv4Allowed: true },
	{ value: 'sandbox', label: 'Sandbox lab', budget: 280, quota: 8, requiresBackup: false, publicIpv4Allowed: true },
]);

const REGIONS = Object.freeze([
	{ value: 'lon1', label: 'London / LON1', capacity: 'healthy', latencyMs: 8, vpcId: 'vpc-prod-lon1', firewallPolicyId: 'fw-private-web' },
	{ value: 'fra1', label: 'Frankfurt / FRA1', capacity: 'healthy', latencyMs: 17, vpcId: 'vpc-prod-fra1', firewallPolicyId: 'fw-private-web' },
	{ value: 'nyc2', label: 'New York / NYC2', capacity: 'limited', latencyMs: 72, vpcId: 'vpc-shared-nyc2', firewallPolicyId: 'fw-standard' },
	{ value: 'sin1', label: 'Singapore / SIN1', capacity: 'healthy', latencyMs: 162, vpcId: 'vpc-shared-sin1', firewallPolicyId: 'fw-standard' },
]);

const IMAGES = Object.freeze([
	{ value: 'ubuntu-24-04', label: 'Ubuntu 24.04 LTS', family: 'Linux', status: 'active', checksum: 'sha256:ubuntu-2404-demo' },
	{ value: 'debian-13', label: 'Debian 13', family: 'Linux', status: 'active', checksum: 'sha256:debian-13-demo' },
	{ value: 'rocky-10', label: 'Rocky Linux 10', family: 'Linux', status: 'active', checksum: 'sha256:rocky-10-demo' },
	{ value: 'windows-2025', label: 'Windows Server 2025', family: 'Windows', status: 'active', checksum: 'sha256:windows-2025-demo' },
]);

const SIZES = Object.freeze([
	{ value: 'shared-1x2', label: 'Shared 1 vCPU / 2 GB', cpu: 1, memoryGb: 2, includedDiskGb: 40, price: 14 },
	{ value: 'general-2x8', label: 'General 2 vCPU / 8 GB', cpu: 2, memoryGb: 8, includedDiskGb: 80, price: 48 },
	{ value: 'balanced-4x16', label: 'Balanced 4 vCPU / 16 GB', cpu: 4, memoryGb: 16, includedDiskGb: 120, price: 112 },
	{ value: 'compute-8x32', label: 'Compute 8 vCPU / 32 GB', cpu: 8, memoryGb: 32, includedDiskGb: 180, price: 236 },
]);

const SSH_KEYS = Object.freeze([
	{ value: 'deploy-prod', label: 'Deploy key / production', fingerprint: 'SHA256:prod-demo-44d2', projects: ['commerce-prod', 'analytics'], status: 'active' },
	{ value: 'platform-shared', label: 'Platform team / shared', fingerprint: 'SHA256:platform-demo-8af1', projects: ['commerce-prod', 'analytics', 'sandbox'], status: 'active' },
	{ value: 'sandbox-access', label: 'Sandbox access', fingerprint: 'SHA256:sandbox-demo-18bc', projects: ['sandbox'], status: 'active' },
]);

const BACKUP_POLICIES = Object.freeze([
	{ value: 'daily-14', label: 'Daily / 14-day retention', priceMultiplier: 0.12 },
	{ value: 'weekly-4', label: 'Weekly / 4 copies', priceMultiplier: 0.06 },
	{ value: 'none', label: 'No automated backups', priceMultiplier: 0 },
]);

let workspace = createInitialWorkspace();

/**
 * Returns the complete authoritative compute workspace.
 *
 * @returns {Record<string, unknown>} Serialized compute workspace.
 */
export function getVirtualMachineWorkspace() {
	return serializeResponse();
}

/**
 * Restores the deterministic compute workspace used by the block demo.
 *
 * @returns {Record<string, unknown>} Reset compute workspace.
 */
export function resetVirtualMachineWorkspace() {
	workspace = createInitialWorkspace();
	return serializeResponse('Compute workspace restored.');
}

/**
 * Selects one machine with exact workspace revision protection.
 *
 * @param {Record<string, unknown>} input Selection input.
 * @returns {Record<string, unknown>} Updated workspace or conflict response.
 */
export function selectVirtualMachine(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;

	const machine = findMachine(input.machineId);
	if (!machine) return notFound('Virtual machine');

	workspace.selectedMachineId = machine.id;
	workspace.revision += 1;
	return serializeResponse(`${machine.name} selected.`, {
		mutationReceipt: createMutationReceipt('machine_selected', machine),
	});
}

/**
 * Builds a server-owned provisioning plan with policy checks and checksum.
 *
 * @param {Record<string, unknown>} input Provisioning draft.
 * @returns {Record<string, unknown>} Updated workspace or validation response.
 */
export function previewVirtualMachineProvision(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;

	const values = normalizeProvisionInput(input);
	const validationError = validateProvisionInput(values);
	if (validationError) return validationError;

	const project = findCatalogItem(PROJECTS, values.projectId);
	const region = findCatalogItem(REGIONS, values.regionId);
	const image = findCatalogItem(IMAGES, values.imageId);
	const size = findCatalogItem(SIZES, values.sizeId);
	const sshKey = findCatalogItem(SSH_KEYS, values.sshKeyId);
	const backupPolicy = findCatalogItem(BACKUP_POLICIES, values.backupPolicyId);
	const estimate = calculateProvisionEstimate(values, size, backupPolicy);
	const checks = buildProvisionChecks(values, { project, region, image, size, sshKey, backupPolicy, estimate });
	const checksum = checksumFor(JSON.stringify({ values, estimate, checks: checks.map((check) => [check.key, check.status]) }));

	workspace.provisionPreview = {
		id: `plan-${workspace.sequence++}`,
		checksum,
		values,
		estimate,
		checks,
		createdAt: nowIso(),
		expiresAt: futureIso(20),
		requestedBy: workspace.actor.name,
		providerRequest: {
			project: project.label,
			region: region.label,
			image: image.label,
			size: size.label,
			sshFingerprint: sshKey.fingerprint,
			backupPolicy: backupPolicy.label,
			vpcId: region.vpcId,
			firewallPolicyId: region.firewallPolicyId,
		},
	};
	workspace.revision += 1;

	return serializeResponse('Exact provisioning plan created.', {
		mutationReceipt: createMutationReceipt('provision_previewed'),
	});
}

/**
 * Commits the exact acknowledged provisioning plan and creates a provider job.
 *
 * @param {Record<string, unknown>} input Commit input.
 * @returns {Record<string, unknown>} Updated workspace or validation response.
 */
export function commitVirtualMachineProvision(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	if (!workspace.provisionPreview) return validation('Review the provisioning plan before creating the machine.', { previewChecksum: ['No active preview exists.'] });
	if (input.previewChecksum !== workspace.provisionPreview.checksum) return conflict('The provisioning plan changed. Review the latest exact plan.');
	if (input.acknowledged !== true) return validation('Acknowledge the exact plan and provider request before provisioning.', { acknowledged: ['Acknowledgement is required.'] });

	const failedChecks = workspace.provisionPreview.checks.filter((check) => check.status !== 'passed');
	if (failedChecks.length) return validation('Resolve every server policy check before provisioning.', { policy: failedChecks.map((check) => check.detail) });

	const values = workspace.provisionPreview.values;
	const project = findCatalogItem(PROJECTS, values.projectId);
	const region = findCatalogItem(REGIONS, values.regionId);
	const image = findCatalogItem(IMAGES, values.imageId);
	const size = findCatalogItem(SIZES, values.sizeId);
	const backupPolicy = findCatalogItem(BACKUP_POLICIES, values.backupPolicyId);
	const machineId = `vm-${workspace.sequence++}`;
	const jobId = `provision-${workspace.sequence++}`;
	const providerId = `droplet-${workspace.sequence++}`;
	const createdAt = nowIso();
	const machine = {
		id: machineId,
		version: 1,
		providerId,
		name: values.name,
		projectId: values.projectId,
		regionId: values.regionId,
		state: 'provisioning',
		imageId: values.imageId,
		sizeId: values.sizeId,
		cpu: size.cpu,
		memoryGb: size.memoryGb,
		diskGb: values.diskGb,
		privateIp: 'Pending',
		publicIp: values.publicIpv4 ? 'Allocating' : null,
		owner: workspace.actor.name,
		monthlyCost: workspace.provisionPreview.estimate.monthly,
		createdAt,
		protection: {
			backupPolicyId: values.backupPolicyId,
			monitoring: values.monitoring,
			deleteLock: values.deleteLock,
		},
		health: {
			system: 'pending',
			instance: 'pending',
			storage: 'pending',
			lastCheckedAt: null,
			providerReceipt: null,
		},
		job: {
			id: jobId,
			status: 'running',
			currentStep: 0,
			steps: [
				{ key: 'allocate', label: 'Compute allocated', status: 'done', receipt: `compute-${workspace.sequence++}` },
				{ key: 'network', label: 'Private network attached', status: 'waiting', receipt: null },
				{ key: 'boot', label: 'Image boot completed', status: 'waiting', receipt: null },
				{ key: 'health', label: 'Provider health verified', status: 'waiting', receipt: null },
			],
		},
		snapshots: [],
		activity: [
			createActivity('Provisioning accepted', `${providerId} accepted the exact ${workspace.provisionPreview.checksum} plan.`, 'info'),
		],
	};

	workspace.machines.unshift(machine);
	workspace.selectedMachineId = machine.id;
	workspace.provisionPreview = null;
	workspace.revision += 1;
	return serializeResponse(`${machine.name} queued with ${providerId}.`, {
		provisionReceipt: {
			id: `receipt-${workspace.sequence++}`,
			providerId,
			jobId,
			imageChecksum: image.checksum,
			project: project.label,
			region: region.label,
			backupPolicy: backupPolicy.label,
			createdAt,
		},
		mutationReceipt: createMutationReceipt('machine_provisioned', machine),
	});
}

/**
 * Advances one deterministic provider provisioning step.
 *
 * @param {string} jobId Provider job identifier.
 * @param {Record<string, unknown>} input Job input.
 * @returns {Record<string, unknown>} Updated workspace or validation response.
 */
export function advanceVirtualMachineProvision(jobId, input = {}) {
	const machine = workspace.machines.find((item) => item.job?.id === jobId);
	if (!machine) return notFound('Provisioning job');
	const revisionError = requireRevisions(machine, input);
	if (revisionError) return revisionError;
	if (machine.job.status === 'completed') return validation('This provisioning job is already complete.', { job: ['No further steps remain.'] });

	const nextIndex = machine.job.currentStep + 1;
	const step = machine.job.steps[nextIndex];
	if (!step) return validation('The provider job has no next step.', { job: ['Refresh authoritative state.'] });

	step.status = 'done';
	step.receipt = `${step.key}-${workspace.sequence++}`;
	machine.job.currentStep = nextIndex;

	if (step.key === 'network') {
		machine.state = 'booting';
		machine.privateIp = `10.42.${workspace.machines.length + 8}.${workspace.sequence % 200}`;
		if (machine.publicIp) machine.publicIp = `203.0.113.${workspace.sequence % 200}`;
	}
	if (step.key === 'boot') machine.state = 'verifying';
	if (step.key === 'health') {
		machine.state = 'running';
		machine.job.status = 'completed';
		machine.health = {
			system: 'passed',
			instance: 'passed',
			storage: 'passed',
			lastCheckedAt: nowIso(),
			providerReceipt: `health-${workspace.sequence++}`,
		};
	}

	advanceMachine(machine);
	appendActivity(machine, step.label, `${step.receipt} confirmed by the provider adapter.`, step.key === 'health' ? 'success' : 'info');
	return serializeResponse(`${step.label} confirmed.`, {
		providerReceipt: { id: step.receipt, jobId, state: machine.state },
		mutationReceipt: createMutationReceipt('provision_step_advanced', machine),
	});
}

/**
 * Executes an acknowledged power operation against one machine.
 *
 * @param {string} machineId Machine identifier.
 * @param {Record<string, unknown>} input Power-operation input.
 * @returns {Record<string, unknown>} Updated workspace or validation response.
 */
export function executeVirtualMachinePowerAction(machineId, input = {}) {
	const machine = findMachine(machineId);
	if (!machine) return notFound('Virtual machine');
	const revisionError = requireRevisions(machine, input);
	if (revisionError) return revisionError;

	const action = String(input.action || '');
	const reason = String(input.reason || '').trim();
	if (!['start', 'stop', 'reboot'].includes(action)) return validation('Choose start, stop, or reboot.', { action: ['Unsupported power action.'] });
	if (reason.length < 12) return validation('Describe why this power operation is required.', { reason: ['Use at least 12 characters.'] });
	if (input.acknowledged !== true) return validation('Acknowledge the workload impact before changing power state.', { acknowledged: ['Acknowledgement is required.'] });
	if (machine.job?.status === 'running') return validation('Finish provisioning before changing power state.', { action: ['Provisioning is still active.'] });
	if (action === 'start' && machine.state !== 'stopped') return validation('Only stopped machines can be started.', { action: ['Select stop or reboot for this state.'] });
	if (action !== 'start' && machine.state !== 'running') return validation('Only running machines can be stopped or rebooted.', { action: ['Start the machine first.'] });

	const receipt = `power-${action}-${workspace.sequence++}`;
	const completedAction = { start: 'started', stop: 'stopped', reboot: 'rebooted' }[action];
	if (action === 'stop') {
		machine.state = 'stopped';
		machine.health.system = 'not-running';
		machine.health.instance = 'not-running';
		machine.health.storage = 'passed';
	} else {
		machine.state = 'running';
		machine.health.system = 'passed';
		machine.health.instance = 'passed';
		machine.health.storage = 'passed';
		machine.health.lastCheckedAt = nowIso();
		machine.health.providerReceipt = `health-${workspace.sequence++}`;
	}

	advanceMachine(machine);
	appendActivity(machine, `Machine ${completedAction}`, `${receipt} · ${reason}`, action === 'stop' ? 'warning' : 'success');
	return serializeResponse(`${machine.name} ${completedAction}.`, {
		powerReceipt: { id: receipt, machineId, action, reason, completedAt: nowIso() },
		mutationReceipt: createMutationReceipt(`machine_${action}`, machine),
	});
}

/**
 * Creates an immutable machine snapshot after explicit acknowledgement.
 *
 * @param {string} machineId Machine identifier.
 * @param {Record<string, unknown>} input Snapshot input.
 * @returns {Record<string, unknown>} Updated workspace or validation response.
 */
export function createVirtualMachineSnapshot(machineId, input = {}) {
	const machine = findMachine(machineId);
	if (!machine) return notFound('Virtual machine');
	const revisionError = requireRevisions(machine, input);
	if (revisionError) return revisionError;

	const name = String(input.name || '').trim();
	if (!/^[a-z][a-z0-9-]{2,48}$/.test(name)) return validation('Use a lowercase snapshot name with letters, numbers, or hyphens.', { name: ['Use 3 to 49 characters.'] });
	if (machine.snapshots.some((snapshot) => snapshot.name === name)) return validation('Snapshot names must be unique for this machine.', { name: ['This name already exists.'] });
	if (input.acknowledged !== true) return validation('Acknowledge storage and retention before creating the snapshot.', { acknowledged: ['Acknowledgement is required.'] });
	if (machine.job?.status === 'running') return validation('Finish provisioning before creating a snapshot.', { snapshot: ['Provisioning is still active.'] });

	const snapshot = {
		id: `snapshot-${workspace.sequence++}`,
		name,
		state: 'available',
		sizeGb: machine.diskGb,
		checksum: checksumFor(`${machine.id}:${machine.version}:${name}`),
		providerReceipt: `snapshot-provider-${workspace.sequence++}`,
		createdAt: nowIso(),
		createdBy: workspace.actor.name,
	};
	machine.snapshots.unshift(snapshot);
	advanceMachine(machine);
	appendActivity(machine, 'Snapshot available', `${snapshot.name} · ${snapshot.providerReceipt}`, 'success');
	return serializeResponse(`${snapshot.name} snapshot is available.`, {
		snapshotReceipt: structuredClone(snapshot),
		mutationReceipt: createMutationReceipt('snapshot_created', machine),
	});
}

/**
 * Creates the deterministic initial workspace.
 *
 * @returns {Record<string, unknown>} Initial mutable workspace.
 */
function createInitialWorkspace() {
	return {
		id: 'compute-workspace-1',
		name: 'Northstar compute',
		revision: 32,
		sequence: 8800,
		selectedMachineId: 'vm-api-01',
		actor: { id: 'steve', name: "Steve O'Brien", role: 'Platform operator' },
		provisionPreview: null,
		machines: [createApiMachine(), createJobsMachine(), createLabMachine()],
	};
}

/**
 * Creates the primary production machine.
 *
 * @returns {Record<string, unknown>} Production machine.
 */
function createApiMachine() {
	return createSeedMachine({
		id: 'vm-api-01',
		version: 7,
		providerId: 'droplet-2048',
		name: 'api-worker-01',
		projectId: 'commerce-prod',
		regionId: 'lon1',
		state: 'running',
		imageId: 'ubuntu-24-04',
		sizeId: 'balanced-4x16',
		diskGb: 160,
		privateIp: '10.42.8.14',
		publicIp: null,
		owner: 'Maya Chen',
		monthlyCost: 132,
		backupPolicyId: 'daily-14',
		monitoring: true,
		deleteLock: true,
		createdAt: '2026-06-10T09:15:00.000Z',
		healthReceipt: 'health-2048-31',
		activity: [
			createFixedActivity('activity-api-3', 'Status checks passed', 'System, instance, and storage checks passed.', 'success', 'Provider monitor', '2026-08-02T09:26:00.000Z'),
			createFixedActivity('activity-api-2', 'Daily backup completed', 'backup-2048-18 retained for 14 days.', 'success', 'Backup service', '2026-08-02T03:00:00.000Z'),
			createFixedActivity('activity-api-1', 'Machine created', 'droplet-2048 accepted the production plan.', 'info', 'Maya Chen', '2026-06-10T09:15:00.000Z'),
		],
		snapshots: [],
	});
}

/**
 * Creates the analytics worker machine.
 *
 * @returns {Record<string, unknown>} Analytics machine.
 */
function createJobsMachine() {
	return createSeedMachine({
		id: 'vm-jobs-02',
		version: 4,
		providerId: 'droplet-2052',
		name: 'jobs-runner-02',
		projectId: 'analytics',
		regionId: 'fra1',
		state: 'running',
		imageId: 'debian-13',
		sizeId: 'general-2x8',
		diskGb: 120,
		privateIp: '10.66.12.9',
		publicIp: '203.0.113.29',
		owner: 'Omar Reid',
		monthlyCost: 66,
		backupPolicyId: 'daily-14',
		monitoring: true,
		deleteLock: true,
		createdAt: '2026-06-07T14:12:00.000Z',
		healthReceipt: 'health-2052-19',
		activity: [
			createFixedActivity('activity-jobs-2', 'Status checks passed', 'System, instance, and storage checks passed.', 'success', 'Provider monitor', '2026-08-02T09:25:00.000Z'),
			createFixedActivity('activity-jobs-1', 'Machine created', 'droplet-2052 accepted the analytics plan.', 'info', 'Omar Reid', '2026-06-07T14:12:00.000Z'),
		],
		snapshots: [],
	});
}

/**
 * Creates the stopped sandbox machine.
 *
 * @returns {Record<string, unknown>} Sandbox machine.
 */
function createLabMachine() {
	const machine = createSeedMachine({
		id: 'vm-lab-03',
		version: 9,
		providerId: 'droplet-2064',
		name: 'model-lab-03',
		projectId: 'sandbox',
		regionId: 'nyc2',
		state: 'stopped',
		imageId: 'rocky-10',
		sizeId: 'compute-8x32',
		diskGb: 240,
		privateIp: '10.18.4.22',
		publicIp: '203.0.113.52',
		owner: 'Nina Patel',
		monthlyCost: 264,
		backupPolicyId: 'weekly-4',
		monitoring: true,
		deleteLock: false,
		createdAt: '2026-05-29T11:32:00.000Z',
		healthReceipt: 'health-2064-11',
		activity: [
			createFixedActivity('activity-lab-2', 'Machine stopped', 'power-stop-2064 · GPU experiment completed.', 'warning', 'Nina Patel', '2026-08-01T18:20:00.000Z'),
			createFixedActivity('activity-lab-1', 'Machine created', 'droplet-2064 accepted the sandbox plan.', 'info', 'Nina Patel', '2026-05-29T11:32:00.000Z'),
		],
		snapshots: [],
	});
	machine.health.system = 'not-running';
	machine.health.instance = 'not-running';
	return machine;
}

/**
 * Creates one seeded machine from catalog identifiers.
 *
 * @param {Record<string, unknown>} values Machine values.
 * @returns {Record<string, unknown>} Seeded machine.
 */
function createSeedMachine(values) {
	const size = findCatalogItem(SIZES, values.sizeId);
	return {
		...values,
		cpu: size.cpu,
		memoryGb: size.memoryGb,
		protection: {
			backupPolicyId: values.backupPolicyId,
			monitoring: values.monitoring,
			deleteLock: values.deleteLock,
		},
		health: {
			system: 'passed',
			instance: 'passed',
			storage: 'passed',
			lastCheckedAt: '2026-08-02T09:26:00.000Z',
			providerReceipt: values.healthReceipt,
		},
		job: null,
		snapshots: values.snapshots,
		activity: values.activity,
	};
}

/**
 * Serializes the workspace and optional mutation evidence.
 *
 * @param {string} message Optional response message.
 * @param {Record<string, unknown>} extra Additional response evidence.
 * @returns {Record<string, unknown>} Safe response payload.
 */
function serializeResponse(message, extra = {}) {
	const selectedMachine = findMachine(workspace.selectedMachineId) || workspace.machines[0];
	const running = workspace.machines.filter((machine) => machine.state === 'running').length;
	const provisioning = workspace.machines.filter((machine) => machine.job?.status === 'running').length;
	const monthlySpend = workspace.machines.reduce((total, machine) => total + machine.monthlyCost, 0);
	const totalCpu = workspace.machines.reduce((total, machine) => total + machine.cpu, 0);
	const totalMemoryGb = workspace.machines.reduce((total, machine) => total + machine.memoryGb, 0);

	return {
		workspace: {
			id: workspace.id,
			name: workspace.name,
			revision: workspace.revision,
			actor: structuredClone(workspace.actor),
			selectedMachineId: selectedMachine?.id || null,
			counts: { total: workspace.machines.length, running, provisioning },
			capacity: { totalCpu, totalMemoryGb },
			monthlySpend,
		},
		machines: workspace.machines.map(serializeMachineSummary),
		selectedMachine: selectedMachine ? serializeMachine(selectedMachine) : null,
		provisionPreview: workspace.provisionPreview ? structuredClone(workspace.provisionPreview) : null,
		catalogs: {
			projects: PROJECTS.map(toOption),
			regions: REGIONS.map((item) => ({ ...toOption(item), description: `${item.capacity} capacity · ${item.latencyMs} ms` })),
			images: IMAGES.map((item) => ({ ...toOption(item), description: `${item.family} · ${item.status}` })),
			sizes: SIZES.map((item) => ({ ...toOption(item), description: `$${item.price}/mo · ${item.includedDiskGb} GB included` })),
			sshKeys: SSH_KEYS.map((item) => ({ ...toOption(item), description: item.fingerprint })),
			backupPolicies: BACKUP_POLICIES.map(toOption),
		},
		...(message ? { message } : {}),
		...extra,
	};
}

/**
 * Serializes one machine for the fleet rail.
 *
 * @param {Record<string, unknown>} machine Mutable machine.
 * @returns {Record<string, unknown>} Fleet summary.
 */
function serializeMachineSummary(machine) {
	const project = findCatalogItem(PROJECTS, machine.projectId);
	const region = findCatalogItem(REGIONS, machine.regionId);
	return {
		id: machine.id,
		version: machine.version,
		name: machine.name,
		projectId: machine.projectId,
		project: project.label,
		regionId: machine.regionId,
		region: region.label,
		state: machine.state,
		stateMeta: stateMeta(machine.state),
		cpu: machine.cpu,
		memoryGb: machine.memoryGb,
		privateIp: machine.privateIp,
		monthlyCost: machine.monthlyCost,
		healthPassed: healthPassed(machine),
		jobProgress: machine.job ? jobProgress(machine.job) : null,
	};
}

/**
 * Serializes one machine with operational evidence and capabilities.
 *
 * @param {Record<string, unknown>} machine Mutable machine.
 * @returns {Record<string, unknown>} Full machine response.
 */
function serializeMachine(machine) {
	const project = findCatalogItem(PROJECTS, machine.projectId);
	const region = findCatalogItem(REGIONS, machine.regionId);
	const image = findCatalogItem(IMAGES, machine.imageId);
	const size = findCatalogItem(SIZES, machine.sizeId);
	const backupPolicy = findCatalogItem(BACKUP_POLICIES, machine.protection.backupPolicyId);
	return {
		...structuredClone(machine),
		project: project.label,
		region: region.label,
		image: image.label,
		size: size.label,
		backupPolicy: backupPolicy.label,
		stateMeta: stateMeta(machine.state),
		healthPassed: healthPassed(machine),
		jobProgress: machine.job ? jobProgress(machine.job) : null,
		providerEvidence: {
			providerId: machine.providerId,
			imageChecksum: image.checksum,
			vpcId: region.vpcId,
			firewallPolicyId: region.firewallPolicyId,
			healthReceipt: machine.health.providerReceipt,
		},
		capabilities: {
			canAdvanceJob: machine.job?.status === 'running',
			canPower: machine.job?.status !== 'running',
			canSnapshot: machine.job?.status !== 'running',
		},
	};
}

/**
 * Normalizes a provisioning draft into stable primitive values.
 *
 * @param {Record<string, unknown>} input Raw provisioning input.
 * @returns {Record<string, unknown>} Normalized provisioning values.
 */
function normalizeProvisionInput(input) {
	return {
		name: String(input.name || '').trim().toLowerCase(),
		projectId: String(input.projectId || ''),
		regionId: String(input.regionId || ''),
		imageId: String(input.imageId || ''),
		sizeId: String(input.sizeId || ''),
		sshKeyId: String(input.sshKeyId || ''),
		backupPolicyId: String(input.backupPolicyId || ''),
		diskGb: Number(input.diskGb),
		monitoring: input.monitoring === true,
		deleteLock: input.deleteLock === true,
		publicIpv4: input.publicIpv4 === true,
		reason: String(input.reason || '').trim(),
	};
}

/**
 * Validates provisioning fields before policy evaluation.
 *
 * @param {Record<string, unknown>} values Normalized provisioning values.
 * @returns {Record<string, unknown> | null} Validation response or null.
 */
function validateProvisionInput(values) {
	const fields = {};
	if (!/^[a-z][a-z0-9-]{2,30}$/.test(values.name)) fields.name = ['Use 3 to 31 lowercase letters, numbers, or hyphens.'];
	if (!findCatalogItem(PROJECTS, values.projectId)) fields.projectId = ['Choose a valid project.'];
	if (!findCatalogItem(REGIONS, values.regionId)) fields.regionId = ['Choose a valid region.'];
	if (!findCatalogItem(IMAGES, values.imageId)) fields.imageId = ['Choose an active image.'];
	if (!findCatalogItem(SIZES, values.sizeId)) fields.sizeId = ['Choose a valid machine size.'];
	if (!findCatalogItem(SSH_KEYS, values.sshKeyId)) fields.sshKeyId = ['Choose an active SSH key.'];
	if (!findCatalogItem(BACKUP_POLICIES, values.backupPolicyId)) fields.backupPolicyId = ['Choose a backup policy.'];
	if (!Number.isFinite(values.diskGb) || values.diskGb < 20 || values.diskGb > 640) fields.diskGb = ['Use 20 to 640 GB.'];
	if (values.reason.length < 20) fields.reason = ['Use at least 20 characters for the audit reason.'];
	return Object.keys(fields).length ? validation('Review the provisioning fields.', fields) : null;
}

/**
 * Calculates authoritative monthly and projected spend.
 *
 * @param {Record<string, unknown>} values Provision values.
 * @param {Record<string, unknown>} size Machine size.
 * @param {Record<string, unknown>} backupPolicy Backup policy.
 * @returns {Record<string, number>} Estimate values.
 */
function calculateProvisionEstimate(values, size, backupPolicy) {
	const includedDisk = size.includedDiskGb;
	const extraDisk = Math.max(0, values.diskGb - includedDisk);
	const storage = Math.ceil(extraDisk * 0.18);
	const backups = Math.ceil((size.price + storage) * backupPolicy.priceMultiplier);
	const publicIpv4 = values.publicIpv4 ? 6 : 0;
	const monthly = size.price + storage + backups + publicIpv4;
	const currentProjectSpend = workspace.machines
		.filter((machine) => machine.projectId === values.projectId)
		.reduce((total, machine) => total + machine.monthlyCost, 0);
	return { compute: size.price, storage, backups, publicIpv4, monthly, projectedProjectSpend: currentProjectSpend + monthly };
}

/**
 * Builds server-owned readiness checks for one provisioning plan.
 *
 * @param {Record<string, unknown>} values Provision values.
 * @param {Record<string, Record<string, unknown>>} context Resolved catalogs and estimate.
 * @returns {Array<Record<string, unknown>>} Provision policy checks.
 */
function buildProvisionChecks(values, context) {
	const projectMachines = workspace.machines.filter((machine) => machine.projectId === values.projectId);
	return [
		createCheck('hostname_unique', 'Hostname is unique', !workspace.machines.some((machine) => machine.name === values.name), `${values.name} is available.`),
		createCheck('quota_available', 'Project quota available', projectMachines.length < context.project.quota, `${context.project.quota - projectMachines.length} VM slots remain in ${context.project.label}.`),
		createCheck('region_capacity', 'Region has capacity', context.region.capacity === 'healthy', `${context.region.label} reports ${context.region.capacity} capacity.`),
		createCheck('image_active', 'Image is active', context.image.status === 'active', `${context.image.label} · ${context.image.checksum}`),
		createCheck('disk_compatible', 'Boot disk fits the plan', values.diskGb >= context.size.includedDiskGb, `${values.diskGb} GB requested; ${context.size.includedDiskGb} GB included.`),
		createCheck('ssh_scope', 'SSH key is allowed', context.sshKey.projects.includes(values.projectId), `${context.sshKey.label} · ${context.sshKey.fingerprint}`),
		createCheck('backup_policy', 'Backup policy satisfies the project', !context.project.requiresBackup || values.backupPolicyId !== 'none', context.project.requiresBackup ? 'Production projects require automated backups.' : 'Backups are optional for this project.'),
		createCheck('public_network', 'Network policy permits exposure', !values.publicIpv4 || context.project.publicIpv4Allowed, values.publicIpv4 ? `${context.region.firewallPolicyId} governs the public address.` : 'Private VPC only.'),
		createCheck('budget', 'Project remains under budget', context.estimate.projectedProjectSpend <= context.project.budget, `$${context.estimate.projectedProjectSpend} projected of $${context.project.budget}.`),
	];
}

/**
 * Creates one passed or failed policy check.
 *
 * @param {string} key Stable check key.
 * @param {string} label Human-readable label.
 * @param {boolean} passed Whether the check passed.
 * @param {string} detail Evidence detail.
 * @returns {Record<string, unknown>} Policy check.
 */
function createCheck(key, label, passed, detail) {
	return { key, label, status: passed ? 'passed' : 'failed', detail };
}

/**
 * Validates exact workspace and machine revisions.
 *
 * @param {Record<string, unknown>} machine Mutable machine.
 * @param {Record<string, unknown>} input Mutation input.
 * @returns {Record<string, unknown> | null} Conflict response or null.
 */
function requireRevisions(machine, input) {
	return requireWorkspaceRevision(input.revision) || requireMachineVersion(machine, input.machineVersion);
}

/**
 * Validates the exact workspace revision.
 *
 * @param {unknown} revision Submitted revision.
 * @returns {Record<string, unknown> | null} Conflict response or null.
 */
function requireWorkspaceRevision(revision) {
	if (Number(revision) === workspace.revision) return null;
	return conflict(`Workspace revision ${workspace.revision} is authoritative.`);
}

/**
 * Validates the exact machine version.
 *
 * @param {Record<string, unknown>} machine Mutable machine.
 * @param {unknown} version Submitted version.
 * @returns {Record<string, unknown> | null} Conflict response or null.
 */
function requireMachineVersion(machine, version) {
	if (Number(version) === machine.version) return null;
	return conflict(`${machine.name} version ${machine.version} is authoritative.`);
}

/**
 * Advances machine and workspace revisions.
 *
 * @param {Record<string, unknown>} machine Mutable machine.
 * @returns {void}
 */
function advanceMachine(machine) {
	machine.version += 1;
	workspace.revision += 1;
}

/**
 * Appends one provider or operator event to a machine.
 *
 * @param {Record<string, unknown>} machine Mutable machine.
 * @param {string} title Event title.
 * @param {string} detail Event detail.
 * @param {string} tone Semantic tone.
 * @returns {void}
 */
function appendActivity(machine, title, detail, tone) {
	machine.activity.unshift(createActivity(title, detail, tone));
}

/**
 * Creates one activity event for the current actor.
 *
 * @param {string} title Event title.
 * @param {string} detail Event detail.
 * @param {string} tone Semantic tone.
 * @returns {Record<string, unknown>} Activity event.
 */
function createActivity(title, detail, tone) {
	return {
		id: `activity-${workspace.sequence++}`,
		title,
		detail,
		tone,
		actor: workspace.actor.name,
		createdAt: nowIso(),
	};
}

/**
 * Creates one fixed activity for seeded state.
 *
 * @param {string} id Event identifier.
 * @param {string} title Event title.
 * @param {string} detail Event detail.
 * @param {string} tone Semantic tone.
 * @param {string} actor Actor label.
 * @param {string} createdAt ISO timestamp.
 * @returns {Record<string, unknown>} Activity event.
 */
function createFixedActivity(id, title, detail, tone, actor, createdAt) {
	return { id, title, detail, tone, actor, createdAt };
}

/**
 * Creates an immutable mutation receipt.
 *
 * @param {string} type Mutation type.
 * @param {Record<string, unknown> | null} machine Optional machine.
 * @returns {Record<string, unknown>} Mutation receipt.
 */
function createMutationReceipt(type, machine = null) {
	return {
		id: `audit-${workspace.sequence++}`,
		type,
		workspaceRevision: workspace.revision,
		machineVersion: machine?.version || null,
		actor: workspace.actor.name,
		createdAt: nowIso(),
	};
}

/**
 * Finds one machine by identifier.
 *
 * @param {unknown} machineId Machine identifier.
 * @returns {Record<string, unknown> | null} Mutable machine or null.
 */
function findMachine(machineId) {
	return workspace.machines.find((machine) => machine.id === machineId) || null;
}

/**
 * Finds one catalog item by value.
 *
 * @param {Array<Record<string, unknown>>} catalog Catalog values.
 * @param {unknown} value Item value.
 * @returns {Record<string, unknown> | null} Catalog item or null.
 */
function findCatalogItem(catalog, value) {
	return catalog.find((item) => item.value === value) || null;
}

/**
 * Converts a catalog item into a DOM Studio option.
 *
 * @param {Record<string, unknown>} item Catalog item.
 * @returns {{label: string, value: string}} Select option.
 */
function toOption(item) {
	return { label: item.label, value: item.value };
}

/**
 * Returns semantic presentation for one machine state.
 *
 * @param {string} state Machine state.
 * @returns {{label: string, tone: string}} State presentation.
 */
function stateMeta(state) {
	const values = {
		running: { label: 'Running', tone: 'success' },
		stopped: { label: 'Stopped', tone: 'neutral' },
		provisioning: { label: 'Provisioning', tone: 'info' },
		booting: { label: 'Booting', tone: 'info' },
		verifying: { label: 'Verifying', tone: 'warning' },
	};
	return values[state] || { label: state, tone: 'neutral' };
}

/**
 * Returns whether all provider health checks passed.
 *
 * @param {Record<string, unknown>} machine Machine state.
 * @returns {boolean} True when all health checks passed.
 */
function healthPassed(machine) {
	return ['system', 'instance', 'storage'].every((key) => machine.health[key] === 'passed');
}

/**
 * Calculates provider-job progress.
 *
 * @param {Record<string, unknown>} job Provisioning job.
 * @returns {{completed: number, total: number, percent: number}} Job progress.
 */
function jobProgress(job) {
	const completed = job.steps.filter((step) => step.status === 'done').length;
	return { completed, total: job.steps.length, percent: Math.round((completed / job.steps.length) * 100) };
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
 * @returns {string} ISO timestamp.
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
