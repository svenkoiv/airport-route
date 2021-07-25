import { Router } from "express";
import airportRoute from './airport-route/index';

function install(router: Router): Router {
	airportRoute.install(router);
	return router;
}

export default {
	install,
}
