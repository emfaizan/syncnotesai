import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ClickUpService } from './integrations/clickupService';

export class TaskService {
  private clickupService: ClickUpService;

  constructor() {
    this.clickupService = new ClickUpService();
  }

  async getUserTasks(userId: string) {
    return prisma.task.findMany({
      where: {
        meeting: {
          userId,
        },
      },
      include: {
        meeting: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTaskById(taskId: string, userId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        meeting: {
          userId,
        },
      },
      include: {
        meeting: true,
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return task;
  }

  async syncToClickUp(taskId: string, userId: string) {
    const task = await this.getTaskById(taskId, userId);

    // Get user's ClickUp settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.clickupAccessToken) {
      throw new AppError('ClickUp not connected. Please connect your ClickUp account first.', 400);
    }

    // Sync to ClickUp
    const clickupTask = await this.clickupService.createTask(
      user.clickupAccessToken,
      task.meeting.clickupListId || user.clickupListId || '',
      {
        name: task.title,
        description: task.description || '',
        priority: task.priority,
        dueDate: task.dueDate || undefined,
      }
    );

    // Update task with ClickUp ID
    await prisma.task.update({
      where: { id: task.id },
      data: {
        clickupTaskId: clickupTask.id,
        syncedAt: new Date(),
      },
    });

    return { clickupTaskId: clickupTask.id, status: 'synced' };
  }

  async updateTask(taskId: string, userId: string, updateData: any) {
    const task = await this.getTaskById(taskId, userId);

    return prisma.task.update({
      where: { id: task.id },
      data: updateData,
    });
  }

  async deleteTask(taskId: string, userId: string) {
    const task = await this.getTaskById(taskId, userId);

    await prisma.task.delete({
      where: { id: task.id },
    });
  }

  async getTasksByMeeting(meetingId: string, userId: string) {
    // Verify meeting belongs to user
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId,
      },
    });

    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    return prisma.task.findMany({
      where: { meetingId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
