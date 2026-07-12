#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
[ "$#" -eq 1 ] || { echo "usage: scripts/restore.sh backups/file.dump" >&2; exit 1; }
[ -r "$1" ] || { echo "backup is not readable: $1" >&2; exit 1; }
pg_restore --list "$1" >/dev/null
table_count="$(psql "$DATABASE_URL" -Atqc "select count(*) from pg_catalog.pg_tables where schemaname not in ('pg_catalog','information_schema')")"
[ "$table_count" = "0" ] || { echo "refusing to restore into a non-empty database ($table_count user tables)" >&2; exit 1; }
pg_restore --dbname="$DATABASE_URL" --no-owner --no-acl --exit-on-error "$1"
echo "restore complete"
