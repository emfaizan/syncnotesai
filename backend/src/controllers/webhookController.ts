import { Request, Response, NextFunction } from 'express';
import { WebhookService } from '../services/webhookService';

export class WebhookController {
  private webhookService: WebhookService;

  constructor() {
    this.webhookService = new WebhookService();
  }

  handleRecallWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body;

      await this.webhookService.processRecallWebhook(payload);

      // Acknowledge webhook receipt immediately
      res.status(200).json({
        success: true,
        message: 'Webhook received',
      });
    } catch (error) {
      next(error);
    }
  };
}
