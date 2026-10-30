<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import Example from '../../../_layout/docs/Example.vue';
import DesktopWorkspace from './examples/DesktopWorkspace.vue';
import source from './examples/DesktopWorkspace.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Desktop workspace" tagline="A quiet app rail. A flexible sidebar. All the room your work needs." eyebrow="App shells" tag="Vue + Electron">
			<DocSection title="One shell, different experiences" eyebrow="Interactive demo">
				<Example :source="source" filename="DesktopWorkspace.vue" presentation="iframe" frame-src="/blocks/app-shells/desktop-workspace/preview/DesktopWorkspace" frame-flush-edges default-open description="Switch between an assistant, pages, and a code workspace. Hover or focus a rail icon for shortcuts. Use + to install Calendar, change pinned order, or remove apps. Drag the divider to resize navigation, move it right, or hide it with Focus. The top bar switches organizations."><DesktopWorkspace /></Example>
			</DocSection>
			<DocSection title="Use it in your application">
				<div class="space-y-4 text-sm leading-7 text-muted-fg"><p>Import <code>DomDesktopLayout</code> from <code>@getdom/studio/vue</code>. Supply <code>v-model</code> with the active app ID and <code>apps</code> with ordered pinned records: unique <code>id</code>, <code>label</code>, an SVG path <code>icon</code>, and optional shortcut <code>items</code> with IDs and labels.</p><p>The <code>sidebar</code> and default slots receive the selected <code>app</code>. Use <code>sidebarPosition="right"</code> for a list beside the stage, or <code>:show-sidebar="false"</code> for a full workspace. The sidebar is an unstyled DomSplitterPanel: drag its divider, or focus the divider and use arrow keys. Bind v-model:sidebar-size to persist its pixel width. Each region scrolls independently. Compact screens expose navigation through a button; shortcuts also open on keyboard focus.</p><p>Handle <code>shortcut</code> to navigate within an app and <code>manage-apps</code> to open your own catalog. Your application owns installation, authorization, persistence, routing, and preserving app state. This demo keeps changes in memory and uses local conversation replies. The organization dropdown uses DomDropdown; switching clears transient conversation content. Production hosts must authorize membership and load organization-scoped app data.</p><p>Use <code>height="100dvh"</code> for a window, a fixed CSS height for an embed, or <code>height="100%"</code> inside a sized parent. The optional <code>titlebar</code> slot lets a native host supply window chrome.</p></div>
			</DocSection>
			<DocSection title="Run the Electron demo" eyebrow="Native host">
				<div class="space-y-4 text-sm leading-7 text-muted-fg"><p>The isolated host in <code>examples/electron-desktop</code> opens this same preview in a native window with normal macOS window controls. It shares the web frontend and adds no native APIs to the renderer.</p><pre class="overflow-auto rounded-xl bg-secondary p-5 text-xs"><code>npm run dev:screenshot
# In a second terminal:
npm install --prefix examples/electron-desktop
npm start --prefix examples/electron-desktop</code></pre><p>See its README for isolation, navigation policy, and scope. This is a local development demo; packaged offline assets, signing, updates, and native integrations remain host work.</p></div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
