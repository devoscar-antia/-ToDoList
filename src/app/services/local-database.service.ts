import { Injectable } from '@angular/core';
import { SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Task, TaskCreateRequest, TaskUpdateRequest } from '../models/task.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { I18nService } from './i18n.service';

@Injectable({
  providedIn: 'root'
})
export class LocalDatabaseService {
  private sqlite!: SQLiteConnection;
  private db!: SQLiteDBConnection;
  private isReady = false;
  private syncStatusSubject = new BehaviorSubject<'synced' | 'pending' | 'error'>('synced');

  constructor(private i18n: I18nService) {
    this.initDatabase();
  }

  // Inicializar la base de datos
  private async initDatabase(): Promise<void> {
    try {
      const { CapacitorSQLite } = await import('@capacitor-community/sqlite');
      this.sqlite = new SQLiteConnection(CapacitorSQLite);
      this.db = await this.sqlite.createConnection(
        'todo_app',
        false,
        'no-encryption',
        1,
        false
      );

      await this.db.open();
      await this.createTables();
      this.isReady = true;
      console.log(this.i18n.getDatabase().initialized);
    } catch (error) {
      console.error(this.i18n.getDatabase().errorInitializing, error);
      this.syncStatusSubject.next('error');
    }
  }

  // Crear tablas necesarias
  private async createTables(): Promise<void> {
    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        completed INTEGER DEFAULT 0,
        priority TEXT DEFAULT 'medium',
        category TEXT DEFAULT 'general',
        dueDate TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncStatus TEXT DEFAULT 'synced',
        lastSynced TEXT
      )
    `;

    const createSyncLogTable = `
      CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taskId TEXT NOT NULL,
        operation TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      )
    `;

    await this.db.execute(createTasksTable);
    await this.db.execute(createSyncLogTable);
  }

  // Verificar si la base de datos está lista
  private async ensureReady(): Promise<void> {
    if (!this.isReady) {
      await this.initDatabase();
    }
  }

  // Obtener estado de sincronización
  getSyncStatus(): Observable<'synced' | 'pending' | 'error'> {
    return this.syncStatusSubject.asObservable();
  }

  // Obtener todas las tareas
  async getTasks(): Promise<Task[]> {
    await this.ensureReady();
    
    try {
      const result = await this.db.query('SELECT * FROM tasks ORDER BY createdAt DESC');
      return result.values?.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        completed: Boolean(row.completed),
        priority: row.priority,
        category: row.category,
        dueDate: row.dueDate,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      })) || [];
    } catch (error) {
      console.error(this.i18n.getErrors().database, error);
      return [];
    }
  }

  // Obtener tarea por ID
  async getTask(id: string): Promise<Task | null> {
    await this.ensureReady();
    
    try {
      const result = await this.db.query('SELECT * FROM tasks WHERE id = ?', [id]);
      if (result.values && result.values.length > 0) {
        const row = result.values[0];
        return {
          id: row.id,
          title: row.title,
          description: row.description || '',
          completed: Boolean(row.completed),
          priority: row.priority,
          category: row.category,
          dueDate: row.dueDate,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        };
      }
      return null;
    } catch (error) {
      console.error(this.i18n.getErrors().database, error);
      return null;
    }
  }

  // Crear nueva tarea
  async createTask(task: Task): Promise<void> {
    await this.ensureReady();
    
    try {
      const query = `
        INSERT INTO tasks (id, title, description, completed, priority, category, dueDate, createdAt, updatedAt, syncStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.db.run(query, [
        task.id,
        task.title,
        task.description || '',
        task.completed ? 1 : 0,
        task.priority,
        task.category,
        task.dueDate || null,
        task.createdAt,
        task.updatedAt,
        'pending'
      ]);

      // Registrar en log de sincronización
      await this.logSyncOperation(task.id, 'CREATE');
      this.syncStatusSubject.next('pending');
    } catch (error) {
      console.error(this.i18n.getErrors().database, error);
      throw error;
    }
  }

  // Actualizar tarea
  async updateTask(id: string, updates: TaskUpdateRequest): Promise<void> {
    await this.ensureReady();
    
    try {
      const currentTask = await this.getTask(id);
      if (!currentTask) {
        throw new Error(this.i18n.getErrors().taskNotFound);
      }

      const updatedTask = { ...currentTask, ...updates, updatedAt: new Date().toISOString() };
      
      const query = `
        UPDATE tasks 
        SET title = ?, description = ?, completed = ?, priority = ?, category = ?, dueDate = ?, updatedAt = ?, syncStatus = ?
        WHERE id = ?
      `;
      
      await this.db.run(query, [
        updatedTask.title,
        updatedTask.description || '',
        updatedTask.completed ? 1 : 0,
        updatedTask.priority,
        updatedTask.category,
        updatedTask.dueDate || null,
        updatedTask.updatedAt,
        'pending',
        id
      ]);

      // Registrar en log de sincronización
      await this.logSyncOperation(id, 'UPDATE');
      this.syncStatusSubject.next('pending');
    } catch (error) {
      console.error(this.i18n.getErrors().database, error);
      throw error;
    }
  }

  // Eliminar tarea
  async deleteTask(id: string): Promise<void> {
    await this.ensureReady();
    
    try {
      // Marcar como eliminada en lugar de eliminar físicamente
      const query = `UPDATE tasks SET syncStatus = 'deleted' WHERE id = ?`;
      await this.db.run(query, [id]);

      // Registrar en log de sincronización
      await this.logSyncOperation(id, 'DELETE');
      this.syncStatusSubject.next('pending');
    } catch (error) {
      console.error(this.i18n.getErrors().database, error);
      throw error;
    }
  }

  // Cambiar estado de completado
  async toggleTaskComplete(id: string): Promise<void> {
    await this.ensureReady();
    
    try {
      const currentTask = await this.getTask(id);
      if (!currentTask) {
        throw new Error(this.i18n.getErrors().taskNotFound);
      }

      const newCompleted = !currentTask.completed;
      const query = `UPDATE tasks SET completed = ?, updatedAt = ?, syncStatus = ? WHERE id = ?`;
      
      await this.db.run(query, [
        newCompleted ? 1 : 0,
        new Date().toISOString(),
        'pending',
        id
      ]);

      // Registrar en log de sincronización
      await this.logSyncOperation(id, 'UPDATE');
      this.syncStatusSubject.next('pending');
    } catch (error) {
      console.error(this.i18n.getErrors().database, error);
      throw error;
    }
  }

  // Obtener tareas pendientes de sincronización
  async getPendingSyncTasks(): Promise<{ task: Task; operation: string }[]> {
    await this.ensureReady();
    
    try {
      const result = await this.db.query(`
        SELECT t.*, sl.operation 
        FROM tasks t 
        INNER JOIN sync_log sl ON t.id = sl.taskId 
        WHERE sl.synced = 0 AND t.syncStatus != 'synced'
        ORDER BY sl.timestamp ASC
      `);

      return result.values?.map(row => ({
        task: {
          id: row.id,
          title: row.title,
          description: row.description || '',
          completed: Boolean(row.completed),
          priority: row.priority,
          category: row.category,
          dueDate: row.dueDate,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        },
        operation: row.operation
      })) || [];
    } catch (error) {
      console.error(this.i18n.getErrors().database, error);
      return [];
    }
  }

  // Marcar tarea como sincronizada
  async markTaskAsSynced(id: string): Promise<void> {
    await this.ensureReady();
    
    try {
      // Actualizar estado de sincronización
      await this.db.run(
        'UPDATE tasks SET syncStatus = ?, lastSynced = ? WHERE id = ?',
        ['synced', new Date().toISOString(), id]
      );

      // Marcar log como sincronizado
      await this.db.run(
        'UPDATE sync_log SET synced = 1 WHERE taskId = ?',
        [id]
      );

      // Verificar si todas las tareas están sincronizadas
      const pendingResult = await this.db.query(
        'SELECT COUNT(*) as count FROM sync_log WHERE synced = 0'
      );
      
      if (pendingResult.values && pendingResult.values[0].count === 0) {
        this.syncStatusSubject.next('synced');
      }
    } catch (error) {
      console.error(this.i18n.getErrors().database, error);
    }
  }

  // Registrar operación de sincronización
  private async logSyncOperation(taskId: string, operation: string): Promise<void> {
    try {
      await this.db.run(
        'INSERT INTO sync_log (taskId, operation, timestamp) VALUES (?, ?, ?)',
        [taskId, operation, new Date().toISOString()]
      );
    } catch (error) {
      console.error(this.i18n.getErrors().database, error);
    }
  }

  // Limpiar tareas eliminadas sincronizadas
  async cleanupDeletedTasks(): Promise<void> {
    await this.ensureReady();
    
    try {
      await this.db.run(
        'DELETE FROM tasks WHERE syncStatus = ?',
        ['deleted']
      );
    } catch (error) {
      console.error(this.i18n.getErrors().database, error);
    }
  }

  // Obtener estadísticas locales
  async getLocalStats(): Promise<{ total: number; completed: number; pending: number }> {
    await this.ensureReady();
    
    try {
      const totalResult = await this.db.query('SELECT COUNT(*) as count FROM tasks WHERE syncStatus != ?', ['deleted']);
      const completedResult = await this.db.query('SELECT COUNT(*) as count FROM tasks WHERE completed = 1 AND syncStatus != ?', ['deleted']);
      
      const total = totalResult.values?.[0]?.count || 0;
      const completed = completedResult.values?.[0]?.count || 0;
      
      return {
        total,
        completed,
        pending: total - completed
      };
    } catch (error) {
      console.error(this.i18n.getErrors().database, error);
      return { total: 0, completed: 0, pending: 0 };
    }
  }

  // Cerrar conexión a la base de datos
  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
    }
    if (this.sqlite) {
      await this.sqlite.closeConnection('todo_app', false);
    }
  }
}
