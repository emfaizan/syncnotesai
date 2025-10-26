# SyncNotesAI Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- **Git**

You'll also need API keys for:
- [Recall.ai](https://recall.ai) - For meeting recording and transcription
- [OpenAI](https://openai.com) - For GPT-4 summaries and task extraction
- [ClickUp](https://clickup.com) - For task management integration

---

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd syncnotesai
```

---

## Step 2: Install Dependencies

Install root dependencies and workspace dependencies:

```bash
npm install
```

This will install dependencies for:
- Root workspace
- Backend
- Frontend
- Shared types

---

## Step 3: Set Up Environment Variables

### Backend Environment

1. Copy the backend environment template:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit `backend/.env` and configure:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/syncnotesai

   # JWT Secret (generate a random string)
   JWT_SECRET=your-super-secret-jwt-key

   # Recall.ai API
   RECALL_API_KEY=your-recall-api-key
   RECALL_WEBHOOK_SECRET=your-webhook-secret

   # OpenAI API
   OPENAI_API_KEY=your-openai-api-key

   # ClickUp API (optional for now)
   CLICKUP_API_KEY=your-clickup-api-key
   ```

### Frontend Environment

1. Copy the frontend environment template:
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

2. Edit `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

---

## Step 4: Set Up the Database

### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE syncnotesai;

# Exit PostgreSQL
\q
```

### Run Migrations

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### Seed Database (Optional)

```bash
npm run db:seed
```

This creates a demo user:
- Email: `demo@syncnotesai.com`
- Password: `demo123456`

---

## Step 5: Start Development Servers

### Option 1: Run Both (Backend + Frontend)

From the root directory:

```bash
npm run dev
```

### Option 2: Run Separately

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

---

## Step 6: Verify Installation

1. **Backend:** http://localhost:5000/health
   - Should return: `{"status":"ok",...}`

2. **Frontend:** http://localhost:3000
   - Should display the landing page

3. **API:** http://localhost:5000/api
   - Should return API info

---

## Step 7: Set Up Webhook (Production)

For production deployment, you'll need to configure Recall.ai webhooks:

1. Deploy your backend to a public URL
2. Configure Recall.ai webhook endpoint:
   ```
   POST https://your-domain.com/api/webhooks/recall
   ```
3. Add webhook secret to your environment variables

---

## Troubleshooting

### Database Connection Issues

If you see database connection errors:
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify DATABASE_URL in backend/.env
```

### Port Already in Use

If ports 3000 or 5000 are in use:
```bash
# Find and kill process on port
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

### Prisma Issues

```bash
# Regenerate Prisma client
cd backend
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

---

## Next Steps

1. Create a user account at http://localhost:3000/auth/register
2. Connect your ClickUp account in settings
3. Create your first meeting
4. Start recording!

For more information, see:
- [API Documentation](./API.md)
- [Architecture](./ARCHITECTURE.md)
- [Deployment](./DEPLOYMENT.md)
