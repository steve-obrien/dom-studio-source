const branchOptions = Object.freeze([
	{ value: 'feature/mission-control', label: 'feature/mission-control', description: '3 changed files · ahead by 2 commits' },
	{ value: 'main', label: 'main', description: 'Protected release branch · clean' },
	{ value: 'fix/mobile-navigation', label: 'fix/mobile-navigation', description: '1 changed file · ahead by 1 commit' },
]);

const modelOptions = Object.freeze([
	{ value: 'composer-2-5', label: 'Composer 2.5', description: 'Balanced repository edits with tool use.', context: '200k context' },
	{ value: 'gpt-5-5-extra', label: 'GPT-5.5 Extra High', description: 'Deep planning for risky multi-file changes.', context: '256k context' },
	{ value: 'opus-4-8', label: 'Opus 4.8', description: 'Long-horizon code review and explanation.', context: '200k context' },
	{ value: 'auto', label: 'Auto', description: 'Route by task complexity and risk.', context: 'Adaptive context' },
]);

const modeOptions = Object.freeze([
	{ value: 'ask', label: 'Ask', description: 'Explain code without proposing edits.' },
	{ value: 'edit', label: 'Edit', description: 'Prepare a focused patch for selected files.' },
	{ value: 'agent', label: 'Agent', description: 'Plan, edit, and verify a multi-file change.' },
]);

let state = createInitialState();

/**
 * Returns the complete seeded developer workspace.
 *
 * @returns {Record<string, unknown>} Workspace bootstrap payload.
 */
export function getCursorWorkspaceBootstrap() {
	return cloneValue({
		workspace: serializeWorkspace(),
		settings: state.settings,
		options: {
			branches: branchOptions,
			models: modelOptions,
			modes: modeOptions,
			contextFiles: serializeFiles().map((file) => ({ value: file.id, label: file.name, description: file.path, group: file.path.split('/').slice(0, -1).join('/') || 'Root' })),
		},
		fileTree: state.fileTree,
		files: serializeFiles(),
		defaultFileId: 'dashboard-page',
		file: serializeFile(state.files.get('dashboard-page')),
		proposal: serializeProposal(state.proposals.get(state.activeProposalId)),
		testRuns: state.testRuns,
		activity: state.activity,
	});
}

/**
 * Returns one repository file with editable content.
 *
 * @param {string} fileId File identifier.
 * @returns {Record<string, unknown>} File result or API error.
 */
export function getCursorWorkspaceFile(fileId) {
	const file = state.files.get(String(fileId || ''));
	if (!file) return notFound('Repository file');
	return success('', { file: serializeFile(file), files: serializeFiles(), workspace: serializeWorkspace() });
}

/**
 * Saves one file with optimistic revision protection.
 *
 * @param {string} fileId File identifier.
 * @param {Record<string, unknown>} input Candidate content and revision.
 * @returns {Record<string, unknown>} Saved file or structured API error.
 */
export function saveCursorWorkspaceFile(fileId, input = {}) {
	const file = state.files.get(String(fileId || ''));
	if (!file) return notFound('Repository file');
	if (Number(input.revision) !== file.revision) {
		return conflict('This file changed in another session. Reload the server copy before saving.', {
			code: 'file_revision_conflict',
			file: serializeFile(file),
			files: serializeFiles(),
			workspace: serializeWorkspace(),
		});
	}
	const content = String(input.content ?? '');
	const fields = [];
	if (content.trim().length < 12) fields.push({ field: 'content', message: 'Keep at least 12 characters of meaningful file content.' });
	if (content.length > 24000) fields.push({ field: 'content', message: 'This demo editor accepts files up to 24,000 characters.' });
	if (fields.length) return validation('The file could not be saved.', fields);
	if (content === file.content) return success('The server copy is already current.', { file: serializeFile(file), files: serializeFiles(), workspace: serializeWorkspace(), activity: state.activity });
	file.content = content;
	file.revision += 1;
	file.status = 'modified';
	file.statusLabel = 'Modified';
	file.statusTone = 'warning';
	file.lastSavedAt = new Date().toISOString();
	state.workspace.revision += 1;
	state.workspace.changedFileCount = serializeFiles().filter((item) => item.status !== 'clean').length;
	addActivity('File saved', `${file.path} saved as revision ${file.revision}.`, 'Steve O’Brien');
	return success('File saved to the workspace.', { file: serializeFile(file), files: serializeFiles(), workspace: serializeWorkspace(), activity: state.activity });
}

