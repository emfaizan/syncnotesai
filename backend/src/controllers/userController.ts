import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { UserService } from '../services/userService';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const profile = await this.userService.getUserProfile(userId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const updateData = req.body;

      const profile = await this.userService.updateUserProfile(userId, updateData);

      res.status(200).json({
        success: true,
        data: profile,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const settings = await this.userService.getUserSettings(userId);

      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };

  updateSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const updateData = req.body;

      const settings = await this.userService.updateUserSettings(userId, updateData);

      res.status(200).json({
        success: true,
        data: settings,
        message: 'Settings updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  connectClickUp = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { apiKey, teamId } = req.body;

      const result = await this.userService.connectClickUp(userId, apiKey, teamId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'ClickUp connected successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  disconnectClickUp = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      await this.userService.disconnectClickUp(userId);

      res.status(200).json({
        success: true,
        message: 'ClickUp disconnected successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
