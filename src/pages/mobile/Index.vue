<script setup>
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
import Example from '../_layout/docs/Example.vue';
import MobileExampleSection from './_components/MobileExampleSection.vue';
import MobileWorkspace from './examples/MobileWorkspace.vue';
import MobileWorkspaceSource from './examples/MobileWorkspace.vue?raw';
import SettingsStack from './examples/SettingsStack.vue';
import DesktopActionSheet from './action-sheet/examples/DesktopActionSheet.vue';
import DesktopActionSheetSource from './action-sheet/examples/DesktopActionSheet.vue?raw';
import CodeBlock from '../_layout/CodeBlock.vue';
import SettingsStackSource from './examples/SettingsStack.vue?raw';

const mobileFoundations = [
	['DomAppShell', 'Full-screen app surface with safe-area-aware top and bottom slots.'],
	['DomAppTopBar', 'Compact app header with leading and trailing action slots.'],
	['DomAppBottomNav', 'Thumb-friendly primary navigation for app tabs.'],
	['DomAppListItem', 'Touch-sized rows for settings, menus, inboxes, and task lists.'],
	['DomAppProfile', 'An account header with a profile image, name, email, and an editable action.'],
	['DomSafeArea', 'Safe-area padding for app chrome around cutouts and home indicators.'],
	['DomAppStack', 'Settings-style nested navigation with slide transitions, breadcrumbs, lazy screens, and responsive panel styling.'],
	['DomAppStackScreen', 'Slot-driven screen registration for custom stack content inside DomAppStack.'],
	['DomTextInput', 'Use the shared text input with type="search" for mobile search fields.'],
	['DomActionSheet', 'Bottom action sheet for app choices and destructive commands.'],
];

const platformPoints = [
	{ title: 'Start with the web', description: 'Build and test the interface with the HTML, CSS, components, routing, and state your team already uses.' },
	{ title: 'Add native features when needed', description: 'A bridge such as Capacitor lets JavaScript call native plugins for iOS and Android while the interface stays in a webview.' },
	{ title: 'Let the layout own scrolling', description: 'Use a bounded app shell for pinned navigation and independent content scrolling. Ordinary rows, bars, and sheets also work on desktop.' },
	{ title: 'Make the parent contract explicit', description: 'App shell and app stack size themselves by default. Only percentage heights require a sized parent, and nested scroll owners are an explicit choice.' },
];

const layoutExample = `<DomAppShell :content-scroll="false">
	<DomAppStack root="settings" :screens="screens" height="100%" />
</DomAppShell>`;

