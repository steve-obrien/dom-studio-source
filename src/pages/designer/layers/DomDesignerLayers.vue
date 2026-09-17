<script setup>
import DomTreeView from '../../components/tree-view/DomTreeView.vue';

defineOptions({ __doc: { name: 'Designer layers', description: 'Beta layer tree shared with Studio. Accepts the full DomTreeView props, slots and events.' } });
</script>

<template>
	<DomTreeView label="Layers" :chrome="false">
		<template v-for="(_, name) in $slots" #[name]="scope"><slot :name="name" v-bind="scope" /></template>
	</DomTreeView>
</template>
