const currentOperator = {
	id: 'usr_maya',
	name: 'Maya Patel',
	initials: 'MP',
	role: 'Strategic customer success manager',
	permissions: ['health:read', 'timeline:write', 'success-plan:create', 'task:update', 'health:refresh'],
};

const ownerCatalog = [
	{ value: 'usr_maya', label: 'Maya Patel', description: 'Strategic customer success manager' },
	{ value: 'usr_jon', label: 'Jon Bell', description: 'Commercial customer success manager' },
	{ value: 'usr_sam', label: 'Sam Rivera', description: 'Enterprise customer success manager' },
	{ value: 'usr_priya', label: 'Priya Shah', description: 'Implementation success manager' },
];

const segmentCatalog = [
	{ value: 'my-book', label: 'My book of business', description: 'Accounts currently assigned to Maya Patel.' },
	{ value: 'needs-attention', label: 'Needs attention', description: 'Critical and at-risk accounts with open indicators.' },
	{ value: 'renewing-soon', label: 'Renewing in 90 days', description: 'Accounts with a near-term renewal date.' },
	{ value: 'all', label: 'All customer accounts', description: 'Every account in the customer-success workspace.' },
];

const activityTypeCatalog = [
	{ value: 'customer-call', label: 'Customer call', description: 'A customer or executive conversation.' },
	{ value: 'internal-note', label: 'Internal note', description: 'Context for the account team only.' },
	{ value: 'renewal', label: 'Renewal update', description: 'Commercial or procurement movement.' },
	{ value: 'support', label: 'Support escalation', description: 'A customer-facing incident or support update.' },
];

const playbookCatalog = [
	{
		value: 'renewal-recovery',
		label: 'Renewal recovery',
		description: 'Align the sponsor, resolve escalations, recover adoption, and prepare commercial proof.',
		goal: 'Restore executive confidence and create a credible path to renewal.',
		tasks: [
			{ key: 'sponsor', label: 'Confirm executive sponsor and meeting date', category: 'Relationship', dueOffset: -12 },
			{ key: 'support', label: 'Publish the P1 escalation recovery update', category: 'Support', dueOffset: -10 },
			{ key: 'adoption', label: 'Run an adoption workshop for inactive teams', category: 'Adoption', dueOffset: -6 },
			{ key: 'value', label: 'Attach quantified value proof to the renewal', category: 'Commercial', dueOffset: -2 },
		],
	},
	{
		value: 'adoption-rescue',
		label: 'Adoption rescue',
		description: 'Re-engage inactive teams and restore the customer’s core product workflow.',
		goal: 'Return core workflow adoption to the agreed success threshold.',
		tasks: [
			{ key: 'audience', label: 'Identify inactive teams and workflow owners', category: 'Adoption', dueOffset: -12 },
			{ key: 'workshop', label: 'Schedule a workflow recovery workshop', category: 'Adoption', dueOffset: -9 },
			{ key: 'enablement', label: 'Share role-specific enablement material', category: 'Enablement', dueOffset: -5 },
			{ key: 'measure', label: 'Measure weekly active team recovery', category: 'Measurement', dueOffset: -1 },
		],
	},
	{
		value: 'executive-alignment',
		label: 'Executive alignment',
		description: 'Re-establish outcomes, executive ownership, and a shared decision cadence.',
		goal: 'Agree the executive outcomes and decision path for the next customer milestone.',
		tasks: [
			{ key: 'brief', label: 'Prepare an executive account brief', category: 'Relationship', dueOffset: -10 },
			{ key: 'meeting', label: 'Confirm the executive review agenda', category: 'Relationship', dueOffset: -7 },
			{ key: 'outcomes', label: 'Document agreed customer outcomes', category: 'Value', dueOffset: -3 },
			{ key: 'cadence', label: 'Publish the executive follow-up cadence', category: 'Governance', dueOffset: -1 },
		],
	},
];

