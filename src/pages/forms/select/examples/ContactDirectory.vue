<script setup>
import { computed, ref } from 'vue';
import { DomSelect } from '@getdom/studio/vue';

const selectedContact = ref('aisha-adams');
const contactGroups = [
	{ letter: 'A', names: ['Aisha Adams', 'Alina Alvarez'] },
	{ letter: 'B', names: ['Benjamin Brooks', 'Bianca Bennett'] },
	{ letter: 'C', names: ['Camila Chen', 'Caleb Carter'] },
	{ letter: 'D', names: ['Daniel Diaz', 'Daphne Dunn'] },
	{ letter: 'E', names: ['Elias Evans', 'Elena Edwards'] },
	{ letter: 'F', names: ['Fatima Foster', 'Felix Flores'] },
	{ letter: 'G', names: ['Gabriel Green', 'Grace Gupta'] },
	{ letter: 'H', names: ['Hana Hughes', 'Hugo Harris'] },
	{ letter: 'I', names: ['Imani Ibrahim', 'Isaac Ingram'] },
	{ letter: 'J', names: ['Jasmine Jones', 'Jonah Jensen'] },
	{ letter: 'K', names: ['Kai Kim', 'Keira Khan'] },
	{ letter: 'L', names: ['Lena Lewis', 'Luca Lopez'] },
	{ letter: 'M', names: ['Maya Martin', 'Marcus Moore'] },
	{ letter: 'N', names: ['Nina Nguyen', 'Noah Nelson'] },
	{ letter: 'O', names: ['Olivia Ortiz', 'Omar Owens'] },
	{ letter: 'P', names: ['Priya Patel', 'Peter Price'] },
	{ letter: 'Q', names: ['Quinn Quade', 'Quentin Quinn'] },
	{ letter: 'R', names: ['Rina Rivera', 'Rowan Reed'] },
	{ letter: 'S', names: ['Sofia Singh', 'Samuel Scott'] },
	{ letter: 'T', names: ['Talia Turner', 'Theo Taylor'] },
	{ letter: 'U', names: ['Uma Usman', 'Uri Underwood'] },
	{ letter: 'V', names: ['Valeria Vega', 'Victor Vaughn'] },
	{ letter: 'W', names: ['Willow Walker', 'Wesley Wong'] },
	{ letter: 'X', names: ['Ximena Xu', 'Xavier Xiong'] },
	{ letter: 'Y', names: ['Yara Young', 'Yusuf Yilmaz'] },
	{ letter: 'Z', names: ['Zara Zhang', 'Zane Zimmerman'] },
];
const roles = [
	'Account manager',
	'Customer success',
	'Design lead',
	'Engineering manager',
	'Finance partner',
	'Operations lead',
	'Product manager',
	'Support specialist',
];
const contacts = contactGroups.flatMap(buildContactGroup);
const currentContact = computed(() => contacts.find((contact) => contact.value === selectedContact.value));

/**
 * Build the selectable contacts for one alphabetical group.
 *
 * @param {{ letter: string, names: string[] }} group Alphabetical contact group.
 * @param {number} groupIndex Position of the group in the directory.
 * @returns {Array<Object>} DomSelect option records for the group.
 */
function buildContactGroup(group, groupIndex) {
	return group.names.map((name, contactIndex) => buildContact(name, group.letter, groupIndex, contactIndex));
}

/**
 * Create a contact option with deterministic role and email metadata.
 *
 * @param {string} name Contact's display name.
 * @param {string} letter Alphabetical group label.
 * @param {number} groupIndex Position of the group in the directory.
 * @param {number} contactIndex Position of the contact inside the group.
 * @returns {Object} Contact option consumed by DomSelect.
 */
function buildContact(name, letter, groupIndex, contactIndex) {
	const value = contactValue(name);

	return {
		value,
		label: name,
		group: letter,
		description: roles[(groupIndex + contactIndex) % roles.length],
		email: `${value.replace('-', '.')}@example.com`,
	};
}

/**
 * Convert a contact name into a stable option value.
 *
 * @param {string} name Contact's display name.
 * @returns {string} Lowercase hyphenated contact identifier.
 */
function contactValue(name) {
	return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
</script>

<template>
	<div class="grid w-full max-w-lg gap-3">
		<DomSelect
			v-model="selectedContact"
			label="Contact"
			description="Scroll through the directory to test the alphabetical sticky headings."
			:options="contacts"
			searchable
			search-placeholder="Search contacts..."
			width="w-[min(30rem,calc(100vw-2rem))]"
		>
			<template #option="{ option }">
				<span class="block min-w-0">
					<span class="block truncate font-medium">{{ option.label }}</span>
					<span class="mt-0.5 block truncate text-xs text-muted-fg">
						{{ option.description }} · {{ option.email }}
					</span>
				</span>
			</template>
		</DomSelect>

		<p class="text-xs text-muted-fg">
			Selected: <code class="text-canvas-fg">{{ currentContact?.label }}</code>
		</p>
	</div>
</template>
