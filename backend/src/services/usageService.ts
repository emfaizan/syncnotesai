import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class UsageService {
  async getUserUsage(userId: string) {
    const usage = await prisma.usage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return usage;
  }

  async getCurrentMonthUsage(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usage = await prisma.usage.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const totalMinutes = usage.reduce((sum: number, record: any) => sum + record.minutes, 0);
    const totalCost = usage.reduce((sum: number, record: any) => sum + record.cost, 0);

    return {
      totalMinutes,
      totalCost,
      records: usage.length,
      period: {
        start: startOfMonth,
        end: endOfMonth,
      },
    };
  }

  async getUsageHistory(userId: string) {
    const usage = await prisma.usage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return usage;
  }

  async calculateCurrentCost(userId: string) {
    const currentMonth = await this.getCurrentMonthUsage(userId);
    const pricePerMinute = parseFloat(process.env.PRICE_PER_MINUTE || '0.05');
    const freeTierMinutes = parseInt(process.env.FREE_TIER_MINUTES || '60');

    const billableMinutes = Math.max(0, currentMonth.totalMinutes - freeTierMinutes);
    const cost = billableMinutes * pricePerMinute;

    return {
      totalMinutes: currentMonth.totalMinutes,
      freeTierMinutes,
      billableMinutes,
      pricePerMinute,
      totalCost: cost,
    };
  }

  async trackUsage(userId: string, meetingId: string, minutes: number) {
    const pricePerMinute = parseFloat(process.env.PRICE_PER_MINUTE || '0.05');
    const cost = minutes * pricePerMinute;

    await prisma.usage.create({
      data: {
        userId,
        meetingId,
        minutes,
        cost,
      },
    });
  }
}
