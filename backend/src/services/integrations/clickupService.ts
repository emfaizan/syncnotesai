import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

interface CreateTaskData {
  name: string;
  description?: string;
  priority?: string;
  dueDate?: Date;
  assignees?: string[];
}

export class ClickUpService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.CLICKUP_API_URL || 'https://api.clickup.com/api/v2';
  }

  private getClient(apiKey: string): AxiosInstance {
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Verify ClickUp API credentials
   */
  async verifyCredentials(apiKey: string): Promise<boolean> {
    try {
      const client = this.getClient(apiKey);
      await client.get('/user');
      return true;
    } catch (error) {
      logger.error('Invalid ClickUp credentials:', error);
      return false;
    }
  }

  /**
   * Create a task in ClickUp
   */
  async createTask(apiKey: string, listId: string, taskData: CreateTaskData) {
    try {
      logger.info(`Creating ClickUp task in list ${listId}`);

      const client = this.getClient(apiKey);

      // Map priority to ClickUp format
      const priorityMap: Record<string, number> = {
        low: 4,
        medium: 3,
        high: 2,
        urgent: 1,
      };

      const payload: any = {
        name: taskData.name,
        description: taskData.description || '',
      };

      if (taskData.priority) {
        payload.priority = priorityMap[taskData.priority] || 3;
      }

      if (taskData.dueDate) {
        payload.due_date = taskData.dueDate.getTime();
      }

      if (taskData.assignees && taskData.assignees.length > 0) {
        payload.assignees = taskData.assignees;
      }

      const response = await client.post(`/list/${listId}/task`, payload);

      logger.info(`ClickUp task created: ${response.data.id}`);

      return response.data;
    } catch (error: any) {
      logger.error('Error creating ClickUp task:', error.response?.data || error.message);
      throw new AppError('Failed to create task in ClickUp', 500);
    }
  }

  /**
   * Update a task in ClickUp
   */
  async updateTask(apiKey: string, taskId: string, updateData: Partial<CreateTaskData>) {
    try {
      logger.info(`Updating ClickUp task ${taskId}`);

      const client = this.getClient(apiKey);

      const response = await client.put(`/task/${taskId}`, updateData);

      logger.info(`ClickUp task updated: ${taskId}`);

      return response.data;
    } catch (error: any) {
      logger.error('Error updating ClickUp task:', error.response?.data || error.message);
      throw new AppError('Failed to update task in ClickUp', 500);
    }
  }

  /**
   * Get user's workspaces
   */
  async getWorkspaces(apiKey: string) {
    try {
      const client = this.getClient(apiKey);
      const response = await client.get('/team');
      return response.data.teams;
    } catch (error: any) {
      logger.error('Error getting ClickUp workspaces:', error.response?.data || error.message);
      throw new AppError('Failed to get workspaces', 500);
    }
  }

  /**
   * Get lists in a workspace
   */
  async getLists(apiKey: string, spaceId: string) {
    try {
      const client = this.getClient(apiKey);
      const response = await client.get(`/space/${spaceId}/list`);
      return response.data.lists;
    } catch (error: any) {
      logger.error('Error getting ClickUp lists:', error.response?.data || error.message);
      throw new AppError('Failed to get lists', 500);
    }
  }
}
