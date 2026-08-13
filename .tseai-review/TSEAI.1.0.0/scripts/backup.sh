#!/usr/bin/env bash
set -euo pipefail
: "${MSSQL_SA_PASSWORD:?MSSQL_SA_PASSWORD required}"
STAMP=$(date -u +%Y%m%dT%H%M%SZ); DIR=${BACKUP_DIR:-./backups/$STAMP}; mkdir -p "$DIR"
docker exec tseai-sqlserver /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "BACKUP DATABASE [TSEAI_App] TO DISK='/var/opt/mssql/backup/TSEAI_App_$STAMP.bak' WITH COPY_ONLY, COMPRESSION, CHECKSUM"
docker exec tseai-sqlserver /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "BACKUP DATABASE [TSEAI_Identity] TO DISK='/var/opt/mssql/backup/TSEAI_Identity_$STAMP.bak' WITH COPY_ONLY, COMPRESSION, CHECKSUM"
echo "SQL backups created in SQL backup volume. Copy/encrypt them off-host and snapshot Qdrant persistent storage."
