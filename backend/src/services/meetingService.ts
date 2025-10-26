import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { RecallService } from './integrations/recallService';
import { AIService } from './integrations/aiService';

export class MeetingService {
  private recallService: RecallService;
  private aiService: AIService;

  constructor() {
    this.recallService = new RecallService();
    this.aiService = new AIService();
  }

  async getUserMeetings(userId: string) {
    return prisma.meeting.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        transcript: true,
        summary: true,
        tasks: true,
      },
    });
  }

  async createMeeting(userId: string, meetingData: any) {
    // Start recording via Recall.ai immediately
    const recallBot = await this.recallService.startRecording(meetingData.meetingUrl);

    // Create meeting in database with Recall bot ID
    const meeting = await prisma.meeting.create({
      data: {
        title: meetingData.title,
        description: meetingData.description,
        meetingUrl: meetingData.meetingUrl,
        platform: meetingData.platform,
        clickupListId: meetingData.clickupListId,
        userId,
        status: 'recording',
        recallBotId: recallBot.id,
        startedAt: new Date(),
      },
    });

    return meeting;
  }

  async getMeetingById(meetingId: string, userId: string) {
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        userId,
      },
      include: {
        transcript: true,
        summary: true,
        tasks: true,
      },
    });

    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    return meeting;
  }

  async updateMeeting(meetingId: string, userId: string, updateData: any) {
    const meeting = await this.getMeetingById(meetingId, userId);

    return prisma.meeting.update({
      where: { id: meeting.id },
      data: updateData,
    });
  }

  async deleteMeeting(meetingId: string, userId: string) {
    const meeting = await this.getMeetingById(meetingId, userId);

    await prisma.meeting.delete({
      where: { id: meeting.id },
    });
  }

  async startRecording(meetingId: string, userId: string) {
    const meeting = await this.getMeetingById(meetingId, userId);

    // Start recording via Recall.ai
    const recallBot = await this.recallService.startRecording(meeting.meetingUrl);

    // Update meeting status
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        status: 'recording',
        recallBotId: recallBot.id,
        startedAt: new Date(),
      },
    });

    return { botId: recallBot.id, status: 'recording' };
  }

  async stopRecording(meetingId: string, userId: string) {
    const meeting = await this.getMeetingById(meetingId, userId);

    if (!meeting.recallBotId) {
      throw new AppError('No active recording found for this meeting', 400);
    }

    // Stop recording via Recall.ai
    await this.recallService.stopRecording(meeting.recallBotId);

    // Update meeting status
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        status: 'processing',
        endedAt: new Date(),
      },
    });

    return { status: 'stopped' };
  }

  async getTranscript(meetingId: string, userId: string) {
    const meeting = await this.getMeetingById(meetingId, userId);

    const transcript = await prisma.transcript.findUnique({
      where: { meetingId: meeting.id },
    });

    if (!transcript) {
      throw new AppError('Transcript not found', 404);
    }

    return transcript;
  }

  async getSummary(meetingId: string, userId: string) {
    const meeting = await this.getMeetingById(meetingId, userId);

    const summary = await prisma.summary.findUnique({
      where: { meetingId: meeting.id },
    });

    if (!summary) {
      throw new AppError('Summary not found', 404);
    }

    return summary;
  }
}
