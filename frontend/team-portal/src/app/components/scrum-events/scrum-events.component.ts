import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription, forkJoin } from 'rxjs';
import { SprintService } from '../../services/sprint.service';
import { RetrospectiveService } from '../../services/retrospective.service';
import { UserService } from '../../services/user.service';
import { CollaborationService } from '../../services/collaboration.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ProjectContextService } from '../../services/project-context.service';
import { Sprint, Retrospective, CreateRetrospectiveRequest, BacklogItem } from '../../models/sprint.model';
import { User } from '../../models/user.model';

interface DailyScrumEvent {
  id: string;
  sprintId: number;
  date: string;
  time: string;
  createdBy: number;
  createdByName: string;
  invitees: DailyScrumInvitee[];
  createdAt: string;
}

interface DailyScrumInvitee {
  userId: number;
  userName: string;
  response: 'pending' | 'accepted' | 'declined';
  respondedAt?: string;
}

interface RetroContribution {
  id: string;
  sprintId: number;
  contributorId: number;
  contributorName: string;
  category: 'went_well' | 'improvements' | 'action_items' | 'notes';
  content: string;
  createdAt: string;
}

@Component({
  selector: 'app-scrum-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scrum-events.component.html',
  styleUrls: ['./scrum-events.component.scss']
})
export class ScrumEventsComponent implements OnInit, OnDestroy {
  sprints: Sprint[] = [];
  selectedSprint: Sprint | null = null;
  sprintBacklog: BacklogItem[] = [];
  retrospective: Retrospective | null = null;
  teamMembers: User[] = [];

  loading = false;
  loadingBacklog = false;
  loadingUsers = false;
  error: string | null = null;

  // Active event tab
  activeEvent: 'planning' | 'daily' | 'review' | 'retrospective' = 'planning';

  private manualSelectedSprintId: number | null = null;

  // Daily Scrum Events
  dailyScrumEvents: DailyScrumEvent[] = [];
  showCreateDailyModal = false;
  newDailyEvent = {
    date: '',
    time: '09:00',
    selectedInvitees: [] as number[]
  };

  // Retrospective
  showRetrospectiveModal = false;
  isEditingRetrospective = false;
  newRetrospective: CreateRetrospectiveRequest = {
    sprintId: 0,
    wentWell: [''],
    improvements: [''],
    actionItems: [''],
    overallNotes: '',
    teamMood: 3
  };

