# SyncNotesAI Backend API

Complete Node.js (Express + TypeScript) backend for SyncNotesAI with Recall.ai integration, OpenAI processing, ClickUp sync, and Stripe billing.

## 🏗️ Architecture Overview

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Express API   │
│  (TypeScript)   │
└────────┬────────┘
         │
    ┌────┴─────┬──────────┬─────────────┬──────────┐
    ▼          ▼          ▼             ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐  ┌────────┐  ┌────────┐
│Recall  │ │OpenAI  │ │ClickUp │  │ Stripe │  │ Prisma │
│.ai API │ │GPT-4   │ │ OAuth  │  │Payments│  │PostgreSQL
└────────┘ └────────┘ └────────┘  └────────┘  └────────┘
```

## 📦 Core Modules

### 1. **Recall Integration Module** (`src/services/recallService.ts`)

Handles meeting bot integration with Recall.ai:

- **`createBot(config)`** - Creates a bot to join meetings
- **`getBot(botId)`** - Gets bot status and details
- **`getTranscript(botId)`** - Retrieves meeting transcript
- **`getFormattedTranscript(botId)`** - Returns formatted transcript with speakers
- **`getRecordingUrl(botId)`** - Gets video/audio recording URL
- **`calculateDuration(transcript)`** - Calculates meeting duration in minutes

**Webhook Events:**
- `bot.status_change` - Bot status updates (waiting, recording, done)
- `recording.ready` - Recording available for download
- `transcription.completed` - Transcript processing complete

### 2. **AI Processing Module** (`src/services/aiService.ts`)

Processes transcripts with OpenAI GPT-4:

- **`generateSummary(transcript, meetingTitle)`** - Creates structured summary:
  - Overview
  - Key discussion points
  - Decisions made
  - Blockers identified
  - Next steps

- **`extractActionItems(transcript, summary)`** - Extracts tasks with:
  - Title and description
  - Assignee (if mentioned)
  - Priority level
  - Due date (if mentioned)
  - Estimated duration

- **`processMeeting(transcript, title)`** - Complete processing pipeline

### 3. **ClickUp Integration Module** (`src/services/clickupService.ts`)

OAuth2 integration with ClickUp:

**OAuth Flow:**
- **`getAuthorizationUrl(state)`** - Generates OAuth URL
- **`getAccessToken(code)`** - Exchanges code for access token
- **`refreshAccessToken(refreshToken)`** - Refreshes expired tokens

**API Methods:**
- **`getTeams(accessToken)`** - Lists user's teams
- **`getSpaces(accessToken, teamId)`** - Lists spaces in a team
- **`getLists(accessToken, spaceId)`** - Lists lists in a space
- **`createTask(accessToken, listId, taskData)`** - Creates a task
- **`updateTask(accessToken, taskId, updates)`** - Updates a task
- **`getTask(accessToken, taskId)`** - Retrieves a task

### 4. **Billing Module** (`src/services/billingService.ts`)

Stripe integration for usage-based billing:

**Plans:**
- **Free**: $0/month, 120 minutes (2 hours)
- **Pro**: $29/month, 1200 minutes (20 hours)
- **Team**: $99/month, unlimited

**Features:**
- **`deductCredits(userId, minutes, meetingId)`** - Deducts usage from credits
- **`purchaseCredits(userId, hours, paymentMethodId)`** - Buy additional credits ($5/hour)
- **`autoTopUp(userId, minutes)`** - Automatic top-up when credits run low
- **`createSubscription(userId, planId, paymentMethodId)`** - Subscribe to Pro/Team
- **`cancelSubscription(userId, immediate)`** - Cancel subscription
- **`getBillingSummary(userId)`** - Get usage and billing details

**Stripe Webhooks:**
- `payment_intent.succeeded` - Payment completed
- `customer.subscription.updated` - Subscription changed
- `invoice.payment_succeeded` - Monthly payment processed

### 5. **Meeting Processor Service** (`src/services/meetingProcessorService.ts`)

Orchestrates the complete meeting workflow:

**Workflow:**
1. **Start Meeting** → Create Recall bot
2. **Recording** → Bot joins and records meeting
3. **Transcription** → Recall processes audio → text
4. **AI Processing** → GPT-4 generates summary + extracts tasks
5. **Billing** → Deduct credits based on duration
6. **ClickUp Sync** → Auto-create tasks in ClickUp (if configured)

## 🗄️ Database Schema

### Users
```prisma
model User {
  id                   String
  email                String    @unique
  password             String
  name                 String

  // Billing
  plan                 String    @default("free")
  credits              Float     @default(120.0)
  stripeCustomerId     String?
  stripeSubscriptionId String?
  autoTopUp            Boolean   @default(false)
  autoTopUpAmount      Float     @default(600.0)

  // ClickUp
  clickupAccessToken   String?
  clickupRefreshToken  String?
  clickupTeamId        String?
  clickupListId        String?
  clickupConnected     Boolean   @default(false)
  clickupTokenExpiry   DateTime?
}
```

### Meetings
```prisma
model Meeting {
  id            String
  title         String
  meetingUrl    String
  platform      String

  recallBotId   String?   @unique
  recordingUrl  String?

  status        String    @default("scheduled")
  duration      Int?      // minutes

  userId        String
  transcript    Transcript?
  summary       Summary?
  tasks         Task[]
}
```

### Transactions
```prisma
model Transaction {
  id                    String
  type                  String  // purchase, usage, refund, auto_topup
  amount                Float
  credits               Float
  status                String
  stripePaymentIntentId String?
  userId                String
}
```

## 🚀 API Endpoints

### Authentication
```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - Login user
POST   /api/auth/logout         - Logout user
GET    /api/auth/me             - Get current user
```

### Meetings
```
POST   /api/meetings            - Start new meeting recording
GET    /api/meetings            - List user meetings
GET    /api/meetings/:id        - Get meeting details
DELETE /api/meetings/:id        - Delete meeting
GET    /api/meetings/:id/status - Get bot status
POST   /api/meetings/:id/sync   - Sync tasks to ClickUp
```

### ClickUp
```
GET    /api/clickup/auth        - Get OAuth URL
GET    /api/clickup/callback    - OAuth callback
GET    /api/clickup/teams       - List teams
GET    /api/clickup/spaces/:teamId - List spaces
GET    /api/clickup/lists/:spaceId - List lists
POST   /api/clickup/disconnect  - Disconnect ClickUp
```

### Billing
```
GET    /api/billing/summary     - Get billing summary
POST   /api/billing/purchase    - Purchase credits
POST   /api/billing/subscribe   - Create subscription
POST   /api/billing/cancel      - Cancel subscription
POST   /api/billing/auto-topup  - Configure auto top-up
```

### Webhooks
```
POST   /api/webhooks/recall     - Recall.ai webhook handler
POST   /api/webhooks/stripe     - Stripe webhook handler
```

## ⚙️ Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
# Edit .env with your API keys
```

