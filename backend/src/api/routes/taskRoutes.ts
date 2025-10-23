import { Router } from 'express';
import { TaskController } from '../../controllers/taskController';
import { authenticate } from '../../middleware/authenticate';

const router = Router();
const taskController = new TaskController();

// All task routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for authenticated user
 * @access  Private
 */
router.get('/', taskController.getAllTasks);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get task by ID
 * @access  Private
 */
router.get('/:id', taskController.getTaskById);

/**
 * @route   POST /api/tasks/:id/sync
 * @desc    Sync task to ClickUp
 * @access  Private
 */
router.post('/:id/sync', taskController.syncToClickUp);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task
 * @access  Private
 */
router.put('/:id', taskController.updateTask);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Private
 */
router.delete('/:id', taskController.deleteTask);

/**
 * @route   GET /api/tasks/meeting/:meetingId
 * @desc    Get all tasks for a specific meeting
 * @access  Private
 */
router.get('/meeting/:meetingId', taskController.getTasksByMeeting);

export default router;
