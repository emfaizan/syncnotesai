# SyncNotesAI Architecture

## System Overview

SyncNotesAI is a full-stack application that automates meeting recording, transcription, summarization, and task extraction.

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                    (Next.js 14 + React)                         │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API Server                         │
│                 (Node.js + Express + TypeScript)                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Meeting    │  │  Task       │  │  User       │            │
│  │  Service    │  │  Service    │  │  Service    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Recall.ai  │  │  OpenAI     │  │  ClickUp    │            │
│  │  Service    │  │  Service    │  │  Service    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
│                      (Prisma ORM)                               │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Recall.ai  │  │  OpenAI     │  │  ClickUp    │            │
│  │   API       │  │   GPT-4     │  │   API       │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Backend Architecture

### Layered Architecture

The backend follows a clean, layered architecture:

```
src/
├── api/
│   └── routes/          # Route definitions
├── controllers/         # Request handlers (thin layer)
├── services/           # Business logic
│   └── integrations/   # External API services
├── middleware/         # Express middleware
├── config/            # Configuration
├── utils/             # Helper functions
├── validators/        # Request validation schemas
└── types/            # TypeScript type definitions
```

### Key Components

1. **Controllers**
   - Handle HTTP requests/responses
   - Input validation
   - Error handling

2. **Services**
   - Business logic implementation
   - Database operations
   - External API interactions

3. **Middleware**
   - Authentication (JWT)
   - Rate limiting
   - Request logging
   - Error handling

4. **Integration Services**
   - Recall.ai: Meeting recording/transcription
   - OpenAI: AI summaries and task extraction
   - ClickUp: Task synchronization

---

## Frontend Architecture

### Next.js App Router

```
frontend/src/
├── app/                # Next.js 14 App Router
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Home page
│   └── ...            # Other pages
├── components/        # React components
├── hooks/            # Custom React hooks
├── services/         # API service layer
├── lib/              # Utilities
└── types/            # TypeScript types
```

### State Management

- **Local State**: React hooks (useState, useEffect)
- **Global State**: Zustand (lightweight state management)
- **Server State**: API calls with proper error handling

---

## Data Flow

### Recording a Meeting

1. User creates meeting → Frontend sends request
2. Backend creates meeting record in DB
3. User starts recording → Backend calls Recall.ai API
4. Recall.ai bot joins meeting and records
5. Recall.ai sends webhook when transcript is ready
6. Backend processes transcript with OpenAI
7. Backend extracts tasks and creates summary
8. Frontend displays results to user
9. User can sync tasks to ClickUp

```
User → Frontend → Backend → Recall.ai
                     ↓
                 PostgreSQL
                     ↓
  Webhook ← Recall.ai
                     ↓
Backend → OpenAI → Extract Tasks/Summary
                     ↓
                 PostgreSQL
                     ↓
Backend → ClickUp (sync tasks)
```

---

## Database Schema

Key entities:

- **Users**: Authentication and settings
- **Meetings**: Meeting metadata
- **Transcripts**: Raw transcription data
- **Summaries**: AI-generated summaries
- **Tasks**: Extracted action items
- **Usage**: Billing/usage tracking

Relations:
```
User (1) → (N) Meetings
Meeting (1) → (1) Transcript
Meeting (1) → (1) Summary
Meeting (1) → (N) Tasks
User (1) → (N) Usage
```

---

## Security

### Authentication & Authorization

- JWT-based authentication
- Token stored in localStorage (frontend)
- Token validation on protected routes
- User-scoped data access

### API Security

- Rate limiting (100 req/15min per IP)
- Helmet.js for security headers
- CORS configuration
- Input validation with Joi
- SQL injection prevention (Prisma ORM)

### Webhook Security

- Signature verification for Recall.ai webhooks
- Webhook secret validation

---

## Scalability Considerations

### Current Architecture
- Monolithic backend (Express)
- Single database (PostgreSQL)
- Synchronous processing

### Future Improvements
- **Message Queue**: Add Redis + BullMQ for async task processing
- **Caching**: Redis for frequently accessed data
- **CDN**: CloudFront for static assets
- **Load Balancing**: Multiple backend instances
- **Microservices**: Split services if needed

---

## Monitoring & Logging

- **Winston Logger**: Structured logging
- **Log Levels**: info, warn, error
- **Log Files**: combined.log, error.log
- **Request Logging**: All API requests logged

---

## Deployment Architecture

```
┌──────────────┐
│   Vercel     │  (Frontend - Next.js)
└──────────────┘
       ↓
┌──────────────┐
│   Railway    │  (Backend - Node.js)
└──────────────┘
       ↓
┌──────────────┐
│  PostgreSQL  │  (Database)
└──────────────┘
```

---

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **Logging**: Winston

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **HTTP Client**: Axios
- **Notifications**: react-hot-toast

### External APIs
- **Recall.ai**: Meeting recording
- **OpenAI GPT-4**: AI processing
- **ClickUp**: Task management
