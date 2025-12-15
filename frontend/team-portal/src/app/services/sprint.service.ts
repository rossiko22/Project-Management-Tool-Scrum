import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sprint, SprintBacklogItem, CreateSprintRequest } from '../models/sprint.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SprintService {
  private apiUrl = `${environment.scrumApiUrl}/sprints`;

  constructor(private http: HttpClient) {}

  getProjectSprints(projectId: number): Observable<Sprint[]> {
    return this.http.get<Sprint[]>(`${this.apiUrl}/project/${projectId}`);
  }

  getActiveSprint(projectId: number): Observable<Sprint | null> {
    return this.http.get<Sprint | null>(`${this.apiUrl}/project/${projectId}/active`);
  }

  getSprint(id: number): Observable<Sprint> {
    return this.http.get<Sprint>(`${this.apiUrl}/${id}`);
  }

  createSprint(request: CreateSprintRequest): Observable<Sprint> {
    return this.http.post<Sprint>(this.apiUrl, request);
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

  addItemToSprint(sprintId: number, backlogItemId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${sprintId}/items/${backlogItemId}`, {});
  }

  removeItemFromSprint(sprintId: number, backlogItemId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${sprintId}/items/${backlogItemId}`);
  }

  getSprintBoard(sprintId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${sprintId}/board`);
  }
}

