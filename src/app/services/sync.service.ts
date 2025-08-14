import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { LocalDatabaseService } from './local-database.service';
import { ApiService } from './api.service';
import { Task, TaskCreateRequest, TaskUpdateRequest } from '../models/task.model';
import { I18nService } from './i18n.service';

export interface SyncProgress {
    total: number;
    completed: number;
    current: string;
    status: 'idle' | 'syncing' | 'completed' | 'error';
}

@Injectable({
    providedIn: 'root'
})
export class SyncService {
    private syncProgressSubject = new BehaviorSubject<SyncProgress>({
        total: 0,
        completed: 0,
        current: '',
        status: 'idle'
    });

    private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
    private autoSyncInterval: any;

    constructor(
        private localDb: LocalDatabaseService,
        private apiService: ApiService,
        private i18n: I18nService
    ) {
        this.setupOnlineStatusListener();
        this.startAutoSync();
    }

    // Configurar listener de estado de conexión
    private setupOnlineStatusListener(): void {
        window.addEventListener('online', () => {
            this.isOnlineSubject.next(true);
            this.syncPendingTasks();
        });

        window.addEventListener('offline', () => {
            this.isOnlineSubject.next(false);
        });
    }

    // Iniciar sincronización automática
    private startAutoSync(): void {
        // Sincronizar cada 30 segundos si hay conexión
        this.autoSyncInterval = interval(30000).pipe(
            switchMap(() => this.isOnlineSubject.value ? this.syncPendingTasks() : of(null))
        ).subscribe();
    }

    // Obtener progreso de sincronización
    getSyncProgress(): Observable<SyncProgress> {
        return this.syncProgressSubject.asObservable();
    }

    // Obtener estado de conexión
    isOnline(): Observable<boolean> {
        return this.isOnlineSubject.asObservable();
    }

    // Sincronizar tareas pendientes
    async syncPendingTasks(): Promise<void> {
        if (!this.isOnlineSubject.value) {
            console.log(this.i18n.getMessages().workingOffline);
            return;
        }

        try {
            const pendingTasks = await this.localDb.getPendingSyncTasks();

            if (pendingTasks.length === 0) {
                console.log(this.i18n.getMessages().dataSaved);
                return;
            }

            this.syncProgressSubject.next({
                total: pendingTasks.length,
                completed: 0,
                current: this.i18n.getSync().syncInProgress,
                status: 'syncing'
            });

            console.log(this.i18n.translate('messages.pendingSync', { count: pendingTasks.length }));

            for (let i = 0; i < pendingTasks.length; i++) {
                const { task, operation } = pendingTasks[i];

                try {
                    this.syncProgressSubject.next({
                        total: pendingTasks.length,
                        completed: i,
                        current: this.i18n.translate('sync.syncing', { task: task.title }),
                        status: 'syncing'
                    });

                    await this.syncTask(task, operation);

                    // Marcar como sincronizada
                    await this.localDb.markTaskAsSynced(task.id);

                    console.log(this.i18n.translate('messages.taskUpdated', { task: task.title }));
                } catch (error) {
                    console.error(this.i18n.translate('errors.syncFailed', { task: task.title }), error);
                    // Continuar con la siguiente tarea
                }
            }

            // Limpiar tareas eliminadas
            await this.localDb.cleanupDeletedTasks();

            this.syncProgressSubject.next({
                total: pendingTasks.length,
                completed: pendingTasks.length,
                current: this.i18n.getSync().syncCompleted,
                status: 'completed'
            });

            console.log(this.i18n.getMessages().syncCompleted);

            // Resetear estado después de 3 segundos
            setTimeout(() => {
                this.syncProgressSubject.next({
                    total: 0,
                    completed: 0,
                    current: '',
                    status: 'idle'
                });
            }, 3000);

        } catch (error) {
            console.error(this.i18n.getErrors().syncFailed, error);
            this.syncProgressSubject.next({
                total: 0,
                completed: 0,
                current: this.i18n.getErrors().syncFailed,
                status: 'error'
            });
        }
    }

    // Sincronizar una tarea específica
    private async syncTask(task: Task, operation: string): Promise<void> {
        switch (operation) {
            case 'CREATE':
                await this.apiService.createTask({
                    title: task.title,
                    description: task.description,
                    priority: task.priority,
                    category: task.category,
                    dueDate: task.dueDate
                });
                break;

            case 'UPDATE':
                await this.apiService.updateTask(task.id, {
                    title: task.title,
                    description: task.description,
                    completed: task.completed,
                    priority: task.priority,
                    category: task.category,
                    dueDate: task.dueDate
                });
                break;

            case 'DELETE':
                await this.apiService.deleteTask(task.id);
                break;

            default:
                throw new Error(this.i18n.translate('errors.invalidOperation', { operation }));
        }
    }

