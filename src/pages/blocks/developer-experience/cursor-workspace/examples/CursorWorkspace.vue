<script setup>
import { computed, nextTick, ref } from 'vue';
import {
	DomButton,
	DomCheckbox,
	DomCommandPalette,
	DomDrawer,
	DomMenu,
	DomNativeSelect,
	DomPopover,
	DomSplitterPanel,
	DomTabs,
	DomToggle,
	DomToggleButtonGroup,
	DomTooltip,
	DomTreeView,
} from '@getdom/studio/vue';

const fileTree = ref([
	{
		id: 'src',
		label: 'src',
		kind: 'folder',
		open: true,
		children: [
			{
				id: 'src-app',
				label: 'app',
				kind: 'folder',
				open: true,
				children: [
					{ id: 'dashboard-page', label: 'page.tsx', kind: 'file', language: 'tsx', status: 'M' },
					{ id: 'layout-file', label: 'layout.tsx', kind: 'file', language: 'tsx' },
				],
			},
			{
				id: 'src-components',
				label: 'components',
				kind: 'folder',
				open: true,
				children: [
					{ id: 'mission-control', label: 'MissionControl.tsx', kind: 'file', language: 'tsx', status: 'A' },
					{ id: 'task-card', label: 'TaskCard.tsx', kind: 'file', language: 'tsx', status: 'M' },
				],
			},
			{
				id: 'src-lib',
				label: 'lib',
				kind: 'folder',
				open: true,
				children: [
					{ id: 'agent-client', label: 'agent-client.ts', kind: 'file', language: 'ts' },
					{ id: 'workspace-store', label: 'workspace-store.ts', kind: 'file', language: 'ts', status: 'M' },
				],
			},
		],
	},
	{
		id: 'config',
		label: 'config',
		kind: 'folder',
		open: true,
		children: [
			{ id: 'cursor-rules', label: '.cursorrules', kind: 'file', language: 'md' },
			{ id: 'package-json', label: 'package.json', kind: 'file', language: 'json' },
		],
	},
]);

const files = ref([
	{
		id: 'dashboard-page',
		name: 'page.tsx',
		path: 'src/app/dashboard/page.tsx',
		language: 'tsx',
		status: 'M',
		content: [
			'import { MissionControl } from "@/components/MissionControl";',
			'import { TaskCard } from "@/components/TaskCard";',
			'import { getWorkspaceSummary } from "@/lib/workspace-store";',
			'',
			'export default async function DashboardPage() {',
			'\tconst summary = await getWorkspaceSummary();',
			'',
			'\treturn (',
			'\t\t<main className="grid min-h-screen grid-cols-[18rem_1fr] bg-background">',
			'\t\t\t<aside className="border-r border-border p-4">',
			'\t\t\t\t<h1 className="text-sm font-medium">Acme Labs</h1>',
			'\t\t\t</aside>',
			'\t\t\t<section className="p-6">',
			'\t\t\t\t<MissionControl projects={summary.projects} />',
			'\t\t\t\t<TaskCard task={summary.activeTask} />',
			'\t\t\t</section>',
			'\t\t</main>',
			'\t);',
			'}',
		].join('\n'),
	},
	{
		id: 'mission-control',
		name: 'MissionControl.tsx',
		path: 'src/components/MissionControl.tsx',
		language: 'tsx',
		status: 'A',
		content: [
			'type MissionControlProps = {',
			'\tprojects: Array<{',
			'\t\tid: string;',
			'\t\tname: string;',
			'\t\tstatus: "active" | "review" | "queued";',
			'\t\tminutes: number;',
			'\t}>;',
			'};',
			'',
			'export function MissionControl({ projects }: MissionControlProps) {',
			'\treturn (',
			'\t\t<div className="grid gap-3 md:grid-cols-3">',
			'\t\t\t{projects.map((project) => (',
			'\t\t\t\t<article key={project.id} className="rounded-lg border p-4">',
			'\t\t\t\t\t<p className="text-xs uppercase text-muted-foreground">{project.status}</p>',
			'\t\t\t\t\t<h2 className="mt-2 font-semibold">{project.name}</h2>',
			'\t\t\t\t\t<p className="mt-4 text-sm">{project.minutes}m active</p>',
			'\t\t\t\t</article>',
			'\t\t\t))}',
			'\t\t</div>',
			'\t);',
			'}',
		].join('\n'),
	},
	{
		id: 'task-card',
		name: 'TaskCard.tsx',
		path: 'src/components/TaskCard.tsx',
		language: 'tsx',
		status: 'M',
		content: [
			'export function TaskCard({ task }) {',
			'\treturn (',
			'\t\t<div className="rounded-lg border bg-card p-4 shadow-sm">',
			'\t\t\t<div className="flex items-start justify-between gap-3">',
			'\t\t\t\t<div>',
			'\t\t\t\t\t<p className="text-xs text-muted-foreground">Agent task</p>',
			'\t\t\t\t\t<h3 className="mt-1 font-semibold">{task.title}</h3>',
			'\t\t\t\t</div>',
			'\t\t\t\t<span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs">',
			'\t\t\t\t\t{task.status}',
			'\t\t\t\t</span>',
			'\t\t\t</div>',
			'\t\t\t<p className="mt-3 text-sm leading-6">{task.summary}</p>',
			'\t\t</div>',
			'\t);',
			'}',
		].join('\n'),
	},
	{
		id: 'agent-client',
		name: 'agent-client.ts',
		path: 'src/lib/agent-client.ts',
		language: 'ts',
		status: '',
		content: [
			'export type AgentMode = "ask" | "edit" | "agent";',
			'',
			'export async function runAgentTask(input: {',
			'\tmode: AgentMode;',
			'\tprompt: string;',
			'\tfiles: string[];',
			'}) {',
			'\treturn fetch("/api/agent/run", {',
			'\t\tmethod: "POST",',
			'\t\theaders: { "content-type": "application/json" },',
			'\t\tbody: JSON.stringify(input),',
			'\t}).then((response) => response.json());',
			'}',
		].join('\n'),
	},
	{
		id: 'workspace-store',
		name: 'workspace-store.ts',
		path: 'src/lib/workspace-store.ts',
		language: 'ts',
		status: 'M',
		content: [
			'export async function getWorkspaceSummary() {',
			'\treturn {',
			'\t\tactiveTask: {',
			'\t\t\ttitle: "Plan Mission Control",',
			'\t\t\tstatus: "In progress",',
			'\t\t\tsummary: "Design the expose-style project overview and wire it to live task state.",',
			'\t\t},',
			'\t\tprojects: [',
			'\t\t\t{ id: "research", name: "Acme Research Dashboard", status: "active", minutes: 14 },',
			'\t\t\t{ id: "billing", name: "Zero-downtime Billing", status: "review", minutes: 30 },',
			'\t\t\t{ id: "protocol", name: "Binary Protocol Parser", status: "queued", minutes: 45 },',
			'\t\t],',
			'\t};',
			'}',
		].join('\n'),
	},
	{
		id: 'layout-file',
		name: 'layout.tsx',
		path: 'src/app/layout.tsx',
		language: 'tsx',
		status: '',
		content: [
			'export default function RootLayout({ children }) {',
			'\treturn (',
			'\t\t<html lang="en">',
			'\t\t\t<body>{children}</body>',
			'\t\t</html>',
			'\t);',
			'}',
		].join('\n'),
	},
	{
		id: 'cursor-rules',
		name: '.cursorrules',
		path: '.cursorrules',
		language: 'md',
		status: '',
		content: [
			'- Prefer small, reviewable commits.',
			'- Preserve existing design tokens and route conventions.',
			'- Run focused tests before proposing a final patch.',
			'- Explain risky edits before applying them.',
		].join('\n'),
	},
	{
		id: 'package-json',
		name: 'package.json',
		path: 'package.json',
		language: 'json',
		status: '',
		content: [
			'{',
			'\t"scripts": {',
			'\t\t"dev": "next dev",',
			'\t\t"test": "vitest run",',
			'\t\t"lint": "eslint ."',
			'\t},',
			'\t"dependencies": {',
			'\t\t"next": "latest",',
			'\t\t"react": "latest"',
			'\t}',
			'}',
		].join('\n'),
	},
]);

