// Shared types between backend and frontend

export type MeetingPlatform = 'zoom' | 'meet' | 'teams' | 'webex' | 'other';

export type MeetingStatus = 'scheduled' | 'recording' | 'processing' | 'completed' | 'failed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  clickupConnected: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  meetingUrl: string;
  platform: MeetingPlatform;
  status: MeetingStatus;
  scheduledAt?: Date | string;
  startedAt?: Date | string;
  endedAt?: Date | string;
  duration?: number;
  recallBotId?: string;
  recordingUrl?: string;
  clickupListId?: string;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Transcript {
  id: string;
  content: string;
  meetingId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Summary {
  id: string;
  content: string;
  meetingId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date | string;
  assignee?: string;
  clickupTaskId?: string;
  syncedAt?: Date | string;
  meetingId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Usage {
  id: string;
  minutes: number;
  cost: number;
  userId: string;
  meetingId: string;
  createdAt: Date | string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Webhook Payload Types
export interface RecallWebhookPayload {
  event: string;
  data: any;
  timestamp: string;
}

export interface BotStatusChangePayload {
  bot_id: string;
  status: string;
  meeting_url: string;
}

export interface TranscriptReadyPayload {
  bot_id: string;
  transcript: string;
}

export interface RecordingReadyPayload {
  bot_id: string;
  recording_url: string;
  duration: number;
}
