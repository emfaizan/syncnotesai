import api from '../lib/api';

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

class TaskService {
  async getAllTasks(): Promise<Task[]> {
    const response = await api.get('/tasks');
    return response.data.data;
  }

  async getTaskById(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data.data;
  }

  async getTasksByMeeting(meetingId: string): Promise<Task[]> {
    const response = await api.get(`/tasks/meeting/${meetingId}`);
    return response.data.data;
  }

  async syncToClickUp(id: string): Promise<{ clickupTaskId: string; status: string }> {
    const response = await api.post(`/tasks/${id}/sync`);
    return response.data.data;
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data.data;
  }

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  }
}

export default new TaskService();
