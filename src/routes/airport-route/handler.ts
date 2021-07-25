import type { Request } from 'express'
import { asyncMiddleware } from '../../utils/middleware';

export const getShortestAirportRoute = asyncMiddleware(async(
	req: Request<any, any, any, { from?: string, to?: string }>, res,
) => {
	const { airportDto } = req.myApp;
	const { from, to } = req.query;
	if (!from || !to) {
		res.status(422).send({
			message: `Invalid query parameters ?from=${from}&to=${to}`
		});
	}

	const fromTo = await airportDto.getFromToByIataOrIcao(req.query.from, req.query.to);
	if (!fromTo) {
		res.status(404).send({
			message: `No airport entry for ${from} or ${to}`
		});
	}

	const shortestRoutes = await airportDto.getShortestAirportRoute(fromTo.fromId, fromTo.toId);
	let totalDistance = 0;
	shortestRoutes.forEach((route) => {
		totalDistance += parseInt(route.distance, 10);
	})

	res.status(200).send({
		routes: shortestRoutes,
		totalDistance,
	});
});

export const getAirportRouteList = asyncMiddleware(async(req, res) => {
	const { airportDto } = req.myApp;

	const routes = await airportDto.getAirportRouteList();

	res.status(200).send({
		routes,
	});
});

