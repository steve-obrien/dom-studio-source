<script setup>
import { computed, ref, watch } from 'vue';
import { DomButton, DomNativeSelect, DomTabs, DomToggle, DomTooltip } from '@getdom/studio/vue';

const resources = [
	{ id: 'maya', name: 'Maya Chen', role: 'Implementation', initials: 'MC', color: 'bg-cyan-500', target: 82 },
	{ id: 'omar', name: 'Omar Reid', role: 'Onsite support', initials: 'OR', color: 'bg-violet-500', target: 76 },
	{ id: 'nina', name: 'Nina Patel', role: 'Customer success', initials: 'NP', color: 'bg-emerald-500', target: 69 },
	{ id: 'bea', name: 'Bea Morgan', role: 'Technical review', initials: 'BM', color: 'bg-amber-500', target: 88 },
];

const timeSlots = [
	{ label: '08:00', minutes: 480 },
	{ label: '09:00', minutes: 540 },
	{ label: '10:00', minutes: 600 },
	{ label: '11:00', minutes: 660 },
	{ label: '12:00', minutes: 720 },
	{ label: '13:00', minutes: 780 },
	{ label: '14:00', minutes: 840 },
	{ label: '15:00', minutes: 900 },
	{ label: '16:00', minutes: 960 },
	{ label: '17:00', minutes: 1020 },
];

const appointments = [
	{
		id: 'apt-2048',
		resourceId: 'maya',
		title: 'Northstar onboarding',
		customer: 'Northstar Labs',
		service: 'Implementation call',
		start: '09:15',
		end: '10:30',
		startMinutes: 555,
		durationMinutes: 75,
		status: 'Confirmed',
		location: 'Soho',
		value: '$1.8k',
		readiness: 92,
		risk: 'Ready',
		notes: 'Workspace import complete. Confirm analytics destination during the call.',
		requirements: ['Intake complete', 'Deposit paid', 'Room assigned'],
	},
	{
		id: 'apt-2049',
		resourceId: 'omar',
		title: 'Field install',
		customer: 'Harbor Foods',
		service: 'Onsite setup',
		start: '09:45',
		end: '11:45',
		startMinutes: 585,
		durationMinutes: 120,
		status: 'Traveling',
		location: 'Shoreditch',
		value: '$4.2k',
		readiness: 74,
		risk: 'Buffer tight',
		notes: 'Previous job leaves only 20 minutes of travel buffer.',
		requirements: ['Parts packed', 'Access code missing', 'Customer confirmed'],
	},
	{
		id: 'apt-2050',
		resourceId: 'nina',
		title: 'Renewal strategy',
		customer: 'Kite Medical',
		service: 'Success review',
		start: '11:00',
		end: '12:00',
		startMinutes: 660,
		durationMinutes: 60,
		status: 'Confirmed',
		location: 'Remote',
		value: '$9.6k',
		readiness: 86,
		risk: 'Ready',
		notes: 'Bring usage summary and draft expansion plan.',
		requirements: ['Deck attached', 'Decision maker invited', 'Usage pulled'],
	},
	{
		id: 'apt-2051',
		resourceId: 'bea',
		title: 'Security review',
		customer: 'LedgerWorks',
		service: 'Technical audit',
		start: '10:15',
		end: '12:15',
		startMinutes: 615,
		durationMinutes: 120,
		status: 'Needs intake',
		location: 'Remote',
		value: '$3.4k',
		readiness: 58,
		risk: 'Missing intake',
		notes: 'Security questionnaire is still incomplete.',
		requirements: ['NDA signed', 'Questionnaire missing', 'Sandbox pending'],
	},
	{
		id: 'apt-2052',
		resourceId: 'maya',
		title: 'Migration dry run',
		customer: 'Olive Systems',
		service: 'Data migration',
		start: '13:00',
		end: '15:00',
		startMinutes: 780,
		durationMinutes: 120,
		status: 'Confirmed',
		location: 'Soho',
		value: '$6.1k',
		readiness: 81,
		risk: 'Ready',
		notes: 'Use the smaller sample export before approving the production run.',
		requirements: ['Sample file ready', 'Rollback owner set', 'Approver assigned'],
	},
	{
		id: 'apt-2053',
		resourceId: 'omar',
		title: 'Urgent repair',
		customer: 'Market Lane',
		service: 'Incident visit',
		start: '13:45',
		end: '15:15',
		startMinutes: 825,
		durationMinutes: 90,
		status: 'Requested',
		location: 'Camden',
		value: '$2.2k',
		readiness: 63,
		risk: 'Unconfirmed',
		notes: 'Customer requested same-day help. Confirm technician availability.',
		requirements: ['Customer callback', 'Parts check', 'Route approval'],
	},
	{
		id: 'apt-2054',
		resourceId: 'nina',
		title: 'Executive handoff',
		customer: 'BrightPath',
		service: 'Account transition',
		start: '14:30',
		end: '15:30',
		startMinutes: 870,
		durationMinutes: 60,
		status: 'Confirmed',
		location: 'Remote',
		value: '$7.5k',
		readiness: 95,
		risk: 'Ready',
		notes: 'Expansion opportunity noted. Keep renewal owner in the loop.',
		requirements: ['Agenda accepted', 'CRM updated', 'Next step drafted'],
	},
	{
		id: 'apt-2055',
		resourceId: 'bea',
		title: 'Architecture consult',
		customer: 'Tandem Retail',
		service: 'Solution design',
		start: '15:00',
		end: '16:30',
		startMinutes: 900,
		durationMinutes: 90,
		status: 'Confirmed',
		location: 'Soho',
		value: '$3.9k',
		readiness: 78,
		risk: 'Prep needed',
		notes: 'Review integration diagram before the session.',
		requirements: ['Diagram uploaded', 'API owner invited', 'Success criteria draft'],
	},
];

