#!/bin/bash
URL=<YOUR_REST_API_ENDPOINT>
while true; do
  echo "$(date +%F_%H%M%S) - $(curl -s $URL)"
  sleep 5
done