const accountSeeds = [
	{
		id: 'acct_zephyr',
		version: 8,
		name: 'Zephyr Health',
		initials: 'ZH',
		segment: 'Enterprise',
		industry: 'Healthcare',
		ownerId: 'usr_maya',
		owner: 'Maya Patel',
		champion: 'Elena Ruiz, VP Operations',
		plan: 'Enterprise annual',
		arr: 184000,
		renewalDate: '2026-09-18',
		daysToRenewal: 47,
		healthScore: 59,
		previousScore: 66,
		status: 'at-risk',
		lastTouch: '2 days ago',
		activeSeats: 118,
		licensedSeats: 180,
		weeklyActiveTeams: 9,
		integrations: 4,
		openTickets: 7,
		priorityTickets: 2,
		nps: 18,
		measures: [
			{ id: 'adoption', label: 'Product adoption', score: 54, weight: 35, trend: -12, status: 'at-risk', detail: 'Three large teams stopped using approvals last week.', source: 'Product analytics', freshness: '15 minutes ago' },
			{ id: 'support', label: 'Support pressure', score: 46, weight: 25, trend: -18, status: 'critical', detail: 'Two unresolved P1 incidents have no customer-facing update.', source: 'Support desk', freshness: '5 minutes ago' },
			{ id: 'relationship', label: 'Relationship', score: 64, weight: 20, trend: -6, status: 'at-risk', detail: 'The champion is active, but executive sponsorship is not confirmed.', source: 'CRM timeline', freshness: '2 hours ago' },
			{ id: 'commercial', label: 'Commercial', score: 72, weight: 20, trend: 2, status: 'monitoring', detail: 'Procurement opened the quote and requested a security addendum.', source: 'Billing and CRM', freshness: '1 day ago' },
		],
		scoreHistory: [
			{ label: 'Jun 28', score: 74 },
			{ label: 'Jul 05', score: 72 },
			{ label: 'Jul 12', score: 69 },
			{ label: 'Jul 19', score: 66 },
			{ label: 'Jul 26', score: 63 },
			{ label: 'Aug 02', score: 59 },
		],
		risk: {
			id: 'risk_zephyr_renewal',
			status: 'open',
			severity: 'high',
			label: 'Renewal confidence declining',
			detail: 'Adoption and support pressure crossed the enterprise intervention threshold.',
			ownerId: 'usr_maya',
			owner: 'Maya Patel',
			dueDate: '2026-08-10',
			raisedAt: 'Today · 08:40',
		},
		opportunities: [
			{ id: 'opp_field_ops', label: 'Field operations rollout', value: '42 seats', confidence: 'High', status: 'blocked-by-risk' },
			{ id: 'opp_slack', label: 'Slack workflow activation', value: '12 teams', confidence: 'Medium', status: 'discovery' },
		],
		activity: [
			{ id: 'activity_zephyr_1', type: 'Risk', title: 'Health threshold crossed', detail: 'Weighted health fell below 60 after adoption and support measures declined.', actor: 'Health engine', time: 'Today · 08:40', source: 'Automatic', receipt: 'health_event_7181' },
			{ id: 'activity_zephyr_2', type: 'Support', title: 'Export timeout escalated', detail: 'Engineering linked the incident to the large account sync path.', actor: 'Inez Hart', time: 'Yesterday · 16:15', source: 'Support desk', receipt: 'support_event_7159' },
			{ id: 'activity_zephyr_3', type: 'Call', title: 'Champion requested rollout guidance', detail: 'Regional managers need approval-workflow training before expansion.', actor: 'Maya Patel', time: 'Jul 30 · 14:20', source: 'CRM', receipt: 'timeline_event_7128' },
			{ id: 'activity_zephyr_4', type: 'Renewal', title: 'Renewal quote opened', detail: 'Procurement viewed annual terms and requested the security addendum.', actor: 'CRM sync', time: 'Jul 28 · 11:05', source: 'CRM', receipt: 'crm_event_7109' },
		],
		plan: null,
		lastHealthRefreshReceipt: null,
	},
	{
		id: 'acct_atlas',
		version: 5,
		name: 'Atlas Retail Group',
		initials: 'AR',
		segment: 'Enterprise',
		industry: 'Retail',
		ownerId: 'usr_sam',
		owner: 'Sam Rivera',
		champion: 'Jordan Lee, CIO',
		plan: 'Enterprise annual',
		arr: 221000,
		renewalDate: '2026-08-22',
		daysToRenewal: 20,
		healthScore: 48,
		previousScore: 58,
		status: 'critical',
		lastTouch: '12 days ago',
		activeSeats: 96,
		licensedSeats: 240,
		weeklyActiveTeams: 4,
		integrations: 2,
		openTickets: 13,
		priorityTickets: 3,
		nps: -12,
		measures: [
			{ id: 'adoption', label: 'Product adoption', score: 40, weight: 35, trend: -16, status: 'critical', detail: 'Only four of twelve target teams are active.', source: 'Product analytics', freshness: '20 minutes ago' },
			{ id: 'support', label: 'Support pressure', score: 36, weight: 25, trend: -22, status: 'critical', detail: 'Three identity incidents block store-manager provisioning.', source: 'Support desk', freshness: '8 minutes ago' },
			{ id: 'relationship', label: 'Relationship', score: 44, weight: 20, trend: -12, status: 'critical', detail: 'No executive touchpoint has been logged since April.', source: 'CRM timeline', freshness: '12 days ago' },
			{ id: 'commercial', label: 'Commercial', score: 78, weight: 20, trend: -3, status: 'monitoring', detail: 'The opportunity moved from commit to best case.', source: 'CRM opportunity', freshness: '4 hours ago' },
		],
		scoreHistory: [{ label: 'Jun 28', score: 68 }, { label: 'Jul 05', score: 64 }, { label: 'Jul 12', score: 61 }, { label: 'Jul 19', score: 58 }, { label: 'Jul 26', score: 53 }, { label: 'Aug 02', score: 48 }],
		risk: { id: 'risk_atlas_renewal', status: 'open', severity: 'critical', label: 'Executive and adoption risk', detail: 'Renewal is near while identity blockers prevent rollout.', ownerId: 'usr_sam', owner: 'Sam Rivera', dueDate: '2026-08-06', raisedAt: 'Yesterday · 09:10' },
		opportunities: [{ id: 'opp_atlas_identity', label: 'Identity provisioning project', value: 'Protects £221k ARR', confidence: 'High', status: 'blocked-by-risk' }],
		activity: [{ id: 'activity_atlas_1', type: 'Risk', title: 'Renewal forecast moved', detail: 'The opportunity changed from commit to best case.', actor: 'CRM sync', time: 'Yesterday · 09:10', source: 'CRM', receipt: 'crm_event_7186' }],
		plan: null,
		lastHealthRefreshReceipt: null,
	},
	{
		id: 'acct_northstar',
		version: 11,
		name: 'Northstar Finance',
		initials: 'NF',
		segment: 'Mid-market',
		industry: 'Financial services',
		ownerId: 'usr_jon',
		owner: 'Jon Bell',
		champion: 'Priya Shah, Revenue Operations',
		plan: 'Scale annual',
		arr: 76000,
		renewalDate: '2026-11-04',
		daysToRenewal: 94,
		healthScore: 88,
		previousScore: 84,
		status: 'healthy',
		lastTouch: '5 days ago',
		activeSeats: 63,
		licensedSeats: 70,
		weeklyActiveTeams: 6,
		integrations: 7,
		openTickets: 1,
		priorityTickets: 0,
		nps: 52,
		measures: [
			{ id: 'adoption', label: 'Product adoption', score: 92, weight: 35, trend: 6, status: 'healthy', detail: 'Weekly active teams increased from four to six.', source: 'Product analytics', freshness: '10 minutes ago' },
			{ id: 'support', label: 'Support pressure', score: 94, weight: 25, trend: 2, status: 'healthy', detail: 'Only one low-severity ticket remains open.', source: 'Support desk', freshness: '12 minutes ago' },
			{ id: 'relationship', label: 'Relationship', score: 86, weight: 20, trend: 4, status: 'healthy', detail: 'The champion approved the next executive review agenda.', source: 'CRM timeline', freshness: '5 days ago' },
			{ id: 'commercial', label: 'Commercial', score: 76, weight: 20, trend: 1, status: 'monitoring', detail: 'Budget-cycle confirmation is still outstanding.', source: 'CRM opportunity', freshness: '1 day ago' },
		],
		scoreHistory: [{ label: 'Jun 28', score: 78 }, { label: 'Jul 05', score: 80 }, { label: 'Jul 12', score: 82 }, { label: 'Jul 19', score: 84 }, { label: 'Jul 26', score: 86 }, { label: 'Aug 02', score: 88 }],
		risk: null,
		opportunities: [{ id: 'opp_northstar_audit', label: 'Audit log add-on', value: '£14k ARR', confidence: 'High', status: 'discovery' }],
		activity: [{ id: 'activity_northstar_1', type: 'Product', title: 'Forecast report adopted', detail: 'Finance leadership opened the report 38 times this week.', actor: 'Product analytics', time: 'Yesterday · 12:40', source: 'Automatic', receipt: 'usage_event_7174' }],
		plan: null,
		lastHealthRefreshReceipt: null,
	},
	{
		id: 'acct_harbor',
		version: 7,
		name: 'Harbor Retail',
		initials: 'HR',
		segment: 'Mid-market',
		industry: 'Retail',
		ownerId: 'usr_maya',
		owner: 'Maya Patel',
		champion: 'Marco Ruiz, Operations Director',
		plan: 'Growth annual',
		arr: 92000,
		renewalDate: '2026-10-11',
		daysToRenewal: 70,
		healthScore: 71,
		previousScore: 73,
		status: 'monitoring',
		lastTouch: 'Yesterday',
		activeSeats: 79,
		licensedSeats: 104,
		weeklyActiveTeams: 8,
		integrations: 5,
		openTickets: 3,
		priorityTickets: 0,
		nps: 34,
		measures: [
			{ id: 'adoption', label: 'Product adoption', score: 70, weight: 35, trend: -4, status: 'monitoring', detail: 'Two regional teams have lower approval volume.', source: 'Product analytics', freshness: '18 minutes ago' },
			{ id: 'support', label: 'Support pressure', score: 82, weight: 25, trend: 3, status: 'healthy', detail: 'No priority incidents are open.', source: 'Support desk', freshness: '30 minutes ago' },
			{ id: 'relationship', label: 'Relationship', score: 74, weight: 20, trend: 0, status: 'monitoring', detail: 'The champion remains engaged.', source: 'CRM timeline', freshness: 'Yesterday' },
			{ id: 'commercial', label: 'Commercial', score: 56, weight: 20, trend: -8, status: 'at-risk', detail: 'The renewal business case has not been opened.', source: 'CRM opportunity', freshness: '2 days ago' },
		],
		scoreHistory: [{ label: 'Jun 28', score: 76 }, { label: 'Jul 05', score: 75 }, { label: 'Jul 12', score: 74 }, { label: 'Jul 19', score: 73 }, { label: 'Jul 26', score: 72 }, { label: 'Aug 02', score: 71 }],
		risk: { id: 'risk_harbor_commercial', status: 'monitoring', severity: 'medium', label: 'Commercial readiness', detail: 'Renewal proof is not yet assembled.', ownerId: 'usr_maya', owner: 'Maya Patel', dueDate: '2026-08-18', raisedAt: 'Jul 29 · 10:20' },
		opportunities: [{ id: 'opp_harbor_teams', label: 'Regional workflow expansion', value: '25 seats', confidence: 'Medium', status: 'discovery' }],
		activity: [{ id: 'activity_harbor_1', type: 'Call', title: 'Regional rollout reviewed', detail: 'The champion asked for adoption benchmarks.', actor: 'Maya Patel', time: 'Yesterday · 15:30', source: 'CRM', receipt: 'timeline_event_7178' }],
		plan: null,
		lastHealthRefreshReceipt: null,
	},
	{
		id: 'acct_luma',
		version: 3,
		name: 'Luma Works',
		initials: 'LW',
		segment: 'Growth',
		industry: 'Professional services',
		ownerId: 'usr_priya',
		owner: 'Priya Shah',
		champion: 'Theo Grant, Delivery Lead',
		plan: 'Growth annual',
		arr: 54000,
		renewalDate: '2027-02-14',
		daysToRenewal: 196,
		healthScore: 79,
		previousScore: 75,
		status: 'healthy',
		lastTouch: '3 days ago',
		activeSeats: 44,
		licensedSeats: 52,
		weeklyActiveTeams: 5,
		integrations: 6,
		openTickets: 2,
		priorityTickets: 0,
		nps: 41,
		measures: [
			{ id: 'adoption', label: 'Product adoption', score: 84, weight: 35, trend: 7, status: 'healthy', detail: 'Core workflow adoption grew across delivery teams.', source: 'Product analytics', freshness: '22 minutes ago' },
			{ id: 'support', label: 'Support pressure', score: 86, weight: 25, trend: 4, status: 'healthy', detail: 'Only two low-severity questions are open.', source: 'Support desk', freshness: '40 minutes ago' },
			{ id: 'relationship', label: 'Relationship', score: 78, weight: 20, trend: 2, status: 'healthy', detail: 'The implementation sponsor is active.', source: 'CRM timeline', freshness: '3 days ago' },
			{ id: 'commercial', label: 'Commercial', score: 62, weight: 20, trend: 0, status: 'monitoring', detail: 'Expansion timing is not yet qualified.', source: 'CRM opportunity', freshness: '4 days ago' },
		],
		scoreHistory: [{ label: 'Jun 28', score: 69 }, { label: 'Jul 05', score: 71 }, { label: 'Jul 12', score: 73 }, { label: 'Jul 19', score: 75 }, { label: 'Jul 26', score: 77 }, { label: 'Aug 02', score: 79 }],
		risk: null,
		opportunities: [{ id: 'opp_luma_enterprise', label: 'Enterprise workflow pack', value: '£24k ARR', confidence: 'Low', status: 'discovery' }],
		activity: [{ id: 'activity_luma_1', type: 'Success', title: 'Implementation milestone completed', detail: 'Five delivery teams now use the core workflow weekly.', actor: 'Priya Shah', time: 'Jul 30 · 10:00', source: 'CRM', receipt: 'timeline_event_7131' }],
		plan: null,
		lastHealthRefreshReceipt: null,
	},
];

