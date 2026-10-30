const CATEGORY_OPTIONS = [
	{ value: 'meals', label: 'Meals and entertainment', description: 'Client meals, team meals, and hosted events.' },
	{ value: 'travel', label: 'Travel', description: 'Rail, air, lodging, and ground transport.' },
	{ value: 'software', label: 'Software', description: 'Subscriptions, licences, and digital services.' },
	{ value: 'office', label: 'Office supplies', description: 'Workplace materials and equipment.' },
	{ value: 'client_gifts', label: 'Client gifts', description: 'Approved customer gifts and recognition.' },
];

const PROJECT_OPTIONS = [
	{ value: 'launch_workshop', label: 'Launch workshop', description: 'Customer launch planning and enablement.' },
	{ value: 'customer_success', label: 'Customer success', description: 'Retention, onboarding, and account programmes.' },
	{ value: 'recruiting', label: 'Recruiting', description: 'Candidate travel and hiring activity.' },
	{ value: 'unassigned', label: 'Unassigned', description: 'Requires coding before submission.' },
];

const PAYMENT_OPTIONS = [
	{ value: 'company_card_2048', label: 'Company card · 2048', description: 'Reconcile against the imported card transaction.' },
	{ value: 'personal_card', label: 'Personal card', description: 'Route approved spend to employee reimbursement.' },
	{ value: 'cash', label: 'Cash', description: 'Route approved spend to employee reimbursement.' },
];

let workspace = createInitialWorkspace();

/**
 * Returns the complete expense inbox, selected draft, and selector catalogues.
 *
 * @returns {Record<string, unknown>} Expense capture workspace payload.
 */
export function getExpenseCaptureWorkspace() {
	return serializeResponse('Expense inbox loaded.');
}

/**
 * Restores the deterministic expense inbox used by the block demo.
 *
 * @returns {Record<string, unknown>} Reset expense capture workspace.
 */
export function resetExpenseCaptureWorkspace() {
	workspace = createInitialWorkspace();
	return serializeResponse('Expense demo reset.');
}

