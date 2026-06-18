<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { DomIconButton, DomMonthCalendar, DomStatusPill, DomToggle } from '../../../lib/vue';

const cursor = ref(new Date(2026, 5, 1));
const recordsByDate = ref({});
const loading = ref(false);
const weekNumbers = ref(true);
const activeRequestId = ref(0);
const loadedAt = ref('');
const requestLog = ref([]);
let mounted = false;
let logId = 0;

const monthFormatter = new Intl.DateTimeFormat('en-GB', {
	month: 'long',
	year: 'numeric',
});
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
});

const visibleMonth = computed(() => monthValue(cursor.value));
const calendarStartDate = computed(() => `${visibleMonth.value}-01`);
const monthLabel = computed(() => monthFormatter.format(cursor.value));
const recordCount = computed(() => Object.values(recordsByDate.value).reduce((total, records) => total + records.length, 0));
const statusTone = computed(() => loading.value ? 'info' : 'success');
const statusLabel = computed(() => loading.value ? `Loading ${visibleMonth.value}` : `${recordCount.value} records loaded`);

onMounted(() => {
	mounted = true;
	loadMonth(visibleMonth.value);
});

onBeforeUnmount(() => {
	mounted = false;
	activeRequestId.value += 1;
});

watch(visibleMonth, (value) => {
	loadMonth(value);
});

function navigateMonth(delta) {
	cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + delta, 1);
}

async function loadMonth(month) {
	const requestId = activeRequestId.value + 1;
	activeRequestId.value = requestId;
	loading.value = true;
	loadedAt.value = '';
	recordsByDate.value = {};
	addRequestLog(`GET /api/calendar-records?month=${month}`, 'info');

	const records = await emulateServerFetch(month);
	if (!mounted || requestId !== activeRequestId.value) {
		if (mounted) addRequestLog(`Ignored stale response for ${month}`, 'warning');
		return;
	}

	recordsByDate.value = groupRecords(records);
	loadedAt.value = timeFormatter.format(new Date());
	loading.value = false;
	addRequestLog(`Loaded ${records.length} records for ${month}`, 'success');
}

function emulateServerFetch(month) {
	const delay = 460 + ((month.charCodeAt(5) + month.charCodeAt(6)) % 5) * 170;
	return new Promise((resolve) => {
		window.setTimeout(() => resolve(buildServerRecords(month)), delay);
	});
}

function buildServerRecords(month) {
	const [year, monthNumber] = month.split('-').map(Number);
	const daysInMonth = new Date(year, monthNumber, 0).getDate();
	const titles = ['Install window', 'Support cover', 'Renewal review', 'QA handoff', 'Partner launch'];
	const teams = ['Field ops', 'Success', 'Revenue', 'Platform', 'Marketing'];
	const tones = ['primary', 'success', 'warning', 'info', 'neutral'];
	const records = [];

	for (let day = 1; day <= daysInMonth; day += 1) {
		const seed = (year + monthNumber * 19 + day * 7) % 23;
		const date = `${year}-${pad(monthNumber)}-${pad(day)}`;
		if ([2, 6, 9, 14, 18].includes(seed)) {
			records.push(createRecord(date, day, seed, titles, teams, tones));
		}
		if ([4, 17].includes(seed)) {
			records.push(createRecord(date, day + 3, seed + 5, titles, teams, tones));
		}
	}

	return records;
}

function createRecord(date, day, seed, titles, teams, tones) {
	const index = Math.abs(seed + day) % titles.length;
	return {
		id: `${date}-${seed}-${day}`,
		date,
		title: titles[index],
		team: teams[(index + seed) % teams.length],
		tone: tones[(index + day) % tones.length],
		time: `${pad(8 + (seed % 8))}:00`,
	};
}

function groupRecords(records) {
	return records.reduce((groups, record) => {
		groups[record.date] = [...(groups[record.date] || []), record];
		return groups;
	}, {});
}

function recordsFor(value) {
	return recordsByDate.value[value] || [];
}

function dayClass(cell) {
	if (!cell.currentMonth) return '';
	if (loading.value) return 'bg-secondary/25';
	if (recordsFor(cell.value).length) return 'bg-primary/5';
	return '';
}

