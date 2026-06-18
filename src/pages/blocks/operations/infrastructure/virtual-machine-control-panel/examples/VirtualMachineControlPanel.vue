<script setup>
import { computed, ref } from 'vue';
import {
	DomButton,
	DomNativeSelect,
	DomNumberInput,
	DomTextInput,
	DomTextareaInput,
	DomToggle,
} from '@getdom/studio/vue';

const projects = [
	{ label: 'Commerce production', value: 'commerce-prod', budget: 1200, requiresBackup: true, quota: 18 },
	{ label: 'Analytics platform', value: 'analytics', budget: 760, requiresBackup: true, quota: 12 },
	{ label: 'Sandbox lab', value: 'sandbox', budget: 280, requiresBackup: false, quota: 8 },
];

const regions = [
	{ label: 'London / LON1', value: 'lon1', capacity: 'Healthy', latency: '8 ms' },
	{ label: 'Frankfurt / FRA1', value: 'fra1', capacity: 'Healthy', latency: '17 ms' },
	{ label: 'New York / NYC2', value: 'nyc2', capacity: 'Limited', latency: '72 ms' },
	{ label: 'Singapore / SIN1', value: 'sin1', capacity: 'Healthy', latency: '162 ms' },
];

const images = [
	{ label: 'Ubuntu 24.04 LTS', value: 'ubuntu-24-04', family: 'Linux' },
	{ label: 'Debian 13', value: 'debian-13', family: 'Linux' },
	{ label: 'Rocky Linux 10', value: 'rocky-10', family: 'Linux' },
	{ label: 'Windows Server 2025', value: 'windows-2025', family: 'Windows' },
];

const sizes = [
	{ label: 'Shared 1 vCPU / 2 GB', value: 'shared-1x2', cpu: 1, memory: 2, disk: 40, price: 14 },
	{ label: 'General 2 vCPU / 8 GB', value: 'general-2x8', cpu: 2, memory: 8, disk: 80, price: 48 },
	{ label: 'Balanced 4 vCPU / 16 GB', value: 'balanced-4x16', cpu: 4, memory: 16, disk: 120, price: 112 },
	{ label: 'Compute 8 vCPU / 32 GB', value: 'compute-8x32', cpu: 8, memory: 32, disk: 180, price: 236 },
];

const sshKeys = [
	{ label: 'Deploy key / production', value: 'deploy-prod' },
	{ label: 'Platform team / shared', value: 'platform-shared' },
	{ label: 'Sandbox access', value: 'sandbox-access' },
];

const stateOptions = ['All states', 'Running', 'Provisioning', 'Maintenance'];
const regionFilters = ['All regions', ...regions.map((region) => region.label)];
const projectOptions = projects.map(({ label, value }) => ({ label, value }));
const regionOptions = regions.map(({ label, value }) => ({ label, value }));
const imageOptions = images.map(({ label, value }) => ({ label, value }));
const sizeOptions = sizes.map(({ label, value }) => ({ label, value }));

const virtualMachines = ref([
	{
		id: 'vm-api-01',
		name: 'api-worker-01',
		project: 'Commerce production',
		region: 'London / LON1',
		state: 'Running',
		image: 'Ubuntu 24.04 LTS',
		size: 'Balanced 4 vCPU / 16 GB',
		cpu: 4,
		memory: 16,
		disk: 160,
		ip: '10.42.8.14',
		owner: 'Maya Chen',
		cost: 132,
		load: 58,
		backup: 'Daily',
		created: 'Jun 10, 2026',
	},
	{
		id: 'vm-jobs-02',
		name: 'jobs-runner-02',
		project: 'Analytics platform',
		region: 'Frankfurt / FRA1',
		state: 'Running',
		image: 'Debian 13',
		size: 'General 2 vCPU / 8 GB',
		cpu: 2,
		memory: 8,
		disk: 120,
		ip: '10.66.12.9',
		owner: 'Omar Reid',
		cost: 66,
		load: 41,
		backup: 'Daily',
		created: 'Jun 7, 2026',
	},
	{
		id: 'vm-lab-03',
		name: 'model-lab-03',
		project: 'Sandbox lab',
		region: 'New York / NYC2',
		state: 'Maintenance',
		image: 'Rocky Linux 10',
		size: 'Compute 8 vCPU / 32 GB',
		cpu: 8,
		memory: 32,
		disk: 240,
		ip: '10.18.4.22',
		owner: 'Nina Patel',
		cost: 264,
		load: 12,
		backup: 'Manual',
		created: 'May 29, 2026',
	},
]);

