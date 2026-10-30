export async function up(knex) {
	const hasRenderedHtml = await knex.schema.hasColumn('blog_articles', 'rendered_html');
	if (hasRenderedHtml) {
		await knex.schema.alterTable('blog_articles', (table) => {
			table.dropColumn('rendered_html');
		});
	}
}

export async function down(knex) {
	const hasRenderedHtml = await knex.schema.hasColumn('blog_articles', 'rendered_html');
	if (!hasRenderedHtml) {
		await knex.schema.alterTable('blog_articles', (table) => {
			table.text('rendered_html', 'longtext');
		});
	}
}