let sequence = 7200;
let customerHealthState = createState();

/**
 * Returns the complete customer health workspace.
 *
 * @returns {object} JSON-safe portfolio, selected account, catalogs, and workflow state.
 */
export function getCustomerHealthWorkspace() {
	return serializeWorkspace();
}

/**
 * Restores the deterministic customer health workspace.
 *
 * @returns {object} Reset workspace.
 */
export function resetCustomerHealthWorkspace() {
	sequence = 7200;
	customerHealthState = createState();
	return serializeWorkspace();
}

/**
 * Persists the selected account with exact workspace revision protection.
 *
 * @param {object} input Selection mutation.
 * @returns {object} Updated workspace or API error.
 */
export function selectCustomerHealthAccount(input = {}) {
	const revisionResult = requireRevision(input.revision);
	if (revisionResult) return revisionResult;
	const account = findAccount(input.accountId);
	if (!account) return error('The selected customer account no longer exists.', 404);
	customerHealthState.selectedAccountId = account.id;
	commitState(currentOperator.name, 'Account opened', `${account.name} selected for review.`);
	return serializeWorkspace();
}

/**
 * Creates an immutable success-plan preview from authoritative account evidence.
 *
 * @param {object} input Plan configuration and exact account version.
 * @returns {object} Updated workspace with preview or API error.
 */
