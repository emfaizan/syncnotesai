import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { recallService } from './recallService';
import { aiService } from './aiService';
import { clickupService } from './clickupService';
import { billingService } from './billingService';

const prisma = new PrismaClient();

class MeetingProcessorService {
  /**
   * Start a meeting recording
   */
  async startMeeting(
    userId: string,
    meetingData: {
      title: string;
      description?: string;
      meetingUrl: string;
      platform: string;
      scheduledAt?: Date;
      clickupListId?: string;
    }
  ) {
    try {
      logger.info('Starting meeting recording', { userId, title: meetingData.title });

      // Check if user has sufficient credits
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      if (user.credits < 5 && user.plan !== 'team') {
        throw new Error('Insufficient credits. Please purchase more credits or upgrade your plan.');
      }

      // Create bot with Recall
      const bot = await recallService.createBot({
        join_url: meetingData.meetingUrl,
        platform: 'zoom',
        webhook_url: process.env.RECALL_WEBHOOK_URL || '',
        bot_name: 'SyncNotesAI',
        recording_mode: 'speaker_view',
        transcription_options: {
          provider: 'whisper',
        },
        automatic_leave: {
          waiting_room_timeout: 600,
          noone_joined_timeout: 300,
        },
      });

      // Create meeting record
      const meeting = await prisma.meeting.create({
        data: {
          userId,
          title: meetingData.title,
          description: meetingData.description,
          meetingUrl: meetingData.meetingUrl,
          platform: meetingData.platform,
          recallBotId: bot.id,
          status: 'recording',
          scheduledAt: meetingData.scheduledAt,
          startedAt: new Date(),
          clickupListId: meetingData.clickupListId,
        },
      });

      logger.info('Meeting recording started', {
        meetingId: meeting.id,
        recallBotId: bot.id,
      });

      return {
        meeting,
        botId: bot.id,
        botStatus: bot.status,
      };
    } catch (error: any) {
      logger.error('Failed to start meeting', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Process completed meeting - called by webhook
   */
  async processMeeting(recallBotId: string) {
    try {
      logger.info('Processing completed meeting', { recallBotId });

      // Find meeting
      const meeting = await prisma.meeting.findUnique({
        where: { recallBotId },
        include: { user: true },
      });

      if (!meeting) {
        throw new Error('Meeting not found');
      }

      // Update status to processing
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { status: 'processing' },
      });

      // Get transcript from Recall
      const transcript = await recallService.getFormattedTranscript(recallBotId);
      const rawTranscript = await recallService.getTranscript(recallBotId);

      // Calculate duration
      const duration = recallService.calculateDuration(rawTranscript);

      // Save transcript
      await prisma.transcript.create({
        data: {
          meetingId: meeting.id,
          content: transcript,
        },
      });

      // Process with AI
      const { summary, actionItems } = await aiService.processMeeting(transcript, meeting.title);

      // Save summary
      const summaryText = `# Overview\n${summary.overview}\n\n` +
        `## Key Points\n${summary.keyPoints.map((p) => `- ${p}`).join('\n')}\n\n` +
        `## Decisions\n${summary.decisions.map((d) => `- ${d}`).join('\n')}\n\n` +
        `## Blockers\n${summary.blockers.map((b) => `- ${b}`).join('\n')}\n\n` +
        `## Next Steps\n${summary.nextSteps.map((s) => `- ${s}`).join('\n')}`;

      await prisma.summary.create({
        data: {
          meetingId: meeting.id,
          content: summaryText,
        },
      });

      // Save action items
      const tasks = await Promise.all(
        actionItems.map(async (item) => {
          return prisma.task.create({
            data: {
              meetingId: meeting.id,
              userId: meeting.userId,
              title: item.title,
              description: item.description,
              priority: item.priority,
              dueDate: item.dueDate ? new Date(item.dueDate) : null,
              assignee: item.assignee,
              status: 'pending',
            },
          });
        })
      );

      // Get recording URL
      const recordingUrl = await recallService.getRecordingUrl(recallBotId);

      // Update meeting with duration and status
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          duration,
          endedAt: new Date(),
          recordingUrl,
          status: 'completed',
        },
      });

