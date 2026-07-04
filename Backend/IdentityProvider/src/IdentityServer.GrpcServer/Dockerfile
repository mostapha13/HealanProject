FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base

EXPOSE 8080


ENV TZ=Asia/Tehran
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

 COPY bin/Release/net9.0/publish/ App/
 WORKDIR /App

ENTRYPOINT ["dotnet", "IdentityServer.GrpcServer.dll"]