FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG PROJECT_PATH
WORKDIR /src
COPY . .
RUN --mount=type=cache,target=/root/.nuget/packages \
    for attempt in 1 2 3; do \
      dotnet restore "${PROJECT_PATH}" --disable-parallel && exit 0; \
      if [ "${attempt}" = "3" ]; then exit 1; fi; \
      echo "NuGet restore attempt ${attempt} failed; retrying in 5 seconds."; \
      sleep 5; \
    done
RUN --mount=type=cache,target=/root/.nuget/packages \
    dotnet publish "${PROJECT_PATH}" -c Release -o /app/publish /p:UseAppHost=false --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
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