/**
 * Saves model and agent defaults with optimistic revision protection.
 *
 * @param {Record<string, unknown>} input Settings fields and revision.
 * @returns {Record<string, unknown>} Updated settings or validation error.
 */
export function updateCursorWorkspaceSettings(input = {}) {
	if (Number(input.revision) !== state.settings.revision) {
		return conflict('Workspace settings changed in another session.', { code: 'settings_revision_conflict', settings: cloneValue(state.settings) });
	}
	const model = String(input.model || '');
	const mode = String(input.mode || '');
	const fields = [];
	if (!modelOptions.some((option) => option.value === model)) fields.push({ field: 'model', message: 'Choose a registered model.' });
	if (!modeOptions.some((option) => option.value === mode)) fields.push({ field: 'mode', message: 'Choose Ask, Edit, or Agent mode.' });
	if (typeof input.includeTests !== 'boolean') fields.push({ field: 'includeTests', message: 'Choose whether terminal evidence is included.' });
	if (typeof input.includeRules !== 'boolean') fields.push({ field: 'includeRules', message: 'Choose whether repository rules are included.' });
	if (fields.length) return validation('Workspace defaults need attention.', fields);
	state.settings = {
		model,
		mode,
		includeTests: input.includeTests,
		includeRules: input.includeRules,
		revision: state.settings.revision + 1,
	};
	addActivity('Agent defaults updated', `${optionLabel(modelOptions, model)} · ${optionLabel(modeOptions, mode)} mode.`, 'Steve O’Brien');
	return success('Agent defaults saved.', { settings: cloneValue(state.settings), activity: state.activity });
}

/**
 * Creates a deterministic, reviewable agent proposal.
 *
 * @param {Record<string, unknown>} input Prompt, model, mode, context, and workspace revision.
 * @returns {Record<string, unknown>} New proposal or structured API error.
 */
