<script setup>
import { ref } from 'vue';
import { DomIconButton, DomVideoFeed } from '../../../lib/vue';

const index = ref(0);
const saved = ref([]);
const videos = [
	{
		id: 'bunny-meadow',
		src: '/media/video-feed/bunny-meadow.mp4',
		poster: '/media/video-feed/bunny-meadow.jpg',
		title: 'A slower kind of morning',
		film: 'Big Buck Bunny',
		creator: 'Blender Foundation',
		description: 'A little sunshine. A very big rabbit.',
		credit: '© 2008 Blender Foundation',
		source: 'https://peach.blender.org/about/',
	},
	{
		id: 'sintel-journey',
		src: '/media/video-feed/sintel-journey.mp4',
		poster: '/media/video-feed/sintel-journey.jpg',
		title: 'A world worth getting lost in',
		film: 'Sintel',
		creator: 'Blender Foundation',
		description: 'A glimpse into the open movie’s trailer.',
		credit: '© 2010 Blender Foundation',
		source: 'https://durian.blender.org/sharing/',
	},
	{
		id: 'bunny-forest',
		src: '/media/video-feed/bunny-forest.mp4',
		poster: '/media/video-feed/bunny-forest.jpg',
		title: 'There’s a story in every frame',
		film: 'Big Buck Bunny',
		creator: 'Blender Foundation',
		description: 'One more moment from the forest.',
		credit: '© 2008 Blender Foundation',
		source: 'https://peach.blender.org/about/',
	},
];

/** Toggles a local saved state; real applications can persist this action in their own store. */
function toggleSave(id) {
	const position = saved.value.indexOf(id);
	if (position === -1) saved.value.push(id);
	else saved.value.splice(position, 1);
}
</script>

<template>
	<div class="w-full space-y-4">
		<DomVideoFeed v-model:index="index" :items="videos" height="min(42rem, 78svh)" label="Open movie shorts">
			<template #caption="{ item }">
				<p class="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-80">Blender open movies</p>
				<h3 class="text-2xl font-semibold leading-tight tracking-tight">{{ item.title }}</h3>
				<p class="text-sm leading-relaxed opacity-90">{{ item.description }}</p>
				<p class="pt-1 text-[10px] leading-relaxed opacity-80">
					<a :href="item.source" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2">{{ item.film }} · {{ item.credit }}</a>
					· <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2">CC BY 3.0</a> · Cropped excerpt
				</p>
			</template>
			<template #actions="{ item }">
				<div class="flex flex-col items-center gap-1">
					<DomIconButton
						:label="saved.includes(item.id) ? 'Remove saved video' : 'Save video'"
						:aria-pressed="saved.includes(item.id)"
						icon="M6 3h12v18l-6-4-6 4V3Z"
						size="lg"
						class="!bg-(--video-canvas)/50 !text-(--video-fg) backdrop-blur"
						:class="saved.includes(item.id) ? '[&_svg]:fill-current' : ''"
						@click="toggleSave(item.id)"
					/>
					<span class="text-[10px] font-medium">{{ saved.includes(item.id) ? 'Saved' : 'Save' }}</span>
				</div>
			</template>
		</DomVideoFeed>
		<div class="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-fg">
			<p>Swipe or scroll to explore. Sound starts off.</p>
			<p class="tabular-nums">{{ index + 1 }} of {{ videos.length }}</p>
		</div>
	</div>
</template>
