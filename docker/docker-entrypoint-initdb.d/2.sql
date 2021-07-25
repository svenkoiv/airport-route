\connect airport;

UPDATE airport.airport_route
SET distance = (
	SELECT
		point(source_airport.longitude, source_airport.latitude)
		<@>
		point(destination_airport.longitude, destination_airport.latitude)
	FROM
		airport.airport AS source_airport,
		airport.airport AS destination_airport
	WHERE
		airport_route.source_id = source_airport.id AND
		airport_route.destination_id = destination_airport.id
)::NUMERIC * 1.609344 WHERE TRUE;

DELETE FROM airport.airport_route WHERE distance IS NULL;