export function runCursorWorkspaceAgent(input = {}) {
	const prompt = normalizeText(input.prompt, 1200);
	const model = String(input.model || '');
	const mode = String(input.mode || '');
	const contextFileIds = uniqueStrings(input.contextFileIds);
	const fields = [];
	if (Number(input.workspaceRevision) !== state.workspace.revision) {
		return conflict('The repository changed before this agent run started. Reload the workspace and try again.', {
			code: 'workspace_revision_conflict',
			workspace: serializeWorkspace(),
			files: serializeFiles(),
		});
	}
	if (prompt.length < 12) fields.push({ field: 'prompt', message: 'Describe the requested change in at least 12 characters.' });
	if (!modelOptions.some((option) => option.value === model)) fields.push({ field: 'model', message: 'Choose a registered model.' });
	if (!modeOptions.some((option) => option.value === mode)) fields.push({ field: 'mode', message: 'Choose Ask, Edit, or Agent mode.' });
	if (!contextFileIds.length) fields.push({ field: 'contextFileIds', message: 'Include at least one repository file.' });
	const unknownContext = contextFileIds.find((fileId) => !state.files.has(fileId));
	if (unknownContext) fields.push({ field: 'contextFileIds', message: `Unknown context file: ${unknownContext}.` });
	if (fields.length) return validation('The agent run could not start.', fields);

	state.proposalSequence += 1;
	const id = `proposal-${state.proposalSequence}`;
	const changes = buildProposalChanges(contextFileIds);
	const proposal = {
		id,
		status: mode === 'ask' ? 'answered' : 'proposed',
		statusLabel: mode === 'ask' ? 'Answer ready' : 'Ready for review',
		statusTone: mode === 'ask' ? 'success' : 'info',
		workspaceRevision: state.workspace.revision,
		prompt,
		model,
		mode,
		contextFileIds,
		createdAt: new Date().toISOString(),
		createdBy: 'Steve O’Brien',
		summary: mode === 'ask'
			? 'The current dashboard mixes navigation and task state. Keeping the review boundary in a dedicated project pulse component will make the route easier to scan.'
			: `Prepared ${changes.length} focused edits that add a project pulse, preserve the route contract, and keep review state visible.`,
		changes: mode === 'ask' ? [] : changes,
		checks: [
			{ label: 'Workspace revision captured', detail: `Based on repository revision ${state.workspace.revision}.`, status: 'passed' },
			{ label: 'Repository rules loaded', detail: input.includeRules === false ? 'Rules excluded by operator.' : '4 rules included in the run.', status: input.includeRules === false ? 'warning' : 'passed' },
			{ label: 'Focused tests selected', detail: input.includeTests === false ? 'Test output excluded from context.' : 'MissionControl and workspace-store tests selected.', status: input.includeTests === false ? 'warning' : 'passed' },
		],
		messages: [
			{ role: 'user', author: 'You', body: prompt, meta: `${contextFileIds.length} context files` },
			{ role: 'assistant', author: optionLabel(modelOptions, model), body: mode === 'ask' ? 'I traced the dashboard entry point and data helper. The safest seam is a focused component fed by the existing summary contract.' : `I prepared a ${changes.length}-file patch. Review each diff, then apply it with an exact repository revision and explicit confirmation.`, meta: mode === 'ask' ? 'No files changed' : `${changes.length} proposed files` },
		],
		appliedAt: null,
		appliedBy: null,
		receipt: null,
	};
	state.proposals.set(id, proposal);
	state.activeProposalId = id;
	addActivity(mode === 'ask' ? 'Agent answer created' : 'Agent proposal created', `${optionLabel(modelOptions, model)} used ${contextFileIds.length} context files.`, 'AI workspace');
	return success(mode === 'ask' ? 'Agent answer created without changing files.' : 'Agent proposal is ready for review.', {
		proposal: serializeProposal(proposal),
		workspace: serializeWorkspace(),
		activity: state.activity,
	}, 201);
}

/**
 * Returns one immutable agent proposal.
 *
 * @param {string} proposalId Proposal identifier.
 * @returns {Record<string, unknown>} Proposal result or API error.
 */
export function getCursorWorkspaceProposal(proposalId) {
	const proposal = state.proposals.get(String(proposalId || ''));
	if (!proposal) return notFound('Agent proposal');
	return success('', { proposal: serializeProposal(proposal), workspace: serializeWorkspace() });
}

/**
 * Applies a reviewed proposal and optionally records focused test evidence.
 *
 * @param {string} proposalId Proposal identifier.
 * @param {Record<string, unknown>} input Workspace revision, acknowledgement, and test preference.
 * @returns {Record<string, unknown>} Applied proposal receipt or API error.
 */