</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Mobile"
			eyebrow="DOM Studio"
			tag="<DomAppShell>"
			tagline="App layouts, navigation, and action sheets for webviews, mobile browsers, and desktop. Built-in safe areas and scrolling, with no demo chrome on small screens."
		>
			<DocSection eyebrow="Overview" title="Web-first mobile apps">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>My preference when building mobile apps is to start with CSS and HTML components in a webview. Then, if needed, access native functionality through JavaScript libraries that let you maintain native plugins for Android and iOS, such as <a href="https://capacitorjs.com/docs" class="font-medium text-canvas-fg underline underline-offset-4">Capacitor</a> and similar bridges.</p>
					<p>That keeps the interface in familiar web code, with native capabilities added where the app needs them. DOM Studio handles the interface: safe areas, pinned navigation, scrollable screens, touch targets, and motion. The application owns native plugins, routing, and persistence.</p>
				</div>

				<div class="mt-6 grid gap-3 md:grid-cols-2">
					<div
						v-for="point in platformPoints"
						:key="point.title"
						class="rounded-lg border border-border skin-card p-4"
					>
						<p class="text-sm font-semibold text-canvas-fg">{{ point.title }}</p>
						<p class="mt-1 text-xs leading-5 text-muted-fg">{{ point.description }}</p>
					</div>
				</div>
			</DocSection>

			<MobileExampleSection
				title="A working app viewport"
				description="On desktop, preview the app inside a phone. On a small screen, the device frame disappears. Use the expand control to try the app across the available display."
			>
				<template #notes>
					<div class="grid gap-3 sm:grid-cols-2">
						<div class="rounded-lg border border-border skin-card p-4">
							<p class="text-sm font-semibold text-canvas-fg">Capacitor posture</p>
							<p class="mt-1 text-xs leading-5 text-muted-fg">Keep the UI web-native, then bridge native status bar, haptics, keyboard, camera, and share actions through Capacitor plugins.</p>
						</div>
						<div class="rounded-lg border border-border skin-card p-4">
							<p class="text-sm font-semibold text-canvas-fg">Mobile defaults</p>
							<p class="mt-1 text-xs leading-5 text-muted-fg">One scroll container, safe-area-aware chrome, large touch targets, and bottom actions for thumb reach.</p>
						</div>
					</div>
				</template>

				<Example
					:source="MobileWorkspaceSource"
					title="Live app shell"
					description="Scroll the task list, switch tabs, and open More actions. Navigation stays pinned while the content scrolls."
					filename="MobileWorkspace.vue"
					presentation="mobile"
					device-title="Live app shell"
					:preview-lines="10"
				>
					<MobileWorkspace />
				</Example>
			</MobileExampleSection>

			<DocSection eyebrow="Navigation" title="Settings stack">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use <code>DomAppStack</code> when a settings flow needs to slide through nested screens while staying full-width at every viewport. Screens can be slot-defined for small custom surfaces or loaded dynamically from larger modules.
					</p>
				</div>

				<Example
					:source="SettingsStackSource"
					title="Settings stack"
					description="Explore Account → General → Language & Region, or Account → Apps → Calendar → Notifications. Mobile slides the back button and title with each screen; the Desktop preset shows the full breadcrumb path. Visited screens keep their state and scroll position."
					filename="SettingsStack.vue"
					presentation="mobile"
					device-title="Settings stack"
					:frame-height="680"
					:preview-lines="16"
				>
					<SettingsStack />
				</Example>
			</DocSection>

			<DocSection eyebrow="Layout" title="Choose who owns the viewport">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p><code>DomAppShell</code> is the app wrapper. It defaults to <code>100dvh</code>, reserves device safe areas once, pins the top and bottom slots, and scrolls its main region. It works without positioning styles on the page. Use a fixed CSS height for an embedded app, or <code>height="100%"</code> when its parent already has an explicit height.</p>
					<p><code>DomAppStack</code> can also stand alone. Each screen owns its scrolling, so when you nest it in a shell, turn off the shell’s content scrolling:</p>
				</div>
				<CodeBlock :code="layoutExample" lang="vue" />
				<div class="mt-4 max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>Rows, top bars, bottom navigation, and safe-area wrappers work independently. For a row containing a toggle or input, use <code>DomAppListItem as="div"</code> to avoid nesting interactive controls inside a button.</p>
					<p><code>DomActionSheet</code> works as a viewport overlay by itself. Put it in the shell’s <code>#overlay</code> slot to contain it within that app. Long action lists scroll, and Cancel stays reachable.</p>
					<p>For an edge-to-edge iOS webview, set <code>width=device-width, initial-scale=1, viewport-fit=cover</code> in the viewport meta tag. The components read the device safe-area insets. If native chrome already reserves those areas, avoid applying them a second time. <a href="https://webkit.org/blog/7929/designing-websites-for-iphone-x/" class="underline underline-offset-4">WebKit’s safe-area guidance</a>.</p>
					<p>The phone frame simulates a cutout. Real keyboard resizing, system gestures, native plugin behaviour, and device safe areas still need testing in your target iOS and Android webviews.</p>
				</div>
			</DocSection>

			<DocSection eyebrow="Desktop and mobile" title="Action sheets work beyond phones">
				<Example :source="DesktopActionSheetSource" title="Document actions" description="A standalone sheet in a desktop workspace. Try the long list to see actions scroll while Cancel stays visible." filename="DesktopActionSheet.vue" source-path="src/pages/mobile/action-sheet/examples/DesktopActionSheet.vue" presentation="iframe" :frame-height="520">
					<DesktopActionSheet />
				</Example>
			</DocSection>

			<DocSection eyebrow="Components" title="App primitives for mobile">
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<div
						v-for="item in mobileFoundations"
						:key="item[0]"
						class="rounded-lg border border-border skin-card p-4"
					>
						<code class="text-xs font-semibold text-canvas-fg">&lt;{{ item[0] }}&gt;</code>
						<p class="mt-2 text-sm leading-6 text-muted-fg">{{ item[1] }}</p>
					</div>
				</div>
			</DocSection>

		</DocPage>
	</DomStudioLayout>
</template>
