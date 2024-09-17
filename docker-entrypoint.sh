#!/bin/bash

chown -R 1000:1000 /app

gosu node pnpm start
