<script setup>
import { computed, ref } from 'vue';
import {
	DomButton,
	DomListbox,
	DomTagCombobox,
	DomToggleButtonGroup,
	DomTooltip,
} from '@getdom/studio/vue';
import DispatchStatusPill from '../components/DispatchStatusPill.vue';
import RouteMarker from '../components/RouteMarker.vue';
import StopManifestRow from '../components/StopManifestRow.vue';

const regions = [
	{
		label: 'Central route board',
		value: 'central',
		description: '18 stops, 5 active routes',
		count: '5 routes',
	},
	{
		label: 'North depot',
		value: 'north',
		description: '12 stops, installation-heavy',
		count: '3 routes',
	},
	{
		label: 'South depot',
		value: 'south',
		description: '9 stops, repair and pickup',
		count: '2 routes',
	},
];

const skillOptions = [
	{ label: 'Installation', value: 'installation', description: 'Two-person install and setup work', group: 'Skill' },
	{ label: 'Repair', value: 'repair', description: 'Diagnostics, replacement, and warranty work', group: 'Skill' },
	{ label: 'Cold chain', value: 'cold-chain', description: 'Temperature-sensitive inventory', group: 'Load type' },
	{ label: 'VIP account', value: 'vip', description: 'High-touch customer commitments', group: 'Priority' },
	{ label: 'Lift gate', value: 'lift-gate', description: 'Requires equipped vehicle', group: 'Vehicle' },
];

const viewOptions = [
	{ label: 'Map', value: 'map' },
	{ label: 'Stops', value: 'stops' },
	{ label: 'Risk', value: 'risk' },
];

const routeBase = [
	{
		id: 'route-maya',
		initials: 'MC',
		name: 'Maya Chen',
		role: 'Senior technician',
		status: 'onTime',
		statusLabel: 'On track',
		statusTone: 'success',
		x: 29,
		y: 42,
		depot: 'central',
		skills: ['installation', 'vip', 'lift-gate'],
		eta: '10:48',
		vehicle: 'Van 14',
		capacity: 78,
		assigned: 4,
		nextStop: 'Aster Labs',
	},
	{
		id: 'route-omar',
		initials: 'OS',
		name: 'Omar Singh',
		role: 'Repair specialist',
		status: 'warning',
		statusLabel: 'Travel risk',
		statusTone: 'warning',
		x: 57,
		y: 35,
		depot: 'central',
		skills: ['repair', 'vip'],
		eta: '11:15',
		vehicle: 'Van 22',
		capacity: 91,
		assigned: 5,
		nextStop: 'North Pier Clinic',
	},
	{
		id: 'route-ines',
		initials: 'IV',
		name: 'Ines Vale',
		role: 'Cold-chain courier',
		status: 'late',
		statusLabel: 'Late window',
		statusTone: 'destructive',
		x: 72,
		y: 62,
		depot: 'south',
		skills: ['cold-chain', 'repair'],
		eta: '11:42',
		vehicle: 'Reefer 03',
		capacity: 66,
		assigned: 3,
		nextStop: 'Carewell Pharmacy',
	},
];