const initialOpenTabs = ['dashboard-page', 'mission-control', 'agent-client'];
const openTabIds = ref([...initialOpenTabs]);
const activeFileId = ref('dashboard-page');
const selectedFileId = ref('dashboard-page');
const sidebarStartSize = ref(250);
const assistantEndSize = ref(380);
const activeBottomTab = ref('terminal');
const activeAssistantTab = ref('chat');
const commandOpen = ref(false);
const reviewOpen = ref(false);
const settingsOpen = ref(false);
const agentMode = ref('agent');
const selectedModel = ref('composer-2-5');
const includeTerminal = ref(true);
const includeWorkspace = ref(true);
const autoApplyLowRisk = ref(false);
const selectedTaskId = ref('landing');
const composerText = ref('Add a mission-control overview with active projects, task progress, and a clear review state.');
const terminalLines = ref([
	'$ npm run test -- --watch=false',
	'PASS src/components/MissionControl.test.tsx',
	'PASS src/lib/workspace-store.test.ts',
	'Test Files 2 passed (2)',
]);
const stagedChanges = ref(4);
const lastCommand = ref('No command selected');

const modelOptions = [
	{ label: 'Composer 2.5', value: 'composer-2-5' },
	{ label: 'GPT-5.5 Extra High', value: 'gpt-5-5-extra' },
	{ label: 'Opus 4.8', value: 'opus-4-8' },
	{ label: 'Auto', value: 'auto' },
];

const modeOptions = [
	{ label: 'Ask', value: 'ask' },
	{ label: 'Edit', value: 'edit' },
	{ label: 'Agent', value: 'agent' },
];

const bottomTabs = [
	{ key: 'terminal', label: 'Terminal' },
	{ key: 'problems', label: 'Problems' },
	{ key: 'output', label: 'Output' },
];

const assistantTabs = [
	{ key: 'chat', label: 'Chat' },
	{ key: 'tasks', label: 'Tasks' },
	{ key: 'rules', label: 'Rules' },
];

const tasks = ref([
	{
		id: 'landing',
		title: 'Build Landing Page',
		state: 'In Progress',
		detail: 'Reading docs and updating dashboard shell',
		progress: 68,
		files: ['page.tsx', 'MissionControl.tsx'],
	},
	{
		id: 'usage',
		title: 'Analyze Tab vs Agent Usage',
		state: 'In Progress',
		detail: 'Fetching data from workspace-store',
		progress: 42,
		files: ['workspace-store.ts'],
	},
	{
		id: 'mission',
		title: 'Plan Mission Control',
		state: 'Ready for Review',
		detail: 'Generated plan and proposed 3 edits',
		progress: 100,
		files: ['TaskCard.tsx', 'agent-client.ts'],
	},
]);

