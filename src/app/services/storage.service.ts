import { Injectable } from '@angular/core';
import { Task, TaskUpdateRequest } from '../models/task.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { I18nService } from './i18n.service';

export interface StorageStats {
  total: number;
  completed: number;
  pending: number;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private isWeb = false;
  private tasks: Task[] = [];
  private syncStatusSubject = new BehaviorSubject<'synced' | 'pending' | 'error'>('synced');

  constructor(private i18n: I18nService) {
    this.isWeb = this.detectWebPlatform();
    this.loadTasksFromStorage();
  }

  private detectWebPlatform(): boolean {
    // Detectar si estamos en un navegador web
    return typeof window !== 'undefined' &&
      typeof document !== 'undefined' &&
      !this.isCapacitorNative();
  }

  private isCapacitorNative(): boolean {
    try {
      // Verificar si Capacitor está disponible y es nativo
      const capacitor = (window as any).Capacitor;
      return capacitor && capacitor.isNative;
    } catch {
      return false;
    }
  }

  private getStorageKey(): string {
    return 'todo_app_tasks';
  }

  private loadTasksFromStorage(): void {
    if (this.isWeb) {
      try {
        const stored = localStorage.getItem(this.getStorageKey());
        if (stored) {
          this.tasks = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Error cargando tareas del localStorage:', error);
        this.tasks = [];
      }
    }
  }

  private saveTasksToStorage(): void {
    if (this.isWeb) {
      try {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(this.tasks));
      } catch (error) {
        console.error('Error guardando tareas en localStorage:', error);
      }
    }
  }

  // Obtener estado de sincronización
  getSyncStatus(): Observable<'synced' | 'pending' | 'error'> {
    return this.syncStatusSubject.asObservable();
  }

  // Obtener todas las tareas
  async getTasks(): Promise<Task[]> {
    if (this.isWeb) {
      return [...this.tasks];
    } else {
      // En móvil, delegar al servicio SQLite solo si está disponible
      try {
        const { LocalDatabaseService } = await import('./local-database.service');
        const localDb = new LocalDatabaseService(this.i18n);
        return await localDb.getTasks();
      } catch (error) {
        console.warn('SQLite no disponible, usando localStorage como fallback:', error);
        // Fallback a localStorage si SQLite falla
        this.isWeb = true;
        return [...this.tasks];
      }
    }
  }

  // Obtener tarea por ID
  async getTask(id: string): Promise<Task | null> {
    if (this.isWeb) {
      return this.tasks.find(task => task.id === id) || null;
    } else {
      try {
        const { LocalDatabaseService } = await import('./local-database.service');
        const localDb = new LocalDatabaseService(this.i18n);
        return await localDb.getTask(id);
      } catch (error) {
        console.warn('SQLite no disponible, usando localStorage como fallback:', error);
        this.isWeb = true;
        return this.tasks.find(task => task.id === id) || null;
      }
    }
  }

  // Crear nueva tarea
  async createTask(task: Task): Promise<void> {
    if (this.isWeb) {
      this.tasks.push(task);
      this.saveTasksToStorage();
      this.syncStatusSubject.next('pending');
    } else {
      try {
        const { LocalDatabaseService } = await import('./local-database.service');
        const localDb = new LocalDatabaseService(this.i18n);
        await localDb.createTask(task);
      } catch (error) {
        console.warn('SQLite no disponible, usando localStorage como fallback:', error);
        this.isWeb = true;
        this.tasks.push(task);
        this.saveTasksToStorage();
        this.syncStatusSubject.next('pending');
      }
    }
  }

  // Actualizar tarea
  async updateTask(id: string, updates: TaskUpdateRequest): Promise<void> {
    if (this.isWeb) {
      const index = this.tasks.findIndex(task => task.id === id);
      if (index !== -1) {
        this.tasks[index] = { ...this.tasks[index], ...updates, updatedAt: new Date().toISOString() };
        this.saveTasksToStorage();
        this.syncStatusSubject.next('pending');
      }
    } else {
      try {
        const { LocalDatabaseService } = await import('./local-database.service');
        const localDb = new LocalDatabaseService(this.i18n);
        await localDb.updateTask(id, updates);
      } catch (error) {
        console.warn('SQLite no disponible, usando localStorage como fallback:', error);
        this.isWeb = true;
        const index = this.tasks.findIndex(task => task.id === id);
        if (index !== -1) {
          this.tasks[index] = { ...this.tasks[index], ...updates, updatedAt: new Date().toISOString() };
          this.saveTasksToStorage();
          this.syncStatusSubject.next('pending');
        }
      }
    }
  }

