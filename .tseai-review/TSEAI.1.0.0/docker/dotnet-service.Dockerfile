FROM mcr.microsoft.com/dotnet/sdk:9.0.316 AS build
ARG PROJECT_PATH
WORKDIR /src
COPY . .
RUN --mount=type=cache,id=tseai-nuget-v2,target=/root/.nuget/packages,sharing=locked dotnet restore "${PROJECT_PATH}" --locked-mode
RUN --mount=type=cache,id=tseai-nuget-v2,target=/root/.nuget/packages,sharing=locked dotnet restore docker/healthcheck/TSEAI.HealthCheck.csproj --locked-mode
RUN --mount=type=cache,id=tseai-nuget-v2,target=/root/.nuget/packages,sharing=locked dotnet publish "${PROJECT_PATH}" -c Release -o /app/publish /p:UseAppHost=false --no-restore
RUN --mount=type=cache,id=tseai-nuget-v2,target=/root/.nuget/packages,sharing=locked dotnet publish docker/healthcheck/TSEAI.HealthCheck.csproj -c Release -o /app/healthcheck /p:UseAppHost=false --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0.18 AS runtime
ARG DLL_NAME
ENV APP_DLL=${DLL_NAME}
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_RUNNING_IN_CONTAINER=true
ENV TZ=Asia/Tehran
WORKDIR /app
COPY --from=build /app/publish .
COPY --from=build /app/healthcheck /healthcheck
EXPOSE 8080
USER app
ENTRYPOINT ["sh", "-c", "exec dotnet \"$APP_DLL\""]