export function applyCursorWorkspaceProposal(proposalId, input = {}) {
	const proposal = state.proposals.get(String(proposalId || ''));
	if (!proposal) return notFound('Agent proposal');
	if (proposal.status !== 'proposed') return conflict('Only a pending edit proposal can be applied.', { code: 'proposal_not_pending', proposal: serializeProposal(proposal) });
	if (Number(input.workspaceRevision) !== state.workspace.revision || proposal.workspaceRevision !== state.workspace.revision) {
		return conflict('The repository changed after this proposal was generated. Run the agent again against the current revision.', {
			code: 'proposal_revision_conflict',
			proposal: serializeProposal(proposal),
			workspace: serializeWorkspace(),
			files: serializeFiles(),
		});
	}
	if (input.acknowledged !== true) return validation('Confirm the reviewed files before applying the patch.', [{ field: 'acknowledged', message: 'Confirm you reviewed the proposed files and test scope.' }]);

	for (const change of proposal.changes) {
		const file = state.files.get(change.fileId);
		if (!file) continue;
		file.content = change.proposed;
		file.revision += 1;
		file.status = file.status === 'added' ? 'added' : 'modified';
		file.statusLabel = file.status === 'added' ? 'Added' : 'Modified';
		file.statusTone = file.status === 'added' ? 'success' : 'warning';
		file.lastSavedAt = new Date().toISOString();
	}
	state.workspace.revision += 1;
	state.workspace.changedFileCount = serializeFiles().filter((file) => file.status !== 'clean').length;
	proposal.status = 'applied';
	proposal.statusLabel = 'Applied';
	proposal.statusTone = 'success';
	proposal.appliedAt = new Date().toISOString();
	proposal.appliedBy = 'Steve O’Brien';
	proposal.receipt = {
		id: `apply-${proposal.id}-${state.workspace.revision}`,
		workspaceRevision: state.workspace.revision,
		filesChanged: proposal.changes.length,
		rollbackAvailable: true,
	};
	let testRun = null;
	if (input.runTests === true) testRun = createTestRun(['MissionControl.test.tsx', 'workspace-store.test.ts']);
	addActivity('Agent patch applied', `${proposal.changes.length} files applied at repository revision ${state.workspace.revision}.`, 'Steve O’Brien');
	return success('Reviewed patch applied with a rollback receipt.', {
		proposal: serializeProposal(proposal),
		workspace: serializeWorkspace(),
		files: serializeFiles(),
		file: serializeFile(state.files.get(proposal.changes[0]?.fileId || 'dashboard-page')),
		testRun,
		testRuns: state.testRuns,
		activity: state.activity,
	});
}

/**
 * Runs deterministic focused checks against the current repository revision.
 *
 * @param {Record<string, unknown>} input Workspace revision and optional test names.
 * @returns {Record<string, unknown>} Test run evidence or API error.
 */
export function runCursorWorkspaceTests(input = {}) {
	if (Number(input.workspaceRevision) !== state.workspace.revision) {
		return conflict('The repository changed before tests started.', { code: 'test_revision_conflict', workspace: serializeWorkspace() });
	}
	const requested = uniqueStrings(input.tests);
	const supported = ['MissionControl.test.tsx', 'workspace-store.test.ts', 'dashboard-page.test.tsx'];
	const tests = requested.length ? requested.filter((test) => supported.includes(test)) : supported.slice(0, 2);
	if (!tests.length) return validation('Choose at least one supported focused test.', [{ field: 'tests', message: 'No supported test names were supplied.' }]);
	const testRun = createTestRun(tests);
	addActivity('Focused tests passed', `${testRun.passedCount}/${testRun.testCount} checks passed in ${testRun.durationMs}ms.`, 'Test runner');
	return success('Focused tests completed.', { testRun, testRuns: state.testRuns, workspace: serializeWorkspace(), activity: state.activity }, 201);
}

/**
 * Restores the seeded repository, proposals, tests, and settings.
 *
 * @returns {Record<string, unknown>} Fresh workspace bootstrap.
 */
export function resetCursorWorkspace() {
	state = createInitialState();
	return success('Developer workspace reset to the seeded repository.', getCursorWorkspaceBootstrap());
}

/**
 * Creates the complete process-local demo state.
 *
 * @returns {Record<string, unknown>} Initial workspace state.
 */
function createInitialState() {
	const files = createInitialFiles();
	const initial = {
		workspace: {
			id: 'workspace-atlas-web',
			name: 'Atlas Web',
			repository: 'northstar/atlas-web',
			branch: 'feature/mission-control',
			revision: 7,
			status: 'ready',
			statusLabel: 'Indexed',
			statusTone: 'success',
			changedFileCount: 4,
			indexedFileCount: 1284,
			indexedAt: '2026-08-01T18:42:00.000Z',
		},
		settings: { model: 'composer-2-5', mode: 'agent', includeTests: true, includeRules: true, revision: 1 },
		files,
		fileTree: createFileTree(),
		proposalSequence: 301,
		proposals: new Map(),
		activeProposalId: 'proposal-301',
		testSequence: 94,
		testRuns: [createSeedTestRun()],
		activitySequence: 500,
		activity: [
			{ id: 'activity-500', label: 'Workspace indexed', detail: '1,284 files and 4 repository rules available.', actor: 'Repository service', createdAt: '2026-08-01T18:42:00.000Z' },
			{ id: 'activity-499', label: 'Focused tests passed', detail: 'MissionControl and workspace-store suites passed.', actor: 'Test runner', createdAt: '2026-08-01T18:38:00.000Z' },
		],
	};
	const proposal = createSeedProposal(files);
	initial.proposals.set(proposal.id, proposal);
	return initial;
}

