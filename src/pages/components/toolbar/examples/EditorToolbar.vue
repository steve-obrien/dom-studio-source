<script setup>
import { ref } from 'vue';
import { DomDropdown, DomIconButton, DomToolbar, DomTooltip } from '@getdom/studio/vue';

const activeTool = ref('select');
const zoom = ref('100%');

const icons = {
	select: 'M5 4l10 8-4 1.5L9 20 5 4Z',
	comment: 'M5 6h14v9H9l-4 4V6Z',
	frame: 'M5 5h14v14H5V5Zm4 0v14M15 5v14M5 9h14M5 15h14',
	undo: 'M9 7H5v4M5 11a7 7 0 1 0 2-5',
	redo: 'M15 7h4v4M19 11a7 7 0 1 1-2-5',
};

const zoomItems = [
	{ label: '50%', value: '50%' },
	{ label: '75%', value: '75%' },
	{ label: '100%', value: '100%' },
	{ label: '150%', value: '150%' },
	{ label: 'Fit to screen', value: 'Fit' },
];
</script>

<template>
	<div class="flex w-full max-w-2xl flex-col gap-4">
		<DomToolbar label="Canvas tools" class="w-fit">
			<DomTooltip text="Select">
				<DomIconButton label="Select" :active="activeTool === 'select'" @click="activeTool = 'select'">
					<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
						<path :d="icons.select" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</DomIconButton>
			</DomTooltip>

			<DomTooltip text="Frame">
				<DomIconButton label="Frame" :active="activeTool === 'frame'" @click="activeTool = 'frame'">
					<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
						<path :d="icons.frame" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</DomIconButton>
			</DomTooltip>

			<DomTooltip text="Comment">
				<DomIconButton label="Comment" :active="activeTool === 'comment'" @click="activeTool = 'comment'">
					<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
						<path :d="icons.comment" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</DomIconButton>
			</DomTooltip>

			<span class="mx-1 h-6 w-px bg-border" aria-hidden="true"></span>

			<DomTooltip text="Undo">
				<DomIconButton label="Undo">
					<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
						<path :d="icons.undo" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</DomIconButton>
			</DomTooltip>

			<DomTooltip text="Redo">
				<DomIconButton label="Redo">
					<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
						<path :d="icons.redo" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</DomIconButton>
			</DomTooltip>

			<span class="mx-1 h-6 w-px bg-border" aria-hidden="true"></span>

			<DomDropdown :items="zoomItems" :label="zoom" width="min-w-[9rem]" @select="(value) => zoom = value" />
		</DomToolbar>

		<div class="rounded-2xl border border-border bg-secondary/30 p-4 text-sm text-muted-fg">
			Active tool: <code class="text-fg">{{ activeTool }}</code>
			<span aria-hidden="true"> / </span>
			Zoom: <code class="text-fg">{{ zoom }}</code>
		</div>
	</div>
</template>
