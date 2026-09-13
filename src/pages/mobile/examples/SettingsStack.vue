<script setup>
import { ref } from 'vue';
import {
	DomAppListItem,
	DomAppShell,
	DomAppStack,
	DomAppStackScreen,
	DomBadge,
	DomButton,
	DomEmailInput,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const path = ref(['settings', 'account']);
const marketingEnabled = ref(false);
const displayName = ref('Steve OBrien');
const email = ref('steve@example.com');

const icons = {
	account: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
	bell: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 21h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
	lock: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" stroke-width="1.8"/><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/></svg>',
	card: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M3 10h18M7 15h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
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
								description="Apple ID, account profile, and workspace identity."
								chevron
								@click="push('account')"
							>
								<template #icon>
									<span class="grid size-10 place-items-center rounded-2xl bg-primary text-sm font-semibold text-primary-fg">SO</span>
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
				:children="['profile']"
				:icon="icons.account"
			>
				<template #default="{ push }">
					<section class="space-y-4">
						<div class="rounded-[1.5rem] border border-border bg-canvas p-5">
							<div class="flex items-center gap-4">
								<span class="grid size-14 place-items-center rounded-2xl bg-primary text-lg font-semibold text-primary-fg">SO</span>
								<div class="min-w-0">
									<h2 class="truncate text-xl font-semibold tracking-tight text-canvas-fg">{{ displayName }}</h2>
									<p class="truncate text-sm text-muted-fg">{{ email }}</p>
								</div>
							</div>
						</div>

						<div class="overflow-hidden rounded-[1.5rem] border border-border bg-canvas">
							<DomAppListItem label="Profile" description="Name, email, and public identity." chevron @click="push('profile')" />
							<DomAppListItem as="div" label="Marketing updates" description="Product news and early feature notes.">
								<template #trailing>
									<DomToggle v-model="marketingEnabled" label="Marketing updates" chrome="none" />
								</template>
							</DomAppListItem>
							<DomAppListItem label="Plan" meta="Studio Team" chevron @click="push('billing')" />
						</div>
					</section>
				</template>
			</DomAppStackScreen>

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
