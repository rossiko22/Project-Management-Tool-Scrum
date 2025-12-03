export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  roles: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Role {
  id: number;
  name: 'ORGANIZATION_ADMIN' | 'PRODUCT_OWNER' | 'SCRUM_MASTER' | 'DEVELOPER';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: string[];
}
