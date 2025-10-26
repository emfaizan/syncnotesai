import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface RecallBotConfig {
  platform: 'zoom' | 'google_meet' | 'microsoft_teams';
  join_url: string;
  webhook_url: string;
  bot_name?: string;
  recording_mode?: 'speaker_view' | 'gallery_view' | 'audio_only';
  transcription_options?: {
    provider: 'meeting_captions' | 'whisper';
  };
  real_time_transcription?: {
    destination_url?: string;
  };
  automatic_leave?: {
    waiting_room_timeout?: number;
    noone_joined_timeout?: number;
  };
}

export interface RecallBot {
  id: string;
  status: string;
  meeting_url: string;
  bot_name: string;
  join_at?: string;
  recording?: {
    id: string;
    status: string;
  };
  media_retention_end?: string;
}

export interface RecallTranscript {
  id: string;
  bot_id: string;
  words: Array<{
    start_time: number;
    end_time: number;
    text: string;
    speaker: string;
  }>;
}

class RecallService {
  private client: AxiosInstance;
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.RECALL_API_KEY || '';
    this.baseURL = 'https://us-west-2.recall.ai/api/v1';

    if (!this.apiKey) {
      logger.error('RECALL_API_KEY is not set');
      throw new Error('Recall API key is required');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.info('Recall API Response', {
          url: response.config.url,
          status: response.status,
        });
        return response;
      },
      (error) => {
        logger.error('Recall API Error', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  /**
   * Start a bot to join a meeting
   * POST https://us-west-2.recall.ai/api/v1/bot/start/
   */
  async startBot(config: RecallBotConfig): Promise<RecallBot> {
    try {
      logger.info('Starting Recall bot', {
        platform: config.platform,
        join_url: config.join_url
      });

      const payload = {
        meeting_url: config.join_url,
        bot_name: config.bot_name || 'SyncNotesAI',
        recording_mode: config.recording_mode || 'speaker_view',
        transcription_options: config.transcription_options || {
          provider: 'whisper',
        },
        real_time_transcription: config.real_time_transcription || {},
        automatic_leave: config.automatic_leave || {
          waiting_room_timeout: 600,
          noone_joined_timeout: 300,
        },
        webhook_url: config.webhook_url,
      };

      const response = await this.client.post('/bot/start/', payload);

      logger.info('Recall bot started successfully', { bot_id: response.data.id });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to start Recall bot', { error: error.message });
      throw new Error(`Failed to start Recall bot: ${error.message}`);
    }
  }

  /**
   * Legacy method - redirects to startBot
   * @deprecated Use startBot instead
   */
  async createBot(config: RecallBotConfig): Promise<RecallBot> {
    return this.startBot(config);
  }

  /**
   * Get bot status and details
   */
  async getBot(botId: string): Promise<RecallBot> {
    try {
      const response = await this.client.get(`/bot/${botId}/`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get Recall bot', { botId, error: error.message });
      throw new Error(`Failed to get Recall bot: ${error.message}`);
    }
  }

  /**
   * Get bot transcript
   */
  async getTranscript(botId: string): Promise<RecallTranscript> {
    try {
      const response = await this.client.get(`/bot/${botId}/transcript/`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get transcript', { botId, error: error.message });
      throw new Error(`Failed to get transcript: ${error.message}`);
    }
  }

  /**
   * Get formatted transcript as text
   */
  async getFormattedTranscript(botId: string): Promise<string> {
    try {
      const transcript = await this.getTranscript(botId);

      // Group words by speaker and format
      let formattedText = '';
      let currentSpeaker = '';
      let currentText = '';

      for (const word of transcript.words) {
        if (word.speaker !== currentSpeaker) {
          if (currentText) {
            formattedText += `${currentSpeaker}: ${currentText.trim()}\n\n`;
          }
          currentSpeaker = word.speaker;
          currentText = '';
        }
        currentText += word.text + ' ';
      }

      // Add the last speaker's text
      if (currentText) {
        formattedText += `${currentSpeaker}: ${currentText.trim()}\n\n`;
      }

      return formattedText;
    } catch (error: any) {
      logger.error('Failed to format transcript', { botId, error: error.message });
      throw new Error(`Failed to format transcript: ${error.message}`);
    }
  }

  /**
   * Get recording video/audio URL
   */
  async getRecordingUrl(botId: string): Promise<string | null> {
    try {
      const bot = await this.getBot(botId);

      if (bot.recording && bot.recording.id) {
        const response = await this.client.get(`/recording/${bot.recording.id}/`);
        return response.data.video_url || response.data.audio_url || null;
      }

      return null;
    } catch (error: any) {
      logger.error('Failed to get recording URL', { botId, error: error.message });
      return null;
    }
  }

  /**
   * Delete a bot (remove from meeting)
   */
  async deleteBot(botId: string): Promise<void> {
    try {
      await this.client.delete(`/bot/${botId}/`);
      logger.info('Recall bot deleted successfully', { botId });
    } catch (error: any) {
      logger.error('Failed to delete Recall bot', { botId, error: error.message });
      throw new Error(`Failed to delete Recall bot: ${error.message}`);
    }
  }

  /**
   * Calculate meeting duration from transcript
   */
  calculateDuration(transcript: RecallTranscript): number {
    if (!transcript.words || transcript.words.length === 0) {
      return 0;
    }

    const startTime = transcript.words[0].start_time;
    const endTime = transcript.words[transcript.words.length - 1].end_time;

    // Convert seconds to minutes
    return Math.ceil((endTime - startTime) / 60);
  }

  /**
   * Check if bot is ready (recording completed)
   */
  async isBotReady(botId: string): Promise<boolean> {
    try {
      const bot = await this.getBot(botId);
      return bot.status === 'done' || bot.status === 'fatal';
    } catch (error) {
      return false;
    }
  }

  /**
   * Download audio file from recording
   */
  async downloadAudio(botId: string): Promise<Buffer | null> {
    try {
      const bot = await this.getBot(botId);

      if (!bot.recording?.id) {
        logger.warn('No recording found for bot', { botId });
        return null;
      }

      const response = await this.client.get(`/recording/${bot.recording.id}/`);
      const audioUrl = response.data.audio_url;

      if (!audioUrl) {
        logger.warn('No audio URL found for recording', { botId });
        return null;
      }

      // Download the audio file
      const audioResponse = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
      });

      logger.info('Audio downloaded successfully', { botId, size: audioResponse.data.length });
      return Buffer.from(audioResponse.data);
    } catch (error: any) {
      logger.error('Failed to download audio', { botId, error: error.message });
      return null;
    }
  }

  /**
   * Download video file from recording
   */
  async downloadVideo(botId: string): Promise<Buffer | null> {
    try {
      const bot = await this.getBot(botId);

      if (!bot.recording?.id) {
        logger.warn('No recording found for bot', { botId });
        return null;
      }

      const response = await this.client.get(`/recording/${bot.recording.id}/`);
      const videoUrl = response.data.video_url;

      if (!videoUrl) {
        logger.warn('No video URL found for recording', { botId });
        return null;
      }

      // Download the video file
      const videoResponse = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
      });

      logger.info('Video downloaded successfully', { botId, size: videoResponse.data.length });
      return Buffer.from(videoResponse.data);
    } catch (error: any) {
      logger.error('Failed to download video', { botId, error: error.message });
      return null;
    }
  }

