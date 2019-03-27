#!/bin/bash

docker-compose -f ./docker/docker-compose.yml down
docker-compose -f ./docker/docker-compose.yml up -d

./node_modules/cucumber/bin/cucumber-js

docker-compose -f ./docker/docker-compose.yml down
