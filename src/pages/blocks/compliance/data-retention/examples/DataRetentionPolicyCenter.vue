<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomNativeSelect, DomToggle } from '@getdom/studio/vue';

const selectedClassId = ref('messages');
const environment = ref('production');
const retentionDays = ref(365);
const archiveAfterDays = ref(180);
const anonymizeBeforeDelete = ref(true);
const requireApproval = ref(true);
const selectedAction = ref('Anonymize then delete');

const environments = [
	{ label: 'Production', value: 'production' },
	{ label: 'Staging', value: 'staging' },
	{ label: 'EU region', value: 'eu' },
];

const dataClasses = [
	{
		id: 'messages',
		name: 'Customer messages',
		description: 'Chat transcripts, attachments, reactions, and message metadata.',
		owner: 'Support Ops',
		records: '18.4k',
		status: 'Ready',
		risk: 'Medium',
		currentRetention: 365,
		legalHoldRecords: 240,
		nextRun: 'Jun 17, 02:00',
	},
	{
		id: 'files',
		name: 'Uploaded files',
		description: 'Documents, images, and generated exports attached to projects.',
		owner: 'Product',
		records: '9.8k',
		status: 'Needs review',
		risk: 'High',
		currentRetention: 730,
		legalHoldRecords: 96,
		nextRun: 'Paused',
	},
	{
		id: 'analytics',
		name: 'Analytics events',
		description: 'Usage telemetry used for product analytics and adoption reports.',
		owner: 'Data',
		records: '2.1m',
		status: 'Ready',
		risk: 'Low',
		currentRetention: 180,
		legalHoldRecords: 0,
		nextRun: 'Jun 12, 01:30',
	},
];

const actions = [
	{ label: 'Anonymize then delete', value: 'Anonymize then delete' },
	{ label: 'Archive only', value: 'Archive only' },
	{ label: 'Delete permanently', value: 'Delete permanently' },
];

const legalHolds = [
	{ name: 'Enterprise dispute', scope: '240 message records', owner: 'Legal', expires: 'No expiry' },
	{ name: 'Security investigation', scope: '42 file records', owner: 'Security', expires: 'Jun 28' },
	{ name: 'Billing evidence', scope: '13 account records', owner: 'Finance', expires: 'Jul 5' },
];

const deletionPreview = [
	{ label: 'Eligible records', value: '18,420', tone: 'text-canvas-fg' },
	{ label: 'Blocked by holds', value: '240', tone: 'text-warning' },
	{ label: 'Archived first', value: '12,960', tone: 'text-primary' },
	{ label: 'First job window', value: 'Jun 17', tone: 'text-success' },
];

const auditEvents = [
	{ label: 'Archive window reduced to 180 days', actor: 'Priya Shah', time: 'Today 10:18' },
	{ label: 'Legal approval requested', actor: 'Retention policy', time: 'Today 10:12' },
	{ label: 'EU workspace override reviewed', actor: 'Owen Lee', time: 'Yesterday 16:44' },
];

const selectedClass = computed(() => dataClasses.find((item) => item.id === selectedClassId.value) || dataClasses[0]);
const publishReady = computed(() => retentionDays.value >= 30 && archiveAfterDays.value < retentionDays.value && requireApproval.value);
const policyScore = computed(() => {
	let score = 42;
	if (anonymizeBeforeDelete.value) score += 18;
	if (requireApproval.value) score += 14;
	if (archiveAfterDays.value < retentionDays.value) score += 14;
	if (selectedClass.value.legalHoldRecords === 0) score += 8;
	return Math.min(score, 100);
});
const scoreWidth = computed(() => `${policyScore.value}%`);

function selectClass(id) {
	selectedClassId.value = id;
	retentionDays.value = dataClasses.find((item) => item.id === id)?.currentRetention || 365;
	archiveAfterDays.value = Math.min(180, Math.max(30, retentionDays.value - 90));
}
</script>

