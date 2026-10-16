FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# Copy trực tiếp file jar đã build sẵn ở local vào
COPY target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx300m", "-jar", "app.jar"]