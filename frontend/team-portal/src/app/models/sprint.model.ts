export interface Sprint {
  id: number;
  projectId: number;
  teamId?: number;
  name: string;
  goal: string;
  startDate: Date;
  endDate: Date;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  teamCapacity?: number;
  lengthWeeks?: number;
  committedPoints?: number;
  completedPoints?: number;
  velocity?: number;
  storiesCompleted?: number;
  startedAt?: Date;
  endedAt?: Date;
  createdAt?: Date;
}

export interface CreateSprintRequest {
  projectId: number;
  teamId: number;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  lengthWeeks: number;
  teamCapacity?: number;
}

export interface Retrospective {
  id: number;
  sprintId: number;
  facilitatedBy: number;
  facilitatorName?: string;
  wentWell: string[];
  improvements: string[];
  actionItems: string[];
  overallNotes?: string;
  teamMood?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateRetrospectiveRequest {
  sprintId: number;
  wentWell: string[];
  improvements: string[];
  actionItems: string[];
  overallNotes?: string;
  teamMood?: number;
}

export interface BacklogItem {
  id: number;
  projectId: number;
  title: string;
  description: string;
  type: 'STORY' | 'EPIC' | 'BUG' | 'TECHNICAL_TASK';
  status: 'BACKLOG' | 'SPRINT_READY' | 'IN_SPRINT' | 'DONE' | 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED' | 'PENDING_APPROVAL' | 'TO_DO' | 'IN_PROGRESS' | 'REVIEW';
  storyPoints?: number;
  priority: number;
  position: number;
  acceptanceCriteria?: string;
  createdBy?: number;
  createdByRole?: string;
  reviewedBy?: number;
  reviewedAt?: Date;
  rejectionReason?: string;
}

export interface Task {
  id: number;
  backlogItemId: number;
  title: string;
  description?: string;
  status: 'TO_DO' | 'IN_PROGRESS' | 'DONE' | 'REVIEW';
  assigneeId?: number;
  assignee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  estimatedHours?: number;
  actualHours?: number;
  createdAt?: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

export interface Impediment {
  id: number;
  sprintId: number;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  reportedBy: number;
  assignedTo?: number;
  resolvedBy?: number;
  reportedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export interface ScrumEvent {
  id: number;
  sprintId: number;
  type: 'PLANNING' | 'DAILY' | 'REVIEW' | 'RETROSPECTIVE';
  notes?: string;
  outcomes?: any;
  actionItems?: any[];
  facilitatorId: number;
  attendees?: number[];
  scheduledAt?: Date;
  completedAt?: Date;
}

export interface Comment {
  id: number;
  authorId: number;
  authorName?: string;
  entityType: 'BACKLOG_ITEM' | 'TASK' | 'SPRINT' | 'IMPEDIMENT';
  entityId: number;
  content: string;
  parentCommentId?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Notification {
  id: number;
  recipientId: number;
  type: 'TASK_ASSIGNED' | 'COMMENT_ADDED' | 'SPRINT_STARTED' | 'SPRINT_ENDED' | 'IMPEDIMENT_REPORTED' | 'STATUS_CHANGED';
  payload: any;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface SprintBacklogItem {
  sprintId: number;
  backlogItemId: number;
  committedPoints?: number;
  actualPoints?: number;
  addedAt: Date;
  completedAt?: Date;
}

export interface DefinitionOfDone {
  id: number;
  projectId: number;
  criteria: DoD[];
  version: number;
  effectiveFrom: Date;
}

export interface DoD {
  id: number;
  text: string;
  checked?: boolean;
}

export interface SprintMetrics {
  sprintId: number;
  committedPoints: number;
  completedPoints: number;
  carriedOverPoints: number;
  velocity: number;
  storiesCompleted: number;
  storiesCarriedOver: number;
  bugsFixed: number;
  impedimentsCount: number;
}

export interface BurndownData {
  date: string;
  remainingPoints: number;
  idealRemainingPoints: number;
  completedPoints: number;
  addedPoints?: number;
}

export interface VelocityData {
  sprintName: string;
  velocity: number;
  sprintEndDate: string;
}

export interface CumulativeFlowData {
  date: string;
  toDoCount: number;
  inProgressCount: number;
  reviewCount: number;
  doneCount: number;
}
