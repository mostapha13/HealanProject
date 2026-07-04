FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base

EXPOSE 80
EXPOSE 443

# Update package lists and install necessary packages
RUN apt-get update && apt-get install -y libgdiplus

# Add contrib to sources list
RUN sed -i'.bak' 's/$/ contrib/' /etc/apt/sources.list
RUN apt-get update

# Install Microsoft fonts and fontconfig
RUN apt-get install -y ttf-mscorefonts-installer fontconfig

COPY bin/Release/net6.0/publish/tahoma.ttf /usr/share/fonts/truetype/tahoma.ttf
COPY bin/Release/net6.0/publish/tahomabd.ttf /usr/share/fonts/truetype/tahomabd.ttf

RUN fc-list :family | grep -i "tahoma"

ENV TZ=Asia/Tehran
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY bin/Release/net6.0/publish/ App/
WORKDIR /App




ENTRYPOINT ["dotnet", "CaptchaProvider.WebUI.dll"]