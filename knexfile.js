import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || '';

const baseConnection = databaseUrl
	? databaseUrl
	: {
		host: process.env.DB_HOST || '127.0.0.1',
		port: Number(process.env.DB_PORT || 3306),
		user: process.env.DB_USER || 'root',
		password: process.env.DB_PASSWORD || '',
		database: process.env.DB_NAME || 'getdom_studio',
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
