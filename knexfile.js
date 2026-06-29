import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || '';

const baseConnection = databaseUrl
	? databaseUrl
	: {
		host: process.env.DATABASE_HOST || '127.0.0.1',
		port: Number(process.env.DATABASE_PORT || 3306),
		user: process.env.DATABASE_USER || 'root',
		password: process.env.DATABASE_PASSWORD || '',
		database: process.env.DATABASE_NAME || 'getdom_studio',
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