const selectedVmId = ref('vm-api-01');
const stateFilter = ref('All states');
const regionFilter = ref('All regions');
const vmName = ref('api-worker-04');
const selectedProject = ref('commerce-prod');
const selectedRegion = ref('lon1');
const selectedImage = ref('ubuntu-24-04');
const selectedSize = ref('balanced-4x16');
const selectedSshKey = ref('deploy-prod');
const storageGb = ref(160);
const publicIpv4 = ref(false);
const backupsEnabled = ref(true);
const monitoringEnabled = ref(true);
const deleteLock = ref(true);
const launchReason = ref('Scale API workers before the checkout campaign starts.');
const provisionNotice = ref('Launch plan ready. Review checks, then create the VM.');
const nextVmNumber = ref(4);

const project = computed(() => projects.find((item) => item.value === selectedProject.value) || projects[0]);
const region = computed(() => regions.find((item) => item.value === selectedRegion.value) || regions[0]);
const image = computed(() => images.find((item) => item.value === selectedImage.value) || images[0]);
const size = computed(() => sizes.find((item) => item.value === selectedSize.value) || sizes[0]);
const projectMachines = computed(() => virtualMachines.value.filter((machine) => machine.project === project.value.label));
const selectedMachine = computed(() => virtualMachines.value.find((machine) => machine.id === selectedVmId.value) || virtualMachines.value[0]);
const filteredMachines = computed(() => virtualMachines.value.filter((machine) => {
	const stateMatches = stateFilter.value === 'All states' || machine.state === stateFilter.value;
	const regionMatches = regionFilter.value === 'All regions' || machine.region === regionFilter.value;
	return stateMatches && regionMatches;
}));

const hostnameValue = computed(() => vmName.value.trim().toLowerCase());
const hostnameIsValid = computed(() => /^[a-z][a-z0-9-]{2,30}$/.test(hostnameValue.value));
const hostnameIsUnique = computed(() => !virtualMachines.value.some((machine) => machine.name.toLowerCase() === hostnameValue.value));
const projectQuotaRemaining = computed(() => Math.max(0, project.value.quota - projectMachines.value.length));
const storageNumber = computed(() => Math.max(20, Number(storageGb.value) || size.value.disk));
const extraStorage = computed(() => Math.max(0, storageNumber.value - size.value.disk));
const monthlyEstimate = computed(() => {
	const storageCost = Math.ceil(extraStorage.value * 0.18);
	const backupCost = backupsEnabled.value ? Math.ceil(storageNumber.value * 0.08) : 0;
	const monitoringCost = monitoringEnabled.value ? 12 : 0;
	const publicIpCost = publicIpv4.value ? 6 : 0;

	return size.value.price + storageCost + backupCost + monitoringCost + publicIpCost;
});
const projectedSpend = computed(() => projectMachines.value.reduce((total, machine) => total + machine.cost, 0) + monthlyEstimate.value);
const runningCount = computed(() => virtualMachines.value.filter((machine) => machine.state === 'Running').length);
const provisioningCount = computed(() => virtualMachines.value.filter((machine) => machine.state === 'Provisioning').length);
const monthlySpend = computed(() => virtualMachines.value.reduce((total, machine) => total + machine.cost, 0));
const totalCpu = computed(() => virtualMachines.value.reduce((total, machine) => total + machine.cpu, 0));
const totalMemory = computed(() => virtualMachines.value.reduce((total, machine) => total + machine.memory, 0));

const launchChecks = computed(() => [
	{
		label: 'Hostname is unique',
		description: hostnameIsValid.value ? hostnameValue.value : 'Use 3 to 31 lowercase letters, numbers, or hyphens.',
		done: hostnameIsValid.value && hostnameIsUnique.value,
		required: true,
	},
	{
		label: 'Project quota available',
		description: `${projectQuotaRemaining.value} VM slots remain in ${project.value.label}.`,
		done: projectQuotaRemaining.value > 0,
		required: true,
	},
	{
		label: 'Region has capacity',
		description: `${region.value.label} reports ${region.value.capacity.toLowerCase()} capacity.`,
		done: region.value.capacity !== 'Limited',
		required: true,
	},
	{
		label: 'Backup policy satisfies project rules',
		description: project.value.requiresBackup ? 'Production projects require daily backups.' : 'Backups are optional for this project.',
		done: !project.value.requiresBackup || backupsEnabled.value,
		required: true,
	},
	{
		label: 'Budget remains under threshold',
		description: `$${projectedSpend.value} projected of $${project.value.budget} monthly budget.`,
		done: projectedSpend.value <= project.value.budget,
		required: true,
	},
	{
		label: 'Requester provided launch reason',
		description: launchReason.value.trim() ? 'Audit reason is ready.' : 'Add a reason for the provisioning audit log.',
		done: Boolean(launchReason.value.trim()),
		required: true,
	},
]);

