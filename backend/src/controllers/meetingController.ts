import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { MeetingService } from '../services/meetingService';

export class MeetingController {
  private meetingService: MeetingService;

  constructor() {
    this.meetingService = new MeetingService();
  }

  getAllMeetings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const meetings = await this.meetingService.getUserMeetings(userId);

      res.status(200).json({
        success: true,
        data: {
          meetings,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  createMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const meetingData = req.body;

      const meeting = await this.meetingService.createMeeting(userId, meetingData);

      res.status(201).json({
        success: true,
        data: meeting,
        message: 'Meeting created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getMeetingById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const meeting = await this.meetingService.getMeetingById(id, userId);

      res.status(200).json({
        success: true,
        data: meeting,
      });
    } catch (error) {
      next(error);
    }
  };

  updateMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updateData = req.body;

      const meeting = await this.meetingService.updateMeeting(id, userId, updateData);

      res.status(200).json({
        success: true,
        data: meeting,
        message: 'Meeting updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await this.meetingService.deleteMeeting(id, userId);

      res.status(200).json({
        success: true,
        message: 'Meeting deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  startRecording = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const result = await this.meetingService.startRecording(id, userId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Recording started successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  stopRecording = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const result = await this.meetingService.stopRecording(id, userId);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Recording stopped successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getTranscript = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const transcript = await this.meetingService.getTranscript(id, userId);

      res.status(200).json({
        success: true,
        data: transcript,
      });
    } catch (error) {
      next(error);
    }
  };

  getSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const summary = await this.meetingService.getSummary(id, userId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };
}
