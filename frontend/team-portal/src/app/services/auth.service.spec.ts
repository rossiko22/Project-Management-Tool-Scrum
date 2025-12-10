import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { LoginRequest, LoginResponse, User } from '../models/user.model';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: ['DEVELOPER']
  };

  const mockLoginResponse: LoginResponse = {
    token: 'test-jwt-token',
    type: 'Bearer',
    user: mockUser
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login successfully and store token', (done) => {
    const loginRequest: LoginRequest = {
      email: 'test@example.com',
      password: 'password123'
    };

    service.login(loginRequest).subscribe(response => {
      expect(response).toEqual(mockLoginResponse);
      expect(localStorage.getItem('auth_token')).toBe('test-jwt-token');
      expect(service.currentUserValue).toEqual(mockUser);
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/authenticate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(loginRequest);
    req.flush(mockLoginResponse);
  });

  it('should logout and clear stored data', () => {
    // Setup - simulate logged in state
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('current_user', JSON.stringify(mockUser));

    // Act
    service.logout();

    // Assert
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('current_user')).toBeNull();
    expect(service.currentUserValue).toBeNull();
  });

  it('should return true when user is authenticated', () => {
    localStorage.setItem('auth_token', 'test-token');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should return false when user is not authenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return token from localStorage', () => {
    const testToken = 'test-jwt-token';
    localStorage.setItem('auth_token', testToken);
    expect(service.token).toBe(testToken);
  });

  it('should return null when no token exists', () => {
    expect(service.token).toBeNull();
  });

  it('should check if user has specific role', () => {
    localStorage.setItem('current_user', JSON.stringify(mockUser));
    // Need to create new instance to pick up localStorage
    service = new AuthService(TestBed.inject(HttpClientTestingModule) as any);

    expect(service.hasRole('DEVELOPER')).toBe(true);
    expect(service.hasRole('SCRUM_MASTER')).toBe(false);
  });

  it('should check if user is admin', () => {
    const adminUser: User = {
      ...mockUser,
      roles: ['ORGANIZATION_ADMIN']
    };
    localStorage.setItem('current_user', JSON.stringify(adminUser));
    service = new AuthService(TestBed.inject(HttpClientTestingModule) as any);

    expect(service.isAdmin()).toBe(true);
  });

  it('should return false for isAdmin when user is not admin', () => {
    localStorage.setItem('current_user', JSON.stringify(mockUser));
    service = new AuthService(TestBed.inject(HttpClientTestingModule) as any);

    expect(service.isAdmin()).toBe(false);
  });

  it('should emit currentUser changes on login', (done) => {
    const loginRequest: LoginRequest = {
      email: 'test@example.com',
      password: 'password123'
    };

    service.currentUser.subscribe(user => {
      if (user) {
        expect(user).toEqual(mockUser);
        done();
      }
    });

    service.login(loginRequest).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/authenticate`);
    req.flush(mockLoginResponse);
  });
});
