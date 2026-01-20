import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, User } from '../models/user.model';
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private tokenKey = 'auth_token';

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('current_user');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    
    console.log("Sending login request to:", `${environment.apiUrl}/auth/authenticate`);
    console.log("Payload:", credentials);

    // return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/authenticate`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem('current_user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);

          // Track login endpoint
          this.http.post('https://backend-logger-361o.onrender.com/track/', {
            calledService: '/api/auth/authenticate',
            id: response.user.id
          }).subscribe({
            next: () => console.log('✓ Tracking request to backend-logger succeeded'),
            error: () => console.log('✗ Tracking request to backend-logger did not succeed')
          });
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return user?.roles?.includes(role) || false;
  }

  isAdmin(): boolean {
    return this.hasRole('ORGANIZATION_ADMIN');
  }
}
