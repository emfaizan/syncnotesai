/**
 * AI Prompt Templates for Meeting Processing
 *
 * These prompts are carefully crafted to extract structured data from meeting transcripts
 * following SyncNotesAI's specific format and requirements.
 */

export const SYSTEM_PROMPT = `You are an expert AI assistant specialized in analyzing meeting transcripts for SyncNotesAI.

Your role is to:
1. Extract key information from meeting discussions
2. Identify actionable items and decisions made
3. Detect deadlines and due dates mentioned
4. Structure the output in a clear, consistent JSON format

Guidelines:
- Use clear, actionable language for all items
- Avoid duplicates or vague descriptions
- Be specific about who is responsible when mentioned
- Detect and normalize relative dates (e.g., "tomorrow", "next week", "end of month")
- Prioritize tasks based on urgency and context
- Only include information explicitly discussed in the meeting
- If a detail is unclear, omit it rather than guessing`;

export const MEETING_ANALYSIS_PROMPT = `Analyze the following meeting transcript and extract structured information.

TRANSCRIPT:
{transcript}

Extract the following information and return it in JSON format:

{
  "summary": "A concise 2-3 sentence summary of the main discussion points and outcomes",
  "decisions": [
    "Clear statement of each decision made during the meeting"
  ],
  "tasks": [
    {
      "title": "Clear, actionable task title",
      "description": "Detailed description of what needs to be done",
      "assignee": "Name of person responsible (if mentioned, otherwise null)",
      "due_date": "ISO date string if deadline mentioned (YYYY-MM-DD), otherwise null",
      "priority": "urgent|high|medium|low based on context",
      "estimated_duration": "Time estimate if mentioned (e.g., '2 hours', '1 day')"
    }
  ],
  "key_points": [
    "Important discussion point or topic covered"
  ],
  "blockers": [
    "Any obstacles or issues identified that need resolution"
  ],
  "next_steps": [
    "General next steps or follow-up actions mentioned"
  ],
  "attendees": [
    "Names of people mentioned or participating (if identifiable)"
  ]
}

IMPORTANT RULES:
1. **Actionable Language**: Use clear, specific verbs (e.g., "Schedule call with...", "Review document...", "Send email to...")
2. **No Duplicates**: If the same task is mentioned multiple times, include it only once
3. **No Vague Items**: Avoid tasks like "Follow up" without specifics - include who/what/when
4. **Date Detection**: Parse relative dates accurately:
   - "tomorrow" → next day
   - "next Friday" → upcoming Friday
   - "end of week" → this Friday
   - "next week" → following Monday
   - "by EOD" → today
   - "in 2 weeks" → 14 days from now
5. **Priority Assessment**:
   - urgent: Deadline today or tomorrow, critical issues
   - high: Deadline this week, important deliverables
   - medium: Deadline next week or later, standard tasks
   - low: No specific deadline, nice-to-have items
6. **Specificity**: Include relevant context in task descriptions

Today's date for reference: {current_date}

Return ONLY the JSON object, no additional text.`;

export const TASK_ENHANCEMENT_PROMPT = `Given this task from a meeting transcript, enhance it with more details and context.

ORIGINAL TASK: {task_title}
MEETING CONTEXT: {context}

Provide an enhanced version with:
1. Clear, specific action verb
2. Who should do it (if mentioned)
3. What exactly needs to be done
4. Why it's important (if clear from context)
5. Any relevant details or requirements

Return a JSON object:
{
  "enhanced_title": "Improved task title",
  "description": "Detailed description with context",
  "suggested_priority": "urgent|high|medium|low",
  "reasoning": "Brief explanation of priority assessment"
}`;

export const SUMMARY_REFINEMENT_PROMPT = `Refine this meeting summary to be more concise and impactful.

ORIGINAL SUMMARY:
{original_summary}

KEY POINTS:
{key_points}

Create a refined summary that:
1. Captures the essence in 2-3 sentences max
2. Highlights the most important outcomes
3. Uses professional, clear language
4. Avoids redundancy
5. Focuses on what was decided or accomplished

Return only the refined summary text.`;

/**
 * Date normalization utilities
 */
export const DATE_PATTERNS = {
  today: /\b(today|this evening|tonight|EOD|end of day)\b/i,
  tomorrow: /\b(tomorrow)\b/i,
  nextDay: /\b(next (monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i,
  endOfWeek: /\b(end of (this )?week|this friday)\b/i,
  nextWeek: /\b(next week|following week)\b/i,
  endOfMonth: /\b(end of (this )?month)\b/i,
  nextMonth: /\b(next month)\b/i,
  inDays: /\bin (\d+) days?\b/i,
  inWeeks: /\bin (\d+) weeks?\b/i,
  specificDate: /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/,
};

/**
 * Helper function to normalize relative dates to ISO format
 */
export function normalizeDateMention(mention: string, referenceDate: Date = new Date()): string | null {
  const lowerMention = mention.toLowerCase();

  // Today
  if (DATE_PATTERNS.today.test(lowerMention)) {
    return referenceDate.toISOString().split('T')[0];
  }

  // Tomorrow
  if (DATE_PATTERNS.tomorrow.test(lowerMention)) {
    const tomorrow = new Date(referenceDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // End of week (Friday)
  if (DATE_PATTERNS.endOfWeek.test(lowerMention)) {
    const endOfWeek = new Date(referenceDate);
    const daysUntilFriday = (5 - endOfWeek.getDay() + 7) % 7 || 7;
    endOfWeek.setDate(endOfWeek.getDate() + daysUntilFriday);
    return endOfWeek.toISOString().split('T')[0];
  }

  // Next week (Monday)
  if (DATE_PATTERNS.nextWeek.test(lowerMention)) {
    const nextWeek = new Date(referenceDate);
    const daysUntilMonday = (8 - nextWeek.getDay()) % 7 || 7;
    nextWeek.setDate(nextWeek.getDate() + daysUntilMonday);
    return nextWeek.toISOString().split('T')[0];
  }

  // In X days
  const inDaysMatch = lowerMention.match(DATE_PATTERNS.inDays);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1]);
    const futureDate = new Date(referenceDate);
    futureDate.setDate(futureDate.getDate() + days);
    return futureDate.toISOString().split('T')[0];
  }

  // In X weeks
  const inWeeksMatch = lowerMention.match(DATE_PATTERNS.inWeeks);
  if (inWeeksMatch) {
    const weeks = parseInt(inWeeksMatch[1]);
    const futureDate = new Date(referenceDate);
    futureDate.setDate(futureDate.getDate() + weeks * 7);
    return futureDate.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Example usage in processing
 */
export function buildMeetingAnalysisPrompt(transcript: string): string {
  const currentDate = new Date().toISOString().split('T')[0];
  return MEETING_ANALYSIS_PROMPT
    .replace('{transcript}', transcript)
    .replace('{current_date}', currentDate);
}

export function buildTaskEnhancementPrompt(taskTitle: string, context: string): string {
  return TASK_ENHANCEMENT_PROMPT
    .replace('{task_title}', taskTitle)
    .replace('{context}', context);
}

export function buildSummaryRefinementPrompt(summary: string, keyPoints: string[]): string {
  return SUMMARY_REFINEMENT_PROMPT
    .replace('{original_summary}', summary)
    .replace('{key_points}', keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n'));
}
