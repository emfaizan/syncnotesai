import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { googleCalendarService } from '../services/integrations/googleCalendarService';
import { calendarSyncService } from '../services/calendarSyncService';
import prisma from '../config/database';
import { logger } from '../utils/logger';

export class CalendarController {
  /**
   * GET /calendar/google/auth
   * Initiate Google Calendar OAuth flow
   */
  initiateGoogleAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;

      const authUrl = googleCalendarService.getAuthUrl(userId);

      res.status(200).json({
        success: true,
        data: { authUrl },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /calendar/google/callback
   * Handle Google Calendar OAuth callback
   */
  handleGoogleCallback = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, state: userId } = req.query;

      if (!code || !userId) {
        res.status(400).json({
          success: false,
          message: 'Missing code or state parameter',
        });
        return;
      }

      // Exchange code for tokens and save connection
      const connection = await googleCalendarService.handleCallback(
        code as string,
        userId as string
      );

      // Trigger initial sync
      try {
        await calendarSyncService.syncConnection(connection.id);
      } catch (error) {
        logger.warn('Initial sync failed, will retry on schedule');
      }

      // Redirect to frontend settings page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/dashboard/settings?calendar=connected`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /calendar/connections
   * Get user's calendar connections
   */
  getConnections = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;

      const connections = await calendarSyncService.getUserConnections(userId);

      // Remove sensitive tokens from response
      const sanitizedConnections = connections.map((conn: any) => ({
        id: conn.id,
        provider: conn.provider,
        calendarEmail: conn.calendarEmail,
        calendarName: conn.calendarName,
        isActive: conn.isActive,
        syncEnabled: conn.syncEnabled,
        lastSyncAt: conn.lastSyncAt,
        createdAt: conn.createdAt,
      }));

      res.status(200).json({
        success: true,
        data: { connections: sanitizedConnections },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /calendar/connections/:id/sync
   * Manually trigger sync for a connection
   */
  syncConnection = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      // Verify ownership
      const connection = await prisma.calendarConnection.findFirst({
        where: { id, userId },
      });

      if (!connection) {
        res.status(404).json({
          success: false,
          message: 'Calendar connection not found',
        });
        return;
      }

      const result = await calendarSyncService.syncConnection(id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Calendar synced successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /calendar/connections/:id
   * Disconnect a calendar
   */
  disconnectCalendar = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await googleCalendarService.disconnectCalendar(id, userId);

      res.status(200).json({
        success: true,
        message: 'Calendar disconnected successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /calendar/events
   * Get upcoming calendar events with meeting links
   */
  getUpcomingEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 20;

      const events = await calendarSyncService.getUserUpcomingEvents(userId, limit);

      res.status(200).json({
        success: true,
        data: { events },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /calendar/settings
   * Update user's auto-join settings
   */
  updateSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { autoJoinEnabled, autoJoinLeadTime } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          autoJoinEnabled:
            autoJoinEnabled !== undefined ? autoJoinEnabled : undefined,
          autoJoinLeadTime:
            autoJoinLeadTime !== undefined ? autoJoinLeadTime : undefined,
        },
        select: {
          id: true,
          autoJoinEnabled: true,
          autoJoinLeadTime: true,
        },
      });

      res.status(200).json({
        success: true,
        data: user,
        message: 'Auto-join settings updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /calendar/settings
   * Get user's auto-join settings
   */
  getSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          autoJoinEnabled: true,
          autoJoinLeadTime: true,
        },
      });

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const calendarController = new CalendarController();
