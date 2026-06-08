import knex from 'knex';
import config from '../../knexfile.js';

let db;

export function getDb() {
	if (!db) {
		db = knex(config);
	}

	return db;
}

export default getDb;
