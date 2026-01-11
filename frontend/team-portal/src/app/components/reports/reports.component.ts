import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ReportingService } from '../../services/reporting.service';
import { ProjectContextService } from '../../services/project-context.service';
import { SprintService } from '../../services/sprint.service';
import { AuthService } from '../../services/auth.service';
import { Sprint, BurndownData, VelocityData, ProjectBurndownData } from '../../models/sprint.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  sprints: Sprint[] = [];
  selectedSprintId: number | null = null;
  burndownData: BurndownData[] = [];
  velocityData: VelocityData[] = [];
  projectBurndownData: ProjectBurndownData[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private reportingService: ReportingService,
    private projectContext: ProjectContextService,
    private sprintService: SprintService,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Track page visit
    const userId = this.authService.currentUserValue?.id;
    if (userId) {
      this.http.post('https://backend-logger-361o.onrender.com/track/', {
        calledService: '/reports',
        id: userId
      }).subscribe({
        next: () => console.log('✓ Tracking request to backend-logger succeeded'),
        error: () => console.log('✗ Tracking request to backend-logger did not succeed')
      });
    }

    this.loadSprints();
    this.loadProjectBurndown();
  }

  get currentProjectId(): number {
    return this.projectContext.selectedProject?.id || 1;
  }

  loadSprints(): void {
    this.loading = true;
    this.sprintService.getProjectSprints(this.currentProjectId).subscribe({
      next: (sprints) => {
        this.sprints = sprints.filter(s => s.status === 'ACTIVE' || s.status === 'COMPLETED');
        this.loading = false;
        // Load velocity data after sprints are loaded
        this.loadVelocityData();
      },
      error: (err) => {
        console.error('Error loading sprints:', err);
        this.error = 'Failed to load sprints';
        this.loading = false;
      }
    });
  }

  loadBurndownData(): void {
    if (!this.selectedSprintId) return;

    console.log('Loading burndown data for sprint:', this.selectedSprintId);
    this.loading = true;
    this.error = null;

    this.reportingService.getBurndownChart(this.selectedSprintId).subscribe({
      next: (data) => {
        console.log('Burndown data received:', data);
        this.burndownData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading burndown data:', err);
        this.error = 'Failed to load burndown chart: ' + (err.message || err.error?.message || 'Unknown error');
        this.loading = false;
      }
    });
  }

  loadVelocityData(): void {
    console.log('Loading velocity data...');
    console.log('Sprints:', this.sprints);

    // Get teamId from the first sprint that has one
    const teamId = this.sprints.find(s => s.teamId)?.teamId;
    console.log('Found teamId:', teamId);

    if (!teamId) {
      console.warn('No team ID found in sprints, using default teamId = 1');
      // Use default teamId = 1 for testing
      const defaultTeamId = 1;
      this.loading = true;
      this.error = null;

      this.reportingService.getVelocityChart(defaultTeamId).subscribe({
        next: (data) => {
          console.log('Velocity data received:', data);
          this.velocityData = data.slice(0, 10); // Last 10 sprints
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading velocity data:', err);
          this.error = 'Failed to load velocity data: ' + (err.message || err.error?.message || 'Unknown error');
          this.loading = false;
        }
      });
      return;
    }

    this.loading = true;
    this.error = null;

    this.reportingService.getVelocityChart(teamId).subscribe({
      next: (data) => {
        console.log('Velocity data received:', data);
        this.velocityData = data.slice(0, 10); // Last 10 sprints
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading velocity data:', err);
        this.error = 'Failed to load velocity data: ' + (err.message || err.error?.message || 'Unknown error');
        this.loading = false;
      }
    });
  }

  loadProjectBurndown(): void {
    console.log('Loading project burndown data for project:', this.currentProjectId);
    this.loading = true;
    this.error = null;

    this.reportingService.getProjectBurndown(this.currentProjectId).subscribe({
      next: (data) => {
        console.log('Project burndown data received:', data);
        this.projectBurndownData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading project burndown data:', err);
        this.error = 'Failed to load project burndown: ' + (err.message || err.error?.message || 'Unknown error');
        this.loading = false;
      }
    });
  }

  onSprintChange(): void {
    this.loadBurndownData();
  }

  getMaxPoints(): number {
    if (this.burndownData.length === 0) return 0;
    return Math.max(...this.burndownData.map(d => d.idealRemainingPoints || 0));
  }

  getChartHeight(points: number): number {
    const maxPoints = this.getMaxPoints();
    return maxPoints > 0 ? (points / maxPoints) * 100 : 0;
  }

  getMaxBacklogItems(): number {
    if (this.projectBurndownData.length === 0) return 10;
    // Calculate the maximum total backlog (remaining + completed)
    const maxValues = this.projectBurndownData.map(d =>
      d.backlogItemsRemaining + d.itemsCompletedInSprint
    );
    const actualMax = Math.max(...maxValues);

    // Use at least 10, or round up to next 10
    return Math.max(10, Math.ceil(actualMax / 10) * 10);
  }

  getBurndownChartHeight(items: number): number {
    const maxItems = this.getMaxBacklogItems();
    // Return percentage: 0 items = 0%, max items = 100%
    return maxItems > 0 ? (items / maxItems) * 100 : 0;
  }

  // Get y-axis labels as an array (10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0)
  getYAxisLabels(): number[] {
    const max = this.getMaxBacklogItems();
    const labels: number[] = [];
    for (let i = max; i >= 0; i--) {
      labels.push(i);
    }
    return labels;
  }

  getMaxVelocity(): number {
    if (this.velocityData.length === 0) return 0;
    return Math.max(...this.velocityData.map(d => d.velocity));
  }

  getVelocityChartHeight(velocity: number): number {
    const maxVelocity = this.getMaxVelocity();
    return maxVelocity > 0 ? (velocity / maxVelocity) * 100 : 0;
  }

  // Helper methods for template calculations
  getTotalCompletedItems(): number {
    return this.projectBurndownData.reduce((sum, d) => sum + d.itemsCompletedInSprint, 0);
  }

  getAverageVelocity(): number {
    if (this.velocityData.length === 0) return 0;
    const total = this.velocityData.reduce((sum, d) => sum + d.velocity, 0);
    return total / this.velocityData.length;
  }

  getStartingBacklog(): number {
    if (this.projectBurndownData.length === 0) return 0;
    const firstSprint = this.projectBurndownData[0];
    return firstSprint.backlogItemsRemaining + firstSprint.itemsCompletedInSprint;
  }

  getCurrentBacklog(): number {
    if (this.projectBurndownData.length === 0) return 0;
    return this.projectBurndownData[this.projectBurndownData.length - 1].backlogItemsRemaining;
  }

  getBurndownLinePoints(): string {
    return this.projectBurndownData
      .map((d, i) => `${i * 100 + 50},${100 - this.getBurndownChartHeight(d.backlogItemsRemaining)}`)
      .join(' ');
  }
}