export function previewCustomerSuccessPlan(input = {}) {
	const revisionResult = requireRevision(input.revision);
	if (revisionResult) return revisionResult;
	const account = findAccount(input.accountId);
	if (!account) return error('The customer account no longer exists.', 404);
	if (Number(input.accountVersion) !== account.version) return error(`Account evidence changed from version ${input.accountVersion} to ${account.version}. Refresh before creating a plan.`, 409);
	if (account.plan?.status === 'active') return error('This account already has an active success plan.', 409);
	const template = findPlaybook(input.templateId);
	if (!template) return error('Choose a valid success-plan template.', 422);
	const owner = findOwner(input.ownerId);
	if (!owner) return error('Choose an accountable plan owner.', 422);
	const dueDate = String(input.dueDate || '');
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return error('Choose a valid plan due date.', 422);
	if (dueDate < '2026-08-04') return error('The plan due date must leave time for the recovery work.', 422);
	if (dueDate >= account.renewalDate) return error('The recovery plan must finish before the renewal date.', 422);
	const objective = String(input.objective || '').trim();
	if (objective.length < 24) return error('Describe the customer outcome in at least 24 characters.', 422);
	const note = String(input.note || '').trim();
	if (note.length < 12) return error('Add enough internal context for the account team.', 422);
	const previewId = nextId('success_plan_preview');
	const tasks = template.tasks.map((task, index) => ({
		id: `${previewId}_task_${index + 1}`,
		key: task.key,
		label: task.label,
		category: task.category,
		ownerId: owner.value,
		owner: owner.label,
		dueDate: addDays(dueDate, task.dueOffset),
	}));
	customerHealthState.preview = {
		id: previewId,
		receipt: nextId('success_plan_preview_receipt'),
		accountId: account.id,
		accountName: account.name,
		accountVersion: account.version,
		templateId: template.value,
		templateLabel: template.label,
		ownerId: owner.value,
		owner: owner.label,
		dueDate,
		objective,
		note,
		goal: template.goal,
		tasks,
		checks: [
			createCheck('permission', 'Operator permission', 'passed', `${currentOperator.role} can create customer success plans.`),
			createCheck('account-version', 'Account evidence', 'passed', `${account.name} version ${account.version} is locked into this preview.`),
			createCheck('health-sources', 'Health sources', 'passed', 'Product, support, CRM, and billing evidence are available with source timestamps.'),
			createCheck('risk-link', 'Risk indicator', account.risk ? 'passed' : 'advisory', account.risk ? `${account.risk.label} will be linked to the plan.` : 'No open risk indicator will be linked.'),
			createCheck('renewal-window', 'Recovery window', 'passed', `The plan completes before the ${account.renewalDate} renewal.`),
			createCheck('duplicate-plan', 'Duplicate plan', 'passed', 'No active success plan exists for this account.'),
		],
		createdBy: currentOperator.name,
		createdAt: 'Just now',
	};
	commitState(currentOperator.name, 'Success plan preview created', `${template.label} previewed for ${account.name}.`);
	return serializeWorkspace();
}

