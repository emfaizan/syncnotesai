import { Router } from 'express';
import { UsageController } from '../../controllers/usageController';
import { authenticate } from '../../middleware/authenticate';

const router = Router();
const usageController = new UsageController();

// All usage routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/usage
 * @desc    Get usage statistics for authenticated user
 * @access  Private
 */
router.get('/', usageController.getUserUsage);

/**
 * @route   GET /api/usage/current-month
 * @desc    Get current month usage
 * @access  Private
 */
router.get('/current-month', usageController.getCurrentMonthUsage);

/**
 * @route   GET /api/usage/history
 * @desc    Get usage history
 * @access  Private
 */
router.get('/history', usageController.getUsageHistory);

/**
 * @route   GET /api/usage/cost
 * @desc    Calculate current usage cost
 * @access  Private
 */
router.get('/cost', usageController.calculateCost);

export default router;
