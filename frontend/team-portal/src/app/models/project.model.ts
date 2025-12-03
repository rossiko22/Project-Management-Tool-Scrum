export interface Project {
  id: number;
  name: string;
  description: string;
  organizationId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Team {
  id: number;
  name: string;
  projectId: number;
  members: TeamMember[];
}

export interface TeamMember {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}