<template>
	<div class="w-full max-w-7xl overflow-hidden rounded-3xl border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-5 py-5 sm:px-7">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Compliance</p>
					<h3 class="mt-2 text-2xl font-semibold tracking-tight">Data retention policy center</h3>
					<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">
						Help workspace admins understand what will be archived, anonymized, deleted, or protected before a lifecycle rule goes live.
					</p>
				</div>
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
					<DomNativeSelect v-model="environment" :options="environments" class="sm:w-40" />
					<DomButton :variant="publishReady ? 'primary' : 'secondary'">Publish policy</DomButton>
				</div>
			</div>
		</header>

		<div class="grid lg:grid-cols-[18rem_minmax(0,1fr)_21rem]">
			<aside class="border-b border-border bg-secondary/30 lg:border-b-0 lg:border-r">
				<div class="px-5 py-4">
					<div class="flex items-center justify-between gap-3">
						<h4 class="text-sm font-semibold">Data classes</h4>
						<span class="rounded-full bg-canvas px-2 py-1 text-xs font-semibold text-muted-fg">{{ dataClasses.length }}</span>
					</div>
				</div>
				<div class="grid">
					<button
						v-for="item in dataClasses"
						:key="item.id"
						type="button"
						class="border-t border-border px-5 py-4 text-left transition hover:bg-canvas/70"
						:class="selectedClassId === item.id ? 'bg-canvas' : ''"
						@click="selectClass(item.id)"
					>
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="truncate text-sm font-semibold">{{ item.name }}</p>
								<p class="mt-1 line-clamp-2 text-xs leading-5 text-muted-fg">{{ item.description }}</p>
							</div>
							<span
								class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
								:class="item.status === 'Ready' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'"
							>
								{{ item.status }}
							</span>
						</div>
						<div class="mt-4 grid grid-cols-3 gap-2 text-xs">
							<div>
								<p class="text-muted-fg">Records</p>
								<p class="mt-1 font-semibold">{{ item.records }}</p>
							</div>
							<div>
								<p class="text-muted-fg">Owner</p>
								<p class="mt-1 truncate font-semibold">{{ item.owner }}</p>
							</div>
							<div>
								<p class="text-muted-fg">Risk</p>
								<p class="mt-1 font-semibold">{{ item.risk }}</p>
							</div>
						</div>
					</button>
				</div>
			</aside>

			<main class="min-w-0">
				<section class="border-b border-border px-5 py-5 sm:px-7">
					<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Selected policy</p>
							<h4 class="mt-2 text-xl font-semibold tracking-tight">{{ selectedClass.name }}</h4>
							<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">{{ selectedClass.description }}</p>
						</div>
						<div class="rounded-2xl bg-secondary px-4 py-3 text-sm">
							<p class="text-muted-fg">Next deletion run</p>
							<p class="mt-1 font-semibold">{{ selectedClass.nextRun }}</p>
						</div>
					</div>
				</section>

				<section class="grid gap-6 border-b border-border px-5 py-6 sm:px-7 xl:grid-cols-2">
					<div>
						<div class="flex items-center justify-between gap-4">
							<label for="retention-days" class="text-sm font-semibold">Retention window</label>
							<span class="text-sm font-semibold">{{ retentionDays }} days</span>
						</div>
						<input
							id="retention-days"
							v-model.number="retentionDays"
							type="range"
							min="30"
							max="1095"
							step="30"
							class="mt-4 w-full accent-primary"
						>
						<div class="mt-2 flex justify-between text-xs text-muted-fg">
							<span>30 days</span>
							<span>3 years</span>
						</div>
					</div>

					<div>
						<div class="flex items-center justify-between gap-4">
							<label for="archive-days" class="text-sm font-semibold">Archive after</label>
							<span class="text-sm font-semibold">{{ archiveAfterDays }} days</span>
						</div>
						<input
							id="archive-days"
							v-model.number="archiveAfterDays"
							type="range"
							min="30"
							:max="retentionDays"
							step="30"
							class="mt-4 w-full accent-primary"
						>
						<div class="mt-2 flex justify-between text-xs text-muted-fg">
							<span>Fast archive</span>
							<span>Before deletion</span>
						</div>
					</div>
				</section>

				<section class="grid gap-6 border-b border-border px-5 py-6 sm:px-7 xl:grid-cols-[minmax(0,1fr)_18rem]">
					<div>
						<h4 class="text-sm font-semibold">Lifecycle action</h4>
						<div class="mt-3 grid gap-2 sm:grid-cols-3">
							<button
								v-for="action in actions"
								:key="action.value"
								type="button"
								class="rounded-xl border border-border px-3 py-3 text-left text-sm transition hover:border-primary/50"
								:class="selectedAction === action.value ? 'bg-primary/10 text-primary ring-1 ring-primary/25' : 'bg-canvas'"
								@click="selectedAction = action.value"
							>
								<span class="font-semibold">{{ action.label }}</span>
							</button>
						</div>
						<div class="mt-5 grid gap-4 sm:grid-cols-2">
							<label class="flex items-start justify-between gap-4 rounded-2xl bg-secondary/60 p-4">
								<span>
									<span class="block text-sm font-semibold">Anonymize before delete</span>
									<span class="mt-1 block text-xs leading-5 text-muted-fg">Remove personal fields before permanent deletion jobs run.</span>
								</span>
								<DomToggle v-model="anonymizeBeforeDelete" aria-label="Anonymize before delete" />
							</label>
							<label class="flex items-start justify-between gap-4 rounded-2xl bg-secondary/60 p-4">
								<span>
									<span class="block text-sm font-semibold">Require approval</span>
									<span class="mt-1 block text-xs leading-5 text-muted-fg">Route published changes through legal and security approval.</span>
								</span>
								<DomToggle v-model="requireApproval" aria-label="Require approval" />
							</label>
						</div>
					</div>

					<div class="rounded-2xl bg-secondary/60 p-4">
						<p class="text-sm font-semibold">Policy readiness</p>
						<div class="mt-4 h-2 overflow-hidden rounded-full bg-canvas">
							<div class="h-full rounded-full bg-primary" :style="{ width: scoreWidth }"></div>
						</div>
						<p class="mt-3 text-2xl font-semibold">{{ policyScore }}%</p>
						<p class="mt-1 text-xs leading-5 text-muted-fg">Based on approval, archive order, hold coverage, and safer deletion mode.</p>
					</div>
				</section>

				<section class="px-5 py-6 sm:px-7">
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h4 class="text-sm font-semibold">Deletion preview</h4>
							<p class="mt-1 text-sm text-muted-fg">Show concrete impact before the admin commits a policy version.</p>
						</div>
						<DomButton variant="secondary" size="sm">Recalculate</DomButton>
					</div>
					<div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						<div v-for="item in deletionPreview" :key="item.label" class="rounded-2xl border border-border px-4 py-3">
							<p class="text-xs font-medium text-muted-fg">{{ item.label }}</p>
							<p class="mt-2 text-xl font-semibold" :class="item.tone">{{ item.value }}</p>
						</div>
					</div>
				</section>
			</main>

			<aside class="border-t border-border bg-secondary/30 lg:border-l lg:border-t-0">
				<section class="border-b border-border px-5 py-5">
					<div class="flex items-center justify-between gap-3">
						<h4 class="text-sm font-semibold">Legal holds</h4>
						<DomButton variant="secondary" size="sm">Add hold</DomButton>
					</div>
					<div class="mt-4 grid gap-3">
						<div v-for="hold in legalHolds" :key="hold.name" class="rounded-2xl bg-canvas p-4">
							<div class="flex items-start justify-between gap-3">
								<p class="text-sm font-semibold">{{ hold.name }}</p>
								<span class="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">{{ hold.expires }}</span>
							</div>
							<p class="mt-2 text-xs leading-5 text-muted-fg">{{ hold.scope }}</p>
							<p class="mt-2 text-xs font-medium text-muted-fg">Owner: {{ hold.owner }}</p>
						</div>
					</div>
				</section>

				<section class="border-b border-border px-5 py-5">
					<h4 class="text-sm font-semibold">Safety checks</h4>
					<div class="mt-4 grid gap-3 text-sm">
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Archive before delete</span>
							<span class="font-semibold text-success">Passed</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Legal hold override</span>
							<span class="font-semibold text-success">Passed</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Approval route</span>
							<span :class="requireApproval ? 'text-success' : 'text-warning'" class="font-semibold">{{ requireApproval ? 'Passed' : 'Required' }}</span>
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-muted-fg">Minimum retention</span>
							<span :class="retentionDays >= 30 ? 'text-success' : 'text-warning'" class="font-semibold">{{ retentionDays >= 30 ? 'Passed' : 'Required' }}</span>
						</div>
					</div>
				</section>

				<section class="px-5 py-5">
					<h4 class="text-sm font-semibold">Activity</h4>
					<div class="mt-4 grid gap-4">
						<div v-for="event in auditEvents" :key="`${event.label}-${event.time}`" class="relative pl-5 text-sm before:absolute before:left-0 before:top-1.5 before:size-2 before:rounded-full before:bg-primary">
							<p class="font-medium">{{ event.label }}</p>
							<p class="mt-1 text-xs text-muted-fg">{{ event.actor }} / {{ event.time }}</p>
						</div>
					</div>
				</section>
			</aside>
		</div>
	</div>
</template>