/**
 * Selects one expense at an exact workspace revision.
 *
 * @param {Record<string, unknown>} input Selection and expected revision.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function selectExpenseCaptureItem(input = {}) {
	const revisionError = requireWorkspaceRevision(input.revision);
	if (revisionError) return revisionError;
	const expense = findExpense(input.expenseId);
	if (!expense) return notFound('Expense');
	workspace.selectedExpenseId = expense.id;
	workspace.revision += 1;
	return serializeResponse(`${expense.merchant} opened.`);
}

/**
 * Saves editable expense details and re-evaluates server-owned policy checks.
 *
 * @param {string} expenseId Stable expense identifier.
 * @param {Record<string, unknown>} input Expense fields and exact revisions.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function saveExpenseCaptureDetails(expenseId, input = {}) {
	const expense = findExpense(expenseId);
	if (!expense) return notFound('Expense');
	const revisionError = requireRevisions(expense, input);
	if (revisionError) return revisionError;
	const editableError = requireEditableExpense(expense);
	if (editableError) return editableError;
	const values = normalizeExpenseValues(input);
	const fields = validateExpenseValues(values);
	if (Object.keys(fields).length) return validation('Review the expense details.', fields);

	const matchChanged = expense.merchant !== values.merchant
		|| Number(expense.amount) !== Number(values.amount)
		|| expense.spentAt !== values.spentAt
		|| expense.paymentMethodId !== values.paymentMethodId;
	expense.merchant = values.merchant;
	expense.amount = values.amount;
	expense.spentAt = values.spentAt;
	expense.categoryId = values.categoryId;
	expense.projectId = values.projectId;
	expense.paymentMethodId = values.paymentMethodId;
	expense.reimbursable = values.paymentMethodId !== 'company_card_2048';
	expense.taxIncluded = values.taxIncluded;
	expense.memo = values.memo;
	if (matchChanged && expense.paymentMethodId === 'company_card_2048') {
		expense.transactionMatch.status = 'suggested';
		expense.transactionMatch.confirmedAt = null;
	}
	if (expense.paymentMethodId !== 'company_card_2048') {
		expense.transactionMatch.status = 'not_required';
		expense.transactionMatch.confirmedAt = null;
	}
	invalidateExpensePreview(expense);
	advanceExpense(expense);
	appendActivity(expense, 'Details saved', `${categoryLabel(expense.categoryId)} · ${projectLabel(expense.projectId)}`, 'info');
	return serializeResponse('Expense details saved.', { mutationReceipt: createMutationReceipt('expense_details_saved', expense) });
}

/**
 * Re-runs deterministic receipt extraction and records the resulting evidence.
 *
 * @param {string} expenseId Stable expense identifier.
 * @param {Record<string, unknown>} input Exact revisions and capture source.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function refreshExpenseReceipt(expenseId, input = {}) {
	const expense = findExpense(expenseId);
	if (!expense) return notFound('Expense');
	const revisionError = requireRevisions(expense, input);
	if (revisionError) return revisionError;
	const editableError = requireEditableExpense(expense);
	if (editableError) return editableError;
	const source = ['camera', 'upload', 'email'].includes(input.source) ? input.source : 'camera';
	expense.receipt = {
		...expense.receipt,
		id: `receipt-${workspace.sequence++}`,
		source,
		status: 'verified',
		confidence: 96,
		extractedAt: nowIso(),
		checksum: checksumFor(`${expense.id}:${expense.version}:${source}:${workspace.sequence}`),
		providerReceipt: `ocr-${workspace.sequence++}`,
	};
	invalidateExpensePreview(expense);
	advanceExpense(expense);
	appendActivity(expense, 'Receipt verified', `OCR completed at ${expense.receipt.confidence}% confidence.`, 'success');
	return serializeResponse('Receipt extraction completed.', { mutationReceipt: createMutationReceipt('receipt_verified', expense) });
}

/**
 * Confirms a suggested card transaction match at exact revisions.
 *
 * @param {string} expenseId Stable expense identifier.
 * @param {Record<string, unknown>} input Exact revisions.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function confirmExpenseTransactionMatch(expenseId, input = {}) {
	const expense = findExpense(expenseId);
	if (!expense) return notFound('Expense');
	const revisionError = requireRevisions(expense, input);
	if (revisionError) return revisionError;
	const editableError = requireEditableExpense(expense);
	if (editableError) return editableError;
	if (expense.paymentMethodId !== 'company_card_2048') {
		return validation('This payment method does not need a card match.', { paymentMethodId: ['Choose the company card to confirm this transaction.'] });
	}
	expense.transactionMatch.status = 'matched';
	expense.transactionMatch.confirmedAt = nowIso();
	expense.transactionMatch.confirmedBy = workspace.actor.name;
	invalidateExpensePreview(expense);
	advanceExpense(expense);
	appendActivity(expense, 'Card transaction matched', `${expense.transactionMatch.id} confirmed at ${expense.transactionMatch.score}% confidence.`, 'success');
	return serializeResponse('Card transaction matched.', { mutationReceipt: createMutationReceipt('card_match_confirmed', expense) });
}

/**
 * Creates an immutable submission preview from the current expense version.
 *
 * @param {string} expenseId Stable expense identifier.
 * @param {Record<string, unknown>} input Exact revisions.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function previewExpenseSubmission(expenseId, input = {}) {
	const expense = findExpense(expenseId);
	if (!expense) return notFound('Expense');
	const revisionError = requireRevisions(expense, input);
	if (revisionError) return revisionError;
	const editableError = requireEditableExpense(expense);
	if (editableError) return editableError;
	const checks = buildPolicyChecks(expense);
	const blockers = checks.filter((check) => check.status === 'blocked');
	if (blockers.length) {
		return validation('Resolve the blocked policy checks before previewing submission.', {
			policy: blockers.map((check) => check.detail),
		});
	}
	advanceExpense(expense);
	const snapshot = serializeExpenseSnapshot(expense);
	expense.preview = {
		id: `preview-${workspace.sequence++}`,
		expenseVersion: expense.version,
		checksum: checksumFor(JSON.stringify(snapshot)),
		createdAt: nowIso(),
		createdBy: workspace.actor.name,
		route: expense.reimbursable ? 'Manager approval → UK payroll reimbursement' : 'Manager review → card reconciliation → NetSuite',
		approver: 'Maya Chen · Finance operations',
		payout: expense.reimbursable ? `${formatMoney(expense.amount, expense.currency)} to Steve O'Brien` : 'No employee cash movement',
		accounting: `${categoryLabel(expense.categoryId)} · ${projectLabel(expense.projectId)}`,
		checks,
		snapshot,
	};
	appendActivity(expense, 'Submission preview created', `${expense.preview.checksum} locked expense version ${expense.version}.`, 'info');
	return serializeResponse('Submission preview created.', { preview: structuredClone(expense.preview) });
}

/**
 * Submits the exact previewed expense after explicit acknowledgement.
 *
 * @param {string} expenseId Stable expense identifier.
 * @param {Record<string, unknown>} input Exact revisions, checksum, and acknowledgement.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function submitCapturedExpense(expenseId, input = {}) {
	const expense = findExpense(expenseId);
	if (!expense) return notFound('Expense');
	const revisionError = requireRevisions(expense, input);
	if (revisionError) return revisionError;
	const editableError = requireEditableExpense(expense);
	if (editableError) return editableError;
	if (!expense.preview) return validation('Preview the exact expense before submission.', { preview: ['Create a submission preview first.'] });
	if (String(input.previewChecksum || '') !== expense.preview.checksum || expense.preview.expenseVersion !== expense.version) {
		return conflict('The submission preview is stale. Preview the current expense again.');
	}
	if (input.acknowledged !== true) {
		return validation('Acknowledge the reimbursement and accounting route.', { acknowledged: ['Confirm the exact route before submission.'] });
	}
	const submissionId = `expense-submission-${workspace.sequence++}`;
	expense.status = 'submitted';
	expense.submission = {
		id: submissionId,
		status: 'awaiting_approval',
		previewChecksum: expense.preview.checksum,
		submittedAt: nowIso(),
		submittedBy: workspace.actor.name,
		approver: expense.preview.approver,
		route: expense.preview.route,
		providerReceipt: `workflow-${workspace.sequence++}`,
		decisionReceipt: null,
		settlementReceipt: null,
	};
	advanceExpense(expense);
	appendActivity(expense, 'Expense submitted', `${submissionId} is awaiting Maya Chen.`, 'warning');
	return serializeResponse('Expense submitted for approval.', { submission: structuredClone(expense.submission), mutationReceipt: createMutationReceipt('expense_submitted', expense) });
}

/**
 * Advances the deterministic approval and settlement lifecycle by one step.
 *
 * @param {string} expenseId Stable expense identifier.
 * @param {Record<string, unknown>} input Exact revisions.
 * @returns {Record<string, unknown>} Updated workspace or structured error.
 */
