import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../models/sprint.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.scrumApiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  getBacklogItemTasks(backlogItemId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${environment.scrumApiUrl}/backlog-items/${backlogItemId}/tasks`);
  }

  getTask(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  createTask(backlogItemId: number, task: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(`${environment.scrumApiUrl}/backlog-items/${backlogItemId}/tasks`, task);
  }

  updateTask(id: number, task: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${id}`, task);
  }

  updateTaskStatus(id: number, status: Task['status']): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${id}/status`, { status });
  }

  assignTask(id: number, assigneeId: number): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${id}/assign`, { assigneeId });
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
