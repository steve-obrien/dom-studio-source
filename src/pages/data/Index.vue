<script setup>
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';

const componentTypes = [
	{
		name: 'Data grid',
		description: 'Uses the existing grid as the reference for loading SQL-style resources, then sends search, filters, sort, and pagination back to the emulated API.',
		status: 'Reference',
	},
	{
		name: 'Month calendar',
		description: 'Requests remote event windows, renders loaded availability or schedule data, and writes event changes through a defined endpoint contract.',
		status: 'Reference',
	},
	{
		name: 'Team invites',
		description: 'Shows pending invitations with email, role, status, and created date, then calls a remove-invite mutation when access should be withdrawn.',
		status: 'Planned',
	},
];

const boundaries = [
	'Define the backend interface beside the component, including query params, payloads, and response shape.',
	'Use emulated endpoints so demos exercise loading, error, empty, mutation, and refresh states.',
	'Keep local primitives transport-free while data components own server-in-the-loop workflows.',
];
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Data"
			eyebrow="DOM Studio"
			tag="API-backed UI"
			tagline="Fully working interface controls that behave as though they are connected to a backend API."
		>
			<DocSection eyebrow="Overview" title="API-backed application components">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Components in the data section are fully working user interface controls designed to communicate with a backend API. The docs emulate those backends locally and define their interfaces, so examples can run without infrastructure while still behaving like server-backed product surfaces.
					</p>
					<p>
						Demos should follow a server-in-the-loop design: the component sends the same query, mutation, pagination, and refresh messages it would send in production, then renders the emulated response. From the component's point of view, it is talking to an API.
					</p>
				</div>
			</DocSection>

			<DocSection eyebrow="Boundaries" title="What belongs here">
				<div class="grid gap-3 md:grid-cols-3">
					<div
						v-for="item in boundaries"
						:key="item"
						class="rounded-lg border border-border skin-card p-4 text-sm leading-6 text-muted-fg"
					>
						{{ item }}
					</div>
				</div>
			</DocSection>

			<DocSection eyebrow="Roadmap" title="First data components">
				<div class="grid gap-3 md:grid-cols-3">
					<div
						v-for="item in componentTypes"
						:key="item.name"
						class="rounded-lg border border-border skin-card p-4"
					>
						<div class="flex items-start justify-between gap-3">
							<p class="text-sm font-semibold text-canvas-fg">{{ item.name }}</p>
							<span class="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-fg">{{ item.status }}</span>
						</div>
						<p class="mt-3 text-sm leading-6 text-muted-fg">{{ item.description }}</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
