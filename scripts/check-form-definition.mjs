import assert from 'node:assert/strict';
import {
	formDefinitionToJsonSchema,
	inferFormNodeFromValue,
	normalizeFormChildren,
	normalizeFormNode,
	registerFormType,
} from '../src/pages/forms/form/formDefinition.js';
import { schemaToChildren } from '../src/pages/forms/form/schemaAdapter.js';

function fieldByName(children, name) {
	return children.find((child) => child.props?.name === name);
}

const keyed = normalizeFormChildren({
	name: {
		type: 'string',
		label: 'Full name',
		required: true,
	},
	email: {
		type: 'email',
		label: 'Email',
	},
});

assert.equal(keyed.length, 2);
assert.deepEqual(fieldByName(keyed, 'name'), {
	type: 'string',
	component: 'DomTextInput',
	props: {
		label: 'Full name',
		required: true,
		name: 'name',
	},
});
assert.equal(fieldByName(keyed, 'email').component, 'DomEmailInput');

const schemaChildren = schemaToChildren({
	children: {
		business: {
			label: 'Business',
			type: 'string',
			placeholder: 'Enter your business name',
			required: true,
		},
		website: {
			label: 'Website',
			type: 'text',
			placeholder: 'Enter your website URL',
			required: true,
		},
	},
});

assert.equal(schemaChildren.length, 2);
assert.equal(fieldByName(schemaChildren, 'business').component, 'DomTextInput');
assert.deepEqual(fieldByName(schemaChildren, 'website').props, {
	label: 'Website',
	placeholder: 'Enter your website URL',
	required: true,
	name: 'website',
});

const keyedSchemaChildren = schemaToChildren({
	business: {
		label: 'Business',
		type: 'string',
	},
});

assert.equal(keyedSchemaChildren.length, 1);
assert.equal(keyedSchemaChildren[0].props.name, 'business');

const objectNode = normalizeFormNode({
	type: 'DomForm',
	properties: {
		title: { type: 'string' },
	},
});

assert.equal(objectNode.type, 'object');
assert.equal(objectNode.component, 'DomForm');
assert.equal(objectNode.children[0].props.name, 'title');

const searchField = normalizeFormNode({
	type: 'DomTextInput',
	label: 'Search',
	typeProp: 'top level prop',
	props: {
		type: 'search',
		label: 'Search input',
	},
});

assert.equal(searchField.type, 'string');
assert.equal(searchField.component, 'DomTextInput');
assert.deepEqual(searchField.props, {
	label: 'Search input',
	typeProp: 'top level prop',
	type: 'search',
});

const explicitName = normalizeFormChildren({
	name: {
		type: 'string',
		name: 'displayName',
	},
});
assert.equal(explicitName[0].props.name, 'displayName');

registerFormType('UserInvite', {
	type: 'DomForm',
	properties: {
		email: { type: 'email', required: true },
		role: {
			type: 'string',
			component: 'DomSelectInput',
			options: ['admin', 'member'],
		},
	},
});

const team = normalizeFormNode({
	type: 'object',
	properties: {
		teamName: { type: 'string', required: true },
		invites: {
			type: 'array',
			items: { type: 'UserInvite' },
		},
	},
});

assert.equal(team.component, 'DomForm');
assert.equal(fieldByName(team.children, 'invites').component, 'DomJsonListInput');
assert.equal(fieldByName(team.children, 'invites').items.type, 'object');
assert.equal(fieldByName(team.children, 'invites').items.children[0].props.name, 'email');

const directArray = normalizeFormNode({
	type: 'array',
	items: { type: 'UserInvite' },
});

assert.equal(directArray.type, 'array');
assert.equal(directArray.component, 'DomJsonListInput');
assert.equal(directArray.items.component, 'DomForm');

const inferredMenuItems = normalizeFormNode(inferFormNodeFromValue([
	{ label: 'Open', value: 'open', href: 'https://example.com' },
	{ label: 'Advanced', value: 'advanced', children: [{ label: 'Export', value: 'export' }] },
	{ separator: true },
]));

assert.equal(inferredMenuItems.component, 'DomJsonListInput');
assert.equal(inferredMenuItems.items.component, 'DomForm');
assert.equal(fieldByName(inferredMenuItems.items.children, 'label').component, 'DomTextInput');
assert.equal(fieldByName(inferredMenuItems.items.children, 'href').component, 'DomUrlInput');
assert.equal(fieldByName(inferredMenuItems.items.children, 'separator').component, 'DomToggle');
assert.equal(fieldByName(inferredMenuItems.items.children, 'children').component, 'DomJsonListInput');

const schema = formDefinitionToJsonSchema(team);
assert.deepEqual(schema, {
	type: 'object',
	properties: {
		teamName: {
			type: 'string',
		},
		invites: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					email: {
						type: 'string',
						format: 'email',
					},
					role: {
						type: 'string',
						enum: ['admin', 'member'],
					},
				},
				required: ['email'],
			},
		},
	},
	required: ['teamName'],
});

console.log('Form definition checks passed.');
