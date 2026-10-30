<script setup>
import { markRaw, ref } from 'vue';
import { DomAppProfile, DomMenuStack, DomPopover } from '@getdom/studio/vue';

const selected = ref('No action yet');
const path = ref(['root']);
const items = [
	{
		id: 'account', label: 'Your account', description: 'Profile, preferences, and security',
		component: markRaw(DomAppProfile),
		props: { name: 'Avery Stone', email: 'avery@northstar.app', src: '/favicon.svg', actionLabel: '' },
		children: [
			{ id: 'profile', label: 'Edit profile', slot: 'profile' },
			{ id: 'preferences', label: 'Preferences', children: [
				{ id: 'notifications', label: 'Notifications', children: [
					{ id: 'delivery', label: 'Delivery channels', children: [
						{ id: 'email', label: 'Email digests' },
						{ id: 'push', label: 'Push notifications' },
					] },
				] },
			] },
		],
	},
	{ id: 'workspace', label: 'Workspace', children: [
		{ id: 'members', label: 'Team members', slot: 'members', children: [{ id: 'invite', label: 'Invite a teammate' }] },
		{ id: 'billing', label: 'Billing', description: 'Workspace owner access required', disabled: true },
	] },
	{ id: 'docs', label: 'Documentation', to: '/components' },
];
</script>

<template>
	<div class="w-full max-w-lg space-y-4">
		<p class="text-sm text-muted-fg">Open your account, edit the name, and go Back. The page keeps your changes while this menu is mounted.</p>
		<DomMenuStack v-model:path="path" :items="items" title="Northstar workspace" height="26rem" @select="selected = $event.label">
			<template #profile>
				<label class="block space-y-2 p-4 text-sm font-medium">
					<span>Display name</span>
					<input value="Avery Stone" class="w-full rounded-lg border border-border bg-canvas p-3" />
				</label>
			</template>
			<template #members>
				<div class="space-y-2 p-4">
					<h2 class="font-semibold">Your team</h2>
					<p class="text-sm text-muted-fg">Avery Stone · Owner<br />Jules Park · Designer</p>
				</div>
			</template>
		</DomMenuStack>
		<div class="flex flex-wrap items-center gap-3">
			<DomPopover label="Open workspace menu" :arrow="false" position="bottom-start" padding="p-0" width="w-[min(22rem,calc(100vw-2rem))]">
				<template #default="{ close }">
					<DomMenuStack :items="items" title="Northstar workspace" @select="selected = $event.label; close()">
						<template #profile>
							<label class="block space-y-2 p-4 text-sm"><span>Display name</span><input value="Avery Stone" class="w-full rounded-lg border border-border bg-canvas p-3" /></label>
						</template>
						<template #members><p class="p-4 text-sm text-muted-fg">Avery Stone and Jules Park</p></template>
					</DomMenuStack>
				</template>
			</DomPopover>
			<p aria-live="polite" class="text-sm text-muted-fg">{{ selected }}</p>
		</div>
	</div>
</template>
