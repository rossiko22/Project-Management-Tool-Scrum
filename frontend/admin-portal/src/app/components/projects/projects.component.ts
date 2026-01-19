import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Project, CreateProjectRequest, AssignTeamRequest } from '../../models/project.model';
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
  showViewModal = false;
  showEditModal = false;
  createProjectForm: FormGroup;
  editProjectForm: FormGroup;
  selectedDevelopers: number[] = [];
  editDevelopers: number[] = [];
  selectedProject: Project | null = null;
  error = '';
  success = '';
  searchTerm = '';

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
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

    this.editProjectForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      defaultSprintLength: [2],
      timezone: ['UTC'],
      status: ['ACTIVE', Validators.required],
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
    if (this.showCreateForm) {
      this.showEditModal = false;
      this.showViewModal = false;
    }
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
    this.selectedProject = project;
    this.showViewModal = true;
    this.showEditModal = false;
  }

  editProject(project: Project): void {
    this.selectedProject = project;
    this.showEditModal = true;
    this.showViewModal = false;
    this.showCreateForm = false;
    this.error = '';
    this.success = '';

    this.editDevelopers = project.team?.developers?.map(dev => dev.id) ?? [];
    this.editProjectForm.reset();
    this.editProjectForm.patchValue({
      name: project.name,
      description: project.description,
      defaultSprintLength: project.defaultSprintLength ?? 2,
      timezone: project.timezone ?? 'UTC',
      status: project.status ?? 'ACTIVE',
      productOwnerId: project.team?.productOwner?.id ?? null,
      scrumMasterId: project.team?.scrumMaster?.id ?? null
    });
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedProject = null;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedProject = null;
    this.editDevelopers = [];
    this.editProjectForm.reset();
  }

  toggleEditDeveloper(developerId: number): void {
    const index = this.editDevelopers.indexOf(developerId);
    if (index > -1) {
      this.editDevelopers.splice(index, 1);
    } else {
      this.editDevelopers.push(developerId);
    }
  }

  isEditDeveloperSelected(developerId: number): boolean {
    return this.editDevelopers.includes(developerId);
  }

  updateProject(): void {
    if (!this.selectedProject || this.editProjectForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const formValue = this.editProjectForm.value;
    const projectUpdates = {
      name: formValue.name,
      description: formValue.description,
      defaultSprintLength: formValue.defaultSprintLength,
      timezone: formValue.timezone,
      status: formValue.status
    };

    const existingDevCount = this.selectedProject.team?.developers?.length ?? 0;
    const assignRequest: AssignTeamRequest = {};
    if (formValue.productOwnerId) {
      assignRequest.productOwnerId = formValue.productOwnerId;
    }
    if (formValue.scrumMasterId) {
      assignRequest.scrumMasterId = formValue.scrumMasterId;
    }
    if (this.editDevelopers.length > 0 || existingDevCount > 0) {
      assignRequest.developerIds = this.editDevelopers;
    }

    const requests = [this.projectService.updateProject(this.selectedProject.id, projectUpdates)];
    if (Object.keys(assignRequest).length > 0) {
      requests.push(this.projectService.assignTeam(this.selectedProject.id, assignRequest));
    }

    forkJoin(requests).subscribe({
      next: () => {
        this.success = `Project "${projectUpdates.name}" updated successfully!`;
        this.showEditModal = false;
        this.selectedProject = null;
        this.editDevelopers = [];
        this.loadProjects();
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to update project';
        this.loading = false;
        console.error(error);
      }
    });
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
