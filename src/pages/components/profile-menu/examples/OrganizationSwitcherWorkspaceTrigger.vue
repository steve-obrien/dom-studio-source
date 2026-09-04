<script setup>
import { computed, ref } from 'vue';
import { DomProfileMenu } from '@getdom/studio/vue';
import OrganizationMenuRow from './OrganizationMenuRow.vue';
import {
	createOrganizationOption,
	exampleOrganizations,
	organizationSettingsPaths,
} from './organizationExampleData.js';

const selectedOrganizationId = ref('newicon');
const activity = ref('Newicon is the active organization.');

/**
 * Resolve the organization selected within this isolated example.
 *
 * @returns {{ id: string, name: string, initials: string, avatarClass: string }} Selected organization record.
 */
function resolveCurrentOrganization() {
	return exampleOrganizations.find((organization) => organization.id === selectedOrganizationId.value) || exampleOrganizations[0];
}

/**
 * Create an organization option using the current local selection.
 *
 * @param {{ id: string, name: string, initials: string, avatarClass: string }} organization Organization record.
 * @returns {object} DOM Studio menu item definition.
 */
function createOption(organization) {
	return createOrganizationOption(organization, selectedOrganizationId.value);
}

/**
 * Build the organization-first profile menu shown by the workspace trigger.
 *
 * @returns {object[]} Menu items for the workspace-trigger derivative.
 */
function buildMenuItems() {
	return [
		{ type: 'label', value: 'organization-label', label: 'Switch organization' },
		...exampleOrganizations.map(createOption),
		{ separator: true },
		{
			value: 'organization-settings',
			label: 'Organization settings',
			description: `Manage ${currentOrganization.value.name}`,
			paths: organizationSettingsPaths,
		},
		{ separator: true },
		{ type: 'label', value: 'account-label', label: 'Personal account', description: 'steve@newicon.net' },
		{ value: 'profile', label: 'Profile', description: 'Personal details and preferences', icon: 'profile', href: '#profile', accessorySlot: 'theme-switcher' },
		{ value: 'logout', label: 'Log out', description: 'End the current session', icon: 'logout', tone: 'danger' },
	];
}

/**
 * Switch the active organization when a radio option changes.
 *
 * @param {{ value?: string, checked?: boolean }} event Profile-menu change payload.
 * @returns {void}
 */
function onMenuChange(event) {
	if (!event.checked) return;
	const organization = exampleOrganizations.find((candidate) => candidate.id === event.value);
	if (!organization) return;
	selectedOrganizationId.value = organization.id;
	activity.value = `${organization.name} is now the active organization.`;
}

/**
 * Reflect settings and account actions without leaving the demo.
 *
 * @param {{ value?: string }} event Profile-menu selection payload.
 * @returns {void}
 */
function onMenuSelect(event) {
	if (event.value === 'organization-settings') activity.value = `Opening settings for ${currentOrganization.value.name}.`;
	if (event.value === 'profile') activity.value = 'Opening your personal profile.';
	if (event.value === 'logout') activity.value = 'Log out selected.';
}

const currentOrganization = computed(resolveCurrentOrganization);
const items = computed(buildMenuItems);
</script>

<template>
	<div class="grid gap-3">
		<DomProfileMenu
			:name="currentOrganization.name"
			email="Steve O'Brien"
			:initials="currentOrganization.initials"
			:items="items"
			width="min-w-[19rem]"
			show-name
			@change="onMenuChange"
			@select="onMenuSelect"
		>
			<template #item="{ item, label, value }">
				<OrganizationMenuRow :item="item" :label="label" :value="value" />
			</template>
		</DomProfileMenu>

		<p class="text-xs text-muted-fg" aria-live="polite">{{ activity }}</p>
	</div>
</template>