export function advanceCapturedExpense(expenseId, input = {}) {
	const expense = findExpense(expenseId);
	if (!expense) return notFound('Expense');
	const revisionError = requireRevisions(expense, input);
	if (revisionError) return revisionError;
	if (!expense.submission) return validation('Submit the expense before advancing it.', { submission: ['No submission exists.'] });
	if (expense.submission.status === 'awaiting_approval') {
		expense.status = 'approved';
		expense.submission.status = 'approved';
		expense.submission.approvedAt = nowIso();
		expense.submission.decisionReceipt = `approval-${workspace.sequence++}`;
		advanceExpense(expense);
		appendActivity(expense, 'Expense approved', 'Maya Chen approved the exact submitted version.', 'success');
		return serializeResponse('Expense approved.', { mutationReceipt: createMutationReceipt('expense_approved', expense) });
	}
	if (expense.submission.status === 'approved') {
		expense.status = expense.reimbursable ? 'reimbursed' : 'exported';
		expense.submission.status = expense.reimbursable ? 'reimbursed' : 'exported';
		expense.submission.settledAt = nowIso();
		expense.submission.settlementReceipt = expense.reimbursable ? `payout-${workspace.sequence++}` : `netsuite-${workspace.sequence++}`;
		advanceExpense(expense);
		appendActivity(expense, expense.reimbursable ? 'Reimbursement scheduled' : 'Expense exported', expense.reimbursable ? 'UK payroll accepted the approved reimbursement.' : 'NetSuite accepted the card reconciliation entry.', 'success');
		return serializeResponse(expense.reimbursable ? 'Reimbursement scheduled.' : 'Expense exported to NetSuite.', { mutationReceipt: createMutationReceipt('expense_settled', expense) });
	}
	return validation('This expense has completed its workflow.', { submission: ['No further demo step is available.'] });
}

