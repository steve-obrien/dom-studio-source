<script setup>
import { computed, ref } from 'vue';
import {
	DomButton,
	DomCheckbox,
	DomDropdown,
	DomEmailInput,
	DomNativeSelect,
	DomTabs,
	DomTextInput,
	DomTextareaInput,
	DomToggle,
	DomTooltip,
} from '@getdom/studio/vue';

const tabs = [
	{ key: 'details', label: 'Details' },
	{ key: 'checks', label: 'Checks' },
	{ key: 'activity', label: 'Activity' },
];

const documents = [
	{ id: 'offer', name: 'Offer Letter.pdf', pages: 4, status: 'Current', owner: 'People Ops', updated: 'Today 09:32' },
	{ id: 'nda', name: 'Mutual NDA.pdf', pages: 6, status: 'Approved', owner: 'Legal', updated: 'Yesterday 16:10' },
	{ id: 'equity', name: 'Equity Grant Summary.pdf', pages: 2, status: 'Needs review', owner: 'Finance', updated: 'Jun 09 11:20' },
];

const signers = ref([
	{ id: 'candidate', name: 'Riley Chen', email: 'riley.chen@example.com', role: 'Candidate', color: 'bg-primary text-primary-fg', order: 1, required: true, identityCheck: true },
	{ id: 'manager', name: 'Maya Patel', email: 'maya@acme.test', role: 'Hiring manager', color: 'bg-success text-success-fg', order: 2, required: true, identityCheck: false },
	{ id: 'finance', name: 'Jon Bell', email: '', role: 'Finance approver', color: 'bg-warning text-warning-fg', order: 3, required: false, identityCheck: false },
]);

const placedFields = ref([
	{ id: 'field-1', label: 'Candidate signature', type: 'Signature', signerId: 'candidate', documentId: 'offer', page: 4, x: 58, y: 74, required: true },
	{ id: 'field-2', label: 'Candidate date', type: 'Date signed', signerId: 'candidate', documentId: 'offer', page: 4, x: 58, y: 84, required: true },
	{ id: 'field-3', label: 'Manager signature', type: 'Signature', signerId: 'manager', documentId: 'offer', page: 4, x: 16, y: 74, required: true },
	{ id: 'field-4', label: 'NDA initials', type: 'Initials', signerId: 'candidate', documentId: 'nda', page: 2, x: 76, y: 28, required: true },
]);

const signerRoleOptions = ['Candidate', 'Hiring manager', 'Finance approver', 'Legal reviewer', 'Customer', 'Vendor'];
const fieldTypeOptions = ['Signature', 'Initials', 'Date signed', 'Text field', 'Checkbox'];
const packetOptions = ['Offer letter and NDA', 'Sales mutual agreement', 'Vendor onboarding packet'];
const deliveryOptions = ['Signing order', 'Parallel signing', 'In-person signing'];
const reminderOptions = ['Every 2 days', 'Every 3 days', 'Weekly', 'Disabled'];

const selectedPacket = ref(packetOptions[0]);
const selectedDocumentId = ref('offer');
const selectedSignerId = ref('candidate');
const selectedFieldType = ref('Signature');
const activeTab = ref('details');
const deliveryMode = ref('Signing order');
const reminderCadence = ref('Every 3 days');
const packetStatus = ref('Draft');
const signingOrderEnabled = ref(true);
const autoReminders = ref(true);
const declineRequiresReason = ref(true);
const message = ref('Please review the attached offer packet and complete all highlighted fields before Friday.');
const internalNote = ref('Confirm equity summary version before sending to the candidate.');
const lastAction = ref('');
const fieldCounter = ref(5);

const activity = ref([
	{ id: 'act-1', actor: 'Mina Cook', action: 'Updated signing order', time: 'Today 11:30' },
	{ id: 'act-2', actor: 'Legal Ops', action: 'Approved NDA template', time: 'Today 10:18' },
	{ id: 'act-3', actor: 'Mina Cook', action: 'Added candidate signature fields', time: 'Yesterday 16:45' },
]);

