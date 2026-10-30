<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import { DomDesktopLayout } from '../../lib/vue';
import Basic from './examples/Basic.vue';
import source from './examples/Basic.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Desktop layout" tag="DomDesktopLayout" tagline="A minimal application rail with hover shortcuts, independent navigation, and a flexible workspace.">
			<DocSection title="A controlled application shell"><Example :source="source" filename="Basic.vue" description="The host supplies ordered pinned apps and owns active selection, shortcuts, and content. Hover or focus an app to see its submenu."><Basic /></Example></DocSection>
			<DocSection title="Compose a workspace"><div class="space-y-4 text-sm leading-7 text-muted-fg"><p>Use unique string app IDs and shortcut IDs. Icon values are SVG path data. The active ID should belong to the supplied pinned apps; otherwise scoped slots receive a null app. Empty rails still expose the manage-apps action.</p><p>The sidebar uses DomSplitterPanel with transparent handles. Drag its subtle divider or use arrow keys (Shift for larger steps) to resize it. Bind v-model:sidebar-size to save the width; minSidebarSize and minWorkspaceSize keep both areas usable. The sidebar can sit left or right, or be hidden for a full-stage app. On compact screens it becomes a toggleable overlay. Its slot receives a close helper for navigation actions. The default slot owns its scrollable stage; give child panes explicit heights when they own scrolling.</p><p>Apps, installation, saved pin order, permissions, routing, and state retention belong to the host. The shell emits selection intents and never loads plugins or makes network requests.</p><router-link to="/blocks/app-shells/desktop-workspace" class="text-primary underline">Try the complete desktop workspace and Electron host →</router-link></div></DocSection>
			<DocSection title="Props"><ComponentProps :component="DomDesktopLayout" /></DocSection>
			<ComponentSlots :component="DomDesktopLayout" />
		</DocPage>
	</DomStudioLayout>
</template>
