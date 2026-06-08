export async function up(knex) {
	await knex.schema.createTable('blog_articles', (table) => {
		table.increments('id').primary();
		table.string('outrank_id', 191).unique();
		table.string('slug', 191).notNullable().unique();
		table.string('title', 255).notNullable();
		table.text('meta_description');
		table.text('image_url');
		table.text('content_markdown', 'longtext');
		table.text('content_html', 'longtext');
		table.json('tags');
		table.timestamp('source_created_at').nullable();
		table.timestamp('source_updated_at').nullable();
		table.timestamp('published_at').nullable();
		table.timestamp('webhook_received_at').notNullable().defaultTo(knex.fn.now());
		table.timestamps(true, true);
	});
}

export async function down(knex) {
	await knex.schema.dropTableIfExists('blog_articles');
}