const tabs = [
	{ key: 'day', label: 'Day' },
	{ key: 'capacity', label: 'Capacity' },
	{ key: 'exceptions', label: 'Exceptions' },
];

const locationOptions = ['All locations', 'Soho', 'Shoreditch', 'Camden', 'Remote'];
const teamOptions = ['All teams', 'Implementation', 'Onsite support', 'Customer success', 'Technical review'];
const statusOptions = ['Requested', 'Needs intake', 'Confirmed', 'Traveling', 'Checked in', 'Completed'];

const activeTab = ref('day');
const selectedLocation = ref('All locations');
const selectedTeam = ref('All teams');
const selectedAppointmentId = ref('apt-2049');
const appointmentStatus = ref('Traveling');
const autoBalance = ref(true);
const holdCreated = ref(false);

const selectedAppointment = computed(() => appointments.find((appointment) => appointment.id === selectedAppointmentId.value) || appointments[0]);
const selectedResource = computed(() => resources.find((resource) => resource.id === selectedAppointment.value.resourceId));

const filteredResources = computed(() => {
	if (selectedTeam.value === 'All teams') return resources;
	return resources.filter((resource) => resource.role === selectedTeam.value);
});

const scheduleGridStyle = computed(() => ({
	gridTemplateColumns: `4.5rem repeat(${Math.max(filteredResources.value.length, 1)}, minmax(12rem, 1fr))`,
}));

const filteredAppointments = computed(() => {
	return appointments.filter((appointment) => {
		const resource = resources.find((item) => item.id === appointment.resourceId);
		const locationMatches = selectedLocation.value === 'All locations' || appointment.location === selectedLocation.value;
		const teamMatches = selectedTeam.value === 'All teams' || resource?.role === selectedTeam.value;
		const exceptionMatches = activeTab.value !== 'exceptions' || appointment.risk !== 'Ready';

		return locationMatches && teamMatches && exceptionMatches;
	});
});

const visibleAppointments = computed(() => filteredAppointments.value.filter((appointment) => {
	return filteredResources.value.some((resource) => resource.id === appointment.resourceId);
}));

const revenueAtRisk = computed(() => {
	return visibleAppointments.value
		.filter((appointment) => appointment.risk !== 'Ready')
		.reduce((total, appointment) => total + Number(appointment.value.replace(/[$k]/g, '')), 0)
		.toFixed(1);
});

