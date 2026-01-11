import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { BacklogService } from '../../services/backlog.service';
import { SprintService } from '../../services/sprint.service';
import { ProjectService } from '../../services/project.service';
import { ProjectContextService } from '../../services/project-context.service';
import { AuthService } from '../../services/auth.service';
import { ApprovalService, BacklogItemApproval } from '../../services/approval.service';
import { BacklogItem, Sprint } from '../../models/sprint.model';
import { Project, Team, TeamMember } from '../../models/project.model';
import { CommentsComponent } from '../comments/comments.component';

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DragDropModule, CommentsComponent],
  templateUrl: './backlog.component.html',
  styleUrls: ['./backlog.component.scss']
})
export class BacklogComponent implements OnInit, OnDestroy {
  selectedProject: Project | null = null;
  backlogItems: BacklogItem[] = [];
  filteredItems: BacklogItem[] = [];
  loading = false;
  error: string | null = null;
  private projectSubscription?: Subscription;

  // Filters
  searchTerm = '';
  filterType: string = 'ALL';
  filterStatus: string = 'ALL';

  // Modal state
  showModal = false;
  isEditMode = false;
  currentItem: Partial<BacklogItem> = {};

  // Item types
  itemTypes = ['STORY', 'EPIC', 'BUG', 'TECHNICAL_TASK'];
  // Only BACKLOG and SPRINT_READY allowed during creation
  createItemStatuses = ['BACKLOG', 'SPRINT_READY'];
  itemStatuses = ['BACKLOG', 'SPRINT_READY'];

  // Sprint selection for SPRINT_READY items
  plannedSprints: Sprint[] = [];
  selectedSprintId: number | null = null;
  showSprintSelection = false;

  // Team members for approval workflow
  teamMembers: any[] = [];

  // Approval tracking
  itemApprovals: Map<number, BacklogItemApproval[]> = new Map();
  rejectionReason = '';
  showRejectionModal = false;
  currentRejectionItem: BacklogItem | null = null;

