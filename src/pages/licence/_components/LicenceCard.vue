<script setup>
import { computed } from 'vue';
import { DomButton } from '../../lib/vue';

const props = defineProps({ licence: { type: Object, required: true } });
const purchaseDate = computed(() => new Date(props.licence.purchasedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }));

/**
 * Saves the server-issued confirmation and its original terms as a portable text document.
 *
 * @returns {void}
 */
function download() {
	const url = URL.createObjectURL(new Blob([props.licence.confirmation], { type: 'text/plain;charset=utf-8' }));
	const link = document.createElement('a');
	link.href = url;
	link.download = `${props.licence.reference}.txt`;
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>

<template>
	<article class="min-w-0 rounded-2xl border border-border bg-secondary/30 p-6 sm:p-8">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<p class="text-xs font-semibold uppercase tracking-wider text-muted-fg">DOM Studio</p>
				<h2 class="mt-2 text-2xl font-semibold">{{ licence.licence === 'team' ? 'Team' : 'Individual' }} licence</h2>
			</div>
			<span class="rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">{{ licence.amount === 0 ? 'Complete' : 'Paid' }}</span>
		</div>
		<dl class="mt-6 grid gap-5 text-sm sm:grid-cols-2">
			<div class="min-w-0 sm:col-span-2"><dt class="text-muted-fg">Licence reference</dt><dd class="mt-1 break-all font-mono text-xs">{{ licence.reference }}</dd></div>
			<div class="min-w-0"><dt class="text-muted-fg">Licensed to</dt><dd class="mt-1 break-words font-medium">{{ licence.name || licence.email }}</dd></div>
			<div class="min-w-0"><dt class="text-muted-fg">Purchase email</dt><dd class="mt-1 break-all">{{ licence.email }}</dd></div>
			<div><dt class="text-muted-fg">Purchased</dt><dd class="mt-1">{{ purchaseDate }}</dd></div>
			<div><dt class="text-muted-fg">Licence terms</dt><dd class="mt-1">Commercial License {{ licence.termsVersion }}</dd></div>
		</dl>
		<p class="mt-6 border-t border-border pt-5 text-sm leading-6 text-muted-fg">Perpetual use. All v1 updates included. Future major upgrades are optional. Keep your confirmation as proof of your licence.</p>
		<div class="mt-5 flex flex-wrap gap-3">
			<DomButton @click="download">Download licence confirmation</DomButton>
			<DomButton v-if="licence.receiptUrl" as="a" :href="licence.receiptUrl" target="_blank" rel="noopener noreferrer" variant="secondary">View Stripe receipt</DomButton>
		</div>
	</article>
</template>
