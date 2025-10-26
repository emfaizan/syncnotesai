import { Router } from 'express';
import { AuthController } from '../../controllers/authController';
import { validateRequest } from '../../middleware/validateRequest';
import { registerSchema, loginSchema } from '../../validators/authValidator';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validateRequest(registerSchema),
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login', validateRequest(loginSchema), authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authController.logout);

export default router;