function toneClass(record) {
	return {
		primary: 'border-primary/20 bg-primary/10 text-primary',
		success: 'border-success/20 bg-success/10 text-success',
		warning: 'border-warning/30 bg-warning/15 text-warning-fg',
		info: 'border-primary/20 bg-primary/10 text-primary',
		neutral: 'border-border bg-secondary/45 text-canvas-fg',
	}[record.tone] || 'border-border bg-secondary/45 text-canvas-fg';
}

function logToneClass(tone) {
	return {
		info: 'bg-primary',
		success: 'bg-success',
		warning: 'bg-warning',
	}[tone] || 'bg-muted-fg';
}

function addRequestLog(message, tone) {
	requestLog.value = [
		{ id: ++logId, message, tone },
		...requestLog.value,
	].slice(0, 4);
}

function monthValue(date) {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function pad(value) {
	return String(value).padStart(2, '0');
}
</script>

<template>
	<div class="w-[78rem] max-w-full space-y-4" data-testid="server-loaded-navigation-example">
		<section class="rounded-2xl border border-border bg-canvas p-4 shadow-sm">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div class="min-w-0">
					<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Server-loaded schedule</p>
					<h3 class="mt-1 text-2xl font-bold tracking-tight text-canvas-fg">{{ monthLabel }}</h3>
					<p class="mt-1 text-sm text-muted-fg">/api/calendar-records?month={{ visibleMonth }}</p>
				</div>

				<div class="flex items-center gap-2">
					<DomIconButton
						label="Previous month"
						icon="M15 18l-6-6 6-6"
						variant="secondary"
						@click="navigateMonth(-1)"
					/>
					<DomIconButton
						label="Next month"
						icon="M9 18l6-6-6-6"
						variant="secondary"
						@click="navigateMonth(1)"
					/>
				</div>
			</div>

			<div class="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
				<div class="flex flex-wrap items-center gap-3">
					<DomStatusPill
						:tone="statusTone"
						:label="statusLabel"
						:pulse="loading"
						size="sm"
					/>
					<span class="text-sm text-muted-fg">
						<span v-if="loadedAt">Updated {{ loadedAt }}</span>
						<span v-else>Waiting for response</span>
					</span>
				</div>

				<DomToggle v-model="weekNumbers" label="Week numbers" />
			</div>

			<ul class="mt-4 grid gap-2 text-xs text-muted-fg" aria-live="polite">
				<li
					v-for="entry in requestLog"
					:key="entry.id"
					class="flex min-w-0 items-center gap-2 rounded-lg bg-secondary/35 px-3 py-2"
				>
					<span class="size-1.5 shrink-0 rounded-full" :class="logToneClass(entry.tone)" aria-hidden="true"></span>
					<span class="truncate">{{ entry.message }}</span>
				</li>
			</ul>
		</section>

		<DomMonthCalendar
			:start-date="calendarStartDate"
			:months="1"
			:fixed-weeks="true"
			:show-week-numbers="weekNumbers"
			:day-class="dayClass"
		>
			<template #month-header>
				<span>{{ loading ? 'Fetching records' : `${recordCount} records available` }}</span>
			</template>

			<template #default="{ cell }">
				<div v-if="cell.currentMonth" class="min-h-[6.25rem]">
					<div v-if="loading" class="space-y-2" aria-hidden="true">
						<div class="h-3 w-11/12 animate-pulse rounded-full bg-secondary"></div>
						<div class="h-3 w-7/12 animate-pulse rounded-full bg-secondary"></div>
						<div class="h-8 w-full animate-pulse rounded-lg bg-secondary/70"></div>
					</div>

					<div v-else-if="recordsFor(cell.value).length" class="space-y-2">
						<article
							v-for="record in recordsFor(cell.value)"
							:key="record.id"
							class="rounded-lg border px-2 py-1.5 text-xs font-semibold leading-4"
							:class="toneClass(record)"
						>
							<div class="flex min-w-0 items-center justify-between gap-2">
								<span class="min-w-0 truncate">{{ record.title }}</span>
								<span class="shrink-0 opacity-75">{{ record.time }}</span>
							</div>
							<div class="mt-1 truncate text-[11px] font-medium opacity-75">{{ record.team }}</div>
						</article>
					</div>

					<div v-else class="text-xs text-muted-fg">No records</div>
				</div>
			</template>
		</DomMonthCalendar>
	</div>
</template>
