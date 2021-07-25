import { asyncMiddleware } from '../../utils/middleware';

export const getShortestAirportRoute = asyncMiddleware(async(req, res) => {
	const { airportDto } = req.myApp;

	const shortestRoutes = await airportDto.getShortestAirportRoute(1, 20);
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

