# Stage 1: Build .NET app
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY UPath.Api/UPath.Api.csproj UPath.Api/
RUN dotnet restore UPath.Api/UPath.Api.csproj

COPY UPath.Api/ UPath.Api/
RUN dotnet publish UPath.Api/UPath.Api.csproj -c Release -o /app/publish

# Stage 2: Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 4000
ENTRYPOINT ["dotnet", "UPath.Api.dll"]
