#!/usr/bin/env bash
# بازنویسی کامل همه appsettings.Production.json با رمز SQL یکسان
# استفاده (ترجیحی — از .env پروژه می‌خواند):
#   bash docker/scripts/apply-server-appsettings.sh
# یا دستی:
#   export SQL_PASSWORD='...'
#   bash docker/scripts/apply-server-appsettings.sh
# بعد:
#   docker compose up -d --force-recreate filemanager-webui filemanager-grpc ...

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# Load /opt/healan/.env (or repo .env) without printing secrets.
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
  echo "loaded .env from $ROOT/.env"
else
  echo "WARN: $ROOT/.env not found — relying on exported env vars"
fi

# Prefer explicit SQL_PASSWORD; otherwise use MSSQL_SA_PASSWORD from .env (compose/sqlserver).
PASS="${SQL_PASSWORD:-${MSSQL_SA_PASSWORD:-}}"
if [[ -z "$PASS" ]]; then
  echo "ERROR: Set MSSQL_SA_PASSWORD in .env (or export SQL_PASSWORD)." >&2
  exit 1
fi
echo "using SQL password from ${SQL_PASSWORD:+SQL_PASSWORD}${SQL_PASSWORD:-MSSQL_SA_PASSWORD} (length=${#PASS})"

# URL-encode password for pyodbc connection URI
if command -v python3 >/dev/null 2>&1; then
  PASS_ENC="$(python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$PASS")"
elif command -v python >/dev/null 2>&1; then
  PASS_ENC="$(python -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$PASS")"
else
  PASS_ENC="$PASS"
  echo "WARN: python not found — SQL password not URL-encoded for python-rag .env"
fi

write_json() {
  local rel="$1"
  local file="$ROOT/$rel"
  mkdir -p "$(dirname "$file")"
  # Avoid sed — passwords often contain @ / & which break s/// substitution.
  if command -v python3 >/dev/null 2>&1; then
    python3 -c 'import sys; sys.stdout.write(sys.stdin.read().replace("__SQL_PASSWORD__", sys.argv[1]))' "$PASS" > "$file"
  elif command -v python >/dev/null 2>&1; then
    python -c 'import sys; sys.stdout.write(sys.stdin.read().replace("__SQL_PASSWORD__", sys.argv[1]))' "$PASS" > "$file"
  else
    # fallback: use | delimiter to survive / in password
    sed "s|__SQL_PASSWORD__|${PASS//|/\\|}|g" > "$file"
  fi
  echo "wrote $rel"
}

write_env() {
  local rel="$1"
  local file="$ROOT/$rel"
  mkdir -p "$(dirname "$file")"
  if command -v python3 >/dev/null 2>&1; then
    python3 -c 'import sys; sys.stdout.write(sys.stdin.read().replace("__SQL_PASSWORD_ENC__", sys.argv[1]))' "$PASS_ENC" > "$file"
  elif command -v python >/dev/null 2>&1; then
    python -c 'import sys; sys.stdout.write(sys.stdin.read().replace("__SQL_PASSWORD_ENC__", sys.argv[1]))' "$PASS_ENC" > "$file"
  else
    sed -e "s|__SQL_PASSWORD_ENC__|${PASS_ENC//|/\\|}|g" > "$file"
  fi
  echo "wrote $rel"
}

write_json docker/config/healan-webapi/appsettings.Production.json <<'EOF'
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=sqlserver,1433;Database=Healan;User Id=sa;Password=__SQL_PASSWORD__;TrustServerCertificate=True;"
  },
  "GrpcServer": {
    "IdentityServer": "http://identity-grpc:8080",
    "FileManager": "http://filemanager-grpc:8080"
  },
  "WorkFlowBaseUrl": "http://workflow-webui:8080/",
  "SMSProviderBaseUrl": "http://smsprovider-webapp:8080/api/v1/SMS/",
  "PortalAuth": {
    "SigningKey": "HealanPortalAuth-ProdKey-ChangeIfNeeded-64b!",
    "TokenHours": 24
  },
  "IdentityServer": {
    "Url": "http://identity-server:8080/",
    "ValidIssuer": "https://auth.drshahrooei.ir",
    "RequireHttpsMetadata": false
  },
  "ClientBaseUrl": "http://clinic.drshahrooei.ir,https://clinic.drshahrooei.ir,http://portal.drshahrooei.ir,https://portal.drshahrooei.ir,http://auth.drshahrooei.ir,https://auth.drshahrooei.ir,http://localhost:8081,http://127.0.0.1:8081,http://localhost:8082,http://127.0.0.1:8082",
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "Microsoft.AspNetCore.Authentication": "Information",
      "Share.Infrastructure.SecurityMiddlewares": "Information",
      "IdentityModel": "Information",
      "IdentityServer.GrpcClient": "Information"
    }
  },
  "Redis": {
    "Password": "",
    "Hosts": [ { "Host": "redis", "Port": "6379" } ],
    "KeyPrefix": "_Healan_"
  },
  "RabbitMQ": {
    "UserName": "guest",
    "Password": "guest",
    "HostName": "rabbitmq",
    "Port": 5672
  }
}
EOF

