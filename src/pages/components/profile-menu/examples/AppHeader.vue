<script setup>
import { ref } from 'vue';
import { DomButton, DomProfileMenu } from '@getdom/studio/vue';

const action = ref('none');
const themeMode = ref('stored preference');
</script>

<template>
	<div class="w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-canvas shadow-sm">
		<header class="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
			<div class="min-w-0">
				<p class="truncate text-sm font-semibold">Northstar Studio</p>
				<p class="truncate text-xs text-muted-fg">Production workspace</p>
			</div>

			<div class="flex items-center gap-2">
				<DomButton size="sm" variant="secondary">Invite</DomButton>
				<DomProfileMenu
					name="Avery Stone"
					email="avery@northstar.app"
					initials="AS"
					show-name
					width="min-w-[18rem]"
					@select="action = $event.value"
					@theme="themeMode = $event.mode"
				/>
			</div>
		</header>

		<div class="grid gap-2 px-4 py-5 text-sm">
			<p class="font-medium">Account action</p>
			<p class="text-muted-fg">
				The last selected profile menu item is <code class="text-canvas-fg">{{ action }}</code>.
				Theme mode is <code class="text-canvas-fg">{{ themeMode }}</code>.
			</p>
		</div>
	</div>
</template>
