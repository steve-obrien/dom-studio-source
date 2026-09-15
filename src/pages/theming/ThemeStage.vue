<script setup>
import { ref } from 'vue';
import { DomBadge, DomButton, DomCard, DomCheckbox, DomNativeSelect, DomProgress, DomTextInput, DomToggle } from '../lib/vue';

const props = defineProps({
	selectedSkin: { type: String, default: '' },
});
const emit = defineEmits(['inspect']);
const projectName = ref('Website refresh');
const visibility = ref('Team members');
const notifications = ref(true);
const newsletter = ref(false);
const saved = ref(false);

/**
 * Returns a stable selection outline without inheriting the theme's focus colour.
 *
 * @param {string} name Skin represented by this specimen.
 * @returns {string} Tailwind outline utilities for the selected specimen.
 */
function selectionClass(name) {
	return props.selectedSkin === name ? 'outline-2 outline-offset-4 outline-[var(--editor-selection)]' : '';
}

/**
 * Demonstrates a local save action without submitting the preview's sample data.
 *
 * @returns {void}
 */
function saveExample() {
	saved.value = true;
}
</script>

<template>
	<div class="@container bg-canvas p-5 text-canvas-fg sm:p-8" aria-label="Themed component preview">
		<div class="mb-5 flex items-start justify-between gap-3 border-b border-border pb-5">
			<div>
				<h2 class="text-lg font-semibold tracking-tight">Component library</h2>
				<p class="mt-2 text-xs leading-5 text-muted-fg">Buttons, forms, and surfaces using your theme.</p>
			</div>
			<DomBadge label="Preview" variant="outline" size="sm" />
		</div>

		<div class="grid items-start gap-6 @xl:grid-cols-2">
			<div class="space-y-5">
				<section>
					<button
						type="button"
						class="mb-3 text-xs font-medium text-muted-fg hover:text-canvas-fg focus-visible:outline-2 focus-visible:outline-ring"
						aria-label="Inspect card style"
						@click="emit('inspect', 'card')"
					>
						Card
					</button>
					<DomCard padding="p-5" :class="selectionClass('card')" @click="emit('inspect', 'card')">
						<div class="flex items-center justify-between gap-3">
							<span class="text-xs font-medium text-muted-fg">Workspace</span>
							<DomBadge label="Pro plan" tone="primary" size="sm" />
						</div>
						<p class="mt-4 text-lg font-semibold tracking-tight">Design workspace</p>
						<p class="mt-2 text-xs leading-5 text-muted-fg">
							Manage projects, share updates, and keep your team in sync.
						</p>
						<div class="my-4 flex -space-x-2" aria-label="Three team members">
							<span
								v-for="initials in ['JD', 'AK', 'ML']"
								:key="initials"
								class="grid size-8 place-items-center rounded-full border-2 border-canvas bg-secondary text-[10px] font-semibold text-secondary-fg"
							>
								{{ initials }}
							</span>
						</div>
						<DomProgress :value="72" label="Monthly usage" show-value size="sm" />
					</DomCard>
				</section>

				<section>
					<button
						type="button"
						class="mb-3 text-xs font-medium text-muted-fg hover:text-canvas-fg focus-visible:outline-2 focus-visible:outline-ring"
						aria-label="Inspect primary action style"
						@click="emit('inspect', 'action')"
					>
						Buttons & actions
					</button>
					<div class="space-y-3 rounded-lg" :class="selectionClass('action')">
						<div class="flex flex-wrap gap-2">
							<DomButton size="sm" @click="emit('inspect', 'action')">Create project</DomButton>
							<DomButton
								variant="secondary"
								size="sm"
								:class="selectionClass('control')"
								@click="emit('inspect', 'control')"
							>
								Secondary
							</DomButton>
							<DomButton variant="ghost" size="sm" @click="emit('inspect', 'control')">Ghost</DomButton>
						</div>
						<div class="flex flex-wrap gap-2">
							<DomButton size="sm" disabled>Disabled</DomButton>
							<DomButton variant="danger" size="sm" @click="emit('inspect', 'control')">
								Delete project
							</DomButton>
						</div>
					</div>
				</section>

				<section aria-label="Status examples">
					<p class="mb-3 text-xs font-medium text-muted-fg">Status & feedback</p>
					<div class="flex flex-wrap gap-2">
						<DomBadge tone="success" label="Complete" size="sm" />
						<DomBadge tone="warning" label="In review" size="sm" />
						<DomBadge tone="danger" label="Needs attention" size="sm" />
					</div>
				</section>
			</div>

			<div class="space-y-5">
				<section>
					<button
						type="button"
						class="mb-3 text-xs font-medium text-muted-fg hover:text-canvas-fg focus-visible:outline-2 focus-visible:outline-ring"
						aria-label="Inspect input style"
						@click="emit('inspect', 'input')"
					>
						Form controls
					</button>
					<form class="space-y-4 rounded-lg" :class="selectionClass('input')" @submit.prevent="saveExample">
						<DomTextInput v-model="projectName" label="Project name" />
						<DomNativeSelect
							v-model="visibility"
							label="Visibility"
							:options="['Team members', 'Only me', 'Anyone with the link']"
						/>
						<div class="flex items-center justify-between gap-3 py-1">
							<label for="theme-preview-notifications" class="text-xs">Email notifications</label>
							<DomToggle
								id="theme-preview-notifications"
								v-model="notifications"
								label="Email notifications"
								chrome="none"
								size="sm"
							/>
						</div>
						<DomCheckbox v-model="newsletter" label="Send me product updates" />
						<DomButton type="submit" size="sm" class="w-full">
							{{ saved ? 'Changes saved' : 'Save changes' }}
						</DomButton>
					</form>
				</section>

				<section>
					<button
						type="button"
						class="mb-3 text-xs font-medium text-muted-fg hover:text-canvas-fg focus-visible:outline-2 focus-visible:outline-ring"
						aria-label="Inspect popover style"
						@click="emit('inspect', 'popover')"
					>
						Menu
					</button>
					<div
						class="skin-popover rounded-xl p-1.5"
						:class="selectionClass('popover')"
						aria-label="Menu style preview"
					>
						<button
							v-for="(label, index) in ['Edit project', 'Duplicate', 'Archive project']"
							:key="label"
							type="button"
							class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs hover:bg-accent hover:text-accent-fg focus-visible:outline-2 focus-visible:outline-ring"
							:class="index === 0 && 'bg-accent text-accent-fg'"
							@click="emit('inspect', 'popover')"
						>
							{{ label }}
							<span v-if="index === 0" class="text-[10px] opacity-50">⌘ E</span>
						</button>
					</div>
				</section>
			</div>
		</div>

		<section class="mt-7 border-t border-border pt-5">
			<button
				type="button"
				class="mb-3 text-xs font-medium text-muted-fg hover:text-canvas-fg focus-visible:outline-2 focus-visible:outline-ring"
				aria-label="Inspect overlay style"
				@click="emit('inspect', 'overlay')"
			>
				Dialog
			</button>
			<div
				class="skin-overlay flex flex-wrap items-center justify-between gap-4 rounded-xl p-4"
				:class="selectionClass('overlay')"
			>
				<div>
					<p class="text-sm font-semibold">Ready to share?</p>
					<p class="mt-1 text-xs text-muted-fg">Invite your team to this workspace.</p>
				</div>
				<div class="flex gap-2">
					<DomButton variant="secondary" size="sm" @click="emit('inspect', 'overlay')">Cancel</DomButton>
					<DomButton size="sm" @click="emit('inspect', 'overlay')">Invite team</DomButton>
				</div>
			</div>
		</section>
	</div>
</template>
