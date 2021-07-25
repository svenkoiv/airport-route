import { Router } from "express";
import {
	getAirportRouteList,
	getShortestAirportRoute,
} from './handler';

function install(router: Router): Router {
	router.get('/airport-route',  getAirportRouteList);
	router.get('/airport-route/shortest',  getShortestAirportRoute);
	return router;
}

export default {
	install,
}
