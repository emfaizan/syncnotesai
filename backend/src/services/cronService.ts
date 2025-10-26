import cron from 'node-cron';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { recallService } from './recallService';

/**
 * Cron Service for scheduled tasks
 * - Delete recordings after 7 days (or user-specified retention period)
 * - Clean up expired sessions
 * - Send low credit warnings
 */
class CronService {
  /**
   * Start all cron jobs
   */
  startAll() {
    // Run daily at 2 AM UTC
    this.scheduleRecordingDeletion();

    // Run hourly
    this.scheduleCleanup();

    logger.info('All cron jobs started');
  }

  /**
   * Delete recordings that have passed their retention date
   * Runs daily at 2:00 AM UTC
   */
  private scheduleRecordingDeletion() {
    cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('Running scheduled recording deletion job');

        const now = new Date();

        // Find meetings with recordings scheduled for deletion
        const meetingsToDelete = await prisma.meeting.findMany({
          where: {
            recordingDeletionDate: {
              lte: now,
            },
            recordingUrl: {
              not: null,
            },
          },
        });

        logger.info(`Found ${meetingsToDelete.length} recordings to delete`);

        for (const meeting of meetingsToDelete) {
          try {
            if (meeting.recallBotId) {
              // Delete recording from Recall.ai
              const deleted = await recallService.deleteRecording(meeting.recallBotId);

              if (deleted) {
                // Update meeting in database
                await prisma.meeting.update({
                  where: { id: meeting.id },
                  data: {
                    recordingUrl: null,
                    recordingDeletionDate: null,
                  },
                });

                logger.info(`Deleted recording for meeting ${meeting.id}`);
              }
            }
          } catch (error: any) {
            logger.error(`Failed to delete recording for meeting ${meeting.id}`, {
              error: error.message,
            });
          }
        }

        logger.info('Recording deletion job completed');
      } catch (error: any) {
        logger.error('Error in recording deletion job', { error: error.message });
      }
    });

    logger.info('Recording deletion cron job scheduled (daily at 2:00 AM UTC)');
  }

  /**
   * Clean up old data (expired sessions, old logs, etc.)
   * Runs every hour
   */
  private scheduleCleanup() {
    cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Running cleanup job');

        // Delete meetings with error status older than 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const deletedMeetings = await prisma.meeting.deleteMany({
          where: {
            status: 'error',
            createdAt: {
              lt: thirtyDaysAgo,
            },
          },
        });

        if (deletedMeetings.count > 0) {
          logger.info(`Cleaned up ${deletedMeetings.count} old error meetings`);
        }
      } catch (error: any) {
        logger.error('Error in cleanup job', { error: error.message });
      }
    });

    logger.info('Cleanup cron job scheduled (hourly)');
  }

  /**
   * Manually delete a specific recording (for user request)
   */
  async deleteRecordingNow(meetingId: string): Promise<boolean> {
    try {
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
      });

      if (!meeting || !meeting.recallBotId) {
        logger.warn(`Meeting ${meetingId} not found or has no recording`);
        return false;
      }

      // Delete from Recall.ai
      const deleted = await recallService.deleteRecording(meeting.recallBotId);

      if (deleted) {
        // Update database
        await prisma.meeting.update({
          where: { id: meetingId },
          data: {
            recordingUrl: null,
            recordingDeletionDate: null,
          },
        });

        logger.info(`Manually deleted recording for meeting ${meetingId}`);
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error(`Failed to manually delete recording for meeting ${meetingId}`, {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Update retention period for a user
   */
  async updateUserRetention(userId: string, retentionDays: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { recordingRetentionDays: retentionDays },
    });

    logger.info(`Updated retention period for user ${userId} to ${retentionDays} days`);

    // Recalculate deletion dates for all user's meetings
    const meetings = await prisma.meeting.findMany({
      where: {
        userId,
        recordingUrl: { not: null },
        recordingDeletionDate: { not: null },
      },
    });

    for (const meeting of meetings) {
      const newDeletionDate = new Date(meeting.createdAt);
      newDeletionDate.setDate(newDeletionDate.getDate() + retentionDays);

      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { recordingDeletionDate: newDeletionDate },
      });
    }

    logger.info(`Recalculated deletion dates for ${meetings.length} meetings`);
  }
}

export const cronService = new CronService();
