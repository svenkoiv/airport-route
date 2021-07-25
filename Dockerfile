FROM postgres:11

RUN apt-get update
RUN apt-get -y install postgresql-11-pgrouting
