<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomCard, DomNativeSelect, DomTabs } from '@getdom/studio/vue';

const tabs = [
	{ key: 'mapping', label: 'Map fields' },
	{ key: 'review', label: 'Review' },
];

const uploadSteps = [
	{ label: 'Upload', state: 'Complete' },
	{ label: 'Map fields', state: 'In progress' },
	{ label: 'Validate', state: 'Queued' },
	{ label: 'Import', state: 'Ready next' },
];

const sourceColumns = [
	{ label: 'Company', value: 'Company' },
	{ label: 'Primary email', value: 'Primary email' },
	{ label: 'Lifecycle stage', value: 'Lifecycle stage' },
	{ label: 'Plan', value: 'Plan' },
	{ label: 'Seats', value: 'Seats' },
	{ label: 'Renewal date', value: 'Renewal date' },
	{ label: 'Owner', value: 'Owner' },
	{ label: 'Do not import', value: 'skip' },
];

const targetFields = [
	{
		key: 'companyName',
		label: 'Company name',
		required: true,
		type: 'Text',
		example: 'Northstar Labs',
	},
	{
		key: 'email',
		label: 'Primary email',
		required: true,
		type: 'Email',
		example: 'ops@northstar.example',
	},
	{
		key: 'stage',
		label: 'Lifecycle stage',
		required: false,
		type: 'Segment',
		example: 'Customer',
	},
	{
		key: 'plan',
		label: 'Plan',
		required: false,
		type: 'Plan',
		example: 'Scale',
	},
	{
		key: 'seats',
		label: 'Seats',
		required: false,
		type: 'Number',
		example: '42',
	},
	{
		key: 'renewalDate',
		label: 'Renewal date',
		required: false,
		type: 'Date',
		example: '2026-08-14',
	},
];

const previewRows = [
	{
		company: 'Northstar Labs',
		email: 'ops@northstar.example',
		stage: 'Customer',
		plan: 'Scale',
		status: 'Ready',
	},
	{
		company: 'Harbor Finance',
		email: 'billing@harbor.example',
		stage: 'Lead',
		plan: 'Business',
		status: 'Warning',
	},
	{
		company: 'Atlas Robotics',
		email: 'admin@atlas.example',
		stage: 'Customer',
		plan: 'Enterprise',
		status: 'Ready',
	},
	{
		company: 'Bluebird Retail',
		email: '',
		stage: 'Trial',
		plan: 'Starter',
		status: 'Blocked',
	},
];

const validationIssues = [
	{
		level: 'Blocked',
		count: 16,
		title: 'Missing primary email',
		description: 'Rows cannot create customers until the email field is mapped or corrected.',
	},
	{
		level: 'Warning',
		count: 34,
		title: 'Unknown lifecycle stage',
		description: 'Values will import as Unqualified unless you add stage aliases.',
	},
	{
		level: 'Warning',
		count: 18,
		title: 'Renewal date format',
		description: 'Dates using DD/MM/YYYY will be normalized before the job runs.',
	},
];

const mapping = ref({
	companyName: 'Company',
	email: 'Primary email',
	stage: 'Lifecycle stage',
	plan: 'Plan',
	seats: 'Seats',
	renewalDate: 'Renewal date',
});
const activeTab = ref('mapping');
const importMode = ref('valid');

const mappedRequiredCount = computed(() => targetFields.filter((field) => field.required && mapping.value[field.key] !== 'skip').length);
const requiredCount = computed(() => targetFields.filter((field) => field.required).length);
const mappedCount = computed(() => targetFields.filter((field) => mapping.value[field.key] !== 'skip').length);
const readiness = computed(() => Math.round((mappedCount.value / targetFields.length) * 100));
const importableRows = computed(() => (importMode.value === 'valid' ? '1,216' : '1,284'));

function issueClasses(level) {
	return level === 'Blocked'
		? 'bg-destructive/15 text-destructive'
		: 'bg-warning/15 text-warning';
}

function rowStatusClasses(status) {
	return {
		Ready: 'bg-success/15 text-success',
		Warning: 'bg-warning/15 text-warning',
		Blocked: 'bg-destructive/15 text-destructive',
	}[status] || 'bg-secondary text-muted-fg';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-raised px-4 py-4 sm:px-6">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Data import</p>
					<h3 class="mt-1 text-xl font-semibold tracking-tight">Import customers from CSV</h3>
					<p class="mt-1 max-w-2xl text-sm leading-6 text-muted-fg">
						Map columns, catch risky rows, and approve an import job before customer records are created.
					</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<DomButton variant="secondary" size="sm">Download errors</DomButton>
					<DomButton size="sm">Approve import</DomButton>
				</div>
			</div>

			<div class="mt-5 grid gap-2 sm:grid-cols-4">
				<div
					v-for="step in uploadSteps"
					:key="step.label"
					class="rounded-xl border border-border bg-background p-3"
				>
					<div class="flex items-center justify-between gap-3">
						<p class="text-sm font-semibold">{{ step.label }}</p>
						<span class="size-2 rounded-full" :class="step.state === 'Complete' ? 'bg-success' : step.state === 'In progress' ? 'bg-primary' : 'bg-muted-fg/35'"></span>
					</div>
					<p class="mt-1 text-xs text-muted-fg">{{ step.state }}</p>
				</div>
			</div>
		</header>

		<div class="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
			<main class="min-w-0 border-b border-border p-4 sm:p-6 lg:border-b-0 lg:border-r">
				<DomTabs v-model="activeTab" :tabs="tabs">
					<template #mapping>
						<div class="grid gap-3">
							<div
								v-for="field in targetFields"
								:key="field.key"
								class="grid gap-3 rounded-xl border border-border bg-background p-4 md:grid-cols-[minmax(0,1fr)_16rem]"
							>
								<div class="min-w-0">
									<div class="flex flex-wrap items-center gap-2">
										<p class="font-semibold">{{ field.label }}</p>
										<span v-if="field.required" class="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">Required</span>
										<span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-fg">{{ field.type }}</span>
									</div>
									<p class="mt-1 text-sm text-muted-fg">Example value: {{ field.example }}</p>
								</div>
								<DomNativeSelect
									v-model="mapping[field.key]"
									:options="sourceColumns"
									placeholder="Choose source column"
								/>
							</div>
						</div>
					</template>

					<template #review>
						<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
							<div class="overflow-x-auto rounded-xl border border-border">
								<div class="min-w-[42rem]">
									<div class="grid grid-cols-[1.2fr_1.4fr_1fr_1fr_6rem] gap-3 border-b border-border skin-raised px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">
										<span>Company</span>
										<span>Email</span>
										<span>Stage</span>
										<span>Plan</span>
										<span>Status</span>
									</div>
									<div
										v-for="row in previewRows"
										:key="row.company"
										class="grid grid-cols-[1.2fr_1.4fr_1fr_1fr_6rem] gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0"
									>
										<span class="min-w-0 truncate font-medium">{{ row.company }}</span>
										<span class="min-w-0 truncate text-muted-fg">{{ row.email || 'Missing' }}</span>
										<span class="text-muted-fg">{{ row.stage }}</span>
										<span class="text-muted-fg">{{ row.plan }}</span>
										<span class="rounded-full px-2 py-0.5 text-center text-[11px] font-semibold" :class="rowStatusClasses(row.status)">
											{{ row.status }}
										</span>
									</div>
								</div>
							</div>

							<DomCard padding="sm">
								<h4 class="text-sm font-semibold">Import mode</h4>
								<div class="mt-3 space-y-2">
									<label class="flex items-start gap-2 rounded-lg border border-border p-3 text-sm">
										<input v-model="importMode" type="radio" value="valid" class="mt-1 size-4 accent-current" />
										<span>
											<span class="block font-semibold">Import valid rows</span>
											<span class="block text-muted-fg">Skip blocked rows and export them for cleanup.</span>
										</span>
									</label>
									<label class="flex items-start gap-2 rounded-lg border border-border p-3 text-sm">
										<input v-model="importMode" type="radio" value="all" class="mt-1 size-4 accent-current" />
										<span>
											<span class="block font-semibold">Import everything</span>
											<span class="block text-muted-fg">Create records and keep issues flagged.</span>
										</span>
									</label>
								</div>
							</DomCard>
						</div>
					</template>
				</DomTabs>
			</main>

			<aside class="space-y-4 skin-raised p-4 sm:p-6">
				<DomCard padding="sm">
					<div class="flex items-center justify-between gap-3">
						<div>
							<p class="text-sm font-semibold">customer-import-june.csv</p>
							<p class="text-xs text-muted-fg">1,284 rows / 7 columns</p>
						</div>
						<span class="rounded-full bg-success/15 px-2 py-1 text-xs font-semibold text-success">Parsed</span>
					</div>
					<div class="mt-4">
						<div class="flex justify-between text-xs text-muted-fg">
							<span>Mapping readiness</span>
							<span>{{ readiness }}%</span>
						</div>
						<div class="mt-2 h-2 rounded-full bg-secondary">
							<div class="h-full rounded-full bg-primary" :style="{ width: `${readiness}%` }"></div>
						</div>
					</div>
				</DomCard>

				<div class="grid grid-cols-3 gap-2 text-center">
					<div class="rounded-xl border border-border bg-background p-3">
						<p class="text-lg font-semibold">{{ mappedRequiredCount }}/{{ requiredCount }}</p>
						<p class="text-[11px] text-muted-fg">Required</p>
					</div>
					<div class="rounded-xl border border-border bg-background p-3">
						<p class="text-lg font-semibold">52</p>
						<p class="text-[11px] text-muted-fg">Warnings</p>
					</div>
					<div class="rounded-xl border border-border bg-background p-3">
						<p class="text-lg font-semibold">16</p>
						<p class="text-[11px] text-muted-fg">Blocked</p>
					</div>
				</div>

				<DomCard padding="sm">
					<h4 class="text-sm font-semibold">Validation issues</h4>
					<div class="mt-3 space-y-3">
						<div
							v-for="issue in validationIssues"
							:key="issue.title"
							class="rounded-xl border border-border bg-background p-3"
						>
							<div class="flex items-start justify-between gap-3">
								<p class="text-sm font-semibold">{{ issue.title }}</p>
								<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="issueClasses(issue.level)">
									{{ issue.count }}
								</span>
							</div>
							<p class="mt-2 text-xs leading-5 text-muted-fg">{{ issue.description }}</p>
						</div>
					</div>
				</DomCard>

				<DomCard padding="sm">
					<h4 class="text-sm font-semibold">Ready to create</h4>
					<p class="mt-2 text-3xl font-semibold tracking-tight">{{ importableRows }}</p>
					<p class="mt-1 text-sm text-muted-fg">Customer records will be queued for background import.</p>
					<DomButton class="mt-4 w-full">Start import job</DomButton>
				</DomCard>
			</aside>
		</div>
	</div>
</template>