/**
 * Creates seeded repository files.
 *
 * @returns {Map<string, Record<string, unknown>>} File map.
 */
function createInitialFiles() {
	return new Map([
		createFile({ id: 'dashboard-page', name: 'page.tsx', path: 'src/app/dashboard/page.tsx', language: 'tsx', status: 'modified', revision: 3, content: `import { MissionControl } from "@/components/MissionControl";
import { TaskCard } from "@/components/TaskCard";
import { getWorkspaceSummary } from "@/lib/workspace-store";

export default async function DashboardPage() {
	const summary = await getWorkspaceSummary();

	return (
		<main className="grid min-h-screen grid-cols-[18rem_1fr] bg-background">
			<aside className="border-r border-border p-4">Atlas Web</aside>
			<section className="p-6">
				<MissionControl projects={summary.projects} />
				<TaskCard task={summary.activeTask} />
			</section>
		</main>
	);
}` }),
		createFile({ id: 'layout-file', name: 'layout.tsx', path: 'src/app/layout.tsx', language: 'tsx', status: 'clean', revision: 1, content: `export default function RootLayout({ children }) {
	return <html lang="en"><body>{children}</body></html>;
}` }),
		createFile({ id: 'mission-control', name: 'MissionControl.tsx', path: 'src/components/MissionControl.tsx', language: 'tsx', status: 'added', revision: 2, content: `type MissionControlProps = {
	projects: Array<{ id: string; name: string; status: string; minutes: number }>;
};

export function MissionControl({ projects }: MissionControlProps) {
	return (
		<section className="grid gap-3 md:grid-cols-3">
			{projects.map((project) => <article key={project.id}>{project.name}</article>)}
		</section>
	);
}` }),
		createFile({ id: 'task-card', name: 'TaskCard.tsx', path: 'src/components/TaskCard.tsx', language: 'tsx', status: 'modified', revision: 4, content: `export function TaskCard({ task }) {
	return <article><h3>{task.title}</h3><p>{task.summary}</p></article>;
}` }),
		createFile({ id: 'agent-client', name: 'agent-client.ts', path: 'src/lib/agent-client.ts', language: 'ts', status: 'clean', revision: 1, content: `export async function runAgentTask(input) {
	return fetch("/api/agent/run", { method: "POST", body: JSON.stringify(input) });
}` }),
		createFile({ id: 'workspace-store', name: 'workspace-store.ts', path: 'src/lib/workspace-store.ts', language: 'ts', status: 'modified', revision: 5, content: `export async function getWorkspaceSummary() {
	return {
		activeTask: { title: "Plan Mission Control", status: "In progress" },
		projects: [
			{ id: "research", name: "Research dashboard", status: "active", minutes: 14 },
			{ id: "billing", name: "Billing migration", status: "review", minutes: 30 },
		],
	};
}` }),
		createFile({ id: 'cursor-rules', name: '.cursorrules', path: '.cursorrules', language: 'md', status: 'clean', revision: 1, content: `- Prefer small, reviewable commits.
- Preserve existing design tokens and route conventions.
- Run focused tests before proposing a final patch.
- Explain risky edits before applying them.` }),
		createFile({ id: 'package-json', name: 'package.json', path: 'package.json', language: 'json', status: 'clean', revision: 2, content: `{
	"scripts": { "dev": "next dev", "test": "vitest run", "lint": "eslint ." },
	"dependencies": { "next": "latest", "react": "latest" }
}` }),
	]);
}

/**
 * Creates one normalized file map entry.
 *
 * @param {Record<string, unknown>} input File seed.
 * @returns {[string, Record<string, unknown>]} File map entry.
 */