const selectedDocument = computed(() => documents.find((document) => document.id === selectedDocumentId.value) || documents[0]);
const selectedSigner = computed(() => signers.value.find((signer) => signer.id === selectedSignerId.value) || signers.value[0]);
const selectedSignerFields = computed(() => placedFields.value.filter((field) => field.signerId === selectedSigner.value.id));
const selectedDocumentFields = computed(() => placedFields.value.filter((field) => field.documentId === selectedDocument.value.id));
const requiredSigners = computed(() => signers.value.filter((signer) => signer.required));
const completeRequiredSigners = computed(() => requiredSigners.value.filter((signer) => signer.email.includes('@') && signerHasSignature(signer.id)));
const pendingFieldCount = computed(() => placedFields.value.filter((field) => field.required).length);
const readyChecks = computed(() => [
	{ label: 'Every required signer has an email address', done: requiredSigners.value.every((signer) => signer.email.includes('@')) },
	{ label: 'Every required signer has a signature field', done: requiredSigners.value.every((signer) => signerHasSignature(signer.id)) },
	{ label: 'Packet message is ready for recipients', done: message.value.trim().length >= 24 },
	{ label: 'Current document versions are approved', done: documents.every((document) => document.status !== 'Needs review') },
	{ label: 'Declines require a signer reason', done: declineRequiresReason.value },
]);
const readyCount = computed(() => readyChecks.value.filter((check) => check.done).length);
const readinessScore = computed(() => Math.round((readyCount.value / readyChecks.value.length) * 100));
const sendReady = computed(() => readyChecks.value.every((check) => check.done));
const signerProgress = computed(() => `${completeRequiredSigners.value.length}/${requiredSigners.value.length}`);

const packetActions = [
	{ label: 'Duplicate packet', value: 'duplicate' },
	{ label: 'Download audit draft', value: 'audit' },
	{ label: 'Save as template', value: 'template' },
	{ separator: true },
	{ label: 'Void draft', value: 'void', tone: 'danger' },
];

function signerHasSignature(signerId) {
	return placedFields.value.some((field) => field.signerId === signerId && field.type === 'Signature');
}

function addField(type = selectedFieldType.value) {
	const positions = [
		{ x: 20, y: 58 },
		{ x: 58, y: 58 },
		{ x: 20, y: 84 },
		{ x: 58, y: 84 },
		{ x: 74, y: 35 },
	];
	const position = positions[placedFields.value.length % positions.length];
	const signer = selectedSigner.value;
	const id = `field-${fieldCounter.value}`;
	fieldCounter.value += 1;
	placedFields.value.push({
		id,
		label: `${signer.role} ${type.toLowerCase()}`,
		type,
		signerId: signer.id,
		documentId: selectedDocument.value.id,
		page: selectedDocument.value.pages,
		x: position.x,
		y: position.y,
		required: type !== 'Text field',
	});
	lastAction.value = `Added ${type.toLowerCase()} for ${signer.name}`;
}

function removeField(fieldId) {
	placedFields.value = placedFields.value.filter((field) => field.id !== fieldId);
	lastAction.value = 'Removed field from packet';
}

function addSigner() {
	const id = `signer-${signers.value.length + 1}`;
	signers.value.push({
		id,
		name: 'New signer',
		email: '',
		role: 'Legal reviewer',
		color: 'bg-secondary text-canvas-fg',
		order: signers.value.length + 1,
		required: true,
		identityCheck: false,
	});
	selectedSignerId.value = id;
	activeTab.value = 'details';
	lastAction.value = 'Added signer';
}

function handlePacketAction(action) {
	lastAction.value = action;
	if (action === 'void') packetStatus.value = 'Void draft';
}

function sendPacket() {
	if (!sendReady.value) {
		activeTab.value = 'checks';
		lastAction.value = 'Review blocked checks before sending';
		return;
	}
	packetStatus.value = 'Ready to send';
	lastAction.value = 'Packet passed readiness checks';
	activity.value.unshift({ id: `act-${activity.value.length + 1}`, actor: 'Mina Cook', action: 'Marked packet ready to send', time: 'Just now' });
}

