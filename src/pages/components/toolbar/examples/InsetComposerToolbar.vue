<script setup>
import { reactive, ref } from 'vue';
import { DomIconButton, DomToolbar, DomTooltip } from '@getdom/studio/vue';

const message = ref('Hi team,\n\nI moved the launch notes into the shared doc and flagged the open approvals.');
const active = reactive({
	bold: false,
	link: true,
	list: false,
});

const icons = {
	link: 'M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1',
	list: 'M8 6h11M8 12h11M8 18h11M4 6h.01M4 12h.01M4 18h.01',
	attach: 'M21 12.5 12 21a6 6 0 0 1-8.5-8.5L13 3a4 4 0 1 1 5.5 5.5L9 18a2 2 0 0 1-3-3l9-9',
};

function toggle(key) {
	active[key] = !active[key];
}
</script>

<template>
	<div class="w-full max-w-2xl rounded-2xl border border-border bg-canvas shadow-sm">
		<textarea
			v-model="message"
			class="min-h-40 w-full resize-none bg-transparent px-4 pt-4 text-sm leading-6 text-canvas-fg outline-none placeholder:text-muted-fg"
			placeholder="Write a message..."
		></textarea>

		<div class="px-2 pb-2">
			<DomToolbar label="Message formatting" inset align="between" class="w-full">
				<span class="flex min-w-0 items-center gap-1">
					<DomTooltip text="Bold">
						<DomIconButton label="Bold" size="sm" :active="active.bold" @click="toggle('bold')">
							<span class="text-sm font-bold leading-none">B</span>
						</DomIconButton>
					</DomTooltip>

					<DomTooltip text="Add link">
						<DomIconButton label="Add link" size="sm" :active="active.link" @click="toggle('link')">
							<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
								<path :d="icons.link" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
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

					<span class="mx-1 h-5 w-px bg-border" aria-hidden="true"></span>

					<DomTooltip text="Attach file">
						<DomIconButton label="Attach file" size="sm">
							<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
								<path :d="icons.attach" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</DomIconButton>
					</DomTooltip>
				</span>

				<span class="flex items-center gap-2">
					<span class="hidden text-xs text-muted-fg sm:inline">{{ message.length }} chars</span>
					<button type="button" class="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-fg transition hover:opacity-90">
						Send
					</button>
				</span>
			</DomToolbar>
		</div>
	</div>
</template>