  constructor(
    private backlogService: BacklogService,
    private sprintService: SprintService,
    private projectService: ProjectService,
    private projectContext: ProjectContextService,
    public authService: AuthService,
    private approvalService: ApprovalService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Track page visit
    const userId = this.authService.currentUserValue?.id;
    if (userId) {
      this.http.post('https://backend-logger-361o.onrender.com/track/', {
        calledService: '/backlog',
        id: userId
      }).subscribe({
        next: () => console.log('✓ Tracking request to backend-logger succeeded'),
        error: () => console.log('✗ Tracking request to backend-logger did not succeed')
      });
    }

    this.projectSubscription = this.projectContext.selectedProject$.subscribe(project => {
      this.selectedProject = project;
      if (project) {
        this.loadBacklog();
      } else {
        this.error = 'No project selected. Please select a project from the dropdown.';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.projectSubscription) {
      this.projectSubscription.unsubscribe();
    }
  }

  loadBacklog(): void {
    if (!this.selectedProject) return;

    this.loading = true;
    this.error = null;

    this.backlogService.getProjectBacklog(this.selectedProject.id).subscribe({
      next: (items) => {
        this.backlogItems = items.sort((a, b) => a.position - b.position);
        this.applyFilters();

        // Load approval status for pending approval items
        const pendingItems = items.filter(item => item.status === 'PENDING_APPROVAL');
        pendingItems.forEach(item => this.loadApprovalStatus(item));

        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load backlog items';
        this.loading = false;
        console.error(err);
      }
    });
  }

  applyFilters(): void {
    this.filteredItems = this.backlogItems.filter(item => {
      const matchesSearch = !this.searchTerm ||
        item.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesType = this.filterType === 'ALL' || item.type === this.filterType;
      const matchesStatus = this.filterStatus === 'ALL' || item.status === this.filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  // Drag and drop reordering (PO only)
  onDrop(event: CdkDragDrop<BacklogItem[]>): void {
    if (!this.canReorder()) return;

    moveItemInArray(this.filteredItems, event.previousIndex, event.currentIndex);

    // Update positions and save
    const itemIds = this.filteredItems.map(item => item.id);
    if (this.selectedProject) {
      this.backlogService.reorderBacklog(this.selectedProject.id, itemIds).subscribe({
        next: () => {
          console.log('Backlog reordered successfully');
        },
        error: (err) => {
          console.error('Failed to reorder backlog', err);
          this.loadBacklog(); // Reload on error
        }
      });
    }
  }

  // Modal operations
  openCreateModal(): void {
    this.isEditMode = false;
    this.currentItem = {
      type: this.getDefaultItemType(),
      status: 'BACKLOG',
      priority: 0,
      position: this.backlogItems.length
    };
    this.selectedSprintId = null;
    this.showSprintSelection = false;

    // Load planned sprints and team members for potential sprint selection
    this.loadPlannedSprints();
    this.loadTeamMembers();

    this.showModal = true;
  }

  openEditModal(item: BacklogItem): void {
    this.isEditMode = true;
    this.currentItem = { ...item };

    // Load planned sprints and team members for potential status change
    this.loadPlannedSprints();
    this.loadTeamMembers();

    // Initialize sprint selection state based on current status
    this.showSprintSelection = this.currentItem.status === 'SPRINT_READY';
    this.selectedSprintId = null; // Reset sprint selection

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentItem = {};
  }

  saveItem(): void {
    if (!this.selectedProject || !this.currentItem.title) return;

    // Validate SPRINT_READY requirements
    if (this.currentItem.status === 'SPRINT_READY') {
      if (!this.selectedSprintId) {
        this.error = 'Please select a sprint when status is SPRINT_READY';
        return;
      }
      // Only validate team members if user is a Developer (needs PO approval)
      if (!this.authService.hasRole('PRODUCT_OWNER') && this.teamMembers.length === 0) {
        this.error = 'No Product Owner found for approval workflow';
        return;
      }
    }

    if (this.isEditMode && this.currentItem.id) {
      // Update existing item with sprint and team member info if SPRINT_READY
      const itemData: any = { ...this.currentItem };

      if (this.currentItem.status === 'SPRINT_READY' && this.selectedSprintId) {
        itemData.sprintId = this.selectedSprintId;
        itemData.assignedDeveloperIds = this.teamMembers.map(m => m.id);
      }

      this.backlogService.updateBacklogItem(this.currentItem.id, itemData).subscribe({
        next: () => {
          this.closeModal();
          this.loadBacklog();
        },
        error: (err) => {
          this.error = 'Failed to update item';
          console.error(err);
        }
      });
    } else {
      // Create new item with sprint and team member info if SPRINT_READY
      const itemData: any = { ...this.currentItem };

      if (this.currentItem.status === 'SPRINT_READY' && this.selectedSprintId) {
        itemData.sprintId = this.selectedSprintId;
        itemData.assignedDeveloperIds = this.teamMembers.map(m => m.id);
      }

      this.backlogService.createBacklogItem(this.selectedProject.id, itemData).subscribe({
        next: () => {
          this.closeModal();
          this.loadBacklog();
        },
        error: (err) => {
          this.error = 'Failed to create item';
          console.error(err);
        }
      });
    }
  }

  deleteItem(item: BacklogItem): void {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    this.backlogService.deleteBacklogItem(item.id).subscribe({
      next: () => {
        this.loadBacklog();
      },
      error: (err) => {
        this.error = 'Failed to delete item';
        console.error(err);
      }
    });
  }

  estimateItem(item: BacklogItem, storyPoints: number): void {
    this.backlogService.estimateBacklogItem(item.id, storyPoints).subscribe({
      next: () => {
        item.storyPoints = storyPoints;
      },
      error: (err) => {
        console.error('Failed to estimate item', err);
      }
    });
  }

  // Permission checks
  canCreate(): boolean {
    // Only Product Owner and Developers can create backlog items
    // Scrum Master cannot create items (Scrum rule: SM doesn't own product content)
    return this.authService.hasRole('PRODUCT_OWNER') ||
           this.authService.hasRole('DEVELOPER');
  }

  canCreateType(type: string): boolean {
    const isPO = this.authService.hasRole('PRODUCT_OWNER');
    const isDev = this.authService.hasRole('DEVELOPER');

    if (type === 'STORY' || type === 'EPIC') {
      return isPO;
    }
    if (type === 'BUG' || type === 'TECHNICAL_TASK') {
      return isDev || isPO;
    }
    return false;
  }

  canEdit(item: BacklogItem): boolean {
    const isPO = this.authService.hasRole('PRODUCT_OWNER');
    const isDev = this.authService.hasRole('DEVELOPER');
    const currentUserId = this.authService.currentUserValue?.id;

    if (isPO) return true;
    if (isDev && item.createdBy === currentUserId) return true;
    return false;
  }

  canDelete(item: BacklogItem): boolean {
    return this.authService.hasRole('PRODUCT_OWNER');
  }

  canReorder(): boolean {
    return this.authService.hasRole('PRODUCT_OWNER');
  }

  getDefaultItemType(): BacklogItem['type'] {
    if (this.authService.hasRole('PRODUCT_OWNER')) {
      return 'STORY';
    }
    return 'BUG';
  }

  getAvailableTypes(): string[] {
    if (this.authService.hasRole('PRODUCT_OWNER')) {
      return this.itemTypes;
    }
    return ['BUG', 'TECHNICAL_TASK'];
  }

  getItemTypeIcon(type: string): string {
    switch(type) {
      case 'STORY': return '📖';
      case 'EPIC': return '🎯';
      case 'BUG': return '🐛';
      case 'TECHNICAL_TASK': return '⚙️';
      default: return '📋';
    }
  }

  getItemTypeColor(type: string): string {
    switch(type) {
      case 'STORY': return 'story';
      case 'EPIC': return 'epic';
      case 'BUG': return 'bug';
      case 'TECHNICAL_TASK': return 'tech';
      default: return '';
    }
  }

  // Sprint and team loading methods
  loadPlannedSprints(): void {
    if (!this.selectedProject) return;

    this.sprintService.getProjectSprints(this.selectedProject.id).subscribe({
      next: (sprints) => {
        // Filter only PLANNED sprints
        this.plannedSprints = sprints.filter(s => s.status === 'PLANNED');
      },
      error: (err) => {
        console.error('Failed to load sprints', err);
        this.plannedSprints = [];
      }
    });
  }

  loadTeamMembers(): void {
    if (!this.selectedProject) return;

    const members: { id: number; role: string }[] = [];
    const project = this.selectedProject as any; // Cast to access team property

    console.log('=== LOAD TEAM MEMBERS DEBUG ===');
    console.log('Project:', project);
    console.log('Team object:', project.team);

    // Get team data from the project object (it's embedded in the project response)
    if (project.team) {
      const team = project.team;

      console.log('Team.productOwner:', team.productOwner);

      // NEW LOGIC: Only add Product Owner for approval workflow
      // - If current user is Product Owner: no approval needed (handled by backend)
      // - If current user is Developer: only Product Owner needs to approve
      if (team.productOwner && team.productOwner.id != null) {
        console.log('Adding Product Owner:', team.productOwner.id);
        members.push({ id: team.productOwner.id, role: 'PRODUCT_OWNER' });
      }

      // Note: We no longer add developers to the approval list
      // Only Product Owner approval is required when Developer creates/edits items
    } else {
      console.log('No team object found');
    }

    this.teamMembers = members;
    console.log('Final team members for approval:', this.teamMembers);
    console.log('=== END LOAD TEAM MEMBERS DEBUG ===');
  }

  onStatusChange(): void {
    // Show sprint selection only when status is SPRINT_READY
    this.showSprintSelection = this.currentItem.status === 'SPRINT_READY';

    // Reset sprint selection if status changed to BACKLOG
    if (!this.showSprintSelection) {
      this.selectedSprintId = null;
    }
  }

  // Approval methods
  isPendingApproval(item: BacklogItem): boolean {
    return item.status === 'PENDING_APPROVAL';
  }

  canApprove(item: BacklogItem): boolean {
    if (!this.isPendingApproval(item)) return false;

    const currentUserId = this.authService.currentUserValue?.id;
    if (!currentUserId) return false;

    // Check if user has a pending approval for this item
    const approvals = this.itemApprovals.get(item.id);
    if (!approvals) return false;

    const userApproval = approvals.find(a => a.developerId === currentUserId);
    return userApproval?.status === 'PENDING';
  }

  getUserApprovalStatus(item: BacklogItem): string {
    const currentUserId = this.authService.currentUserValue?.id;
    if (!currentUserId) return '';

    const approvals = this.itemApprovals.get(item.id);
    if (!approvals) return '';

    const userApproval = approvals.find(a => a.developerId === currentUserId);
    if (!userApproval) return 'Waiting for team';

    if (userApproval.status === 'APPROVED') return '✓ You approved';
    if (userApproval.status === 'REJECTED') return '✗ You rejected';
    return '';
  }

  loadApprovalStatus(item: BacklogItem): void {
    if (!this.isPendingApproval(item)) return;

    // Try to get sprint ID from the item (we need to enhance the BacklogItem model or get it from backend)
    // For now, we'll fetch pending approvals for the current user and match by item ID
    this.approvalService.getMyPendingApprovals().subscribe({
      next: (approvals) => {
        // Group approvals by backlog item ID
        const itemApprovalsList = approvals.filter(a => a.backlogItemId === item.id);
        if (itemApprovalsList.length > 0) {
          // Get full approval list for this item
          const firstApproval = itemApprovalsList[0];
          this.approvalService.getApprovalsForItem(item.id, firstApproval.sprintId).subscribe({
            next: (fullApprovals) => {
              this.itemApprovals.set(item.id, fullApprovals);
            }
          });
        }
      },
      error: (err) => console.error('Failed to load approval status', err)
    });
  }

  approveItem(item: BacklogItem): void {
    const approvals = this.itemApprovals.get(item.id);
    if (!approvals || approvals.length === 0) {
      this.error = 'Unable to find approval information for this item';
      return;
    }

    const sprintId = approvals[0].sprintId;

    this.approvalService.approveItem(item.id, sprintId).subscribe({
      next: () => {
        console.log('Item approved successfully');
        // Reload backlog to get updated status
        this.loadBacklog();
      },
      error: (err) => {
        this.error = 'Failed to approve item';
        console.error(err);
      }
    });
  }

  openRejectModal(item: BacklogItem): void {
    this.currentRejectionItem = item;
    this.rejectionReason = '';
    this.showRejectionModal = true;
  }

  closeRejectionModal(): void {
    this.showRejectionModal = false;
    this.currentRejectionItem = null;
    this.rejectionReason = '';
  }

  submitRejection(): void {
    if (!this.currentRejectionItem || !this.rejectionReason.trim()) {
      this.error = 'Please provide a rejection reason';
      return;
    }

    const item = this.currentRejectionItem;
    const approvals = this.itemApprovals.get(item.id);
    if (!approvals || approvals.length === 0) {
      this.error = 'Unable to find approval information for this item';
      return;
    }

    const sprintId = approvals[0].sprintId;

    this.approvalService.rejectItem(item.id, sprintId, this.rejectionReason).subscribe({
      next: () => {
        console.log('Item rejected successfully');
        this.closeRejectionModal();
        // Reload backlog to get updated status
        this.loadBacklog();
      },
      error: (err) => {
        this.error = 'Failed to reject item';
        console.error(err);
        this.closeRejectionModal();
      }
    });
  }
}
