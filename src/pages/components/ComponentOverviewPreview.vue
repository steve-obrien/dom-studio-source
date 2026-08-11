<script setup>
import DomAccordion from './accordion/DomAccordion.vue';
import DomButton from './button/DomButton.vue';
import DomIconButton from './icon-button/DomIconButton.vue';
import DomMenu from './menu/DomMenu.vue';
import DomPagination from './pagination/DomPagination.vue';
import DomProfileMenu from './profile-menu/DomProfileMenu.vue';
import DomScrollMenu from './scroll-menu/DomScrollMenu.vue';
import DomScrollMenuItem from './scroll-menu/DomScrollMenuItem.vue';
import DomSplitterPanel from './splitter-panel/DomSplitterPanel.vue';
import DomTabs from './tabs/DomTabs.vue';
import DomThemeSwitcher from './theme-switcher/DomThemeSwitcher.vue';
import DomToolbar from './toolbar/DomToolbar.vue';
import DomTreeView from './tree-view/DomTreeView.vue';

defineProps({
	type: { type: String, required: true },
});

const accordionItems = [
	{ title: 'What changed?', content: 'Three components were added.' },
	{ title: 'What ships next?', content: 'Review the release notes.' },
];

const menuItems = [
	{ value: 'edit', label: 'Edit component', shortcut: '⌘E' },
	{ value: 'duplicate', label: 'Duplicate' },
	{ separator: true },
	{ value: 'delete', label: 'Delete', tone: 'danger' },
];

const tabItems = [
	{ key: 'preview', label: 'Preview' },
	{ key: 'code', label: 'Code' },
	{ key: 'props', label: 'Props' },
];

const treeItems = [
	{
		id: 'workspace',
		label: 'Workspace',
		open: true,
		children: [
			{ id: 'components', label: 'Components' },
			{ id: 'pages', label: 'Pages' },
		],
	},
	{ id: 'settings', label: 'Settings' },
];

</script>

