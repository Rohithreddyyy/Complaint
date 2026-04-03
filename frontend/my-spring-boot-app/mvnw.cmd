@echo off
rem Maven wrapper script for Windows

setlocal

set MAVEN_HOME=%~dp0\.mvn\wrapper
set MAVEN_VERSION=3.8.6

if not exist "%MAVEN_HOME%\maven-wrapper.jar" (
    echo "Maven wrapper jar not found. Please run 'mvn -N io.takari:maven:wrapper' to generate it."
    exit /b 1
)

java -cp "%MAVEN_HOME%\maven-wrapper.jar" org.apache.maven.wrapper.MavenWrapperMain %*

endlocal