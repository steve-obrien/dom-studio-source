<script setup>
import { ref } from 'vue';
import { DomAvatar, DomDropdown, DomMenu, MenuItem, MenuLabel, MenuSeparator, DomThemeSwitcher } from '@getdom/studio/vue';

const selected = ref('none');
const onboardingTasks = [
	{ value: 'website', label: 'Add website', href: '#add-website', completed: true },
	{ value: 'audience', label: 'Audience and competitors', href: '#audience-competitors', completed: false },
	{ value: 'blog', label: 'Integrate blog', href: '#integrate-blog', completed: false },
];

const icons = {
	profile: ['M20 21a8 8 0 0 0-16 0', 'M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
	onboarding: ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
	logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
};

function icon(name) {
	return icons[name] || [];
}
</script>

<template>
	<div class="grid gap-3">
		<DomDropdown align="right" width="min-w-[18rem]" :auto-focus-panel="false" panel-type="dialog" @select="selected = $event">
			<template #trigger>
				<span class="flex min-w-0 items-center gap-2">
					<DomAvatar initials="SO" name="Steven O'Brien" size="sm" />
					<span class="truncate text-sm">steven.a.obrien@gmail.com</span>
				</span>
			</template>

			<DomMenu>
				<MenuItem value="profile" href="#profile">
					<span class="flex min-w-0 items-center gap-3">
						<span class="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-fg">
							<svg v-if="icon('profile').length" viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path v-for="path in icon('profile')" :key="path" :d="path" />
							</svg>
						</span>
						<span class="min-w-0">
							<span class="block truncate font-medium">Profile</span>
							<span class="block truncate text-xs text-muted-fg">Account details and preferences</span>
						</span>
					</span>
					<template #accessory>
						<DomThemeSwitcher :show-label="false" size="icon-sm" />
					</template>
				</MenuItem>

				<MenuItem value="onboarding">
					<span class="flex min-w-0 items-center gap-3">
						<span class="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-fg">
							<svg v-if="icon('onboarding').length" viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path v-for="path in icon('onboarding')" :key="path" :d="path" />
							</svg>
						</span>
						<span class="min-w-0">
							<span class="block truncate font-medium">Onboarding</span>
							<span class="block truncate text-xs text-muted-fg">Resume setup checklist</span>
						</span>
					</span>
					<template #submenu>
						<MenuItem v-for="task in onboardingTasks" :key="task.value" :value="task.value" :href="task.href">
							<span class="flex min-w-0 items-center gap-3">
								<span class="grid size-4 shrink-0 place-items-center rounded-full border" :class="task.completed ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-canvas text-muted-fg'" aria-hidden="true">
									<svg v-if="task.completed" viewBox="0 0 16 16" class="size-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.2l2.7 2.7 6.3-6.6" /></svg>
								</span>
								<span class="min-w-0 truncate" :class="task.completed ? 'text-muted-fg line-through decoration-border decoration-2' : ''">{{ task.label }}</span>
							</span>
						</MenuItem>
					</template>
				</MenuItem>

				<MenuSeparator />
				<MenuLabel>
					<span class="block text-[11px] font-medium uppercase text-muted-fg">Logged in as</span>
					<span class="mt-0.5 block truncate text-sm font-medium text-canvas-fg">steven.a.obrien@gmail.com</span>
				</MenuLabel>
				<MenuSeparator />

				<MenuItem value="logout" tone="danger">
					<span class="flex min-w-0 items-center gap-3">
						<span class="grid size-8 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
							<svg v-if="icon('logout').length" viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path v-for="path in icon('logout')" :key="path" :d="path" />
							</svg>
						</span>
						<span class="min-w-0">
							<span class="block truncate font-medium">Log out</span>
							<span class="block truncate text-xs text-destructive/80">End the current session</span>
						</span>
					</span>
				</MenuItem>
			</DomMenu>
		</DomDropdown>

		<p class="text-xs text-muted-fg">Selected: <code class="text-canvas-fg">{{ selected }}</code></p>
	</div>
</template>
