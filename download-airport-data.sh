#!/bin/bash

echo "Downloading airports from 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat'"

wget -NH -P ./docker/data https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat

echo "Downloading routes from 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat'"

wget -NH -P ./docker/data https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat
