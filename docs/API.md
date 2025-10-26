# SyncNotesAI API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication using JWT Bearer tokens.

Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

---

## Authentication Endpoints

### Register User

```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "company": "Acme Inc" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "company": "Acme Inc",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token"
  },
  "message": "User registered successfully"
}
```

### Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## Meeting Endpoints

### Get All Meetings

```http
GET /meetings
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Team Standup",
      "meetingUrl": "https://zoom.us/j/123456789",
      "platform": "zoom",
      "status": "scheduled",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Create Meeting

```http
POST /meetings
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Team Standup",
  "meetingUrl": "https://zoom.us/j/123456789",
  "platform": "zoom",
  "description": "Daily standup meeting", // optional
  "scheduledAt": "2024-01-01T10:00:00.000Z", // optional
  "clickupListId": "list-id" // optional
}
```

### Start Recording

```http
POST /meetings/:id/start
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "botId": "bot-id",
    "status": "recording"
  },
  "message": "Recording started successfully"
}
```

### Stop Recording

```http
POST /meetings/:id/stop
```

**Headers:** `Authorization: Bearer <token>`

---

## Task Endpoints

### Get All Tasks

```http
GET /tasks
```

**Headers:** `Authorization: Bearer <token>`

### Sync Task to ClickUp

```http
POST /tasks/:id/sync
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "clickupTaskId": "clickup-task-id",
    "status": "synced"
  },
  "message": "Task synced to ClickUp successfully"
}
```

---

## Usage Endpoints

### Get Current Month Usage

```http
GET /usage/current-month
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMinutes": 120,
    "totalCost": 6.00,
    "records": 5,
    "period": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-31T23:59:59.999Z"
    }
  }
}
```

---

## Webhook Endpoints

### Recall.ai Webhook

```http
POST /webhooks/recall
```

**Headers:**
- `x-recall-signature: <signature>`

This endpoint receives webhook events from Recall.ai for:
- Bot status changes
- Transcript ready
- Recording ready

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
```

Common status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