      // Deduct credits for usage
      if (meeting.user.plan !== 'team') {
        await billingService.deductCredits(meeting.userId, duration, meeting.id);
      }

      logger.info('Meeting processed successfully', {
        meetingId: meeting.id,
        duration,
        tasksCount: tasks.length,
      });

      // Auto-sync to ClickUp if configured
      if (meeting.user.clickupConnected && meeting.clickupListId) {
        await this.syncTasksToClickUp(meeting.id);
      }

      return {
        meeting,
        summary,
        tasks,
        duration,
      };
    } catch (error: any) {
      logger.error('Failed to process meeting', { recallBotId, error: error.message });

      // Update meeting status to failed
      const meeting = await prisma.meeting.findUnique({ where: { recallBotId } });
      if (meeting) {
        await prisma.meeting.update({
          where: { id: meeting.id },
          data: { status: 'failed' },
        });
      }

      throw error;
    }
  }

  /**
   * Sync tasks to ClickUp
   */
  async syncTasksToClickUp(meetingId: string) {
    try {
      logger.info('Syncing tasks to ClickUp', { meetingId });

      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
          tasks: { where: { clickupTaskId: null } },
          user: true,
        },
      });

      if (!meeting || !meeting.user.clickupAccessToken || !meeting.clickupListId) {
        throw new Error('ClickUp not configured for this meeting');
      }

      const syncedTasks = [];

      for (const task of meeting.tasks) {
        try {
          const clickupTask = await clickupService.createTask(
            meeting.user.clickupAccessToken,
            meeting.clickupListId,
            {
              name: task.title,
              description: task.description || undefined,
              priority: clickupService.mapPriority(task.priority),
              due_date: task.dueDate ? task.dueDate.getTime() : undefined,
            }
          );

          await prisma.task.update({
            where: { id: task.id },
            data: {
              clickupTaskId: clickupTask.id,
              syncedAt: new Date(),
            },
          });

          syncedTasks.push(clickupTask);
        } catch (error: any) {
          logger.error('Failed to sync task to ClickUp', {
            taskId: task.id,
            error: error.message,
          });
        }
      }

      logger.info('Tasks synced to ClickUp', { meetingId, count: syncedTasks.length });

      return syncedTasks;
    } catch (error: any) {
      logger.error('Failed to sync tasks to ClickUp', { meetingId, error: error.message });
      throw error;
    }
  }

  /**
   * Get meeting details with all related data
   */
  async getMeetingDetails(meetingId: string, userId: string) {
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId,
      },
      include: {
        transcript: true,
        summary: true,
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
        usage: true,
      },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    return meeting;
  }

  /**
   * List user meetings
   */
  async listMeetings(
    userId: string,
    options: {
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const where: any = { userId };
    if (options.status) {
      where.status = options.status;
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        tasks: { select: { id: true, status: true } },
        usage: true,
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 20,
      skip: options.offset || 0,
    });

    const total = await prisma.meeting.count({ where });

    return {
      meetings,
      total,
      limit: options.limit || 20,
      offset: options.offset || 0,
    };
  }

  /**
   * Delete meeting
   */
  async deleteMeeting(meetingId: string, userId: string) {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, userId },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // Delete from Recall if bot still exists
    if (meeting.recallBotId) {
      try {
        await recallService.deleteBot(meeting.recallBotId);
      } catch (error) {
        logger.warn('Failed to delete Recall bot', { recallBotId: meeting.recallBotId });
      }
    }

    // Delete from database (cascades to transcript, summary, tasks)
    await prisma.meeting.delete({ where: { id: meetingId } });

    logger.info('Meeting deleted', { meetingId });
  }
}

export const meetingProcessorService = new MeetingProcessorService();