  // Eliminar tarea
  async deleteTask(id: string): Promise<void> {
    if (this.isWeb) {
      this.tasks = this.tasks.filter(task => task.id !== id);
      this.saveTasksToStorage();
      this.syncStatusSubject.next('pending');
    } else {
      try {
        const { LocalDatabaseService } = await import('./local-database.service');
        const localDb = new LocalDatabaseService(this.i18n);
        await localDb.deleteTask(id);
      } catch (error) {
        console.warn('SQLite no disponible, usando localStorage como fallback:', error);
        this.isWeb = true;
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasksToStorage();
        this.syncStatusSubject.next('pending');
      }
    }
  }

  // Cambiar estado de completado
  async toggleTaskComplete(id: string): Promise<void> {
    if (this.isWeb) {
      const index = this.tasks.findIndex(task => task.id === id);
      if (index !== -1) {
        this.tasks[index].completed = !this.tasks[index].completed;
        this.tasks[index].updatedAt = new Date().toISOString();
        this.saveTasksToStorage();
        this.syncStatusSubject.next('pending');
      }
    } else {
      try {
        const { LocalDatabaseService } = await import('./local-database.service');
        const localDb = new LocalDatabaseService(this.i18n);
        await localDb.toggleTaskComplete(id);
      } catch (error) {
        console.warn('SQLite no disponible, usando localStorage como fallback:', error);
        this.isWeb = true;
        const index = this.tasks.findIndex(task => task.id === id);
        if (index !== -1) {
          this.tasks[index].completed = !this.tasks[index].completed;
          this.tasks[index].updatedAt = new Date().toISOString();
          this.saveTasksToStorage();
          this.syncStatusSubject.next('pending');
        }
      }
    }
  }

  // Obtener estadísticas
  async getLocalStats(): Promise<StorageStats> {
    if (this.isWeb) {
      const total = this.tasks.length;
      const completed = this.tasks.filter(task => task.completed).length;
      return {
        total,
        completed,
        pending: total - completed
      };
    } else {
      try {
        const { LocalDatabaseService } = await import('./local-database.service');
        const localDb = new LocalDatabaseService(this.i18n);
        return await localDb.getLocalStats();
      } catch (error) {
        console.warn('SQLite no disponible, usando localStorage como fallback:', error);
        this.isWeb = true;
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        return {
          total,
          completed,
          pending: total - completed
        };
      }
    }
  }

  // Obtener tareas pendientes de sincronización (solo para móvil)
  async getPendingSyncTasks(): Promise<{ task: Task; operation: string }[]> {
    if (this.isWeb) {
      // En web, todas las tareas están "sincronizadas" localmente
      return [];
    } else {
      try {
        const { LocalDatabaseService } = await import('./local-database.service');
        const localDb = new LocalDatabaseService(this.i18n);
        return await localDb.getPendingSyncTasks();
      } catch (error) {
        console.warn('SQLite no disponible, usando localStorage como fallback:', error);
        this.isWeb = true;
        return [];
      }
    }
  }

  // Marcar tarea como sincronizada (solo para móvil)
  async markTaskAsSynced(id: string): Promise<void> {
    if (!this.isWeb) {
      try {
        const { LocalDatabaseService } = await import('./local-database.service');
        const localDb = new LocalDatabaseService(this.i18n);
        await localDb.markTaskAsSynced(id);
      } catch (error) {
        console.warn('SQLite no disponible, usando localStorage como fallback:', error);
        this.isWeb = true;
      }
    }
  }

  // Limpiar tareas eliminadas (solo para móvil)
  async cleanupDeletedTasks(): Promise<void> {
    if (!this.isWeb) {
      try {
        const { LocalDatabaseService } = await import('./local-database.service');
        const localDb = new LocalDatabaseService(this.i18n);
        await localDb.cleanupDeletedTasks();
      } catch (error) {
        console.warn('SQLite no disponible, usando localStorage como fallback:', error);
        this.isWeb = true;
      }
    }
  }

  // Cerrar conexión (solo para móvil)
  async closeDatabase(): Promise<void> {
    if (!this.isWeb) {
      try {
        const { LocalDatabaseService } = await import('./local-database.service');
        const localDb = new LocalDatabaseService(this.i18n);
        await localDb.closeDatabase();
      } catch (error) {
        console.warn('SQLite no disponible, usando localStorage como fallback:', error);
        this.isWeb = true;
      }
    }
  }

  // Verificar si estamos en web
  isWebPlatform(): boolean {
    return this.isWeb;
  }
}
