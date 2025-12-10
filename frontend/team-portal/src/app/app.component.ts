import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, filter } from 'rxjs';
import { AuthService } from './services/auth.service';
import { ProjectService } from './services/project.service';
import { ProjectContextService } from './services/project-context.service';
import { Project } from './models/project.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Team Portal';
  projects: Project[] = [];
  selectedProject: Project | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    public authService: AuthService,
    private router: Router,
    private projectService: ProjectService,
    public projectContext: ProjectContextService
  ) {}

  ngOnInit(): void {
    // Load projects if already authenticated
    if (this.isAuthenticated) {
      this.loadProjects();
    }

    // Subscribe to authentication changes
    const authSub = this.authService.currentUser.subscribe(user => {
      if (user && this.projects.length === 0) {
        this.loadProjects();
      } else if (!user) {
        this.projectContext.clearContext();
      }
    });
    this.subscriptions.push(authSub);

    // Subscribe to project context changes
    const projectSub = this.projectContext.selectedProject$.subscribe(project => {
      this.selectedProject = project;
    });
    this.subscriptions.push(projectSub);

    const projectsSub = this.projectContext.projects$.subscribe(projects => {
      this.projects = projects;
    });
    this.subscriptions.push(projectsSub);

    // Reload projects on navigation if authenticated but no projects loaded
    const navSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isAuthenticated && this.projects.length === 0) {
          this.loadProjects();
        }
      });
    this.subscriptions.push(navSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadProjects(): void {
    console.log('Loading projects...');
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        console.log('Projects loaded:', projects);
        this.projectContext.setProjects(projects);
      },
      error: (err) => {
        console.error('Failed to load projects:', err);
        // If 401/403, token might be expired
        if (err.status === 401 || err.status === 403) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  onProjectChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const projectId = parseInt(select.value, 10);
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      this.projectContext.selectProject(project);
    }
  }

  logout(): void {
    this.authService.logout();
    this.projectContext.clearContext();
    this.router.navigate(['/login']);
  }

  get currentUser() {
    return this.authService.currentUserValue;
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  isProductOwner(): boolean {
    return this.authService.hasRole('PRODUCT_OWNER');
  }

  isScrumMaster(): boolean {
    return this.authService.hasRole('SCRUM_MASTER');
  }

  isDeveloper(): boolean {
    return this.authService.hasRole('DEVELOPER');
  }
}
