export interface Sprint {
  id: number;
  projectId: number;
  name: string;
  goal: string;
  startDate: Date;
  endDate: Date;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  teamCapacity?: number;
  lengthWeeks?: number;
}

export interface BacklogItem {
  id: number;
  projectId: number;
  title: string;
  description: string;
  type: 'STORY' | 'EPIC' | 'BUG' | 'TECHNICAL_TASK';
  status: 'BACKLOG' | 'SPRINT_READY' | 'IN_SPRINT' | 'COMPLETED' | 'ARCHIVED';
  storyPoints?: number;
  priority: number;
  position: number;
  acceptanceCriteria?: string;
  createdBy?: number;
}

export interface Task {
  id: number;
  backlogItemId: number;
  title: string;
  description: string;
  status: 'TO_DO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  assigneeId?: number;
  estimatedHours?: number;
  actualHours?: number;
}
