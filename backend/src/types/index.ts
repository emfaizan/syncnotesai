import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    subscription?: {
      status: string;
      tier: string;
    };
  };
}

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Meeting {
  id: string;
  title: string;
  transcript?: string;
  summary?: string;
  meetingUrl?: string;
  recordingUrl?: string;
  status: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  dueDate?: Date;
  meetingId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecallBotConfig {
  meeting_url?: string;
  bot_name?: string;
  transcription_options?: {
    provider?: string;
  };
  real_time_transcription?: {
    destination_url?: string;
  };
  recording_mode?: string;
  automatic_leave?: {
    waiting_room_timeout?: number;
    noone_joined_timeout?: number;
  };
}