const blockingChecks = computed(() => launchChecks.value.filter((check) => check.required && !check.done).length);
const canCreate = computed(() => blockingChecks.value === 0);
const payloadSummary = computed(() => [
	{ label: 'Project', value: project.value.label },
	{ label: 'Region', value: region.value.label },
	{ label: 'Image', value: image.value.label },
	{ label: 'Size', value: `${size.value.cpu} vCPU / ${size.value.memory} GB RAM` },
	{ label: 'Boot disk', value: `${storageNumber.value} GB encrypted` },
	{ label: 'Network', value: publicIpv4.value ? 'Private VPC + public IPv4' : 'Private VPC only' },
]);

function createVirtualMachine() {
	if (!canCreate.value) {
		provisionNotice.value = `Resolve ${blockingChecks.value} launch check${blockingChecks.value === 1 ? '' : 's'} before provisioning.`;
		return;
	}

	const id = `vm-new-${nextVmNumber.value}`;
	const machine = {
		id,
		name: hostnameValue.value,
		project: project.value.label,
		region: region.value.label,
		state: 'Provisioning',
		image: image.value.label,
		size: size.value.label,
		cpu: size.value.cpu,
		memory: size.value.memory,
		disk: storageNumber.value,
		ip: 'Pending',
		owner: 'Current operator',
		cost: monthlyEstimate.value,
		load: 0,
		backup: backupsEnabled.value ? 'Daily' : 'Manual',
		created: 'Just now',
	};

	virtualMachines.value = [machine, ...virtualMachines.value];
	selectedVmId.value = id;
	provisionNotice.value = `${machine.name} is queued for provisioning in ${machine.region}.`;
	nextVmNumber.value += 1;
	vmName.value = `api-worker-${String(nextVmNumber.value).padStart(2, '0')}`;
}

function selectMachine(machine) {
	selectedVmId.value = machine.id;
}

function stateClasses(state) {
	if (state === 'Running') return 'bg-success/15 text-success';
	if (state === 'Provisioning') return 'bg-primary/10 text-primary';
	if (state === 'Maintenance') return 'bg-warning/20 text-warning';
	return 'bg-secondary text-muted-fg';
}

function checkClasses(check) {
	return check.done ? 'bg-success text-success-fg' : 'bg-warning/20 text-warning';
}
</script>

