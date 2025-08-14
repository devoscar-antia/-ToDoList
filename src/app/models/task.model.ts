export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  category: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  dueDate?: string;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  dueDate?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  total?: number;
  error?: string;
}

export interface TaskFilters {
  completed?: boolean;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  search?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  priorityStats: {
    high: number;
    medium: number;
    low: number;
  };
  categoryStats: { [key: string]: number };
}
