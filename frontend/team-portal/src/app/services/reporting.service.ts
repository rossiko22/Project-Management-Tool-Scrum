import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BurndownData, VelocityData, CumulativeFlowData, SprintMetrics, ProjectBurndownData } from '../models/sprint.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportingService {
  private apiUrl = `${environment.reportingApiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getBurndownChart(sprintId: number): Observable<BurndownData[]> {
    const url = `${environment.reportingApiUrl}/burndown/sprint/${sprintId}`;
    console.log('Fetching burndown data from:', url);
    return this.http.get<BurndownData[]>(url);
  }

  getProjectBurndown(projectId: number): Observable<ProjectBurndownData[]> {
    const url = `${environment.reportingApiUrl}/burndown/project/${projectId}`;
    console.log('Fetching project burndown data from:', url);
    return this.http.get<ProjectBurndownData[]>(url);
  }

  getVelocityChart(teamId: number): Observable<VelocityData[]> {
    const url = `${environment.reportingApiUrl}/velocity/team/${teamId}`;
    console.log('Fetching velocity data from:', url);
    return this.http.get<VelocityData[]>(url);
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
