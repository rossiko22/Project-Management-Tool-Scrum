import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, CreateUserRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private api: ApiService) {}

  getAllUsers(): Observable<User[]> {
    return this.api.get<User[]>('/users');
  }

  getUserById(id: number): Observable<User> {
    return this.api.get<User>(`/users/${id}`);
  }

  createUser(request: CreateUserRequest): Observable<User> {
    return this.api.post<User>('/users', request);
  }

  updateUserStatus(id: number, status: string): Observable<User> {
    return this.api.put<User>(`/users/${id}/status`, { status });
  }

  deleteUser(id: number): Observable<void> {
    return this.api.delete<void>(`/users/${id}`);
  }

  getUsersByRole(roleName: string): Observable<User[]> {
    return this.api.get<User[]>(`/users/by-role/${roleName}`);
  }
}
