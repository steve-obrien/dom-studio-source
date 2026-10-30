<script setup>
import { ref } from 'vue';
import {
	DomAppListItem,
	DomAppProfile,
	DomAppShell,
	DomAppStack,
	DomAppStackScreen,
	DomAvatar,
	DomBadge,
	DomButton,
	DomEmailInput,
	DomNativeSelect,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const path = ref(['settings', 'account']);
const marketingEnabled = ref(false);
const displayName = ref('Alex Morgan');
const email = ref('alex@example.com');
const profileImage = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&crop=faces&w=192&h=192&q=80';
const language = ref('en-GB');
const region = ref('GB');
const use24HourTime = ref(true);
const languageOptions = [
	{ label: 'English (UK)', value: 'en-GB' },
	{ label: 'English (US)', value: 'en-US' },
	{ label: 'Français', value: 'fr-FR' },
];
const regionOptions = [
	{ label: 'United Kingdom', value: 'GB' },
	{ label: 'United States', value: 'US' },
	{ label: 'France', value: 'FR' },
];
const previewOptions = [
	{ label: 'Always', value: 'always' },
	{ label: 'When unlocked', value: 'unlocked' },
	{ label: 'Never', value: 'never' },
];
const applications = ref([
	{ id: 'calendar', title: 'Calendar', symbol: '17', description: 'Events, invitations, and shared calendars.', storage: '24 MB', sync: true, alerts: true, sounds: true, badges: true, previews: 'unlocked' },
	{ id: 'notes', title: 'Notes', symbol: 'N', description: 'Your notes, checklists, and shared notebooks.', storage: '86 MB', sync: true, alerts: false, sounds: false, badges: true, previews: 'unlocked' },
]);

const icons = {
	account: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
	bell: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 21h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
	lock: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" stroke-width="1.8"/><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/></svg>',
	card: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M3 10h18M7 15h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
	general: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="7" r="3" fill="var(--secondary)" stroke="currentColor" stroke-width="1.8"/><circle cx="15" cy="17" r="3" fill="var(--secondary)" stroke="currentColor" stroke-width="1.8"/></svg>',
	apps: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8"/></svg>',
};

const screens = [
	{
		id: 'settings',
		title: 'Settings',
		children: ['account', 'notifications', 'security', 'billing'],
	},
	{
		id: 'notifications',
		title: 'Notifications',
		description: 'Push, email, and quiet hours.',
		meta: 'On',
		icon: icons.bell,
		parent: 'settings',
		component: () => import('./settings/NotificationsScreen.vue'),
	},
	{
		id: 'security',
		title: 'Security',
		description: 'Sign-in controls and trusted devices.',
		meta: 'Strong',
		icon: icons.lock,
		parent: 'settings',
		component: () => import('./settings/SecurityScreen.vue'),
	},
	{
		id: 'billing',
		title: 'Billing',
		description: 'Plan, seats, and invoices.',
		meta: 'Team',
		icon: icons.card,
		parent: 'settings',
		component: () => import('./settings/BillingScreen.vue'),
	},
];
</script>

<template>
	<DomAppShell :content-scroll="false">
		<DomAppStack
			v-model:path="path"
			root="settings"
			layout="auto"
			desktop-breakpoint="700px"
			:screens="screens"
			height="100%"
			mobile-panel-class="bg-secondary/40"
			desktop-content-class="bg-secondary/40"
		>

			<DomAppStackScreen
				id="settings"
				title="Settings"
				:children="['account', 'notifications', 'security', 'billing']"
			>
				<template #default="{ push }">
					<section class="space-y-4">
						<div class="overflow-hidden rounded-[1.5rem] border border-border bg-canvas">
							<DomAppListItem
								:label="displayName"
								description="Profile, preferences, and app settings."
								chevron
								@click="push('account')"
							>
								<template #icon>
									<DomAvatar :name="displayName" :src="profileImage" />
								</template>
							</DomAppListItem>
						</div>

						<div class="overflow-hidden rounded-[1.5rem] border border-border bg-canvas">
							<DomAppListItem
								label="Notifications"
								description="Push, email, and quiet hours."
								meta="On"
								chevron
								@click="push('notifications')"
							>
								<template #icon>
									<span class="grid size-5 place-items-center" v-html="icons.bell"></span>
								</template>
							</DomAppListItem>
							<DomAppListItem
								label="Security"
								description="Passkeys, two-factor auth, and devices."
								meta="Strong"
								chevron
								@click="push('security')"
							>
								<template #icon>
									<span class="grid size-5 place-items-center" v-html="icons.lock"></span>
								</template>
							</DomAppListItem>
							<DomAppListItem
								label="Billing"
								description="Plan, seats, receipts, and payment methods."
								meta="Team"
								chevron
								@click="push('billing')"
							>
								<template #icon>
									<span class="grid size-5 place-items-center" v-html="icons.card"></span>
								</template>
							</DomAppListItem>
						</div>
					</section>
				</template>
			</DomAppStackScreen>

			<DomAppStackScreen
				id="account"
				title="Account"
				description="Profile and workspace identity."
				parent="settings"
				:children="['profile', 'general', 'apps']"
				:icon="icons.account"
			>
				<template #default="{ push }">
					<section class="mx-auto max-w-2xl space-y-6">
						<DomAppProfile :name="displayName" :email="email" :src="profileImage" @action="push('profile')" />

						<div class="overflow-hidden rounded-2xl border border-border bg-canvas">
							<DomAppListItem label="General" chevron @click="push('general')">
								<template #icon><span class="size-5" v-html="icons.general"></span></template>
							</DomAppListItem>
							<DomAppListItem label="Apps" meta="2" chevron @click="push('apps')">
								<template #icon><span class="size-5 text-primary" v-html="icons.apps"></span></template>
							</DomAppListItem>
						</div>

						<div class="overflow-hidden rounded-2xl border border-border bg-canvas">
							<DomAppListItem label="Plan" meta="Studio Team" chevron @click="push('billing')">
								<template #icon><span class="size-5 text-primary" v-html="icons.card"></span></template>
							</DomAppListItem>
							<DomAppListItem as="div" label="Marketing updates" description="Product news and early feature notes.">
								<template #trailing>
									<DomToggle v-model="marketingEnabled" label="Marketing updates" chrome="none" />
								</template>
							</DomAppListItem>
						</div>
					</section>
				</template>
			</DomAppStackScreen>

			<DomAppStackScreen id="general" title="General" parent="account" :children="['about', 'language']" v-slot="{ push }">
				<section class="mx-auto max-w-2xl space-y-4">
					<p class="px-1 text-sm leading-6 text-muted-fg">Make the workspace feel at home.</p>
					<div class="overflow-hidden rounded-2xl border border-border bg-canvas">
						<DomAppListItem label="About" chevron @click="push('about')" />
						<DomAppListItem label="Language & Region" chevron @click="push('language')" />
					</div>
					<div class="overflow-hidden rounded-2xl border border-border bg-canvas">
						<DomAppListItem as="div" label="24-hour time">
							<template #trailing><DomToggle v-model="use24HourTime" label="24-hour time" chrome="none" /></template>
						</DomAppListItem>
					</div>
				</section>
			</DomAppStackScreen>

			<DomAppStackScreen id="about" title="About" parent="general">
				<div class="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-canvas">
					<DomAppListItem as="div" label="Name" meta="DOM Studio" />
					<DomAppListItem as="div" label="Version" meta="1.0.0 (Preview)" />
					<DomAppListItem as="div" label="Account" :meta="displayName" />
					<DomAppListItem as="div" label="Plan" meta="Studio Team" />
				</div>
			</DomAppStackScreen>

			<DomAppStackScreen id="language" title="Language & Region" parent="general">
				<section class="mx-auto max-w-2xl space-y-4">
					<div class="space-y-5 rounded-2xl border border-border bg-canvas p-4">
						<DomNativeSelect v-model="language" label="Preferred language" :options="languageOptions" placeholder="" />
						<DomNativeSelect v-model="region" label="Region" :options="regionOptions" placeholder="" />
					</div>
					<p class="px-4 text-xs leading-5 text-muted-fg">Language and region preferences are kept while you explore this example.</p>
				</section>
			</DomAppStackScreen>

			<DomAppStackScreen id="apps" title="Apps" parent="account" :children="['calendar', 'notes']" v-slot="{ push }">
				<section class="mx-auto max-w-2xl space-y-4">
					<p class="px-1 text-sm leading-6 text-muted-fg">Choose an app to manage its notifications and preferences.</p>
					<div class="overflow-hidden rounded-2xl border border-border bg-canvas">
						<DomAppListItem v-for="application in applications" :key="application.id" :label="application.title" chevron @click="push(application.id)">
							<template #icon><span class="grid size-8 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary" aria-hidden="true">{{ application.symbol }}</span></template>
						</DomAppListItem>
					</div>
				</section>
			</DomAppStackScreen>

			<template v-for="application in applications" :key="application.id">
				<DomAppStackScreen :id="application.id" :title="application.title" parent="apps" :children="[`${application.id}-notifications`]" v-slot="{ push }">
					<section class="mx-auto max-w-2xl space-y-6">
						<div class="flex flex-col items-center px-4 pt-4 text-center">
							<span class="grid size-16 place-items-center rounded-2xl bg-primary/10 text-2xl font-semibold text-primary" aria-hidden="true">{{ application.symbol }}</span>
							<h2 class="mt-3 text-xl font-semibold">{{ application.title }}</h2>
							<p class="mt-1 text-sm leading-6 text-muted-fg">{{ application.description }}</p>
						</div>
						<div class="overflow-hidden rounded-2xl border border-border bg-canvas">
							<DomAppListItem label="Notifications" :meta="application.alerts ? 'On' : 'Off'" chevron @click="push(`${application.id}-notifications`)">
								<template #icon><span class="size-5 text-primary" v-html="icons.bell"></span></template>
							</DomAppListItem>
							<DomAppListItem as="div" label="Sync across devices">
								<template #trailing><DomToggle v-model="application.sync" :label="`Sync ${application.title} across devices`" chrome="none" /></template>
							</DomAppListItem>
						</div>
						<div class="overflow-hidden rounded-2xl border border-border bg-canvas">
							<DomAppListItem as="div" label="Storage" :meta="application.storage" />
						</div>
					</section>
				</DomAppStackScreen>

				<DomAppStackScreen :id="`${application.id}-notifications`" title="Notifications" :parent="application.id">
					<section class="mx-auto max-w-2xl space-y-6">
						<p class="px-1 text-sm leading-6 text-muted-fg">Choose how {{ application.title }} gets your attention.</p>
						<div class="overflow-hidden rounded-2xl border border-border bg-canvas">
							<DomAppListItem as="div" label="Allow notifications">
								<template #trailing><DomToggle v-model="application.alerts" label="Allow notifications" chrome="none" /></template>
							</DomAppListItem>
						</div>
						<template v-if="application.alerts">
							<div class="overflow-hidden rounded-2xl border border-border bg-canvas">
								<DomAppListItem as="div" label="Sounds">
									<template #trailing><DomToggle v-model="application.sounds" label="Sounds" chrome="none" /></template>
								</DomAppListItem>
								<DomAppListItem as="div" label="Badges">
									<template #trailing><DomToggle v-model="application.badges" label="Badges" chrome="none" /></template>
								</DomAppListItem>
							</div>
							<div class="rounded-2xl border border-border bg-canvas p-4">
								<DomNativeSelect v-model="application.previews" label="Show previews" :options="previewOptions" placeholder="" />
							</div>
						</template>
						<p class="px-4 text-xs leading-5 text-muted-fg">These preferences apply to {{ application.title }} in this example.</p>
					</section>
				</DomAppStackScreen>
			</template>

			<DomAppStackScreen
				id="profile"
				title="Profile"
				description="Name and contact details."
				parent="account"
				v-slot="{ back }"
			>
				<section class="space-y-5">
					<div class="flex items-center justify-between gap-4">
						<div>
							<h2 class="text-xl font-semibold tracking-tight text-canvas-fg">Profile</h2>
							<p class="mt-1 text-sm leading-6 text-muted-fg">Keep your visible workspace identity up to date.</p>
						</div>
						<DomBadge>Editable</DomBadge>
					</div>

					<div class="space-y-4 rounded-[1.5rem] border border-border bg-canvas p-4">
						<DomTextInput v-model="displayName" label="Display name" />
						<DomEmailInput v-model="email" label="Email address" />
					</div>

					<DomButton class="w-full" @click="back()">Save profile</DomButton>
				</section>
			</DomAppStackScreen>
		</DomAppStack>
	</DomAppShell>
</template>