    // Sincronizar desde la API hacia local (pull)
    async pullFromApi(): Promise<void> {
        if (!this.isOnlineSubject.value) {
            console.log(this.i18n.getMessages().workingOffline);
            return;
        }

        try {
            this.syncProgressSubject.next({
                total: 1,
                completed: 0,
                current: this.i18n.translate('sync.pullingFromApi'),
                status: 'syncing'
            });

            // Obtener tareas de la API
            const apiTasks = await this.apiService.getTasks().toPromise();

            if (!apiTasks) {
                throw new Error(this.i18n.getErrors().api);
            }

            // Obtener tareas locales
            const localTasks = await this.localDb.getTasks();

            // Crear mapas para comparación eficiente
            const localTaskMap = new Map(localTasks.map(t => [t.id, t]));
            const apiTaskMap = new Map(apiTasks.map(t => [t.id, t]));

            let updatedCount = 0;
            let createdCount = 0;

            // Actualizar tareas existentes y crear nuevas
            for (const apiTask of apiTasks) {
                const localTask = localTaskMap.get(apiTask.id);

                if (localTask) {
                    // Verificar si la tarea local es más reciente
                    const localDate = new Date(localTask.updatedAt);
                    const apiDate = new Date(apiTask.updatedAt);

                    if (apiDate > localDate) {
                        // La API tiene una versión más reciente
                        await this.localDb.updateTask(apiTask.id, {
                            title: apiTask.title,
                            description: apiTask.description,
                            completed: apiTask.completed,
                            priority: apiTask.priority,
                            category: apiTask.category,
                            dueDate: apiTask.dueDate
                        });
                        updatedCount++;
                    }
                } else {
                    // Nueva tarea en la API
                    await this.localDb.createTask(apiTask);
                    createdCount++;
                }
            }

            this.syncProgressSubject.next({
                total: 1,
                completed: 1,
                current: this.i18n.translate('sync.pullCompleted', { updated: updatedCount, created: createdCount }),
                status: 'completed'
            });

            console.log(this.i18n.translate('sync.pullCompleted', { updated: updatedCount, created: createdCount }));

            // Resetear estado después de 3 segundos
            setTimeout(() => {
                this.syncProgressSubject.next({
                    total: 0,
                    completed: 0,
                    current: '',
                    status: 'idle'
                });
            }, 3000);

        } catch (error) {
            console.error(this.i18n.getErrors().api, error);
            this.syncProgressSubject.next({
                total: 0,
                completed: 0,
                current: this.i18n.getErrors().api,
                status: 'error'
            });
        }
    }

    // Sincronización completa bidireccional
    async fullSync(): Promise<void> {
        if (!this.isOnlineSubject.value) {
            console.log(this.i18n.getMessages().workingOffline);
            return;
        }

        try {
            this.syncProgressSubject.next({
                total: 2,
                completed: 0,
                current: this.i18n.translate('sync.fullSyncStarted'),
                status: 'syncing'
            });

            // Primero sincronizar desde la API (pull)
            await this.pullFromApi();

            this.syncProgressSubject.next({
                total: 2,
                completed: 1,
                current: this.i18n.translate('sync.syncingLocalChanges'),
                status: 'syncing'
            });

            // Luego sincronizar cambios locales (push)
            await this.syncPendingTasks();

            this.syncProgressSubject.next({
                total: 2,
                completed: 2,
                current: this.i18n.translate('sync.fullSyncCompleted'),
                status: 'completed'
            });

            console.log(this.i18n.translate('sync.fullSyncCompleted'));

        } catch (error) {
            console.error(this.i18n.getErrors().syncFailed, error);
            this.syncProgressSubject.next({
                total: 0,
                completed: 0,
                current: this.i18n.getErrors().syncFailed,
                status: 'error'
            });
        }
    }

    // Forzar sincronización manual
    async forceSync(): Promise<void> {
        console.log(this.i18n.translate('sync.forceSync'));
        await this.fullSync();
    }

    // Detener sincronización automática
    stopAutoSync(): void {
        if (this.autoSyncInterval) {
            this.autoSyncInterval.unsubscribe();
        }
    }

    // Obtener estadísticas de sincronización
    async getSyncStats(): Promise<{
        pendingSync: number;
        lastSync: string | null;
        totalLocal: number;
        totalApi: number;
    }> {
        try {
            const pendingTasks = await this.localDb.getPendingSyncTasks();
            const localStats = await this.localDb.getLocalStats();

            // Intentar obtener estadísticas de la API si hay conexión
            let apiStats = { total: 0 };
            if (this.isOnlineSubject.value) {
                try {
                    const apiResponse = await this.apiService.getStats().toPromise();
                    if (apiResponse) {
                        apiStats = apiResponse;
                    }
                } catch (error) {
                    console.log(this.i18n.getMessages().workingOffline);
                }
            }

            return {
                pendingSync: pendingTasks.length,
                lastSync: null, // TODO: Implementar tracking de última sincronización
                totalLocal: localStats.total,
                totalApi: apiStats.total
            };
        } catch (error) {
            console.error(this.i18n.getErrors().syncFailed, error);
            return {
                pendingSync: 0,
                lastSync: null,
                totalLocal: 0,
                totalApi: 0
            };
        }
    }
}