write_json docker/config/identity-server/appsettings.Production.json <<'EOF'
{
  "IsDevMode": true,
  "ConnectionStrings": {
    "DefaultConnection": "Server=sqlserver,1433;Database=Healan-Identity;User Id=sa;Password=__SQL_PASSWORD__;TrustServerCertificate=True;"
  },
  "GrpcServer": {
    "IdentityServer": "http://identity-grpc:8080"
  },
  "IssuerUri": "https://auth.drshahrooei.ir",
  "CaptchaBaseUrl": "http://captcha-webui:8080/CaptchaProvider/api/v1/Captcha/",
  "SMSBaseUrl": "http://smsprovider-webapp:8080/api/v1/SMS/",
  "SMSSkipAuthToken": "true",
  "IdentityServer": {
    "BaseUrl": "https://auth.drshahrooei.ir",
    "HealanClinicUrl": "https://clinic.drshahrooei.ir/",
    "HealanRedirectUriCallback": "https://clinic.drshahrooei.ir/callback,http://clinic.drshahrooei.ir/callback,https://portal.drshahrooei.ir/callback,http://portal.drshahrooei.ir/callback",
    "HealanRedirectUriSilentRenew": "https://clinic.drshahrooei.ir/silentRenew.html,http://clinic.drshahrooei.ir/silentRenew.html,https://portal.drshahrooei.ir/silentRenew,http://portal.drshahrooei.ir/silentRenew",
    "HealanPostLogoutRedirectUri": "https://www.drshahrooei.ir,https://www.drshahrooei.ir/,https://clinic.drshahrooei.ir/loggedout.html,http://clinic.drshahrooei.ir/loggedout.html,https://portal.drshahrooei.ir/loggedout.html,http://portal.drshahrooei.ir/loggedout.html",
    "HealanClinicMobileRedirectUriCallback": "healanclinic://redirect,exp://127.0.0.1:8081/--/redirect,exp://localhost:8081/--/redirect,exp://127.0.0.1:8082/--/redirect,exp://localhost:8082/--/redirect,http://localhost:8082,http://localhost:8082/,http://127.0.0.1:8082,http://127.0.0.1:8082/,http://localhost:8081,http://localhost:8081/,http://127.0.0.1:8081,http://127.0.0.1:8081/,https://clinic.drshahrooei.ir,https://clinic.drshahrooei.ir/,https://clinic.drshahrooei.ir/mobile,https://clinic.drshahrooei.ir/mobile/",
    "HealanClinicMobilePostLogoutRedirectUri": "healanclinic://redirect,http://localhost:8082,http://127.0.0.1:8082,https://clinic.drshahrooei.ir,https://clinic.drshahrooei.ir/,https://clinic.drshahrooei.ir/mobile,https://clinic.drshahrooei.ir/mobile/",
    "AllowedCorsOrigins": "https://drshahrooei.ir,http://drshahrooei.ir,https://www.drshahrooei.ir,http://www.drshahrooei.ir,https://portal.drshahrooei.ir,http://portal.drshahrooei.ir,https://clinic.drshahrooei.ir,http://clinic.drshahrooei.ir,https://auth.drshahrooei.ir,http://auth.drshahrooei.ir,http://localhost:8081,http://127.0.0.1:8081,http://localhost:8082,http://127.0.0.1:8082"
  },
  "RabbitMQ": {
    "UserName": "guest",
    "Password": "guest",
    "HostName": "rabbitmq",
    "Port": 5672
  },
  "Redis": {
    "Password": "",
    "Hosts": [ { "Host": "redis", "Port": "6379" } ],
    "KeyPrefix": "_HealanIdentity_"
  }
}
EOF

