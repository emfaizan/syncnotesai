import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

export class RecallService {
  private client: AxiosInstance;

  constructor() {
    const apiKey = process.env.RECALL_API_KEY;
    const apiUrl = process.env.API_BASE_URL || 'https://us-west-2.recall.ai';

    if (!apiKey) {
      throw new Error('RECALL_API_KEY is not configured');
    }

    this.client = axios.create({
      baseURL: `${apiUrl}/api/v1`,
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Start a bot to record a meeting
   */
  async startRecording(meetingUrl: string) {
    try {
      logger.info(`Starting Recall bot for meeting: ${meetingUrl}`);

      const response = await this.client.post('/bot/', {
        meeting_url: meetingUrl,
        bot_name: 'SyncNotesAI',
        recording_config: {
          transcript: {
            provider: {
              recallai_streaming: {
                language_code: 'auto',
                mode: 'prioritize_accuracy',
              },
            },
          },
          video_mixed_layout: 'speaker_view',
        },
      });

      logger.info(`Recall bot started: ${response.data.id}`);

      return response.data;
    } catch (error: any) {
      logger.error('Error starting Recall bot:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
      });
      throw new AppError('Failed to start recording', 500);
    }
  }

  /**
   * Stop a recording bot
   */
  async stopRecording(botId: string) {
    try {
      logger.info(`Stopping Recall bot: ${botId}`);

      await this.client.delete(`/bots/${botId}`);

      logger.info(`Recall bot stopped: ${botId}`);
    } catch (error: any) {
      logger.error('Error stopping Recall bot:', error.response?.data || error.message);
      throw new AppError('Failed to stop recording', 500);
    }
  }

  /**
   * Get bot status
   */
  async getBotStatus(botId: string) {
    try {
      const response = await this.client.get(`/bots/${botId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Error getting bot status:', error.response?.data || error.message);
      throw new AppError('Failed to get bot status', 500);
    }
  }

  /**
   * Get transcript for a bot
   */
  async getTranscript(botId: string) {
    try {
      const response = await this.client.get(`/bots/${botId}/transcript`);
      return response.data;
    } catch (error: any) {
      logger.error('Error getting transcript:', error.response?.data || error.message);
      throw new AppError('Failed to get transcript', 500);
    }
  }
}
