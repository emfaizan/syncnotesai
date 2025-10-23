import OpenAI from 'openai';
import { logger } from '../utils/logger';
import {
  SYSTEM_PROMPT,
  buildMeetingAnalysisPrompt,
  normalizeDateMention,
} from '../utils/aiPrompts';

export interface MeetingAnalysisResult {
  summary: string;
  decisions: string[];
  tasks: Array<{
    title: string;
    description: string;
    assignee: string | null;
    due_date: string | null;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    estimated_duration: string | null;
  }>;
  key_points: string[];
  blockers: string[];
  next_steps: string[];
  attendees: string[];
}

class AIServiceEnhanced {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      logger.error('OPENAI_API_KEY is not set');
      throw new Error('OpenAI API key is required');
    }

    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Process meeting transcript with enhanced AI analysis
   * Returns structured data following SyncNotesAI format
   */
  async processMeetingTranscript(transcript: string): Promise<MeetingAnalysisResult> {
    try {
      logger.info('Processing meeting transcript with enhanced AI');

      const userPrompt = buildMeetingAnalysisPrompt(transcript);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for more consistent output
        max_tokens: 3000,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const result: MeetingAnalysisResult = JSON.parse(content);

      // Post-process dates to ensure proper formatting
      result.tasks = result.tasks.map((task) => ({
        ...task,
        due_date: task.due_date ? this.normalizeDateString(task.due_date) : null,
      }));

      // Validate and clean the output
      this.validateAndCleanResult(result);

      logger.info('Meeting transcript processed successfully', {
        tasksCount: result.tasks.length,
        decisionsCount: result.decisions.length,
      });

      return result;
    } catch (error: any) {
      logger.error('Failed to process meeting transcript', { error: error.message });
      throw new Error(`Failed to process meeting transcript: ${error.message}`);
    }
  }

  /**
   * Validate and clean the AI result
   * Removes duplicates, validates data, ensures quality
   */
  private validateAndCleanResult(result: MeetingAnalysisResult): void {
    // Remove duplicate tasks (same title)
    const uniqueTasks = new Map();
    result.tasks.forEach((task) => {
      const key = task.title.toLowerCase().trim();
      if (!uniqueTasks.has(key)) {
        uniqueTasks.set(key, task);
      }
    });
    result.tasks = Array.from(uniqueTasks.values());

    // Remove duplicate decisions
    result.decisions = [...new Set(result.decisions.map((d) => d.trim()))];

    // Remove duplicate key points
    result.key_points = [...new Set(result.key_points.map((p) => p.trim()))];

    // Remove empty or invalid items
    result.tasks = result.tasks.filter((task) => task.title && task.title.length > 5);
    result.decisions = result.decisions.filter((d) => d && d.length > 10);
    result.key_points = result.key_points.filter((p) => p && p.length > 10);

    // Ensure summary is concise
    if (result.summary && result.summary.split('.').length > 4) {
      const sentences = result.summary.split('.').slice(0, 3);
      result.summary = sentences.join('.') + '.';
    }
  }

  /**
   * Normalize date string to ISO format (YYYY-MM-DD)
   */
  private normalizeDateString(dateStr: string): string | null {
    try {
      // If already in ISO format, validate and return
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return dateStr;
        }
      }

      // Try to parse with Date constructor
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }

      // Try relative date patterns
      const normalized = normalizeDateMention(dateStr);
      if (normalized) {
        return normalized;
      }

      return null;
    } catch (error) {
      logger.warn('Failed to normalize date string', { dateStr });
      return null;
    }
  }

  /**
   * Extract only tasks from transcript (faster, focused extraction)
   */
  async extractTasksOnly(transcript: string): Promise<MeetingAnalysisResult['tasks']> {
    try {
      const prompt = `Extract actionable tasks from this meeting transcript.

TRANSCRIPT:
${transcript}

Return a JSON array of tasks:
[
  {
    "title": "Clear, actionable task",
    "description": "What needs to be done",
    "assignee": "Person responsible or null",
    "due_date": "YYYY-MM-DD or null",
    "priority": "urgent|high|medium|low",
    "estimated_duration": "Time estimate or null"
  }
]

Rules:
- Use specific action verbs
- No vague or duplicate tasks
- Detect deadlines from context
- Today's date: ${new Date().toISOString().split('T')[0]}

Return ONLY the JSON array.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const parsed = JSON.parse(content);
      const tasks = Array.isArray(parsed) ? parsed : parsed.tasks || [];

      return tasks.map((task: any) => ({
        ...task,
        due_date: task.due_date ? this.normalizeDateString(task.due_date) : null,
      }));
    } catch (error: any) {
      logger.error('Failed to extract tasks', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate a quick summary (faster, less detailed)
   */
  async generateQuickSummary(transcript: string): Promise<string> {
    try {
      const prompt = `Summarize this meeting in 2-3 clear, concise sentences:

${transcript}

Focus on: What was discussed, what was decided, and what happens next.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a concise meeting summarizer.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 200,
      });

      return response.choices[0].message.content || 'No summary generated.';
    } catch (error: any) {
      logger.error('Failed to generate quick summary', { error: error.message });
      throw error;
    }
  }
}

export const aiServiceEnhanced = new AIServiceEnhanced();
