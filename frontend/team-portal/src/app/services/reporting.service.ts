import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BurndownData, VelocityData, CumulativeFlowData, SprintMetrics } from '../models/sprint.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportingService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getBurndownChart(projectId: number, sprintId?: number): Observable<BurndownData[]> {
    const params = sprintId ? { sprintId: sprintId.toString() } : {};
    return this.http.get<BurndownData[]>(`${this.apiUrl}/projects/${projectId}/burndown`, { params });
  }

  getVelocityChart(projectId: number): Observable<VelocityData[]> {
    return this.http.get<VelocityData[]>(`${this.apiUrl}/projects/${projectId}/velocity`);
  }

  getCumulativeFlowDiagram(teamId: number): Observable<CumulativeFlowData[]> {
    return this.http.get<CumulativeFlowData[]>(`${this.apiUrl}/teams/${teamId}/cfd`);
  }

  getSprintMetrics(sprintId: number): Observable<SprintMetrics> {
    return this.http.get<SprintMetrics>(`${this.apiUrl}/sprints/${sprintId}/metrics`);
  }

  getOrgSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/org/summary`);
  }
}
