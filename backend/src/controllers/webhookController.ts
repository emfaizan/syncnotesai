import { Request, Response, NextFunction } from 'express';
import { webhookService } from '../services/webhookService';
import { logger } from '../utils/logger';

export class WebhookController {
  /**
   * Handle Recall.ai webhook events
   * POST /api/webhooks/recall
   *
   * This endpoint receives webhooks when:
   * - Bot status changes
   * - Transcript is ready
   * - Recording is ready
   * - Bot encounters an error
   */
  handleRecallWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body;

      logger.info('Received Recall.ai webhook', {
        event: payload.event,
        bot_id: payload.data?.bot_id,
      });

      // Acknowledge webhook receipt immediately (Recall expects 200 response quickly)
      res.status(200).json({
        success: true,
        message: 'Webhook received',
      });

      // Process webhook asynchronously
      // Don't await - process in background to avoid timeout
      webhookService.processRecallWebhook(payload).catch((error) => {
        logger.error('Error processing webhook in background', {
          event: payload.event,
          error: error.message,
        });
      });
    } catch (error) {
      logger.error('Error handling Recall webhook', { error });
      next(error);
    }
  };
}
