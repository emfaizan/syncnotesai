import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AppError } from './errorHandler';

export const verifyRecallWebhook = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signature = req.headers['x-recall-signature'] as string;
    const webhookSecret = process.env.RECALL_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new AppError('Webhook secret not configured', 500);
    }

    if (!signature) {
      throw new AppError('Missing webhook signature', 401);
    }

    // Verify signature
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new AppError('Invalid webhook signature', 401);
    }

    next();
  } catch (error) {
    next(error);
  }
};
