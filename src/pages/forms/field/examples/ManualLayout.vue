<script setup>
import { ref } from 'vue';
import { DomEmailInput, DomField } from '@getdom/studio/vue';

const email = ref('steve.example');
const errors = ['Enter a valid email address.'];

</script>

<template>
	<div class="w-full max-w-xl">
		<DomField
			label="Email"
			description="Used for receipts."
			required
			:chrome="false"
			v-slot="{ label, description, descriptionId, htmlFor, errors: fieldErrors, errorId, invalid }"
		>
			<div class="grid gap-2 sm:grid-cols-[8rem_1fr] sm:items-start">
				<label
					:for="htmlFor"
					class="pt-2 text-sm font-semibold"
					:class="invalid ? 'text-destructive' : 'text-muted-fg'"
				>
					{{ label }}
					<span aria-hidden="true">*</span>
				</label>
				<div class="min-w-0 space-y-1">
					<DomEmailInput
						id="manual-layout-email"
						v-model="email"
						name="email"
						:errors="errors"
						:chrome="false"
						required
					/>
					<p
						v-if="description"
						:id="descriptionId || undefined"
						class="text-xs leading-5 text-muted-fg"
					>
						{{ description }}
					</p>
					<ul
						v-if="fieldErrors.length"
						:id="errorId || undefined"
						class="space-y-1 text-xs leading-5 text-destructive"
					>
						<li v-for="error in fieldErrors" :key="error">{{ error }}</li>
					</ul>
				</div>
			</div>
		</DomField>
	</div>
</template>