Required API Keys:
- **Recall.ai**: https://api.recall.ai/
- **OpenAI**: https://platform.openai.com/
- **ClickUp OAuth**: https://clickup.com/api/
- **Stripe**: https://dashboard.stripe.com/

### 3. Setup Database
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Optional: Seed database
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
# Server runs on http://localhost:5000
```

### 5. Configure Webhooks

**Recall.ai Webhook:**
```
URL: https://your-domain.com/api/webhooks/recall
Events: bot.status_change, recording.ready, transcription.completed
```

**Stripe Webhook:**
```
URL: https://your-domain.com/api/webhooks/stripe
Events: payment_intent.*, customer.subscription.*, invoice.*
```

Use ngrok for local development:
```bash
ngrok http 5000
# Use the ngrok URL for webhooks
```

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - Prevent API abuse
- **CORS Protection** - Whitelist frontend origin
- **Helmet.js** - Security headers
- **Input Validation** - Joi schemas
- **Webhook Verification** - Stripe signature validation

## 📊 Usage Tracking

The system automatically:
1. Tracks meeting duration (in minutes)
2. Deducts credits from user account
3. Creates usage records for billing
4. Triggers auto top-up when credits < 1 hour
5. Sends low credit notifications

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test
```

## 📝 Code Structure

```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   │   ├── authController.ts
│   │   ├── meetingController.ts
│   │   └── webhookController.ts
│   ├── services/         # Business logic
│   │   ├── recallService.ts
│   │   ├── aiService.ts
│   │   ├── clickupService.ts
│   │   ├── billingService.ts
│   │   └── meetingProcessorService.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── utils/           # Helper functions
│   │   ├── logger.ts
│   │   └── jwt.ts
│   └── server.ts        # Express app setup
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── .env.example         # Environment template
└── package.json
```

## 🔧 Configuration

### Pricing Configuration

Edit `src/services/billingService.ts`:
```typescript
export const PRICING_PLANS = {
  free: { price: 0, credits: 120 },    // 2 hours
  pro: { price: 29, credits: 1200 },   // 20 hours
  team: { price: 99, credits: -1 },    // Unlimited
};

export const PAYG_RATE = 5; // $5 per hour
```

### Meeting Recording Settings

Edit `src/services/recallService.ts`:
```typescript
const config = {
  recording_mode: 'speaker_view',  // or 'gallery_view', 'audio_only'
  transcription_provider: 'whisper',  // or 'meeting_captions'
  automatic_leave: {
    waiting_room_timeout: 600,    // 10 minutes
    noone_joined_timeout: 300,    // 5 minutes
  },
};
```

## 🚨 Error Handling

All services include comprehensive error handling:
- Structured error responses
- Winston logging
- Automatic retry logic for external APIs
- Graceful fallbacks

## 📈 Monitoring

Logs are stored in:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

Use with monitoring tools:
- **Datadog** - Application monitoring
- **Sentry** - Error tracking
- **LogRocket** - Session replay

## 🌐 Production Deployment

1. Set `NODE_ENV=production`
2. Use environment-specific database
3. Configure proper webhook URLs
4. Set up SSL certificates
5. Use process manager (PM2)
6. Enable monitoring and alerts

```bash
npm run build
pm2 start dist/server.js --name syncnotesai-backend
```

## 📞 Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/syncnotesai/issues
- Documentation: https://docs.syncnotesai.com
- Email: support@syncnotesai.com

---

Built with ❤️ by the SyncNotesAI team
