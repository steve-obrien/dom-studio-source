<script setup>
import { ref } from 'vue';
import {
	DomButton,
	DomCheckbox,
	DomCombobox,
	DomDialog,
	DomForm,
	DomSelect,
	DomStatusPill,
	DomTextInput,
	DomTextareaInput,
	DomToggle,
} from '@getdom/studio/vue';

const initialPost = {
	title: 'Launching the summer product notes',
	slug: 'summer-product-notes',
	excerpt: 'A concise editor note that introduces the upcoming product improvements and release timing.',
	body: 'The next product update focuses on faster project setup, clearer review queues, and better publishing controls for distributed teams.',
	status: 'scheduled',
	owner: 'maya-patel',
	category: 'product-updates',
	publishAt: '2 Jul 2026, 09:30',
	seoTitle: 'Summer product notes and release updates',
	seoDescription: 'Read the latest product notes, launch timing, and editorial guidance for the summer release.',
	featured: true,
	allowComments: false,
};
const statusOptions = [
	{ label: 'Draft', value: 'draft', description: 'Keep hidden from reviewers and subscribers.' },
	{ label: 'In review', value: 'review', description: 'Ready for editorial and legal approval.' },
	{ label: 'Scheduled', value: 'scheduled', description: 'Queued for the selected publish date.' },
	{ label: 'Published', value: 'published', description: 'Visible on the public site.' },
];
const ownerOptions = [
	{ label: 'Maya Patel', value: 'maya-patel' },
	{ label: 'Theo James', value: 'theo-james' },
	{ label: 'Anika Bose', value: 'anika-bose' },
	{ label: 'Rory Chen', value: 'rory-chen' },
];
const categoryOptions = [
	{ label: 'Product updates', value: 'product-updates' },
	{ label: 'Engineering', value: 'engineering' },
	{ label: 'Customer stories', value: 'customer-stories' },
	{ label: 'Company news', value: 'company-news' },
];
const open = ref(false);
const draft = ref(clonePost(initialPost));
const lastSaved = ref('No post changes saved yet.');

/**
 * Create a detached editable post object.
 *
 * @param {Record<string, unknown>} post Source post data.
 * @returns {Record<string, unknown>} Cloned post data for form editing.
 */
function clonePost(post) {
	return { ...post };
}

/**
 * Resolve the display label for a saved option value.
 *
 * @param {Array<{ label: string, value: string }>} options Selectable options.
 * @param {string} value Stored option value.
 * @returns {string} Display label or raw value fallback.
 */
function optionLabel(options, value) {
	return options.find((option) => option.value === value)?.label || value;
}

/**
 * Restore the form to its original example data.
 *
 * @returns {void}
 */
function resetPost() {
	draft.value = clonePost(initialPost);
}

/**
 * Save the edited post values and close the dialog.
 *
 * @param {{ values: Record<string, unknown> }} payload Form submission payload.
 * @returns {void}
 */
function savePost({ values }) {
	const status = optionLabel(statusOptions, String(values.status || 'draft')).toLowerCase();
	lastSaved.value = `${values.title || 'Post'} saved as ${status}.`;
	open.value = false;
}
</script>

<template>
	<div class="flex flex-col items-center gap-3">
		<DomButton variant="primary" @click="open = true">Edit post</DomButton>
		<p class="text-sm text-muted-fg">{{ lastSaved }}</p>
	</div>

	<DomDialog
		v-model="open"
		width="95vw"
		height="95vh"
		title="Edit post"
		description="Update editorial content, publishing state, and search metadata in a near-full-page dialog."
	>
		<DomForm
			id="edit-post-dialog-form"
			v-model="draft"
			class="space-y-6"
			@submit="savePost"
		>
			<div class="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
				<div class="space-y-1">
					<p class="text-sm font-medium text-canvas-fg">Publishing workflow</p>
					<p class="text-xs leading-relaxed text-muted-fg">Draft content and review settings stay together so editors can make a final pass quickly.</p>
				</div>
				<DomStatusPill tone="warning" label="Scheduled" />
			</div>

			<div class="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
				<div class="space-y-4">
					<DomTextInput
						name="title"
						label="Title"
						placeholder="Launching the summer product notes"
						required
					/>
					<div class="grid gap-4 sm:grid-cols-2">
						<DomTextInput
							name="slug"
							label="Slug"
							placeholder="summer-product-notes"
							required
						/>
						<DomTextInput
							name="publishAt"
							label="Publish date"
							placeholder="2 Jul 2026, 09:30"
						/>
					</div>
					<DomTextareaInput
						name="excerpt"
						label="Excerpt"
						:rows="3"
						placeholder="Short summary shown in lists and feeds."
					/>
					<DomTextareaInput
						name="body"
						label="Editorial note"
						:rows="7"
						placeholder="Write the post body..."
					/>
				</div>

				<div class="space-y-4">
					<DomSelect
						name="status"
						label="Status"
						:options="statusOptions"
						required
					/>
					<DomCombobox
						name="owner"
						label="Owner"
						:options="ownerOptions"
						placeholder="Choose an owner"
					/>
					<DomSelect
						name="category"
						label="Category"
						:options="categoryOptions"
					/>
					<div class="space-y-3 border-t border-border pt-4">
						<DomToggle
							name="featured"
							label="Feature this post"
							description="Highlight it in the editorial index."
						/>
						<DomCheckbox
							name="allowComments"
							label="Allow comments"
							description="Let signed-in customers respond after publishing."
						/>
					</div>
				</div>
			</div>

			<div class="grid gap-4 border-t border-border pt-4 md:grid-cols-2">
				<DomTextInput
					name="seoTitle"
					label="SEO title"
					placeholder="Search result title"
				/>
				<DomTextareaInput
					name="seoDescription"
					label="SEO description"
					:rows="2"
					placeholder="Search result description"
				/>
			</div>
		</DomForm>

		<template #footer>
			<p class="mr-auto hidden text-xs text-muted-fg sm:block">Changes are saved when the form submits.</p>
			<DomButton variant="ghost" type="button" @click="resetPost">Reset</DomButton>
			<DomButton variant="secondary" type="button" @click="open = false">Cancel</DomButton>
			<DomButton type="submit" form="edit-post-dialog-form">Save changes</DomButton>
		</template>
	</DomDialog>
</template>
