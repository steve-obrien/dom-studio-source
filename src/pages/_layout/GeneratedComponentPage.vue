<script setup>
import { computed, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import DomStudioLayout from './DomStudioLayout.vue';
import DocPage from './DocPage.vue';
import DocSection from './DocSection.vue';
import Playground from './docs/Playground.vue';
import ComponentProps from './docs/ComponentProps.vue';
import ComponentSlots from './docs/ComponentSlots.vue';
import ComponentEvents from './docs/ComponentEvents.vue';

const props = defineProps({
	component: { type: Object, default: null },
	componentLoader: { type: Function, default: null },
	componentSource: { type: String, default: '' },
	componentSourceLoader: { type: Function, default: null },
	section: { type: String, default: '' },
});

const loadedComponent = shallowRef(props.component);
const loadedSource = shallowRef(props.componentSource);
const route = useRoute();
let loadRun = 0;

watch(() => [
	props.component,
	props.componentLoader,
	props.componentSource,
	props.componentSourceLoader,
], loadComponent, { immediate: true });

async function loadComponent() {
	const run = ++loadRun;
	loadedComponent.value = props.component || null;
	loadedSource.value = props.componentSource || '';

	const [componentModule, sourceModule] = await Promise.all([
		loadedComponent.value || !props.componentLoader ? null : props.componentLoader(),
		loadedSource.value || !props.componentSourceLoader ? null : props.componentSourceLoader(),
	]);

	if (run !== loadRun) return;
	if (componentModule) loadedComponent.value = componentModule.default || componentModule;
	if (sourceModule) loadedSource.value = sourceModule.default || sourceModule;
}

const doc = computed(() => loadedComponent.value?.__doc || {});
const routeTitle = computed(() => (
	typeof route.meta.title === 'string' && route.meta.title
		? route.meta.title
		: titleFromRoutePath(route.path)
));
const name = computed(() => doc.value.name || loadedComponent.value?.__name || loadedComponent.value?.name || routeTitle.value || 'Component');
const tagline = computed(() => doc.value.description || 'Auto-generated documentation from the component metadata and runtime props.');
const tag = computed(() => {
	if (doc.value.tag) return doc.value.tag;
	const componentName = loadedComponent.value?.__name || loadedComponent.value?.name;
	return componentName ? `<${componentName}>` : '';
});
const playgroundPresentation = computed(() => (props.section === 'mobile' ? 'mobile' : 'default'));
const playgroundInitial = computed(() => doc.value.playground?.initial || {});
const componentKey = computed(() => loadedComponent.value?.__name || loadedComponent.value?.name || tag.value);

function titleFromRoutePath(path) {
	const segment = String(path || '').split('/').filter(Boolean).pop();
	if (!segment) return '';
	return segment
		.replace(/-/g, ' ')
		.replace(/\b\w/g, (character) => character.toUpperCase());
}
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="name" :tagline="tagline" :tag="tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					v-if="loadedComponent"
					:key="componentKey"
					:inspect="loadedComponent"
					:title="`${name} playground`"
					description="This page is generated automatically from the component folder. Add a custom Index.vue beside the component when it needs richer docs."
					:presentation="playgroundPresentation"
					:initial="playgroundInitial"
				/>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps v-if="loadedComponent" :component="loadedComponent" :source="loadedSource" />
			</DocSection>

			<ComponentSlots v-if="loadedComponent" :component="loadedComponent" />
			<ComponentEvents v-if="loadedComponent" :component="loadedComponent" :source="loadedSource" />
		</DocPage>
	</DomStudioLayout>
</template>
