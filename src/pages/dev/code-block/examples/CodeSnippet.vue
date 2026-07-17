<script setup>
import { DomCodeBlock } from '../../../lib/vue';

const source = `from dataclasses import dataclass

@dataclass
class Deployment:
\tservice: str
\treplicas: int

deployment = Deployment(service="api", replicas=3)`;
</script>

<template>
	<div class="w-full min-w-0 max-w-2xl">
		<DomCodeBlock
			:code="source"
			filename="deployment.py"
			lang="python"
		/>
	</div>
</template>
