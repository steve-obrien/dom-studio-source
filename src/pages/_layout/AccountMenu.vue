<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { DomDropdown, DomButton } from '@getdom/studio/vue';
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
	<div v-show="loaded" class="inline-flex flex-wrap items-center gap-2">
		<template v-if="!isLoggedIn">
			<DomButton variant="secondary" :as="'router-link'" to="/auth/sign-in">
				Sign In
			</DomButton>
			<DomButton :as="'router-link'" to="/auth/sign-up">Get full access</DomButton>
		</template>
		<DomDropdown
			v-else
			:items="menuItems"
			:label="accountLabel"
			align="right"
			width="min-w-[16rem]"
			@select="selectAccountAction"
		>
			<template #trigger>
				<span class="max-w-[10rem] truncate">Account</span>
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
			<DomButton :as="'router-link'" to="/auth/sign-up">Get full access</DomButton>
		</template>
	</div>
</template>
