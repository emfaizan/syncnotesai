# SyncNotesAI

> AI-powered meeting assistant that records, transcribes, and summarizes meetings with automatic task extraction and ClickUp synchronization.

## Overview

SyncNotesAI is an intelligent meeting assistant that:
- 📹 Records and transcribes meetings using Recall.ai
- 🤖 Generates AI-powered summaries using GPT-4
- ✅ Extracts actionable tasks automatically
- 🔄 Syncs tasks to ClickUp in real-time
- 💰 Usage-based pricing model

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **ORM**: Prisma
- **Authentication**: JWT
- **Rate Limiting**: express-rate-limit

### Frontend
- **Framework**: Next.js 14+
- **UI Library**: React 18+
- **Styling**: Tailwind CSS
- **State Management**: React Context / Zustand
- **API Client**: Axios

### External APIs
- **Recall.ai**: Meeting recording and transcription
- **OpenAI GPT-4**: Summary and task extraction
- **ClickUp**: Task management integration

## Project Structure

```
syncnotesai/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── api/            # API routes
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── validators/     # Request validation
│   ├── prisma/             # Database schema & migrations
│   └── tests/              # Backend tests
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app directory
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and helpers
│   │   ├── services/      # API service layer
│   │   ├── styles/        # Global styles
│   │   └── types/         # TypeScript types
│   └── public/            # Static assets
├── shared/                # Shared code between backend/frontend
│   └── types/            # Shared TypeScript types
└── docs/                 # Documentation

```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Recall.ai API key
- OpenAI API key
- ClickUp API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd syncnotesai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Set up the database**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start development servers**
   ```bash
   # From root directory
   npm run dev
   ```

   The backend will run on http://localhost:5000
   The frontend will run on http://localhost:3000

### Development Commands

```bash
# Run both backend and frontend
npm run dev

# Run backend only
npm run dev:backend

# Run frontend only
npm run dev:frontend

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## Architecture

### Backend Services

- **Meeting Service**: Handles meeting recording and transcription via Recall.ai
- **AI Service**: Processes transcripts with GPT-4 for summaries and task extraction
- **ClickUp Service**: Syncs tasks to ClickUp workspaces
- **User Service**: Manages user authentication and profiles
- **Billing Service**: Tracks usage and calculates pricing

### API Endpoints

```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
GET    /api/meetings               # List meetings
POST   /api/meetings               # Create meeting
GET    /api/meetings/:id           # Get meeting details
POST   /api/meetings/:id/start     # Start recording
POST   /api/meetings/:id/stop      # Stop recording
GET    /api/tasks                  # List extracted tasks
POST   /api/tasks/:id/sync         # Sync task to ClickUp
POST   /api/webhooks/recall        # Recall.ai webhook
GET    /api/usage                  # Get usage statistics
```

### Database Schema

Key entities:
- **Users**: User accounts and authentication
- **Meetings**: Meeting metadata and recordings
- **Transcripts**: Transcription data from Recall.ai
- **Summaries**: AI-generated meeting summaries
- **Tasks**: Extracted actionable items
- **Usage**: Billing and usage tracking

## Configuration

### Environment Variables

See `.env.example` for all available configuration options.

Key configurations:
- API keys for Recall.ai, OpenAI, and ClickUp
- Database connection settings
- JWT authentication secrets
- Rate limiting parameters
- Usage-based pricing settings

## Deployment

### Production Build

```bash
npm run build
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secrets
4. Configure CORS for production domains
5. Set up SSL certificates

### Recommended Hosting

- **Backend**: Railway, Render, or AWS EC2
- **Frontend**: Vercel or Netlify
- **Database**: Railway PostgreSQL, Supabase, or AWS RDS
- **Storage**: AWS S3 for recordings (optional)

## Security

- JWT-based authentication
- Rate limiting on all API endpoints
- Input validation and sanitization
- CORS configuration
- Encrypted password storage
- API key rotation support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for better meetings
