# Use the official .NET image as a build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the project file and restore dependencies
COPY ["SGA.csproj", "./"]
RUN dotnet restore "SGA.csproj"

# Copy the rest of the source code
COPY . .

# Build the application
RUN dotnet build "SGA.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "SGA.csproj" -c Release -o /app/publish

# Use the official .NET runtime image for the final stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SGA.dll"]
