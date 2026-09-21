<script setup>
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import ReleaseHistory from './ReleaseHistory.vue';
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Release notes" eyebrow="What's new" tagline="New components, improvements, fixes, and upgrade guidance for DOM Studio.">
			<!-- Keep server-prefetched data below the shared layout's useId boundary. -->
			<ReleaseHistory />
		</DocPage>
	</DomStudioLayout>
</template>