/**
 * Creates the deterministic expense inbox used on first load and reset.
 *
 * @returns {Record<string, unknown>} Initial mutable workspace state.
 */
function createInitialWorkspace() {
	return {
		id: 'expense-workspace-1',
		name: 'Northstar finance',
		revision: 52,
		sequence: 9100,
		selectedExpenseId: 'exp_2048',
		actor: { id: 'user-steve', name: "Steve O'Brien", role: 'Submitter' },
		expenses: [
			createNorthstarExpense(),
			{
				id: 'exp_2051',
				version: 4,
				status: 'needs_receipt',
				merchant: 'Eastline Rail',
				amount: 118.40,
				currency: 'GBP',
				spentAt: '2026-07-31',
				categoryId: 'travel',
				projectId: 'customer_success',
				paymentMethodId: 'company_card_2048',
				reimbursable: false,
				taxIncluded: false,
				memo: 'Return rail travel for the Atlas renewal workshop.',
				receipt: null,
				transactionMatch: { id: 'card-txn-8802', status: 'matched', score: 99, cardLast4: '2048', merchant: 'Eastline Rail', amount: 118.40, spentAt: '2026-07-31', confirmedAt: '2026-08-01T13:20:00.000Z', confirmedBy: 'Receipt matcher' },
				preview: null,
				submission: null,
				activity: [createInitialActivity('Card transaction imported', 'Awaiting receipt evidence.', 'warning', '2026-08-01T13:18:00.000Z')],
			},
			{
				id: 'exp_2054',
				version: 9,
				status: 'approved',
				merchant: 'Fontworks',
				amount: 24.00,
				currency: 'GBP',
				spentAt: '2026-07-29',
				categoryId: 'software',
				projectId: 'launch_workshop',
				paymentMethodId: 'personal_card',
				reimbursable: true,
				taxIncluded: true,
				memo: 'Font licence used for launch workshop presentation assets.',
				receipt: { id: 'receipt-2054', status: 'verified', confidence: 98, source: 'email', url: '', filename: 'fontworks-receipt.pdf', mimeType: 'application/pdf', extractedAt: '2026-07-29T11:18:00.000Z', checksum: 'sha256:demo-0012054a', providerReceipt: 'ocr-2054' },
				transactionMatch: { id: '', status: 'not_required', score: 0, cardLast4: '', merchant: '', amount: 0, spentAt: '', confirmedAt: null, confirmedBy: '' },
				preview: null,
				submission: { id: 'expense-submission-2054', status: 'approved', previewChecksum: 'sha256:demo-2054', submittedAt: '2026-07-29T11:25:00.000Z', submittedBy: "Steve O'Brien", approver: 'Maya Chen · Finance operations', route: 'Manager approval → UK payroll reimbursement', providerReceipt: 'workflow-2054', decisionReceipt: 'approval-2054', settlementReceipt: null },
				activity: [createInitialActivity('Expense approved', 'Maya Chen approved the reimbursement.', 'success', '2026-07-29T12:05:00.000Z')],
			},
		],
	};
}

/**
 * Creates the primary expense and its real receipt evidence.
 *
 * @returns {Record<string, unknown>} Primary expense state.
 */
