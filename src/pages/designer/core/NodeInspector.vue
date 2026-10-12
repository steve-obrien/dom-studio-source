<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomTextInput } from '../../lib/vue';
import InspectorField from '../../_layout/inspector/InspectorField.vue';
import { toTemplateLiteral } from '../canvas/canvasDocument.js';
import { isExpr } from './editorDocument.js';
import { UNKNOWN, createScope, evaluate } from './expression.js';

/**
 * Generated inspector for one node.
 *
 * Fields come from the node's type (`schema`), which for DOM Studio components
 * is read from their prop definitions and `_edit` metadata. Each field can
 * hold a literal, edited with its registered editor, or a binding to data,
 * edited as an expression. Props the type does not describe (from imported
 * code) are listed too, so nothing in the source is hidden.
 */
defineOptions({ name: 'NodeInspector' });

const props = defineProps({
	node: { type: Object, required: true },
	type: { type: Object, required: true },
	data: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['set-prop']);
const groupOrder = ['Style', 'Props', 'Content', 'Attributes'];
const draft = ref({ name: '', value: '' });

const schemaKeys = computed(() => new Set(props.type.schema.map((field) => field.key)));
const groups = computed(() => {
	const map = new Map();
	for (const field of props.type.schema) {
		const group = field.group || 'Props';
		if (!map.has(group)) map.set(group, []);
		map.get(group).push(field);
	}
	return [...map.entries()].sort(([a], [b]) => rank(a) - rank(b));
});
const extraProps = computed(() => Object.entries(props.node.props || {}).filter(([key]) => !schemaKeys.value.has(key) && !(props.node.type === 'text' && key === 'value')));

function rank(group) {
	const index = groupOrder.indexOf(group);
	return index < 0 ? groupOrder.length : index;
}

function set(key, value, merge = true) {
	emit('set-prop', { key, value, merge });
}

/** Binds a literal prop to an expression, starting from its current value. */
function bind(key) {
	const value = props.node.props[key];
	set(key, { expr: value === undefined || value === '' ? "''" : toTemplateLiteral(value) }, false);
}

/** Replaces a binding with its preview value, so the designer can edit it directly. */
function unbind(key) {
	const value = evaluate(props.node.props[key].expr, createScope(props.data));
	set(key, value === UNKNOWN || (value && typeof value === 'object') ? undefined : value, false);
}

function addProp() {
	const name = draft.value.name.trim();
	if (!/^:?[A-Za-z_][\w:.-]*$/.test(name) || /^on/i.test(name)) return;
	set(name.replace(/^:/, ''), name.startsWith(':') ? { expr: draft.value.value || "''" } : draft.value.value, false);
	draft.value = { name: '', value: '' };
}
</script>

<template>
	<div class="space-y-5">
		<section v-for="[group, fields] in groups" :key="group" class="space-y-3">
			<h3 class="text-xs font-semibold uppercase tracking-wide text-muted-fg">{{ group }}</h3>
			<div v-for="field in fields" :key="field.key" class="group/field relative">
				<div v-if="isExpr(node.props[field.key])" class="flex items-end gap-1.5">
					<DomTextInput
						class="min-w-0 flex-1 font-mono"
						:label="`${field.label || field.key} · bound`"
						:model-value="node.props[field.key].expr"
						@update:model-value="set(field.key, { expr: $event })"
					/>
					<DomButton size="sm" variant="ghost" title="Use the preview value instead of a binding" @click="unbind(field.key)">Unbind</DomButton>
				</div>
				<template v-else>
					<InspectorField :field="field" :model-value="node.props[field.key]" @update:model-value="set(field.key, $event)" />
					<button
						v-if="node.type !== 'text' || field.key === 'value'"
						type="button"
						class="absolute right-0 top-0 rounded px-1 font-mono text-[11px] text-muted-fg opacity-0 transition hover:bg-secondary hover:text-primary focus:opacity-100 group-hover/field:opacity-100"
						:title="`Bind ${field.label || field.key} to data`"
						@click="bind(field.key)"
					>{ }</button>
				</template>
			</div>
		</section>

		<section v-if="node.type !== 'text'" class="space-y-2">
			<h3 class="text-xs font-semibold uppercase tracking-wide text-muted-fg">{{ extraProps.length ? 'Other props' : 'Add a prop' }}</h3>
			<div v-for="[key, value] in extraProps" :key="key" class="flex items-end gap-1.5">
				<DomTextInput
					class="min-w-0 flex-1"
					:class="isExpr(value) && 'font-mono'"
					:label="isExpr(value) ? `:${key.replace(/^:/, '')}` : key"
					:model-value="isExpr(value) ? value.expr : String(value ?? '')"
					@update:model-value="set(key, isExpr(value) ? { expr: $event } : $event)"
				/>
				<DomButton size="sm" variant="ghost" :aria-label="`Remove ${key}`" @click="set(key, undefined, false)">×</DomButton>
			</div>
			<form class="flex items-end gap-1.5" @submit.prevent="addProp">
				<DomTextInput v-model="draft.name" class="min-w-0 flex-1" label="Name" placeholder="title or :items" />
				<DomTextInput v-model="draft.value" class="min-w-0 flex-1" label="Value" />
				<DomButton size="sm" type="submit">Add</DomButton>
			</form>
		</section>
	</div>
</template>
