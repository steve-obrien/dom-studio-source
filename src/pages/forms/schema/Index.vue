<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';

const formSchemaCode = `const inviteFormDefinition = {
\ttype: 'DomForm',
\tproperties: {
\t\tname: {
\t\t\ttype: 'string',
\t\t\tlabel: 'Name',
\t\t\trequired: true,
\t\t\tmaxLength: 150,
\t\t\tstorage: {
\t\t\t\tcolumn: 'name',
\t\t\t\ttype: 'varchar',
\t\t\t\tlength: 150,
\t\t\t\tnullable: false,
\t\t\t},
\t\t},
\t\temail: {
\t\t\ttype: 'email',
\t\t\tlabel: 'Email',
\t\t\trequired: true,
\t\t\tstorage: {
\t\t\t\tcolumn: 'email',
\t\t\t\ttype: 'varchar',
\t\t\t\tlength: 254,
\t\t\t\tnullable: false,
\t\t\t\tunique: true,
\t\t\t},
\t\t},
\t},
};`;

const normalizedSchemaCode = `const normalized = {
\ttype: 'object',
\tcomponent: 'DomForm',
\tchildren: [
\t\t{
\t\t\ttype: 'string',
\t\t\tcomponent: 'DomTextInput',
\t\t\tprops: {
\t\t\t\tname: 'name',
\t\t\t\tlabel: 'Name',
\t\t\t\trequired: true,
\t\t\t\tmaxLength: 150,
\t\t\t},
\t\t},
\t\t{
\t\t\ttype: 'email',
\t\t\tcomponent: 'DomEmailInput',
\t\t\tprops: {
\t\t\t\tname: 'email',
\t\t\t\tlabel: 'Email',
\t\t\t\trequired: true,
\t\t\t},
\t\t},
\t],
};`;

const jsonSchemaCode = `const inviteJsonSchema = {
\t$schema: 'https://json-schema.org/draft/2020-12/schema',
\ttype: 'object',
\trequired: ['name', 'email'],
\tproperties: {
\t\tname: {
\t\t\ttype: 'string',
\t\t\ttitle: 'Name',
\t\t\tmaxLength: 150,
\t\t},
\t\temail: {
\t\t\ttype: 'string',
\t\t\tformat: 'email',
\t\t\ttitle: 'Email',
\t\t},
\t},
};`;

const decoratedJsonSchemaCode = `const decoratedJsonSchema = {
\ttype: 'object',
\trequired: ['name', 'role'],
\tproperties: {
\t\tname: {
\t\t\ttype: 'string',
\t\t\ttitle: 'Name',
\t\t\t'x-el': {
\t\t\t\tprops: {
\t\t\t\t\tplaceholder: 'Maya Patel',
\t\t\t\t},
\t\t\t},
\t\t},
\t\trole: {
\t\t\ttype: 'string',
\t\t\tenum: ['viewer', 'editor', 'admin'],
\t\t\ttitle: 'Role',
\t\t\t'x-el': {
\t\t\t\tcomponent: 'DomSelectInput',
\t\t\t\tprops: {
\t\t\t\t\toptions: [
\t\t\t\t\t\t{ label: 'Viewer', value: 'viewer' },
\t\t\t\t\t\t{ label: 'Editor', value: 'editor' },
\t\t\t\t\t\t{ label: 'Admin', value: 'admin' },
\t\t\t\t\t],
\t\t\t\t},
\t\t\t},
\t\t},
\t},
};`;

const formDataCode = `const inviteFormData = {
\tname: 'Maya Patel',
\temail: 'maya@example.com',
};`;

const lifecycleCode = `const textFieldDefinition = {
\ttype: 'string',
\tcomponent: 'DomTextInput',
\tstorage: {
\t\ttype: 'varchar',
\t\tlength: 150,
\t},
\tfromDatabase(value) {
\t\treturn value ?? '';
\t},
\ttoDatabase(value) {
\t\treturn String(value || '').trim();
\t},
};`;

