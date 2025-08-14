import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Task, TaskUpdateRequest } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { HeroIconComponent } from '../icons/hero-icons.component';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SpanishDateTimePipe } from '../../pipes/spanish-datetime.pipe';
import { SpanishDatePipe } from '../../pipes/spanish-date.pipe';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeroIconComponent, TranslatePipe, SpanishDateTimePipe, SpanishDatePipe]
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  editingTask: Task | null = null;
  originalTitle: string = '';
  originalDescription: string = '';
  originalPriority: string = '';
  originalCategory: string = '';
  originalDueDate: string = '';
  isLoading: boolean = false;
  error: string | null = null;
  deletingTasks: Set<string> = new Set(); // Para rastrear tareas en proceso de eliminación

  constructor(
    private taskService: TaskService,
    private alertController: AlertController,
    private toastController: ToastController,
    private i18n: I18nService
  ) { }

  ngOnInit() {
    this.taskService.getTasks().subscribe(tasks => {
      this.tasks = tasks;
    });

    this.taskService.isLoading().subscribe(loading => {
      this.isLoading = loading;
    });

    this.taskService.getError().subscribe(error => {
      this.error = error;
      if (error) {
        this.showToast(error, 'danger');
      }
    });
  }

  startEdit(task: Task): void {
    this.editingTask = task;
    this.originalTitle = task.title;
    this.originalDescription = task.description || '';
    this.originalPriority = task.priority;
    this.originalCategory = task.category;
    this.originalDueDate = task.dueDate || '';
  }

  cancelEdit(): void {
    if (this.hasUnsavedChanges()) {
      this.showConfirmCancel();
    } else {
      this.resetEditMode();
    }
  }

  saveTask(): void {
    if (this.editingTask && this.editingTask.title.trim()) {
      const updates: TaskUpdateRequest = {
        title: this.editingTask.title.trim(),
        description: this.editingTask.description?.trim() || '',
        priority: this.editingTask.priority,
        category: this.editingTask.category,
        dueDate: this.editingTask.dueDate || undefined
      };

      this.taskService.updateTask(this.editingTask.id, updates);
      this.resetEditMode();
      this.showToast('Tarea actualizada exitosamente', 'success');
    }
  }

  deleteTask(task: Task): void {
    this.showDeleteConfirmation(task);
  }

  // Nuevo método para eliminar con animación
  async deleteTaskWithAnimation(task: Task): Promise<void> {
    // Marcar la tarea como en proceso de eliminación
    this.deletingTasks.add(task.id);

    // Eliminar la tarea del servicio inmediatamente para que el badge desaparezca
    this.taskService.deleteTask(task.id);

    // Remover del set de tareas eliminándose
    this.deletingTasks.delete(task.id);

    // Mostrar mensaje de confirmación
    this.showToast('Tarea eliminada exitosamente', 'success');
  }

  toggleComplete(task: Task): void {
    this.taskService.toggleTaskComplete(task.id);
    const status = task.completed ? 'marcada como pendiente' : 'marcada como completada';
    this.showToast(`Tarea ${status}`, 'success');
  }

  onTitleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.saveTask();
    }
  }

  hasUnsavedChanges(): boolean {
    if (!this.editingTask) return false;

    return this.editingTask.title !== this.originalTitle ||
      this.editingTask.description !== this.originalDescription ||
      this.editingTask.priority !== this.originalPriority ||
      this.editingTask.category !== this.originalCategory ||
      this.editingTask.dueDate !== this.originalDueDate;
  }

  private resetEditMode(): void {
    this.editingTask = null;
    this.originalTitle = '';
    this.originalDescription = '';
    this.originalPriority = '';
    this.originalCategory = '';
    this.originalDueDate = '';
  }

  private async showConfirmCancel(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Cambios sin guardar',
      message: '¿Estás seguro de que quieres cancelar? Se perderán los cambios.',
      buttons: [
        {
          text: 'Continuar editando',
          role: 'cancel'
        },
        {
          text: 'Descartar cambios',
          handler: () => {
            this.resetEditMode();
          }
        }
      ]
    });

    await alert.present();
  }

  private async showDeleteConfirmation(task: Task): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que quieres eliminar la tarea "${task.title}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.deleteTaskWithAnimation(task);
          }
        }
      ]
    });

    await alert.present();
  }

  private async showToast(message: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  getPriorityColor(priority: string): string {
    const colors = {
      high: 'danger',
      medium: 'warning',
      low: 'success'
    };
    return colors[priority as keyof typeof colors] || 'medium';
  }

  getPriorityLabel(priority: string): string {
    const priorities = this.i18n.getPriorities();
    const labels = {
      high: priorities.high,
      medium: priorities.medium,
      low: priorities.low
    };
    return labels[priority as keyof typeof labels] || priorities.medium;
  }

  getCategoryLabel(category: string): string {
    const categories = this.i18n.getCategories();
    const categoryMap: Record<string, string> = {
      general: categories.general,
      work: categories.work,
      personal: categories.personal,
      study: categories.study,
      health: categories.health,
      shopping: categories.shopping,
      home: categories.home,
      finance: categories.finance
    };
    return categoryMap[category] || category;
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.completed) return false;

    // Crear fecha de vencimiento y configurarla al inicio del día
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    // Crear fecha de hoy al inicio del día para comparación justa
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Logs de depuración
    console.log('🔍 DEBUG isOverdue:', {
      taskTitle: task.title,
      originalDueDate: task.dueDate,
      parsedDueDate: dueDate.toISOString(),
      dueDateHours: dueDate.getHours(),
      today: today.toISOString(),
      todayHours: today.getHours(),
      comparison: dueDate < today,
      dueDateTime: dueDate.getTime(),
      todayTime: today.getTime()
    });

    // Una tarea está vencida si su fecha de vencimiento es anterior a hoy
    return dueDate < today;
  }

  getDaysUntilDue(task: Task): number {
    if (!task.dueDate) return 0;

    // Crear fecha de vencimiento al inicio del día
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    // Crear fecha de hoy al inicio del día
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calcular diferencia en días
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Logs de depuración
    console.log('🔍 DEBUG getDaysUntilDue:', {
      taskTitle: task.title,
      originalDueDate: task.dueDate,
      parsedDueDate: dueDate.toISOString(),
      today: today.toISOString(),
      diffTime,
      diffDays
    });

    return diffDays;
  }

  getDueDateText(task: Task): string {
    if (!task.dueDate) return '';

    const daysUntilDue = this.getDaysUntilDue(task);

    if (task.completed) {
      return 'Completada';
    }

    if (this.isOverdue(task)) {
      return `Vencida hace ${Math.abs(daysUntilDue)} días`;
    }

    if (daysUntilDue === 0) {
      return 'Vence hoy';
    } else if (daysUntilDue === 1) {
      return 'Vence mañana';
    } else if (daysUntilDue > 1) {
      return `Vence en ${daysUntilDue} días`;
    }

    return '';
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }
}