const stops = ref([
	{
		id: 'stop-101',
		customer: 'Aster Labs',
		address: '24 Banner Street',
		window: '10:30-12:00',
		eta: '10:48',
		load: '2 crates',
		status: 'Ready',
		routeId: 'route-maya',
		region: 'central',
		requirements: ['installation', 'vip'],
		x: 36,
		y: 48,
		note: 'Reception is staffed until noon. Requires serial-number capture and installation photo proof.',
	},
	{
		id: 'stop-102',
		customer: 'North Pier Clinic',
		address: '118 Bevan Row',
		window: '11:00-12:30',
		eta: '11:15',
		load: 'Service kit',
		status: 'Watch',
		routeId: 'route-omar',
		region: 'central',
		requirements: ['repair', 'vip'],
		x: 62,
		y: 31,
		note: 'Customer reports intermittent fault. Dispatcher should confirm access code before arrival.',
	},
	{
		id: 'stop-103',
		customer: 'Carewell Pharmacy',
		address: '7 Milton Arcade',
		window: '11:15-11:45',
		eta: '11:42',
		load: 'Cold tote',
		status: 'Blocked',
		routeId: 'route-ines',
		region: 'south',
		requirements: ['cold-chain'],
		x: 76,
		y: 67,
		note: 'Cold-chain handoff is inside a tight delivery window. Reassign if traffic delay exceeds 8 minutes.',
	},
	{
		id: 'stop-104',
		customer: 'Hearthside Lofts',
		address: '43 Mason Yard',
		window: '12:00-14:00',
		eta: 'Unassigned',
		load: 'Lift gate',
		status: 'Watch',
		routeId: '',
		region: 'central',
		requirements: ['installation', 'lift-gate'],
		x: 46,
		y: 72,
		note: 'Building manager requested a smaller arrival window. Best match is a technician with lift-gate coverage.',
	},
	{
		id: 'stop-105',
		customer: 'Ridgeway Market',
		address: '9 Howard Parade',
		window: '13:00-15:00',
		eta: 'Unassigned',
		load: '3 boxes',
		status: 'Ready',
		routeId: '',
		region: 'north',
		requirements: ['repair'],
		x: 21,
		y: 23,
		note: 'Flexible window. Can be used to fill route slack after the lunch gap.',
	},
]);

const selectedRegion = ref('central');
const selectedSkills = ref(['installation']);
const selectedView = ref('map');
const selectedRouteId = ref('route-maya');
const selectedStopId = ref('stop-104');
const assignmentNotice = ref('Unassigned installation stop needs a lift-gate route.');

const selectedRoute = computed(() => routes.value.find((route) => route.id === selectedRouteId.value) || routes.value[0]);
const selectedStop = computed(() => stops.value.find((stop) => stop.id === selectedStopId.value) || filteredStops.value[0]);
const routes = computed(() => routeBase.map((route) => ({
	...route,
	assigned: stops.value.filter((stop) => stop.routeId === route.id).length,
})));
const filteredRoutes = computed(() => routes.value.filter((route) => {
	const matchesRegion = selectedRegion.value === 'central' || route.depot === selectedRegion.value;
	const matchesSkills = selectedSkills.value.length === 0 || selectedSkills.value.some((skill) => route.skills.includes(skill));
	return matchesRegion && matchesSkills;
}));
const filteredStops = computed(() => stops.value.filter((stop) => {
	const matchesRegion = selectedRegion.value === 'central' || stop.region === selectedRegion.value;
	const matchesSkills = selectedSkills.value.length === 0 || selectedSkills.value.some((skill) => stop.requirements.includes(skill));
	const matchesView = selectedView.value !== 'risk' || stop.status !== 'Ready';
	return matchesRegion && matchesSkills && matchesView;
}));
const unassignedStops = computed(() => stops.value.filter((stop) => !stop.routeId).length);
const blockedStops = computed(() => stops.value.filter((stop) => stop.status === 'Blocked').length);
const readyStops = computed(() => stops.value.filter((stop) => stop.status === 'Ready').length);
const selectedRouteSkills = computed(() => selectedRoute.value?.skills.map(labelForSkill).join(', ') || 'No route selected');
const dispatchPayload = computed(() => ({
	region: selectedRegion.value,
	skills: selectedSkills.value,
	routeId: selectedRoute.value?.id,
	stopId: selectedStop.value?.id,
	action: selectedStop.value?.routeId ? 'review-route-stop' : 'assign-stop',
}));

function labelForSkill(value) {
	return skillOptions.find((option) => option.value === value)?.label || value;
}

function selectRoute(route) {
	selectedRouteId.value = route.id;
	assignmentNotice.value = `${route.name} is selected for route balancing.`;
}

function selectStop(stop) {
	selectedStopId.value = stop.id;
	assignmentNotice.value = stop.routeId ? `${stop.customer} is already assigned.` : `${stop.customer} is ready for dispatch assignment.`;
}