const generatedFormCode = `// Database first.
const userTable = {
\tname: 'users',
\tcolumns: [
\t\t{ name: 'name', type: 'varchar', length: 150, nullable: false },
\t\t{ name: 'email', type: 'varchar', length: 254, nullable: false },
\t],
};

const formDefinition = createFormDefinitionFromTable(userTable);

// Form builder first.
const tableSchema = createTableSchemaFromForm(formDefinition);`;

const relationships = [
	{
		name: 'Form definition',
		description: 'The authored DOM Studio shape: semantic type, optional component override, labels, validation, layout, permissions, and future storage metadata.',
		example: 'email: { type: "email", required: true }',
	},
	{
		name: 'Form data',
		description: 'The values collected from a rendered form. It should stay small and portable.',
		example: '{ email: "maya@example.com" }',
	},
	{
		name: 'JSON Schema',
		description: 'The portable data contract: object properties, primitive types, required fields, formats, enum values, and common constraints.',
		example: 'properties.email format: email',
	},
	{
		name: 'Database schema',
		description: 'The persistence shape: table, column, datatype, length, nullability, indexes, and relationships.',
		example: 'users.email varchar(254) not null unique',
	},
	{
		name: 'Transform lifecycle',
		description: 'The conversion layer between UI values and database values.',
		example: 'fromDatabase(value), toDatabase(value)',
	},
];
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Form Schema"
			tagline="How typed form definitions relate to JSON Schema, form data, storage metadata, and future form-builder workflows."
			tag="Definitions + data"
		>
			<DocSection eyebrow="Model" title="Definitions are not submission data">
				<div class="space-y-4 text-sm leading-6 text-muted-fg">
					<p>
						A form system stores at least two different things. The definition describes
						how to render, validate, and eventually persist a form. The data is the object
						a user creates by filling that form in.
					</p>
					<p>
						The split is similar to the model described in
						<a
							href="https://form.io/form-json-schema-vs-submission/"
							target="_blank"
							rel="noreferrer"
							class="font-medium text-canvas-fg underline underline-offset-4"
						>Form.io's schema/submission model</a>:
						the definition and the submitted values are related, but they should not be
						stored as one thing.
					</p>
					<p>
						DOM Studio uses a typed form definition as the practical authoring format. It can
						normalize to renderable
						<code class="font-mono text-canvas-fg">children</code>
						and project toward JSON Schema when a portable data contract is needed.
					</p>
				</div>
			</DocSection>

			<DocSection eyebrow="Example" title="Definition and values">
				<div class="grid gap-4 lg:grid-cols-2">
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-canvas-fg">Form definition</h3>
						<p class="text-sm leading-6 text-muted-fg">
							The definition records the data type first. A component can be inferred from
							that type, or overridden when the default renderer is not specific enough.
						</p>
						<CodeBlock lang="js" :code="formSchemaCode" />
					</div>
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-canvas-fg">Form data</h3>
						<p class="text-sm leading-6 text-muted-fg">
							The model only contains the values keyed by field names.
						</p>
						<CodeBlock lang="js" :code="formDataCode" />
					</div>
				</div>
			</DocSection>

			<DocSection eyebrow="Normalization" title="Author tersely, render explicitly">
				<div class="grid gap-4 lg:grid-cols-2">
					<div class="space-y-4 text-sm leading-6 text-muted-fg">
						<p>
							Keyed
							<code class="font-mono text-canvas-fg">properties</code>
							match JSON Schema's object shape and avoid repeating the field name inside
							every child. During normalization, those keys become
							<code class="font-mono text-canvas-fg">props.name</code>.
						</p>
						<p>
							The canonical render shape keeps both
							<code class="font-mono text-canvas-fg">type</code>
							and
							<code class="font-mono text-canvas-fg">component</code>.
							The type describes the data. The component describes the editor currently
							used to manage that data.
						</p>
					</div>
					<CodeBlock lang="js" :code="normalizedSchemaCode" />
				</div>
			</DocSection>

			<DocSection eyebrow="JSON Schema" title="Use pure schema for the data contract">
				<div class="grid gap-4 lg:grid-cols-2">
					<div class="space-y-4 text-sm leading-6 text-muted-fg">
						<p>
							Pure JSON Schema is useful when the object shape needs to be understood by
							tools outside DOM Studio. It describes object properties, primitive types,
							required fields, formats, enum values, and common validation constraints.
						</p>
						<p>
							Pure JSON Schema does not know which DOM Studio component should manage each
							value. The adapter can choose defaults from the type and format, then accept
							decoration when a richer component is needed.
						</p>
					</div>
					<CodeBlock lang="js" :code="jsonSchemaCode" />
				</div>
			</DocSection>

			<DocSection eyebrow="Decoration" title="Decorate pure schema with DOM Studio metadata">
				<div class="grid gap-4 lg:grid-cols-2">
					<div class="space-y-4 text-sm leading-6 text-muted-fg">
						<p>
							When a pure JSON Schema needs form-specific information, use a vendor
							extension such as
							<code class="font-mono text-canvas-fg">x-el</code>.
							JSON Schema validators can ignore unknown extension keys, while DOM Studio
							adapters can read them to choose components, placeholders, option labels,
							inspector hints, and other UI-only details.
						</p>
						<p>
							Decoration can also come from adapter options when the data schema must stay
							completely clean. Both approaches should normalize to the same DOM Studio
							render definition.
						</p>
					</div>
					<CodeBlock lang="js" :code="decoratedJsonSchemaCode" />
				</div>
			</DocSection>

			<DocSection eyebrow="Relationship" title="Four layers">
				<div class="overflow-hidden rounded-2xl border border-border">
					<table class="w-full text-left text-sm">
						<thead class="bg-secondary text-xs uppercase tracking-wider text-muted-fg">
							<tr>
								<th class="px-4 py-2 font-medium">Layer</th>
								<th class="px-4 py-2 font-medium">Purpose</th>
								<th class="px-4 py-2 font-medium">Example</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							<tr v-for="row in relationships" :key="row.name">
								<td class="px-4 py-3 font-medium text-canvas-fg">{{ row.name }}</td>
								<td class="px-4 py-3 text-muted-fg">{{ row.description }}</td>
								<td class="px-4 py-3 font-mono text-[12.5px] text-muted-fg">{{ row.example }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</DocSection>

			<DocSection eyebrow="Direction" title="Generate either way">
				<div class="space-y-4 text-sm leading-6 text-muted-fg">
					<p>
						A database table is often enough to generate a useful first form: strings become
						text inputs, booleans become toggles, dates become date pickers, required columns
						become required fields. Product teams can then add richer UI context: labels,
						help text, grouping, conditional visibility, validation messages, and component
						choices that the raw database cannot know.
					</p>
					<p>
						The reverse should also work. A form builder can let someone pick front-end
						components, and each component can contribute a sensible storage default. That
						form definition can generate table metadata or migrations later.
					</p>
					<CodeBlock lang="js" :code="generatedFormCode" />
				</div>
			</DocSection>

			<DocSection eyebrow="Lifecycle" title="Transform at the boundary">
				<div class="space-y-4 text-sm leading-6 text-muted-fg">
					<p>
						Components should eventually know how their values travel through the system.
						The browser value, the submitted form value, and the database value are usually
						close, but they are not always identical. Keeping conversion functions near the
						field definition makes that lifecycle explicit.
					</p>
					<CodeBlock lang="js" :code="lifecycleCode" />
				</div>
			</DocSection>

			<DocSection eyebrow="Current scope" title="Frontend first">
				<div class="space-y-4 text-sm leading-6 text-muted-fg">
					<p>
						Right now, DOM Studio concentrates on the frontend contract:
						<code class="font-mono text-canvas-fg">DomForm</code>
						normalizes typed definitions into renderable children and stores user input in
						<code class="font-mono text-canvas-fg">v-model</code>.
					</p>
					<p>
						The next layer can add storage metadata without changing that core relationship.
						The form definition remains the master UI definition; JSON Schema can represent
						the portable data contract; the data remains the values; server adaptors can
						translate between the definition and real database tables when that part of the
						stack is ready.
					</p>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
