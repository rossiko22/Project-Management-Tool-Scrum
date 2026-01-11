import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SprintService } from '../../services/sprint.service';
import { RetrospectiveService } from '../../services/retrospective.service';
import { AuthService } from '../../services/auth.service';
import { ProjectContextService } from '../../services/project-context.service';
import { Sprint, CreateSprintRequest, Retrospective } from '../../models/sprint.model';

@Component({
  selector: 'app-sprints',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './sprints.component.html',
  styleUrls: ['./sprints.component.scss']
})
export class SprintsComponent implements OnInit {
  sprints: Sprint[] = [];
  selectedSprint: Sprint | null = null;
  retrospective: Retrospective | null = null;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  showCreateModal = false;
  showRetrospectiveModal = false;
  viewingRetrospective = false;
  isEditingRetrospective = false;

  newSprint: CreateSprintRequest = {
    projectId: 0,
    teamId: 1,
    name: '',
    goal: '',
    startDate: '',
    endDate: '',
    lengthWeeks: 2,
    teamCapacity: 80
  };

  newRetrospective = {
    sprintId: 0,
    wentWell: [''],
    improvements: [''],
    actionItems: [''],
    overallNotes: '',
    teamMood: 3
  };

  constructor(
    private sprintService: SprintService,
    private retrospectiveService: RetrospectiveService,
    public authService: AuthService,
    private projectContext: ProjectContextService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Track page visit
    const userId = this.authService.currentUserValue?.id;
    if (userId) {
      this.http.post('https://backend-logger-361o.onrender.com/track/', {
        calledService: '/sprints',
        id: userId
      }).subscribe({
        next: () => console.log('✓ Tracking request to backend-logger succeeded'),
        error: () => console.log('✗ Tracking request to backend-logger did not succeed')
      });
    }

    this.loadSprints();
  }

  get isScrumMaster(): boolean {
    return this.authService.hasRole('SCRUM_MASTER') || this.authService.hasRole('ORGANIZATION_ADMIN');
  }

  get currentProjectId(): number {
    return this.projectContext.selectedProject?.id || 1;
  }

  loadSprints(): void {
    this.loading = true;
    this.error = null;

    this.sprintService.getProjectSprints(this.currentProjectId).subscribe({
      next: (sprints) => {
        this.sprints = sprints.sort((a, b) => b.id - a.id);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading sprints:', err);
        this.error = 'Failed to load sprints';
        this.loading = false;
      }
    });
  }

