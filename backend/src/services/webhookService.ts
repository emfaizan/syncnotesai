import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AIService } from './integrations/aiService';
import { TaskService } from './taskService';

export class WebhookService {
  private aiService: AIService;
  private taskService: TaskService;

  constructor() {
    this.aiService = new AIService();
    this.taskService = new TaskService();
  }

  async processRecallWebhook(payload: any) {
    const { event, data } = payload;

    logger.info(`Processing Recall webhook: ${event}`, { data });

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

      default:
        logger.warn(`Unknown webhook event: ${event}`);
    }
  }

  private async handleBotStatusChange(data: any) {
    const { bot_id, status } = data;

    logger.info(`Bot ${bot_id} status changed to ${status}`);

    // Update meeting status based on bot status
    const meeting = await prisma.meeting.findFirst({
      where: { recallBotId: bot_id },
    });

    if (meeting) {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { status },
      });
    }
  }

  private async handleTranscriptReady(data: any) {
    const { bot_id, transcript } = data;

    logger.info(`Transcript ready for bot ${bot_id}`);

    // Find meeting
    const meeting = await prisma.meeting.findFirst({
      where: { recallBotId: bot_id },
    });

    if (!meeting) {
      logger.error(`Meeting not found for bot ${bot_id}`);
      return;
    }

    // Save transcript
    await prisma.transcript.create({
      data: {
        meetingId: meeting.id,
        content: transcript,
      },
    });

    // Generate summary and extract tasks
    await this.processMeetingTranscript(meeting.id, transcript);
  }

  private async handleRecordingReady(data: any) {
    const { bot_id, recording_url } = data;

    logger.info(`Recording ready for bot ${bot_id}`);

    // Update meeting with recording URL
    const meeting = await prisma.meeting.findFirst({
      where: { recallBotId: bot_id },
    });

    if (meeting) {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          recordingUrl: recording_url,
          status: 'completed',
        },
      });
    }
  }

  private async processMeetingTranscript(meetingId: string, transcript: string) {
    try {
      // Generate summary
      const summary = await this.aiService.generateSummary(transcript);

      await prisma.summary.create({
        data: {
          meetingId,
          content: summary,
        },
      });

      // Extract tasks
      const tasks = await this.aiService.extractTasks(transcript);

      for (const task of tasks) {
        await prisma.task.create({
          data: {
            meetingId,
            title: task.title,
            description: task.description,
            priority: task.priority || 'medium',
            dueDate: task.dueDate,
          },
        });
      }

      logger.info(`Processed transcript for meeting ${meetingId}: ${tasks.length} tasks extracted`);
    } catch (error) {
      logger.error(`Error processing transcript for meeting ${meetingId}:`, error);
      throw error;
    }
  }
}
