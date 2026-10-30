<script setup>
import { DomCodeBlock } from '../../../lib/vue';

const shellSource = `#!/usr/bin/env bash
set -euo pipefail

npm run build
npm run preview`;
</script>

<template>
	<div class="w-full min-w-0 max-w-2xl">
		<DomCodeBlock
			:code="shellSource"
			lang="bash"
			:preview-lines="5"
		/>
	</div>
</template>
