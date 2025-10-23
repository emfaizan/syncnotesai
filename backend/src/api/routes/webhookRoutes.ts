import { Router } from 'express';
import { WebhookController } from '../../controllers/webhookController';
import { verifyRecallWebhook } from '../../middleware/verifyRecallWebhook';

const router = Router();
const webhookController = new WebhookController();

/**
 * @route   POST /api/webhooks/recall
 * @desc    Handle Recall.ai webhook events
 * @access  Public (verified by webhook signature)
 */
router.post('/recall', verifyRecallWebhook, webhookController.handleRecallWebhook);

export default router;
