FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY Backend/NegareshAI/src/NegareshAI.Api/NegareshAI.Api.csproj Backend/NegareshAI/src/NegareshAI.Api/
RUN dotnet restore Backend/NegareshAI/src/NegareshAI.Api/NegareshAI.Api.csproj
COPY Backend/NegareshAI/ Backend/NegareshAI/
RUN dotnet publish Backend/NegareshAI/src/NegareshAI.Api/NegareshAI.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "NegareshAI.Api.dll"]
