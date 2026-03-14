# DevTask – Microservice Task Manager

A **production-style** task management platform built to learn:

- 🏗️ Microservices architecture
- 🐳 Docker & Docker Compose
- ☸️ Kubernetes (Minikube / Kind)
- 📨 Event-driven systems with Apache Kafka
- ⚛️ React frontend
- 🔐 JWT authentication

---

## Architecture at a Glance

```
Browser → Frontend (React/Nginx)
              ↓
         API Gateway :3000
         /          |          \
  Auth Svc :3001  Task Svc :3002  Notification Svc :3003
       |               |                    |
     MySQL           MySQL + Kafka      MySQL + Kafka
                     (producer)         (consumer)
```

See [docs/architecture.md](docs/architecture.md) for the full diagram.

---

## Project Structure

```
.
├── docker-compose.yml            # Full stack (local dev)
├── .env.example                  # Environment variable template
├── frontend/                     # React + Vite SPA
├── services/
│   ├── api-gateway/              # Express reverse-proxy
│   ├── auth-service/             # JWT auth (register/login/profile)
│   ├── task-service/             # Task CRUD + Kafka producer
│   └── notification-service/    # Kafka consumer + notifications API
├── shared/
│   ├── configs/                  # Shared configuration helper
│   ├── kafka/                    # Reusable producer & consumer wrappers
│   └── utils/                    # Structured logger
├── infra/
│   ├── docker/mysql/init.sql     # DB schema seed
│   ├── kubernetes/               # K8s Deployments, Services, Ingress
│   └── helm/devtask/             # Helm chart
├── docs/                         # Guides and reference docs
└── .github/workflows/ci-cd.yml  # GitHub Actions CI/CD
```

---

## Quick Start (Docker Compose)

**Requirements:** Docker ≥ 24 with Compose v2

```bash
# 1. Clone
git clone https://github.com/lasithahemajith/Task-Management---Microservices.git
cd Task-Management---Microservices

# 2. (Optional) customise env
cp .env.example .env

# 3. Start everything
docker compose up --build
```

After ~60 seconds:

| URL                         | Service        |
|-----------------------------|----------------|
| http://localhost:5173       | Frontend       |
| http://localhost:3000       | API Gateway    |
| http://localhost:3000/health| Gateway health |

---

## API Endpoints

All requests go through the API Gateway on **port 3000**.

| Method | Path                  | Auth | Description          |
|--------|-----------------------|------|----------------------|
| POST   | /auth/register        | ✗    | Create account       |
| POST   | /auth/login           | ✗    | Get JWT token        |
| GET    | /auth/profile         | ✔    | Get current user     |
| POST   | /tasks                | ✔    | Create task          |
| GET    | /tasks                | ✔    | List my tasks        |
| GET    | /tasks/:id            | ✔    | Get task             |
| PUT    | /tasks/:id            | ✔    | Update task          |
| DELETE | /tasks/:id            | ✔    | Delete task          |
| GET    | /notifications        | ✔    | List notifications   |

Full reference: [docs/api-reference.md](docs/api-reference.md)

---

## Kafka Events

The Task Service publishes events to the `task-events` topic:

| Event           | Trigger                             |
|-----------------|-------------------------------------|
| TASK_CREATED    | New task created                    |
| TASK_UPDATED    | Task updated (not completed)        |
| TASK_COMPLETED  | Task status set to `completed`      |

The Notification Service consumes these events and stores notifications in MySQL.

See [docs/kafka-events.md](docs/kafka-events.md) for details.

---

## Kubernetes Deployment

```bash
# Apply all manifests
kubectl apply -f infra/kubernetes/

# Or with Helm
helm install devtask ./infra/helm/devtask --namespace devtask --create-namespace
```

Full guide: [docs/kubernetes-guide.md](docs/kubernetes-guide.md)

---

## CI/CD

GitHub Actions workflow (`.github/workflows/ci-cd.yml`) automatically:

1. Lints and validates all services on every push / PR
2. Builds and pushes Docker images to DockerHub
3. Deploys to Kubernetes on pushes to `main`

Required GitHub Secrets:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `KUBECONFIG` (base64-encoded kubeconfig)

---

## Documentation

| Document                                      | Description                    |
|-----------------------------------------------|--------------------------------|
| [docs/architecture.md](docs/architecture.md)  | System design & diagrams       |
| [docs/docker-guide.md](docs/docker-guide.md)  | Docker Compose usage           |
| [docs/kubernetes-guide.md](docs/kubernetes-guide.md) | K8s & Helm deployment   |
| [docs/kafka-events.md](docs/kafka-events.md)  | Kafka event flow & schema      |
| [docs/api-reference.md](docs/api-reference.md)| REST API reference             |

---

## Technology Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Frontend      | React 18 + Vite 5                 |
| Backend       | Node.js 20 + Express 4            |
| Database      | MySQL 8                           |
| Cache         | Redis 7                           |
| Messaging     | Apache Kafka 7.5 (Confluent)      |
| Container     | Docker, Docker Compose v2         |
| Orchestration | Kubernetes, Helm 3                |
| CI/CD         | GitHub Actions                    |

---

## License

MIT