function createFile(input) {
	const statusMap = {
		modified: ['Modified', 'warning'],
		added: ['Added', 'success'],
		clean: ['Clean', 'neutral'],
	};
	return [input.id, {
		...input,
		statusLabel: statusMap[input.status][0],
		statusTone: statusMap[input.status][1],
		lastSavedAt: '2026-08-01T18:36:00.000Z',
	}];
}

/**
 * Creates the seeded project tree used by DomTreeView.
 *
 * @returns {Array<Record<string, unknown>>} Project tree nodes.
 */
function createFileTree() {
	return [
		{ id: 'src', label: 'src', kind: 'folder', open: true, children: [
			{ id: 'src-app', label: 'app', kind: 'folder', open: true, children: [
				{ id: 'dashboard-page', label: 'page.tsx', kind: 'file' },
				{ id: 'layout-file', label: 'layout.tsx', kind: 'file' },
			] },
			{ id: 'src-components', label: 'components', kind: 'folder', open: true, children: [
				{ id: 'mission-control', label: 'MissionControl.tsx', kind: 'file' },
				{ id: 'task-card', label: 'TaskCard.tsx', kind: 'file' },
			] },
			{ id: 'src-lib', label: 'lib', kind: 'folder', open: true, children: [
				{ id: 'agent-client', label: 'agent-client.ts', kind: 'file' },
				{ id: 'workspace-store', label: 'workspace-store.ts', kind: 'file' },
			] },
		] },
		{ id: 'cursor-rules', label: '.cursorrules', kind: 'file' },
		{ id: 'package-json', label: 'package.json', kind: 'file' },
	];
}

/**
 * Creates the seeded review proposal.
 *
 * @param {Map<string, Record<string, unknown>>} files Repository files.
 * @returns {Record<string, unknown>} Seed proposal.
 */
function createSeedProposal(files) {
	const changes = buildProposalChanges(['dashboard-page', 'mission-control', 'workspace-store'], files);
	return {
		id: 'proposal-301',
		status: 'proposed',
		statusLabel: 'Ready for review',
		statusTone: 'info',
		workspaceRevision: 7,
		prompt: 'Make the dashboard feel like mission control and keep review state obvious.',
		model: 'composer-2-5',
		mode: 'agent',
		contextFileIds: ['dashboard-page', 'mission-control', 'workspace-store'],
		createdAt: '2026-08-01T18:40:00.000Z',
		createdBy: 'Steve O’Brien',
		summary: 'Prepared 3 focused edits that add a project pulse, preserve the route contract, and keep review state visible.',
		changes,
		checks: [
			{ label: 'Workspace revision captured', detail: 'Based on repository revision 7.', status: 'passed' },
			{ label: 'Repository rules loaded', detail: '4 rules included in the run.', status: 'passed' },
			{ label: 'Focused tests selected', detail: 'MissionControl and workspace-store tests selected.', status: 'passed' },
		],
		messages: [
			{ role: 'user', author: 'You', body: 'Make the dashboard feel like mission control and keep review state obvious.', meta: '3 context files' },
			{ role: 'assistant', author: 'Composer 2.5', body: 'I prepared a 3-file patch. Review each diff, then apply it with an exact repository revision and explicit confirmation.', meta: '3 proposed files' },
		],
		appliedAt: null,
		appliedBy: null,
		receipt: null,
	};
}

/**
 * Builds deterministic proposed file contents.
 *
 * @param {string[]} contextFileIds Selected context file identifiers.
 * @param {Map<string, Record<string, unknown>>} files Repository file map.
 * @returns {Array<Record<string, unknown>>} Proposed file changes.
 */
function buildProposalChanges(contextFileIds, files = state.files) {
	const preferredIds = ['dashboard-page', 'mission-control', 'workspace-store'];
	const chosen = preferredIds.filter((fileId) => contextFileIds.includes(fileId));
	const ids = chosen.length ? chosen : contextFileIds.slice(0, 2);
	return ids.map((fileId) => {
		const file = files.get(fileId);
		const proposed = proposedContent(fileId, file.content);
		return {
			fileId,
			file: file.path,
			status: file.status === 'added' ? 'added' : 'modified',
			summary: changeSummary(fileId),
			original: file.content,
			proposed,
			additions: Math.max(1, proposed.split('\n').length - file.content.split('\n').length + 4),
			deletions: 2,
		};
	});
}

