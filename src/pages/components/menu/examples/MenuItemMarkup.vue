<script setup>
import { ref } from 'vue';
import { DomMenu, MenuItem, MenuLabel, MenuSeparator } from '@getdom/studio/vue';

const selected = ref('none');
const liveMode = ref(true);
const compactSidebar = ref(false);

function onSelect(event) {
	selected.value = event.value;
}

function onChange(event) {
	if (event.value === 'notifications-live') liveMode.value = event.checked;
	if (event.value === 'notifications-compact') compactSidebar.value = event.checked;
}
</script>

<template>
	<div class="w-full max-w-sm space-y-3">
		<DomMenu @select="onSelect" @change="onChange">
			<MenuLabel>
				<span class="block text-[11px] font-medium uppercase text-muted-fg">Workspace</span>
				<span class="mt-0.5 block truncate text-sm font-medium text-canvas-fg">Northstar Studio</span>
			</MenuLabel>
			<MenuSeparator />

			<MenuItem value="sync">
				<span class="flex min-w-0 items-center gap-3">
					<span class="grid size-8 place-items-center rounded-lg bg-success/15 text-success">
						<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
							<path d="M6.5 8.5A6 6 0 0 1 17 7l1 .95M17.5 15.5A6 6 0 0 1 7 17l-1-.95M18 4.5V8h-3.5M6 19.5V16h3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</span>
					<span class="min-w-0">
						<span class="block truncate font-medium">Sync status</span>
						<span class="block truncate text-xs text-muted-fg">Updated just now</span>
					</span>
				</span>
				<template #accessory>
					<span class="text-xs text-success">Ready</span>
				</template>
			</MenuItem>

			<MenuItem value="notifications">
				<span class="min-w-0">
					<span class="block truncate font-medium">Notifications</span>
					<span class="block truncate text-xs text-muted-fg">Delivery channels and density</span>
				</span>

				<template #submenu>
					<MenuItem value="notifications-live" type="checkbox" :checked="liveMode">
						<span class="min-w-0 truncate">Live mode</span>
						<template #accessory>
							<span class="relative inline-flex h-5 w-9 shrink-0 rounded-full transition" :class="liveMode ? 'bg-primary' : 'bg-input'" aria-hidden="true">
								<span class="absolute left-0.5 top-0.5 size-4 rounded-full skin-card shadow-sm transition" :class="liveMode ? 'translate-x-4' : 'translate-x-0'"></span>
							</span>
						</template>
					</MenuItem>
					<MenuItem value="notifications-compact" type="checkbox" :checked="compactSidebar">
						<span class="min-w-0 truncate">Compact sidebar</span>
						<template #accessory>
							<span class="relative inline-flex h-5 w-9 shrink-0 rounded-full transition" :class="compactSidebar ? 'bg-primary' : 'bg-input'" aria-hidden="true">
								<span class="absolute left-0.5 top-0.5 size-4 rounded-full skin-card shadow-sm transition" :class="compactSidebar ? 'translate-x-4' : 'translate-x-0'"></span>
							</span>
						</template>
					</MenuItem>
					<MenuItem value="notifications-email">
						<span class="min-w-0">
							<span class="block truncate font-medium">Email digest</span>
							<span class="block truncate text-xs text-muted-fg">Send once each morning</span>
						</span>
					</MenuItem>
				</template>
			</MenuItem>

			<MenuSeparator />

			<MenuItem value="delete" tone="danger">
				<span class="min-w-0 truncate">Delete workspace</span>
				<template #accessory>
					<span class="text-xs text-destructive/70">Del</span>
				</template>
			</MenuItem>
		</DomMenu>

		<p class="text-xs text-muted-fg">Selected: <code class="text-canvas-fg">{{ selected }}</code></p>
	</div>
</template>
