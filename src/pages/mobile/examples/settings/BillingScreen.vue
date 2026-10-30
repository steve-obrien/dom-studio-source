<script setup>
import {
	DomAppListItem,
	DomBadge,
	DomButton,
} from '@getdom/studio/vue';
</script>

<template>
	<section class="space-y-5">
		<div class="space-y-1">
			<h2 class="text-xl font-semibold tracking-tight text-canvas-fg">Billing</h2>
			<p class="text-sm leading-6 text-muted-fg">Manage plan access, payment methods, receipts, and renewal alerts.</p>
		</div>

		<div class="rounded-[1.5rem] border border-border bg-canvas p-5">
			<div class="flex items-start justify-between gap-4">
				<div>
					<p class="text-sm font-semibold text-canvas-fg">Studio Team</p>
					<p class="mt-1 text-xs leading-5 text-muted-fg">Renews on 18 July 2026</p>
				</div>
				<DomBadge>Active</DomBadge>
			</div>
			<div class="mt-5 grid grid-cols-2 gap-3 text-sm">
				<div class="rounded-2xl bg-secondary p-3">
					<p class="text-xs text-muted-fg">Seats</p>
					<p class="mt-1 font-semibold text-canvas-fg">12</p>
				</div>
				<div class="rounded-2xl bg-secondary p-3">
					<p class="text-xs text-muted-fg">Monthly</p>
					<p class="mt-1 font-semibold text-canvas-fg">$248</p>
				</div>
			</div>
		</div>

		<div class="overflow-hidden rounded-[1.5rem] border border-border bg-canvas">
			<DomAppListItem label="Payment method" meta="Visa 4242" chevron />
			<DomAppListItem label="Invoices" meta="12" chevron />
			<DomAppListItem label="Plan limits" description="Usage, seat caps, and add-ons." chevron />
		</div>

		<DomButton class="w-full">Update plan</DomButton>
	</section>
</template>
