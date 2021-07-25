import { config } from 'dotenv';
import morgan from 'morgan';
config();

import http from 'http';
import express from 'express';
import AirportDto from './storage/airport-dto';
import { createDatabase } from './utils/db';
import { createLogger } from './utils/log';
import routes from './routes';
import Logger from 'bunyan';

const router = express.Router();

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      myApp: MyApp
    }
  }
}

function createApp(myApp: MyApp) {
	const app = express();
	app.use(express.json());
	app.use(express.urlencoded({ extended: false }));
	app.use(morgan('combined'));

	app.use((req, _, next) => {
		req.myApp = myApp;
		next();
	});

	app.use('/', routes.install(router));

	app.get('/status', (req, res) => {
		res.send({
			name: 'shortest-airport-route',
			serviceStarted: (new Date()).toISOString(),
			memoryUsage: process.memoryUsage(),
			uptime: process.uptime(),
		});
	});


	// Next line is disabled because express middleware needs to
	// have 4 arguments.
	// eslint-disable-next-line no-unused-vars
	// app.use((err, req, res, next) => {
	// 	const { log, notifications } = req.myApp;
	// 	log.error(err, 'Internal server error');

	// 	// Internal errors are sent to the crew
	// 	notifications.createQueueNotification({
	// 		content: err.stack
	// 	}, {
	// 		email: 'info@turgoil.com',
	// 		title: 'Internal server error',
	// 	});
		
	// 	res.status(500).json({
	// 		status: 500,
	// 		type: 'https://turgoil.com/problems/internal-server-error',
	// 		detail: "Internal server error.",
	// 	});
	// });

	// const server = httpShutdown(http.createServer(app));

	// shutdown.addHandler('server', 20, (callback) => {
	// 	myApp.log.info('shutting down HTTP server');

	// 	server.shutdown((err) => {
	// 		if (err) {
	// 			myApp.log.error('error shutting down HTTP server', err);
	// 		}
	// 		callback();
	// 	});
	// });

	return http.createServer(app);
}

interface MyApp {
	airportDto: AirportDto;
	log: Logger,
}

function createMyApp(): MyApp {
	const log = createLogger('app');
	const db = createDatabase(log);

	return  {
		airportDto: new AirportDto({ db }),
		log,
	};
}

(() => {
	const myApp = createMyApp();
	const server = createApp(myApp);

	server.listen(process.env.PORT || 8080);

	server.on('listening', () => {
		const addr = server.address();
		const bind = typeof addr === 'string'
			? `pipe ${addr}`
			: `port ${addr.port}`;

		myApp.log.info(`Listening on ${bind}`);
	});

	server.on('error', (err) => {
		myApp.log.error(err, 'http server failed to start; shutting down');
	});
})();
