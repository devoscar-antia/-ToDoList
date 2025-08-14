import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Task, TaskCreateRequest, TaskUpdateRequest, TaskFilters, TaskStats } from '../models/task.model';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { SyncService } from './sync.service';
import { I18nService } from './i18n.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasks: Task[] = [];
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private statsSubject = new BehaviorSubject<TaskStats | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private isOnlineSubject = new BehaviorSubject<boolean>(true);

  constructor(
    private apiService: ApiService,
    private storageService: StorageService,
    private syncService: SyncService,
    private i18n: I18nService
  ) {
    this.loadTasks();
    this.setupSyncListeners();
  }

  // Configurar listeners de sincronización
  private setupSyncListeners(): void {
    // Solo configurar sincronización si no estamos en web
    if (!this.storageService.isWebPlatform()) {
      // Escuchar estado de conexión
      this.syncService.isOnline().subscribe(isOnline => {
        this.isOnlineSubject.next(isOnline);
        if (isOnline) {
          // Intentar sincronizar cuando se recupere la conexión
          this.syncService.syncPendingTasks();
        }
      });

      // Escuchar estado de sincronización local
      this.storageService.getSyncStatus().subscribe(status => {
        if (status === 'pending') {
          // Intentar sincronizar si hay conexión
          if (this.isOnlineSubject.value) {
            this.syncService.syncPendingTasks();
          }
        }
      });
    }
  }

  // Observables públicos
  getTasks(): Observable<Task[]> {
    return this.tasksSubject.asObservable();
  }

  getStats(): Observable<TaskStats | null> {
    return this.statsSubject.asObservable();
  }

  isLoading(): Observable<boolean> {
    return this.isLoadingSubject.asObservable();
  }

  getError(): Observable<string | null> {
    return this.errorSubject.asObservable();
  }

  isOnline(): Observable<boolean> {
    return this.isOnlineSubject.asObservable();
  }

  // Cargar tareas desde el almacenamiento
  async loadTasks(filters?: TaskFilters): Promise<void> {
    this.setLoading(true);
    this.clearError();

    try {
      // Cargar desde el servicio de almacenamiento
      let tasks = await this.storageService.getTasks();

      // Aplicar filtros si se especifican
      if (filters) {
        tasks = this.applyFilters(tasks, filters);
      }

      this.tasks = tasks;
      this.tasksSubject.next([...this.tasks]);
      this.setLoading(false);

      // Intentar sincronizar en segundo plano si hay conexión y no estamos en web
      if (!this.storageService.isWebPlatform() && this.isOnlineSubject.value) {
        this.syncService.syncPendingTasks();
      }
    } catch (error) {
      this.setError(this.i18n.getTasks().errorLoadingTasks);
      this.setLoading(false);
    }
  }

  // Aplicar filtros a las tareas
  private applyFilters(tasks: Task[], filters: TaskFilters): Task[] {
    let filteredTasks = [...tasks];

    if (filters.completed !== undefined) {
      filteredTasks = filteredTasks.filter(task => task.completed === filters.completed);
    }

    if (filters.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }

    if (filters.category) {
      filteredTasks = filteredTasks.filter(task => task.category === filters.category);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description?.toLowerCase().includes(searchTerm) || false)
      );
    }

    return filteredTasks;
  }

  // Cargar estadísticas
  async loadStats(): Promise<void> {
    try {
      const localStats = await this.storageService.getLocalStats();
      
      // Crear objeto de estadísticas compatible con TaskStats
      const stats: TaskStats = {
        total: localStats.total,
        completed: localStats.completed,
        pending: localStats.pending,
        completionRate: localStats.total > 0 ? Math.round((localStats.completed / localStats.total) * 100) : 0,
        priorityStats: { high: 0, medium: 0, low: 0 },
        categoryStats: {}
      };

      // Calcular estadísticas de prioridad y categoría
      this.tasks.forEach(task => {
        stats.priorityStats[task.priority]++;
        stats.categoryStats[task.category] = (stats.categoryStats[task.category] || 0) + 1;
      });

      this.statsSubject.next(stats);
    } catch (error) {
      console.error(this.i18n.getErrors().database, error);
    }
  }

  // Agregar nueva tarea
  async addTask(title: string, description?: string, priority?: 'high' | 'medium' | 'low', category?: string, dueDate?: string): Promise<void> {
    this.setLoading(true);
    this.clearError();

    try {
      const newTask: Task = {
        id: this.generateId(),
        title: title.trim(),
        description: description ? description.trim() : '',
        completed: false,
        priority: priority || 'medium',
        category: category || 'general',
        dueDate: dueDate || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Guardar usando el servicio de almacenamiento
      await this.storageService.createTask(newTask);

      // Agregar a la lista local
      this.tasks.push(newTask);
      this.tasksSubject.next([...this.tasks]);

      // Recargar estadísticas
      this.loadStats();

      // Intentar sincronizar si hay conexión y no estamos en web
      if (!this.storageService.isWebPlatform() && this.isOnlineSubject.value) {
        this.syncService.syncPendingTasks();
      }

      this.setLoading(false);
    } catch (error) {
      this.setError(this.i18n.getErrors().database);
      this.setLoading(false);
    }
  }

  // Actualizar tarea
  async updateTask(id: string, updates: TaskUpdateRequest): Promise<void> {
    this.setLoading(true);
    this.clearError();

    try {
      // Actualizar usando el servicio de almacenamiento
      await this.storageService.updateTask(id, updates);

      // Actualizar en la lista local
      const index = this.tasks.findIndex(task => task.id === id);
      if (index !== -1) {
        this.tasks[index] = { ...this.tasks[index], ...updates, updatedAt: new Date().toISOString() };
        this.tasksSubject.next([...this.tasks]);
      }

      // Recargar estadísticas
      this.loadStats();

      // Intentar sincronizar si hay conexión y no estamos en web
      if (!this.storageService.isWebPlatform() && this.isOnlineSubject.value) {
        this.syncService.syncPendingTasks();
      }

      this.setLoading(false);
    } catch (error) {
      this.setError(this.i18n.getErrors().database);
      this.setLoading(false);
    }
  }

  // Eliminar tarea
  async deleteTask(id: string): Promise<void> {
    this.setLoading(true);
    this.clearError();

    try {
      // Eliminar usando el servicio de almacenamiento
      await this.storageService.deleteTask(id);

      // Remover de la lista local
      this.tasks = this.tasks.filter(task => task.id !== id);
      this.tasksSubject.next([...this.tasks]);

      // Recargar estadísticas
      this.loadStats();

      // Intentar sincronizar si hay conexión y no estamos en web
      if (!this.storageService.isWebPlatform() && this.isOnlineSubject.value) {
        this.syncService.syncPendingTasks();
      }

      this.setLoading(false);
    } catch (error) {
      this.setError(this.i18n.getErrors().database);
      this.setLoading(false);
    }
  }

  // Cambiar estado de completado
  async toggleTaskComplete(id: string): Promise<void> {
    this.setLoading(true);
    this.clearError();

    try {
      // Cambiar estado usando el servicio de almacenamiento
      await this.storageService.toggleTaskComplete(id);

      // Actualizar en la lista local
      const index = this.tasks.findIndex(task => task.id === id);
      if (index !== -1) {
        this.tasks[index].completed = !this.tasks[index].completed;
        this.tasks[index].updatedAt = new Date().toISOString();
        this.tasksSubject.next([...this.tasks]);
      }

      // Recargar estadísticas
      this.loadStats();

      // Intentar sincronizar si hay conexión y no estamos en web
      if (!this.storageService.isWebPlatform() && this.isOnlineSubject.value) {
        this.syncService.syncPendingTasks();
      }

      this.setLoading(false);
    } catch (error) {
      this.setError(this.i18n.getErrors().database);
      this.setLoading(false);
    }
  }

  // Filtrar tareas
  async filterTasks(filters: TaskFilters): Promise<void> {
    await this.loadTasks(filters);
  }

  // Buscar tareas
  async searchTasks(searchTerm: string): Promise<void> {
    if (searchTerm.trim()) {
      await this.loadTasks({ search: searchTerm.trim() });
    } else {
      await this.loadTasks();
    }
  }

  // Obtener tareas por prioridad
  getTasksByPriority(priority: 'high' | 'medium' | 'low'): Task[] {
    return this.tasks.filter(task => task.priority === priority);
  }

  // Obtener tareas por categoría
  getTasksByCategory(category: string): Task[] {
    return this.tasks.filter(task => task.category === category);
  }

  // Obtener tareas completadas
  getCompletedTasks(): Task[] {
    return this.tasks.filter(task => task.completed);
  }

  // Obtener tareas pendientes
  getPendingTasks(): Task[] {
    return this.tasks.filter(task => !task.completed);
  }

  // Obtener conteo de tareas
  getTaskCount(): { total: number; completed: number; pending: number } {
    const total = this.tasks.length;
    const completed = this.tasks.filter(task => task.completed).length;
    const pending = total - completed;
    
    return { total, completed, pending };
  }

  // Verificar estado de la API
  checkApiHealth(): Observable<boolean> {
    return this.apiService.checkApiHealth();
  }

  // Forzar sincronización (solo para móvil)
  async forceSync(): Promise<void> {
    if (this.storageService.isWebPlatform()) {
      console.log('Sincronización no disponible en web');
      return;
    }

    try {
      await this.syncService.forceSync();
      // Recargar tareas después de la sincronización
      await this.loadTasks();
    } catch (error) {
      this.setError(this.i18n.getErrors().syncFailed);
    }
  }

  // Obtener estado de sincronización
  getSyncStatus() {
    if (this.storageService.isWebPlatform()) {
      return of({ total: 0, completed: 0, current: 'Web - No sync needed', status: 'completed' });
    }
    return this.syncService.getSyncProgress();
  }

  // Generar ID único
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Métodos privados para manejo de estado
  private setLoading(loading: boolean): void {
    this.isLoadingSubject.next(loading);
  }

  private setError(error: string): void {
    this.errorSubject.next(error);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }
}
