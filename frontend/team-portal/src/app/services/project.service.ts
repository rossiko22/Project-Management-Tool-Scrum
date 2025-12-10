import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Project, Team } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor(private api: ApiService) {}

  getAllProjects(): Observable<Project[]> {
    console.log('Fetching all projects from API...');
    return this.api.get<Project[]>('/projects');
  }

  getProjects(): Observable<Project[]> {
    console.log('Getting projects...');
    return this.getAllProjects();
  }

  getProjectById(id: number): Observable<Project> {
    return this.api.get<Project>(`/projects/${id}`);
  }

  createProject(project: Partial<Project>): Observable<Project> {
    return this.api.post<Project>('/projects', project);
  }

  updateProject(id: number, project: Partial<Project>): Observable<Project> {
    return this.api.put<Project>(`/projects/${id}`, project);
  }

  // Teams
  getTeamsByProject(projectId: number): Observable<Team[]> {
    return this.api.get<Team[]>(`/teams/project/${projectId}`);
  }

  createTeam(team: Partial<Team>): Observable<Team> {
    return this.api.post<Team>('/teams', team);
  }

  addTeamMember(teamId: number, userId: number, role: string): Observable<Team> {
    return this.api.post<Team>(`/teams/${teamId}/members`, { userId, role });
  }

  removeTeamMember(teamId: number, userId: number): Observable<Team> {
    return this.api.delete<Team>(`/teams/${teamId}/members/${userId}`);
  }
}
