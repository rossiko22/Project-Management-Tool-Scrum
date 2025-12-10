import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sprint, SprintBacklogItem } from '../models/sprint.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SprintService {
  private apiUrl = `${environment.scrumApiUrl}/sprints`;

  constructor(private http: HttpClient) {}

  getProjectSprints(projectId: number): Observable<Sprint[]> {
    return this.http.get<Sprint[]>(`${environment.scrumApiUrl}/projects/${projectId}/sprints`);
  }

  getActiveSprint(projectId: number): Observable<Sprint | null> {
    return this.http.get<Sprint | null>(`${environment.scrumApiUrl}/projects/${projectId}/sprints/active`);
  }

  getSprint(id: number): Observable<Sprint> {
    return this.http.get<Sprint>(`${this.apiUrl}/${id}`);
  }

  createSprint(projectId: number, sprint: Partial<Sprint>): Observable<Sprint> {
    return this.http.post<Sprint>(`${environment.scrumApiUrl}/projects/${projectId}/sprints`, sprint);
  }

  updateSprint(id: number, sprint: Partial<Sprint>): Observable<Sprint> {
    return this.http.patch<Sprint>(`${this.apiUrl}/${id}`, sprint);
  }

  startSprint(id: number): Observable<Sprint> {
    return this.http.post<Sprint>(`${this.apiUrl}/${id}/start`, {});
  }

  endSprint(id: number): Observable<Sprint> {
    return this.http.post<Sprint>(`${this.apiUrl}/${id}/end`, {});
  }

  cancelSprint(id: number): Observable<Sprint> {
    return this.http.post<Sprint>(`${this.apiUrl}/${id}/cancel`, {});
  }

  getSprintBacklog(sprintId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${sprintId}/backlog`);
  }

  addItemToSprint(sprintId: number, backlogItemId: number, committedPoints?: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${sprintId}/backlog-items`, { backlogItemId, committedPoints });
  }

  removeItemFromSprint(sprintId: number, backlogItemId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${sprintId}/backlog-items/${backlogItemId}`);
  }

  getSprintBoard(sprintId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${sprintId}/board`);
  }
}
