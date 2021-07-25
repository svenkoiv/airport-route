#!/bin/bash

echo "Downloading airports from 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat'"

wget -nH -P open-data https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat

echo "Downloading routes from 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat'"

wget -nH -P open-data https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat
