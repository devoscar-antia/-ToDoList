import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { HeroIconComponent } from '../icons/hero-icons.component';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-add-task',
  templateUrl: './add-task.component.html',
  styleUrls: ['./add-task.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, HeroIconComponent]
})
export class AddTaskComponent {
  title: string = '';
  description: string = '';
  priority: 'high' | 'medium' | 'low' = 'medium';
  category: string = 'general';
  dueDate: string = '';

  priorities = [
    { value: 'high', label: 'Alta', color: 'danger' },
    { value: 'medium', label: 'Media', color: 'warning' },
    { value: 'low', label: 'Baja', color: 'success' }
  ];

  // Usar las traducciones del servicio de internacionalización
  get categories() {
    const categories = this.i18n.getCategories();
    return [
      { value: 'general', label: categories.general },
      { value: 'work', label: categories.work },
      { value: 'personal', label: categories.personal },
      { value: 'study', label: categories.study },
      { value: 'health', label: categories.health },
      { value: 'shopping', label: categories.shopping },
      { value: 'home', label: categories.home },
      { value: 'finance', label: categories.finance }
    ];
  }

  constructor(
    private taskService: TaskService,
    private i18n: I18nService
  ) { }

  addTask(): void {
    if (this.title.trim()) {
      this.taskService.addTask(
        this.title.trim(),
        this.description.trim(),
        this.priority,
        this.category,
        this.dueDate || undefined
      );

      // Reset form
      this.title = '';
      this.description = '';
      this.priority = 'medium';
      this.category = 'general';
      this.dueDate = '';
    }
  }

  getPriorityColor(priority: string): string {
    const priorityObj = this.priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : 'medium';
  }

  getPriorityLabel(priority: string): string {
    const priorityObj = this.priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.label : 'Media';
  }
}
