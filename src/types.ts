export interface Task {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | string;
  status: 'todo' | 'in_progress' | 'done' | string;
  estimated_time: number;
}