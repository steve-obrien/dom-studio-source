/**
 * Separates paid licence evidence from optional accounts and adds one-use login tokens.
 *
 * @param {import('knex').Knex} knex Database migration connection.
 * @returns {Promise<void>}
 */
export async function up(knex) {
	await knex.schema.alterTable('stripe_checkout_sessions', (table) => {
		table.string('purchaser_email', 191).index();
		table.string('purchaser_name', 255);
		table.string('licence_reference', 64).unique();
		table.text('licence_terms');
		table.text('confirmation_text');
		table.string('terms_version', 32);
		table.text('receipt_url');
		table.timestamp('confirmation_sent_at').nullable();
	});
	await knex.schema.alterTable('users', (table) => {
		table.integer('session_version').unsigned().notNullable().defaultTo(0);
	});
	await knex.schema.createTable('email_sign_in_tokens', (table) => {
		table.string('token_hash', 64).primary();
		table.string('email', 191).notNullable().index();
		table.timestamp('expires_at').notNullable();
		table.timestamp('used_at').nullable();
		table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
	});
	await knex.schema.createTable('email_request_limits', (table) => {
		table.string('bucket', 64).primary();
		table.integer('attempts').unsigned().notNullable();
		table.timestamp('expires_at').notNullable().index();
	});
}

/**
 * Reverts the guest checkout schema; exported purchase evidence should be retained first.
 *
 * @param {import('knex').Knex} knex Database migration connection.
 * @returns {Promise<void>}
 */
export async function down(knex) {
	await knex.schema.dropTableIfExists('email_request_limits');
	await knex.schema.dropTableIfExists('email_sign_in_tokens');
	await knex.schema.alterTable('users', (table) => table.dropColumn('session_version'));
	await knex.schema.alterTable('stripe_checkout_sessions', (table) => {
		table.dropUnique(['licence_reference']);
		table.dropIndex(['purchaser_email']);
		table.dropColumns('purchaser_email', 'purchaser_name', 'licence_reference', 'licence_terms', 'confirmation_text', 'terms_version', 'receipt_url', 'confirmation_sent_at');
	});
}