function statusClass(status) {
	if (status === 'Approved' || status === 'Current') return 'bg-success/15 text-success';
	if (status === 'Needs review') return 'bg-warning/15 text-warning';
	return 'bg-secondary text-muted-fg';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-lg border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-4 py-4 sm:px-6">
			<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<span class="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">{{ packetStatus }}</span>
						<span class="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-fg">{{ selectedDocument.pages }} page document</span>
					</div>
					<h3 class="mt-2 text-2xl font-semibold tracking-tight">Prepare signature packet</h3>
					<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">
						Assemble signers, place required fields, review delivery rules, and keep a clean audit trail before the packet leaves the product.
					</p>
				</div>
				<div class="grid gap-2 sm:grid-cols-[13rem_auto_auto]">
					<DomNativeSelect v-model="selectedPacket" label="Packet" :options="packetOptions" />
					<DomDropdown label="Actions" align="right" width="min-w-[13rem]" :items="packetActions" @select="handlePacketAction">
						<template #item="{ item }">
							<span :class="item.tone === 'danger' ? 'text-destructive' : ''">{{ item.label }}</span>
						</template>
					</DomDropdown>
					<DomButton @click="sendPacket">
						<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M4 12h14M12 6l6 6-6 6M5 5h14v14H5V5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
						Send
					</DomButton>
				</div>
			</div>
		</header>

		<section class="grid divide-y divide-border border-b border-border sm:grid-cols-4 sm:divide-x sm:divide-y-0">
			<div class="px-4 py-4 sm:px-6">
				<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Readiness</p>
				<p class="mt-2 text-2xl font-semibold">{{ readinessScore }}%</p>
			</div>
			<div class="px-4 py-4 sm:px-6">
				<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Signers</p>
				<p class="mt-2 text-2xl font-semibold">{{ signerProgress }}</p>
			</div>
			<div class="px-4 py-4 sm:px-6">
				<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Fields</p>
				<p class="mt-2 text-2xl font-semibold">{{ pendingFieldCount }}</p>
			</div>
			<div class="px-4 py-4 sm:px-6">
				<div class="flex items-center gap-2">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Delivery</p>
					<DomTooltip text="Signing order can be enforced by the API when the packet is sent." placement="top">
						<button type="button" class="grid size-5 place-items-center rounded-full border border-border text-[11px] text-muted-fg">?</button>
					</DomTooltip>
				</div>
				<p class="mt-2 text-lg font-semibold">{{ deliveryMode }}</p>
			</div>
		</section>

		<div class="grid min-h-[52rem] lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)_22rem]">
			<aside class="border-b border-border skin-card lg:border-b-0 lg:border-r">
				<div class="border-b border-border p-3">
					<div class="flex items-center justify-between gap-3 px-2 pb-2">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Documents</p>
						<span class="text-xs text-muted-fg">{{ documents.length }}</span>
					</div>
					<div class="divide-y divide-border rounded-lg border border-border bg-canvas">
						<button
							v-for="document in documents"
							:key="document.id"
							type="button"
							class="grid w-full gap-2 px-3 py-3 text-left transition hover:bg-secondary/40"
							:class="selectedDocumentId === document.id ? 'bg-primary/10' : ''"
							@click="selectedDocumentId = document.id"
						>
							<span class="flex items-start justify-between gap-3">
								<span class="min-w-0">
									<span class="block truncate text-sm font-semibold">{{ document.name }}</span>
									<span class="mt-1 block text-xs text-muted-fg">{{ document.owner }} / {{ document.updated }}</span>
								</span>
								<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="statusClass(document.status)">
									{{ document.status }}
								</span>
							</span>
						</button>
					</div>
				</div>

				<div class="border-b border-border p-3">
					<div class="flex items-center justify-between gap-3 px-2 pb-2">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Signers</p>
						<button type="button" class="text-xs font-semibold text-primary" @click="addSigner">Add</button>
					</div>
					<div class="grid gap-2">
						<button
							v-for="signer in signers"
							:key="signer.id"
							type="button"
							class="rounded-lg border border-border bg-canvas p-3 text-left transition hover:border-primary/40"
							:class="selectedSignerId === signer.id ? 'ring-2 ring-primary/25' : ''"
							@click="selectedSignerId = signer.id"
						>
							<span class="flex items-start gap-3">
								<span class="grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold" :class="signer.color">
									{{ signer.name.slice(0, 1) }}
								</span>
								<span class="min-w-0 flex-1">
									<span class="flex items-center justify-between gap-2">
										<span class="truncate text-sm font-semibold">{{ signer.name }}</span>
										<span class="text-xs text-muted-fg">#{{ signer.order }}</span>
									</span>
									<span class="mt-1 block truncate text-xs text-muted-fg">{{ signer.email || 'Email needed' }}</span>
									<span class="mt-2 inline-flex rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-fg">
										{{ signer.role }}
									</span>
								</span>
							</span>
						</button>
					</div>
				</div>

				<div class="grid gap-3 p-3">
					<DomNativeSelect v-model="deliveryMode" label="Delivery mode" :options="deliveryOptions" />
					<DomNativeSelect v-model="reminderCadence" label="Reminder cadence" :options="reminderOptions" />
					<DomToggle v-model="signingOrderEnabled" label="Enforce signing order" description="Lock later signers until earlier steps finish." />
					<DomToggle v-model="autoReminders" label="Auto reminders" description="Send pending-signature reminders from backend jobs." />
				</div>
			</aside>

			<main class="min-w-0 border-b border-border xl:border-b-0 xl:border-r">
				<section class="border-b border-border px-4 py-4 sm:px-6">
					<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Field placement</p>
							<h4 class="mt-1 text-xl font-semibold tracking-tight">{{ selectedDocument.name }}</h4>
							<p class="mt-1 text-sm leading-6 text-muted-fg">
								Fields are shown as page-relative markers. Connect these to a PDF renderer or provider field API in production.
							</p>
						</div>
						<div class="grid gap-2 sm:grid-cols-[10rem_auto]">
							<DomNativeSelect v-model="selectedFieldType" label="Field type" :options="fieldTypeOptions" />
							<DomButton variant="secondary" @click="addField()">
								<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
									<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
								</svg>
								Add field
							</DomButton>
						</div>
					</div>
				</section>

				<section class="grid gap-4 p-4 sm:p-6 2xl:grid-cols-[minmax(0,1fr)_16rem]">
					<div class="mx-auto w-full max-w-[42rem]">
						<div class="overflow-hidden rounded-lg border border-border bg-secondary/40 p-3 sm:p-5">
							<div class="relative mx-auto aspect-[8.5/11] w-full max-w-[35rem] overflow-hidden rounded-md border border-border bg-white p-8 text-slate-950 shadow-xl">
								<div class="flex items-start justify-between gap-6 border-b border-slate-200 pb-5">
									<div>
										<p class="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Acme People</p>
										<h5 class="mt-2 text-2xl font-semibold">Offer letter summary</h5>
									</div>
									<p class="text-right text-xs font-medium text-slate-500">Page {{ selectedDocument.pages }} of {{ selectedDocument.pages }}</p>
								</div>

								<div class="mt-8 grid gap-4 text-sm leading-7 text-slate-600">
									<div class="h-3 w-3/4 rounded-full bg-slate-200"></div>
									<div class="h-3 w-11/12 rounded-full bg-slate-200"></div>
									<div class="h-3 w-5/6 rounded-full bg-slate-200"></div>
									<div class="mt-4 h-3 w-10/12 rounded-full bg-slate-200"></div>
									<div class="h-3 w-7/12 rounded-full bg-slate-200"></div>
									<div class="mt-8 grid grid-cols-2 gap-6">
										<div class="h-24 rounded border border-slate-200 bg-slate-50"></div>
										<div class="h-24 rounded border border-slate-200 bg-slate-50"></div>
									</div>
								</div>

								<button
									v-for="field in selectedDocumentFields"
									:key="field.id"
									type="button"
									class="absolute min-w-28 rounded-md border border-current bg-white/95 px-2 py-1 text-left text-xs font-semibold shadow-lg transition hover:-translate-y-0.5"
									:class="signers.find((signer) => signer.id === field.signerId)?.color || 'text-canvas-fg'"
									:style="{ left: `${field.x}%`, top: `${field.y}%`, transform: 'translate(-10%, -50%)' }"
									@click="selectedSignerId = field.signerId"
								>
									<span class="block">{{ field.type }}</span>
									<span class="block text-[10px] opacity-80">{{ signers.find((signer) => signer.id === field.signerId)?.role }}</span>
								</button>
							</div>
						</div>
					</div>

					<div class="divide-y divide-border rounded-lg border border-border">
						<div class="p-4">
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Placed fields</p>
							<p class="mt-1 text-sm leading-6 text-muted-fg">Review required fields for the selected signer.</p>
						</div>
						<div class="max-h-[31rem] divide-y divide-border overflow-auto">
							<div v-for="field in selectedSignerFields" :key="field.id" class="grid gap-2 p-4">
								<div class="flex items-start justify-between gap-3">
									<div>
										<p class="text-sm font-semibold">{{ field.label }}</p>
										<p class="mt-1 text-xs text-muted-fg">{{ field.type }} / page {{ field.page }}</p>
									</div>
									<button type="button" class="text-xs font-semibold text-destructive" @click="removeField(field.id)">Remove</button>
								</div>
								<DomCheckbox v-model="field.required" label="Required before completion" />
							</div>
							<div v-if="selectedSignerFields.length === 0" class="p-4 text-sm leading-6 text-muted-fg">
								No fields have been assigned to {{ selectedSigner.name }} yet.
							</div>
						</div>
					</div>
				</section>
			</main>

			<aside class="min-w-0 skin-card p-4 sm:p-5">
				<DomTabs v-model="activeTab" :tabs="tabs">
					<template #details>
						<div class="grid gap-4">
							<div>
								<h4 class="text-base font-semibold">Recipient details</h4>
								<p class="mt-1 text-sm leading-6 text-muted-fg">Edit the selected signer and message before sending.</p>
							</div>
							<DomTextInput v-model="selectedSigner.name" label="Signer name" />
							<DomEmailInput v-model="selectedSigner.email" label="Signer email" />
							<DomNativeSelect v-model="selectedSigner.role" label="Signer role" :options="signerRoleOptions" />
							<div class="grid gap-3 rounded-lg border border-border bg-canvas p-3">
								<DomCheckbox v-model="selectedSigner.required" label="Required signer" description="Packet cannot complete without this signer." />
								<DomCheckbox v-model="selectedSigner.identityCheck" label="Require identity check" description="Ask the provider to verify this signer." />
								<DomCheckbox v-model="declineRequiresReason" label="Require decline reason" description="Capture useful audit evidence when a signer declines." />
							</div>
							<DomTextareaInput v-model="message" label="Recipient message" :rows="4" />
							<DomTextareaInput v-model="internalNote" label="Internal note" :rows="3" />
						</div>
					</template>

					<template #checks>
						<div class="grid gap-4">
							<div>
								<h4 class="text-base font-semibold">Send checks</h4>
								<p class="mt-1 text-sm leading-6 text-muted-fg">Block sending until required signature evidence is ready.</p>
							</div>
							<div class="overflow-hidden rounded-lg border border-border bg-canvas">
								<div
									v-for="check in readyChecks"
									:key="check.label"
									class="flex items-start gap-3 border-b border-border px-3 py-3 last:border-b-0"
								>
									<span class="mt-0.5 grid size-6 place-items-center rounded-full text-[10px] font-bold" :class="check.done ? 'bg-success text-success-fg' : 'bg-warning/20 text-warning'">
										{{ check.done ? 'OK' : '!' }}
									</span>
									<p class="text-sm leading-6">{{ check.label }}</p>
								</div>
							</div>
							<div class="rounded-lg border border-border bg-primary/10 p-4">
								<p class="text-sm font-semibold">Readiness {{ readinessScore }}%</p>
								<div class="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
									<div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${readinessScore}%` }"></div>
								</div>
								<p class="mt-3 text-xs leading-5 text-muted-fg">{{ readyCount }} of {{ readyChecks.length }} checks are passing.</p>
							</div>
						</div>
					</template>

					<template #activity>
						<div class="grid gap-4">
							<div>
								<h4 class="text-base font-semibold">Activity history</h4>
								<p class="mt-1 text-sm leading-6 text-muted-fg">Keep these events immutable after a packet is sent.</p>
							</div>
							<div class="relative grid gap-4 before:absolute before:left-2 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
								<div v-for="event in activity" :key="event.id" class="relative grid gap-1 pl-7">
									<span class="absolute left-0 top-1.5 size-4 rounded-full border-2 border-canvas bg-primary"></span>
									<p class="text-sm font-semibold">{{ event.action }}</p>
									<p class="text-xs text-muted-fg">{{ event.actor }} / {{ event.time }}</p>
								</div>
							</div>
							<p v-if="lastAction" class="rounded-lg border border-border bg-canvas p-3 text-xs font-semibold text-muted-fg">
								Last action: <span class="text-canvas-fg">{{ lastAction }}</span>
							</p>
						</div>
					</template>
				</DomTabs>
			</aside>
		</div>
	</div>
</template>