const chatMessages = ref([
	{
		id: 'm1',
		role: 'assistant',
		author: 'Composer 2.5',
		body: 'I indexed the project and found the dashboard entry point, the new MissionControl component, and the workspace data helper.',
		meta: 'Explored 12 files, 4 searches',
	},
	{
		id: 'm2',
		role: 'user',
		author: 'You',
		body: 'Make the dashboard feel more like mission control and keep the task review state obvious.',
		meta: '',
	},
	{
		id: 'm3',
		role: 'assistant',
		author: 'Composer 2.5',
		body: 'I can add a review rail, expose project activity, and keep the current layout contract intact. The patch touches page.tsx, MissionControl.tsx, and workspace-store.ts.',
		meta: '3 proposed files',
	},
]);

const reviewItems = ref([
	{ id: 'r1', file: 'src/app/dashboard/page.tsx', status: 'modified', summary: 'Adds the mission-control section and keeps the sidebar stable.' },
	{ id: 'r2', file: 'src/components/MissionControl.tsx', status: 'added', summary: 'Creates project preview cards with progress and review state.' },
	{ id: 'r3', file: 'src/lib/workspace-store.ts', status: 'modified', summary: 'Adds realistic project status data for the shell.' },
]);

const problemItems = [
	{ file: 'TaskCard.tsx', line: 1, severity: 'warning', message: 'task prop is inferred as any.' },
	{ file: 'MissionControl.tsx', line: 12, severity: 'hint', message: 'Consider memoizing project status labels.' },
	{ file: 'workspace-store.ts', line: 9, severity: 'info', message: 'Queued project count is mocked.' },
];

const workspaceMenuItems = [
	{ value: 'new-file', label: 'New File', description: 'Create a draft component.' },
	{ value: 'command-palette', label: 'Command Palette', description: 'Open action search.' },
	{ value: 'review-changes', label: 'Review Changes', description: 'Open the patch drawer.' },
	{ separator: true },
	{ value: 'toggle-terminal', label: 'Toggle Terminal', description: 'Switch the bottom panel.' },
	{ value: 'settings', label: 'Workspace Settings', description: 'Configure agent context.' },
];

const commandItems = computed(() => [
	{ value: 'open-dashboard-page', label: 'Open src/app/dashboard/page.tsx', description: 'Jump to the dashboard route.' },
	{ value: 'open-mission-control', label: 'Open MissionControl.tsx', description: 'Open the new overview component.' },
	{ value: 'run-tests', label: 'Run focused tests', description: 'Append test output to the terminal.' },
	{ value: 'review-changes', label: 'Review generated patch', description: 'Open the review drawer.' },
	{ value: 'toggle-agent-mode', label: 'Switch to Agent mode', description: 'Let the assistant plan and edit.' },
	{ value: 'settings', label: 'Open workspace settings', description: 'Tune model and context sources.' },
]);

const selectedTask = computed(() => tasks.value.find((task) => task.id === selectedTaskId.value) || tasks.value[0]);
const activeFile = computed(() => fileById(activeFileId.value) || files.value[0]);
const openTabs = computed(() => openTabIds.value.map(fileById).filter(Boolean));
const activeModelLabel = computed(() => modelOptions.find((option) => option.value === selectedModel.value)?.label || 'Auto');
const activeContent = computed({
	get: () => activeFile.value?.content || '',
	set(value) {
		const file = activeFile.value;
		if (file) file.content = value;
	},
});
const lineNumbers = computed(() => activeContent.value.split('\n').map((_, index) => index + 1));
const branchSummary = computed(() => `${stagedChanges.value} changes on feature/mission-control`);
const currentFilePath = computed(() => activeFile.value?.path || '');
const selectedFileContext = computed(() => openTabs.value.map((file) => file.name).join(', '));
const modeLabel = computed(() => modeOptions.find((option) => option.value === agentMode.value)?.label || 'Agent');

function fileById(id) {
	return files.value.find((file) => file.id === id);
}

function iconFor(item) {
	if (item.kind === 'folder') return item.open ? 'folder-open' : 'folder';
	if (item.language === 'tsx') return 'react';
	if (item.language === 'json') return 'json';
	if (item.language === 'md') return 'rules';
	return 'code';
}

function selectFile(payload) {
	const item = payload?.item;
	if (!item || item.kind !== 'file') return;
	openFile(String(payload.value || item.id));
}

function openFile(fileId) {
	if (!fileById(fileId)) return;
	selectedFileId.value = fileId;
	activeFileId.value = fileId;
	if (!openTabIds.value.includes(fileId)) openTabIds.value.push(fileId);
}

function closeTab(fileId, event) {
	event?.stopPropagation?.();
	if (openTabIds.value.length === 1) return;
	const index = openTabIds.value.indexOf(fileId);
	openTabIds.value = openTabIds.value.filter((id) => id !== fileId);
	if (activeFileId.value !== fileId) return;
	const nextId = openTabIds.value[Math.max(0, index - 1)] || openTabIds.value[0];
	activeFileId.value = nextId;
	selectedFileId.value = nextId;
}

function runAgent() {
	const prompt = composerText.value.trim() || 'Review the active file and suggest the safest next patch.';
	const id = `m${chatMessages.value.length + 1}`;
	chatMessages.value.push({
		id,
		role: 'user',
		author: 'You',
		body: prompt,
		meta: currentFilePath.value,
	});
	chatMessages.value.push({
		id: `${id}-assistant`,
		role: 'assistant',
		author: activeModelLabel.value,
		body: `I prepared a ${modeLabel.value.toLowerCase()} pass for ${activeFile.value.name}. The proposed patch keeps the layout contract, adds a review-safe state, and updates ${selectedFileContext.value}.`,
		meta: 'Patch ready for review',
	});
	terminalLines.value.push(`agent ${agentMode.value}: prepared patch for ${activeFile.value.name}`);
	composerText.value = '';
	reviewOpen.value = true;
	nextTick(() => {
		const scroll = document.querySelector('[data-chat-scroll]');
		scroll?.scrollTo?.({ top: scroll.scrollHeight, behavior: 'smooth' });
	});
}

