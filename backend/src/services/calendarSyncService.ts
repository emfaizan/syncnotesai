import prisma from '../config/database';
import { logger } from '../utils/logger';
import { googleCalendarService } from './integrations/googleCalendarService';

export class CalendarSyncService {
  /**
   * Sync calendar events for a specific connection
   */
  async syncConnection(connectionId: string) {
    try {
      const connection = await prisma.calendarConnection.findUnique({
        where: { id: connectionId },
        include: { user: true },
      });

      if (!connection || !connection.syncEnabled || !connection.isActive) {
        logger.debug(`Skipping inactive connection ${connectionId}`);
        return;
      }

      logger.info(`Syncing calendar connection ${connectionId} for user ${connection.userId}`);

      // Fetch upcoming events from Google Calendar
      const events = await googleCalendarService.getUpcomingEvents(connectionId, 48); // Next 48 hours

      let syncedCount = 0;
      let eventsWithMeetings = 0;

      for (const event of events) {
        try {
          // Extract meeting URL from event
          const { url: meetingUrl, platform } = googleCalendarService.extractMeetingUrl(event);

          // Skip events without meeting URLs
          if (!meetingUrl) {
            continue;
          }

          eventsWithMeetings++;

          // Parse start and end times
          const startTime = new Date(event.start);
          const endTime = new Date(event.end);

          // Save or update calendar event in database
          await prisma.calendarEvent.upsert({
            where: {
              calendarConnectionId_externalEventId: {
                calendarConnectionId: connectionId,
                externalEventId: event.id,
              },
            },
            update: {
              title: event.summary,
              description: event.description,
              startTime,
              endTime,
              meetingUrl,
              platform,
            },
            create: {
              calendarConnectionId: connectionId,
              externalEventId: event.id,
              title: event.summary,
              description: event.description,
              startTime,
              endTime,
              timezone: 'UTC',
              meetingUrl,
              platform,
              botJoined: false,
            },
          });

          syncedCount++;
        } catch (error: any) {
          logger.error(`Error syncing event ${event.id}:`, error.message);
        }
      }

      // Update last sync time
      await prisma.calendarConnection.update({
        where: { id: connectionId },
        data: { lastSyncAt: new Date() },
      });

      logger.info(
        `Synced ${syncedCount} events (${eventsWithMeetings} with meeting links) for connection ${connectionId}`
      );

      return { syncedCount, eventsWithMeetings };
    } catch (error: any) {
      logger.error(`Error syncing connection ${connectionId}:`, error.message);
      throw error;
    }
  }

  /**
   * Sync all active calendar connections
   */
  async syncAllConnections() {
    try {
      logger.info('Starting sync for all active calendar connections');

      const connections = await prisma.calendarConnection.findMany({
        where: {
          isActive: true,
          syncEnabled: true,
        },
      });

      logger.info(`Found ${connections.length} active connections to sync`);

      const results = [];

      for (const connection of connections) {
        try {
          const result = await this.syncConnection(connection.id);
          results.push({ connectionId: connection.id, success: true, ...result });
        } catch (error: any) {
          logger.error(`Failed to sync connection ${connection.id}:`, error.message);
          results.push({ connectionId: connection.id, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      logger.info(`Completed sync: ${successCount}/${connections.length} connections successful`);

      return results;
    } catch (error: any) {
      logger.error('Error in syncAllConnections:', error.message);
      throw error;
    }
  }

  /**
   * Get user's calendar connections
   */
  async getUserConnections(userId: string) {
    return prisma.calendarConnection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get upcoming calendar events for a user
   */
  async getUserUpcomingEvents(userId: string, limit: number = 20) {
    const connections = await prisma.calendarConnection.findMany({
      where: { userId, isActive: true },
      select: { id: true },
    });

    const connectionIds = connections.map((c: any) => c.id);

    return prisma.calendarEvent.findMany({
      where: {
        calendarConnectionId: { in: connectionIds },
        startTime: { gte: new Date() },
        meetingUrl: { not: null },
      },
      orderBy: { startTime: 'asc' },
      take: limit,
      include: {
        calendarConnection: {
          select: {
            provider: true,
            calendarName: true,
          },
        },
        meeting: {
          select: {
            id: true,
            status: true,
            recallBotId: true,
          },
        },
      },
    });
  }
}

export const calendarSyncService = new CalendarSyncService();
