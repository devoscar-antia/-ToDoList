import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { SyncService, SyncProgress } from '../../services/sync.service';
import { HeroIconComponent } from '../icons/hero-icons.component';

@Component({
    selector: 'app-sync-status',
    templateUrl: './sync-status.component.html',
    styleUrls: ['./sync-status.component.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, HeroIconComponent]
})
export class SyncStatusComponent implements OnInit, OnDestroy {
    syncProgress: SyncProgress = {
        total: 0,
        completed: 0,
        current: '',
        status: 'idle'
    };

    isOnline = true;
    syncStats = {
        pendingSync: 0,
        lastSync: null,
        totalLocal: 0,
        totalApi: 0
    };

    private subscriptions: Subscription[] = [];

    constructor(
        private taskService: TaskService,
        private syncService: SyncService
    ) { }

    ngOnInit(): void {
        this.setupSubscriptions();
        this.loadSyncStats();
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    private setupSubscriptions(): void {
        // Estado de sincronización
        this.subscriptions.push(
            this.syncService.getSyncProgress().subscribe(progress => {
                this.syncProgress = progress;
            })
        );

        // Estado de conexión
        this.subscriptions.push(
            this.taskService.isOnline().subscribe(isOnline => {
                this.isOnline = isOnline;
            })
        );
    }

    private async loadSyncStats(): Promise<void> {
        try {
            this.syncStats = await this.syncService.getSyncStats();
        } catch (error) {
            console.error('Error cargando estadísticas de sincronización:', error);
        }
    }

    // Forzar sincronización manual
    async forceSync(): Promise<void> {
        try {
            await this.taskService.forceSync();
            // Recargar estadísticas después de la sincronización
            setTimeout(() => this.loadSyncStats(), 1000);
        } catch (error) {
            console.error('Error en sincronización forzada:', error);
        }
    }

    // Obtener color del estado de sincronización
    getSyncStatusColor(): string {
        switch (this.syncProgress.status) {
            case 'syncing':
                return 'warning';
            case 'completed':
                return 'success';
            case 'error':
                return 'danger';
            default:
                return 'medium';
        }
    }

    // Obtener icono del estado de sincronización
    getSyncStatusIcon(): string {
        switch (this.syncProgress.status) {
            case 'syncing':
                return 'refresh';
            case 'completed':
                return 'check';
            case 'error':
                return 'exclamation';
            default:
                return 'cloud';
        }
    }

    // Obtener texto del estado de conexión
    getConnectionStatusText(): string {
        return this.isOnline ? 'En línea' : 'Sin conexión';
    }

    // Obtener color del estado de conexión
    getConnectionStatusColor(): string {
        return this.isOnline ? 'success' : 'danger';
    }

    // Obtener icono del estado de conexión
    getConnectionStatusIcon(): string {
        return this.isOnline ? 'wifi' : 'wifi-off';
    }

    // Verificar si hay tareas pendientes de sincronización
    hasPendingSync(): boolean {
        return this.syncStats.pendingSync > 0;
    }

    // Obtener porcentaje de progreso
    getProgressPercentage(): number {
        if (this.syncProgress.total === 0) return 0;
        return Math.round((this.syncProgress.completed / this.syncProgress.total) * 100);
    }

    // Obtener texto de progreso
    getProgressText(): string {
        if (this.syncProgress.status === 'idle') {
            return 'Listo para sincronizar';
        }

        if (this.syncProgress.status === 'syncing') {
            if (this.syncProgress.total > 0) {
                return `${this.syncProgress.completed}/${this.syncProgress.total} - ${this.syncProgress.current}`;
            }
            return this.syncProgress.current;
        }

        if (this.syncProgress.status === 'completed') {
            return 'Sincronización completada';
        }

        if (this.syncProgress.status === 'error') {
            return 'Error en sincronización';
        }

        return '';
    }
}
