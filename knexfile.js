import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = envFirst(['DATABASE_URL']);

const baseConnection = databaseUrl
	? databaseUrl
	: {
		host: envFirst(['DB_HOST', 'DATABASE_HOST'], '127.0.0.1'),
		port: Number(envFirst(['DB_PORT', 'DATABASE_PORT'], 3306)),
		user: envFirst(['DB_USER', 'DATABASE_USER'], 'root'),
		password: envFirst(['DB_PASSWORD', 'DATABASE_PASSWORD']),
		database: envFirst(['DB_NAME', 'DATABASE_NAME'], 'getdom_studio'),
	};

export default {
	client: 'mysql2',
	connection: baseConnection,
	pool: {
		min: 0,
		max: 10,
	},
	migrations: {
		directory: './server/db/migrations',
		tableName: 'knex_migrations',
	},
};

/**
 * Reads the first present environment value from a list of supported aliases.
 *
 * @param {Array<string>} names Environment variable names in priority order.
 * @param {string | number} fallback Value to return when none of the names are set.
 * @returns {string | number} The first configured value or the fallback.
 */
function envFirst(names, fallback = '') {
	for (const name of names) {
		if (process.env[name] !== undefined) {
			return process.env[name];
		}
	}

	return fallback;
}
