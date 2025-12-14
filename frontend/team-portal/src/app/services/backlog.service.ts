import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
    return this.http.get<BacklogItem[]>(`${this.apiUrl}/project/${projectId}`);
  }

  getBacklogItem(id: number): Observable<BacklogItem> {
    return this.http.get<BacklogItem>(`${this.apiUrl}/${id}`);
  }

  createBacklogItem(projectId: number, item: Partial<BacklogItem>): Observable<BacklogItem> {
    return this.http.post<BacklogItem>(this.apiUrl, { ...item, projectId });
  }

  updateBacklogItem(id: number, item: Partial<BacklogItem>): Observable<BacklogItem> {
    return this.http.put<BacklogItem>(`${this.apiUrl}/${id}`, item);
  }

  deleteBacklogItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  reorderBacklog(projectId: number, itemIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/project/${projectId}/reorder`, itemIds);
  }

  estimateBacklogItem(id: number, storyPoints: number): Observable<BacklogItem> {
    return this.http.post<BacklogItem>(`${this.apiUrl}/${id}/estimate`, { storyPoints });
  }

  acceptBacklogItem(id: number): Observable<BacklogItem> {
    return this.http.post<BacklogItem>(`${this.apiUrl}/${id}/accept`, null);
  }

  rejectBacklogItem(id: number, reason: string): Observable<BacklogItem> {
    const params = new HttpParams().set('reason', reason);
    return this.http.post<BacklogItem>(`${this.apiUrl}/${id}/reject`, null, { params });
  }
}
