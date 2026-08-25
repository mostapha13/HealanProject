# syntax=docker/dockerfile:1.7
FROM mcr.microsoft.com/dotnet/sdk:9.0.316 AS build
ARG PROJECT_PATH
WORKDIR /src
COPY . .
RUN --mount=type=cache,id=healan-nuget-packages,target=/root/.nuget/packages \
    dotnet restore "${PROJECT_PATH}" --disable-parallel
RUN --mount=type=cache,id=healan-nuget-packages,target=/root/.nuget/packages \
    dotnet publish "${PROJECT_PATH}" --no-restore -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0.18 AS runtime
ARG DLL_NAME
ENV APP_DLL=${DLL_NAME}
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_RUNNING_IN_CONTAINER=true
ENV TZ=Asia/Tehran
RUN ln -snf /usr/share/zoneinfo/${TZ} /etc/localtime && echo ${TZ} > /etc/timezone \
    && apt-get update \
    && apt-get install -y --no-install-recommends fontconfig fonts-liberation fonts-dejavu-core \
    && fc-cache -f \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "dotnet ${APP_DLL}"]
