import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { ProjectContextService } from '../../services/project-context.service';
import { SprintService } from '../../services/sprint.service';
import { AuthService } from '../../services/auth.service';
import { Task, Sprint } from '../../models/sprint.model';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  selectedProject: Project | null = null;
  currentSprint: Sprint | null = null;
  loading = true;
  error: string | null = null;
  private projectSubscription?: Subscription;

  // Filters
  filterStatus: string = 'all';
  filterAssignee: string = 'all';
  searchQuery: string = '';
  sortBy: 'title' | 'status' | 'hours' | 'assignee' = 'status';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modal state
  showTaskModal = false;
  selectedTask: Task | null = null;
  isEditing = false;

  // Task form
  taskForm = {
    title: '',
    description: '',
    estimatedHours: 0,
    assigneeId: undefined as number | undefined,
    status: 'TO_DO' as Task['status']
  };

  statusOptions: Task['status'][] = ['TO_DO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

  constructor(
    private taskService: TaskService,
    private projectContext: ProjectContextService,
    private sprintService: SprintService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.projectSubscription = this.projectContext.selectedProject$.subscribe(project => {
      this.selectedProject = project;
      if (project) {
        this.loadCurrentSprint();
      } else {
        this.loading = false;
        this.error = 'No project selected. Please select a project from the dropdown.';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.projectSubscription) {
      this.projectSubscription.unsubscribe();
    }
  }

  loadCurrentSprint(): void {
    if (!this.selectedProject) return;

    this.loading = true;
    this.error = null;
    this.sprintService.getActiveSprint(this.selectedProject.id).subscribe({
      next: (sprint) => {
        this.currentSprint = sprint;
        if (sprint) {
          this.loadSprintTasks();
        } else {
          this.tasks = [];
          this.filteredTasks = [];
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to load sprint';
        this.loading = false;
      }
    });
  }

  loadSprintTasks(): void {
    if (!this.currentSprint) return;

    this.sprintService.getSprintBacklog(this.currentSprint.id).subscribe({
      next: (backlogItems) => {
        // Flatten all tasks from backlog items
        this.tasks = [];
        backlogItems.forEach((item: any) => {
          if (item.tasks && item.tasks.length > 0) {
            this.tasks.push(...item.tasks);
          }
        });
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load tasks';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.tasks];

    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === this.filterStatus);
    }

    // Filter by assignee
    if (this.filterAssignee === 'mine') {
      const currentUserId = this.authService.currentUserValue?.id;
      filtered = filtered.filter(t => t.assigneeId === currentUserId);
    } else if (this.filterAssignee === 'unassigned') {
      filtered = filtered.filter(t => !t.assigneeId);
    }

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = this.getStatusOrder(a.status) - this.getStatusOrder(b.status);
          break;
        case 'hours':
          comparison = (a.estimatedHours || 0) - (b.estimatedHours || 0);
          break;
        case 'assignee':
          const aName = a.assignee?.firstName || 'Unassigned';
          const bName = b.assignee?.firstName || 'Unassigned';
          comparison = aName.localeCompare(bName);
          break;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.filteredTasks = filtered;
  }

  getStatusOrder(status: Task['status']): number {
    const order = { 'TO_DO': 1, 'IN_PROGRESS': 2, 'REVIEW': 3, 'DONE': 4 };
    return order[status] || 0;
  }

  changeSortBy(field: 'title' | 'status' | 'hours' | 'assignee'): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  updateTaskStatus(task: Task, status: Task['status']): void {
    // Only developers can update task status, and only their own tasks
    if (!this.canEditTask(task)) {
      alert('You can only update status of tasks assigned to you');
      return;
    }

    this.taskService.updateTaskStatus(task.id, status).subscribe({
      next: (updated) => {
        const index = this.tasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
          this.tasks[index] = updated;
        }
        this.applyFilters();
      },
      error: (err) => {
        console.error('Failed to update task status', err);
        alert('Failed to update task status. You may not have permission.');
      }
    });
  }

  openTaskModal(task?: Task): void {
    if (task) {
      this.isEditing = true;
      this.selectedTask = task;
      this.taskForm = {
        title: task.title,
        description: task.description || '',
        estimatedHours: task.estimatedHours || 0,
        assigneeId: task.assigneeId,
        status: task.status
      };
    } else {
      this.isEditing = false;
      this.selectedTask = null;
      this.resetTaskForm();
    }
    this.showTaskModal = true;
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
    this.resetTaskForm();
  }

  resetTaskForm(): void {
    this.taskForm = {
      title: '',
      description: '',
      estimatedHours: 0,
      assigneeId: undefined,
      status: 'TO_DO'
    };
  }

  saveTask(): void {
    if (!this.taskForm.title.trim()) {
      return;
    }

    if (this.isEditing && this.selectedTask) {
      this.taskService.updateTask(this.selectedTask.id, this.taskForm).subscribe({
        next: (updated) => {
          const index = this.tasks.findIndex(t => t.id === this.selectedTask!.id);
          if (index !== -1) {
            this.tasks[index] = updated;
          }
          this.applyFilters();
          this.closeTaskModal();
        },
        error: (err) => {
          console.error('Failed to update task', err);
        }
      });
    }
  }

  deleteTask(task: Task): void {
    // Only developers can delete tasks, and only their own tasks
    if (!this.canDeleteTask(task)) {
      alert('You can only delete tasks assigned to you');
      return;
    }

    if (!confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      return;
    }

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== task.id);
        this.applyFilters();
      },
      error: (err) => {
        console.error('Failed to delete task', err);
        alert('Failed to delete task. You may not have permission.');
      }
    });
  }

  canEditTask(task: Task): boolean {
    // Only developers can edit tasks
    if (!this.authService.hasRole('DEVELOPER')) {
      return false;
    }

    // Developers can only edit their own assigned tasks
    const currentUserId = this.authService.currentUserValue?.id;
    return task.assigneeId === currentUserId;
  }

  canDeleteTask(task: Task): boolean {
    // Only developers can delete tasks
    if (!this.authService.hasRole('DEVELOPER')) {
      return false;
    }

    // Developers can only delete their own assigned tasks
    const currentUserId = this.authService.currentUserValue?.id;
    return task.assigneeId === currentUserId;
  }

  canCreateTask(): boolean {
    // Only developers can create tasks
    return this.authService.hasRole('DEVELOPER');
  }

  getStatusClass(status: Task['status']): string {
    const classes: Record<Task['status'], string> = {
      'TO_DO': 'status-todo',
      'IN_PROGRESS': 'status-in-progress',
      'REVIEW': 'status-review',
      'DONE': 'status-done'
    };
    return classes[status] || '';
  }

  getStatusLabel(status: Task['status']): string {
    const labels: Record<Task['status'], string> = {
      'TO_DO': 'To Do',
      'IN_PROGRESS': 'In Progress',
      'REVIEW': 'Review',
      'DONE': 'Done'
    };
    return labels[status] || status;
  }

  getTaskStats() {
    return {
      total: this.tasks.length,
      toDo: this.tasks.filter(t => t.status === 'TO_DO').length,
      inProgress: this.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      review: this.tasks.filter(t => t.status === 'REVIEW').length,
      done: this.tasks.filter(t => t.status === 'DONE').length,
      myTasks: this.tasks.filter(t => t.assigneeId === this.authService.currentUserValue?.id).length
    };
  }
}
