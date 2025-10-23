import OpenAI from 'openai';
import { logger } from '../utils/logger';

export interface MeetingSummary {
  overview: string;
  keyPoints: string[];
  decisions: string[];
  blockers: string[];
  nextSteps: string[];
}

export interface ActionItem {
  title: string;
  description: string;
  assignee: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string | null;
  estimatedDuration?: string;
}

class AIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      logger.error('OPENAI_API_KEY is not set');
      throw new Error('OpenAI API key is required');
    }

    this.openai = new OpenAI({
      apiKey,
    });
  }

  /**
   * Generate meeting summary from transcript
   */
  async generateSummary(transcript: string, meetingTitle?: string): Promise<MeetingSummary> {
    try {
      logger.info('Generating meeting summary');

      const systemPrompt = `You are an AI assistant specialized in analyzing meeting transcripts.
Your task is to create comprehensive meeting summaries that are clear, actionable, and well-organized.
Focus on extracting the most important information including key discussion points, decisions made,
blockers identified, and next steps.`;

      const userPrompt = `Analyze the following meeting transcript${meetingTitle ? ` for "${meetingTitle}"` : ''} and provide a structured summary:

${transcript}

Please provide a JSON response with the following structure:
{
  "overview": "A concise 2-3 sentence overview of the meeting",
  "keyPoints": ["Array of key discussion points"],
  "decisions": ["Array of decisions made during the meeting"],
  "blockers": ["Array of blockers or challenges identified"],
  "nextSteps": ["Array of next steps or follow-up actions"]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const summary: MeetingSummary = JSON.parse(content);
      logger.info('Meeting summary generated successfully');

      return summary;
    } catch (error: any) {
      logger.error('Failed to generate meeting summary', { error: error.message });
      throw new Error(`Failed to generate meeting summary: ${error.message}`);
    }
  }

  /**
   * Extract action items from transcript
   */
  async extractActionItems(transcript: string, summary?: MeetingSummary): Promise<ActionItem[]> {
    try {
      logger.info('Extracting action items from transcript');

      const systemPrompt = `You are an AI assistant specialized in identifying and extracting action items from meeting transcripts.
Your task is to identify specific tasks, assignments, and deliverables mentioned during the meeting.
Be precise about assignees, deadlines, and priorities when they are mentioned.`;

      const contextInfo = summary
        ? `\n\nMeeting Summary Context:\nOverview: ${summary.overview}\nKey Points: ${summary.keyPoints.join(', ')}`
        : '';

      const userPrompt = `Analyze the following meeting transcript and extract all action items:${contextInfo}

${transcript}

For each action item, identify:
- A clear, actionable title
- Detailed description of what needs to be done
- The assignee (person responsible), if mentioned
- Priority level (low, medium, high, or urgent)
- Due date or deadline, if mentioned
- Estimated duration or effort, if mentioned

Please provide a JSON response with an array of action items:
{
  "actionItems": [
    {
      "title": "Clear, actionable title",
      "description": "Detailed description",
      "assignee": "Name or null if not mentioned",
      "priority": "low|medium|high|urgent",
      "dueDate": "ISO date string or null if not mentioned",
      "estimatedDuration": "Duration string or null"
    }
  ]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
        max_tokens: 2500,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      const result = JSON.parse(content);
      const actionItems: ActionItem[] = result.actionItems || [];

      logger.info('Action items extracted successfully', { count: actionItems.length });
      return actionItems;
    } catch (error: any) {
      logger.error('Failed to extract action items', { error: error.message });
      throw new Error(`Failed to extract action items: ${error.message}`);
    }
  }

  /**
   * Process complete meeting - generate summary and extract action items
   */
  async processMeeting(
    transcript: string,
    meetingTitle?: string
  ): Promise<{
    summary: MeetingSummary;
    actionItems: ActionItem[];
  }> {
    try {
      logger.info('Processing complete meeting with AI');

      // Generate summary first
      const summary = await this.generateSummary(transcript, meetingTitle);

      // Extract action items with summary context
      const actionItems = await this.extractActionItems(transcript, summary);

      logger.info('Meeting processing completed', {
        actionItemsCount: actionItems.length,
      });

      return {
        summary,
        actionItems,
      };
    } catch (error: any) {
      logger.error('Failed to process meeting', { error: error.message });
      throw new Error(`Failed to process meeting: ${error.message}`);
    }
  }

  /**
   * Enhance action item description with AI
   */
  async enhanceActionItem(title: string, context: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that helps create clear, detailed action item descriptions.',
          },
          {
            role: 'user',
            content: `Given this task title: "${title}"

And this context from a meeting: "${context}"

Create a clear, detailed description for this action item that includes:
- What needs to be done
- Why it's important (if clear from context)
- Any relevant details or requirements

Keep it concise but informative (2-3 sentences).`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      return response.choices[0].message.content || title;
    } catch (error: any) {
      logger.error('Failed to enhance action item', { error: error.message });
      return title;
    }
  }
}

export const aiService = new AIService();