  openCreateSprintModal(): void {
    this.newSprint = {
      projectId: this.currentProjectId,
      teamId: 1,
      name: '',
      goal: '',
      startDate: '',
      endDate: '',
      lengthWeeks: 2,
      teamCapacity: 80
    };
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createSprint(): void {
    if (!this.newSprint.name || !this.newSprint.goal || !this.newSprint.startDate || !this.newSprint.endDate) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.loading = true;
    this.error = null;

    this.sprintService.createSprint(this.newSprint).subscribe({
      next: (sprint) => {
        this.successMessage = `Sprint "${sprint.name}" created successfully`;
        this.loadSprints();
        this.closeCreateModal();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        console.error('Error creating sprint:', err);
        this.error = err.error?.message || 'Failed to create sprint';
        this.loading = false;
      }
    });
  }

  startSprint(sprint: Sprint): void {
    if (!confirm(`Are you sure you want to start "${sprint.name}"? Once started, you cannot add or remove items.`)) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.sprintService.startSprint(sprint.id).subscribe({
      next: (updatedSprint) => {
        this.successMessage = `Sprint "${updatedSprint.name}" started successfully`;
        this.loadSprints();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        console.error('Error starting sprint:', err);
        this.error = err.error?.message || 'Failed to start sprint';
        this.loading = false;
      }
    });
  }

  endSprint(sprint: Sprint): void {
    if (!confirm(`Are you sure you want to end "${sprint.name}"? This will calculate velocity and complete the sprint.`)) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.sprintService.endSprint(sprint.id).subscribe({
      next: (updatedSprint) => {
        this.successMessage = `Sprint "${updatedSprint.name}" completed. Velocity: ${updatedSprint.velocity || 0} points`;
        this.loadSprints();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        console.error('Error ending sprint:', err);
        this.error = err.error?.message || 'Failed to end sprint';
        this.loading = false;
      }
    });
  }

  cancelSprint(sprint: Sprint): void {
    if (!confirm(`Are you sure you want to cancel "${sprint.name}"? All items will return to backlog.`)) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.sprintService.cancelSprint(sprint.id).subscribe({
      next: (updatedSprint) => {
        this.successMessage = `Sprint "${updatedSprint.name}" cancelled successfully`;
        this.loadSprints();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        console.error('Error cancelling sprint:', err);
        this.error = err.error?.message || 'Failed to cancel sprint';
        this.loading = false;
      }
    });
  }

  openRetrospectiveModal(sprint: Sprint): void {
    this.selectedSprint = sprint;
    this.newRetrospective = {
      sprintId: sprint.id,
      wentWell: [''],
      improvements: [''],
      actionItems: [''],
      overallNotes: '',
      teamMood: 3
    };
    this.showRetrospectiveModal = true;
    this.viewingRetrospective = false;
  }

  viewRetrospective(sprint: Sprint): void {
    this.selectedSprint = sprint;
    this.loading = true;

    this.retrospectiveService.getRetrospectiveBySprint(sprint.id).subscribe({
      next: (retro) => {
        this.retrospective = retro;
        this.viewingRetrospective = true;
        this.showRetrospectiveModal = true;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading retrospective:', err);
        this.error = 'Retrospective not found for this sprint';
        this.loading = false;
      }
    });
  }

  closeRetrospectiveModal(): void {
    this.showRetrospectiveModal = false;
    this.viewingRetrospective = false;
    this.isEditingRetrospective = false;
    this.retrospective = null;
  }

  editRetrospective(): void {
    if (!this.retrospective) return;

    this.newRetrospective = {
      sprintId: this.retrospective.sprintId,
      wentWell: [...this.retrospective.wentWell],
      improvements: [...this.retrospective.improvements],
      actionItems: [...this.retrospective.actionItems],
      overallNotes: this.retrospective.overallNotes || '',
      teamMood: this.retrospective.teamMood || 3
    };
    this.viewingRetrospective = false;
    this.isEditingRetrospective = true;
  }

  addItem(array: string[]): void {
    array.push('');
  }

  removeItem(array: string[], index: number): void {
    if (array.length > 1) {
      array.splice(index, 1);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  createRetrospective(): void {
    const validWentWell = this.newRetrospective.wentWell.filter(item => item.trim());
    const validImprovements = this.newRetrospective.improvements.filter(item => item.trim());
    const validActionItems = this.newRetrospective.actionItems.filter(item => item.trim());

    if (validWentWell.length === 0 || validImprovements.length === 0 || validActionItems.length === 0) {
      this.error = 'Please fill in at least one item for each section';
      return;
    }

    const request = {
      ...this.newRetrospective,
      wentWell: validWentWell,
      improvements: validImprovements,
      actionItems: validActionItems
    };

    this.loading = true;
    this.error = null;

    if (this.isEditingRetrospective && this.retrospective) {
      // Update existing retrospective
      this.retrospectiveService.updateRetrospective(this.retrospective.id, request).subscribe({
        next: (retro) => {
          this.successMessage = 'Retrospective updated successfully';
          this.closeRetrospectiveModal();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (err) => {
          console.error('Error updating retrospective:', err);
          this.error = err.error?.message || 'Failed to update retrospective';
          this.loading = false;
        }
      });
    } else {
      // Create new retrospective
      this.retrospectiveService.createRetrospective(request).subscribe({
        next: (retro) => {
          this.successMessage = 'Retrospective created successfully';
          this.closeRetrospectiveModal();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (err) => {
          console.error('Error creating retrospective:', err);
          this.error = err.error?.message || 'Failed to create retrospective';
          this.loading = false;
        }
      });
    }
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'PLANNED': 'status-planned',
      'ACTIVE': 'status-active',
      'COMPLETED': 'status-completed',
      'CANCELLED': 'status-cancelled'
    };
    return classes[status] || '';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }
}