function createNorthstarExpense() {
	return {
		id: 'exp_2048',
		version: 7,
		status: 'draft',
		merchant: 'Northstar Coffee',
		amount: 42.80,
		currency: 'GBP',
		spentAt: '2026-06-10',
		categoryId: 'meals',
		projectId: 'launch_workshop',
		paymentMethodId: 'company_card_2048',
		reimbursable: false,
		taxIncluded: true,
		memo: 'Client workshop breakfast before launch planning.',
		receipt: {
			id: 'receipt-2048',
			status: 'verified',
			confidence: 96,
			source: 'camera',
			url: '/assets/blocks/expense-capture/receipt-northstar-coffee.png',
			filename: 'northstar-coffee-10-jun-2026.png',
			mimeType: 'image/png',
			extractedAt: '2026-08-02T09:42:00.000Z',
			checksum: 'sha256:demo-a8062048',
			providerReceipt: 'ocr-2048',
		},
		transactionMatch: {
			id: 'card-txn-2048',
			status: 'suggested',
			score: 98,
			cardLast4: '2048',
			merchant: 'Northstar Coffee',
			amount: 42.80,
			spentAt: '2026-06-10',
			confirmedAt: null,
			confirmedBy: '',
		},
		preview: null,
		submission: null,
		activity: [
			createInitialActivity('Receipt verified', 'OCR extracted merchant, date, amount, tax, and card suffix.', 'success', '2026-08-02T09:42:00.000Z'),
			createInitialActivity('Card match suggested', 'Merchant, amount, and purchase date matched card-txn-2048.', 'info', '2026-08-02T09:43:00.000Z'),
			createInitialActivity('Policy evaluated', 'One contextual meal-policy warning remains.', 'warning', '2026-08-02T09:44:00.000Z'),
		],
	};
}

/**
 * Creates one immutable initial activity item.
 *
 * @param {string} title Activity title.
 * @param {string} detail Activity detail.
 * @param {string} tone Semantic tone.
 * @param {string} createdAt ISO timestamp.
 * @returns {Record<string, unknown>} Activity record.
 */
