# Recall.ai Integration Guide

Complete implementation of Recall.ai API for SyncNotesAI meeting recording and transcription.

## Overview

This integration allows SyncNotesAI to:
1. **Start meeting bots** to join and record meetings
2. **Receive webhooks** when recordings are complete
3. **Retrieve transcripts and audio/video** files
4. **Process meetings with AI** for summarization and task extraction
5. **Automatically delete recordings** after user-defined retention period (default: 7 days)

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Starts Meeting                                      │
│    POST /api/meetings                                        │
│    { meeting_url, platform, title }                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Start Recall.ai Bot                                      │
│    POST https://us-west-2.recall.ai/api/v1/bot/start/       │
│    { meeting_url, webhook_url, bot_name }                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Bot Joins Meeting & Records                              │
│    Status: scheduled → recording → processing               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Webhook: Recording Complete                              │
│    POST /api/webhooks/recall                                 │
│    { event: "recording.ready", bot_id, recording_url }       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Retrieve Transcript                                       │
│    GET /api/v1/bot/{bot_id}/transcript/                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Process with AI                                           │
│    - Generate summary                                        │
│    - Extract tasks with assignees and due dates             │
│    - Identify decisions and blockers                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Deduct Credits & Schedule Deletion                       │
│    - Calculate meeting duration                              │
│    - Deduct credits from user account                        │
│    - Schedule recording deletion after 7 days                │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Authentication

All Recall.ai API requests require a token in the Authorization header:

```typescript
headers: {
  'Authorization': 'Token YOUR_RECALL_API_KEY',
  'Content-Type': 'application/json'
}
```

**Environment Variable:**
```env
RECALL_API_KEY=your_recall_api_key_here
```

---

## 2. Starting a Meeting Bot

### API Endpoint
```
POST https://us-west-2.recall.ai/api/v1/bot/start/
```

### Request Body
```json
{
  "meeting_url": "https://zoom.us/j/123456789",
  "bot_name": "SyncNotesAI",
  "recording_mode": "speaker_view",
  "transcription_options": {
    "provider": "whisper"
  },
  "webhook_url": "https://your-domain.com/api/webhooks/recall",
  "automatic_leave": {
    "waiting_room_timeout": 600,
    "noone_joined_timeout": 300
  }
}
```

### Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `meeting_url` | string | **Required.** Zoom/Meet/Teams meeting URL | - |
| `platform` | string | Platform: `zoom`, `google_meet`, `microsoft_teams` | Auto-detected |
| `bot_name` | string | Name displayed in meeting | "SyncNotesAI" |
| `recording_mode` | string | `speaker_view`, `gallery_view`, `audio_only` | `speaker_view` |
| `transcription_options.provider` | string | `whisper` or `meeting_captions` | `whisper` |
| `webhook_url` | string | **Required.** URL to receive webhooks | - |

### Response
```json
{
  "id": "bot_abc123",
  "status": "joining",
  "meeting_url": "https://zoom.us/j/123456789",
  "bot_name": "SyncNotesAI",
  "recording": {
    "id": "rec_xyz789",
    "status": "recording"
  }
}
```

### Implementation

```typescript
// src/services/recallService.ts
const bot = await recallService.startBot({
  platform: 'zoom',
  join_url: 'https://zoom.us/j/123456789',
  webhook_url: `${process.env.API_BASE_URL}/api/webhooks/recall`,
  bot_name: 'SyncNotesAI',
});

// Save bot ID to database
await prisma.meeting.update({
  where: { id: meetingId },
  data: {
    recallBotId: bot.id,
    status: 'recording',
  },
});
```

---

## 3. Webhook Events

Recall.ai sends webhooks to the URL specified when starting the bot.

### Webhook Endpoint
```
POST /api/webhooks/recall
```

### Event Types

#### 3.1 Bot Status Change
```json
{
  "event": "bot.status_change",
  "data": {
    "bot_id": "bot_abc123",
    "status": "recording"
  }
}
```

**Possible Statuses:**
- `joining` - Bot is joining the meeting
- `recording` - Bot is actively recording
- `done` - Recording complete
- `fatal` - Error occurred

#### 3.2 Transcript Ready
```json
{
  "event": "transcript.ready",
  "data": {
    "bot_id": "bot_abc123",
    "transcript_id": "trans_123"
  }
}
```

**Handler Actions:**
1. Retrieve formatted transcript from API
2. Save transcript to database
3. Pass to AI processing pipeline
4. Extract tasks, decisions, and summary

#### 3.3 Recording Ready
```json
{
  "event": "recording.ready",
  "data": {
    "bot_id": "bot_abc123",
    "recording_url": "https://recall.ai/recordings/rec_xyz789"
  }
}
```

