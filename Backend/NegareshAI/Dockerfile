FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY Backend/NegareshAI/src/NegareshAI.Api/NegareshAI.Api.csproj Backend/NegareshAI/src/NegareshAI.Api/
RUN dotnet restore Backend/NegareshAI/src/NegareshAI.Api/NegareshAI.Api.csproj
COPY Backend/NegareshAI/ Backend/NegareshAI/
RUN dotnet publish Backend/NegareshAI/src/NegareshAI.Api/NegareshAI.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=10 \
  CMD curl --fail --silent http://127.0.0.1:8080/health >/dev/null || exit 1
ENTRYPOINT ["dotnet", "NegareshAI.Api.dll"]
