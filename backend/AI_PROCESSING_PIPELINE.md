# SyncNotesAI - AI Processing Pipeline

## Overview

The AI processing pipeline transforms raw meeting transcripts into structured, actionable data using GPT-4.

## Pipeline Flow

```
┌─────────────────┐
│ Raw Transcript  │
│  (from Recall)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Processing  │
│    (GPT-4)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Structured Data │
│   - Summary     │
│   - Decisions   │
│   - Tasks       │
│   - Key Points  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Save to DB &   │
│ Sync to ClickUp │
└─────────────────┘
```

## Input Format

**Raw Transcript** (from Recall.ai):
```
Speaker 1: Good morning team. Let's discuss the Q4 roadmap.

Speaker 2: We need to prioritize the mobile app redesign.

Speaker 1: Agreed. John, can you lead that initiative?

Speaker 3 (John): Yes, I can start next week. Should be done by end of month.

Speaker 2: Also, we need to fix the payment integration bug by Friday.
```

## Output Format

The AI returns a structured JSON object:

```json
{
  "summary": "The team discussed Q4 priorities, agreeing to prioritize the mobile app redesign led by John. A critical payment bug needs to be fixed by end of week.",

  "decisions": [
    "Mobile app redesign is the top priority for Q4",
    "John will lead the mobile app redesign initiative"
  ],

  "tasks": [
    {
      "title": "Lead mobile app redesign project",
      "description": "Take ownership of the mobile app redesign initiative, including planning, resource allocation, and execution",
      "assignee": "John",
      "due_date": "2024-01-31",
      "priority": "high",
      "estimated_duration": "3 weeks"
    },
    {
      "title": "Fix payment integration bug",
      "description": "Resolve the critical bug affecting payment processing functionality",
      "assignee": null,
      "due_date": "2024-01-05",
      "priority": "urgent",
      "estimated_duration": null
    }
  ],

  "key_points": [
    "Q4 roadmap planning discussion",
    "Mobile app redesign identified as top priority",
    "Payment integration issue requires immediate attention"
  ],

  "blockers": [],

  "next_steps": [
    "John to start mobile app redesign planning next week",
    "Investigate and resolve payment bug before Friday"
  ],

  "attendees": [
    "Speaker 1",
    "Speaker 2",
    "John"
  ]
}
```

## Key Features

### 1. **Smart Date Detection**

The AI detects and normalizes various date formats:

| Mentioned in Meeting | Normalized To | Format |
|---------------------|---------------|---------|
| "tomorrow" | Next day | YYYY-MM-DD |
| "next Friday" | Upcoming Friday | YYYY-MM-DD |
| "end of week" | This Friday | YYYY-MM-DD |
| "next week" | Following Monday | YYYY-MM-DD |
| "by EOD" | Today | YYYY-MM-DD |
| "in 2 weeks" | 14 days from now | YYYY-MM-DD |
| "end of month" | Last day of month | YYYY-MM-DD |

### 2. **Priority Assessment**

Tasks are automatically prioritized based on context:

- **Urgent**: Deadline today/tomorrow, critical issues, blockers
- **High**: Deadline this week, important deliverables
- **Medium**: Deadline next week or later, standard tasks
- **Low**: No specific deadline, nice-to-have items

### 3. **Duplicate Detection**

The system automatically:
- Removes duplicate tasks with similar titles
- Consolidates repeated decisions
- Deduplicates key points
- Ensures each item appears only once

### 4. **Actionable Language**

All tasks use clear action verbs:
- ✅ "Schedule call with client about contract renewal"
- ✅ "Review and approve Q4 budget proposal"
- ✅ "Send onboarding documentation to new hire"
- ❌ "Follow up" (too vague)
- ❌ "Meeting stuff" (not specific)

## Usage Examples

### Basic Processing

```typescript
import { aiServiceEnhanced } from './services/aiServiceEnhanced';

// Process complete meeting
const transcript = "...meeting transcript...";
const result = await aiServiceEnhanced.processMeetingTranscript(transcript);

console.log('Summary:', result.summary);
console.log('Tasks:', result.tasks.length);
console.log('Decisions:', result.decisions);
```

### Extract Tasks Only (Faster)

```typescript
// When you only need tasks, not full analysis
const tasks = await aiServiceEnhanced.extractTasksOnly(transcript);

tasks.forEach(task => {
  console.log(`- ${task.title} (${task.priority})`);
  if (task.assignee) console.log(`  Assigned to: ${task.assignee}`);
  if (task.due_date) console.log(`  Due: ${task.due_date}`);
});
```

### Quick Summary

```typescript
// Fast, concise summary only
const summary = await aiServiceEnhanced.generateQuickSummary(transcript);
console.log(summary);
```

## API Integration

### In Meeting Processor Service

