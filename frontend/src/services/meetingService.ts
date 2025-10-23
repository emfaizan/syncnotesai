import api from '../lib/api';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  meetingUrl: string;
  platform: string;
  status: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingData {
  title: string;
  meetingUrl: string;
  platform: 'zoom' | 'meet' | 'teams' | 'webex' | 'other';
  description?: string;
  scheduledAt?: string;
  clickupListId?: string;
}

class MeetingService {
  async getAllMeetings(): Promise<Meeting[]> {
    const response = await api.get('/meetings');
    return response.data.data;
  }

  async getMeetingById(id: string): Promise<Meeting> {
    const response = await api.get(`/meetings/${id}`);
    return response.data.data;
  }

  async createMeeting(data: CreateMeetingData): Promise<Meeting> {
    const response = await api.post('/meetings', data);
    return response.data.data;
  }

  async updateMeeting(id: string, data: Partial<CreateMeetingData>): Promise<Meeting> {
    const response = await api.put(`/meetings/${id}`, data);
    return response.data.data;
  }

  async deleteMeeting(id: string): Promise<void> {
    await api.delete(`/meetings/${id}`);
  }

  async startRecording(id: string): Promise<{ botId: string; status: string }> {
    const response = await api.post(`/meetings/${id}/start`);
    return response.data.data;
  }

  async stopRecording(id: string): Promise<{ status: string }> {
    const response = await api.post(`/meetings/${id}/stop`);
    return response.data.data;
  }

  async getTranscript(id: string): Promise<any> {
    const response = await api.get(`/meetings/${id}/transcript`);
    return response.data.data;
  }

  async getSummary(id: string): Promise<any> {
    const response = await api.get(`/meetings/${id}/summary`);
    return response.data.data;
  }
}

export default new MeetingService();
