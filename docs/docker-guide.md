# Running DevTask with Docker Compose

## Prerequisites

- Docker ≥ 24
- Docker Compose v2 (bundled with modern Docker)

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/lasithahemajith/Task-Management---Microservices.git
cd Task-Management---Microservices

# 2. Copy environment file (optional – defaults work out of the box)
cp .env.example .env

# 3. Build and start all services
docker compose up --build

# 4. Wait ~60 seconds for MySQL and Kafka to be ready, then visit:
#    Frontend:    http://localhost:5173
#    API Gateway: http://localhost:3000
```

## Accessing Services

| Service        | URL                          |
|----------------|------------------------------|
| Frontend       | http://localhost:5173        |
| API Gateway    | http://localhost:3000        |
| Auth API       | http://localhost:3000/auth   |
| Tasks API      | http://localhost:3000/tasks  |
| Notifications  | http://localhost:3000/notifications |

## Useful Commands

```bash
# View logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f task-service

# Stop all services (keep data volumes)
docker compose stop

# Stop and remove containers + networks (keep volumes)
docker compose down

# Stop and remove everything including volumes (wipes data)
docker compose down -v

# Rebuild a single service image
docker compose build auth-service

# Scale a service (run 2 replicas)
docker compose up --scale task-service=2
```

## Environment Variables

Edit `.env` to customise the deployment:

| Variable           | Default                            | Description                  |
|--------------------|------------------------------------|------------------------------|
| MYSQL_ROOT_PASSWORD| root_password                      | MySQL root password          |
| MYSQL_DATABASE     | devtask_db                         | Database name                |
| MYSQL_USER         | devtask                            | Application DB user          |
| MYSQL_PASSWORD     | devtask_password                   | Application DB password      |
| JWT_SECRET         | supersecret_change_in_production   | JWT signing secret           |
| JWT_EXPIRES_IN     | 24h                                | JWT expiry                   |
| LOG_LEVEL          | info                               | Logging level (debug/info/warn/error) |

> ⚠️ Always change `JWT_SECRET` and database passwords before deploying to any environment.

## Troubleshooting

**MySQL takes too long to start**
Services retry the DB connection up to 10 times with a 3-second delay.
If they keep failing, run `docker compose logs mysql` to check the DB logs.

**Kafka consumer not receiving events**
Kafka can take 30-60 seconds to be fully ready after first boot.
The notification-service has a built-in retry loop. Check `docker compose logs notification-service`.

**Port conflicts**
If ports 3000, 3306, or 6379 are already in use on your machine, edit `docker-compose.yml` to change the host-side port mappings.
