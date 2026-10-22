<script setup>
const accounts = [
	{ name: 'Northwind Logistics', arr: '£184k', usage: -38, risk: 'High' },
	{ name: 'Helios Health', arr: '£96k', usage: -21, risk: 'Medium' },
	{ name: 'Kestrel Retail', arr: '£72k', usage: -17, risk: 'Medium' },
];
</script>

<template>
	<div class="overflow-hidden rounded-2xl border border-border bg-canvas shadow-xl shadow-canvas-fg/5">
		<div class="flex items-center gap-2 border-b border-border px-4 py-3 text-xs">
			<span class="grid size-6 place-items-center rounded-md bg-primary text-primary-fg" aria-hidden="true">✦</span>
			<span class="font-semibold">Account assistant</span>
			<span class="ml-auto text-muted-fg">Customer success workspace</span>
		</div>
		<div class="space-y-5 p-4 text-sm sm:p-6">
			<div class="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-secondary px-4 py-2.5">Which accounts are at risk this quarter? Book check-ins for the worst ones.</div>
			<div class="space-y-3">
				<div class="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-fg">
					<span class="size-1.5 rounded-full bg-success" aria-hidden="true"></span>
					<span class="font-mono">query_accounts</span>
					<span>· usage down &gt; 15% · renewal &lt; 90 days</span>
					<span class="ml-auto">3 results</span>
				</div>
				<p class="leading-6">Three accounts look at risk. Northwind is the most urgent: usage is down 38% and they renew in 41 days.</p>
				<div class="overflow-hidden rounded-xl border border-border">
					<table class="w-full text-left text-xs tabular-nums">
						<thead class="bg-secondary/40 text-muted-fg">
							<tr><th class="px-3 py-2 font-medium">Account</th><th class="px-3 py-2 text-right font-medium">ARR</th><th class="px-3 py-2 text-right font-medium">Usage</th><th class="px-3 py-2 font-medium">Risk</th></tr>
						</thead>
						<tbody>
							<tr v-for="account in accounts" :key="account.name" class="border-t border-border">
								<td class="px-3 py-2 font-medium">{{ account.name }}</td>
								<td class="px-3 py-2 text-right">{{ account.arr }}</td>
								<td class="px-3 py-2 text-right text-destructive">{{ account.usage }}%</td>
								<td class="px-3 py-2"><span class="rounded-full px-2 py-0.5" :class="account.risk === 'High' ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'">{{ account.risk }}</span></td>
							</tr>
						</tbody>
					</table>
				</div>
				<div class="rounded-xl border border-ring/40 bg-ring/5 p-4">
					<p class="text-xs font-medium">Book 30-minute check-ins with all three account owners?</p>
					<div class="mt-3 flex flex-wrap gap-2 text-xs">
						<span class="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-fg">Book 3 meetings</span>
						<span class="rounded-md border border-border bg-canvas px-3 py-1.5">Only Northwind</span>
						<span class="rounded-md px-3 py-1.5 text-muted-fg">Not now</span>
					</div>
				</div>
			</div>
			<div class="rounded-xl border border-border p-3">
				<div class="flex flex-wrap gap-1.5 text-[0.7rem]">
					<span class="rounded-md bg-secondary px-2 py-0.5">@ CRM</span>
					<span class="rounded-md bg-secondary px-2 py-0.5">📎 renewals.csv</span>
				</div>
				<div class="mt-2 flex items-center justify-between text-muted-fg">
					<span>Ask a follow-up…</span>
					<span class="grid size-7 place-items-center rounded-full bg-primary text-primary-fg" aria-hidden="true">↑</span>
				</div>
			</div>
		</div>
	</div>
</template>
