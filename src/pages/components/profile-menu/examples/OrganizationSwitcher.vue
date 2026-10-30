<script setup>
import { computed, ref } from 'vue';
import { DomProfileMenu } from '@getdom/studio/vue';
import OrganizationMenuRow from './OrganizationMenuRow.vue';
import {
	createOrganizationOption as createOrganizationMenuOption,
	exampleOrganizations,
	organizationSettingsPaths,
} from './organizationExampleData.js';

const selectedOrganizationId = ref('newicon');
const activity = ref('Newicon is the active organization.');

/**
 * Resolve the currently selected organization from the local demo state.
 *
 * @returns {{ id: string, name: string, initials: string, avatarClass: string }} Selected organization record.
 */
function resolveCurrentOrganization() {
	return exampleOrganizations.find((organization) => organization.id === selectedOrganizationId.value) || exampleOrganizations[0];
}

/**
 * Convert an organization into a checked menu option.
 *
 * @param {{ id: string, name: string, initials: string, avatarClass: string }} organization Organization record.
 * @returns {object} DOM Studio menu item definition.
 */
function createOrganizationOption(organization) {
	return createOrganizationMenuOption(organization, selectedOrganizationId.value);
}

/**
 * Build the preferred profile-menu structure around the active organization.
 *
 * @returns {object[]} Menu items for the interactive example.
 */
function buildMenuItems() {
	const organization = currentOrganization.value;
	return [
		{ type: 'label', value: 'signed-in-as', label: 'Logged in as', description: 'alex@example.com' },
		{ separator: true },
		{
			value: 'organization-switcher',
			label: organization.name,
			description: 'Current organization',
			initials: organization.initials,
			avatarClass: organization.avatarClass,
			kind: 'organization-current',
			children: [
				...exampleOrganizations.map(createOrganizationOption),
				{ separator: true },
				{
					value: 'organization-settings',
					label: 'Organization settings',
					description: `Manage ${organization.name}`,
					paths: organizationSettingsPaths,
				},
			],
		},
		{ separator: true },
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
 * Reflect non-switching actions without navigating away from the example.
 *
 * @param {{ value?: string }} event Profile-menu selection payload.
 * @returns {void}
 */
function onMenuSelect(event) {
	if (event.value === 'organization-settings') {
		activity.value = `Opening settings for ${currentOrganization.value.name}.`;
		return;
	}
	if (event.value === 'profile') activity.value = 'Opening your personal profile.';
	if (event.value === 'logout') activity.value = 'Log out selected.';
}

const currentOrganization = computed(resolveCurrentOrganization);
const items = computed(buildMenuItems);
</script>

<template>
	<div class="grid gap-3">
		<DomProfileMenu
			name="Alex Morgan"
			email="alex@example.com"
			initials="AM"
			:items="items"
			width="min-w-[19rem]"
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