/**
 * Creates deterministic proposed content for one file.
 *
 * @param {string} fileId File identifier.
 * @param {string} original Original source.
 * @returns {string} Proposed source.
 */
function proposedContent(fileId, original) {
	if (fileId === 'dashboard-page') {
		return original
			.replace('const summary = await getWorkspaceSummary();', 'const summary = await getWorkspaceSummary();\n\tconst reviewProjects = summary.projects.filter((project) => project.status === "review");')
			.replace('<MissionControl projects={summary.projects} />', '<MissionControl projects={summary.projects} reviewProjects={reviewProjects} />');
	}
	if (fileId === 'mission-control') {
		return `type MissionControlProps = {
	projects: Array<{ id: string; name: string; status: string; minutes: number }>;
	reviewProjects: Array<{ id: string; name: string }>;
};

export function MissionControl({ projects, reviewProjects }: MissionControlProps) {
	return (
		<section aria-label="Project pulse" className="grid gap-3 md:grid-cols-3">
			{projects.map((project) => (
				<article key={project.id} data-status={project.status}>
					<strong>{project.name}</strong><span>{project.minutes}m active</span>
				</article>
			))}
			<p>{reviewProjects.length} projects need review</p>
		</section>
	);
}`;
	}
	if (fileId === 'workspace-store') {
		return original.replace('{ id: "billing", name: "Billing migration", status: "review", minutes: 30 },', '{ id: "billing", name: "Billing migration", status: "review", minutes: 30 },\n\t\t\t{ id: "protocol", name: "Protocol parser", status: "queued", minutes: 45 },');
	}
	return original.includes('Agent proposal') ? original : `${original}\n\n// Agent proposal: keep this change small and reviewable.`;
}

/**
 * Returns a concise file-specific change summary.
 *
 * @param {string} fileId File identifier.
 * @returns {string} Change summary.
 */
function changeSummary(fileId) {
	return {
		'dashboard-page': 'Derives review projects and passes them through the existing route seam.',
		'mission-control': 'Adds an accessible project pulse with explicit review state.',
		'workspace-store': 'Adds queued project evidence to the server-owned summary contract.',
	}[fileId] || 'Adds a small, reviewable note without changing the public contract.';
}

/**
 * Creates and stores one deterministic test run.
 *
 * @param {string[]} tests Test filenames.
 * @returns {Record<string, unknown>} Test evidence.
 */
function createTestRun(tests) {
	state.testSequence += 1;
	const failed = [...state.files.values()].some((file) => file.content.includes('SYNTAX_ERROR'));
	const testRun = {
		id: `test-${state.testSequence}`,
		status: failed ? 'failed' : 'passed',
		statusLabel: failed ? 'Failed' : 'Passed',
		statusTone: failed ? 'danger' : 'success',
		workspaceRevision: state.workspace.revision,
		tests,
		testCount: tests.length,
		passedCount: failed ? Math.max(0, tests.length - 1) : tests.length,
		durationMs: 1180 + (tests.length * 164),
		coverage: failed ? 76 : 88,
		output: failed
			? ['$ npm run test -- --run', 'FAIL src/app/dashboard/page.test.tsx', 'SyntaxError: unexpected token SYNTAX_ERROR']
			: ['$ npm run test -- --run', ...tests.map((test) => `PASS ${test}`), `Test Files ${tests.length} passed (${tests.length})`],
		createdAt: new Date().toISOString(),
	};
	state.testRuns.unshift(testRun);
	state.testRuns = state.testRuns.slice(0, 8);
	return cloneValue(testRun);
}

/**
 * Creates the seeded passing test run.
 *
 * @returns {Record<string, unknown>} Seed test evidence.
 */