write_json docker/config/identity-grpc/appsettings.Production.json <<'EOF'
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=sqlserver,1433;Database=Healan-Identity;User Id=sa;Password=__SQL_PASSWORD__;TrustServerCertificate=True;"
  },
  "Kestrel": {
    "EndpointDefaults": { "Protocols": "Http2" }
  },
  "Redis": {
    "Password": "",
    "Hosts": [ { "Host": "redis", "Port": "6379" } ],
    "KeyPrefix": "_IdentityGrpc_"
  }
}
EOF

write_json docker/config/identity-usermanager/appsettings.Production.json <<'EOF'
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=sqlserver,1433;Database=Healan-Identity;User Id=sa;Password=__SQL_PASSWORD__;TrustServerCertificate=True;"
  },
  "IdentityServer": {
    "Url": "http://identity-server:8080/",
    "ValidIssuer": "https://auth.drshahrooei.ir",
    "RequireHttpsMetadata": false
  },
  "GrpcServer": {
    "IdentityServer": "http://identity-grpc:8080",
    "FileManager": "http://filemanager-grpc:8080"
  },
  "ClientBaseUrl": "http://clinic.drshahrooei.ir,https://clinic.drshahrooei.ir,http://portal.drshahrooei.ir,https://portal.drshahrooei.ir,http://auth.drshahrooei.ir,https://auth.drshahrooei.ir,http://localhost:4200,http://localhost:4201,http://localhost:8081,http://127.0.0.1:8081,http://localhost:8082,http://127.0.0.1:8082",
  "RabbitMQ": {
    "UserName": "guest",
    "Password": "guest",
    "HostName": "rabbitmq",
    "Port": 5672
  },
  "Redis": {
    "Password": "",
    "Hosts": [ { "Host": "redis", "Port": "6379" } ],
    "KeyPrefix": "_IdentityUserManager_"
  }
}
EOF

write_json docker/config/captcha-webui/appsettings.Production.json <<'EOF'
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=sqlserver,1433;Database=Healan-Captcha;User Id=sa;Password=__SQL_PASSWORD__;TrustServerCertificate=True;"
  },
  "CaptchaConfig": {
    "CaptchaFormat": "Number",
    "CaptchaNoise": "Low",
    "DigitNumber": 5,
    "ValidityDuration": 120
  }
}
EOF

write_json docker/config/filemanager-grpc/appsettings.Production.json <<'EOF'
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=sqlserver,1433;Database=Healan-Filemanager;User Id=sa;Password=__SQL_PASSWORD__;TrustServerCertificate=True;"
  },
  "Kestrel": {
    "EndpointDefaults": { "Protocols": "Http2" }
  },
  "UploadFileConfig": { "DirectoryPath": "/app/Attachment" },
  "Redis": {
    "Password": "",
    "Hosts": [ { "Host": "redis", "Port": "6379" } ],
    "KeyPrefix": "_FileManagerGrpc_"
  }
}
EOF

write_json docker/config/filemanager-webui/appsettings.Production.json <<'EOF'
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=sqlserver,1433;Database=Healan-Filemanager;User Id=sa;Password=__SQL_PASSWORD__;TrustServerCertificate=True;"
  },
  "ApiGateway": { "Url": "http://clinic.drshahrooei.ir" },
  "IdentityServer": {
    "Url": "http://identity-server:8080/",
    "ValidIssuer": "https://auth.drshahrooei.ir",
    "RequireHttpsMetadata": false
  },
  "GrpcServer": {
    "IdentityServer": "http://identity-grpc:8080",
    "FileManager": "http://filemanager-grpc:8080"
  },
  "ClientBaseUrl": "http://clinic.drshahrooei.ir,https://clinic.drshahrooei.ir,http://portal.drshahrooei.ir,https://portal.drshahrooei.ir,http://auth.drshahrooei.ir,https://auth.drshahrooei.ir,http://localhost:4200,http://localhost:4201,http://localhost:8081,http://127.0.0.1:8081,http://localhost:8082,http://127.0.0.1:8082",
  "RabbitMQ": {
    "Enabled": true,
    "UserName": "guest",
    "Password": "guest",
    "HostName": "rabbitmq",
    "Port": 5672
  },
  "UploadFileConfig": {
    "DirectoryPath": "/app/Attachment",
    "Profiles": [
      {
        "Extension": [ ".jpg", ".png", ".jpeg", ".bmp", ".webp", ".gif" ],
        "Type": "Image",
        "MaxSizeKB": 7000,
        "MinSizeKB": 0
      },
      {
        "Extension": [ ".txt", ".doc", ".docx", ".zip", ".rar" ],
        "Type": "Document",
        "MaxSizeKB": 25000,
        "MinSizeKB": 0
      },
      {
        "Extension": [ ".xls", ".xlsx" ],
        "Type": "Excel",
        "MaxSizeKB": 5000,
        "MinSizeKB": 0
      },
      {
        "Extension": [ ".pdf" ],
        "Type": "PDF",
        "MaxSizeKB": 5000,
        "MinSizeKB": 0
      }
    ]
  },
  "MarketMakerFileUrl": "http://localhost",
  "CheckAccess": "0",
  "Redis": {
    "Password": "",
    "Hosts": [ { "Host": "redis", "Port": "6379" } ],
    "KeyPrefix": "_FileManager_"
  }
}
EOF

