<script setup>
import { ref } from 'vue';
import { DomRangeInput, DomToggleButtonGroup, DomTreeView } from '../../../lib/vue';

const folderIcon = 'M4 6h6l2 2h8v10H4V6Z';
const fileIcon = 'M6 4h8l4 4v12H6V4Zm8 0v5h5';

const indent = ref(10);
const guides = ref('always');
const selection = ref('subtle');
const selected = ref('button-vue');

const guideOptions = [
	{ label: 'None', value: 'none' },
	{ label: 'Always', value: 'always' },
	{ label: 'Hover', value: 'hover' },
];
const selectionOptions = [
	{ label: 'Solid', value: 'solid' },
	{ label: 'Subtle', value: 'subtle' },
];

const files = ref([
	{
		id: 'src',
		label: 'src',
		icon: folderIcon,
		open: true,
		children: [
			{
				id: 'pages',
				label: 'pages',
				icon: folderIcon,
				open: true,
				children: [
					{
						id: 'components',
						label: 'components',
						icon: folderIcon,
						open: true,
						children: [
							{
								id: 'button',
								label: 'button',
								icon: folderIcon,
								open: true,
								children: [
									{
										id: 'button-examples',
										label: 'examples',
										icon: folderIcon,
										open: true,
										children: [
											{ id: 'button-sizes', label: 'Sizes.vue', icon: fileIcon },
											{ id: 'button-variants', label: 'Variants.vue', icon: fileIcon },
										],
									},
									{ id: 'button-vue', label: 'DomButton.vue', icon: fileIcon },
									{ id: 'button-index', label: 'Index.vue', icon: fileIcon },
								],
							},
							{
								id: 'tree-view',
								label: 'tree-view',
								icon: folderIcon,
								children: [
									{ id: 'tree-vue', label: 'DomTreeView.vue', icon: fileIcon },
									{ id: 'tree-utils', label: 'treeUtils.js', icon: fileIcon },
								],
							},
						],
					},
					{ id: 'routes', label: 'routes.js', icon: fileIcon },
				],
			},
			{ id: 'style', label: 'style.css', icon: fileIcon },
		],
	},
	{ id: 'package', label: 'package.json', icon: fileIcon },
]);
</script>

<template>
	<div class="grid w-full gap-4 md:grid-cols-[minmax(0,18rem)_1fr]">
		<div class="rounded-2xl border border-border bg-canvas p-2">
			<DomTreeView
				v-model="selected"
				v-model:items="files"
				:indent="indent"
				:guides="guides"
				:selection="selection"
				:chrome="false"
				label="Explorer"
			/>
		</div>
		<div class="grid content-start gap-4 text-sm">
			<DomRangeInput v-model="indent" label="Indent" :min="4" :max="24" suffix="px" />
			<DomToggleButtonGroup v-model="guides" label="Guides" :options="guideOptions" size="sm" />
			<DomToggleButtonGroup v-model="selection" label="Selection" :options="selectionOptions" size="sm" />
		</div>
	</div>
</template>