  // Retrospective Contributions (for devs and PO)
  retroContributions: RetroContribution[] = [];
  showAddRetroItemModal = false;
  newRetroItem = {
    category: 'went_well' as 'went_well' | 'improvements' | 'action_items' | 'notes',
    content: ''
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private sprintService: SprintService,
    private retrospectiveService: RetrospectiveService,
    private userService: UserService,
    private collaborationService: CollaborationService,
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
        calledService: '/scrum-events',
        id: userId
      }).subscribe({
        next: () => console.log('Tracking request to backend-logger succeeded'),
        error: () => console.log('Tracking request to backend-logger did not succeed')
      });
    }

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

  // Role checks
  get isScrumMaster(): boolean {
    return this.authService.hasRole('SCRUM_MASTER') || this.authService.hasRole('ORGANIZATION_ADMIN');
  }

  get isDeveloper(): boolean {
    return this.authService.hasRole('DEVELOPER');
  }

  get isProductOwner(): boolean {
    return this.authService.hasRole('PRODUCT_OWNER');
  }

  get canCreateDailyScrum(): boolean {
    return this.isDeveloper || this.isProductOwner || this.authService.hasRole('ORGANIZATION_ADMIN');
  }

  get canAddRetroItem(): boolean {
    if (!this.selectedSprint) {
      return false;
    }
    return (this.isDeveloper || this.isProductOwner || this.authService.hasRole('ORGANIZATION_ADMIN')) &&
      (this.isSprintActive || this.isSprintCompleted);
  }

  get canCreateDailyScrumForSprint(): boolean {
    return this.canCreateDailyScrum && this.isSprintActive;
  }

  get canCreateRetrospective(): boolean {
    return this.isScrumMaster && this.isSprintCompleted;
  }

  get currentProjectId(): number {
    return this.projectContext.selectedProject?.id || 1;
  }

  get currentUserName(): string {
    const user = this.authService.currentUserValue;
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
  }

  get currentUserId(): number {
    return this.authService.currentUserValue?.id || 0;
  }

  get todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  get todayDateFormatted(): string {
    return new Date().toISOString();
  }

  findSprintById(id: number): Sprint | undefined {
    return this.sprints.find(s => s.id === id);
  }

  onSprintChange(sprintId: number | string): void {
    const normalizedId = typeof sprintId === 'string' ? parseInt(sprintId, 10) : sprintId;
    if (Number.isNaN(normalizedId)) {
      return;
    }
    this.manualSelectedSprintId = normalizedId;
    const sprint = this.findSprintById(normalizedId);
    if (sprint) {
      this.selectSprint(sprint);
    }
  }

  loadSprints(): void {
    this.loading = true;
    this.sprintService.getProjectSprints(this.currentProjectId).subscribe({
      next: (sprints) => {
        // Include all sprints - PLANNED, ACTIVE, and COMPLETED
        this.sprints = sprints.sort((a, b) => b.id - a.id);

        // Keep current selection if it still exists in the refreshed list.
        if (this.manualSelectedSprintId != null) {
          const manualSelection = this.sprints.find(s => s.id === this.manualSelectedSprintId);
          if (manualSelection) {
            this.selectSprint(manualSelection);
            return;
          }
        }

        const currentSelection = this.selectedSprint
          ? this.sprints.find(s => s.id === this.selectedSprint?.id)
          : null;
        if (currentSelection) {
          this.selectSprint(currentSelection);
          return;
        }

        // Auto-select active sprint first, then planned, then most recent
        const activeSprint = this.sprints.find(s => s.status === 'ACTIVE');
        const plannedSprint = this.sprints.find(s => s.status === 'PLANNED');
        if (activeSprint) {
          this.selectSprint(activeSprint);
        } else if (plannedSprint) {
          this.selectSprint(plannedSprint);
        } else if (this.sprints.length > 0) {
          this.selectSprint(this.sprints[0]);
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
        this.teamMembers = users.filter(u => u.status === 'ACTIVE');
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
    this.loadSprintBacklog();
    if (sprint.status === 'ACTIVE' || sprint.status === 'COMPLETED') {
      this.loadRetrospective();
    } else {
      this.retrospective = null;
    }
    this.loadDailyScrumEvents();
    this.loadRetroContributions();
  }

  loadSprintBacklog(): void {
    if (!this.selectedSprint) return;

    this.loadingBacklog = true;
    this.sprintService.getSprintBacklog(this.selectedSprint.id).subscribe({
      next: (items) => {
        this.sprintBacklog = items;
        this.loadingBacklog = false;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading sprint backlog:', err);
        this.loadingBacklog = false;
        this.loading = false;
      }
    });
  }

  loadRetrospective(): void {
    if (!this.selectedSprint) return;

    this.retrospectiveService.getRetrospectiveBySprint(this.selectedSprint.id).subscribe({
      next: (retro) => {
        this.retrospective = retro;
      },
      error: () => {
        this.retrospective = null;
      }
    });
  }

  loadDailyScrumEvents(): void {
    if (!this.selectedSprint) return;
    // Load from localStorage
    const key = `daily_scrum_events_${this.selectedSprint.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      this.dailyScrumEvents = JSON.parse(stored);
    } else {
      this.dailyScrumEvents = [];
    }
  }

  saveDailyScrumEvents(): void {
    if (!this.selectedSprint) return;
    const key = `daily_scrum_events_${this.selectedSprint.id}`;
    localStorage.setItem(key, JSON.stringify(this.dailyScrumEvents));
  }

  loadRetroContributions(): void {
    if (!this.selectedSprint) return;
    // Load from localStorage
    const key = `retro_contributions_${this.selectedSprint.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      this.retroContributions = JSON.parse(stored);
    } else {
      this.retroContributions = [];
    }
  }

  saveRetroContributions(): void {
    if (!this.selectedSprint) return;
    const key = `retro_contributions_${this.selectedSprint.id}`;
    localStorage.setItem(key, JSON.stringify(this.retroContributions));
  }

  setActiveEvent(event: 'planning' | 'daily' | 'review' | 'retrospective'): void {
    this.activeEvent = event;
  }

  // Sprint Planning helpers
  get plannedPoints(): number {
    return this.sprintBacklog.reduce((sum, item) => sum + (item.storyPoints || 0), 0);
  }

  get completedItems(): BacklogItem[] {
    return this.sprintBacklog.filter(item =>
      item.status === 'DONE' || item.status === 'ACCEPTED'
    );
  }

  get inProgressItems(): BacklogItem[] {
    return this.sprintBacklog.filter(item =>
      item.status === 'IN_PROGRESS' || item.status === 'IN_SPRINT'
    );
  }

  get todoItems(): BacklogItem[] {
    return this.sprintBacklog.filter(item =>
      item.status === 'TO_DO' || item.status === 'SPRINT_READY' || item.status === 'BACKLOG'
    );
  }

  get completedPoints(): number {
    return this.completedItems.reduce((sum, item) => sum + (item.storyPoints || 0), 0);
  }

  get isSprintPlanned(): boolean {
    return this.selectedSprint?.status === 'PLANNED';
  }

  get isSprintActive(): boolean {
    return this.selectedSprint?.status === 'ACTIVE';
  }

  get isSprintCompleted(): boolean {
    return this.selectedSprint?.status === 'COMPLETED';
  }

  // Daily Scrum Event methods
  openCreateDailyModal(): void {
    if (!this.isSprintActive) {
      this.toastService.warning('Daily Scrum can only be scheduled for active sprints.');
      return;
    }
    this.newDailyEvent = {
      date: this.todayDate,
      time: '09:00',
      selectedInvitees: []
    };
    this.showCreateDailyModal = true;
  }

  closeCreateDailyModal(): void {
    this.showCreateDailyModal = false;
  }

  toggleInvitee(userId: number): void {
    const index = this.newDailyEvent.selectedInvitees.indexOf(userId);
    if (index > -1) {
      this.newDailyEvent.selectedInvitees.splice(index, 1);
    } else {
      this.newDailyEvent.selectedInvitees.push(userId);
    }
  }

  isInviteeSelected(userId: number): boolean {
    return this.newDailyEvent.selectedInvitees.includes(userId);
  }

  selectAllInvitees(): void {
    this.newDailyEvent.selectedInvitees = this.teamMembers
      .filter(m => m.id !== this.currentUserId)
      .map(m => m.id);
  }

  clearAllInvitees(): void {
    this.newDailyEvent.selectedInvitees = [];
  }

  createDailyScrumEvent(): void {
    if (!this.selectedSprint) return;
    if (!this.isSprintActive) {
      this.toastService.warning('Daily Scrum can only be scheduled for active sprints.');
      return;
    }
    if (!this.newDailyEvent.date || !this.newDailyEvent.time) {
      this.toastService.error('Please select date and time');
      return;
    }
    if (this.newDailyEvent.selectedInvitees.length === 0) {
      this.toastService.error('Please select at least one team member to invite');
      return;
    }

    const invitees: DailyScrumInvitee[] = this.newDailyEvent.selectedInvitees.map(userId => {
      const user = this.teamMembers.find(m => m.id === userId);
      return {
        userId,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        response: 'pending' as const
      };
    });

    const event: DailyScrumEvent = {
      id: Date.now().toString(),
      sprintId: this.selectedSprint.id,
      date: this.newDailyEvent.date,
      time: this.newDailyEvent.time,
      createdBy: this.currentUserId,
      createdByName: this.currentUserName,
      invitees,
      createdAt: new Date().toISOString()
    };

    this.dailyScrumEvents.unshift(event);
    this.saveDailyScrumEvents();

    // Send notifications to all invitees
    const notificationPromises = invitees.map(invitee =>
      this.collaborationService.createNotification(
        invitee.userId,
        'DAILY_SCRUM_INVITATION',
        {
          title: 'Daily Scrum Invitation',
          message: `${this.currentUserName} invited you to Daily Scrum on ${this.formatDateShort(this.newDailyEvent.date)} at ${this.newDailyEvent.time}`,
          eventId: event.id,
          sprintId: this.selectedSprint?.id,
          sprintName: this.selectedSprint?.name,
          date: this.newDailyEvent.date,
          time: this.newDailyEvent.time,
          createdBy: this.currentUserName
        }
      ).toPromise()
    );

    Promise.all(notificationPromises).then(() => {
      this.toastService.success('Daily Scrum event created and invitations sent!');
    }).catch(err => {
      console.error('Error sending notifications:', err);
      this.toastService.success('Daily Scrum event created (some notifications may have failed)');
    });

    this.closeCreateDailyModal();
  }

  respondToEvent(event: DailyScrumEvent, response: 'accepted' | 'declined'): void {
    const invitee = event.invitees.find(i => i.userId === this.currentUserId);
    if (invitee) {
      invitee.response = response;
      invitee.respondedAt = new Date().toISOString();
      this.saveDailyScrumEvents();
      this.toastService.success(response === 'accepted' ? 'You accepted the invitation' : 'You declined the invitation');
    }
  }

  isUserInvited(event: DailyScrumEvent): boolean {
    return event.invitees.some(i => i.userId === this.currentUserId);
  }

  getUserResponse(event: DailyScrumEvent): string {
    const invitee = event.invitees.find(i => i.userId === this.currentUserId);
    return invitee?.response || 'pending';
  }

  getAcceptedCount(event: DailyScrumEvent): number {
    return event.invitees.filter(i => i.response === 'accepted').length;
  }

  getDeclinedCount(event: DailyScrumEvent): number {
    return event.invitees.filter(i => i.response === 'declined').length;
  }

  getPendingCount(event: DailyScrumEvent): number {
    return event.invitees.filter(i => i.response === 'pending').length;
  }

  // Retrospective methods
  openRetrospectiveModal(): void {
    if (!this.selectedSprint) return;
    if (!this.isSprintCompleted) {
      this.toastService.warning('Retrospectives are only available after a sprint is completed.');
      return;
    }

    this.newRetrospective = {
      sprintId: this.selectedSprint.id,
      wentWell: [''],
      improvements: [''],
      actionItems: [''],
      overallNotes: '',
      teamMood: 3
    };
    this.isEditingRetrospective = false;
    this.showRetrospectiveModal = true;
  }

  editRetrospective(): void {
    if (!this.retrospective) return;
    if (!this.isSprintCompleted) {
      this.toastService.warning('Retrospectives can only be edited after a sprint is completed.');
      return;
    }

    this.newRetrospective = {
      sprintId: this.retrospective.sprintId,
      wentWell: [...this.retrospective.wentWell],
      improvements: [...this.retrospective.improvements],
      actionItems: [...this.retrospective.actionItems],
      overallNotes: this.retrospective.overallNotes || '',
      teamMood: this.retrospective.teamMood || 3
    };
    this.isEditingRetrospective = true;
    this.showRetrospectiveModal = true;
  }

  closeRetrospectiveModal(): void {
    this.showRetrospectiveModal = false;
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

  saveRetrospective(): void {
    const validWentWell = this.newRetrospective.wentWell.filter(item => item.trim());
    const validImprovements = this.newRetrospective.improvements.filter(item => item.trim());
    const validActionItems = this.newRetrospective.actionItems.filter(item => item.trim());

    if (validWentWell.length === 0 || validImprovements.length === 0 || validActionItems.length === 0) {
      this.toastService.error('Please fill in at least one item for each section');
      return;
    }

    const request: CreateRetrospectiveRequest = {
      ...this.newRetrospective,
      wentWell: validWentWell,
      improvements: validImprovements,
      actionItems: validActionItems
    };

    this.loading = true;

    if (this.isEditingRetrospective && this.retrospective) {
      this.retrospectiveService.updateRetrospective(this.retrospective.id, request).subscribe({
        next: (retro) => {
          this.retrospective = retro;
          this.toastService.success('Retrospective updated successfully');
          this.closeRetrospectiveModal();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error updating retrospective:', err);
          this.toastService.error(err.error?.message || 'Failed to update retrospective');
          this.loading = false;
        }
      });
    } else {
      this.retrospectiveService.createRetrospective(request).subscribe({
        next: (retro) => {
          this.retrospective = retro;
          this.toastService.success('Retrospective created successfully');
          this.closeRetrospectiveModal();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error creating retrospective:', err);
          this.toastService.error(err.error?.message || 'Failed to create retrospective');
          this.loading = false;
        }
      });
    }
  }

  // Retro Contribution methods (for devs and PO)
  openAddRetroItemModal(): void {
    this.newRetroItem = {
      category: 'went_well',
      content: ''
    };
    this.showAddRetroItemModal = true;
  }

  closeAddRetroItemModal(): void {
    this.showAddRetroItemModal = false;
  }

  addRetroContribution(): void {
    if (!this.selectedSprint) return;
    if (!this.newRetroItem.content.trim()) {
      this.toastService.error('Please enter your contribution');
      return;
    }

    const contribution: RetroContribution = {
      id: Date.now().toString(),
      sprintId: this.selectedSprint.id,
      contributorId: this.currentUserId,
      contributorName: this.currentUserName,
      category: this.newRetroItem.category,
      content: this.newRetroItem.content.trim(),
      createdAt: new Date().toISOString()
    };

    this.retroContributions.push(contribution);
    this.saveRetroContributions();

    // Send notification to Scrum Master if they exist
    const scrumMasters = this.teamMembers.filter(m =>
      m.roles?.includes('SCRUM_MASTER')
    );

    scrumMasters.forEach(sm => {
      this.collaborationService.createNotification(
        sm.id,
        'RETROSPECTIVE_ITEM_ADDED',
        {
          title: 'New Retrospective Item',
          message: `${this.currentUserName} added a ${this.getCategoryLabel(this.newRetroItem.category)} item to the retrospective`,
          sprintId: this.selectedSprint?.id,
          sprintName: this.selectedSprint?.name,
          category: this.newRetroItem.category,
          contributorName: this.currentUserName
        }
      ).subscribe();
    });

    this.toastService.success('Your feedback has been added to the retrospective!');
    this.closeAddRetroItemModal();
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'went_well': 'What Went Well',
      'improvements': 'Improvements Needed',
      'action_items': 'Action Items',
      'notes': 'Overall Notes'
    };
    return labels[category] || category;
  }

  getContributionsByCategory(category: string): RetroContribution[] {
    return this.retroContributions.filter(c => c.category === category);
  }

  // Helper functions
  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDateShort(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(date: string, time: string): string {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }) + ' at ' + time;
  }

  getSprintProgress(): number {
    if (!this.selectedSprint?.startDate || !this.selectedSprint?.endDate) return 0;
    const start = new Date(this.selectedSprint.startDate).getTime();
    const end = new Date(this.selectedSprint.endDate).getTime();
    const now = Date.now();
    if (now < start) return 0;
    if (now > end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  }

  getMoodEmoji(mood: number): string {
    const emojis = ['', '😞', '😕', '😐', '🙂', '😊'];
    return emojis[mood] || '😐';
  }

  getMoodLabel(mood: number): string {
    const labels = ['', 'Very Low', 'Low', 'Neutral', 'Good', 'Excellent'];
    return labels[mood] || 'Neutral';
  }

  getItemTypeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'STORY': 'type-story',
      'BUG': 'type-bug',
      'EPIC': 'type-epic',
      'TECHNICAL_TASK': 'type-task'
    };
    return classes[type] || '';
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'TODO': 'status-todo',
      'READY': 'status-ready',
      'IN_PROGRESS': 'status-progress',
      'IN_SPRINT': 'status-progress',
      'DONE': 'status-done',
      'ACCEPTED': 'status-done'
    };
    return classes[status] || '';
  }

  getSprintStatusLabel(): string {
    if (this.isSprintPlanned) return 'Not Started';
    if (this.isSprintActive) return 'Active';
    if (this.isSprintCompleted) return 'Completed';
    return this.selectedSprint?.status || '';
  }

  getSprintStatusClass(): string {
    if (this.isSprintPlanned) return 'badge-info';
    if (this.isSprintActive) return 'badge-success';
    if (this.isSprintCompleted) return 'badge-gray';
    return 'badge-gray';
  }
}