<template>
	<div class="h-52 overflow-hidden bg-secondary/30 p-6 text-canvas-fg" aria-hidden="true">
		<div inert class="flex h-full items-center justify-center overflow-hidden">
			<div v-if="type === 'button'" class="flex flex-wrap items-center justify-center gap-2">
				<DomButton size="sm">Create project</DomButton>
				<DomButton size="sm" variant="secondary">Preview</DomButton>
				<DomButton size="sm" variant="ghost">Cancel</DomButton>
				<DomButton size="sm" variant="danger">Delete</DomButton>
			</div>

			<div v-else-if="type === 'icon-button'" class="flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/45 p-2">
				<DomIconButton label="Add" variant="primary" icon="M12 5v14M5 12h14" />
				<DomIconButton label="Edit" variant="secondary" icon="M4 20h4L19 9l-4-4L4 16v4z" />
				<DomIconButton label="Favourite" active icon="M12 4l2.5 5 5.5.8-4 3.9.9 5.5L12 16.5 7.1 19l.9-5.3-4-3.9L9.5 9z" />
				<DomIconButton label="Delete" variant="danger" icon="M5 7h14M9 7V4h6v3M8 10v8M12 10v8M16 10v8" />
			</div>

			<DomAccordion
				v-else-if="type === 'accordion'"
				:items="accordionItems"
				class="w-full max-w-sm"
			/>

			<DomMenu
				v-else-if="type === 'menu'"
				:items="menuItems"
			/>

			<DomPagination
				v-else-if="type === 'pagination'"
				:page="4"
				:page-size="25"
				:total="240"
				:sibling-count="0"
				compact
			/>

			<DomProfileMenu
				v-else-if="type === 'profile-menu'"
				name="Mina Patel"
				email="mina@northstar.app"
				initials="MP"
				:theme-control="false"
			/>

			<div v-else-if="type === 'scroll-menu'" class="grid w-full max-w-sm grid-cols-[8.5rem_1fr] gap-4">
				<DomScrollMenu model-value="#component-preview-api" label="On this page" scroll-behavior="auto">
					<DomScrollMenuItem href="#component-preview-intro">Introduction</DomScrollMenuItem>
					<DomScrollMenuItem href="#component-preview-api">API reference</DomScrollMenuItem>
					<DomScrollMenuItem href="#component-preview-events">Events</DomScrollMenuItem>
				</DomScrollMenu>
				<div class="space-y-3 pt-1">
					<div id="component-preview-intro">
						<p class="text-[10px] font-semibold">Introduction</p>
						<div class="mt-1.5 h-1.5 w-full rounded-full bg-secondary"></div>
					</div>
					<div id="component-preview-api" class="rounded-md border border-primary/25 bg-primary/10 p-2">
						<p class="text-[10px] font-semibold text-primary">API reference</p>
						<div class="mt-1.5 h-1.5 w-3/4 rounded-full bg-primary/20"></div>
					</div>
					<div id="component-preview-events">
						<p class="text-[10px] font-semibold">Events</p>
						<div class="mt-1.5 h-1.5 w-2/3 rounded-full bg-secondary"></div>
					</div>
				</div>
			</div>

			<DomSplitterPanel
				v-else-if="type === 'splitter-panel'"
				class="h-full w-full overflow-hidden rounded-md border border-border"
				:start-size="68"
				:end-size="68"
				:min-start="48"
				:min-main="72"
				:min-end="48"
				:handle-size="6"
			>
				<template #start>
					<div class="h-full bg-secondary/55 p-2">
						<div class="h-2 w-10 rounded-full bg-canvas-fg/15"></div>
						<div class="mt-3 space-y-2"><span class="block h-1.5 rounded-full bg-canvas-fg/10"></span><span class="block h-1.5 w-3/4 rounded-full bg-canvas-fg/10"></span></div>
					</div>
				</template>
				<div class="grid h-full place-items-center bg-canvas">
					<div class="size-14 rounded-lg border border-primary/25 bg-primary/10"></div>
				</div>
				<template #end>
					<div class="h-full border-l border-border bg-secondary/30 p-2">
						<div class="h-2 w-9 rounded-full bg-canvas-fg/15"></div>
						<div class="mt-3 h-7 rounded border border-border bg-canvas"></div>
					</div>
				</template>
			</DomSplitterPanel>

			<DomTabs
				v-else-if="type === 'tabs'"
				model-value="preview"
				:tabs="tabItems"
				class="w-full max-w-sm"
			>
				<template #preview>
					<div class="mt-4 rounded-lg border border-border bg-secondary/35 p-3">
						<div class="h-2 w-24 rounded-full bg-canvas-fg/20"></div>
						<div class="mt-2 h-1.5 w-full rounded-full bg-canvas-fg/10"></div>
						<div class="mt-1.5 h-1.5 w-2/3 rounded-full bg-canvas-fg/10"></div>
					</div>
				</template>
			</DomTabs>

			<DomThemeSwitcher
				v-else-if="type === 'theme-switcher'"
				:show-label="false"
				size="icon-md"
			/>

			<DomToolbar
				v-else-if="type === 'toolbar'"
				skin="control"
				control-size="sm"
				class="max-w-full"
			>
				<DomIconButton label="Undo" size="sm" icon="M9 8 5 12l4 4M5 12h8a5 5 0 0 1 5 5" />
				<DomIconButton label="Redo" size="sm" icon="m15 8 4 4-4 4M19 12h-8a5 5 0 0 0-5 5" />
				<span class="mx-1 h-5 w-px bg-border"></span>
				<DomButton size="sm" variant="ghost">Preview</DomButton>
				<DomButton size="sm">Publish</DomButton>
			</DomToolbar>

			<DomTreeView
				v-else-if="type === 'tree-view'"
				model-value="components"
				:items="treeItems"
				:draggable="false"
				:scroll-into-view="false"
				class="w-full max-w-xs"
			/>

			<div v-else-if="type === 'command-palette'" class="w-full max-w-sm overflow-hidden rounded-xl border border-border bg-canvas shadow-lg">
				<div class="flex h-10 items-center gap-2 border-b border-border px-3 text-[10px] text-muted-fg">
					<svg viewBox="0 0 24 24" class="size-3.5" fill="none"><circle cx="10" cy="10" r="5" stroke="currentColor" stroke-width="1.7" /><path d="m14 14 5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg>
					Search commands…
					<span class="ml-auto rounded border border-border bg-secondary px-1.5 py-0.5">⌘K</span>
				</div>
				<div class="space-y-1 p-2 text-[10px]">
					<div class="flex items-center rounded-md bg-primary px-2.5 py-2 text-primary-fg"><span>Open component</span><span class="ml-auto opacity-70">↵</span></div>
					<div class="flex items-center px-2.5 py-2"><span>Create block</span><span class="ml-auto text-muted-fg">B</span></div>
					<div class="flex items-center px-2.5 py-2"><span>Change theme</span><span class="ml-auto text-muted-fg">T</span></div>
				</div>
			</div>

			<div v-else-if="type === 'context-menu'" class="relative h-full w-full overflow-hidden rounded-md bg-secondary/35 p-3">
				<div class="grid grid-cols-[2rem_1fr_auto] items-center gap-2 rounded-md border border-primary/25 bg-primary/10 p-2">
					<span class="grid size-7 place-items-center rounded bg-primary/15 text-primary">◆</span>
					<div><p class="text-[10px] font-semibold">Dashboard.vue</p><p class="text-[8px] text-muted-fg">Component</p></div>
					<span class="text-[9px] text-muted-fg">•••</span>
				</div>
				<div class="absolute right-3 top-14 w-36 rounded-lg border border-border bg-canvas p-1.5 text-[9px] shadow-lg">
					<p class="rounded bg-secondary px-2 py-1.5">Open</p>
					<p class="px-2 py-1.5">Rename <span class="float-right text-muted-fg">⌘R</span></p>
					<div class="my-1 h-px bg-border"></div>
					<p class="px-2 py-1.5 text-destructive">Delete</p>
				</div>
			</div>

			<div v-else-if="type === 'dialog'" class="relative h-full w-full overflow-hidden rounded-md bg-canvas p-3">
				<div class="absolute inset-0 bg-canvas-fg/15"></div>
				<div class="relative mx-auto mt-3 w-full max-w-[16rem] rounded-xl border border-border bg-canvas p-4 shadow-xl">
					<div class="flex items-start justify-between"><div><p class="text-[11px] font-semibold">Invite teammate</p><p class="mt-1 text-[8px] text-muted-fg">Add someone to this workspace.</p></div><span class="text-sm text-muted-fg">×</span></div>
					<div class="mt-3 h-8 rounded-md border border-border bg-secondary/25 px-2 py-2 text-[8px] text-muted-fg">name@company.com</div>
					<div class="mt-3 flex justify-end gap-1.5"><span class="rounded-full border border-border px-2.5 py-1 text-[8px]">Cancel</span><span class="rounded-full bg-primary px-2.5 py-1 text-[8px] text-primary-fg">Send invite</span></div>
				</div>
			</div>

			<div v-else-if="type === 'drawer'" class="relative h-full w-full overflow-hidden rounded-md border border-border bg-secondary/25">
				<div class="grid h-full grid-cols-[1fr_8.5rem]">
					<div class="p-3 opacity-55"><div class="h-2 w-20 rounded-full bg-canvas-fg/20"></div><div class="mt-4 grid grid-cols-2 gap-2"><span class="h-12 rounded bg-canvas"></span><span class="h-12 rounded bg-canvas"></span></div></div>
					<aside class="border-l border-border bg-canvas p-3 shadow-xl"><div class="flex justify-between text-[10px] font-semibold"><span>Filters</span><span class="text-muted-fg">×</span></div><div class="mt-4 space-y-2"><span class="block h-7 rounded border border-border bg-secondary/30"></span><span class="block h-7 rounded border border-border bg-secondary/30"></span><span class="block h-7 rounded bg-primary"></span></div></aside>
				</div>
			</div>

			<div v-else-if="type === 'dropdown'" class="relative h-full w-full p-3">
				<div class="mx-auto w-44">
					<div class="flex h-9 items-center justify-between rounded-full border border-border bg-canvas px-3 text-[10px] font-medium shadow-sm"><span>Actions</span><span>⌄</span></div>
					<div class="mt-2 rounded-xl border border-border bg-canvas p-1.5 text-[9px] shadow-lg"><p class="rounded bg-secondary px-2 py-2">Edit component</p><p class="px-2 py-2">Duplicate</p><div class="my-1 h-px bg-border"></div><p class="px-2 py-2 text-destructive">Delete</p></div>
				</div>
			</div>

			<div v-else-if="type === 'lightbox'" class="grid h-full w-full grid-cols-[4.5rem_1fr] gap-2 rounded-md bg-canvas-fg/90 p-2 text-primary-fg">
				<div class="grid gap-2"><span class="rounded bg-primary-fg/15"></span><span class="rounded border border-primary-fg/70 bg-primary-fg/20"></span><span class="rounded bg-primary-fg/15"></span></div>
				<div class="relative grid place-items-center overflow-hidden rounded bg-primary-fg/10"><svg viewBox="0 0 24 24" class="size-12 opacity-80" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="m5 17 4-5 3 3 2-2 5 4" stroke="currentColor" stroke-width="1.5"/></svg><span class="absolute right-2 top-1 text-sm">×</span><span class="absolute inset-x-2 bottom-2 text-center text-[8px]">Workspace overview · 2 of 3</span></div>
			</div>

			<div v-else-if="type === 'popover'" class="relative flex h-full w-full items-end justify-center pb-4">
				<div class="absolute bottom-14 w-48 rounded-xl border border-border bg-canvas p-3 shadow-lg"><span class="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border-b border-r border-border bg-canvas"></span><p class="text-[10px] font-semibold">Publish changes?</p><p class="mt-1 text-[8px] leading-3 text-muted-fg">This will update the public component docs.</p><div class="mt-2 flex justify-end gap-1"><span class="rounded-full border border-border px-2 py-1 text-[8px]">Later</span><span class="rounded-full bg-primary px-2 py-1 text-[8px] text-primary-fg">Publish</span></div></div>
				<span class="rounded-full border border-border bg-canvas px-4 py-2 text-[9px] font-medium shadow-sm">Open popover</span>
			</div>

			<div v-else-if="type === 'toast'" class="relative h-full w-full">
				<div class="absolute right-2 top-3 w-60 rounded-xl border border-border bg-canvas p-3 shadow-lg"><div class="flex gap-2"><span class="mt-1 size-2 rounded-full bg-success"></span><div><p class="text-[10px] font-semibold">Changes published</p><p class="mt-1 text-[8px] text-muted-fg">The component docs are now live.</p></div><span class="ml-auto text-muted-fg">×</span></div></div>
				<div class="absolute right-2 top-[5.7rem] w-60 rounded-xl border border-border bg-canvas p-3 shadow-lg"><div class="flex gap-2"><span class="mt-1 size-2 rounded-full bg-warning"></span><div><p class="text-[10px] font-semibold">Review requested</p><p class="mt-1 text-[8px] text-muted-fg">Two props need descriptions.</p></div><span class="ml-auto text-muted-fg">×</span></div></div>
			</div>

			<div v-else-if="type === 'tooltip'" class="relative flex h-full w-full items-center justify-center">
				<div class="absolute bottom-[6.4rem] rounded-lg bg-canvas-fg px-3 py-2 text-[9px] font-medium text-canvas shadow-lg">Save changes <span class="ml-2 opacity-65">⌘S</span><span class="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-canvas-fg"></span></div>
				<span class="mt-8 rounded-full border border-border bg-canvas px-4 py-2 text-[10px] font-medium shadow-sm">Hover or focus</span>
			</div>

			<div v-else class="grid h-full w-full place-items-center rounded-md bg-secondary/35">
				<div class="w-44 rounded-xl border border-border bg-canvas p-3 shadow-sm"><div class="h-2 w-20 rounded-full bg-canvas-fg/20"></div><div class="mt-3 h-1.5 w-full rounded-full bg-canvas-fg/10"></div><div class="mt-1.5 h-1.5 w-2/3 rounded-full bg-canvas-fg/10"></div></div>
			</div>
		</div>
	</div>
</template>
