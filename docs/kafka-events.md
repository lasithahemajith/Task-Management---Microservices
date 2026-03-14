# Kafka Event Flow

## Overview

DevTask uses Apache Kafka as its event streaming backbone to decouple the Task Service from the Notification Service.

```
Task Service ──[produces]──▶  topic: task-events  ──[consumes]──▶  Notification Service
```

## Topic

| Topic        | Partitions | Replication Factor |
|--------------|------------|--------------------|
| task-events  | 1          | 1 (single broker)  |

Topics are auto-created when the first message is published.

## Event Schema

All events published to `task-events` follow this JSON structure:

```json
{
  "eventType": "TASK_CREATED",
  "task": {
    "id": 42,
    "title": "Implement login page",
    "description": "OAuth + email/password",
    "status": "pending",
    "user_id": 7
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Event Types

| Event Type     | Trigger                                    | Notification message template                       |
|----------------|--------------------------------------------|-----------------------------------------------------|
| TASK_CREATED   | `POST /tasks` – new task inserted          | `Task "<title>" has been created.`                  |
| TASK_UPDATED   | `PUT /tasks/:id` – status changed (not to completed) | `Task "<title>" has been updated.`      |
| TASK_COMPLETED | `PUT /tasks/:id` – status set to `completed` | `Task "<title>" has been completed. 🎉`           |

## Producer (Task Service)

```
services/task-service/src/kafka/producer.js
```

The producer connects lazily (on first publish) and uses the `kafkajs` library.

Key settings:
- `clientId`: `task-service`
- `brokers`: read from `KAFKA_BROKERS` env variable (default: `kafka:9092`)
- Retry: 5 attempts with 300 ms initial back-off

## Consumer (Notification Service)

```
services/notification-service/src/kafka/consumer.js
```

Key settings:
- `groupId`: `notification-service-group`
- `clientId`: `notification-service`
- Subscribes to `task-events` from the latest offset (`fromBeginning: false`)
- Retry: 8 attempts with 500 ms initial back-off

## Viewing Events Locally

You can inspect Kafka messages from inside the running container:

```bash
# Open a shell in the Kafka container
docker exec -it devtask-kafka bash

# List topics
kafka-topics --bootstrap-server localhost:9092 --list

# Consume all messages from task-events
kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic task-events \
  --from-beginning
```

## Error Handling

- The producer silently logs errors if Kafka is unavailable rather than failing the HTTP request.
  This ensures task creation still succeeds even if Kafka is temporarily down.
- The consumer logs errors per-message and continues processing subsequent messages.
- Both the producer and consumer retry connections on startup so transient Kafka restarts are handled gracefully.