**Handler Actions:**
1. Save recording URL to database
2. Calculate meeting duration
3. Deduct credits from user account
4. Schedule recording deletion

#### 3.4 Bot Error
```json
{
  "event": "bot.error",
  "data": {
    "bot_id": "bot_abc123",
    "error": "Failed to join meeting"
  }
}
```

### Webhook Implementation

```typescript
// src/services/webhookService.ts
export class WebhookService {
  async processRecallWebhook(payload: RecallWebhookPayload) {
    const { event, data } = payload;

    switch (event) {
      case 'bot.status_change':
        await this.handleBotStatusChange(data);
        break;
      case 'transcript.ready':
        await this.handleTranscriptReady(data);
        break;
      case 'recording.ready':
        await this.handleRecordingReady(data);
        break;
      case 'bot.error':
        await this.handleBotError(data);
        break;
    }
  }
}
```

**Important:** Acknowledge webhooks immediately with 200 status, then process asynchronously:

```typescript
// src/controllers/webhookController.ts
res.status(200).json({ success: true });

// Process in background
webhookService.processRecallWebhook(payload).catch(logger.error);
```

---

## 4. Retrieving Audio & Transcripts

### 4.1 Get Formatted Transcript

```typescript
const transcript = await recallService.getFormattedTranscript(botId);
```

**Example Output:**
```
Speaker 1: Good morning everyone. Let's discuss the Q4 roadmap.

Speaker 2: We need to prioritize the mobile app redesign. John, can you lead that?

Speaker 3 (John): Yes, I can start next week. Should be done by end of month.

Speaker 2: Also, we need to fix the payment bug by Friday.
```

### 4.2 Get Recording Details

```typescript
const details = await recallService.getRecordingDetails(botId);
```

**Response:**
```json
{
  "audio_url": "https://recall.ai/audio/rec_xyz789.mp3",
  "video_url": "https://recall.ai/video/rec_xyz789.mp4",
  "duration": 3600,
  "size": 125000000,
  "status": "ready"
}
```

### 4.3 Download Audio/Video

```typescript
// Download audio file
const audioBuffer = await recallService.downloadAudio(botId);

// Download video file
const videoBuffer = await recallService.downloadVideo(botId);

// Save to S3, file system, etc.
```

---

## 5. AI Processing Pipeline

When transcript is ready, it's automatically processed with OpenAI GPT-4:

```typescript
// src/services/webhookService.ts
private async processMeetingTranscript(meetingId, transcript, userId) {
  // Use enhanced AI service
  const analysis = await aiServiceEnhanced.processMeetingTranscript(transcript);

  // Save summary
  await prisma.summary.create({
    data: {
      meetingId,
      content: formatSummary(analysis),
    },
  });

  // Save tasks
  for (const task of analysis.tasks) {
    await prisma.task.create({
      data: {
        meetingId,
        userId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.due_date ? new Date(task.due_date) : null,
        assignee: task.assignee,
      },
    });
  }
}
```

**AI Analysis Output:**
```json
{
  "summary": "The team discussed Q4 priorities...",
  "decisions": [
    "Mobile app redesign is top priority for Q4"
  ],
  "tasks": [
    {
      "title": "Lead mobile app redesign project",
      "description": "Take ownership of mobile app redesign...",
      "assignee": "John",
      "due_date": "2024-01-31",
      "priority": "high"
    }
  ],
  "key_points": [
    "Q4 roadmap planning discussion"
  ],
  "blockers": [],
  "next_steps": [
    "John to start mobile app redesign planning next week"
  ]
}
```

See [AI_PROCESSING_PIPELINE.md](./AI_PROCESSING_PIPELINE.md) for details.

---

## 6. Recording Deletion

### Automatic Deletion After 7 Days

Recordings are automatically scheduled for deletion after 7 days (or user-defined retention period).

**Cron Job:**
```typescript
// Runs daily at 2:00 AM UTC
cron.schedule('0 2 * * *', async () => {
  const meetingsToDelete = await prisma.meeting.findMany({
    where: {
      recordingDeletionDate: { lte: new Date() },
      recordingUrl: { not: null },
    },
  });

  for (const meeting of meetingsToDelete) {
    await recallService.deleteRecording(meeting.recallBotId);
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { recordingUrl: null },
    });
  }
});
```

### Manual Deletion

Users can manually delete recordings:

```typescript
await cronService.deleteRecordingNow(meetingId);
```

### Custom Retention Period

Users can set custom retention periods:

```typescript
await cronService.updateUserRetention(userId, 30); // 30 days
```

