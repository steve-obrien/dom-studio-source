<script setup>
import PlanningWorkspace from '../../data/gantt/examples/PlanningWorkspace.vue';
import DomCard from '../../visual/card/DomCard.vue';

/** The real Scheduler on the homepage, with its five planning examples. */
</script>

<template>
	<DomCard padding="none" class="shadow-xl shadow-canvas-fg/5">
		<PlanningWorkspace embedded />
	</DomCard>
</template>
