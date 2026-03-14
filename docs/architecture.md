# System Architecture

## Overview

DevTask is a microservices-based task management platform built to demonstrate:

- Microservices architecture
- API Gateway pattern
- Event-driven design with Apache Kafka
- Containerisation with Docker
- Kubernetes orchestration
- Helm chart packaging

```
┌────────────┐        HTTP          ┌────────────────┐
│  Browser   │ ──────────────────▶  │  API Gateway   │  :3000
└────────────┘                      └───────┬────────┘
                                            │ routes requests
               ┌────────────────────────────┼──────────────────────┐
               ▼                            ▼                      ▼
      ┌─────────────────┐       ┌──────────────────┐   ┌───────────────────────┐
      │  Auth Service   │       │  Task Service    │   │ Notification Service  │
      │     :3001       │       │     :3002        │   │       :3003           │
      └────────┬────────┘       └────────┬─────────┘   └──────────┬────────────┘
               │                         │                         │
               ▼                         ▼ Kafka producer          ▼ Kafka consumer
          ┌─────────┐              ┌──────────┐              ┌──────────┐
          │  MySQL  │              │  MySQL   │              │  MySQL   │
          │ (users) │              │ (tasks)  │              │ (notifs) │
          └─────────┘              └──────────┘              └──────────┘
                                         │                         ▲
                                         └────── Kafka ────────────┘
                                               task-events topic
```

## Services

| Service              | Port | Responsibility                            |
|----------------------|------|-------------------------------------------|
| API Gateway          | 3000 | Route, CORS, single entry point           |
| Auth Service         | 3001 | Registration, login, JWT issuance         |
| Task Service         | 3002 | Task CRUD, Kafka producer                 |
| Notification Service | 3003 | Kafka consumer, notification storage      |
| Frontend             | 5173 | React SPA (Nginx in Docker/K8s)           |

## Data Flow

1. **User registers / logs in** via `POST /auth/register` or `POST /auth/login`
   - Auth Service stores the user in MySQL and returns a JWT
2. **User creates a task** via `POST /tasks` with JWT header
   - Task Service stores the task in MySQL
   - Task Service publishes a `TASK_CREATED` event to the `task-events` Kafka topic
3. **Notification Service** consumes the Kafka event
   - Persists a human-readable notification in MySQL
4. **User reads notifications** via `GET /notifications`

## Technology Stack

| Layer        | Technology                                     |
|--------------|------------------------------------------------|
| Frontend     | React 18 + Vite                                |
| Backend      | Node.js 20 + Express 4                         |
| Database     | MySQL 8.0                                      |
| Cache        | Redis 7                                        |
| Messaging    | Apache Kafka 7.5 (via Confluent images)        |
| Container    | Docker, Docker Compose                         |
| Orchestration| Kubernetes, Helm                               |
| CI/CD        | GitHub Actions                                 |
