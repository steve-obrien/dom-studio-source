<script setup>
import { DomJsonViewer } from '../../../lib/vue';

const response = {
	ok: true,
	requestId: 'req_dom_7d91',
	data: {
		project: {
			id: 'proj_dom_studio',
			name: 'DOM Studio',
			plan: 'Team',
			features: ['components', 'blocks', 'themes', 'agent context'],
		},
		usage: {
			components: 68,
			blocks: 73,
			lastPublishedAt: '2026-07-05T09:30:00.000Z',
		},
	},
	meta: {
		source: 'api',
		durationMs: 42,
		cache: {
			hit: false,
			ttl: 60,
		},
	},
};
</script>

<template>
	<div class="w-full max-w-3xl">
		<DomJsonViewer
			:value="response"
			title="GET /api/projects/proj_dom_studio"
			description="Use tree mode to inspect nested data, or switch to highlighted source for copyable JSON."
			filename="project-response.json"
			:expanded-depth="3"
		/>
	</div>
</template>
