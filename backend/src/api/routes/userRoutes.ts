import { Router } from 'express';
import { UserController } from '../../controllers/userController';
import { authenticate } from '../../middleware/authenticate';

const router = Router();
const userController = new UserController();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', userController.updateProfile);

/**
 * @route   GET /api/users/settings
 * @desc    Get user settings
 * @access  Private
 */
router.get('/settings', userController.getSettings);

/**
 * @route   PUT /api/users/settings
 * @desc    Update user settings
 * @access  Private
 */
router.put('/settings', userController.updateSettings);

/**
 * @route   POST /api/users/clickup/connect
 * @desc    Connect ClickUp account
 * @access  Private
 */
router.post('/clickup/connect', userController.connectClickUp);

/**
 * @route   DELETE /api/users/clickup/disconnect
 * @desc    Disconnect ClickUp account
 * @access  Private
 */
router.delete('/clickup/disconnect', userController.disconnectClickUp);

export default router;