/**
 * Launches an acknowledged immutable success-plan preview.
 *
 * @param {object} input Preview receipt and acknowledgement.
 * @returns {object} Updated workspace with active plan or API error.
 */
export function launchCustomerSuccessPlan(input = {}) {
	const revisionResult = requireRevision(input.revision);
	if (revisionResult) return revisionResult;
	const preview = customerHealthState.preview;
	if (!preview || preview.id !== String(input.previewId || '')) return error('The success-plan preview is missing or has changed.', 409);
	if (!input.acknowledged) return error('Confirm that you reviewed the customer outcome, tasks, owners, and due dates.', 422);
	const account = findAccount(preview.accountId);
	if (!account) return error('The customer account no longer exists.', 404);
	if (account.version !== preview.accountVersion) return error(`Account evidence changed from version ${preview.accountVersion} to ${account.version}. Create a fresh preview.`, 409);
	const planId = nextId('success_plan');
	account.plan = {
		id: planId,
		version: 1,
		status: 'active',
		name: `${account.name} · ${preview.templateLabel}`,
		templateId: preview.templateId,
		templateLabel: preview.templateLabel,
		objective: preview.objective,
		goal: preview.goal,
		ownerId: preview.ownerId,
		owner: preview.owner,
		dueDate: preview.dueDate,
		progress: 0,
		receipt: nextId('success_plan_receipt'),
		previewReceipt: preview.receipt,
		crmSync: {
			status: 'pending',
			receipt: null,
			recordId: null,
		},
		tasks: preview.tasks.map((task, index) => ({
			...task,
			id: `${planId}_task_${index + 1}`,
			version: 1,
			status: 'not-started',
			completedAt: null,
			completionReceipt: null,
		})),
		createdBy: currentOperator.name,
		createdAt: 'Just now',
		lastHealthRefreshReceipt: null,
	};
	if (account.risk) account.risk.status = 'mitigating';
	account.version += 1;
	account.activity.unshift(createActivity({
		type: 'Plan',
		title: 'Renewal recovery plan launched',
		detail: `${account.plan.templateLabel} started with ${account.plan.tasks.length} owned tasks due by ${account.plan.dueDate}.`,
		actor: currentOperator.name,
		source: 'Customer success',
		receipt: account.plan.receipt,
	}));
	customerHealthState.preview = null;
	commitState(currentOperator.name, 'Success plan launched', `${account.plan.name} is active.`);
	return serializeWorkspace();
}

