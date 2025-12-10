import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { SprintService } from '../../services/sprint.service';
import { TaskService } from '../../services/task.service';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { Sprint, Task, BacklogItem } from '../../models/sprint.model';
import { Project } from '../../models/project.model';

interface BoardColumn {
  id: string;
  title: string;
  status: Task['status'];
  tasks: Task[];
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DragDropModule],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {
  projects: Project[] = [];
  selectedProject: Project | null = null;
  currentSprint: Sprint | null = null;
  loading = false;
  error: string | null = null;

  columns: BoardColumn[] = [
    { id: 'todo', title: 'To Do', status: 'TO_DO', tasks: [] },
    { id: 'inProgress', title: 'In Progress', status: 'IN_PROGRESS', tasks: [] },
    { id: 'review', title: 'Review', status: 'REVIEW', tasks: [] },
    { id: 'done', title: 'Done', status: 'DONE', tasks: [] }
  ];

  // Filters
  filterAssignee: string = 'ALL';
  teamMembers: any[] = [];

  constructor(
    private sprintService: SprintService,
    private taskService: TaskService,
    private projectService: ProjectService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        if (projects.length > 0) {
          this.selectedProject = projects[0];
          this.loadActiveSprint();
        }
      },
      error: (err) => {
        this.error = 'Failed to load projects';
        console.error(err);
      }
    });
  }

  loadActiveSprint(): void {
    if (!this.selectedProject) return;

    this.loading = true;
    this.error = null;

    this.sprintService.getActiveSprint(this.selectedProject.id).subscribe({
      next: (sprint) => {
        this.currentSprint = sprint;
        if (sprint) {
          this.loadSprintBoard();
        } else {
          this.loading = false;
          this.error = 'No active sprint found. Start a sprint to use the board.';
        }
      },
      error: (err) => {
        this.error = 'Failed to load active sprint';
        this.loading = false;
        console.error(err);
      }
    });
  }

  loadSprintBoard(): void {
    if (!this.currentSprint) return;

    this.sprintService.getSprintBoard(this.currentSprint.id).subscribe({
      next: (boardData: any) => {
        // Reset columns
        this.columns.forEach(col => col.tasks = []);

        // Distribute tasks to columns
        if (boardData.tasks) {
          boardData.tasks.forEach((task: Task) => {
            const column = this.columns.find(c => c.status === task.status);
            if (column) {
              column.tasks.push(task);
            }
          });
        }

        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load sprint board';
        this.loading = false;
        console.error(err);
      }
    });
  }

  onDrop(event: CdkDragDrop<Task[]>, targetColumn: BoardColumn): void {
    const task = event.item.data;

    if (event.previousContainer === event.container) {
      // Reordering within same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving to different column
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update task status on backend
      this.updateTaskStatus(task, targetColumn.status);
    }
  }

  updateTaskStatus(task: Task, newStatus: Task['status']): void {
    this.taskService.updateTaskStatus(task.id, newStatus).subscribe({
      next: (updatedTask) => {
        task.status = newStatus;
        console.log('Task status updated successfully');
      },
      error: (err) => {
        console.error('Failed to update task status', err);
        // Reload board on error
        this.loadSprintBoard();
      }
    });
  }

  onProjectChange(project: Project): void {
    this.selectedProject = project;
    this.loadActiveSprint();
  }

  getTasksByAssignee(tasks: Task[]): Task[] {
    if (this.filterAssignee === 'ALL') {
      return tasks;
    }
    if (this.filterAssignee === 'ME') {
      const currentUserId = this.authService.currentUserValue?.id;
      return tasks.filter(t => t.assigneeId === currentUserId);
    }
    return tasks.filter(t => t.assigneeId === parseInt(this.filterAssignee));
  }

  getColumnTasks(column: BoardColumn): Task[] {
    return this.getTasksByAssignee(column.tasks);
  }

  getColumnClass(columnId: string): string {
    switch(columnId) {
      case 'todo': return 'column-todo';
      case 'inProgress': return 'column-progress';
      case 'review': return 'column-review';
      case 'done': return 'column-done';
      default: return '';
    }
  }

  getTaskPriorityIcon(task: Task): string {
    // You can extend this based on priority field if available
    return '';
  }

  get connectedDropLists(): string[] {
    return this.columns.map(c => c.id);
  }
}
