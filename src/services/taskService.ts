import { supabase } from '../utils/supabaseClient';
import type { Task } from '../types';

export async function getUserTasks (userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Ошибка при получении задач:", error.message);
    throw error;
  }

  return data as Task[]
}

export async function createTask (taskData: {
  id: string;
  user_id: string;
  status: string;
  title: string;
  category: string;
  priority: string;
  estimated_time: number
}): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert([taskData])
    .select()
    .single()

  if (error) {
    console.error("Ошибка при создании задачи:", error.message);
    throw error
  }

  return data as Task;
}

export async function updateTaskStatus (taskId: string, newStatus: string): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ status: newStatus })
    .eq("id", taskId)

  if (error) {
    console.error("Ошибка при обновлении статуса задачи:", error.message);
    throw error
  }
}

export async function createMultipleTasks (taskData: Omit<Task, "id" | "created_at">[]) {
  const { data, error } = await supabase
    .from("tasks")
    .insert(taskData)
    .select()

  if (error) {
    console.error("Ошибка массового создания задач:", error.message);
    throw error
  }

  return data as Task[]
};

export async function deleteTask (taskId: string): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)

  if (error) {
    console.error("Ошибка при удалении задачи:", error.message);
    throw error
  }
}