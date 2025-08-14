import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  Task, 
  TaskCreateRequest, 
  TaskUpdateRequest, 
  ApiResponse, 
  TaskFilters, 
  TaskStats 
} from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // GET /api/tasks - Obtener todas las tareas
  getTasks(filters?: TaskFilters): Observable<Task[]> {
    let url = `${this.baseUrl}/tasks`;
    
    if (filters) {
      const params = new URLSearchParams();
      if (filters.completed !== undefined) params.append('completed', filters.completed.toString());
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    return this.http.get<ApiResponse<Task[]>>(url).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // GET /api/tasks/:id - Obtener una tarea específica
  getTask(id: string): Observable<Task> {
    return this.http.get<ApiResponse<Task>>(`${this.baseUrl}/tasks/${id}`).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // POST /api/tasks - Crear una nueva tarea
  createTask(taskData: TaskCreateRequest): Observable<Task> {
    return this.http.post<ApiResponse<Task>>(`${this.baseUrl}/tasks`, taskData).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // PUT /api/tasks/:id - Actualizar una tarea
  updateTask(id: string, taskData: TaskUpdateRequest): Observable<Task> {
    return this.http.put<ApiResponse<Task>>(`${this.baseUrl}/tasks/${id}`, taskData).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // DELETE /api/tasks/:id - Eliminar una tarea
  deleteTask(id: string): Observable<Task> {
    return this.http.delete<ApiResponse<Task>>(`${this.baseUrl}/tasks/${id}`).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // PATCH /api/tasks/:id/toggle - Cambiar estado de completado
  toggleTaskComplete(id: string): Observable<Task> {
    return this.http.patch<ApiResponse<Task>>(`${this.baseUrl}/tasks/${id}/toggle`, {}).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // GET /api/stats - Obtener estadísticas
  getStats(): Observable<TaskStats> {
    return this.http.get<ApiResponse<TaskStats>>(`${this.baseUrl}/stats`).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // Manejo de errores HTTP
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        switch (error.status) {
          case 400:
            errorMessage = 'Datos de entrada inválidos';
            break;
          case 404:
            errorMessage = 'Recurso no encontrado';
            break;
          case 500:
            errorMessage = 'Error interno del servidor';
            break;
          default:
            errorMessage = `Error ${error.status}: ${error.statusText}`;
        }
      }
    }

    console.error('Error en API Service:', error);
    return throwError(() => new Error(errorMessage));
  }

  // Verificar si la API está disponible
  checkApiHealth(): Observable<boolean> {
    return this.http.get(`${this.baseUrl.replace('/api', '')}`).pipe(
      map(() => true),
      catchError(() => throwError(() => new Error('API no disponible')))
    );
  }
}
