import { Router } from 'express';
import { MeetingController } from '../../controllers/meetingController';
import { authenticate } from '../../middleware/authenticate';
import { validateRequest } from '../../middleware/validateRequest';
import { createMeetingSchema } from '../../validators/meetingValidator';

const router = Router();
const meetingController = new MeetingController();

// All meeting routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/meetings
 * @desc    Get all meetings for authenticated user
 * @access  Private
 */
router.get('/', meetingController.getAllMeetings);

/**
 * @route   POST /api/meetings
 * @desc    Create a new meeting
 * @access  Private
 */
router.post(
  '/',
  validateRequest(createMeetingSchema),
  meetingController.createMeeting
);

/**
 * @route   GET /api/meetings/:id
 * @desc    Get meeting by ID
 * @access  Private
 */
router.get('/:id', meetingController.getMeetingById);

/**
 * @route   PUT /api/meetings/:id
 * @desc    Update meeting
 * @access  Private
 */
router.put('/:id', meetingController.updateMeeting);

/**
 * @route   DELETE /api/meetings/:id
 * @desc    Delete meeting
 * @access  Private
 */
router.delete('/:id', meetingController.deleteMeeting);

/**
 * @route   POST /api/meetings/:id/start
 * @desc    Start meeting recording
 * @access  Private
 */
router.post('/:id/start', meetingController.startRecording);

/**
 * @route   POST /api/meetings/:id/stop
 * @desc    Stop meeting recording
 * @access  Private
 */
router.post('/:id/stop', meetingController.stopRecording);

/**
 * @route   GET /api/meetings/:id/transcript
 * @desc    Get meeting transcript
 * @access  Private
 */
router.get('/:id/transcript', meetingController.getTranscript);

/**
 * @route   GET /api/meetings/:id/summary
 * @desc    Get meeting summary
 * @access  Private
 */
router.get('/:id/summary', meetingController.getSummary);

export default router;
