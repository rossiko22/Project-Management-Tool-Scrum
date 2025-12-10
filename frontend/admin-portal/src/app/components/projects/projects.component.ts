import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { UserService } from '../../services/user.service';
import { Project, CreateProjectRequest } from '../../models/project.model';
import { User } from '../../models/user.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  users: User[] = [];
  productOwners: User[] = [];
  scrumMasters: User[] = [];
  developers: User[] = [];
  loading = false;
  showCreateForm = false;
  createProjectForm: FormGroup;
  selectedDevelopers: number[] = [];
  error = '';
  success = '';
  searchTerm = '';

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.createProjectForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      organizationId: [1, Validators.required],
      defaultSprintLength: [2],
      timezone: ['UTC'],
      productOwnerId: [null],
      scrumMasterId: [null]
    });
  }

  ngOnInit(): void {
    this.loadProjects();
    this.loadUsers();
  }

  loadProjects(): void {
    this.loading = true;
    this.error = '';
    this.projectService.getAllProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.filteredProjects = projects;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load projects';
        this.loading = false;
        console.error(error);
      }
    });
  }

  loadUsers(): void {
    // Load all users and categorize by role
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.productOwners = users.filter(u => u.roles.includes('PRODUCT_OWNER'));
        this.scrumMasters = users.filter(u => u.roles.includes('SCRUM_MASTER'));
        this.developers = users.filter(u => u.roles.includes('DEVELOPER'));
      },
      error: (error) => {
        console.error('Failed to load users', error);
      }
    });
  }

  searchProjects(): void {
    if (!this.searchTerm.trim()) {
      this.filteredProjects = this.projects;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredProjects = this.projects.filter(project =>
      project.name.toLowerCase().includes(term) ||
      (project.description && project.description.toLowerCase().includes(term))
    );
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.createProjectForm.reset();
      this.createProjectForm.patchValue({
        organizationId: 1,
        defaultSprintLength: 2,
        timezone: 'UTC'
      });
      this.selectedDevelopers = [];
      this.error = '';
      this.success = '';
    }
  }

  toggleDeveloper(developerId: number): void {
    const index = this.selectedDevelopers.indexOf(developerId);
    if (index > -1) {
      this.selectedDevelopers.splice(index, 1);
    } else {
      this.selectedDevelopers.push(developerId);
    }
  }

  isDeveloperSelected(developerId: number): boolean {
    return this.selectedDevelopers.includes(developerId);
  }

  onSubmit(): void {
    if (this.createProjectForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const request: CreateProjectRequest = {
      ...this.createProjectForm.value,
      developerIds: this.selectedDevelopers.length > 0 ? this.selectedDevelopers : undefined
    };

    console.log('Creating project with request:', request);

    this.projectService.createProject(request).subscribe({
      next: (project) => {
        this.success = `Project "${project.name}" created successfully!`;
        this.createProjectForm.reset();
        this.createProjectForm.patchValue({
          organizationId: 1,
          defaultSprintLength: 2,
          timezone: 'UTC'
        });
        this.selectedDevelopers = [];
        this.showCreateForm = false;
        this.loadProjects();
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to create project';
        this.loading = false;
        console.error(error);
      }
    });
  }

  viewProject(project: Project): void {
    // Navigate to project details (to be implemented)
    console.log('View project:', project);
  }

  editProject(project: Project): void {
    // Navigate to edit project (to be implemented)
    console.log('Edit project:', project);
  }

  deleteProject(project: Project): void {
    if (confirm(`Are you sure you want to delete project "${project.name}"? This action cannot be undone.`)) {
      // Delete project (API endpoint needed)
      console.log('Delete project:', project);
      this.success = 'Project deletion functionality to be implemented';
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
