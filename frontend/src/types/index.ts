export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  clickupConnected: boolean;
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  meetingUrl: string;
  platform: 'zoom' | 'meet' | 'teams' | 'webex' | 'other';
  status: 'scheduled' | 'recording' | 'processing' | 'completed' | 'failed';
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  recallBotId?: string;
  recordingUrl?: string;
  clickupListId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transcript {
  id: string;
  content: string;
  meetingId: string;
  createdAt: string;
}

export interface Summary {
  id: string;
  content: string;
  meetingId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  assignee?: string;
  clickupTaskId?: string;
  syncedAt?: string;
  meetingId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Usage {
  id: string;
  minutes: number;
  cost: number;
  userId: string;
  meetingId: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
  message?: string;
}
