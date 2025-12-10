import { User } from './user.model';

export interface Project {
  id: number;
  name: string;
  description: string;
  organizationId: number;
  status: string;
  defaultSprintLength: number;
  timezone: string;
  team?: Team;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  projectId: number;
  productOwner?: User;
  scrumMaster?: User;
  developers?: User[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  organizationId: number;
  defaultSprintLength?: number;
  timezone?: string;
  productOwnerId?: number;
  scrumMasterId?: number;
  developerIds?: number[];
}

export interface AssignTeamRequest {
  productOwnerId?: number;
  scrumMasterId?: number;
  developerIds?: number[];
}
