# --- STAGE 1: Build the application ---
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# --- STAGE 2: Run the application ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/complaint-0.0.1-SNAPSHOT.jar app.jar

# Explicitly expose the port from application.properties
EXPOSE 8081

# Run with environment variables placeholders
ENTRYPOINT ["java", "-jar", "app.jar"]
