import Database from "../utils/db";

interface AirportDtoInterface {
	getAirportRouteList: () => Promise<AirportRoute[]>;
	getShortestAirportRoute: (fromId: number, toId: number) => Promise<AirportRoute[]>;
}

export interface AirportRoute {
	from: string;
	to: string;
	distance: string;
}

interface AirportDtoOptions {
	db: Database;
}

export default class AirportDto implements AirportDtoInterface {
	private db: Database;

	/**
	 * @param {Database} db
	 * @param {Object} log - a Bunyan-compatible logger object
	 */
	constructor(opts: AirportDtoOptions) {
		this.db = opts.db;
	}

	async getAirportRouteList(): Promise<AirportRoute[]> {
		interface R {
			source: string,
			destination: string,
			distance: number,
		}
		const res = await this.db.query<R>(`
			SELECT
				source,
				destination,
				distance
			FROM
				airport_route
		`, []);

		return res.rows.map((row: R) => ({
			from: row.source,
			to: row.destination,
			distance: String(row.distance),
		}));
	}

	async getShortestAirportRoute(fromId: number, toId: number): Promise<AirportRoute[]> {
		const client = await this.db.getClient();

		let shortestPathRes;
		let airportIdentifiersRes;
		try {
			const breadthFirstSearchRes = await client.query(`
				SELECT DISTINCT node FROM pgr_breadthFirstSearch(
					'SELECT
						airport_route.id AS id,
						airport_route.source_id AS source,
						airport_route.destination_id AS target,
						airport_route.distance AS cost
					FROM
						airport_route', ${fromId}, 3, TRUE);
			`);
			const nodes = breadthFirstSearchRes.rows.map((row) => parseInt(row.node, 10));
			nodes.push(toId);
			const nodesIn = nodes.join(',');

			shortestPathRes = await client.query(`
				SELECT * FROM pgr_dijkstra(
					'SELECT
						airport_route.id AS id,
						airport_route.source_id AS source,
						airport_route.destination_id AS target,
						airport_route.distance AS cost
					FROM
						airport_route
					WHERE 
						airport_route.destination_id IN (${nodesIn})
						OR airport_route.source_id IN (${nodesIn})', ${fromId}, ${toId}, TRUE
				) ORDER BY seq;
			`);

			airportIdentifiersRes = await client.query(`
				SELECT
					id,
					COALESCE(iata, icao) AS identifier
				FROM
					airport
				WHERE 
					id IN (${shortestPathRes.rows.map((row) => row.node).join(',')})
			`);
		} finally {
			client.release();
		}

		const aa = [];
		for (let i = 0; i < shortestPathRes.rows.length - 1; i++) {
			const path = shortestPathRes.rows[i];
			const nextPath = shortestPathRes.rows[i + 1];

			const pathIdentifier = airportIdentifiersRes.rows.find((airportIdentifierRow) => {
				return String(airportIdentifierRow.id) === String(path.node);
			});
			const nextPathIdentifier = airportIdentifiersRes.rows.find((airportIdentifierRow) => {
				return String(airportIdentifierRow.id) === String(nextPath.node);
			});

			aa.push({
				from: pathIdentifier.identifier,
				to: nextPathIdentifier.identifier,
				distance: path.cost,
			})
		}

		return aa;
	}
}
