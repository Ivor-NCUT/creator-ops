#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
destination="${1:-backups/creator-ops-$(date -u +%Y%m%dT%H%M%SZ).dump}"
[ ! -e "$destination" ] || { echo "refusing to overwrite $destination" >&2; exit 1; }
mkdir -p "$(dirname "$destination")"
umask 077
pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-acl --file="$destination"
pg_restore --list "$destination" >/dev/null
echo "$destination"