write_json docker/config/workflow-webui/appsettings.Production.json <<'EOF'
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=sqlserver,1433;Database=Healan-Workflow;User Id=sa;Password=__SQL_PASSWORD__;TrustServerCertificate=True;"
  },
  "FileManagerBaseUrl": "http://filemanager-webui:8080/File",
  "IdentityServer": {
    "Url": "http://identity-server:8080/",
    "ValidIssuer": "https://auth.drshahrooei.ir",
    "RequireHttpsMetadata": false
  },
  "GrpcServer": {
    "IdentityServer": "http://identity-grpc:8080",
    "FileManager": "http://filemanager-grpc:8080"
  },
  "ClientBaseUrl": "http://clinic.drshahrooei.ir,https://clinic.drshahrooei.ir",
  "RabbitMQ": {
    "UserName": "guest",
    "Password": "guest",
    "HostName": "rabbitmq",
    "Port": 5672
  },
  "Redis": {
    "Password": "",
    "Hosts": [ { "Host": "redis", "Port": "6379" } ],
    "KeyPrefix": "_WorkFlow_"
  }
}
EOF

write_json docker/config/notification-webapp/appsettings.Production.json <<'EOF'
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=sqlserver,1433;Database=Healan-Notification;User Id=sa;Password=__SQL_PASSWORD__;TrustServerCertificate=True;"
  },
  "RabbitMQ": {
    "UserName": "guest",
    "Password": "guest",
    "HostName": "rabbitmq",
    "Port": 5672
  }
}
EOF

write_json docker/config/smsprovider-webapp/appsettings.Production.json <<'EOF'
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=sqlserver,1433;Database=Healan-SMSProvider;User Id=sa;Password=__SQL_PASSWORD__;TrustServerCertificate=True;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "SmsIr": {
    "ApiKey": "w6kRP51S1acR5qRGvC4ojJfzIArb6Aaq0cKOn05zv7L36pLt",
    "BaseUrl": "https://api.sms.ir/v1/",
    "LineNumber": 0,
    "TemplateId": 640023,
    "VerifyParameterName": "Code",
    "PreferVerifyForOtp": true,
    "LogOnlyWhenUnconfigured": false
  },
  "RabbitMQ": {
    "UserName": "guest",
    "Password": "guest",
    "HostName": "rabbitmq",
    "Port": 5672
  }
}
EOF

write_env docker/config/python/rag.env <<'EOF'
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini

HOST=0.0.0.0
PORT=8000
DEBUG=false

EMBEDDING_MODEL=heydariAI/persian-embeddings
CHROMA_PERSIST_DIR=/data/chroma
CHROMA_COLLECTION=healan_rag

DATA_SOURCE=sqlserver
SQL_SERVER_USE_HEALAN_BUNDLE=true
SQL_SERVER_CONNECTION_STRING=mssql+pyodbc://sa:__SQL_PASSWORD_ENC__@sqlserver:1433/Healan?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes

RAG_AUTO_INGEST=true
RAG_TOP_K=5
RAG_ANSWER_MODE=direct
RAG_SIMILARITY_THRESHOLD=0.55
RAG_SYNC_ENABLED=true
RAG_SYNC_INTERVAL_MINUTES=10
EOF

echo ""
echo "Done. Verify healan-webapi:"
grep -E 'Database=|identity-grpc|identity-server' "$ROOT/docker/config/healan-webapi/appsettings.Production.json"
echo ""
echo "Next:"
echo "  cd $ROOT"
echo "  docker compose build python-rag healan-webapi"
echo "  docker compose up -d --no-deps --force-recreate python-rag healan-webapi"
echo "  sleep 30 && curl -s http://127.0.0.1:8000/health"
echo "  sleep 20 && curl -s http://127.0.0.1:6128/Healan/api/v1/AuthProbe"