function applySuggestion() {
	const file = activeFile.value;
	if (!file) return;
	const note = [
		'',
		'// Agent-applied review note:',
		'// Keep this section easy to scan during mission-control handoff.',
	].join('\n');
	if (!file.content.includes('Agent-applied review note')) {
		file.content = `${file.content}${note}`;
		stagedChanges.value += 1;
		terminalLines.value.push(`applied patch: ${file.path}`);
	}
	reviewOpen.value = false;
}

function acceptInlineCompletion() {
	const file = activeFile.value;
	if (!file) return;
	const snippet = '\nconst reviewState = summary.projects.filter((project) => project.status === "review");';
	if (!file.content.includes('reviewState')) {
		if (file.content.includes('\tconst summary = await getWorkspaceSummary();')) {
			file.content = file.content.replace('\tconst summary = await getWorkspaceSummary();', `\tconst summary = await getWorkspaceSummary();${snippet}`);
		} else {
			file.content = `${file.content}${snippet}`;
		}
		stagedChanges.value += 1;
		terminalLines.value.push('accepted inline completion in page.tsx');
	}
}

function handleCommand(event) {
	const value = event.value;
	lastCommand.value = value;
	if (value === 'open-dashboard-page') openFile('dashboard-page');
	if (value === 'open-mission-control') openFile('mission-control');
	if (value === 'review-changes') reviewOpen.value = true;
	if (value === 'settings') settingsOpen.value = true;
	if (value === 'toggle-agent-mode') agentMode.value = 'agent';
	if (value === 'run-tests') {
		activeBottomTab.value = 'terminal';
		terminalLines.value.push('$ npm run test -- MissionControl');
		terminalLines.value.push('PASS src/components/MissionControl.test.tsx');
	}
}

function handleWorkspaceMenu(event) {
	if (event.value === 'new-file') createDraftFile();
	if (event.value === 'command-palette') commandOpen.value = true;
	if (event.value === 'review-changes') reviewOpen.value = true;
	if (event.value === 'settings') settingsOpen.value = true;
	if (event.value === 'toggle-terminal') activeBottomTab.value = activeBottomTab.value === 'terminal' ? 'problems' : 'terminal';
}

function createDraftFile() {
	const id = `draft-${files.value.length + 1}`;
	files.value.push({
		id,
		name: 'AgentScratch.tsx',
		path: 'src/components/AgentScratch.tsx',
		language: 'tsx',
		status: 'A',
		content: [
			'export function AgentScratch() {',
			'\treturn <div>Draft a focused component here.</div>;',
			'}',
		].join('\n'),
	});
	const components = fileTree.value[0].children.find((item) => item.id === 'src-components');
	components?.children?.push({ id, label: 'AgentScratch.tsx', kind: 'file', language: 'tsx', status: 'A' });
	openFile(id);
}

function taskClass(task) {
	return task.id === selectedTask.value.id
		? 'border-[#6b84ff] bg-[#1d2542]'
		: 'border-[#2b3040] bg-[#171a23] hover:border-[#464d63]';
}

function fileIconClass(item) {
	return {
		folder: 'text-[#d6a65f]',
		'folder-open': 'text-[#d6a65f]',
		react: 'text-[#6fb7ff]',
		json: 'text-[#e8c36a]',
		rules: 'text-[#c78cff]',
		code: 'text-[#94a3b8]',
	}[iconFor(item)] || 'text-[#94a3b8]';
}

function statusClass(status) {
	return {
		M: 'text-[#e8c36a]',
		A: 'text-[#65d38b]',
		D: 'text-[#ff7a7a]',
	}[status] || 'text-[#667085]';
}

function activityButtonClass(value) {
	return value === 'files'
		? 'bg-[#2b3143] text-[#f4f6fb]'
		: 'text-[#a7adba] hover:bg-[#252a38] hover:text-[#f4f6fb]';
}
</script>

