/**
 * Repairs installations that ran the auth foundation before licence_type was
 * added to that already-applied migration. Fresh databases retain their columns
 * and existing licence values; interrupted upgrades can safely run again.
 *
 * @param {import('knex').Knex} knex Database migration connection.
 * @returns {Promise<void>}
 */
export async function up(knex) {
	for (const name of ['users', 'stripe_checkout_sessions']) {
		if (!await knex.schema.hasColumn(name, 'licence_type')) {
			await knex.schema.alterTable(name, (table) => {
				table.string('licence_type', 32).nullable();
			});
		}
	}
}

/**
 * Retains billing evidence on rollback. These columns also belong to the auth
 * foundation, so removing them would break fresh installations and erase data.
 *
 * @returns {Promise<void>}
 */
export async function down() {}
