import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ClickUpTask {
  id: string;
  name: string;
  description?: string;
  status: {
    status: string;
    color: string;
  };
  date_created: string;
  date_updated: string;
  date_closed?: string;
  creator: {
    id: number;
    username: string;
    email: string;
  };
  assignees: Array<{
    id: number;
    username: string;
    email: string;
  }>;
  due_date?: string;
  priority?: {
    id: string;
    priority: string;
    color: string;
  };
  url: string;
}

export interface ClickUpOAuthTokens {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
}

export interface ClickUpUser {
  id: number;
  username: string;
  email: string;
  color: string;
  profilePicture?: string;
}

export interface ClickUpTeam {
  id: string;
  name: string;
  color: string;
  avatar?: string;
}

export interface ClickUpList {
  id: string;
  name: string;
  orderindex: number;
  status?: string;
  priority?: string;
  assignee?: string;
  due_date?: string;
  start_date?: string;
  folder: {
    id: string;
    name: string;
    hidden: boolean;
    access: boolean;
  };
  space: {
    id: string;
    name: string;
    access: boolean;
  };
}

class ClickUpService {
  private baseURL: string;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.baseURL = 'https://api.clickup.com/api/v2';
    this.clientId = process.env.CLICKUP_CLIENT_ID || '';
    this.clientSecret = process.env.CLICKUP_CLIENT_SECRET || '';
    this.redirectUri = process.env.CLICKUP_REDIRECT_URI || 'http://localhost:3001/api/clickup/callback';

    if (!this.clientId || !this.clientSecret) {
      logger.warn('ClickUp OAuth credentials not fully configured');
    }
  }

  /**
   * Create authenticated client for a user
   */
  private createClient(accessToken: string): AxiosInstance {
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': accessToken,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
    });

    if (state) {
      params.append('state', state);
    }

    return `https://app.clickup.com/api?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<ClickUpOAuthTokens> {
    try {
      const response = await axios.post('https://api.clickup.com/api/v2/oauth/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to exchange code for access token', { error: error.message });
      throw new Error(`Failed to get ClickUp access token: ${error.message}`);
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<ClickUpOAuthTokens> {
    try {
      const response = await axios.post('https://api.clickup.com/api/v2/oauth/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to refresh access token', { error: error.message });
      throw new Error(`Failed to refresh ClickUp access token: ${error.message}`);
    }
  }

  /**
   * Get authenticated user
   */
  async getAuthenticatedUser(accessToken: string): Promise<ClickUpUser> {
    try {
      const client = this.createClient(accessToken);
      const response = await client.get('/user');
      return response.data.user;
    } catch (error: any) {
      logger.error('Failed to get authenticated user', { error: error.message });
      throw new Error(`Failed to get ClickUp user: ${error.message}`);
    }
  }

  /**
   * Get authorized teams
   */
  async getTeams(accessToken: string): Promise<ClickUpTeam[]> {
    try {
      const client = this.createClient(accessToken);
      const response = await client.get('/team');
      return response.data.teams;
    } catch (error: any) {
      logger.error('Failed to get teams', { error: error.message });
      throw new Error(`Failed to get ClickUp teams: ${error.message}`);
    }
  }

  /**
   * Get spaces in a team
   */
  async getSpaces(accessToken: string, teamId: string) {
    try {
      const client = this.createClient(accessToken);
      const response = await client.get(`/team/${teamId}/space`);
      return response.data.spaces;
    } catch (error: any) {
      logger.error('Failed to get spaces', { teamId, error: error.message });
      throw new Error(`Failed to get ClickUp spaces: ${error.message}`);
    }
  }

  /**
   * Get lists in a space
   */
  async getLists(accessToken: string, spaceId: string): Promise<ClickUpList[]> {
    try {
      const client = this.createClient(accessToken);
      const response = await client.get(`/space/${spaceId}/list`);
      return response.data.lists;
    } catch (error: any) {
      logger.error('Failed to get lists', { spaceId, error: error.message });
      throw new Error(`Failed to get ClickUp lists: ${error.message}`);
    }
  }

  /**
   * Create a task in ClickUp
   */
  async createTask(
    accessToken: string,
    listId: string,
    taskData: {
      name: string;
      description?: string;
      priority?: number; // 1=urgent, 2=high, 3=normal, 4=low
      due_date?: number; // Unix timestamp in milliseconds
      assignees?: number[];
      tags?: string[];
      status?: string;
    }
  ): Promise<ClickUpTask> {
    try {
      const client = this.createClient(accessToken);

      logger.info('Creating ClickUp task', { listId, taskName: taskData.name });

      const response = await client.post(`/list/${listId}/task`, {
        name: taskData.name,
        description: taskData.description,
        priority: taskData.priority,
        due_date: taskData.due_date,
        assignees: taskData.assignees,
        tags: taskData.tags,
        status: taskData.status,
      });

      logger.info('ClickUp task created successfully', {
        taskId: response.data.id,
        taskName: response.data.name,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to create ClickUp task', {
        listId,
        taskName: taskData.name,
        error: error.message,
        response: error.response?.data,
      });
      throw new Error(`Failed to create ClickUp task: ${error.message}`);
    }
  }

  /**
   * Update a task in ClickUp
   */
  async updateTask(
    accessToken: string,
    taskId: string,
    updates: Partial<{
      name: string;
      description: string;
      status: string;
      priority: number;
      due_date: number;
      assignees: { add: number[]; rem: number[] };
    }>
  ): Promise<ClickUpTask> {
    try {
      const client = this.createClient(accessToken);

      const response = await client.put(`/task/${taskId}`, updates);

      logger.info('ClickUp task updated successfully', { taskId });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to update ClickUp task', {
        taskId,
        error: error.message,
      });
      throw new Error(`Failed to update ClickUp task: ${error.message}`);
    }
  }

  /**
   * Get a task from ClickUp
   */
  async getTask(accessToken: string, taskId: string): Promise<ClickUpTask> {
    try {
      const client = this.createClient(accessToken);
      const response = await client.get(`/task/${taskId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get ClickUp task', { taskId, error: error.message });
      throw new Error(`Failed to get ClickUp task: ${error.message}`);
    }
  }

  /**
   * Map priority string to ClickUp priority number
   */
  mapPriority(priority: string): number {
    const priorityMap: { [key: string]: number } = {
      urgent: 1,
      high: 2,
      medium: 3,
      low: 4,
    };
    return priorityMap[priority.toLowerCase()] || 3;
  }

  /**
   * Check if user has valid ClickUp connection
   */
  async checkConnection(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          clickupAccessToken: true,
          clickupConnected: true,
          clickupTokenExpiry: true,
        },
      });

      if (!user || !user.clickupConnected || !user.clickupAccessToken) {
        return false;
      }

      // Check if token is expired
      if (user.clickupTokenExpiry && new Date() > user.clickupTokenExpiry) {
        return false;
      }

      return true;
    } catch (error: any) {
      logger.error('Failed to check ClickUp connection', { userId, error: error.message });
      return false;
    }
  }

  /**
   * Disconnect ClickUp for user
   */
  async disconnectUser(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          clickupAccessToken: null,
          clickupRefreshToken: null,
          clickupTeamId: null,
          clickupListId: null,
          clickupConnected: false,
          clickupTokenExpiry: null,
        },
      });

      logger.info('User disconnected from ClickUp', { userId });
    } catch (error: any) {
      logger.error('Failed to disconnect user from ClickUp', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }
}

export const clickupService = new ClickUpService();
