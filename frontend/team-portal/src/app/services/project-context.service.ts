import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Project } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectContextService {
  private selectedProjectSubject = new BehaviorSubject<Project | null>(null);
  public selectedProject$: Observable<Project | null> = this.selectedProjectSubject.asObservable();

  private projectsSubject = new BehaviorSubject<Project[]>([]);
  public projects$: Observable<Project[]> = this.projectsSubject.asObservable();

  constructor() {
    console.log('[ProjectContext] Service initialized');
    const savedProject = localStorage.getItem('selected_project');
    if (savedProject) {
      try {
        const parsed = JSON.parse(savedProject);
        console.log('[ProjectContext] Restored saved project:', parsed);
        this.selectedProjectSubject.next(parsed);
      } catch (e) {
        console.error('[ProjectContext] Failed to parse saved project', e);
      }
    }
  }

  setProjects(projects: Project[]): void {
    console.log('[ProjectContext] Setting projects:', projects);
    this.projectsSubject.next(projects);

    const currentSelected = this.selectedProjectSubject.value;
    console.log('[ProjectContext] Current selected project:', currentSelected);

    if (!currentSelected && projects.length > 0) {
      console.log('[ProjectContext] No project selected, auto-selecting first:', projects[0]);
      this.selectProject(projects[0]);
    } else if (currentSelected) {
      const stillExists = projects.find(p => p.id === currentSelected.id);
      if (!stillExists && projects.length > 0) {
        console.log('[ProjectContext] Current project no longer exists, selecting first:', projects[0]);
        this.selectProject(projects[0]);
      } else if (stillExists) {
        console.log('[ProjectContext] Current project still valid');
      }
    } else if (projects.length === 0) {
      console.log('[ProjectContext] No projects available');
    }
  }

  selectProject(project: Project | null): void {
    console.log('[ProjectContext] Selecting project:', project);
    this.selectedProjectSubject.next(project);
    if (project) {
      localStorage.setItem('selected_project', JSON.stringify(project));
    } else {
      localStorage.removeItem('selected_project');
    }
  }

  get selectedProject(): Project | null {
    return this.selectedProjectSubject.value;
  }

  get projects(): Project[] {
    return this.projectsSubject.value;
  }

  clearContext(): void {
    this.selectedProjectSubject.next(null);
    this.projectsSubject.next([]);
    localStorage.removeItem('selected_project');
  }
}