function createInitialActivity(title, detail, tone, createdAt) {
	return { id: `activity-initial-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, title, detail, tone, actor: 'Expense service', createdAt };
}

/**
 * Serializes the authoritative workspace plus optional mutation evidence.
 *
 * @param {string} message Human response message.
 * @param {Record<string, unknown>} extra Optional response fields.
 * @returns {Record<string, unknown>} Public API response.
 */
function serializeResponse(message, extra = {}) {
	const selectedExpense = findExpense(workspace.selectedExpenseId) || workspace.expenses[0];
	return {
		ok: true,
		message,
		workspace: {
			id: workspace.id,
			name: workspace.name,
			revision: workspace.revision,
			selectedExpenseId: selectedExpense.id,
			actor: structuredClone(workspace.actor),
			counts: {
				needsAction: workspace.expenses.filter((expense) => ['draft', 'needs_receipt'].includes(expense.status)).length,
				inReview: workspace.expenses.filter((expense) => ['submitted', 'approved'].includes(expense.status)).length,
				complete: workspace.expenses.filter((expense) => ['exported', 'reimbursed'].includes(expense.status)).length,
			},
		},
		expenses: workspace.expenses.map(serializeExpenseSummary),
		selectedExpense: serializeExpense(selectedExpense),
		catalogs: {
			categories: structuredClone(CATEGORY_OPTIONS),
			projects: structuredClone(PROJECT_OPTIONS),
			paymentMethods: structuredClone(PAYMENT_OPTIONS),
		},
		...extra,
	};
}

/**
 * Serializes one expense queue row.
 *
 * @param {Record<string, unknown>} expense Expense record.
 * @returns {Record<string, unknown>} Expense summary.
 */
function serializeExpenseSummary(expense) {
	const checks = buildPolicyChecks(expense);
	return {
		id: expense.id,
		version: expense.version,
		merchant: expense.merchant,
		amount: expense.amount,
		currency: expense.currency,
		spentAt: expense.spentAt,
		status: expense.status,
		statusMeta: statusMeta(expense.status),
		receiptStatus: expense.receipt?.status || 'missing',
		blockers: checks.filter((check) => check.status === 'blocked').length,
		warnings: checks.filter((check) => check.status === 'warning').length,
	};
}

/**
 * Serializes one expense with evidence, checks, and available capabilities.
 *
 * @param {Record<string, unknown>} expense Expense record.
 * @returns {Record<string, unknown>} Detailed expense payload.
 */
function serializeExpense(expense) {
	const checks = buildPolicyChecks(expense);
	return {
		...serializeExpenseSnapshot(expense),
		statusMeta: statusMeta(expense.status),
		receipt: expense.receipt ? structuredClone(expense.receipt) : null,
		transactionMatch: structuredClone(expense.transactionMatch),
		policyChecks: checks,
		blockers: checks.filter((check) => check.status === 'blocked').length,
		warnings: checks.filter((check) => check.status === 'warning').length,
		preview: expense.preview ? structuredClone(expense.preview) : null,
		submission: expense.submission ? structuredClone(expense.submission) : null,
		activity: structuredClone(expense.activity),
		capabilities: {
			canEdit: ['draft', 'needs_receipt'].includes(expense.status),
			canConfirmMatch: ['draft', 'needs_receipt'].includes(expense.status) && expense.transactionMatch.status === 'suggested',
			canPreview: ['draft', 'needs_receipt'].includes(expense.status),
			canSubmit: ['draft', 'needs_receipt'].includes(expense.status) && Boolean(expense.preview),
			canAdvance: ['submitted', 'approved'].includes(expense.status),
		},
	};
}

/**
 * Serializes the mutable expense fields included in preview evidence.
 *
 * @param {Record<string, unknown>} expense Expense record.
 * @returns {Record<string, unknown>} Expense snapshot.
 */
function serializeExpenseSnapshot(expense) {
	return {
		id: expense.id,
		version: expense.version,
		status: expense.status,
		merchant: expense.merchant,
		amount: expense.amount,
		currency: expense.currency,
		spentAt: expense.spentAt,
		categoryId: expense.categoryId,
		categoryLabel: categoryLabel(expense.categoryId),
		projectId: expense.projectId,
		projectLabel: projectLabel(expense.projectId),
		paymentMethodId: expense.paymentMethodId,
		paymentMethodLabel: paymentLabel(expense.paymentMethodId),
		reimbursable: expense.reimbursable,
		taxIncluded: expense.taxIncluded,
		memo: expense.memo,
	};
}

/**
 * Evaluates the current expense against server-owned policy rules.
 *
 * @param {Record<string, unknown>} expense Expense record.
 * @returns {Array<Record<string, unknown>>} Structured policy checks.
 */
function buildPolicyChecks(expense) {
	const companyCard = expense.paymentMethodId === 'company_card_2048';
	const mealWarning = expense.categoryId === 'meals' && Number(expense.amount) > 35;
	return [
		{
			key: 'receipt',
			label: 'Receipt evidence',
			status: expense.receipt?.status === 'verified' ? 'passed' : 'blocked',
			detail: expense.receipt?.status === 'verified' ? `${expense.receipt.confidence}% OCR confidence · ${expense.receipt.providerReceipt}` : 'Attach a verified receipt before submission.',
		},
		{
			key: 'transaction_match',
			label: 'Payment evidence',
			status: !companyCard || expense.transactionMatch.status === 'matched' ? 'passed' : 'blocked',
			detail: !companyCard ? 'Employee-funded expense will follow reimbursement policy.' : expense.transactionMatch.status === 'matched' ? `${expense.transactionMatch.id} confirmed at ${expense.transactionMatch.score}% confidence.` : `Confirm suggested match ${expense.transactionMatch.id}.`,
		},
		{
			key: 'coding',
			label: 'Accounting code',
			status: expense.projectId && expense.projectId !== 'unassigned' ? 'passed' : 'blocked',
			detail: expense.projectId && expense.projectId !== 'unassigned' ? `${categoryLabel(expense.categoryId)} · ${projectLabel(expense.projectId)}` : 'Choose a project before submission.',
		},
		{
			key: 'memo',
			label: 'Business purpose',
			status: String(expense.memo || '').trim().length >= 20 ? 'passed' : 'blocked',
			detail: String(expense.memo || '').trim().length >= 20 ? 'Memo gives finance enough review context.' : 'Add at least 20 characters of business context.',
		},
		{
			key: 'meal_limit',
			label: 'Meal guidance',
			status: mealWarning ? 'warning' : 'passed',
			detail: mealWarning ? '£7.80 over the £35 meal guidance; contextual memo allows manager review.' : 'Amount is within category guidance.',
		},
	];
}

/**
 * Normalizes form values before validation and persistence.
 *
 * @param {Record<string, unknown>} input Request body.
 * @returns {Record<string, unknown>} Normalized expense fields.
 */
function normalizeExpenseValues(input) {
	return {
		merchant: String(input.merchant || '').trim(),
		amount: Number(input.amount),
		spentAt: String(input.spentAt || ''),
		categoryId: String(input.categoryId || ''),
		projectId: String(input.projectId || ''),
		paymentMethodId: String(input.paymentMethodId || ''),
		taxIncluded: input.taxIncluded === true,
		memo: String(input.memo || '').trim(),
	};
}

/**
 * Validates normalized expense fields.
 *
 * @param {Record<string, unknown>} values Normalized expense values.
 * @returns {Record<string, string[]>} Field errors.
 */
function validateExpenseValues(values) {
	const fields = {};
	if (values.merchant.length < 2) fields.merchant = ['Enter a recognizable merchant.'];
	if (!Number.isFinite(values.amount) || values.amount <= 0 || values.amount > 25000) fields.amount = ['Enter an amount between 0.01 and 25,000.'];
	if (!/^\d{4}-\d{2}-\d{2}$/.test(values.spentAt)) fields.spentAt = ['Choose a valid purchase date.'];
	if (!CATEGORY_OPTIONS.some((option) => option.value === values.categoryId)) fields.categoryId = ['Choose an expense category.'];
	if (!PROJECT_OPTIONS.some((option) => option.value === values.projectId)) fields.projectId = ['Choose a project.'];
	if (!PAYMENT_OPTIONS.some((option) => option.value === values.paymentMethodId)) fields.paymentMethodId = ['Choose a payment method.'];
	if (values.memo.length > 500) fields.memo = ['Keep the business purpose to 500 characters or fewer.'];
	return fields;
}

/**
 * Requires matching workspace and expense revisions for one mutation.
 *
 * @param {Record<string, unknown>} expense Expense record.
 * @param {Record<string, unknown>} input Request body.
 * @returns {Record<string, unknown> | null} Conflict response or null.
 */
function requireRevisions(expense, input) {
	return requireWorkspaceRevision(input.revision) || requireExpenseVersion(expense, input.expenseVersion);
}

/**
 * Validates the expected workspace revision.
 *
 * @param {unknown} revision Expected revision.
 * @returns {Record<string, unknown> | null} Conflict response or null.
 */
function requireWorkspaceRevision(revision) {
	if (Number(revision) !== workspace.revision) return conflict(`Workspace changed from revision ${revision} to ${workspace.revision}.`);
	return null;
}

/**
 * Validates the expected expense version.
 *
 * @param {Record<string, unknown>} expense Expense record.
 * @param {unknown} version Expected expense version.
 * @returns {Record<string, unknown> | null} Conflict response or null.
 */
function requireExpenseVersion(expense, version) {
	if (Number(version) !== expense.version) return conflict(`${expense.merchant} changed from version ${version} to ${expense.version}.`);
	return null;
}

/**
 * Rejects mutations once an expense is submitted.
 *
 * @param {Record<string, unknown>} expense Expense record.
 * @returns {Record<string, unknown> | null} Validation response or null.
 */
function requireEditableExpense(expense) {
	if (!['draft', 'needs_receipt'].includes(expense.status)) return validation('This expense is no longer editable.', { status: [`Current status is ${statusMeta(expense.status).label}.`] });
	return null;
}

/**
 * Clears preview evidence after any mutable field changes.
 *
 * @param {Record<string, unknown>} expense Expense record.
 * @returns {void}
 */
function invalidateExpensePreview(expense) {
	expense.preview = null;
}

/**
 * Advances expense and workspace revisions together.
 *
 * @param {Record<string, unknown>} expense Expense record.
 * @returns {void}
 */
function advanceExpense(expense) {
	expense.version += 1;
	workspace.revision += 1;
}

/**
 * Appends a chronological activity record.
 *
 * @param {Record<string, unknown>} expense Expense record.
 * @param {string} title Activity title.
 * @param {string} detail Activity detail.
 * @param {string} tone Semantic tone.
 * @returns {void}
 */
function appendActivity(expense, title, detail, tone) {
	expense.activity.unshift({ id: `activity-${workspace.sequence++}`, title, detail, tone, actor: workspace.actor.name, createdAt: nowIso() });
}

/**
 * Creates an immutable mutation receipt for audit evidence.
 *
 * @param {string} type Receipt type.
 * @param {Record<string, unknown>} expense Expense record.
 * @returns {Record<string, unknown>} Mutation receipt.
 */
function createMutationReceipt(type, expense) {
	return {
		id: `audit-${workspace.sequence++}`,
		type,
		workspaceRevision: workspace.revision,
		expenseId: expense.id,
		expenseVersion: expense.version,
		createdAt: nowIso(),
		createdBy: workspace.actor.name,
		checksum: checksumFor(`${type}:${workspace.revision}:${expense.id}:${expense.version}`),
	};
}

/**
 * Finds one expense by stable identifier.
 *
 * @param {unknown} expenseId Expense identifier.
 * @returns {Record<string, unknown> | null} Matching expense or null.
 */
function findExpense(expenseId) {
	return workspace.expenses.find((expense) => expense.id === expenseId) || null;
}

/**
 * Resolves status display metadata.
 *
 * @param {string} status Expense status.
 * @returns {{label: string, tone: string}} Status display metadata.
 */
function statusMeta(status) {
	return {
		draft: { label: 'Needs details', tone: 'warning' },
		needs_receipt: { label: 'Needs receipt', tone: 'danger' },
		submitted: { label: 'Awaiting approval', tone: 'info' },
		approved: { label: 'Approved', tone: 'success' },
		reimbursed: { label: 'Reimbursed', tone: 'success' },
		exported: { label: 'Exported', tone: 'success' },
	}[status] || { label: status, tone: 'neutral' };
}

/**
 * Resolves a category label.
 *
 * @param {string} value Category value.
 * @returns {string} Category label.
 */
function categoryLabel(value) {
	return labelFor(CATEGORY_OPTIONS, value);
}

/**
 * Resolves a project label.
 *
 * @param {string} value Project value.
 * @returns {string} Project label.
 */
function projectLabel(value) {
	return labelFor(PROJECT_OPTIONS, value);
}

/**
 * Resolves a payment method label.
 *
 * @param {string} value Payment method value.
 * @returns {string} Payment method label.
 */
function paymentLabel(value) {
	return labelFor(PAYMENT_OPTIONS, value);
}

/**
 * Resolves an option label from a catalogue.
 *
 * @param {Array<{value: string, label: string}>} options Option catalogue.
 * @param {string} value Selected value.
 * @returns {string} Resolved label.
 */
function labelFor(options, value) {
	return options.find((option) => option.value === value)?.label || value;
}

/**
 * Formats one amount for evidence copy.
 *
 * @param {number} amount Numeric amount.
 * @param {string} currency ISO currency.
 * @returns {string} Localized amount.
 */
function formatMoney(amount, currency) {
	return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(Number(amount || 0));
}

/**
 * Creates a deterministic demo checksum.
 *
 * @param {string} value Input value.
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

/**
 * Returns the current time for demo mutation evidence.
 *
 * @returns {string} ISO timestamp.
 */
function nowIso() {
	return new Date().toISOString();
}

/**
 * Creates a structured validation response.
 *
 * @param {string} message Human message.
 * @param {Record<string, string[]>} fields Field errors.
 * @returns {Record<string, unknown>} Validation response.
 */
function validation(message, fields = {}) {
	return { error: 'validation_error', status: 422, message, fields };
}

/**
 * Creates a revision conflict response.
 *
 * @param {string} message Human message.
 * @returns {Record<string, unknown>} Conflict response.
 */
function conflict(message) {
	return { error: 'revision_conflict', status: 409, message };
}

/**
 * Creates a not-found response.
 *
 * @param {string} label Missing record label.
 * @returns {Record<string, unknown>} Not-found response.
 */
function notFound(label) {
	return { error: 'not_found', status: 404, message: `${label} not found.` };
}
