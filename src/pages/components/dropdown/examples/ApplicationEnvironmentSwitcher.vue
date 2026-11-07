<script setup>
import { computed, ref } from 'vue';
import { DomAvatar, DomButton, DomDropdown, DomMenu } from '@getdom/studio/vue';

const dropdown = ref(null);
const lastAction = ref('');
const applications = [
	{
		id: 'steve-obrien',
		label: 'steve-obrien',
		initials: 'S',
		environments: [
			{ id: 'production', label: 'production' },
			{ id: 'staging', label: 'staging' },
		],
	},
	{
		id: 'client-portal',
		label: 'client-portal',
		initials: 'C',
		environments: [
			{ id: 'production', label: 'production' },
			{ id: 'preview', label: 'preview' },
		],
	},
];
const selectedApplicationId = ref('steve-obrien');
const selectedEnvironmentIds = ref({
	'steve-obrien': 'production',
	'client-portal': 'production',
});

/**
 * Find the application currently shown in the switcher trigger.
 *
 * @returns {object | undefined} Selected application record.
 */
function getSelectedApplication() {
	for (const application of applications) {
		if (application.id === selectedApplicationId.value) return application;
	}
	return undefined;
}

/**
 * Find the selected environment within the active application.
 *
 * @returns {object | undefined} Selected environment record.
 */
function getSelectedEnvironment() {
	for (const environment of selectedApplication.value?.environments || []) {
		if (environment.id === selectedEnvironmentIds.value[selectedApplicationId.value]) return environment;
	}
	return undefined;
}

/**
 * Build radio menu rows for the available applications.
 *
 * @returns {object[]} Application menu rows.
 */
function getApplicationItems() {
	const items = [];
	for (const application of applications) {
		items.push({
			...application,
			value: application.id,
			type: 'radio',
			checked: application.id === selectedApplicationId.value,
		});
	}
	return items;
}

/**
 * Build radio menu rows for the active application's environments.
 *
 * @returns {object[]} Environment menu rows.
 */
function getEnvironmentItems() {
	const items = [];
	for (const environment of selectedApplication.value?.environments || []) {
		items.push({
			...environment,
			value: environment.id,
			type: 'radio',
			checked: environment.id === selectedEnvironmentIds.value[selectedApplicationId.value],
		});
	}
	return items;
}

const selectedApplication = computed(getSelectedApplication);
const selectedEnvironment = computed(getSelectedEnvironment);
const applicationItems = computed(getApplicationItems);
const environmentItems = computed(getEnvironmentItems);

/**
 * Switch applications while keeping the panel open for environment selection.
 *
 * @param {{ value: string }} selection Selected application menu event.
 * @returns {void}
 */
function selectApplication(selection) {
	selectedApplicationId.value = selection.value;
	lastAction.value = '';
}

/**
 * Commit the environment for the active application and close the panel.
 *
 * @param {{ value: string }} selection Selected environment menu event.
 * @returns {void}
 */
function selectEnvironment(selection) {
	selectedEnvironmentIds.value[selectedApplicationId.value] = selection.value;
	lastAction.value = '';
	dropdown.value?.close();
}

/**
 * Surface a demo action for the host application to wire to its own route.
 *
 * @param {string} action Human-readable action label.
 * @returns {void}
 */
function requestAction(action) {
	lastAction.value = action;
	dropdown.value?.close();
}
</script>

<template>
	<div class="grid w-full justify-items-start gap-3">
		<DomDropdown
			ref="dropdown"
			panel-type="dialog"
			width="w-[min(42rem,calc(100vw-2rem))]"
		>
			<template #trigger>
				<DomAvatar :name="selectedApplication?.label" :initials="selectedApplication?.initials" shape="square" size="xs" class="bg-success/10 text-success ring-success/20" />
				<span class="max-w-32 truncate sm:max-w-48">{{ selectedApplication?.label }}</span>
				<span class="text-muted-fg" aria-hidden="true">·</span>
				<span class="grid size-6 shrink-0 place-items-center rounded-lg border border-border bg-canvas" aria-hidden="true">
					<span class="size-4 rounded bg-primary"></span>
				</span>
				<span class="max-w-28 truncate sm:max-w-40">{{ selectedEnvironment?.label }}</span>
			</template>

			<template #panel>
				<div role="dialog" aria-label="Application and environment" class="grid max-h-[min(75vh,33rem)] grid-cols-1 overflow-y-auto rounded-xl sm:grid-cols-2">
					<section aria-label="Applications" class="flex min-h-48 min-w-0 flex-col sm:min-h-72">
						<div class="min-h-0 flex-1 p-2">
							<DomMenu :items="applicationItems" :skin="false" @change="selectApplication">
								<template #item-row="{ item }">
									<span class="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1" :class="item.checked && 'bg-secondary'">
										<DomAvatar :name="item.label" :initials="item.initials" shape="square" size="sm" class="bg-success/10 text-success ring-success/20" />
										<span class="min-w-0 truncate font-medium">{{ item.label }}</span>
									</span>
								</template>
							</DomMenu>
						</div>
						<div class="border-t border-border p-2">
							<DomButton variant="ghost" size="sm" class="w-full !justify-start !text-primary" @click="requestAction('New application')">
								<span class="grid size-6 place-items-center rounded-lg border border-border text-lg leading-none" aria-hidden="true">+</span>
								New application
							</DomButton>
						</div>
					</section>

					<section :aria-label="`Environments for ${selectedApplication?.label}`" class="flex min-h-48 min-w-0 flex-col border-t border-border sm:min-h-72 sm:border-l sm:border-t-0">
						<div class="min-h-0 flex-1 p-2">
							<DomMenu :key="selectedApplicationId" :items="environmentItems" :skin="false" @change="selectEnvironment">
								<template #item-row="{ item }">
									<span class="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1" :class="item.checked && 'bg-secondary'">
										<span class="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-canvas" aria-hidden="true"><span class="size-5 rounded-md bg-primary"></span></span>
										<span class="min-w-0 truncate font-medium">{{ item.label }}</span>
										<svg v-if="item.checked" viewBox="0 0 20 20" class="ml-auto size-4 shrink-0 text-muted-fg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 10 4 4 8-8" /></svg>
									</span>
								</template>
							</DomMenu>
						</div>
						<div class="border-t border-border p-2">
							<DomButton variant="ghost" size="sm" class="w-full !justify-start !text-primary" @click="requestAction(`New environment for ${selectedApplication?.label}`)">
								<span class="grid size-6 place-items-center rounded-lg border border-border text-lg leading-none" aria-hidden="true">+</span>
								New environment
							</DomButton>
						</div>
					</section>
				</div>
			</template>
		</DomDropdown>

		<p class="text-xs text-muted-fg" role="status">
			{{ lastAction || `Selected: ${selectedApplication?.label} / ${selectedEnvironment?.label}` }}
		</p>
	</div>
</template>
