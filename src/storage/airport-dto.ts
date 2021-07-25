import Logger from "bunyan";
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
	log: Logger;
}

export default class AirportDto implements AirportDtoInterface {
	private db: Database;
	private log: Logger;

	/**
	 * @param {Database} db
	 * @param {Object} log - a Bunyan-compatible logger object
	 */
	constructor(opts: AirportDtoOptions) {
		this.db = opts.db;
		this.log = opts.log;
	}

	async getFromToByIataOrIcao(from: string, to: string): Promise<
		{ fromId: number, toId: number } | undefined
	> {
		interface R {
			from_id: number,
			to_id: number,
		}
		const res = await this.db.query<R>(`
			SELECT
				fromAirport.id AS from_id,
				toAirport.id AS to_id
			FROM
				airport AS fromAirport,
				airport AS toAirport
			WHERE
				(toAirport.iata = $2 OR toAirport.icao = $2)
				AND (fromAirport.iata = $1 OR fromAirport.icao = $1)
		`, [from, to]);

		if (!res.rows.length) {
			return undefined;
		}

		return {
			fromId: res.rows[0].from_id,
			toId: res.rows[0].to_id,
		};
	}

	async getAirportRouteList(): Promise<AirportRoute[]> {
		interface R {
			source: string,
			destination: string,
			distance: number,
		}
		const res = await this.db.query<R>(`
			SELECT
				COALESCE(sourceAirport.iata, sourceAirport.icao) AS source,
				COALESCE(destinationAirport.iata, destinationAirport.icao) AS destination,
				distance
			FROM
				airport_route
			LEFT JOIN
				airport as destinationAirport ON destinationAirport.id = destination_id
			LEFT JOIN
				airport as sourceAirport ON sourceAirport.id = source_id
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


			if (!shortestPathRes.rows.length) {
				this.log.info(`Shortest path not found for ${fromId} to ${toId}`);
				return [];
			}

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
