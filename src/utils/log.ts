import Logger from 'bunyan';

export function createLogger(name: string): Logger {
	return Logger.createLogger({
		name,
		level: 'info',
	});
}
