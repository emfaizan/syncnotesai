import OpenAI from 'openai';
import { logger } from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

interface ExtractedTask {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  assignee?: string;
}

export class AIService {
  private openai: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.openai = new OpenAI({ apiKey });
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
  }

  /**
   * Generate a summary from meeting transcript
   */
  async generateSummary(transcript: string): Promise<string> {
    try {
      logger.info('Generating meeting summary with AI');

      const prompt = `Please analyze the following meeting transcript and provide a concise summary.
Include:
1. Main topics discussed
2. Key decisions made
3. Important points raised
4. Next steps

Transcript:
${transcript}`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at summarizing meeting transcripts. Provide clear, concise summaries that capture the most important information.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      });

      const summary = response.choices[0].message.content || '';
      logger.info('Meeting summary generated successfully');

      return summary;
    } catch (error: any) {
      logger.error('Error generating summary:', error.message);
      throw new AppError('Failed to generate summary', 500);
    }
  }

  /**
   * Extract actionable tasks from meeting transcript
   */
  async extractTasks(transcript: string): Promise<ExtractedTask[]> {
    try {
      logger.info('Extracting tasks from transcript with AI');

      const prompt = `Analyze the following meeting transcript and extract all actionable tasks, action items, and to-dos mentioned.

For each task, provide:
1. A clear, concise title
2. Description (if applicable)
3. Priority (low, medium, or high) based on urgency mentioned
4. Any mentioned deadlines or due dates
5. Assignee (if specifically mentioned)

Return the tasks as a JSON array. If no tasks are found, return an empty array.

Format:
[
  {
    "title": "Task title",
    "description": "Task description",
    "priority": "medium",
    "dueDate": "2024-01-15",
    "assignee": "John"
  }
]

Transcript:
${transcript}`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting actionable tasks from meeting transcripts. Extract all tasks, action items, and to-dos mentioned. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
        temperature: 0.3, // Lower temperature for more consistent JSON output
      });

      const content = response.choices[0].message.content || '[]';

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      const jsonString = jsonMatch[1] || content;

      const tasks: ExtractedTask[] = JSON.parse(jsonString.trim());

      // Parse dates
      const parsedTasks = tasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      }));

      logger.info(`Extracted ${parsedTasks.length} tasks from transcript`);

      return parsedTasks;
    } catch (error: any) {
      logger.error('Error extracting tasks:', error.message);
      // Return empty array instead of throwing error to prevent webhook failure
      return [];
    }
  }

  /**
   * Generate meeting insights
   */
  async generateInsights(transcript: string): Promise<string> {
    try {
      logger.info('Generating meeting insights with AI');

      const prompt = `Analyze the following meeting transcript and provide key insights:
1. Overall sentiment and tone
2. Team dynamics and participation
3. Potential blockers or concerns
4. Suggestions for improvement

Transcript:
${transcript}`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert meeting analyst. Provide thoughtful insights about meeting dynamics and effectiveness.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1500'),
        temperature: 0.7,
      });

      const insights = response.choices[0].message.content || '';
      logger.info('Meeting insights generated successfully');

      return insights;
    } catch (error: any) {
      logger.error('Error generating insights:', error.message);
      throw new AppError('Failed to generate insights', 500);
    }
  }
}