<template>
	<section class="min-h-screen bg-canvas text-canvas-fg">
		<div class="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6 lg:p-8">
			<header class="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
				<div class="max-w-3xl">
					<div class="flex flex-wrap items-center gap-2">
						<span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Cloud compute</span>
						<span class="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-fg">{{ provisioningCount }} provisioning</span>
					</div>
					<h1 class="mt-4 text-2xl font-semibold sm:text-3xl">Virtual machine control panel</h1>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
						Add compute capacity, review fleet health, estimate launch cost, and keep provisioning guardrails visible before a new VM is created.
					</p>
				</div>
				<div class="flex flex-col gap-2 sm:flex-row">
					<DomNativeSelect v-model="stateFilter" label="State" :options="stateOptions" placeholder="" class="sm:w-40" />
					<DomNativeSelect v-model="regionFilter" label="Region" :options="regionFilters" placeholder="" class="sm:w-52" />
				</div>
			</header>

			<section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<div class="rounded-lg border border-border skin-card p-4">
					<p class="text-xs font-semibold uppercase text-muted-fg">Running VMs</p>
					<p class="mt-2 text-2xl font-semibold">{{ runningCount }}</p>
					<p class="mt-1 text-sm text-muted-fg">{{ virtualMachines.length }} total machines</p>
				</div>
				<div class="rounded-lg border border-border skin-card p-4">
					<p class="text-xs font-semibold uppercase text-muted-fg">Monthly spend</p>
					<p class="mt-2 text-2xl font-semibold">${{ monthlySpend }}</p>
					<p class="mt-1 text-sm text-muted-fg">Current fleet forecast</p>
				</div>
				<div class="rounded-lg border border-border skin-card p-4">
					<p class="text-xs font-semibold uppercase text-muted-fg">Fleet capacity</p>
					<p class="mt-2 text-2xl font-semibold">{{ totalCpu }} vCPU</p>
					<p class="mt-1 text-sm text-muted-fg">{{ totalMemory }} GB memory allocated</p>
				</div>
				<div class="rounded-lg border border-border skin-card p-4">
					<p class="text-xs font-semibold uppercase text-muted-fg">Launch checks</p>
					<p class="mt-2 text-2xl font-semibold">{{ blockingChecks }}</p>
					<p class="mt-1 text-sm text-muted-fg">{{ blockingChecks ? 'Blocking items before create' : 'Ready to provision' }}</p>
				</div>
			</section>

			<div class="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
				<main class="min-w-0 space-y-5">
					<section class="overflow-hidden rounded-lg border border-border bg-canvas">
						<div class="flex flex-col gap-3 border-b border-border skin-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<h2 class="text-base font-semibold">Compute fleet</h2>
								<p class="mt-1 text-sm text-muted-fg">Select a machine to inspect runtime, network, and backup state.</p>
							</div>
							<span class="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-fg">{{ filteredMachines.length }} visible</span>
						</div>

						<div class="overflow-x-auto">
							<div class="min-w-[48rem] divide-y divide-border">
								<button
									v-for="machine in filteredMachines"
									:key="machine.id"
									type="button"
									class="grid w-full grid-cols-[minmax(12rem,1.3fr)_minmax(9rem,0.8fr)_minmax(8rem,0.7fr)_minmax(7rem,0.5fr)_minmax(7rem,0.5fr)] items-center gap-3 px-4 py-3 text-left transition hover:bg-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
									:class="machine.id === selectedVmId ? 'bg-primary/5' : ''"
									@click="selectMachine(machine)"
								>
									<span class="min-w-0">
										<span class="block truncate text-sm font-semibold">{{ machine.name }}</span>
										<span class="mt-1 block truncate text-xs text-muted-fg">{{ machine.project }} / {{ machine.region }}</span>
									</span>
									<span>
										<span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="stateClasses(machine.state)">{{ machine.state }}</span>
									</span>
									<span class="text-sm text-muted-fg">{{ machine.cpu }} vCPU / {{ machine.memory }} GB</span>
									<span class="text-sm text-muted-fg">{{ machine.ip }}</span>
									<span class="text-right text-sm font-semibold">${{ machine.cost }}/mo</span>
								</button>
							</div>
						</div>
					</section>

					<section class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
						<div class="rounded-lg border border-border bg-canvas p-4">
							<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div class="min-w-0">
									<p class="text-xs font-semibold uppercase text-muted-fg">Selected machine</p>
									<h2 class="mt-1 truncate text-xl font-semibold">{{ selectedMachine.name }}</h2>
									<p class="mt-1 text-sm leading-6 text-muted-fg">{{ selectedMachine.image }} / {{ selectedMachine.size }}</p>
								</div>
								<span class="w-fit rounded-full px-2.5 py-1 text-xs font-semibold" :class="stateClasses(selectedMachine.state)">{{ selectedMachine.state }}</span>
							</div>

							<div class="mt-4 grid gap-3 sm:grid-cols-3">
								<div class="rounded-lg border border-border bg-secondary/40 p-3">
									<p class="text-xs font-semibold uppercase text-muted-fg">Runtime load</p>
									<div class="mt-2 h-2 overflow-hidden rounded-full bg-canvas">
										<div class="h-full rounded-full bg-primary" :style="{ width: `${selectedMachine.load}%` }" />
									</div>
									<p class="mt-2 text-sm font-semibold">{{ selectedMachine.load }}% average</p>
								</div>
								<div class="rounded-lg border border-border bg-secondary/40 p-3">
									<p class="text-xs font-semibold uppercase text-muted-fg">Storage</p>
									<p class="mt-2 text-lg font-semibold">{{ selectedMachine.disk }} GB</p>
									<p class="text-sm text-muted-fg">{{ selectedMachine.backup }} backup</p>
								</div>
								<div class="rounded-lg border border-border bg-secondary/40 p-3">
									<p class="text-xs font-semibold uppercase text-muted-fg">Owner</p>
									<p class="mt-2 text-lg font-semibold">{{ selectedMachine.owner }}</p>
									<p class="text-sm text-muted-fg">{{ selectedMachine.created }}</p>
								</div>
							</div>
						</div>

						<div class="rounded-lg border border-border skin-card p-4">
							<p class="text-xs font-semibold uppercase text-muted-fg">Regional capacity</p>
							<div class="mt-3 space-y-3">
								<div v-for="item in regions" :key="item.value" class="flex items-center justify-between gap-3 text-sm">
									<span>
										<span class="block font-medium">{{ item.label }}</span>
										<span class="text-xs text-muted-fg">{{ item.latency }}</span>
									</span>
									<span class="rounded-full px-2 py-1 text-xs font-semibold" :class="item.capacity === 'Limited' ? 'bg-warning/20 text-warning' : 'bg-success/15 text-success'">
										{{ item.capacity }}
									</span>
								</div>
							</div>
						</div>
					</section>
				</main>

				<aside class="min-w-0 rounded-lg border border-border skin-card p-4">
					<form class="space-y-4" @submit.prevent="createVirtualMachine">
						<div>
							<p class="text-xs font-semibold uppercase text-muted-fg">Add compute</p>
							<h2 class="mt-1 text-xl font-semibold">New virtual machine</h2>
							<p class="mt-2 text-sm leading-6 text-muted-fg">{{ provisionNotice }}</p>
						</div>

						<DomTextInput v-model="vmName" label="Hostname" placeholder="api-worker-04" />
						<DomNativeSelect v-model="selectedProject" label="Project" :options="projectOptions" placeholder="" />
						<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
							<DomNativeSelect v-model="selectedRegion" label="Region" :options="regionOptions" placeholder="" />
							<DomNativeSelect v-model="selectedImage" label="Image" :options="imageOptions" placeholder="" />
						</div>
						<DomNativeSelect v-model="selectedSize" label="Machine size" :options="sizeOptions" placeholder="" />
						<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
							<DomNumberInput v-model="storageGb" label="Boot disk GB" :min="20" :step="20" />
							<DomNativeSelect v-model="selectedSshKey" label="SSH key" :options="sshKeys" placeholder="" />
						</div>
						<DomTextareaInput v-model="launchReason" label="Launch reason" rows="4" />

						<div class="grid gap-2">
							<label class="flex items-center justify-between gap-3 rounded-lg border border-border bg-canvas px-3 py-2">
								<span>
									<span class="block text-sm font-medium">Daily backups</span>
									<span class="block text-xs text-muted-fg">Required for production projects.</span>
								</span>
								<DomToggle v-model="backupsEnabled" aria-label="Enable daily backups" />
							</label>
							<label class="flex items-center justify-between gap-3 rounded-lg border border-border bg-canvas px-3 py-2">
								<span>
									<span class="block text-sm font-medium">Monitoring agent</span>
									<span class="block text-xs text-muted-fg">Install metrics and alerting on first boot.</span>
								</span>
								<DomToggle v-model="monitoringEnabled" aria-label="Install monitoring agent" />
							</label>
							<label class="flex items-center justify-between gap-3 rounded-lg border border-border bg-canvas px-3 py-2">
								<span>
									<span class="block text-sm font-medium">Deletion lock</span>
									<span class="block text-xs text-muted-fg">Require approval before destroy.</span>
								</span>
								<DomToggle v-model="deleteLock" aria-label="Enable deletion lock" />
							</label>
							<label class="flex items-center justify-between gap-3 rounded-lg border border-border bg-canvas px-3 py-2">
								<span>
									<span class="block text-sm font-medium">Public IPv4</span>
									<span class="block text-xs text-muted-fg">Expose only when firewall policy allows it.</span>
								</span>
								<DomToggle v-model="publicIpv4" aria-label="Assign public IPv4" />
							</label>
						</div>

						<div class="rounded-lg border border-border bg-canvas p-3">
							<div class="flex items-center justify-between gap-3">
								<p class="text-sm font-semibold">Launch estimate</p>
								<p class="text-lg font-semibold">${{ monthlyEstimate }}/mo</p>
							</div>
							<div class="mt-3 grid gap-2 text-sm">
								<div v-for="item in payloadSummary" :key="item.label" class="flex justify-between gap-3">
									<span class="text-muted-fg">{{ item.label }}</span>
									<span class="text-right font-medium">{{ item.value }}</span>
								</div>
							</div>
						</div>

						<div class="space-y-2">
							<div v-for="check in launchChecks" :key="check.label" class="flex gap-3 rounded-lg bg-canvas p-3 text-sm">
								<span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold" :class="checkClasses(check)">
									{{ check.done ? 'OK' : '!' }}
								</span>
								<span>
									<span class="block font-medium">{{ check.label }}</span>
									<span class="mt-0.5 block text-xs leading-5 text-muted-fg">{{ check.description }}</span>
								</span>
							</div>
						</div>

						<DomButton type="submit" class="w-full" :disabled="!canCreate">
							Create virtual machine
						</DomButton>
					</form>
				</aside>
			</div>
		</div>
	</section>
</template>
