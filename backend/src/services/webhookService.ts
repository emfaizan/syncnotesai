import prisma from '../config/database';
import { logger } from '../utils/logger';
import { aiServiceEnhanced } from './aiServiceEnhanced';
import { recallService } from './recallService';
import { billingService } from './billingService';

export interface RecallWebhookPayload {
  event: 'bot.status_change' | 'transcript.ready' | 'recording.ready' | 'bot.error';
  data: {
    bot_id: string;
    status?: string;
    transcript?: string;
    recording_url?: string;
    error?: string;
    [key: string]: any;
  };
}

export class WebhookService {
  /**
   * Main entry point for Recall.ai webhooks
   * Receives webhook at /webhook/recall when recording completes
   */
  async processRecallWebhook(payload: RecallWebhookPayload) {
    const { event, data } = payload;

    logger.info(`Processing Recall webhook: ${event}`, { bot_id: data.bot_id });

    try {
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

        default:
          logger.warn(`Unknown webhook event: ${event}`);
      }
    } catch (error: any) {
      logger.error('Error processing Recall webhook', {
        event,
        bot_id: data.bot_id,
        error: error.message,
      });
      throw error;
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
    const { bot_id } = data;

    logger.info(`Transcript ready for bot ${bot_id}`);

    // Find meeting
    const meeting = await prisma.meeting.findFirst({
      where: { recallBotId: bot_id },
      include: { user: true },
    });

    if (!meeting) {
      logger.error(`Meeting not found for bot ${bot_id}`);
      return;
    }

    try {
      // Retrieve transcript from Recall.ai API
      const transcriptText = await recallService.getFormattedTranscript(bot_id);

      // Save raw transcript
      await prisma.transcript.create({
        data: {
          meetingId: meeting.id,
          content: transcriptText,
        },
      });

      logger.info(`Transcript saved for meeting ${meeting.id}`);

      // Pass transcript to AI Summarization module
      await this.processMeetingTranscript(meeting.id, transcriptText, meeting.userId);
    } catch (error: any) {
      logger.error('Error handling transcript ready', {
        bot_id,
        error: error.message,
      });

      // Update meeting status to error
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { status: 'error' },
      });
    }
  }

  private async handleRecordingReady(data: any) {
    const { bot_id } = data;

    logger.info(`Recording ready for bot ${bot_id}`);

    // Find meeting
    const meeting = await prisma.meeting.findFirst({
      where: { recallBotId: bot_id },
      include: { user: true },
    });

    if (!meeting) {
      logger.error(`Meeting not found for bot ${bot_id}`);
      return;
    }

    try {
      // Get recording details (audio/video URLs)
      const recordingDetails = await recallService.getRecordingDetails(bot_id);

      if (recordingDetails) {
        // Calculate meeting duration for billing
        const transcript = await recallService.getTranscript(bot_id);
        const durationMinutes = recallService.calculateDuration(transcript);

        // Update meeting with recording info
        await prisma.meeting.update({
          where: { id: meeting.id },
          data: {
            recordingUrl: recordingDetails.video_url || recordingDetails.audio_url,
            duration: durationMinutes,
            status: 'completed',
          },
        });

        // Deduct credits for meeting duration
        await billingService.deductCredits(
          meeting.userId,
          durationMinutes,
          meeting.id
        );

        // Schedule recording deletion after 7 days (unless user opts for retention)
        const user = meeting.user;
        const retentionDays = user.recordingRetentionDays || 7;
        const deletionDate = await recallService.scheduleRecordingDeletion(
          bot_id,
          retentionDays
        );

        // Store deletion date in database
        await prisma.meeting.update({
          where: { id: meeting.id },
          data: { recordingDeletionDate: deletionDate },
        });

        logger.info(`Recording scheduled for deletion on ${deletionDate.toISOString()}`, {
          meetingId: meeting.id,
          bot_id,
        });
      }
    } catch (error: any) {
      logger.error('Error handling recording ready', {
        bot_id,
        error: error.message,
      });
    }
  }

  private async handleBotError(data: any) {
    const { bot_id, error } = data;

    logger.error(`Bot error for ${bot_id}`, { error });

    const meeting = await prisma.meeting.findFirst({
      where: { recallBotId: bot_id },
    });

    if (meeting) {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          status: 'error',
          errorMessage: error,
        },
      });
    }
  }

  /**
   * Process meeting transcript with AI
   * Pass transcript to AI Summarization module
   */
  private async processMeetingTranscript(
    meetingId: string,
    transcript: string,
    userId: string
  ) {
    try {
      logger.info(`Processing transcript for meeting ${meetingId}`);

      // Use enhanced AI service to process transcript
      const analysis = await aiServiceEnhanced.processMeetingTranscript(transcript);

      // Format and save summary
      const summaryContent = this.formatSummary(analysis);
      await prisma.summary.create({
        data: {
          meetingId,
          content: summaryContent,
        },
      });

      // Save extracted tasks
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
            status: 'pending',
          },
        });
      }

      logger.info(`Processed transcript for meeting ${meetingId}`, {
        tasksCount: analysis.tasks.length,
        decisionsCount: analysis.decisions.length,
      });

      // Update meeting status
      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: 'processed' },
      });
    } catch (error: any) {
      logger.error(`Error processing transcript for meeting ${meetingId}`, {
        error: error.message,
      });

      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: 'error' },
      });

      throw error;
    }
  }

  /**
   * Format AI analysis into readable summary
   */
  private formatSummary(analysis: any): string {
    let summary = `# Meeting Summary\n\n`;
    summary += `${analysis.summary}\n\n`;

    if (analysis.key_points && analysis.key_points.length > 0) {
      summary += `## Key Points\n\n`;
      analysis.key_points.forEach((point: string) => {
        summary += `- ${point}\n`;
      });
      summary += `\n`;
    }

    if (analysis.decisions && analysis.decisions.length > 0) {
      summary += `## Decisions Made\n\n`;
      analysis.decisions.forEach((decision: string) => {
        summary += `- ${decision}\n`;
      });
      summary += `\n`;
    }

    if (analysis.blockers && analysis.blockers.length > 0) {
      summary += `## Blockers\n\n`;
      analysis.blockers.forEach((blocker: string) => {
        summary += `- ${blocker}\n`;
      });
      summary += `\n`;
    }

    if (analysis.next_steps && analysis.next_steps.length > 0) {
      summary += `## Next Steps\n\n`;
      analysis.next_steps.forEach((step: string) => {
        summary += `- ${step}\n`;
      });
    }

    return summary;
  }
}

export const webhookService = new WebhookService();
