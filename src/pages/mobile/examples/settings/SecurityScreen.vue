<script setup>
import { ref } from 'vue';
import {
	DomAppListItem,
	DomBadge,
	DomButton,
	DomToggle,
} from '@getdom/studio/vue';

const twoFactorEnabled = ref(true);
const passkeysEnabled = ref(false);
</script>

<template>
	<section class="space-y-5">
		<div class="space-y-1">
			<h2 class="text-xl font-semibold tracking-tight text-canvas-fg">Security</h2>
			<p class="text-sm leading-6 text-muted-fg">Review sign-in controls, device access, and recovery options.</p>
		</div>

		<div class="rounded-[1.5rem] border border-border bg-primary p-5 text-primary-fg">
			<p class="text-xs font-medium uppercase tracking-[0.16em] opacity-80">Security score</p>
			<div class="mt-3 flex items-end justify-between gap-4">
				<p class="text-4xl font-semibold tracking-tight">92</p>
				<DomBadge variant="outline">Strong</DomBadge>
			</div>
		</div>

		<div class="overflow-hidden rounded-[1.5rem] border border-border bg-canvas">
			<DomAppListItem as="div" label="Two-factor authentication" description="Require a second step when signing in.">
				<template #trailing>
					<DomToggle v-model="twoFactorEnabled" label="Two-factor authentication" chrome="none" />
				</template>
			</DomAppListItem>
			<DomAppListItem as="div" label="Passkeys" description="Use device-native credentials where available.">
				<template #trailing>
					<DomToggle v-model="passkeysEnabled" label="Passkeys" chrome="none" />
				</template>
			</DomAppListItem>
			<DomAppListItem label="Trusted devices" meta="4" chevron />
		</div>

		<DomButton variant="secondary" class="w-full">Review recovery methods</DomButton>
	</section>
</template>
