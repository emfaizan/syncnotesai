import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ClickUpService } from './integrations/clickupService';

export class UserService {
  private clickupService: ClickUpService;

  constructor() {
    this.clickupService = new ClickUpService();
  }

  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        clickupConnected: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateUserProfile(userId: string, updateData: any) {
    const { password, clickupApiKey, ...safeData } = updateData;

    const user = await prisma.user.update({
      where: { id: userId },
      data: safeData,
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        createdAt: true,
      },
    });

    return user;
  }

  async getUserSettings(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        clickupConnected: true,
        clickupTeamId: true,
        clickupListId: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateUserSettings(userId: string, updateData: any) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      clickupConnected: user.clickupConnected,
      clickupTeamId: user.clickupTeamId,
      clickupListId: user.clickupListId,
    };
  }

  async connectClickUp(userId: string, apiKey: string, teamId: string) {
    // Verify ClickUp credentials
    const isValid = await this.clickupService.verifyCredentials(apiKey);

    if (!isValid) {
      throw new AppError('Invalid ClickUp API key', 400);
    }

    // Update user with ClickUp credentials
    await prisma.user.update({
      where: { id: userId },
      data: {
        clickupApiKey: apiKey,
        clickupTeamId: teamId,
        clickupConnected: true,
      },
    });

    return { connected: true };
  }

  async disconnectClickUp(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        clickupApiKey: null,
        clickupTeamId: null,
        clickupListId: null,
        clickupConnected: false,
      },
    });
  }
}
