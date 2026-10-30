export async function up(knex) {
	await knex.schema.createTable('users', (table) => {
		table.string('id', 36).primary();
		table.string('email', 191).notNullable().unique();
		table.string('name', 191);
		table.text('password_hash');
		table.timestamp('email_verified_at').nullable();
		table.timestamp('paid_at').nullable();
		table.string('licence_type', 32);
		table.integer('failed_login_attempts').notNullable().defaultTo(0);
		table.timestamp('last_failed_login_at').nullable();
		table.timestamp('suspended_at').nullable();
		table.timestamps(true, true);
	});

	await knex.schema.createTable('auth_identities', (table) => {
		table.increments('id').primary();
		table.string('user_id', 36).notNullable();
		table.string('provider', 64).notNullable();
		table.string('provider_user_id', 191);
		table.string('email', 191);
		table.timestamps(true, true);
		table.foreign('user_id').references('users.id').onDelete('CASCADE');
		table.unique(['provider', 'provider_user_id']);
		table.unique(['user_id', 'provider']);
	});

	await knex.schema.createTable('entitlements', (table) => {
		table.increments('id').primary();
		table.string('user_id', 36).notNullable();
		table.string('key', 64).notNullable();
		table.string('provider', 64).notNullable().defaultTo('manual').comment('The provider of the entitlement. eg Stripe');
		table.timestamp('granted_at').notNullable().defaultTo(knex.fn.now());
		table.timestamp('expires_at').nullable();
		table.foreign('user_id').references('users.id').onDelete('CASCADE');
		table.unique(['user_id', 'key']);
	});

	await knex.schema.createTable('stripe_checkout_sessions', (table) => {
		table.increments('id').primary();
		table.string('user_id', 36);
		table.string('stripe_session_id', 191).notNullable().unique();
		table.string('stripe_customer_id', 191);
		table.string('client_reference_id', 191);
		table.string('licence_type', 32);
		table.string('payment_status', 64);
		table.string('mode', 64);
		table.integer('amount_total');
		table.string('currency', 16);
		table.string('raw_event_id', 191);
		table.timestamp('completed_at').nullable();
		table.timestamps(true, true);
		table.foreign('user_id').references('users.id').onDelete('SET NULL');
	});
}

export async function down(knex) {
	await knex.schema.dropTableIfExists('stripe_checkout_sessions');
	await knex.schema.dropTableIfExists('entitlements');
	await knex.schema.dropTableIfExists('auth_identities');
	await knex.schema.dropTableIfExists('users');
}
