import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ImpedimentService } from '../../services/impediment.service';
import { SprintService } from '../../services/sprint.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ProjectContextService } from '../../services/project-context.service';
import { Impediment, Sprint } from '../../models/sprint.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-impediments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './impediments.component.html',
  styleUrls: ['./impediments.component.scss']
})
export class ImpedimentsComponent implements OnInit, OnDestroy {
  impediments: Impediment[] = [];
  filteredImpediments: Impediment[] = [];
  sprints: Sprint[] = [];
  teamMembers: User[] = [];

  selectedSprint: Sprint | null = null;
  selectedImpediment: Impediment | null = null;

  loading = false;
  loadingUsers = false;
  error: string | null = null;

  // Filters
  statusFilter: string = 'ALL';

  // Modals
  showCreateModal = false;
  showResolveModal = false;
  showDetailModal = false;

  // New impediment form
  newImpediment = {
    title: '',
    description: ''
  };

  // Resolution form
  resolutionNotes = '';

  // Assignment
  assigneeId: number | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private impedimentService: ImpedimentService,
    private sprintService: SprintService,
    private userService: UserService,
    public authService: AuthService,
    private toastService: ToastService,
    private projectContext: ProjectContextService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Track page visit
    const userId = this.authService.currentUserValue?.id;
    if (userId) {
      this.http.post('https://backend-logger-361o.onrender.com/track/', {
        calledService: '/impediments',
        id: userId
      }).subscribe({
        next: () => console.log('Tracking request to backend-logger succeeded'),
        error: () => console.log('Tracking request to backend-logger did not succeed')
      });
    }

    this.loadSprints();
    this.loadTeamMembers();

    // Subscribe to project changes
    const sub = this.projectContext.selectedProject$.subscribe(project => {
      if (project) {
        this.loadSprints();
      }
    });
    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get isScrumMaster(): boolean {
    return this.authService.hasRole('SCRUM_MASTER') || this.authService.hasRole('ORGANIZATION_ADMIN');
  }

  get canCreateImpediment(): boolean {
    return this.authService.hasRole('SCRUM_MASTER') ||
           this.authService.hasRole('DEVELOPER') ||
           this.authService.hasRole('ORGANIZATION_ADMIN');
  }

  get currentProjectId(): number {
    return this.projectContext.selectedProject?.id || 1;
  }

  findSprintById(id: number): Sprint | undefined {
    return this.sprints.find(s => s.id === id);
  }

  onSprintChange(sprintId: number): void {
    const sprint = this.findSprintById(sprintId);
    if (sprint) {
      this.selectSprint(sprint);
    }
  }