/**
 * Completes one plan task with workspace, account, plan, and task version checks.
 *
 * @param {string} planId Success plan identifier.
 * @param {string} taskId Plan task identifier.
 * @param {object} input Exact versions and completion note.
 * @returns {object} Updated workspace or API error.
 */
export function updateCustomerSuccessPlanTask(planId, taskId, input = {}) {
	const revisionResult = requireRevision(input.revision);
	if (revisionResult) return revisionResult;
	const account = findAccount(input.accountId);
	if (!account) return error('The customer account no longer exists.', 404);
	if (Number(input.accountVersion) !== account.version) return error(`Account evidence changed from version ${input.accountVersion} to ${account.version}. Refresh before updating this task.`, 409);
	if (!account.plan || account.plan.id !== planId) return error('The success plan no longer exists.', 404);
	if (Number(input.planVersion) !== account.plan.version) return error(`The success plan changed from version ${input.planVersion} to ${account.plan.version}.`, 409);
	const task = account.plan.tasks.find((candidate) => candidate.id === taskId);
	if (!task) return error('The success-plan task no longer exists.', 404);
	if (Number(input.taskVersion) !== task.version) return error(`The task changed from version ${input.taskVersion} to ${task.version}.`, 409);
	const note = String(input.note || '').trim();
	if (note.length < 10) return error('Add a short completion note for the customer record.', 422);
	if (task.status === 'completed') return error('This task is already complete.', 409);
	task.status = 'completed';
	task.version += 1;
	task.completedAt = 'Just now';
	task.completionReceipt = nextId('success_task_receipt');
	account.plan.version += 1;
	account.plan.progress = calculatePlanProgress(account.plan);
	account.version += 1;
	account.activity.unshift(createActivity({
		type: 'Task',
		title: task.label,
		detail: note,
		actor: currentOperator.name,
		source: 'Success plan',
		receipt: task.completionReceipt,
	}));
	commitState(currentOperator.name, 'Success plan task completed', `${task.label} completed for ${account.name}.`);
	return serializeWorkspace();
}

/**
 * Synchronizes an active success plan to the connected CRM.
 *
 * @param {string} planId Success plan identifier.
 * @param {object} input Exact workspace and account versions.
 * @returns {object} Updated workspace or API error.
 */
export function syncCustomerSuccessPlan(planId, input = {}) {
	const revisionResult = requireRevision(input.revision);
	if (revisionResult) return revisionResult;
	const account = findAccount(input.accountId);
	if (!account) return error('The customer account no longer exists.', 404);
	if (Number(input.accountVersion) !== account.version) return error(`Account evidence changed from version ${input.accountVersion} to ${account.version}. Refresh before syncing.`, 409);
	if (!account.plan || account.plan.id !== planId) return error('The success plan no longer exists.', 404);
	if (account.plan.crmSync.status === 'synced') return error('This success plan is already synchronized.', 409);
	account.plan.crmSync = {
		status: 'synced',
		receipt: nextId('crm_sync_receipt'),
		recordId: `crm_plan_${account.id.replace('acct_', '')}`,
	};
	account.plan.version += 1;
	account.version += 1;
	account.activity.unshift(createActivity({
		type: 'CRM',
		title: 'Success plan synchronized',
		detail: `${account.plan.name} is linked to ${account.plan.crmSync.recordId}.`,
		actor: 'CRM connector',
		source: 'CRM',
		receipt: account.plan.crmSync.receipt,
	}));
	commitState('CRM connector', 'Success plan synchronized', `${account.name} plan sent to CRM.`);
	return serializeWorkspace();
}

/**
 * Adds a durable account activity with revision protection and validation.
 *
 * @param {object} input Account, activity type, title, and details.
 * @returns {object} Updated workspace or API error.
 */