function assignSelectedStop() {
	if (!selectedRoute.value || !selectedStop.value) return;
	const stop = stops.value.find((item) => item.id === selectedStop.value.id);
	if (!stop) return;
	stop.routeId = selectedRoute.value.id;
	stop.eta = selectedRoute.value.eta;
	stop.status = 'Ready';
	assignmentNotice.value = `${stop.customer} assigned to ${selectedRoute.value.name}.`;
}
</script>

<template>
	<section class="min-h-screen bg-canvas text-canvas-fg">
		<div class="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 sm:p-6 lg:p-8">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div class="max-w-3xl">
					<div class="flex flex-wrap items-center gap-2">
						<DispatchStatusPill tone="primary">Live dispatch</DispatchStatusPill>
						<DispatchStatusPill :tone="blockedStops ? 'destructive' : 'success'">
							{{ blockedStops }} blocked
						</DispatchStatusPill>
					</div>
					<h1 class="mt-4 text-2xl font-semibold text-canvas-fg sm:text-3xl">Field dispatch map</h1>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
						Balance active technicians, unassigned stops, route risk, and customer delivery windows from a map-first operations surface.
					</p>
				</div>
				<div class="grid grid-cols-3 gap-2 rounded-lg border border-border skin-card p-2 text-center">
					<div class="rounded-md bg-canvas px-3 py-2">
						<p class="text-lg font-semibold text-canvas-fg">{{ filteredRoutes.length }}</p>
						<p class="text-xs text-muted-fg">routes</p>
					</div>
					<div class="rounded-md bg-canvas px-3 py-2">
						<p class="text-lg font-semibold text-canvas-fg">{{ unassignedStops }}</p>
						<p class="text-xs text-muted-fg">unassigned</p>
					</div>
					<div class="rounded-md bg-canvas px-3 py-2">
						<p class="text-lg font-semibold text-canvas-fg">{{ readyStops }}</p>
						<p class="text-xs text-muted-fg">ready</p>
					</div>
				</div>
			</div>

			<div class="grid gap-3 rounded-lg border border-border skin-popover p-3 lg:grid-cols-[minmax(16rem,20rem)_1fr_auto] lg:items-end">
				<DomListbox
					v-model="selectedRegion"
					:options="regions"
					label="Dispatch region"
					chrome="none"
				>
					<template #option="{ option }">
						<span class="flex min-w-0 items-center justify-between gap-3">
							<span class="min-w-0">
								<span class="block truncate font-medium">{{ option.label }}</span>
								<span class="block truncate text-xs text-muted-fg">{{ option.description }}</span>
							</span>
							<span class="shrink-0 rounded-full bg-canvas px-2 py-1 text-[11px] text-muted-fg ring-1 ring-border">{{ option.count }}</span>
						</span>
					</template>
				</DomListbox>

				<DomTagCombobox
					v-model="selectedSkills"
					:options="skillOptions"
					label="Coverage filters"
					placeholder="Filter by skill, vehicle, or priority"
					clearable
					chrome="none"
				>
					<template #item="{ item, custom }">
						<div class="flex min-w-0 items-center justify-between gap-3">
							<span class="min-w-0">
								<span class="block truncate font-medium">{{ custom ? `Add ${item.label}` : item.label }}</span>
								<span class="block truncate text-xs text-muted-fg">{{ item.description }}</span>
							</span>
							<span class="shrink-0 rounded-full bg-canvas px-2 py-0.5 text-[11px] text-muted-fg ring-1 ring-border">{{ item.group }}</span>
						</div>
					</template>
					<template #tag="{ label, remove }">
						<span class="truncate">{{ label }}</span>
						<button
							type="button"
							class="-mr-1 inline-flex size-4 items-center justify-center rounded-full text-muted-fg hover:bg-canvas hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
							:aria-label="`Remove ${label}`"
							@click.stop="remove"
							@mousedown.prevent
						>
							<svg viewBox="0 0 16 16" class="size-3" fill="none" aria-hidden="true">
								<path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
							</svg>
						</button>
					</template>
				</DomTagCombobox>

				<DomToggleButtonGroup
					v-model="selectedView"
					:options="viewOptions"
					label="Map view"
					size="sm"
					chrome="none"
				/>
			</div>

			<div class="grid gap-4 xl:grid-cols-[1fr_22rem]">
				<div class="overflow-hidden rounded-lg border border-border skin-card">
					<div class="relative min-h-[31rem] overflow-hidden bg-secondary">
						<div class="absolute inset-0 opacity-70" aria-hidden="true">
							<div class="absolute left-1/2 top-0 h-full w-14 -translate-x-1/2 rotate-12 bg-canvas/70"></div>
							<div class="absolute left-[14%] top-1/2 h-12 w-[90%] -translate-y-1/2 -rotate-6 bg-canvas/70"></div>
							<div class="absolute left-[8%] top-[19%] h-9 w-[68%] rotate-3 bg-canvas/60"></div>
							<div class="absolute left-[20%] top-[72%] h-10 w-[62%] -rotate-12 bg-canvas/60"></div>
							<div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(255_255_255/0.72),transparent_24%),radial-gradient(circle_at_76%_68%,rgb(255_255_255/0.6),transparent_20%)]"></div>
						</div>

						<div class="absolute left-4 top-4 z-30 flex flex-wrap gap-2">
							<DomTooltip text="Center on active route" placement="bottom">
								<button
									type="button"
									class="grid size-10 place-items-center rounded-full border border-border bg-canvas text-canvas-fg shadow-sm transition hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
									aria-label="Center on active route"
								>
									<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
										<path d="M12 5v3M12 16v3M5 12h3M16 12h3M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
									</svg>
								</button>
							</DomTooltip>
							<DomTooltip text="Show route density" placement="bottom">
								<button
									type="button"
									class="grid size-10 place-items-center rounded-full border border-border bg-canvas text-canvas-fg shadow-sm transition hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
									aria-label="Show route density"
								>
									<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
										<path d="M5 17c4-6 10-6 14 0M7 13c3-4 7-4 10 0M10 9c1.4-1.5 2.6-1.5 4 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
									</svg>
								</button>
							</DomTooltip>
						</div>

						<div class="absolute right-4 top-4 z-30 max-w-[15rem] rounded-lg border border-border bg-canvas/95 p-3 shadow-sm backdrop-blur">
							<p class="text-xs font-medium uppercase text-muted-fg">Dispatch note</p>
							<p class="mt-1 text-sm leading-5 text-canvas-fg">{{ assignmentNotice }}</p>
						</div>

						<RouteMarker
							v-for="route in filteredRoutes"
							:key="route.id"
							:label="route.initials"
							:status="route.status"
							:x="route.x"
							:y="route.y"
							:active="route.id === selectedRouteId"
							@click="selectRoute(route)"
						/>

						<button
							v-for="stop in filteredStops"
							:key="stop.id"
							type="button"
							class="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-canvas p-1 shadow-sm transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
							:class="[
								stop.status === 'Blocked' ? 'bg-destructive' : stop.status === 'Watch' ? 'bg-warning' : 'bg-success',
								stop.id === selectedStopId ? 'size-5 ring-4 ring-ring/30' : 'size-4',
							]"
							:style="{ left: `${stop.x}%`, top: `${stop.y}%` }"
							:aria-label="`Select stop ${stop.customer}`"
							@click="selectStop(stop)"
						></button>
					</div>

					<div class="grid gap-3 border-t border-border bg-canvas p-3 md:grid-cols-3">
						<div
							v-for="route in filteredRoutes"
							:key="route.id"
							class="rounded-lg border border-border p-3"
							:class="route.id === selectedRouteId ? 'bg-secondary ring-2 ring-ring/20' : 'bg-canvas'"
						>
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="text-sm font-semibold text-canvas-fg">{{ route.name }}</p>
									<p class="mt-1 text-xs text-muted-fg">{{ route.vehicle }} / {{ route.role }}</p>
								</div>
								<DispatchStatusPill :tone="route.statusTone">{{ route.statusLabel }}</DispatchStatusPill>
							</div>
							<div class="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
								<div class="h-full rounded-full bg-primary" :style="{ width: `${route.capacity}%` }"></div>
							</div>
							<div class="mt-3 flex items-center justify-between text-xs text-muted-fg">
								<span>{{ route.assigned }} stops</span>
								<span>{{ route.capacity }}% capacity</span>
							</div>
						</div>
					</div>
				</div>

				<aside class="grid gap-4 rounded-lg border border-border skin-card p-4 xl:self-start">
					<div>
						<p class="text-xs font-medium uppercase text-muted-fg">Selected route</p>
						<h2 class="mt-2 text-xl font-semibold text-canvas-fg">{{ selectedRoute?.name }}</h2>
						<p class="mt-1 text-sm text-muted-fg">{{ selectedRoute?.nextStop }} next / ETA {{ selectedRoute?.eta }}</p>
					</div>

					<div class="grid gap-2 rounded-lg bg-secondary p-3">
						<div class="flex items-center justify-between gap-3 text-sm">
							<span class="text-muted-fg">Coverage</span>
							<span class="text-right font-medium text-canvas-fg">{{ selectedRouteSkills }}</span>
						</div>
						<div class="flex items-center justify-between gap-3 text-sm">
							<span class="text-muted-fg">Vehicle</span>
							<span class="font-medium text-canvas-fg">{{ selectedRoute?.vehicle }}</span>
						</div>
						<div class="flex items-center justify-between gap-3 text-sm">
							<span class="text-muted-fg">Load</span>
							<span class="font-medium text-canvas-fg">{{ selectedRoute?.capacity }}%</span>
						</div>
					</div>

					<div class="rounded-lg border border-border p-3">
						<p class="text-sm font-semibold text-canvas-fg">{{ selectedStop?.customer }}</p>
						<p class="mt-1 text-xs text-muted-fg">{{ selectedStop?.address }}</p>
						<div class="mt-3 flex flex-wrap gap-1.5">
							<span
								v-for="requirement in selectedStop?.requirements"
								:key="requirement"
								class="rounded-full bg-secondary px-2 py-1 text-xs text-muted-fg ring-1 ring-border"
							>
								{{ labelForSkill(requirement) }}
							</span>
						</div>
						<p class="mt-3 text-sm leading-6 text-muted-fg">{{ selectedStop?.note }}</p>
					</div>

					<div class="flex flex-col gap-2 sm:flex-row xl:flex-col">
						<DomButton class="w-full" @click="assignSelectedStop">
							Assign selected stop
						</DomButton>
						<DomButton variant="secondary" class="w-full">
							Send route update
						</DomButton>
					</div>

					<div class="rounded-lg border border-border bg-canvas p-3">
						<p class="text-xs font-medium uppercase text-muted-fg">Command payload</p>
						<pre class="mt-2 overflow-auto rounded-md bg-secondary p-3 text-xs leading-5 text-canvas-fg">{{ JSON.stringify(dispatchPayload, null, 2) }}</pre>
					</div>
				</aside>
			</div>

			<div class="grid gap-3 rounded-lg border border-border skin-popover p-3">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 class="text-base font-semibold text-canvas-fg">Stop manifest</h2>
						<p class="text-sm text-muted-fg">Select a stop from the route queue or the map pins.</p>
					</div>
					<DispatchStatusPill tone="neutral">{{ filteredStops.length }} visible stops</DispatchStatusPill>
				</div>
				<div class="grid gap-3 overflow-x-auto pb-1 sm:grid-cols-2 xl:grid-cols-5">
					<StopManifestRow
						v-for="stop in filteredStops"
						:key="stop.id"
						:stop="stop"
						:active="stop.id === selectedStopId"
						@click="selectStop(stop)"
					/>
				</div>
			</div>
		</div>
	</section>
</template>
