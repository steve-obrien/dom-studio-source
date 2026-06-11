import { isJsonSchema, jsonSchemaAdapter, jsonSchemaToChildren } from './adapters/jsonSchema.js';
import { isZodLikeSchema, zodSchemaAdapter, zodSchemaToChildren } from './adapters/zod.js';
import { normalizeFormChildren, normalizeFormNode } from './formDefinition.js';

export {
	isJsonSchema,
	jsonSchemaAdapter,
	jsonSchemaToChildren,
	isZodLikeSchema,
	zodSchemaAdapter,
	zodSchemaToChildren,
};

export const builtInSchemaAdapters = [
	jsonSchemaAdapter,
	zodSchemaAdapter,
];

function isObject(value) {
	return value && typeof value === 'object';
}

function hasOwn(value, key) {
	return Object.prototype.hasOwnProperty.call(value || {}, key);
}

function isKeyedChildren(value) {
	return isObject(value)
		&& !Array.isArray(value)
		&& !hasOwn(value, '$schema')
		&& !hasOwn(value, 'type')
		&& !hasOwn(value, 'component')
		&& !hasOwn(value, 'children')
		&& !hasOwn(value, 'properties')
		&& !hasOwn(value, 'items');
}

export function nativeSchemaToChildren(schema) {
	if (!schema) return [];
	if (Array.isArray(schema) || isKeyedChildren(schema)) return normalizeFormChildren(schema);
	if (!isObject(schema)) return [];

	const node = normalizeFormNode(schema);
	if (!node) return [];
	if (node.component === 'DomForm' || node.type === 'object') return node.children || [];
	return [node];
}

export function schemaToChildren(schema, options = {}, adapters = builtInSchemaAdapters) {
	if (!schema) return [];
	const adapter = adapters.find((candidate) => candidate?.matches?.(schema, options));
	const children = adapter?.toChildren?.(schema, options) || [];
	return children.length ? children : nativeSchemaToChildren(schema);
}
