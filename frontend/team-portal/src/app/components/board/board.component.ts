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
        console.log('Sprint board data received:', boardData);

        // Reset columns
        this.columns.forEach(col => col.tasks = []);

        // Backend returns columns with backlog items, we need to convert them to tasks
        if (boardData.columns) {
          // Map toDo items
          if (boardData.columns.toDo) {
            boardData.columns.toDo.forEach((item: BacklogItem) => {
              this.columns[0].tasks.push(this.backlogItemToTask(item));
            });
          }

          // Map inProgress items
          if (boardData.columns.inProgress) {
            boardData.columns.inProgress.forEach((item: BacklogItem) => {
              this.columns[1].tasks.push(this.backlogItemToTask(item));
            });
          }

          // Map review items
          if (boardData.columns.review) {
            boardData.columns.review.forEach((item: BacklogItem) => {
              this.columns[2].tasks.push(this.backlogItemToTask(item));
            });
          }

          // Map done items
          if (boardData.columns.done) {
            boardData.columns.done.forEach((item: BacklogItem) => {
              this.columns[3].tasks.push(this.backlogItemToTask(item));
            });
          }
        }

        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load sprint board';
        this.loading = false;
        console.error('Error loading sprint board:', err);
      }
    });
  }

  // Convert BacklogItem to Task format for display
  private backlogItemToTask(item: BacklogItem): Task {
    return {
      id: item.id,
      backlogItemId: item.id,
      title: item.title,
      description: item.description,
      status: this.mapBacklogStatusToTaskStatus(item),
      assigneeId: undefined, // BacklogItems don't have assignees, tasks do
      estimatedHours: item.storyPoints ? item.storyPoints * 8 : undefined
    } as Task;
  }

  // Map backlog item to task status based on current board column
  private mapBacklogStatusToTaskStatus(item: BacklogItem): Task['status'] {
    // Since backlog items don't have board_column info in the DTO,
    // we'll determine this from which column list they came from
    // This is handled in loadSprintBoard by pushing to the right column
    return 'TO_DO'; // Default, will be overridden by column assignment
  }

  onDrop(event: CdkDragDrop<Task[]>, targetColumn: BoardColumn): void {
    const task = event.item.data;

    // Check if user can move items on the board
    if (!this.canMoveTask(task)) {
      console.warn('You do not have permission to move items on the board');
      // Reload to reset UI
      this.loadSprintBoard();
      return;
    }

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

      // Update backlog item board column on backend
      this.updateBoardItemColumn(task, targetColumn.status);
    }
  }

  canMoveTask(task: Task): boolean {
    // Developers, Scrum Masters, and Product Owners can move items
    return this.authService.hasRole('DEVELOPER') ||
           this.authService.hasRole('SCRUM_MASTER') ||
           this.authService.hasRole('PRODUCT_OWNER');
  }

  updateBoardItemColumn(task: Task, newStatus: Task['status']): void {
    if (!this.currentSprint) return;

    console.log(newStatus);
    
    this.sprintService.moveBoardItem(this.currentSprint.id, task.backlogItemId, newStatus).subscribe({
      next: () => {
        task.status = newStatus;
        console.log('Board item moved successfully to', newStatus);
      },
      error: (err) => {
        console.error('Failed to move board item', err);
        // Reload board on error to reset UI
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