  loadSprints(): void {
    this.loading = true;
    this.sprintService.getProjectSprints(this.currentProjectId).subscribe({
      next: (sprints) => {
        this.sprints = sprints.sort((a, b) => b.id - a.id);
        // Auto-select active sprint or most recent
        const activeSprint = sprints.find(s => s.status === 'ACTIVE');
        if (activeSprint) {
          this.selectSprint(activeSprint);
        } else if (sprints.length > 0) {
          this.selectSprint(sprints[0]);
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error loading sprints:', err);
        this.error = 'Failed to load sprints';
        this.loading = false;
      }
    });
  }

  loadTeamMembers(): void {
    this.loadingUsers = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.teamMembers = users;
        this.loadingUsers = false;
      },
      error: (err) => {
        console.error('Error loading team members:', err);
        this.loadingUsers = false;
      }
    });
  }

  selectSprint(sprint: Sprint): void {
    this.selectedSprint = sprint;
    this.loadImpediments();
  }

  loadImpediments(): void {
    if (!this.selectedSprint) return;

    this.loading = true;
    this.error = null;

    this.impedimentService.getSprintImpediments(this.selectedSprint.id).subscribe({
      next: (impediments) => {
        this.impediments = impediments;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading impediments:', err);
        this.error = 'Failed to load impediments';
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    if (this.statusFilter === 'ALL') {
      this.filteredImpediments = [...this.impediments];
    } else {
      this.filteredImpediments = this.impediments.filter(i => i.status === this.statusFilter);
    }
    // Sort by status (OPEN first, then IN_PROGRESS, then RESOLVED) and then by date
    this.filteredImpediments.sort((a, b) => {
      const statusOrder = { 'OPEN': 0, 'IN_PROGRESS': 1, 'RESOLVED': 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
    });
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  // Create Modal
  openCreateModal(): void {
    this.newImpediment = { title: '', description: '' };
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.newImpediment = { title: '', description: '' };
  }

  createImpediment(): void {
    if (!this.selectedSprint) {
      this.toastService.error('Please select a sprint first');
      return;
    }

    if (!this.newImpediment.title.trim()) {
      this.toastService.error('Please enter a title');
      return;
    }

    this.loading = true;
    this.impedimentService.createImpediment(
      this.selectedSprint.id,
      this.newImpediment.title.trim(),
      this.newImpediment.description.trim()
    ).subscribe({
      next: (impediment) => {
        this.toastService.success('Impediment reported successfully');
        this.loadImpediments();
        this.closeCreateModal();
      },
      error: (err) => {
        console.error('Error creating impediment:', err);
        this.toastService.error(err.error?.message || 'Failed to create impediment');
        this.loading = false;
      }
    });
  }

  // Detail Modal
  openDetailModal(impediment: Impediment): void {
    this.selectedImpediment = impediment;
    this.assigneeId = impediment.assignedTo || null;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedImpediment = null;
    this.assigneeId = null;
  }

  // Status Updates
  updateStatus(impediment: Impediment, status: string): void {
    this.impedimentService.updateStatus(impediment.id, status).subscribe({
      next: (updated) => {
        this.toastService.success(`Status updated to ${status.replace('_', ' ')}`);
        this.loadImpediments();
        if (this.selectedImpediment?.id === impediment.id) {
          this.selectedImpediment = updated;
        }
      },
      error: (err) => {
        console.error('Error updating status:', err);
        this.toastService.error(err.error?.message || 'Failed to update status');
      }
    });
  }

  // Assignment
  assignImpediment(impediment: Impediment, assigneeId: number): void {
    this.impedimentService.assignImpediment(impediment.id, assigneeId).subscribe({
      next: (updated) => {
        const assignee = this.teamMembers.find(m => m.id === assigneeId);
        this.toastService.success(`Assigned to ${assignee?.firstName || 'team member'}`);
        this.loadImpediments();
        if (this.selectedImpediment?.id === impediment.id) {
          this.selectedImpediment = updated;
          this.assigneeId = assigneeId;
        }
      },
      error: (err) => {
        console.error('Error assigning impediment:', err);
        this.toastService.error(err.error?.message || 'Failed to assign impediment');
      }
    });
  }

  onAssigneeChange(): void {
    if (this.selectedImpediment && this.assigneeId) {
      this.assignImpediment(this.selectedImpediment, this.assigneeId);
    }
  }

  // Resolve Modal
  openResolveModal(impediment: Impediment): void {
    this.selectedImpediment = impediment;
    this.resolutionNotes = '';
    this.showResolveModal = true;
  }

  closeResolveModal(): void {
    this.showResolveModal = false;
    this.resolutionNotes = '';
  }

  resolveImpediment(): void {
    if (!this.selectedImpediment) return;

    if (!this.resolutionNotes.trim()) {
      this.toastService.error('Please enter resolution notes');
      return;
    }

    this.loading = true;
    this.impedimentService.resolveImpediment(
      this.selectedImpediment.id,
      this.resolutionNotes.trim()
    ).subscribe({
      next: (updated) => {
        this.toastService.success('Impediment resolved successfully');
        this.loadImpediments();
        this.closeResolveModal();
        this.closeDetailModal();
      },
      error: (err) => {
        console.error('Error resolving impediment:', err);
        this.toastService.error(err.error?.message || 'Failed to resolve impediment');
        this.loading = false;
      }
    });
  }

  // Delete
  deleteImpediment(impediment: Impediment): void {
    if (!confirm(`Are you sure you want to delete "${impediment.title}"?`)) {
      return;
    }

    this.impedimentService.deleteImpediment(impediment.id).subscribe({
      next: () => {
        this.toastService.success('Impediment deleted');
        this.loadImpediments();
        this.closeDetailModal();
      },
      error: (err) => {
        console.error('Error deleting impediment:', err);
        this.toastService.error(err.error?.message || 'Failed to delete impediment');
      }
    });
  }

  // Helpers
  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'OPEN': 'status-open',
      'IN_PROGRESS': 'status-in-progress',
      'RESOLVED': 'status-resolved'
    };
    return classes[status] || '';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'OPEN': '!',
      'IN_PROGRESS': '...',
      'RESOLVED': '\u2713'
    };
    return icons[status] || '';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateShort(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  getUserName(userId: number | undefined): string {
    if (!userId) return 'Unassigned';
    const user = this.teamMembers.find(m => m.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : `User #${userId}`;
  }

  getOpenCount(): number {
    return this.impediments.filter(i => i.status === 'OPEN').length;
  }

  getInProgressCount(): number {
    return this.impediments.filter(i => i.status === 'IN_PROGRESS').length;
  }

  getResolvedCount(): number {
    return this.impediments.filter(i => i.status === 'RESOLVED').length;
  }
}
