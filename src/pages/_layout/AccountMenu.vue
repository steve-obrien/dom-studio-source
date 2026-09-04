<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { DomDropdown, DomButton, DomIconButton } from '@getdom/studio/vue';
import { useAccountStatus } from '../../composable/useAuth.js';

const props = defineProps({
	compact: { type: Boolean, default: false },
});

const router = useRouter();
const account = useAccountStatus();
const user = account.user;
const isLoggedIn = account.isLoggedIn;
const needsPurchase = account.needsPurchase;
const loaded = account.loaded;

const accountLabel = computed(() => {
	if (!isLoggedIn.value) return props.compact ? 'Account' : 'Account';
	return user.value?.email || 'Account';
});

const menuItems = computed(() => {
	if (!isLoggedIn.value) {
		return [
			{ label: 'Sign in', value: 'sign-in' },
			{ label: 'Create account', value: 'sign-up' },
			{ separator: true },
			{ label: 'Get source access', value: 'purchase' },
		];
	}

	const items = [
		{
			label: user.value?.email || 'Signed in',
			value: 'account',
			eyebrow: 'Signed in',
			disabled: true,
		},
	];

	if (needsPurchase.value) {
		items.push(
			{ separator: true },
			{ label: 'Get source access', value: 'purchase', tone: 'primary' },
		);
	} else {
		items.push({
			label: 'Source access active',
			value: 'source-active',
			eyebrow: 'Plan',
			disabled: true,
		});
	}

	items.push(
		{ separator: true },
		{ label: 'Log out', value: 'logout', tone: 'danger' },
	);

	return items;
});

async function selectAccountAction(value) {
	if (value === 'account' || value === 'source-active') return;

	if (value === 'sign-in') {
		await router.push('/auth/sign-in');
		return;
	}

	if (value === 'sign-up') {
		await router.push('/auth/sign-up');
		return;
	}

	if (value === 'purchase') {
		window.location.href = `/api/billing/checkout?from=${encodeURIComponent(router.currentRoute.value.fullPath)}`;
		return;
	}

	if (value === 'logout') {
		await account.signOut();
		if (router.currentRoute.value.meta?.requiresEntitlement) {
			await router.push('/paywall');
		}
	}
}
</script>

<template>
	<div v-show="loaded" class="inline-flex shrink-0 items-center gap-2">
		<template v-if="!isLoggedIn">
			<DomIconButton
				v-if="compact"
				:as="'router-link'"
				to="/auth/sign-in"
				variant="secondary"
				label="Sign in"
				title="Sign in"
				icon="M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
			/>
			<DomButton v-else variant="secondary" :as="'router-link'" to="/auth/sign-in">
				Sign In
			</DomButton>
			<DomButton
				:as="'router-link'"
				to="/auth/sign-up"
				:size="compact ? 'sm' : 'md'"
				:aria-label="compact ? 'Get full access' : undefined"
				:title="compact ? 'Get full access' : undefined"
			>{{ compact ? 'Get' : 'Get full access' }}</DomButton>
		</template>
		<DomDropdown
			v-else
			:items="menuItems"
			:label="accountLabel"
			align="right"
			width="min-w-[16rem]"
			:title="compact ? 'Account' : undefined"
			:show-indicator="!compact"
			:trigger-class="compact
				? 'skin-control inline-grid size-10 place-items-center rounded-full transition hover:brightness-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60'
				: undefined"
			@select="selectAccountAction"
		>
			<template #trigger>
				<template v-if="compact">
					<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
						<path d="M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
					<span class="sr-only">Account</span>
				</template>
				<span v-else class="max-w-[10rem] truncate">Account</span>
			</template>

			<template #item="{ item }">
				<span
					class="flex min-w-0 flex-col"
					:class="[
						item.tone === 'danger' && 'text-destructive',
						item.tone === 'primary' && 'text-primary',
						item.disabled && 'pointer-events-none opacity-70',
					]"
				>
					<span v-if="item.eyebrow" class="text-[10px] font-semibold uppercase tracking-wider text-muted-fg">{{ item.eyebrow }}</span>
					<span class="truncate font-medium">{{ item.label }}</span>
				</span>
			</template>
		</DomDropdown>
		<template v-if="needsPurchase">
			<DomButton
				:as="'router-link'"
				to="/auth/sign-up"
				:size="compact ? 'sm' : 'md'"
				:aria-label="compact ? 'Get full access' : undefined"
				:title="compact ? 'Get full access' : undefined"
			>{{ compact ? 'Get' : 'Get full access' }}</DomButton>
		</template>
	</div>
</template>
