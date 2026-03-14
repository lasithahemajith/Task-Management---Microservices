# API Reference

All requests go through the **API Gateway** at `http://localhost:3000`.

## Authentication

Protected endpoints require a JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

You obtain a token from the `/auth/register` or `/auth/login` endpoints.

---

## Auth Service  (`/auth/*`)

### POST /auth/register

Register a new user.

**Request body:**
```json
{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }
```

**Response 201:**
```json
{ "token": "<jwt>", "user": { "id": 1, "name": "Alice", "email": "alice@example.com" } }
```

---

### POST /auth/login

Authenticate an existing user.

**Request body:**
```json
{ "email": "alice@example.com", "password": "secret123" }
```

**Response 200:**
```json
{ "token": "<jwt>", "user": { "id": 1, "name": "Alice", "email": "alice@example.com" } }
```

---

### GET /auth/profile  🔒

Return the current user's profile.

**Response 200:**
```json
{ "user": { "id": 1, "name": "Alice", "email": "alice@example.com", "created_at": "…" } }
```

---

## Task Service  (`/tasks*`)

All task endpoints require authentication.

### POST /tasks  🔒

Create a new task.

**Request body:**
```json
{ "title": "Fix bug #42", "description": "Null pointer in login", "status": "pending" }
```

`status` is optional; defaults to `pending`. Valid values: `pending`, `in_progress`, `completed`.

**Response 201:**
```json
{ "task": { "id": 5, "title": "Fix bug #42", "description": "…", "status": "pending", "user_id": 1 } }
```

---

### GET /tasks  🔒

List all tasks for the current user.

**Response 200:**
```json
{ "tasks": [ { "id": 5, "title": "…", "status": "pending", … } ] }
```

---

### GET /tasks/:id  🔒

Get a single task.

**Response 200:**
```json
{ "task": { "id": 5, … } }
```

**Response 404:** `{ "error": "Task not found" }`

---

### PUT /tasks/:id  🔒

Update a task. All fields are optional.

**Request body:**
```json
{ "title": "Fix bug #42 (urgent)", "status": "in_progress" }
```

Setting `status` to `completed` publishes a `TASK_COMPLETED` event; any other change publishes `TASK_UPDATED`.

**Response 200:**
```json
{ "task": { "id": 5, "status": "in_progress", … } }
```

---

### DELETE /tasks/:id  🔒

Delete a task.

**Response 200:**
```json
{ "message": "Task deleted successfully" }
```

---

## Notification Service  (`/notifications*`)

### GET /notifications  🔒

List the latest 50 notifications for the current user.

**Response 200:**
```json
{
  "notifications": [
    {
      "id": 12,
      "user_id": 1,
      "message": "Task \"Fix bug #42\" has been completed. 🎉",
      "event_type": "TASK_COMPLETED",
      "task_id": 5,
      "created_at": "2024-01-15T10:31:00.000Z"
    }
  ]
}
```

---

## Health Checks

Each service exposes `GET /health`:

```json
{ "status": "ok", "service": "task-service" }
```

| URL                                  | Service              |
|--------------------------------------|----------------------|
| http://localhost:3000/health         | API Gateway          |
| http://localhost:3001/health         | Auth Service (direct)|
| http://localhost:3002/health         | Task Service (direct)|
| http://localhost:3003/health         | Notification Service |