export function logCustomerHealthActivity(input = {}) {
	const revisionResult = requireRevision(input.revision);
	if (revisionResult) return revisionResult;
	const account = findAccount(input.accountId);
	if (!account) return error('The customer account no longer exists.', 404);
	if (Number(input.accountVersion) !== account.version) return error(`Account evidence changed from version ${input.accountVersion} to ${account.version}. Refresh before logging activity.`, 409);
	const activityType = activityTypeCatalog.find((candidate) => candidate.value === input.type);
	if (!activityType) return error('Choose a valid activity type.', 422);
	const title = String(input.title || '').trim();
	if (title.length < 8) return error('Give the account activity a clear title.', 422);
	const detail = String(input.detail || '').trim();
	if (detail.length < 20) return error('Add enough detail for the account team to understand the update.', 422);
	const receipt = nextId('timeline_receipt');
	account.activity.unshift(createActivity({
		type: activityType.label,
		title,
		detail,
		actor: currentOperator.name,
		source: 'Customer success',
		receipt,
	}));
	account.version += 1;
	commitState(currentOperator.name, 'Timeline activity logged', `${title} added to ${account.name}.`);
	return serializeWorkspace();
}

/**
 * Recalculates health from deterministic source improvements after plan execution.
 *
 * @param {object} input Exact workspace and account versions.
 * @returns {object} Updated workspace or API error.
 */
export function refreshCustomerHealthScore(input = {}) {
	const revisionResult = requireRevision(input.revision);
	if (revisionResult) return revisionResult;
	const account = findAccount(input.accountId);
	if (!account) return error('The customer account no longer exists.', 404);
	if (Number(input.accountVersion) !== account.version) return error(`Account evidence changed from version ${input.accountVersion} to ${account.version}. Refresh before recalculating health.`, 409);
	if (!account.plan || account.plan.status !== 'active') return error('Launch a recovery plan before requesting an intervention health refresh.', 409);
	if (!account.plan.tasks.some((task) => task.status === 'completed')) return error('Complete at least one recovery task before refreshing health.', 409);
	if (account.lastHealthRefreshReceipt) return error('Health was already refreshed for this intervention checkpoint.', 409);
	const priorScore = account.healthScore;
	account.measures = account.measures.map((measure) => {
		const increments = { adoption: 5, support: 8, relationship: 4, commercial: 0 };
		const score = Math.min(100, measure.score + (increments[measure.id] || 0));
		return {
			...measure,
			score,
			trend: score - measure.score,
			status: score >= 80 ? 'healthy' : score >= 60 ? 'monitoring' : score >= 50 ? 'at-risk' : 'critical',
			freshness: 'Just now',
		};
	});
	account.previousScore = priorScore;
	account.healthScore = calculateHealthScore(account.measures);
	account.status = account.healthScore >= 80 ? 'healthy' : account.healthScore >= 60 ? 'monitoring' : account.healthScore >= 50 ? 'at-risk' : 'critical';
	account.scoreHistory = [...account.scoreHistory.slice(-5), { label: 'Now', score: account.healthScore }];
	account.lastHealthRefreshReceipt = nextId('health_refresh_receipt');
	account.plan.lastHealthRefreshReceipt = account.lastHealthRefreshReceipt;
	if (account.risk) account.risk.status = account.healthScore >= 60 ? 'monitoring' : 'mitigating';
	account.version += 1;
	account.activity.unshift(createActivity({
		type: 'Health',
		title: `Health recalculated from ${priorScore} to ${account.healthScore}`,
		detail: 'Product, support, CRM, and commercial measures were recalculated from current source snapshots.',
		actor: 'Health engine',
		source: 'Automatic',
		receipt: account.lastHealthRefreshReceipt,
	}));
	commitState('Health engine', 'Health score refreshed', `${account.name} moved from ${priorScore} to ${account.healthScore}.`);
	return serializeWorkspace();
}

/**
 * Creates a fresh deterministic state object.
 *
 * @returns {object} Initial workspace state.
 */
function createState() {
	return {
		revision: 21,
		selectedAccountId: 'acct_zephyr',
		accounts: clone(accountSeeds),
		preview: null,
		activity: [
			{ id: 'workspace_event_7190', actor: 'Health engine', action: 'Portfolio recalculated', detail: 'Five accounts refreshed from product, support, CRM, and billing sources.', time: 'Today · 08:40' },
		],
		updatedAt: 'Today · 08:40',
	};
}

/**
 * Serializes the workspace and calculated portfolio summary.
 *
 * @returns {object} JSON-safe workspace response.
 */
function serializeWorkspace() {
	const selectedAccount = findAccount(customerHealthState.selectedAccountId) || customerHealthState.accounts[0];
	const needsAttention = customerHealthState.accounts.filter((account) => ['critical', 'at-risk'].includes(account.status));
	const renewingSoon = customerHealthState.accounts.filter((account) => account.daysToRenewal <= 90);
	return clone({
		revision: customerHealthState.revision,
		updatedAt: customerHealthState.updatedAt,
		currentOperator,
		selectedAccountId: selectedAccount.id,
		accounts: customerHealthState.accounts,
		selectedAccount,
		preview: customerHealthState.preview,
		activity: customerHealthState.activity,
		portfolio: {
			totalAccounts: customerHealthState.accounts.length,
			needsAttention: needsAttention.length,
			arrAtRisk: sum(needsAttention, (account) => account.arr),
			renewingSoon: renewingSoon.length,
			activePlans: customerHealthState.accounts.filter((account) => account.plan?.status === 'active').length,
		},
		catalog: {
			segments: segmentCatalog,
			owners: ownerCatalog,
			activities: activityTypeCatalog,
			playbooks: playbookCatalog.map(({ tasks, ...playbook }) => ({ ...playbook, taskCount: tasks.length })),
		},
	});
}