const confirmedCount = computed(() => visibleAppointments.value.filter((appointment) => ['Confirmed', 'Traveling', 'Checked in'].includes(appointmentStatusFor(appointment))).length);
const exceptionCount = computed(() => visibleAppointments.value.filter((appointment) => appointment.risk !== 'Ready').length);
const averageReadiness = computed(() => Math.round(visibleAppointments.value.reduce((total, appointment) => total + appointment.readiness, 0) / Math.max(visibleAppointments.value.length, 1)));

const readinessChecks = computed(() => [
	{ label: 'Customer requirements complete', done: selectedAppointment.value.readiness >= 80 },
	{ label: 'No unresolved schedule risk', done: selectedAppointment.value.risk === 'Ready' || appointmentStatus.value === 'Confirmed' },
	{ label: 'Resource owner available', done: selectedResource.value?.target < 90 },
	{ label: 'Status is operator-reviewed', done: appointmentStatus.value !== 'Requested' },
]);

watch(selectedAppointment, (appointment) => {
	appointmentStatus.value = appointment.status;
	holdCreated.value = false;
}, { immediate: true });

watch(visibleAppointments, (appointments) => {
	if (!appointments.length || appointments.some((appointment) => appointment.id === selectedAppointmentId.value)) return;
	selectedAppointmentId.value = appointments[0].id;
});

function appointmentStatusFor(appointment) {
	return appointment.id === selectedAppointmentId.value ? appointmentStatus.value : appointment.status;
}

function appointmentStyle(appointment) {
	const dayStart = 480;
	const pixelsPerMinute = 0.9;
	return {
		top: `${Math.max(0, appointment.startMinutes - dayStart) * pixelsPerMinute}px`,
		height: `${Math.max(58, appointment.durationMinutes * pixelsPerMinute)}px`,
	};
}

function appointmentsForResource(resourceId) {
	return visibleAppointments.value.filter((appointment) => appointment.resourceId === resourceId);
}

function selectAppointment(appointment) {
	selectedAppointmentId.value = appointment.id;
}

function riskClasses(appointment) {
	if (appointment.risk === 'Ready') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100';
	if (appointment.risk === 'Missing intake' || appointment.risk === 'Unconfirmed') return 'border-amber-500/50 bg-amber-500/15 text-amber-950 dark:text-amber-100';
	return 'border-sky-500/40 bg-sky-500/10 text-sky-950 dark:text-sky-100';
}

function resourceUtilization(resourceId) {
	const bookedMinutes = appointments
		.filter((appointment) => appointment.resourceId === resourceId)
		.reduce((total, appointment) => total + appointment.durationMinutes, 0);

	return Math.min(100, Math.round((bookedMinutes / 480) * 100));
}

function createHold() {
	holdCreated.value = true;
}
</script>

