#!/usr/bin/env bash
# بازنویسی کامل همه appsettings.Production.json با رمز SQL یکسان
# استفاده:
#   export SQL_PASSWORD='aA@12345aA@12345'
#   bash docker/scripts/apply-server-appsettings.sh
# بعد:
#   docker compose up -d --force-recreate healan-webapi identity-server identity-grpc identity-usermanager captcha-webui filemanager-webui filemanager-grpc workflow-webui notification-webapp smsprovider-webapp

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PASS="${SQL_PASSWORD:?Set SQL_PASSWORD env var first}"

write_json() {
  local rel="$1"
  local file="$ROOT/$rel"
  mkdir -p "$(dirname "$file")"
  # stdin = json with __SQL_PASSWORD__ placeholder
  sed "s/__SQL_PASSWORD__/${PASS}/g" > "$file"
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
  "IdentityServer": {
    "Url": "http://identity-server:8080/",
    "ValidIssuer": "http://auth.drshahrooei.ir",
    "RequireHttpsMetadata": false
  },
  "ClientBaseUrl": "http://clinic.drshahrooei.ir,https://clinic.drshahrooei.ir,http://portal.drshahrooei.ir,https://portal.drshahrooei.ir,http://auth.drshahrooei.ir,https://auth.drshahrooei.ir",
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
  "IssuerUri": "http://auth.drshahrooei.ir",
  "CaptchaBaseUrl": "http://captcha-webui:8080/CaptchaProvider/api/v1/Captcha/",
  "SMSBaseUrl": "http://smsprovider-webapp:8080/api/v1/SMS/",
  "SMSSkipAuthToken": "true",
  "IdentityServer": {
    "BaseUrl": "http://auth.drshahrooei.ir",
    "HealanClinicUrl": "http://clinic.drshahrooei.ir/",
    "HealanRedirectUriCallback": "https://clinic.drshahrooei.ir/callback,http://clinic.drshahrooei.ir/callback,https://portal.drshahrooei.ir/callback,http://portal.drshahrooei.ir/callback",
    "HealanRedirectUriSilentRenew": "https://clinic.drshahrooei.ir/silentRenew.html,http://clinic.drshahrooei.ir/silentRenew.html,https://portal.drshahrooei.ir/silentRenew,http://portal.drshahrooei.ir/silentRenew",
    "HealanPostLogoutRedirectUri": "https://clinic.drshahrooei.ir/loggedout.html,http://clinic.drshahrooei.ir/loggedout.html,https://portal.drshahrooei.ir/loggedout.html,http://portal.drshahrooei.ir/loggedout.html",
    "AllowedCorsOrigins": "https://drshahrooei.ir,http://drshahrooei.ir,https://www.drshahrooei.ir,http://www.drshahrooei.ir,https://portal.drshahrooei.ir,http://portal.drshahrooei.ir,https://clinic.drshahrooei.ir,http://clinic.drshahrooei.ir,https://auth.drshahrooei.ir,http://auth.drshahrooei.ir"
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
    "ValidIssuer": "http://auth.drshahrooei.ir",
    "RequireHttpsMetadata": false
  },
  "GrpcServer": {
    "IdentityServer": "http://identity-grpc:8080",
    "FileManager": "http://filemanager-grpc:8080"
  },
  "ClientBaseUrl": "http://clinic.drshahrooei.ir,https://clinic.drshahrooei.ir,http://portal.drshahrooei.ir,https://portal.drshahrooei.ir,http://auth.drshahrooei.ir,https://auth.drshahrooei.ir,http://localhost:4200,http://localhost:4201",
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
  "UploadFileConfig": { "DirectoryPath": "Attachment" },
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
    "ValidIssuer": "http://auth.drshahrooei.ir",
    "RequireHttpsMetadata": false
  },
  "GrpcServer": {
    "IdentityServer": "http://identity-grpc:8080",
    "FileManager": "http://filemanager-grpc:8080"
  },
  "ClientBaseUrl": "http://clinic.drshahrooei.ir,https://clinic.drshahrooei.ir,http://portal.drshahrooei.ir,https://portal.drshahrooei.ir,http://auth.drshahrooei.ir,https://auth.drshahrooei.ir,http://localhost:4200,http://localhost:4201",
  "RabbitMQ": {
    "Enabled": true,
    "UserName": "guest",
    "Password": "guest",
    "HostName": "rabbitmq",
    "Port": 5672
  },
  "UploadFileConfig": { "DirectoryPath": "Attachment" },
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
    "ValidIssuer": "http://auth.drshahrooei.ir",
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
    "TemplateId": 0,
    "VerifyParameterName": "CODE",
    "PreferVerifyForOtp": true,
    "LogOnlyWhenUnconfigured": true
  },
  "RabbitMQ": {
    "UserName": "guest",
    "Password": "guest",
    "HostName": "rabbitmq",
    "Port": 5672
  }
}
EOF

echo ""
echo "Done. Verify healan-webapi:"
grep -E 'Database=|identity-grpc|identity-server' "$ROOT/docker/config/healan-webapi/appsettings.Production.json"
echo ""
echo "Next:"
echo "  cd $ROOT"
echo "  docker compose up -d --force-recreate healan-webapi identity-grpc identity-server identity-usermanager captcha-webui"
echo "  sleep 20 && curl -s http://127.0.0.1:6128/Healan/api/v1/AuthProbe"
