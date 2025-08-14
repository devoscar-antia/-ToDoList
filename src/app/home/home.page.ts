import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { AddTaskComponent } from '../components/add-task/add-task.component';
import { TaskListComponent } from '../components/task-list/task-list.component';
import { HeroIconComponent } from '../components/icons/hero-icons.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, AddTaskComponent, TaskListComponent, HeroIconComponent]
})
export class HomePage {
  constructor() {}
}
