<script setup>
import { ref } from 'vue';
import { DomMenu } from '@getdom/studio/vue';

const selected = ref('none');

const icons = {
	minimise: [
		'M7 12h10',
		'M5 5h14v14H5z',
	],
	zoom: [
		'M8 3H5a2 2 0 0 0-2 2v3',
		'M16 3h3a2 2 0 0 1 2 2v3',
		'M8 21H5a2 2 0 0 1-2-2v-3',
		'M16 21h3a2 2 0 0 0 2-2v-3',
	],
	fill: [
		'M5 7h14v10H5z',
		'M7 9h10v6H7z',
	],
	centre: [
		'M6 8h12v8H6z',
		'M9 11h6v2H9z',
	],
	move: [
		'M6 8h7v8H6z',
		'M15 9l3 3-3 3',
		'M18 12H9',
	],
	tile: [
		'M5 6h14v12H5z',
		'M12 6v12',
	],
	remove: [
		'M5 8h12v8H5z',
		'M17 6h2v2',
		'M4 17l3-3',
		'M4 14h3v3',
	],
	window: [
		'M5 6h14v12H5z',
		'M5 10h14',
	],
	stack: [
		'M8 6l4-2 4 2-4 2-4-2z',
		'M6 10l6 3 6-3',
		'M6 14l6 3 6-3',
	],
	left: [
		'M5 6h14v12H5z',
		'M12 6v12',
		'M7 8h3v8H7z',
	],
	right: [
		'M5 6h14v12H5z',
		'M12 6v12',
		'M14 8h3v8h-3z',
	],
	top: [
		'M5 6h14v12H5z',
		'M5 12h14',
		'M7 8h10v2H7z',
	],
	bottom: [
		'M5 6h14v12H5z',
		'M5 12h14',
		'M7 14h10v2H7z',
	],
};

const items = [
	{ value: 'minimise', label: 'Minimise', icon: 'minimise', shortcut: 'Cmd M' },
	{ value: 'zoom', label: 'Zoom', icon: 'zoom' },
	{ value: 'fill', label: 'Fill', icon: 'fill', shortcut: 'Ctrl Cmd F' },
	{ value: 'centre', label: 'Centre', icon: 'centre', shortcut: 'Ctrl Cmd C' },
	{ separator: true },
	{
		value: 'move-resize',
		label: 'Move & Resize',
		icon: 'move',
		children: [
			{ value: 'move-left', label: 'Left', icon: 'left', shortcut: 'Ctrl Cmd Left' },
			{ value: 'move-right', label: 'Right', icon: 'right', shortcut: 'Ctrl Cmd Right' },
			{ value: 'move-top', label: 'Top', icon: 'top', shortcut: 'Ctrl Cmd Up' },
			{ value: 'move-bottom', label: 'Bottom', icon: 'bottom', shortcut: 'Ctrl Cmd Down' },
		],
	},
	{
		value: 'full-screen-tile',
		label: 'Full-Screen Tile',
		icon: 'tile',
		children: [
			{ value: 'tile-left', label: 'Left & Right', icon: 'left' },
			{ value: 'tile-right', label: 'Right & Left', icon: 'right' },
			{ value: 'tile-top', label: 'Top & Bottom', icon: 'top' },
			{ value: 'tile-bottom', label: 'Bottom & Top', icon: 'bottom' },
		],
	},
	{ separator: true },
	{ value: 'remove-window', label: 'Remove Window from Set', icon: 'remove', disabled: true },
	{ separator: true },
	{ value: 'name-window', label: 'Name Window...', icon: 'window' },
	{ value: 'bring-front', label: 'Bring All to Front', icon: 'stack' },
];
</script>

<template>
	<div class="grid w-full max-w-md gap-3">
		<DomMenu :items="items" @select="selected = $event.value">
			<template #item-row="{ item, label, hasChildren }">
				<span class="flex min-w-0 items-center gap-3">
					<span class="grid size-5 shrink-0 place-items-center text-muted-fg">
						<svg
							v-if="item.icon && icons[item.icon]"
							viewBox="0 0 24 24"
							class="size-4"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path v-for="path in icons[item.icon]" :key="path" :d="path" />
						</svg>
					</span>
					<span class="min-w-0 truncate">{{ label }}</span>
				</span>
				<span class="ml-auto flex shrink-0 items-center gap-2 text-xs text-muted-fg">
					<span v-if="item.shortcut">{{ item.shortcut }}</span>
					<span v-if="hasChildren" aria-hidden="true">›</span>
				</span>
			</template>
		</DomMenu>

		<p class="text-xs text-muted-fg">Selected: <code class="text-fg">{{ selected }}</code></p>
	</div>
</template>
