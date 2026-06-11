<script setup>
import { computed, reactive, ref } from 'vue';
import { DomDropdown, DomIconButton, DomToolbar, DomTooltip } from '@getdom/studio/vue';

const block = ref('Paragraph');
const active = reactive({
	bold: true,
	italic: false,
	underline: true,
	strike: false,
	quote: false,
	list: true,
});

const blockItems = [
	{ label: 'Paragraph', value: 'Paragraph' },
	{ label: 'Heading 2', value: 'Heading 2' },
	{ label: 'Callout', value: 'Callout' },
];

const icons = {
	quote: 'M9 7H5v6h4V7Zm10 0h-4v6h4V7Z',
	list: 'M8 6h11M8 12h11M8 18h11M4 6h.01M4 12h.01M4 18h.01',
	link: 'M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1',
};

const activeMarks = computed(() => {
	return Object.entries(active)
		.filter(([, value]) => value)
		.map(([key]) => key)
		.join(', ') || 'plain';
});

function toggle(key) {
	active[key] = !active[key];
}
</script>

<template>
	<div class="flex w-full max-w-2xl flex-col gap-3">
		<DomToolbar label="Text formatting" class="w-fit">
			<DomDropdown :items="blockItems" :label="block" width="min-w-[10rem]" @select="(value) => block = value" />

			<span class="mx-1 h-6 w-px bg-border" aria-hidden="true"></span>

			<DomTooltip text="Bold">
				<DomIconButton label="Bold" size="sm" :active="active.bold" @click="toggle('bold')">
					<span class="text-sm font-bold leading-none">B</span>
				</DomIconButton>
			</DomTooltip>

			<DomTooltip text="Italic">
				<DomIconButton label="Italic" size="sm" :active="active.italic" @click="toggle('italic')">
					<span class="font-serif text-sm italic leading-none">I</span>
				</DomIconButton>
			</DomTooltip>

			<DomTooltip text="Underline">
				<DomIconButton label="Underline" size="sm" :active="active.underline" @click="toggle('underline')">
					<span class="text-sm font-semibold leading-none underline underline-offset-2">U</span>
				</DomIconButton>
			</DomTooltip>

			<DomTooltip text="Strikethrough">
				<DomIconButton label="Strikethrough" size="sm" :active="active.strike" @click="toggle('strike')">
					<span class="text-sm font-semibold leading-none line-through">S</span>
				</DomIconButton>
			</DomTooltip>

			<span class="mx-1 h-6 w-px bg-border" aria-hidden="true"></span>

			<DomTooltip text="Quote">
				<DomIconButton label="Quote" size="sm" :active="active.quote" @click="toggle('quote')">
					<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
						<path :d="icons.quote" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</DomIconButton>
			</DomTooltip>

			<DomTooltip text="Bulleted list">
				<DomIconButton label="Bulleted list" size="sm" :active="active.list" @click="toggle('list')">
					<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
						<path :d="icons.list" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</DomIconButton>
			</DomTooltip>

			<DomTooltip text="Insert link">
				<DomIconButton label="Insert link" size="sm">
					<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
						<path :d="icons.link" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</DomIconButton>
			</DomTooltip>
		</DomToolbar>

		<div class="rounded-2xl border border-border bg-background p-4 text-sm shadow-sm">
			<p class="mb-2 text-xs font-medium uppercase text-muted-fg">{{ block }}</p>
			<p
				class="text-base leading-7 text-fg"
				:class="{
					'font-bold': active.bold,
					'italic': active.italic,
					'underline underline-offset-4': active.underline,
					'line-through': active.strike,
				}"
			>
				Quarterly launch summary
			</p>
			<p class="mt-3 text-xs text-muted-fg">Active: {{ activeMarks }}</p>
		</div>
	</div>
</template>
