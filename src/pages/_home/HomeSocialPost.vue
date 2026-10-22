<script setup>
defineProps({
	layout: { type: String, default: 'tall' },
	ratio: { type: String, default: '4 / 5' },
	selected: { type: Boolean, default: false },
});
</script>

<template>
	<div class="[container-type:inline-size]">
		<div v-if="layout === 'tall'" class="relative flex flex-col items-center justify-between overflow-hidden bg-[#b5462f] p-[8cqw] text-center text-[#fff6ea]" :style="{ aspectRatio: ratio }">
			<p class="text-[4.5cqw] font-bold uppercase tracking-[0.3em] opacity-80">Bean & Leaf</p>
			<div>
				<p class="relative text-[17cqw] font-black uppercase leading-[0.85] tracking-tight" :class="selected && 'outline-2 outline-offset-[2cqw] outline-[#3b82f6]'">
					Autumn<br />edit
					<template v-if="selected">
						<span v-for="corner in ['-left-[3.2cqw] -top-[3.2cqw]', '-right-[3.2cqw] -top-[3.2cqw]', '-left-[3.2cqw] -bottom-[3.2cqw]', '-right-[3.2cqw] -bottom-[3.2cqw]']" :key="corner" class="absolute size-[2.4cqw] border border-[#3b82f6] bg-white" :class="corner" aria-hidden="true"></span>
					</template>
				</p>
				<p class="mx-auto mt-[6cqw] grid size-[30cqw] place-items-center rounded-full bg-[#fff6ea] text-[8cqw] font-black leading-none text-[#b5462f]">30%<br /><span class="text-[4.5cqw] tracking-widest">OFF</span></p>
			</div>
			<p class="rounded-full bg-[#fff6ea] px-[6cqw] py-[2.5cqw] text-[5cqw] font-bold text-[#b5462f]">Shop the edit</p>
		</div>
		<div v-else class="relative flex items-center justify-between gap-[4cqw] overflow-hidden bg-[#b5462f] px-[6cqw] text-[#fff6ea]" :style="{ aspectRatio: ratio }">
			<div>
				<p class="text-[3cqw] font-bold uppercase tracking-[0.3em] opacity-80">Bean & Leaf</p>
				<p class="mt-[1.5cqw] text-[9cqw] font-black uppercase leading-[0.85] tracking-tight">Autumn<br />edit</p>
				<p class="mt-[3cqw] inline-block rounded-full bg-[#fff6ea] px-[3.5cqw] py-[1.4cqw] text-[3cqw] font-bold text-[#b5462f]">Shop the edit</p>
			</div>
			<p class="grid size-[20cqw] shrink-0 place-items-center rounded-full bg-[#fff6ea] text-[5.5cqw] font-black leading-none text-[#b5462f]">30%<br /><span class="text-[3cqw] tracking-widest">OFF</span></p>
		</div>
	</div>
</template>
