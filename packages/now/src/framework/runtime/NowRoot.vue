<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { RouterView, useRoute } from 'vue-router'

const layouts = import.meta.glob('/src/layouts/*.vue')
const route = useRoute()

const Layout = computed(() => {
	const layoutName = route.meta.layout || 'default'
	const loader = layouts[`/src/layouts/${layoutName}.vue`] || layouts['/src/layouts/default.vue']

	if (!loader) {
		throw new Error(`Layout "${layoutName}" was not found.`)
	}

	return defineAsyncComponent(loader)
})
</script>

<template>
	<component :is="Layout">
		<RouterView />
	</component>
</template>
