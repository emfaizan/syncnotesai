import cron from 'node-cron';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { MeetingService } from './meetingService';
import { calendarSyncService } from './calendarSyncService';

export class AutoJoinScheduler {
  private meetingService: MeetingService;
  private syncTask: cron.ScheduledTask | null = null;
  private autoJoinTask: cron.ScheduledTask | null = null;

  constructor() {
    this.meetingService = new MeetingService();
  }

  /**
   * Start the scheduler
   */
  start() {
    logger.info('Starting Auto-Join Scheduler');

    // Sync calendars every 15 minutes
    this.syncTask = cron.schedule('*/15 * * * *', async () => {
      try {
        logger.info('Running scheduled calendar sync');
        await calendarSyncService.syncAllConnections();
      } catch (error: any) {
        logger.error('Error in scheduled calendar sync:', error.message);
      }
    });

    // Check for meetings to join every minute
    this.autoJoinTask = cron.schedule('* * * * *', async () => {
      try {
        await this.checkAndJoinMeetings();
      } catch (error: any) {
        logger.error('Error in auto-join check:', error.message);
      }
    });

    logger.info('Auto-Join Scheduler started successfully');
    logger.info('- Calendar sync: every 15 minutes');
    logger.info('- Auto-join check: every minute');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    logger.info('Stopping Auto-Join Scheduler');

    if (this.syncTask) {
      this.syncTask.stop();
      this.syncTask = null;
    }

    if (this.autoJoinTask) {
      this.autoJoinTask.stop();
      this.autoJoinTask = null;
    }

    logger.info('Auto-Join Scheduler stopped');
  }

  /**
   * Check for upcoming meetings and join them automatically
   */
  private async checkAndJoinMeetings() {
    try {
      // Find users with auto-join enabled
      const users = await prisma.user.findMany({
        where: {
          autoJoinEnabled: true,
        },
        select: {
          id: true,
          autoJoinLeadTime: true,
        },
      });

      if (users.length === 0) {
        return;
      }

      logger.debug(`Checking auto-join for ${users.length} users`);

      for (const user of users) {
        await this.processUserMeetings(user.id, user.autoJoinLeadTime);
      }
    } catch (error: any) {
      logger.error('Error in checkAndJoinMeetings:', error.message);
    }
  }

  /**
   * Process meetings for a specific user
   */
  private async processUserMeetings(userId: string, leadTimeMinutes: number) {
    try {
      // Calculate the time window for joining
      const now = new Date();
      const joinWindowStart = new Date(now.getTime() + leadTimeMinutes * 60 * 1000);
      const joinWindowEnd = new Date(joinWindowStart.getTime() + 60 * 1000); // 1-minute window

      // Find calendar events that should be joined
      const eventsToJoin = await prisma.calendarEvent.findMany({
        where: {
          calendarConnection: {
            userId,
            isActive: true,
          },
          startTime: {
            gte: joinWindowStart,
            lt: joinWindowEnd,
          },
          botJoined: false,
          meetingUrl: {
            not: null,
          },
          platform: {
            not: null,
          },
        },
        include: {
          calendarConnection: true,
        },
      });

      if (eventsToJoin.length === 0) {
        return;
      }

      logger.info(
        `Found ${eventsToJoin.length} meetings to auto-join for user ${userId} (lead time: ${leadTimeMinutes} min)`
      );

      for (const event of eventsToJoin) {
        await this.joinMeeting(event, userId);
      }
    } catch (error: any) {
      logger.error(`Error processing meetings for user ${userId}:`, error.message);
    }
  }

  /**
   * Join a specific meeting
   */
  private async joinMeeting(calendarEvent: any, userId: string) {
    try {
      logger.info(`Auto-joining meeting: ${calendarEvent.title}`, {
        eventId: calendarEvent.id,
        meetingUrl: calendarEvent.meetingUrl,
        startTime: calendarEvent.startTime,
      });

      // Create meeting via MeetingService
      const meeting = await this.meetingService.createMeeting(userId, {
        title: calendarEvent.title,
        description: calendarEvent.description || `Auto-joined from calendar: ${calendarEvent.title}`,
        meetingUrl: calendarEvent.meetingUrl,
        platform: calendarEvent.platform,
        scheduledAt: calendarEvent.startTime,
      });

      // Update calendar event to mark as joined
      await prisma.calendarEvent.update({
        where: { id: calendarEvent.id },
        data: {
          botJoined: true,
          botJoinedAt: new Date(),
          meetingId: meeting.id,
        },
      });

      logger.info(`Successfully auto-joined meeting ${meeting.id}`, {
        calendarEventId: calendarEvent.id,
        recallBotId: meeting.recallBotId,
      });

      return meeting;
    } catch (error: any) {
      logger.error(`Error auto-joining meeting ${calendarEvent.title}:`, error.message);

      // Mark as joined anyway to prevent retry loops
      await prisma.calendarEvent.update({
        where: { id: calendarEvent.id },
        data: { botJoined: true },
      });

      throw error;
    }
  }

  /**
   * Manually trigger sync (for testing)
   */
  async triggerSync() {
    logger.info('Manually triggering calendar sync');
    return await calendarSyncService.syncAllConnections();
  }

  /**
   * Manually trigger auto-join check (for testing)
   */
  async triggerAutoJoin() {
    logger.info('Manually triggering auto-join check');
    return await this.checkAndJoinMeetings();
  }
}

export const autoJoinScheduler = new AutoJoinScheduler();
