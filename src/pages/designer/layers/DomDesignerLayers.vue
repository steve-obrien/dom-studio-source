<script setup>
import DomTreeView from '../../components/tree-view/DomTreeView.vue';

defineOptions({ __doc: { name: 'Designer layers', description: 'Beta layer tree shared with Studio. Uses the compact tree style (dense rows, 12px indent, guide lines, subtle selection). Accepts the full DomTreeView props, slots and events, so any of these can be overridden.' } });
</script>

<template>
	<DomTreeView label="Layers" :chrome="false" density="dense" :indent="12" guides="always" selection="subtle">
		<template v-for="(_, name) in $slots" #[name]="scope"><slot :name="name" v-bind="scope" /></template>
	</DomTreeView>
</template>
