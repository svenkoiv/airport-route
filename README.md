# Shortest airport route
Finds shortest route from airport A to airport B.

## Getting started
1. Setup database. Write following command in project root directory - `docker-compose up`
2. Create application configuration. Write following command in project root directory - `cp .env-example .env`
3. Install dependencies (node v12.22.1). Write following command in project root directory - `npm i`
4. Start application - `npm start`

## How shortest airport route is calculated?
1. Database is initalized with data from jpatokal/openflights
2. After data is stored and tidied, airport_route table will have all the possible distances calculated. Postgres 'earthdistance', 'cube' extension is used for this.
3. Then 'pgr_breadthFirstSearch' is used to find nodes for 'pgr_dijkstra'. BFS is done because hop count is limited to 4, so it finds all the nodes (depth 3).

## Testing
### List of possible routes
curl -X GET 'http://localhost:3000/airport-route'

### Some shortest path examples
curl -X GET 'http://localhost:3000/airport-route/shortest?from=HEL&to=TLL'
curl -X GET 'http://localhost:3000/airport-route/shortest?from=HEL&to=RIX'
curl -X GET 'http://localhost:3000/airport-route/shortest?from=HEL&to=RIX'
curl -X GET 'http://localhost:3000/airport-route/shortest?from=HEL&to=WAW'
curl -X GET 'http://localhost:3000/airport-route/shortest?from=TLL&to=SYD'
