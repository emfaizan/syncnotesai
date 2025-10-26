import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly',
  ];

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/calendar/google/callback'
    );
  }

  /**
   * Generate OAuth URL for user to authorize
   */
  getAuthUrl(userId: string): string {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
      state: userId, // Pass userId to identify user after redirect
      prompt: 'consent', // Force consent to get refresh token
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens and save
   */
  async handleCallback(code: string, userId: string) {
    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Get user's calendar info
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      const calendarList = await calendar.calendarList.list();

      const primaryCalendar = calendarList.data.items?.find(cal => cal.primary);

      if (!primaryCalendar || !tokens.access_token) {
        throw new Error('Failed to get calendar information');
      }

      // Calculate token expiry
      const tokenExpiry = new Date();
      if (tokens.expiry_date) {
        tokenExpiry.setTime(tokens.expiry_date);
      } else {
        // Default to 1 hour if not provided
        tokenExpiry.setTime(Date.now() + 3600 * 1000);
      }

      // Save calendar connection to database
      const connection = await prisma.calendarConnection.upsert({
        where: {
          userId_provider_calendarEmail: {
            userId,
            provider: 'google',
            calendarEmail: primaryCalendar.id || '',
          },
        },
        update: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || undefined,
          tokenExpiry,
          isActive: true,
          syncEnabled: true,
        },
        create: {
          userId,
          provider: 'google',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || undefined,
          tokenExpiry,
          calendarId: primaryCalendar.id || '',
          calendarEmail: primaryCalendar.id || '',
          calendarName: primaryCalendar.summary || 'Primary Calendar',
          isActive: true,
          syncEnabled: true,
        },
      });

      logger.info(`Google Calendar connected for user ${userId}`, {
        calendarId: connection.calendarId,
      });

      return connection;
    } catch (error: any) {
      logger.error('Error handling Google Calendar callback:', error.message);
      throw error;
    }
  }

  /**
   * Refresh access token if expired
   */
  async refreshAccessToken(connectionId: string) {
    try {
      const connection = await prisma.calendarConnection.findUnique({
        where: { id: connectionId },
      });

      if (!connection || !connection.refreshToken) {
        throw new Error('No refresh token available');
      }

      this.oauth2Client.setCredentials({
        refresh_token: connection.refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }

      // Update token in database
      const tokenExpiry = new Date();
      if (credentials.expiry_date) {
        tokenExpiry.setTime(credentials.expiry_date);
      } else {
        tokenExpiry.setTime(Date.now() + 3600 * 1000);
      }

      await prisma.calendarConnection.update({
        where: { id: connectionId },
        data: {
          accessToken: credentials.access_token,
          tokenExpiry,
        },
      });

      logger.info(`Refreshed access token for connection ${connectionId}`);

      return credentials.access_token;
    } catch (error: any) {
      logger.error('Error refreshing access token:', error.message);
      throw error;
    }
  }

  /**
   * Get upcoming events from Google Calendar
   */
  async getUpcomingEvents(connectionId: string, hoursAhead: number = 24) {
    try {
      const connection = await prisma.calendarConnection.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        throw new Error('Calendar connection not found');
      }

      // Check if token needs refresh
      if (new Date() >= connection.tokenExpiry) {
        await this.refreshAccessToken(connectionId);
      }

      // Set credentials
      this.oauth2Client.setCredentials({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken || undefined,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const now = new Date();
      const timeMax = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

      // Fetch events
      const response = await calendar.events.list({
        calendarId: connection.calendarId,
        timeMin: now.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 50,
      });

      const events = response.data.items || [];

      logger.info(`Fetched ${events.length} upcoming events for connection ${connectionId}`);

      return events.map(event => ({
        id: event.id || '',
        summary: event.summary || 'No title',
        description: event.description || '',
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        hangoutLink: event.hangoutLink,
        location: event.location,
        conferenceData: event.conferenceData,
      }));
    } catch (error: any) {
      logger.error('Error fetching calendar events:', error.message);
      throw error;
    }
  }

  /**
   * Extract meeting URL from event description or location
   */
  extractMeetingUrl(event: any): { url: string | null; platform: string | null } {
    // Check hangoutLink (Google Meet)
    if (event.hangoutLink) {
      return { url: event.hangoutLink, platform: 'meet' };
    }

    // Check conferenceData
    if (event.conferenceData?.entryPoints) {
      const videoEntry = event.conferenceData.entryPoints.find(
        (entry: any) => entry.entryPointType === 'video'
      );
      if (videoEntry?.uri) {
        return { url: videoEntry.uri, platform: this.detectPlatform(videoEntry.uri) };
      }
    }

    // Check description and location for meeting URLs
    const text = `${event.description || ''} ${event.location || ''}`;

    // Zoom
    const zoomMatch = text.match(/https?:\/\/[^\s]*zoom\.us\/[^\s]*/i);
    if (zoomMatch) {
      return { url: zoomMatch[0], platform: 'zoom' };
    }

    // Teams
    const teamsMatch = text.match(/https?:\/\/[^\s]*teams\.(microsoft\.com|live\.com)\/[^\s]*/i);
    if (teamsMatch) {
      return { url: teamsMatch[0], platform: 'teams' };
    }

    // Google Meet
    const meetMatch = text.match(/https?:\/\/meet\.google\.com\/[^\s]*/i);
    if (meetMatch) {
      return { url: meetMatch[0], platform: 'meet' };
    }

    // Webex
    const webexMatch = text.match(/https?:\/\/[^\s]*webex\.com\/[^\s]*/i);
    if (webexMatch) {
      return { url: webexMatch[0], platform: 'webex' };
    }

    return { url: null, platform: null };
  }

  /**
   * Detect platform from URL
   */
  private detectPlatform(url: string): string {
    if (url.includes('zoom.us')) return 'zoom';
    if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) return 'teams';
    if (url.includes('meet.google.com')) return 'meet';
    if (url.includes('webex.com')) return 'webex';
    return 'other';
  }

  /**
   * Disconnect calendar
   */
  async disconnectCalendar(connectionId: string, userId: string) {
    try {
      const connection = await prisma.calendarConnection.findFirst({
        where: { id: connectionId, userId },
      });

      if (!connection) {
        throw new Error('Calendar connection not found');
      }

      // Revoke token with Google
      try {
        this.oauth2Client.setCredentials({
          access_token: connection.accessToken,
        });
        await this.oauth2Client.revokeCredentials();
      } catch (error) {
        logger.warn('Failed to revoke Google credentials', error);
      }

      // Delete from database
      await prisma.calendarConnection.delete({
        where: { id: connectionId },
      });

      logger.info(`Disconnected calendar ${connectionId} for user ${userId}`);

      return true;
    } catch (error: any) {
      logger.error('Error disconnecting calendar:', error.message);
      throw error;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