<template>
	<div class="cursor-workspace min-h-screen bg-[#0b0d12] text-[#d9deea]">
		<header class="flex h-10 items-center justify-between border-b border-[#242936] bg-[#11141b] px-3 text-xs text-[#9aa3b5]">
			<div class="flex min-w-0 items-center gap-3">
				<div class="flex items-center gap-1.5" aria-hidden="true">
					<span class="size-3 rounded-full bg-[#ff5f57]"></span>
					<span class="size-3 rounded-full bg-[#ffbd2e]"></span>
					<span class="size-3 rounded-full bg-[#28c840]"></span>
				</div>
				<DomPopover width="w-64" padding="p-1" :arrow="false" position="bottom-start" label="Workspace menu">
					<template #trigger>
						<button type="button" class="rounded px-2 py-1 font-medium text-[#d9deea] hover:bg-[#242936]">
							Cursor
						</button>
					</template>
					<DomMenu :items="workspaceMenuItems" :skin="false" @select="handleWorkspaceMenu" />
				</DomPopover>
				<div class="hidden items-center gap-2 md:flex">
					<button type="button" class="rounded px-2 py-1 hover:bg-[#242936]" @click="commandOpen = true">File</button>
					<button type="button" class="rounded px-2 py-1 hover:bg-[#242936]" @click="commandOpen = true">Edit</button>
					<button type="button" class="rounded px-2 py-1 hover:bg-[#242936]" @click="reviewOpen = true">Review</button>
				</div>
			</div>
			<button
				type="button"
				class="min-w-0 truncate rounded-full border border-[#2a3040] bg-[#151923] px-4 py-1 text-center text-[#c9d0df] shadow-inner shadow-black/30"
				@click="commandOpen = true"
			>
				~/cursor/acme-dashboard
				<span class="ml-2 text-[#6f7789]">Command K</span>
			</button>
			<div class="flex min-w-0 items-center gap-2">
				<span class="hidden rounded bg-[#18241d] px-2 py-1 text-[#75d99a] sm:inline">Indexed</span>
				<DomTooltip text="Open workspace settings">
					<button type="button" class="rounded px-2 py-1 hover:bg-[#242936]" @click="settingsOpen = true" aria-label="Workspace settings">
						<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" stroke-width="1.7" />
							<path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L14.2 3h-4.4l-.4 2.7a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7.6 7.6 0 0 0 2 1.2l.4 2.7h4.4l.4-2.7a7.6 7.6 0 0 0 2-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
						</svg>
					</button>
				</DomTooltip>
			</div>
		</header>

		<div class="grid min-h-[calc(100vh-2.5rem)] grid-cols-[3rem_minmax(0,1fr)]">
			<aside class="flex flex-col items-center border-r border-[#242936] bg-[#10131a] py-3">
				<div class="grid gap-2">
					<button
						v-for="item in ['files', 'search', 'agent', 'git', 'debug']"
						:key="item"
						type="button"
						class="grid size-9 place-items-center rounded-lg transition"
						:class="activityButtonClass(item)"
						:aria-label="item"
						@click="item === 'agent' ? (activeAssistantTab = 'chat') : commandOpen = true"
					>
						<svg v-if="item === 'files'" class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M5 4h6l2 2h6v14H5V4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
						</svg>
						<svg v-else-if="item === 'search'" class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="m15.5 15.5 4 4M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
						</svg>
						<svg v-else-if="item === 'agent'" class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M12 3v3M6.5 7.5 4.5 5.5M17.5 7.5l2-2M5 14a7 7 0 0 1 14 0v4H5v-4Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
							<path d="M9 14h.01M15 14h.01M10 18v2h4v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
						</svg>
						<svg v-else-if="item === 'git'" class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M7 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 0v10a2 2 0 1 0 2 2M17 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 0c0 3-10 3-10 7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
						<svg v-else class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M8 8V5.5A4 4 0 0 1 12 2a4 4 0 0 1 4 3.5V8M6 10h12v8a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4v-8Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
							<path d="M4 14H2M22 14h-2M4.5 20 3 21.5M19.5 20l1.5 1.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
						</svg>
					</button>
				</div>
				<div class="mt-auto grid gap-2">
					<button type="button" class="grid size-9 place-items-center rounded-lg text-[#a7adba] hover:bg-[#252a38]" @click="reviewOpen = true" aria-label="Review changes">
						<span class="relative">
							<svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path d="M5 5h14v14H5V5Zm4 4h6M9 13h6M9 17h3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
							</svg>
							<span class="absolute -right-2 -top-2 rounded-full bg-[#6b84ff] px-1 text-[10px] leading-4 text-white">{{ stagedChanges }}</span>
						</span>
					</button>
				</div>
			</aside>

			<DomSplitterPanel
				v-model:start-size="sidebarStartSize"
				v-model:end-size="assistantEndSize"
				:start-size="250"
				:end-size="380"
				:min-start="210"
				:min-main="520"
				:min-end="320"
				:handle-size="6"
				class="h-full bg-[#0f1117]"
				handle-class="bg-[#171b25] transition hover:bg-[#2d3445] focus-visible:bg-[#2d3445]"
				handle-indicator-class="bg-[#546079]/70 opacity-100"
			>
				<template #start>
					<section class="flex h-full min-h-0 flex-col bg-[#11141b]">
						<div class="flex h-10 items-center justify-between border-b border-[#242936] px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca5b8]">
							<span>Explorer</span>
							<button type="button" class="rounded px-1.5 py-1 text-[#cbd2df] hover:bg-[#242936]" @click="createDraftFile" aria-label="New file">
								<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
									<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
								</svg>
							</button>
						</div>
						<div class="border-b border-[#242936] px-3 py-2 text-xs text-[#8f98aa]">
							<div class="flex items-center justify-between">
								<span class="font-semibold text-[#c9d0df]">ACME-DASHBOARD</span>
								<span>{{ stagedChanges }}</span>
							</div>
						</div>
						<div class="min-h-0 flex-1 overflow-auto p-2">
							<DomTreeView
								v-model="selectedFileId"
								v-model:items="fileTree"
								:chrome="false"
								:draggable="true"
								density="compact"
								label="Project files"
								@select="selectFile"
							>
								<template #item="{ item, open }">
									<div class="flex min-w-0 flex-1 items-center gap-2 text-xs">
										<svg class="size-4 shrink-0" :class="fileIconClass({ ...item, open })" viewBox="0 0 24 24" fill="none" aria-hidden="true">
											<path
												v-if="item.kind === 'folder'"
												d="M4 6h6l2 2h8v10H4V6Z"
												stroke="currentColor"
												stroke-width="1.7"
												stroke-linejoin="round"
											/>
											<path
												v-else
												d="M6 4h8l4 4v12H6V4Zm8 0v5h5"
												stroke="currentColor"
												stroke-width="1.7"
												stroke-linejoin="round"
											/>
										</svg>
										<span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
										<span v-if="item.status" class="text-[10px] font-bold" :class="statusClass(item.status)">{{ item.status }}</span>
									</div>
								</template>
							</DomTreeView>
						</div>
						<div class="border-t border-[#242936] p-3">
							<div class="rounded-lg border border-[#2a3040] bg-[#161a24] p-3 text-xs">
								<div class="flex items-center justify-between text-[#d9deea]">
									<span>Codebase index</span>
									<span class="text-[#75d99a]">Ready</span>
								</div>
								<div class="mt-2 h-1.5 rounded-full bg-[#252b39]">
									<div class="h-full w-[92%] rounded-full bg-[#75d99a]"></div>
								</div>
								<p class="mt-2 text-[#8791a5]">1,284 files, 4 rules, 18 embeddings updated.</p>
							</div>
						</div>
					</section>
				</template>

				<div class="flex h-full min-h-0 flex-col bg-[#0f1117]">
					<div class="flex h-10 shrink-0 items-center overflow-x-auto border-b border-[#242936] bg-[#121620]">
						<div
							v-for="file in openTabs"
							:key="file.id"
							role="button"
							tabindex="0"
							:aria-label="`Open ${file.name}`"
							class="group flex h-full min-w-40 max-w-56 items-center gap-2 border-r border-[#242936] px-3 text-left text-xs transition"
							:class="file.id === activeFileId ? 'bg-[#171b25] text-[#f2f5fb]' : 'bg-[#121620] text-[#9aa3b5] hover:bg-[#151923]'"
							@click="openFile(file.id)"
							@keydown.enter.prevent="openFile(file.id)"
							@keydown.space.prevent="openFile(file.id)"
						>
							<span class="size-2 rounded-full" :class="file.status ? 'bg-[#e8c36a]' : 'bg-[#4b5568]'"></span>
							<span class="min-w-0 flex-1 truncate">{{ file.name }}</span>
							<button
								type="button"
								class="grid size-5 place-items-center rounded text-[#778194] opacity-0 hover:bg-[#2a3040] hover:text-[#f2f5fb] group-hover:opacity-100"
								aria-label="Close tab"
								@click="closeTab(file.id, $event)"
							>
								<svg class="size-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
									<path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
								</svg>
							</button>
						</div>
					</div>

					<div class="flex h-8 shrink-0 items-center justify-between border-b border-[#242936] bg-[#10131a] px-3 text-xs text-[#8791a5]">
						<div class="min-w-0 truncate">
							<span class="text-[#c4cad6]">{{ activeFile.name }}</span>
							<span class="mx-2">/</span>
							<span>{{ activeFile.path }}</span>
						</div>
						<div class="hidden items-center gap-3 sm:flex">
							<button type="button" class="hover:text-[#f2f5fb]" @click="acceptInlineCompletion">Tab accept</button>
							<button type="button" class="hover:text-[#f2f5fb]" @click="reviewOpen = true">Review</button>
						</div>
					</div>

					<div class="relative min-h-0 flex-1 overflow-hidden">
						<div class="grid h-full grid-cols-[3.25rem_minmax(0,1fr)] overflow-hidden">
							<div class="select-none overflow-hidden border-r border-[#1c2230] bg-[#0d1017] py-4 text-right font-mono text-xs leading-6 text-[#4f586d]">
								<div v-for="line in lineNumbers" :key="line" class="px-3">{{ line }}</div>
							</div>
							<textarea
								:key="activeFile.id"
								v-model="activeContent"
								spellcheck="false"
								class="cursor-editor h-full w-full resize-none overflow-auto border-0 bg-[#0f1117] p-4 font-mono text-[13px] leading-6 text-[#d7deed] outline-none"
								:aria-label="`Editing ${activeFile.name}`"
							></textarea>
						</div>
						<div class="pointer-events-none absolute right-5 top-5 rounded-md border border-[#2f3650] bg-[#151a27]/95 px-3 py-2 text-xs text-[#9fa8bb] shadow-xl shadow-black/30">
							<span class="text-[#75d99a]">Tab</span>
							<span class="ml-2">predicts next edit in {{ activeFile.name }}</span>
						</div>
						<button
							type="button"
							class="absolute bottom-5 right-5 rounded-md border border-[#38425c] bg-[#1a2133] px-3 py-2 text-xs font-medium text-[#dbe4ff] shadow-xl shadow-black/30 transition hover:bg-[#243050]"
							@click="acceptInlineCompletion"
						>
							Accept inline completion
						</button>
					</div>

					<div class="h-48 shrink-0 border-t border-[#242936] bg-[#10131a]">
						<DomTabs v-model="activeBottomTab" :tabs="bottomTabs" fill>
							<template #terminal>
								<div class="h-full overflow-auto bg-[#0c0f15] p-3 font-mono text-xs leading-6 text-[#b9c3d4]">
									<p v-for="(line, index) in terminalLines" :key="`${line}-${index}`" :class="line.startsWith('PASS') ? 'text-[#75d99a]' : ''">
										{{ line }}
									</p>
								</div>
							</template>
							<template #problems>
								<div class="h-full overflow-auto divide-y divide-[#222838] text-xs">
									<div v-for="problem in problemItems" :key="`${problem.file}-${problem.line}`" class="grid grid-cols-[5rem_1fr] gap-3 px-4 py-3">
										<span class="capitalize" :class="problem.severity === 'warning' ? 'text-[#e8c36a]' : 'text-[#8aa7ff]'">{{ problem.severity }}</span>
										<p class="text-[#c9d0df]">
											<span class="text-[#8f98aa]">{{ problem.file }}:{{ problem.line }}</span>
											{{ problem.message }}
										</p>
									</div>
								</div>
							</template>
							<template #output>
								<div class="grid h-full place-items-center p-4 text-center text-sm text-[#9aa3b5]">
									<div>
										<p class="text-[#d9deea]">Agent output channel</p>
										<p class="mt-1 text-xs">Last command: {{ lastCommand }}</p>
									</div>
								</div>
							</template>
						</DomTabs>
					</div>
				</div>

				<template #end>
					<aside class="flex h-full min-h-0 flex-col border-l border-[#242936] bg-[#11141b]">
						<div class="flex h-10 items-center justify-between border-b border-[#242936] px-3">
							<div class="flex min-w-0 items-center gap-2">
								<span class="grid size-6 place-items-center rounded-md bg-[#20283a] text-[#8aa7ff]">
									<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
										<path d="M12 3v3M6.5 7.5 4.5 5.5M17.5 7.5l2-2M5 14a7 7 0 0 1 14 0v4H5v-4Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</span>
								<span class="truncate text-sm font-semibold text-[#e8edf7]">Agent</span>
							</div>
							<DomPopover width="w-72" padding="p-3" position="bottom-end" label="Model picker">
								<template #trigger>
									<button type="button" class="rounded-md border border-[#2a3040] px-2 py-1 text-xs text-[#cbd2df] hover:bg-[#1b2030]">
										{{ activeModelLabel }}
									</button>
								</template>
								<div class="grid gap-3 text-xs text-[#cbd2df]">
									<label class="grid gap-1">
										<span class="font-medium">Model</span>
										<DomNativeSelect v-model="selectedModel" :options="modelOptions" />
									</label>
									<DomCheckbox v-model="includeWorkspace" label="Include workspace index" description="Use files, rules, and symbols." />
									<DomCheckbox v-model="includeTerminal" label="Include terminal output" description="Let the agent read recent command output." />
								</div>
							</DomPopover>
						</div>

						<div class="border-b border-[#242936] px-3 py-3">
							<DomToggleButtonGroup
								v-model="agentMode"
								:options="modeOptions"
								size="sm"
								label="Agent mode"
								chrome="none"
							/>
						</div>

						<div class="min-h-0 flex-1">
							<DomTabs v-model="activeAssistantTab" :tabs="assistantTabs" fill>
								<template #chat>
									<div class="flex h-full min-h-0 flex-col">
										<div data-chat-scroll class="min-h-0 flex-1 overflow-auto p-3">
											<div class="space-y-3">
												<div
													v-for="message in chatMessages"
													:key="message.id"
													class="rounded-lg border p-3 text-sm"
													:class="message.role === 'user' ? 'border-[#38425a] bg-[#1a2030]' : 'border-[#293144] bg-[#151923]'"
												>
													<div class="flex items-center justify-between gap-3 text-xs">
														<span class="font-semibold text-[#e8edf7]">{{ message.author }}</span>
														<span v-if="message.meta" class="truncate text-[#7f899c]">{{ message.meta }}</span>
													</div>
													<p class="mt-2 leading-6 text-[#c6cedd]">{{ message.body }}</p>
												</div>
											</div>
										</div>
										<div class="border-t border-[#242936] p-3">
											<div class="rounded-lg border border-[#2c3448] bg-[#0f1219] p-2">
												<textarea
													v-model="composerText"
													class="min-h-24 w-full resize-none border-0 bg-transparent p-2 text-sm leading-6 text-[#e1e7f2] outline-none placeholder:text-[#687287]"
													placeholder="Ask Agent to build, search, or edit..."
													@keydown.meta.enter.prevent="runAgent"
													@keydown.ctrl.enter.prevent="runAgent"
												></textarea>
												<div class="flex items-center justify-between gap-2 border-t border-[#252b39] px-2 pt-2">
													<span class="text-xs text-[#778194]">/ commands - @ files - ! shell</span>
													<DomButton size="sm" @click="runAgent">
														<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
															<path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
														</svg>
														Send
													</DomButton>
												</div>
											</div>
										</div>
									</div>
								</template>

								<template #tasks>
									<div class="h-full overflow-auto p-3">
										<div class="space-y-3">
											<button
												v-for="task in tasks"
												:key="task.id"
												type="button"
												class="w-full rounded-lg border p-3 text-left transition"
												:class="taskClass(task)"
												@click="selectedTaskId = task.id"
											>
												<div class="flex items-start justify-between gap-3">
													<div class="min-w-0">
														<p class="truncate text-sm font-semibold text-[#edf2fb]">{{ task.title }}</p>
														<p class="mt-1 text-xs text-[#9aa3b5]">{{ task.detail }}</p>
													</div>
													<span class="rounded-full bg-[#20283a] px-2 py-1 text-[10px] font-semibold text-[#cbd6ff]">{{ task.state }}</span>
												</div>
												<div class="mt-3 h-1.5 rounded-full bg-[#252b39]">
													<div class="h-full rounded-full bg-[#8aa7ff]" :style="{ width: `${task.progress}%` }"></div>
												</div>
												<p class="mt-2 text-xs text-[#7f899c]">{{ task.files.join(', ') }}</p>
											</button>
										</div>
									</div>
								</template>

								<template #rules>
									<div class="h-full overflow-auto p-4 text-sm leading-7 text-[#c2cad8]">
										<div class="rounded-lg border border-[#2a3040] bg-[#151923] p-4">
											<p class="font-semibold text-[#eef3fb]">Rules in context</p>
											<ul class="mt-3 space-y-2 text-xs text-[#9aa3b5]">
												<li>Prefer small, reviewable commits.</li>
												<li>Preserve existing design tokens and route conventions.</li>
												<li>Run focused tests before proposing a final patch.</li>
											</ul>
										</div>
										<label class="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[#2a3040] bg-[#151923] p-3">
											<span>
												<span class="block text-sm font-medium text-[#eef3fb]">Auto-apply low-risk edits</span>
												<span class="text-xs text-[#8791a5]">Only comments, imports, and formatting patches.</span>
											</span>
											<DomToggle v-model="autoApplyLowRisk" />
										</label>
									</div>
								</template>
							</DomTabs>
						</div>
					</aside>
				</template>
			</DomSplitterPanel>
		</div>

		<DomCommandPalette
			v-model="commandOpen"
			:commands="commandItems"
			placeholder="Search files, commands, and agent actions..."
			@select="handleCommand"
		/>

		<DomDrawer v-model="reviewOpen" title="Review agent changes" width="var(--container-2xl)">
			<div class="grid gap-4 p-4 text-sm text-[#c6cedd]">
				<div class="rounded-lg border border-[#2a3040] bg-[#151923] p-4">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.12em] text-[#8f98aa]">Patch summary</p>
							<h3 class="mt-1 text-lg font-semibold text-[#eef3fb]">Mission-control dashboard pass</h3>
							<p class="mt-2 max-w-2xl leading-6 text-[#9aa3b5]">
								The agent proposes a focused UI update across the dashboard route, project preview component, and workspace data helper.
							</p>
						</div>
						<span class="rounded-full bg-[#18241d] px-3 py-1 text-xs font-semibold text-[#75d99a]">Low risk</span>
					</div>
				</div>

				<div class="grid gap-3">
					<div v-for="item in reviewItems" :key="item.id" class="rounded-lg border border-[#2a3040] bg-[#10131a] p-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="truncate font-mono text-xs text-[#8aa7ff]">{{ item.file }}</p>
								<p class="mt-2 text-sm leading-6">{{ item.summary }}</p>
							</div>
							<span class="rounded bg-[#20283a] px-2 py-1 text-xs text-[#cbd6ff]">{{ item.status }}</span>
						</div>
					</div>
				</div>

				<div class="rounded-lg border border-[#2a3040] bg-[#0c0f15] p-4 font-mono text-xs leading-6">
					<p class="text-[#75d99a]">+ const reviewState = summary.projects.filter((project) =&gt; project.status === "review");</p>
					<p class="text-[#75d99a]">+ &lt;MissionControl projects=&#123;summary.projects&#125; reviewState=&#123;reviewState&#125; /&gt;</p>
					<p class="text-[#ff9a9a]">- &lt;MissionControl projects=&#123;summary.projects&#125; /&gt;</p>
				</div>
			</div>
			<template #footer>
				<div class="flex flex-wrap justify-end gap-2">
					<DomButton variant="ghost" @click="reviewOpen = false">Cancel</DomButton>
					<DomButton variant="secondary" @click="commandOpen = true">Ask follow-up</DomButton>
					<DomButton @click="applySuggestion">Apply patch</DomButton>
				</div>
			</template>
		</DomDrawer>

		<DomDrawer v-model="settingsOpen" title="Workspace settings" width="var(--container-md)">
			<div class="grid gap-5 p-4 text-sm text-[#c6cedd]">
				<label class="grid gap-2">
					<span class="font-medium text-[#eef3fb]">Default model</span>
					<DomNativeSelect v-model="selectedModel" :options="modelOptions" />
				</label>
				<div class="rounded-lg border border-[#2a3040] bg-[#151923] p-4">
					<p class="font-medium text-[#eef3fb]">Context sources</p>
					<div class="mt-4 grid gap-4">
						<DomCheckbox v-model="includeWorkspace" label="Workspace index" description="Files, symbols, and project rules." />
						<DomCheckbox v-model="includeTerminal" label="Terminal output" description="Recent test, lint, and shell output." />
						<DomCheckbox v-model="autoApplyLowRisk" label="Auto-apply low-risk edits" description="Formatting, imports, and doc comments." />
					</div>
				</div>
				<div class="rounded-lg border border-[#2a3040] bg-[#151923] p-4">
					<p class="font-medium text-[#eef3fb]">Current branch</p>
					<p class="mt-2 text-xs text-[#9aa3b5]">{{ branchSummary }}</p>
				</div>
			</div>
		</DomDrawer>
	</div>
</template>

<style scoped>
.cursor-workspace :deep(.skin-action) {
	--skin-bg: #6b84ff;
	--skin-fg: #ffffff;
	--skin-border: #8aa0ff;
}

.cursor-workspace :deep(.skin-control),
.cursor-workspace :deep(.skin-card),
.cursor-workspace :deep(.skin-popover),
.cursor-workspace :deep(.skin-overlay) {
	--skin-bg: #151923;
	--skin-fg: #dbe3f1;
	--skin-border: #2b3040;
	color: #dbe3f1;
}

.cursor-workspace :deep(.skin-popover),
.cursor-workspace :deep(.skin-overlay) {
	background: #151923;
	border-color: #2b3040;
	box-shadow: 0 24px 80px rgb(0 0 0 / 48%);
}

.cursor-workspace :deep(dom-tabs [role="tablist"]) {
	border: 0;
	border-radius: 0;
	background: #10131a;
	padding: 0.35rem 0.5rem 0;
}

.cursor-workspace :deep(dom-tabs [role="tab"]) {
	border-radius: 0.35rem 0.35rem 0 0;
	padding: 0.42rem 0.75rem;
	color: #8f98aa;
}

.cursor-workspace :deep(dom-tabs [role="tab"][data-active]) {
	background: #171b25;
	color: #eef3fb;
	box-shadow: none;
}

.cursor-workspace :deep([role="treeitem"]) {
	color: #b7c0cf;
}

.cursor-workspace :deep([role="treeitem"][aria-selected="true"]) {
	background: #26304a;
	color: #eef3fb;
}

.cursor-editor {
	tab-size: 4;
	caret-color: #8aa7ff;
}

.cursor-editor::selection {
	background: rgb(107 132 255 / 35%);
}
</style>
