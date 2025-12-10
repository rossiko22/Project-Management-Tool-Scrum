import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Impediment } from '../models/sprint.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImpedimentService {
  private apiUrl = `${environment.scrumApiUrl}/impediments`;

  constructor(private http: HttpClient) {}

  getSprintImpediments(sprintId: number): Observable<Impediment[]> {
    return this.http.get<Impediment[]>(`${environment.scrumApiUrl}/sprints/${sprintId}/impediments`);
  }

  reportImpediment(sprintId: number, impediment: Partial<Impediment>): Observable<Impediment> {
    return this.http.post<Impediment>(`${environment.scrumApiUrl}/sprints/${sprintId}/impediments`, impediment);
  }

  updateImpediment(id: number, impediment: Partial<Impediment>): Observable<Impediment> {
    return this.http.patch<Impediment>(`${this.apiUrl}/${id}`, impediment);
  }

  resolveImpediment(id: number, resolution: string): Observable<Impediment> {
    return this.http.patch<Impediment>(`${this.apiUrl}/${id}/resolve`, { resolution });
  }
}
