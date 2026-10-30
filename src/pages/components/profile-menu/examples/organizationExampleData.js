export const exampleOrganizations = [
	{ id: 'newicon', name: 'Newicon', initials: 'N', avatarClass: 'bg-violet-500/15 text-violet-700 dark:text-violet-300' },
	{ id: 'growthscout', name: 'GrowthScout', initials: 'G', avatarClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
	{ id: 'flex-digital', name: 'Flex Digital', initials: 'F', avatarClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
];

export const organizationSettingsPaths = [
	'M4 7h10',
	'M18 7h2',
	'M16 5v4',
	'M4 17h2',
	'M10 17h10',
	'M8 15v4',
];

export const switchOrganizationPaths = [
	'M7 7h11l-3-3',
	'M17 17H6l3 3',
];

/**
 * Convert an organization into a radio-style menu option.
 *
 * @param {{ id: string, name: string, initials: string, avatarClass: string }} organization Organization record.
 * @param {string} selectedOrganizationId Currently selected organization identifier.
 * @returns {object} DOM Studio menu item definition.
 */
export function createOrganizationOption(organization, selectedOrganizationId) {
	return {
		value: organization.id,
		label: organization.name,
		initials: organization.initials,
		avatarClass: organization.avatarClass,
		kind: 'organization',
		type: 'radio',
		checked: organization.id === selectedOrganizationId,
	};
}