<template>
	<section class="min-h-screen bg-[radial-gradient(circle_at_top_left,rgb(236_253_245),transparent_30%),linear-gradient(180deg,rgb(248_250_252),rgb(241_245_249))] px-3 py-4 text-fg dark:bg-[radial-gradient(circle_at_top_left,rgb(20_83_45/.45),transparent_30%),linear-gradient(180deg,rgb(15_23_42),rgb(2_6_23))] sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl overflow-hidden rounded-lg border border-border bg-background shadow-2xl shadow-black/10">
			<header class="border-b border-border skin-raised px-4 py-4 sm:px-5">
				<div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
					<div class="min-w-0">
						<div class="flex flex-wrap items-center gap-2">
							<span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Thu, Jun 11</span>
							<span class="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-fg">Europe/London</span>
						</div>
						<h3 class="mt-3 text-2xl font-semibold tracking-normal sm:text-3xl">Resource schedule</h3>
						<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
							Balance appointments across the team, review booking readiness, and resolve schedule exceptions before dispatch.
						</p>
					</div>
					<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-[11rem_12rem_auto]">
						<DomNativeSelect v-model="selectedLocation" label="Location" :options="locationOptions" placeholder="" />
						<DomNativeSelect v-model="selectedTeam" label="Team" :options="teamOptions" placeholder="" />
						<div class="flex items-end gap-2">
							<DomButton variant="secondary" size="md" class="w-full sm:w-auto" @click="createHold">
								<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
									<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
								</svg>
								New hold
							</DomButton>
						</div>
					</div>
				</div>
			</header>

			<section class="grid border-b border-border text-sm sm:grid-cols-4">
				<div class="border-b border-border px-4 py-3 sm:border-b-0 sm:border-r">
					<p class="text-xs font-semibold uppercase text-muted-fg">Confirmed</p>
					<p class="mt-1 text-2xl font-semibold">{{ confirmedCount }}</p>
				</div>
				<div class="border-b border-border px-4 py-3 sm:border-b-0 sm:border-r">
					<p class="text-xs font-semibold uppercase text-muted-fg">Exceptions</p>
					<p class="mt-1 text-2xl font-semibold">{{ exceptionCount }}</p>
				</div>
				<div class="border-b border-border px-4 py-3 sm:border-b-0 sm:border-r">
					<p class="text-xs font-semibold uppercase text-muted-fg">Readiness</p>
					<p class="mt-1 text-2xl font-semibold">{{ averageReadiness }}%</p>
				</div>
				<div class="px-4 py-3">
					<p class="text-xs font-semibold uppercase text-muted-fg">Revenue at risk</p>
					<p class="mt-1 text-2xl font-semibold">${{ revenueAtRisk }}k</p>
				</div>
			</section>

			<section class="border-b border-border px-4 py-4 sm:px-5">
				<div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
					<DomTabs v-model="activeTab" :tabs="tabs">
						<template #day>
							<span class="sr-only">Day schedule view selected</span>
						</template>
						<template #capacity>
							<span class="sr-only">Capacity view selected</span>
						</template>
						<template #exceptions>
							<span class="sr-only">Exceptions view selected</span>
						</template>
					</DomTabs>
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
						<label class="flex items-center justify-between gap-3 rounded-full border border-border bg-secondary px-3 py-2 text-sm font-medium sm:justify-start">
							<span>Auto-balance gaps</span>
							<DomToggle v-model="autoBalance" label="Auto-balance schedule gaps" chrome="none" />
						</label>
						<DomTooltip text="Utilization compares booked minutes against the available workday." placement="bottom">
							<button type="button" class="inline-flex h-9 items-center justify-center rounded-full border border-border bg-background px-3 text-sm font-medium text-muted-fg transition hover:text-fg">
								How utilization works
							</button>
						</DomTooltip>
					</div>
				</div>
			</section>

			<div class="overflow-x-auto">
				<div class="min-w-[58rem]">
					<div class="grid border-b border-border bg-secondary/50" :style="scheduleGridStyle">
						<div class="border-r border-border px-3 py-3 text-xs font-semibold uppercase text-muted-fg">Time</div>
						<div v-for="resource in filteredResources" :key="resource.id" class="border-r border-border px-3 py-3 last:border-r-0">
							<div class="flex items-start justify-between gap-3">
								<div class="flex min-w-0 items-center gap-2">
									<span class="grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white" :class="resource.color">{{ resource.initials }}</span>
									<span class="min-w-0">
										<span class="block truncate text-sm font-semibold">{{ resource.name }}</span>
										<span class="block truncate text-xs text-muted-fg">{{ resource.role }}</span>
									</span>
								</div>
								<span class="rounded-full bg-background px-2 py-1 text-xs font-semibold text-muted-fg">{{ resourceUtilization(resource.id) }}%</span>
							</div>
						</div>
					</div>

					<div class="grid" :style="scheduleGridStyle">
						<div class="border-r border-border bg-secondary/30">
							<div v-for="slot in timeSlots" :key="slot.minutes" class="h-[54px] border-b border-border px-3 py-2 text-xs font-medium text-muted-fg">
								{{ slot.label }}
							</div>
						</div>
						<div v-for="resource in filteredResources" :key="resource.id" class="relative h-[540px] border-r border-border last:border-r-0">
							<div v-for="slot in timeSlots" :key="slot.minutes" class="h-[54px] border-b border-border" />
							<button
								v-for="appointment in appointmentsForResource(resource.id)"
								:key="appointment.id"
								type="button"
								class="absolute left-2 right-2 overflow-hidden rounded-lg border p-2 text-left text-xs shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
								:class="[riskClasses(appointment), appointment.id === selectedAppointmentId ? 'ring-2 ring-primary/70' : '']"
								:style="appointmentStyle(appointment)"
								@click="selectAppointment(appointment)"
							>
								<span class="flex items-start justify-between gap-2">
									<span class="min-w-0">
										<span class="block truncate font-semibold">{{ appointment.title }}</span>
										<span class="mt-0.5 block truncate opacity-75">{{ appointment.customer }}</span>
									</span>
									<span class="shrink-0 rounded-full bg-background/70 px-1.5 py-0.5 font-semibold">{{ appointmentStatusFor(appointment) }}</span>
								</span>
								<span class="mt-2 block truncate opacity-80">{{ appointment.start }}-{{ appointment.end }} / {{ appointment.location }}</span>
							</button>
						</div>
					</div>
				</div>
			</div>

			<section class="border-t border-border bg-secondary/30 p-4 sm:p-5">
				<div class="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
					<div class="rounded-lg border border-border bg-background p-4">
						<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div class="min-w-0">
								<p class="text-xs font-semibold uppercase text-muted-fg">Selected appointment</p>
								<h4 class="mt-1 text-xl font-semibold">{{ selectedAppointment.title }}</h4>
								<p class="mt-1 text-sm leading-6 text-muted-fg">
									{{ selectedAppointment.customer }} / {{ selectedAppointment.service }} / {{ selectedAppointment.start }}-{{ selectedAppointment.end }}
								</p>
							</div>
							<div class="grid gap-2 sm:w-44">
								<DomNativeSelect v-model="appointmentStatus" label="Status" :options="statusOptions" placeholder="" />
							</div>
						</div>

						<div class="mt-4 grid gap-3 md:grid-cols-3">
							<div class="rounded-lg border border-border bg-secondary/50 p-3">
								<p class="text-xs font-semibold uppercase text-muted-fg">Owner</p>
								<p class="mt-1 font-semibold">{{ selectedResource.name }}</p>
								<p class="text-sm text-muted-fg">{{ selectedResource.role }}</p>
							</div>
							<div class="rounded-lg border border-border bg-secondary/50 p-3">
								<p class="text-xs font-semibold uppercase text-muted-fg">Booking value</p>
								<p class="mt-1 font-semibold">{{ selectedAppointment.value }}</p>
								<p class="text-sm text-muted-fg">{{ selectedAppointment.location }}</p>
							</div>
							<div class="rounded-lg border border-border bg-secondary/50 p-3">
								<p class="text-xs font-semibold uppercase text-muted-fg">Readiness</p>
								<div class="mt-2 h-2 overflow-hidden rounded-full bg-background">
									<div class="h-full rounded-full bg-primary" :style="{ width: `${selectedAppointment.readiness}%` }" />
								</div>
								<p class="mt-2 text-sm font-semibold">{{ selectedAppointment.readiness }}% / {{ selectedAppointment.risk }}</p>
							</div>
						</div>

						<p class="mt-4 rounded-lg border border-border bg-secondary/40 p-3 text-sm leading-6 text-muted-fg">
							{{ selectedAppointment.notes }}
						</p>
					</div>

					<div class="rounded-lg border border-border bg-background p-4">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="text-xs font-semibold uppercase text-muted-fg">Readiness checks</p>
								<h4 class="mt-1 text-base font-semibold">Dispatch gate</h4>
							</div>
							<span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="holdCreated ? 'bg-success/15 text-success' : 'bg-secondary text-muted-fg'">
								{{ holdCreated ? 'Hold created' : 'No hold' }}
							</span>
						</div>
						<div class="mt-4 grid gap-2">
							<div v-for="check in readinessChecks" :key="check.label" class="flex items-start gap-3 rounded-lg bg-secondary/50 p-3 text-sm">
								<span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold" :class="check.done ? 'bg-success text-success-fg' : 'bg-warning/20 text-warning'">
									{{ check.done ? 'OK' : '!' }}
								</span>
								<span>{{ check.label }}</span>
							</div>
						</div>
						<div class="mt-4 flex flex-col gap-2 sm:flex-row">
							<DomButton class="w-full sm:w-auto" @click="appointmentStatus = 'Confirmed'">Confirm slot</DomButton>
							<DomButton variant="secondary" class="w-full sm:w-auto" @click="createHold">Create follow-up hold</DomButton>
						</div>
					</div>
				</div>
			</section>
		</div>
	</section>
</template>