**Retention Options:**
- 1 day (immediately after processing)
- 7 days (default)
- 30 days
- 90 days
- Forever (never delete)

---

## 7. Database Schema

### User Model
```prisma
model User {
  // Recording retention settings
  recordingRetentionDays Int @default(7)
}
```

### Meeting Model
```prisma
model Meeting {
  // Recall.ai integration
  recallBotId   String?   @unique
  recordingUrl  String?

  // Recording retention
  recordingDeletionDate DateTime?
  errorMessage          String?

  // Status tracking
  status String @default("scheduled")
  // scheduled, recording, processing, completed, failed, error

  duration Int? // Duration in minutes
}
```

---

## 8. Error Handling

### Bot Failures

```typescript
try {
  const bot = await recallService.startBot(config);
} catch (error) {
  logger.error('Failed to start bot', { error });

  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      status: 'error',
      errorMessage: error.message,
    },
  });

  // Notify user via email/notification
}
```

### Webhook Processing Errors

```typescript
webhookService.processRecallWebhook(payload).catch((error) => {
  logger.error('Webhook processing failed', {
    event: payload.event,
    bot_id: payload.data.bot_id,
    error: error.message,
  });

  // Update meeting status
  await prisma.meeting.update({
    where: { recallBotId: payload.data.bot_id },
    data: { status: 'error' },
  });
});
```

---

## 9. Testing

### Test Webhook Locally

Use ngrok to expose local server:

```bash
ngrok http 5000
```

Update webhook URL when starting bot:
```typescript
webhook_url: 'https://abc123.ngrok.io/api/webhooks/recall'
```

### Mock Webhook Events

```bash
curl -X POST http://localhost:5000/api/webhooks/recall \
  -H "Content-Type: application/json" \
  -d '{
    "event": "transcript.ready",
    "data": {
      "bot_id": "test_bot_123"
    }
  }'
```

---

## 10. Environment Variables

Add to `.env`:

```env
# Recall.ai API
RECALL_API_KEY=your_recall_api_key
RECALL_WEBHOOK_SECRET=your_webhook_secret

# Application
API_BASE_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/syncnotesai
```

---

## 11. Cost Optimization

**Best Practices:**
1. **Use audio-only mode** when video isn't needed (saves bandwidth)
2. **Delete recordings promptly** (default 7 days)
3. **Process transcripts efficiently** (batch AI requests)
4. **Monitor bot status** (avoid stuck bots)

**Recall.ai Pricing:**
- Charged per minute of recording
- Transcription included
- Storage costs apply for recordings

---

## 12. Security

### Webhook Verification

```typescript
// src/middleware/verifyRecallWebhook.ts
export const verifyRecallWebhook = (req, res, next) => {
  const signature = req.headers['x-recall-signature'];
  const secret = process.env.RECALL_WEBHOOK_SECRET;

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
};
```

### API Key Protection

- Store API key in environment variables
- Never commit to version control
- Rotate keys periodically
- Use different keys for development/production

---

## 13. Monitoring

### Log All Events

```typescript
logger.info('Bot started', { bot_id, meeting_url });
logger.info('Webhook received', { event, bot_id });
logger.error('Bot error', { bot_id, error });
```

### Track Metrics

```typescript
// Track success rates
await prisma.meeting.count({ where: { status: 'completed' } });
await prisma.meeting.count({ where: { status: 'error' } });

// Average processing time
// Credits used per user
// Recording retention stats
```

---

## 14. Support & Troubleshooting

### Common Issues

**Bot doesn't join meeting:**
- Check meeting URL format
- Verify API key is valid
- Ensure meeting hasn't started yet

**Webhook not received:**
- Check webhook URL is publicly accessible
- Verify firewall/security settings
- Test with ngrok for local development

**Transcript empty:**
- No one spoke during meeting
- Audio issues in meeting
- Transcription provider error

### Recall.ai API Docs

- Main Docs: https://recallai.readme.io/
- API Reference: https://recallai.readme.io/reference/
- Webhook Guide: https://recallai.readme.io/docs/webhooks

---

## Summary

✅ **Authentication** - Token-based API authentication
✅ **Start Bot** - POST to `/bot/start/` with meeting URL and webhook
✅ **Webhooks** - Receive events at `/api/webhooks/recall`
✅ **Retrieve Data** - Get transcripts, audio, and video
✅ **AI Processing** - Automatic summarization and task extraction
✅ **Auto-Deletion** - Schedule recordings for deletion after 7 days
✅ **Error Handling** - Comprehensive error catching and logging
✅ **Security** - Webhook signature verification

The complete Recall.ai integration is now fully implemented and ready for production use!
