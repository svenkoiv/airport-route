import Logger from 'bunyan';
import { Pool, PoolClient, QueryResult } from 'pg';

interface DatabaseInterface {
	query: <R>(sql: string, params: string[]) => Promise<QueryResult<R>>;
}

interface DatabaseOptions {
	log: Logger;
	pool: Pool;
}

export function createDatabase(log: Logger): Database {
	const pool = new Pool({
		host: process.env.PGHOST || 'localhost',
		port: parseInt(process.env.PGPORT, 10) || 5432,
		database: process.env.PGDATABASE || 'travel',
		user: process.env.PGUSER,
		password: process.env.PGPASSWORD,
	});

	pool.on('error', (err) => {
		log.error('Unexpected error on idle client', err);
		process.exit(-1);
	})


	pool.query('SELECT NOW()', (err, res) => {
		log.info(err, res);
	});

	return new Database({ pool, log });
}

export default class Database implements DatabaseInterface {
	private pool: Pool;
	private log: Logger;

	constructor(opts: DatabaseOptions) {
		this.pool = opts.pool;
		this.log = opts.log;
	}

	async query<R>(sql: string, params: string[]): Promise<QueryResult<R>> {
		const client = await this.pool.connect()
		const start = Date.now();
		let res;

		try {
			res = await client.query(sql, params);
		} finally {
			client.release();
		}
		this.log.info(`Query: ${sql} - ${start - Date.now()} ms`);

		return res;
	}

	async getClient(): Promise<PoolClient> {
		return await this.pool.connect();
	}
}
