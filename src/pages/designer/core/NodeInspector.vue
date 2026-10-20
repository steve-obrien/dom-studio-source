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
 *
 * A type can order its groups with `groups`, and a field with `half: true`
 * shares a row. A field with `keys` edits several props as one object, such
 * as a typography editor over `fontFamily`, `fontSize` and the rest. Number fields are clamped to their `min` and `max`. An
 * unset field with a `defaultValue` shows that default (see `InspectorField`),
 * and a set one can be reset, which removes the prop from the source. Editors
 * without data bindings (the poster) turn off `bindable` and `extraProps`.
 */
defineOptions({ name: 'NodeInspector' });

const props = defineProps({
	node: { type: Object, required: true },
	type: { type: Object, required: true },
	data: { type: Object, default: () => ({}) },
	bindable: { type: Boolean, default: true },
	extraProps: { type: Boolean, default: true },
	disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['set-prop']);
const defaultGroupOrder = ['Style', 'Props', 'Content', 'Attributes'];
const numericEditors = new Set(['DomNumberInput', 'DomRangeInput', 'ScrubField']);
const draft = ref({ name: '', value: '' });

const schemaKeys = computed(() => new Set(props.type.schema.flatMap((field) => field.keys || [field.key])));
const groups = computed(() => {
	const map = new Map();
	for (const field of props.type.schema) {
		const group = field.group || 'Props';
		if (!map.has(group)) map.set(group, []);
		map.get(group).push(field);
	}
	return [...map.entries()].sort(([a], [b]) => rank(a) - rank(b));
});
const otherProps = computed(() => Object.entries(props.node.props || {}).filter(([key]) => !schemaKeys.value.has(key) && !(props.node.type === 'text' && key === 'value')));

function rank(group) {
	const order = props.type.groups || defaultGroupOrder;
	const index = order.indexOf(group);
	return index < 0 ? order.length : index;
}

/** Whether an unset field falls back to a default the inspector shows. */
function hasDefault(field) {
	return !field.keys && field.defaultValue !== undefined;
}

function formatDefault(value) {
	return typeof value === 'string' ? `'${value}'` : String(value);
}

function set(key, value, merge = true) {
	emit('set-prop', { key, value, merge });
}

/** A field's value; a field over several props gets them as one object. */
function fieldValue(field) {
	if (!field.keys) return props.node.props[field.key];
	return Object.fromEntries(field.keys.map((key) => [key, props.node.props[key] ?? '']));
}

/** Sets a field's literal value; numbers are finite and within the field's range. */
function setField(field, value) {
	if (field.keys) {
		for (const key of field.keys) if (value?.[key] !== undefined && value[key] !== fieldValue(field)[key]) set(key, value[key]);
		return;
	}
	if (numericEditors.has(field.component)) {
		if (value === '' || value === null || !Number.isFinite(Number(value))) return;
		const { min = -Infinity, max = Infinity } = { ...field, ...field.props };
		value = Math.min(max, Math.max(min, Number(value)));
	}
	set(field.key, value);
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
	<fieldset :disabled="disabled" class="min-w-0 space-y-5 disabled:opacity-50">
		<section v-for="[group, fields] in groups" :key="group" class="grid grid-cols-2 gap-x-1.5 gap-y-2.5">
			<h3 class="col-span-2 text-[11px] font-semibold">{{ group }}</h3>
			<div v-for="field in fields" :key="field.key" class="group/field relative min-w-0" :class="field.half ? 'col-span-1' : 'col-span-2'">
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
					<InspectorField :field="field" :model-value="fieldValue(field)" @update:model-value="setField(field, $event)" />
					<div class="absolute right-0 top-0 flex gap-0.5 opacity-0 transition focus-within:opacity-100 group-hover/field:opacity-100">
						<button
							v-if="hasDefault(field) && node.props[field.key] !== undefined"
							type="button"
							class="rounded px-1 text-[11px] text-muted-fg hover:bg-secondary hover:text-primary"
							:title="`Reset ${field.label || field.key} to its default (${formatDefault(field.defaultValue)})`"
							@click="set(field.key, undefined, false)"
						>Reset</button>
						<button
							v-if="bindable && !field.keys && (node.type !== 'text' || field.key === 'value')"
							type="button"
							class="rounded px-1 font-mono text-[11px] text-muted-fg hover:bg-secondary hover:text-primary"
							:title="`Bind ${field.label || field.key} to data`"
							@click="bind(field.key)"
						>{ }</button>
					</div>
				</template>
			</div>
		</section>

		<section v-if="extraProps && node.type !== 'text'" class="space-y-2">
			<h3 class="text-[11px] font-semibold">{{ otherProps.length ? 'Other props' : 'Add a prop' }}</h3>
			<div v-for="[key, value] in otherProps" :key="key" class="flex items-end gap-1.5">
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
	</fieldset>
</template>
