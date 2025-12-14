import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Impediment } from '../models/sprint.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImpedimentService {
  private apiUrl = `${environment.scrumApiUrl}/impediments`;

  constructor(private http: HttpClient) {}

  createImpediment(sprintId: number, title: string, description: string): Observable<Impediment> {
    return this.http.post<Impediment>(this.apiUrl, {
      sprintId,
      title,
      description
    });
  }

  getSprintImpediments(sprintId: number): Observable<Impediment[]> {
    return this.http.get<Impediment[]>(`${this.apiUrl}/sprint/${sprintId}`);
  }

  getOpenImpediments(sprintId: number): Observable<Impediment[]> {
    return this.http.get<Impediment[]>(`${this.apiUrl}/sprint/${sprintId}/open`);
  }

  getImpediment(id: number): Observable<Impediment> {
    return this.http.get<Impediment>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: number, status: string): Observable<Impediment> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<Impediment>(`${this.apiUrl}/${id}/status`, null, { params });
  }

  assignImpediment(id: number, assignedTo: number): Observable<Impediment> {
    const params = new HttpParams().set('assignedTo', assignedTo.toString());
    return this.http.patch<Impediment>(`${this.apiUrl}/${id}/assign`, null, { params });
  }

  resolveImpediment(id: number, resolution: string): Observable<Impediment> {
    const params = new HttpParams().set('resolution', resolution);
    return this.http.post<Impediment>(`${this.apiUrl}/${id}/resolve`, null, { params });
  }

  deleteImpediment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
