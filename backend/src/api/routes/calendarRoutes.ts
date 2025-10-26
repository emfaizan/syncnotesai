import { Router } from 'express';
import { calendarController } from '../../controllers/calendarController';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

// Google Calendar OAuth
router.get('/google/auth', authenticate, calendarController.initiateGoogleAuth);
router.get('/google/callback', calendarController.handleGoogleCallback);

// Calendar Connections
router.get('/connections', authenticate, calendarController.getConnections);
router.post('/connections/:id/sync', authenticate, calendarController.syncConnection);
router.delete('/connections/:id', authenticate, calendarController.disconnectCalendar);

// Calendar Events
router.get('/events', authenticate, calendarController.getUpcomingEvents);

// Auto-join Settings
router.get('/settings', authenticate, calendarController.getSettings);
router.put('/settings', authenticate, calendarController.updateSettings);

export default router;