  /**
   * Get recording details (audio/video URLs and metadata)
   */
  async getRecordingDetails(botId: string): Promise<{
    audio_url?: string;
    video_url?: string;
    duration?: number;
    size?: number;
    status?: string;
  } | null> {
    try {
      const bot = await this.getBot(botId);

      if (!bot.recording?.id) {
        return null;
      }

      const response = await this.client.get(`/recording/${bot.recording.id}/`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get recording details', { botId, error: error.message });
      return null;
    }
  }

  /**
   * Delete recording data (audio/video/transcript)
   * Should be called after 7 days or when user requests deletion
   */
  async deleteRecording(botId: string): Promise<boolean> {
    try {
      const bot = await this.getBot(botId);

      if (!bot.recording?.id) {
        logger.warn('No recording to delete', { botId });
        return false;
      }

      await this.client.delete(`/recording/${bot.recording.id}/`);
      logger.info('Recording deleted successfully', { botId, recordingId: bot.recording.id });
      return true;
    } catch (error: any) {
      logger.error('Failed to delete recording', { botId, error: error.message });
      return false;
    }
  }

  /**
   * Schedule recording deletion after specified days
   * @param botId - Bot ID
   * @param daysUntilDeletion - Number of days before deletion (default: 7)
   */
  async scheduleRecordingDeletion(botId: string, daysUntilDeletion: number = 7): Promise<Date> {
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + daysUntilDeletion);

    logger.info('Recording deletion scheduled', {
      botId,
      deletionDate: deletionDate.toISOString(),
    });

    return deletionDate;
  }
}

export const recallService = new RecallService();