```typescript
import { aiServiceEnhanced } from './aiServiceEnhanced';

async function processMeeting(transcriptText: string) {
  // Get structured data from AI
  const analysis = await aiServiceEnhanced.processMeetingTranscript(transcriptText);

  // Save summary to database
  await prisma.summary.create({
    data: {
      meetingId: meeting.id,
      content: formatSummary(analysis),
    },
  });

  // Create tasks in database
  for (const task of analysis.tasks) {
    await prisma.task.create({
      data: {
        meetingId: meeting.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.due_date ? new Date(task.due_date) : null,
        assignee: task.assignee,
      },
    });
  }

  return analysis;
}
```

## Prompt Engineering

### System Prompt
Defines the AI's role and guidelines for all requests.

### User Prompt
Includes:
- The transcript
- Current date for reference
- Specific JSON structure to follow
- Detailed rules and examples

### Temperature Settings
- **0.3**: For structured data extraction (consistent, predictable)
- **0.5**: For summaries (slightly more creative)
- **0.7**: For general text generation

## Quality Assurance

The pipeline includes automatic validation:

1. **Minimum Length Checks**
   - Tasks must have titles > 5 characters
   - Decisions must be > 10 characters
   - Key points must be > 10 characters

2. **Duplicate Removal**
   - Case-insensitive comparison
   - Trimmed whitespace
   - Consolidated similar items

3. **Date Validation**
   - Ensures valid ISO format
   - Rejects invalid dates
   - Normalizes relative dates

4. **Summary Conciseness**
   - Limits to 3-4 sentences max
   - Focuses on key outcomes
   - Removes redundancy

## Performance

- **Full Analysis**: ~5-10 seconds
- **Tasks Only**: ~3-5 seconds
- **Quick Summary**: ~2-3 seconds

Model: GPT-4 Turbo (128k context window)

## Error Handling

```typescript
try {
  const result = await aiServiceEnhanced.processMeetingTranscript(transcript);
} catch (error) {
  if (error.message.includes('token limit')) {
    // Transcript too long, split into chunks
  } else if (error.message.includes('rate limit')) {
    // Retry with backoff
  } else {
    // Log and alert
  }
}
```

## Cost Optimization

1. **Use Tasks-Only Mode**: When full analysis isn't needed
2. **Cache Results**: Don't re-process same transcript
3. **Batch Processing**: Process multiple meetings in parallel
4. **Quick Summary**: Use cheaper model for simple summaries

## Testing

### Sample Test Transcript

```typescript
const testTranscript = `
Speaker 1: Let's review the sprint goals.
Speaker 2: We need to deploy the new feature by Friday.
Speaker 1: Sarah, can you handle the deployment?
Speaker 3 (Sarah): Yes, I'll deploy Thursday evening.
Speaker 2: Also, we should schedule a retrospective for next week.
`;

const result = await aiServiceEnhanced.processMeetingTranscript(testTranscript);

expect(result.tasks).toHaveLength(2);
expect(result.tasks[0].assignee).toBe('Sarah');
expect(result.tasks[0].priority).toBe('high');
```

## Customization

### Adjust Priority Logic

Edit `src/utils/aiPrompts.ts`:

```typescript
// Make all tasks with deadlines "urgent"
5. **Priority Assessment**:
   - urgent: Any task with a deadline
   - high: Tasks mentioned multiple times
   - medium: Standard tasks
   - low: Optional items
```

### Change Output Format

Modify the JSON structure in `MEETING_ANALYSIS_PROMPT` to match your needs.

### Add Custom Fields

```json
{
  "tasks": [
    {
      // ... existing fields ...
      "department": "Engineering",
      "project": "Mobile App",
      "tags": ["backend", "api"]
    }
  ]
}
```

## Monitoring

Track AI processing quality:

```typescript
// Log metrics
logger.info('AI Processing Complete', {
  tasksExtracted: result.tasks.length,
  decisionsFound: result.decisions.length,
  processingTime: endTime - startTime,
  modelUsed: 'gpt-4-turbo-preview',
  tokenCount: response.usage?.total_tokens,
});
```

## Best Practices

1. **Provide Context**: Include meeting title when available
2. **Clean Transcripts**: Remove excessive filler words
3. **Speaker Labels**: Helps identify assignees
4. **Current Date**: Always provide for accurate relative dates
5. **Validate Output**: Check for empty or invalid tasks
6. **Handle Errors**: Always wrap in try-catch

## Future Enhancements

- [ ] Multi-language support
- [ ] Custom task templates per team
- [ ] Learning from user edits
- [ ] Confidence scores for tasks
- [ ] Auto-categorization by project
- [ ] Sentiment analysis for team morale

---

**Questions?** Check the code in:
- `src/services/aiServiceEnhanced.ts` - Main processing logic
- `src/utils/aiPrompts.ts` - Prompt templates
