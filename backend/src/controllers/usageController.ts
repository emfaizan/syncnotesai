import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { UsageService } from '../services/usageService';

export class UsageController {
  private usageService: UsageService;

  constructor() {
    this.usageService = new UsageService();
  }

  getUserUsage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const usage = await this.usageService.getUserUsage(userId);

      res.status(200).json({
        success: true,
        data: usage,
      });
    } catch (error) {
      next(error);
    }
  };

  getCurrentMonthUsage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const usage = await this.usageService.getCurrentMonthUsage(userId);

      res.status(200).json({
        success: true,
        data: usage,
      });
    } catch (error) {
      next(error);
    }
  };

  getUsageHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const history = await this.usageService.getUsageHistory(userId);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };

  calculateCost = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const cost = await this.usageService.calculateCurrentCost(userId);

      res.status(200).json({
        success: true,
        data: cost,
      });
    } catch (error) {
      next(error);
    }
  };
}
