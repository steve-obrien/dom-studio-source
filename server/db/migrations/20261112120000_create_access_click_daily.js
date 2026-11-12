/**
 * Creates anonymous daily counters without individual events or visitor identifiers.
 *
 * @param {import('knex').Knex} knex Migration database connection.
 * @returns {Promise<void>} Resolves after the aggregate table is created.
 */
export async function up(knex) {
	await knex.schema.createTable('access_click_daily', defineCounters);
}

/**
 * Defines a bounded set of dimensions and an atomic counter for each UTC day.
 *
 * @param {import('knex').Knex.CreateTableBuilder} table Aggregate table builder.
 * @returns {void}
 */
function defineCounters(table) {
	table.string('day', 10).notNullable();
	table.string('placement', 16).notNullable();
	table.string('section', 24).notNullable();
	table.string('device', 16).notNullable();
	table.string('browser', 16).notNullable();
	table.string('signal', 16).notNullable();
	table.bigInteger('clicks').unsigned().notNullable().defaultTo(0);
	table.primary(['day', 'placement', 'section', 'device', 'browser', 'signal']);
}

/**
 * Removes the counters when explicitly rolling back this migration.
 *
 * @param {import('knex').Knex} knex Migration database connection.
 * @returns {Promise<void>} Resolves after the table is removed.
 */
export async function down(knex) {
	await knex.schema.dropTableIfExists('access_click_daily');
}
