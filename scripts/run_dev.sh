#!/bin/bash

# Get directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Starting Smile Saviours Dental SaaS locally..."

# Step 1: Start PostgreSQL container
echo "Starting Postgres database container..."
docker compose up postgres -d
if [ $? -ne 0 ]; then
    echo "Error: Failed to start postgres container. Make sure Docker Desktop is running!"
    exit 1
fi

# Step 2 & 3: Run backend and frontend concurrently
echo "Starting backend and frontend dev servers..."
echo "Press Ctrl+C to stop all services."

# Trap Ctrl+C to terminate background processes
trap "kill 0" EXIT

# Start backend in background
cd "$DIR/../backend" && npm run start:dev &

# Start frontend in background
cd "$DIR/../frontend" && npm run dev &

# Keep script running
wait
