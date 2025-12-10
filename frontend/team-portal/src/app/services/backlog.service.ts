import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BacklogItem } from '../models/sprint.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BacklogService {
  private apiUrl = `${environment.scrumApiUrl}/backlog`;

  constructor(private http: HttpClient) {}

  getProjectBacklog(projectId: number): Observable<BacklogItem[]> {
    return this.http.get<BacklogItem[]>(`${environment.scrumApiUrl}/projects/${projectId}/backlog`);
  }

  getBacklogItem(id: number): Observable<BacklogItem> {
    return this.http.get<BacklogItem>(`${this.apiUrl}-items/${id}`);
  }

  createBacklogItem(projectId: number, item: Partial<BacklogItem>): Observable<BacklogItem> {
    return this.http.post<BacklogItem>(`${environment.scrumApiUrl}/projects/${projectId}/backlog-items`, item);
  }

  updateBacklogItem(id: number, item: Partial<BacklogItem>): Observable<BacklogItem> {
    return this.http.patch<BacklogItem>(`${this.apiUrl}-items/${id}`, item);
  }

  deleteBacklogItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}-items/${id}`);
  }

  reorderBacklog(projectId: number, itemIds: number[]): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}-items/reorder`, { projectId, itemIds });
  }

  estimateBacklogItem(id: number, storyPoints: number): Observable<BacklogItem> {
    return this.http.post<BacklogItem>(`${this.apiUrl}-items/${id}/estimate`, { storyPoints });
  }
}
