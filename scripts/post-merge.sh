#!/bin/bash
set -e

echo "Installing dependencies..."
pnpm install --frozen-lockfile --reporter=silent

echo "Pushing database schema..."
pnpm --filter @workspace/db run push