/**
 * Adds a durable workspace event and advances its exact revision.
 *
 * @param {string} actor Event actor.
 * @param {string} action Event label.
 * @param {string} detail Event detail.
 * @returns {void}
 */
function commitState(actor, action, detail) {
	customerHealthState.revision += 1;
	customerHealthState.updatedAt = 'Just now';
	customerHealthState.activity.unshift({
		id: nextId('workspace_event'),
		actor,
		action,
		detail,
		time: 'Just now',
	});
}

/**
 * Creates a customer timeline record.
 *
 * @param {object} input Activity fields.
 * @returns {object} Timeline activity.
 */
function createActivity(input) {
	return {
		id: nextId('customer_activity'),
		type: input.type,
		title: input.title,
		detail: input.detail,
		actor: input.actor,
		time: 'Just now',
		source: input.source,
		receipt: input.receipt,
	};
}

/**
 * Creates a server-owned readiness check.
 *
 * @param {string} id Check identifier.
 * @param {string} label Human-readable label.
 * @param {string} state Check state.
 * @param {string} detail Check evidence.
 * @returns {object} Preview check.
 */
function createCheck(id, label, state, detail) {
	return { id, label, state, detail };
}

/**
 * Calculates success-plan completion percentage.
 *
 * @param {object} plan Active success plan.
 * @returns {number} Rounded completion percentage.
 */
function calculatePlanProgress(plan) {
	if (!plan.tasks.length) return 0;
	return Math.round((plan.tasks.filter((task) => task.status === 'completed').length / plan.tasks.length) * 100);
}

/**
 * Calculates an account's weighted health score.
 *
 * @param {object[]} measures Weighted scorecard measures.
 * @returns {number} Rounded weighted score.
 */
function calculateHealthScore(measures) {
	return Math.round(sum(measures, (measure) => measure.score * (measure.weight / 100)));
}

/**
 * Requires a mutation to target the current workspace revision.
 *
 * @param {number|string} revision Client revision.
 * @returns {object|null} Conflict response or null.
 */
function requireRevision(revision) {
	const received = Number(revision);
	if (!Number.isFinite(received) || received !== customerHealthState.revision) {
		return error(`Workspace changed from revision ${revision} to ${customerHealthState.revision}. Refresh and try again.`, 409);
	}
	return null;
}

/**
 * Finds an account by identifier.
 *
 * @param {string} accountId Account identifier.
 * @returns {object|null} Matching account.
 */
function findAccount(accountId) {
	return customerHealthState.accounts.find((account) => account.id === accountId) || null;
}

/**
 * Finds a playbook template by identifier.
 *
 * @param {string} templateId Template identifier.
 * @returns {object|null} Matching template.
 */
function findPlaybook(templateId) {
	return playbookCatalog.find((playbook) => playbook.value === templateId) || null;
}

/**
 * Finds an owner option by identifier.
 *
 * @param {string} ownerId Owner identifier.
 * @returns {object|null} Matching owner option.
 */
function findOwner(ownerId) {
	return ownerCatalog.find((owner) => owner.value === ownerId) || null;
}

/**
 * Produces the next deterministic receipt identifier.
 *
 * @param {string} prefix Identifier prefix.
 * @returns {string} New identifier.
 */
function nextId(prefix) {
	sequence += 1;
	return `${prefix}_${sequence}`;
}

/**
 * Adds a relative number of days to an ISO date.
 *
 * @param {string} isoDate Base ISO date.
 * @param {number} amount Relative days.
 * @returns {string} Resulting ISO date.
 */
function addDays(isoDate, amount) {
	const date = new Date(`${isoDate}T12:00:00.000Z`);
	date.setUTCDate(date.getUTCDate() + Number(amount || 0));
	return date.toISOString().slice(0, 10);
}

/**
 * Sums numeric values selected from an array.
 *
 * @param {object[]} items Source items.
 * @param {(item: object) => number} accessor Numeric accessor.
 * @returns {number} Sum.
 */
function sum(items, accessor) {
	return items.reduce((total, item) => total + Number(accessor(item) || 0), 0);
}

/**
 * Creates a consistent API error response.
 *
 * @param {string} message User-facing error message.
 * @param {number} status HTTP status.
 * @returns {object} Error payload.
 */
function error(message, status) {
	return { error: message, status };
}

/**
 * Clones JSON-safe demo state.
 *
 * @param {unknown} value Source value.
 * @returns {any} Deep clone.
 */
function clone(value) {
	return JSON.parse(JSON.stringify(value));
}
