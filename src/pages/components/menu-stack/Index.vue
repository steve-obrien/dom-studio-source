<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import DomMenuStack from './DomMenuStack.vue';
import Workspace from './examples/Workspace.vue';
import WorkspaceSource from './examples/Workspace.vue?raw';

const doc = DomMenuStack.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Workspace navigation" title="Pages and menus in one container">
				<Example :source="WorkspaceSource" filename="Workspace.vue" description="Explore five levels, edit your profile, or open the same menu in a popover. Desktop and mobile use the same contained slide navigation.">
					<Workspace />
				</Example>
			</DocSection>
			<DocSection eyebrow="Composition" title="Build your menu tree">
				<div class="space-y-3 text-sm leading-6 text-muted-fg">
					<p>Give every item a unique string <code>id</code> and a <code>label</code>. The id <code>root</code> is reserved. Add <code>children</code> for another menu, <code>component</code> and <code>props</code> for a Vue page, or <code>slot</code> for named slot content. Page content appears above its child rows.</p>
					<p>Components and slots receive <code>screen</code> and <code>stack</code>. Call <code>stack.push(id)</code> or <code>stack.back()</code> from custom controls. Keep Vue component objects outside deep reactive data or use <code>markRaw</code>.</p>
					<p>Use the <code>rows</code> slot to replace the default rows with a searchable or grouped list. Register its destinations in <code>items</code> so the same stack handles the forward and back transitions.</p>
					<p>Leaf rows use <code>to</code> for Vue Router, <code>href</code> for native links, or emit <code>select</code> for actions. A branch always opens its page; add a child overview link if it also has a route. The popover owns dismissal, so close it on <code>select</code> when desired.</p>
					<p>Set a bounded <code>height</code>, or use <code>100%</code> inside a sized parent. Each page owns scrolling and keeps its content while mounted. Bind <code>v-model:path</code> to control navigation, beginning with <code>['root']</code>. Stable ids preserve screen identity.</p>
				</div>
			</DocSection>
			<ComponentProps :component="DomMenuStack" />
			<ComponentSlots :component="DomMenuStack" />
			<ComponentEvents :component="DomMenuStack" />
		</DocPage>
	</DomStudioLayout>
</template>
