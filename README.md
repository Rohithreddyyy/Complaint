# Complaint Management System

A full-stack application for managing and tracking complaints, featuring an AI-powered assistant and real-time updates.

## Features

- AI-powered complaint categorization and sentiment analysis.
- Real-time notifications and chat support.
- User authentication and role-based access control.
- Dashboard for analytics and tracking.

## Prerequisites

- Java 17 or higher
- Node.js (v18 or higher)
- Maven
- MySQL (or access to a running instance)

## Getting Started

### Backend (Spring Boot)

1.  Navigate to the root directory.
2.  Update `src/main/resources/application.properties` with your database credentials and API keys (e.g., Google AI API key for the chatbot).
3.  Run the following command to start the backend:

    ```bash
    ./mvnw spring-boot:run
    ```

    The backend will start at `http://localhost:8080`.

### Frontend (React + Vite)

1.  Navigate to the `frontend` directory:

    ```bash
    cd frontend
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Start the development server:

    ```bash
    npm run dev
    ```

    The frontend will be available at `http://localhost:5173`.

## Technologies Used

- **Backend**: Spring Boot, Spring Security, Spring Boot Data JPA, MySQL.
- **Frontend**: React, Vite, Recharts, Three.js, Lucide Icons, STOMP.js.
- **AI Integration**: Google Gemini API for AI-powered chat and analytics.

---
Created by [Rohith Reddy](https://github.com/Rohithreddyyy)
