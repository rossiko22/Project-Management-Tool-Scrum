import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { SprintService } from '../../services/sprint.service';
import { TaskService } from '../../services/task.service';
import { ImpedimentService } from '../../services/impediment.service';
import { ProjectContextService } from '../../services/project-context.service';
import { AuthService } from '../../services/auth.service';
import { Sprint, Task, Impediment } from '../../models/sprint.model';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentSprint: Sprint | null = null;
  selectedProject: Project | null = null;
  tasks: Task[] = [];
  impediments: Impediment[] = [];
  loading = true;
  error: string | null = null;
  private projectSubscription?: Subscription;

  // Quick Stats
  stats = {
    toDo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
    openImpediments: 0,
    daysRemaining: 0,
    completedPoints: 0,
    totalPoints: 0,
    progressPercentage: 0
  };

  constructor(
    private sprintService: SprintService,
    private taskService: TaskService,
    private impedimentService: ImpedimentService,
    private projectContext: ProjectContextService,
    public authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    console.log('[Dashboard] Component initialized');

    // Track page visit
    const userId = this.authService.currentUserValue?.id;
    if (userId) {
      this.http.post('https://backend-logger-361o.onrender.com/track/', {
        calledService: '/dashboard',
        id: userId
      }).subscribe({
        next: () => console.log('✓ Tracking request to backend-logger succeeded'),
        error: () => console.log('✗ Tracking request to backend-logger did not succeed')
      });
    }

    this.projectSubscription = this.projectContext.selectedProject$.subscribe(project => {
      console.log('[Dashboard] Selected project changed:', project);
      this.selectedProject = project;
      if (project) {
        this.loadDashboardData();
      } else {
        const allProjects = this.projectContext.projects;
        console.log('[Dashboard] No project selected. Available projects:', allProjects);
        this.loading = false;
        if (allProjects.length === 0) {
          this.error = 'No projects found. You may not have been assigned to any projects yet. Please contact your administrator.';
        } else {
          this.error = 'No project selected. Please select a project from the dropdown.';
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.projectSubscription) {
      this.projectSubscription.unsubscribe();
    }
  }

  loadDashboardData(): void {
    if (!this.selectedProject) return;

    this.loading = true;
    this.error = null;
    this.sprintService.getActiveSprint(this.selectedProject.id).subscribe({
      next: (sprint) => {
        this.currentSprint = sprint;
        if (sprint) {
          this.calculateDaysRemaining();
          this.loadSprintTasks();
          this.loadImpediments();
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to load sprint data';
        this.loading = false;
      }
    });
  }

  loadSprintTasks(): void {
    if (!this.currentSprint) return;

    this.sprintService.getSprintBacklog(this.currentSprint.id).subscribe({
      next: (backlogItems) => {
        // Flatten all tasks from backlog items
        const allTasks: Task[] = [];
        backlogItems.forEach((item: any) => {
          if (item.tasks) {
            allTasks.push(...item.tasks);
          }
        });
        this.tasks = allTasks;
        this.calculateTaskStats();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load tasks';
        this.loading = false;
      }
    });
  }

  loadImpediments(): void {
    if (!this.currentSprint) return;

    this.impedimentService.getSprintImpediments(this.currentSprint.id).subscribe({
      next: (impediments) => {
        this.impediments = impediments;
        this.stats.openImpediments = impediments.filter(i => i.status !== 'RESOLVED').length;
      },
      error: (err) => {
        console.error('Failed to load impediments', err);
      }
    });
  }

  calculateTaskStats(): void {
    this.stats.toDo = this.tasks.filter(t => t.status === 'TO_DO').length;
    this.stats.inProgress = this.tasks.filter(t => t.status === 'IN_PROGRESS').length;
    this.stats.review = this.tasks.filter(t => t.status === 'REVIEW').length;
    this.stats.done = this.tasks.filter(t => t.status === 'DONE').length;

    const total = this.tasks.length;
    if (total > 0) {
      this.stats.progressPercentage = Math.round((this.stats.done / total) * 100);
    }
  }

  calculateDaysRemaining(): void {
    if (!this.currentSprint) return;

    const endDate = new Date(this.currentSprint.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    this.stats.daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getMyTasks(): Task[] {
    const currentUserId = this.authService.currentUserValue?.id;
    return this.tasks.filter(t => t.assigneeId === currentUserId);
  }

  getRecentTasks(): Task[] {
    return this.tasks.slice(0, 5);
  }

  getOpenImpediments(): Impediment[] {
    return this.impediments.filter(i => i.status !== 'RESOLVED');
  }
}