function createSeedTestRun() {
	return {
		id: 'test-94',
		status: 'passed',
		statusLabel: 'Passed',
		statusTone: 'success',
		workspaceRevision: 7,
		tests: ['MissionControl.test.tsx', 'workspace-store.test.ts'],
		testCount: 2,
		passedCount: 2,
		durationMs: 1508,
		coverage: 88,
		output: ['$ npm run test -- --run', 'PASS MissionControl.test.tsx', 'PASS workspace-store.test.ts', 'Test Files 2 passed (2)'],
		createdAt: '2026-08-01T18:38:00.000Z',
	};
}

/**
 * Adds one recent workspace activity item.
 *
 * @param {string} label Activity label.
 * @param {string} detail Activity detail.
 * @param {string} actor Activity actor.
 * @returns {void}
 */
function addActivity(label, detail, actor) {
	state.activitySequence += 1;
	state.activity.unshift({ id: `activity-${state.activitySequence}`, label, detail, actor, createdAt: new Date().toISOString() });
	state.activity = state.activity.slice(0, 12);
}

/**
 * Serializes workspace state.
 *
 * @returns {Record<string, unknown>} Detached workspace.
 */
function serializeWorkspace() {
	return cloneValue(state.workspace);
}

/**
 * Serializes file metadata in project order.
 *
 * @returns {Array<Record<string, unknown>>} Safe file summaries.
 */
function serializeFiles() {
	return [...state.files.values()].map((file) => {
		const { content: _content, ...summary } = file;
		return cloneValue(summary);
	});
}

/**
 * Serializes one file including content.
 *
 * @param {Record<string, unknown>} file Internal file.
 * @returns {Record<string, unknown> | null} Detached file detail.
 */
function serializeFile(file) {
	return file ? cloneValue(file) : null;
}

/**
 * Serializes one proposal.
 *
 * @param {Record<string, unknown>} proposal Internal proposal.
 * @returns {Record<string, unknown> | null} Detached proposal.
 */
function serializeProposal(proposal) {
	return proposal ? cloneValue(proposal) : null;
}

/**
 * Looks up a label from a rich option list.
 *
 * @param {Array<Record<string, unknown>>} options Option list.
 * @param {string} value Selected value.
 * @returns {string} Option label.
 */
function optionLabel(options, value) {
	return options.find((option) => option.value === value)?.label || value;
}

/**
 * Creates a successful API response.
 *
 * @param {string} message User-facing message.
 * @param {Record<string, unknown>} data Result data.
 * @param {number} status HTTP status.
 * @returns {Record<string, unknown>} API result.
 */
function success(message, data = {}, status = 200) {
	return { ok: true, status, message, ...cloneValue(data) };
}

/**
 * Creates a field validation error.
 *
 * @param {string} message User-facing message.
 * @param {Array<Record<string, string>>} fields Field errors.
 * @returns {Record<string, unknown>} API error.
 */
function validation(message, fields) {
	return { ok: false, error: 'validation_error', status: 422, message, fields };
}

/**
 * Creates a revision or state conflict.
 *
 * @param {string} message User-facing message.
 * @param {Record<string, unknown>} data Conflict evidence.
 * @returns {Record<string, unknown>} API error.
 */
function conflict(message, data = {}) {
	return { ok: false, error: 'conflict', status: 409, message, ...cloneValue(data) };
}

/**
 * Creates a not-found result.
 *
 * @param {string} noun Missing resource noun.
 * @returns {Record<string, unknown>} API error.
 */
function notFound(noun) {
	return { ok: false, error: 'not_found', status: 404, message: `${noun} was not found.` };
}

/**
 * Normalizes text to a bounded string.
 *
 * @param {unknown} value Candidate value.
 * @param {number} maxLength Maximum length.
 * @returns {string} Normalized text.
 */
function normalizeText(value, maxLength) {
	return String(value || '').trim().slice(0, maxLength);
}

/**
 * Returns unique non-empty strings from an array.
 *
 * @param {unknown} value Candidate array.
 * @returns {string[]} Unique strings.
 */
function uniqueStrings(value) {
	if (!Array.isArray(value)) return [];
	return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
}

/**
 * Creates a detached JSON-safe value.
 *
 * @template T
 * @param {T} value Source value.
 * @returns {T} Detached value.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}
