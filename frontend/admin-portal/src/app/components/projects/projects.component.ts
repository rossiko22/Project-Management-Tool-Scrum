import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';

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
  loading = false;
  showCreateForm = false;
  createProjectForm: FormGroup;
  error = '';
  success = '';
  searchTerm = '';

  constructor(
    private projectService: ProjectService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.createProjectForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      organizationId: [1, Validators.required] // Default to 1 for now
    });
  }

  ngOnInit(): void {
    this.loadProjects();
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
      this.createProjectForm.patchValue({ organizationId: 1 });
      this.error = '';
      this.success = '';
    }
  }

  onSubmit(): void {
    if (this.createProjectForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const projectData = this.createProjectForm.value;

    this.projectService.createProject(projectData).subscribe({
      next: (project) => {
        this.success = `Project "${project.name}" created successfully!`;
        this.createProjectForm.reset();
        this.createProjectForm.patchValue({ organizationId: 1 });
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
