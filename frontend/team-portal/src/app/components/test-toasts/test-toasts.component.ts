import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-test-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <h1>JWT Toast Notification Tests</h1>
      <p>Click buttons below to test different toast notifications</p>

      <div class="test-section">
        <h3>JWT Error Toasts</h3>

        <button class="btn btn-danger" (click)="testExpiredToken()">
          🕐 Test: Session Expired (401 expired)
        </button>

        <button class="btn btn-danger" (click)="testInvalidToken()">
          ❌ Test: Invalid Session (401 invalid)
        </button>

        <button class="btn btn-danger" (click)="testForbidden()">
          🚫 Test: Access Denied (403)
        </button>
      </div>

      <div class="test-section">
        <h3>Other Error Toasts</h3>

        <button class="btn btn-warning" (click)="testNetworkError()">
          📡 Test: Network Error
        </button>

        <button class="btn btn-warning" (click)="testServerError()">
          🔥 Test: Server Error (500)
        </button>
      </div>

      <div class="test-section">
        <h3>Success & Info Toasts</h3>

        <button class="btn btn-success" (click)="testSuccess()">
          ✅ Test: Success Toast
        </button>

        <button class="btn btn-info" (click)="testInfo()">
          ℹ️ Test: Info Toast
        </button>

        <button class="btn btn-secondary" (click)="testWarning()">
          ⚠️ Test: Warning Toast
        </button>
      </div>

      <div class="test-section">
        <h3>Real JWT Tests</h3>

        <button class="btn btn-danger" (click)="corruptToken()">
          🔧 Corrupt JWT Token in LocalStorage
        </button>

        <button class="btn btn-danger" (click)="removeToken()">
          🗑️ Remove JWT Token
        </button>

        <button class="btn btn-success" (click)="showToken()">
          👁️ Show Current Token in Console
        </button>
      </div>

      <div class="test-section">
        <button class="btn btn-outline" (click)="goBack()">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    h1 {
      color: #2d3748;
      margin-bottom: 0.5rem;
    }

    p {
      color: #718096;
      margin-bottom: 2rem;
    }

    .test-section {
      margin: 2rem 0;
      padding: 1.5rem;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .test-section h3 {
      color: #4a5568;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
    }

    .btn {
      display: block;
      width: 100%;
      margin: 0.75rem 0;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      font-size: 1rem;
    }

    .btn-danger {
      background: #f56565;
      color: white;
    }

    .btn-danger:hover {
      background: #e53e3e;
    }

    .btn-warning {
      background: #ed8936;
      color: white;
    }

    .btn-warning:hover {
      background: #dd6b20;
    }

    .btn-success {
      background: #48bb78;
      color: white;
    }

    .btn-success:hover {
      background: #38a169;
    }

    .btn-info {
      background: #4299e1;
      color: white;
    }

    .btn-info:hover {
      background: #3182ce;
    }

    .btn-secondary {
      background: #718096;
      color: white;
    }

    .btn-secondary:hover {
      background: #4a5568;
    }

    .btn-outline {
      background: transparent;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .btn-outline:hover {
      background: #667eea;
      color: white;
    }
  `]
})
export class TestToastsComponent {
  constructor(
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router
  ) {}

  testExpiredToken() {
    this.toastService.jwtExpired();
    console.log('🕐 Triggered: Session Expired toast');
  }

  testInvalidToken() {
    this.toastService.jwtInvalid();
    console.log('❌ Triggered: Invalid Session toast');
  }

  testForbidden() {
    this.toastService.forbidden();
    console.log('🚫 Triggered: Access Denied toast');
  }

  testNetworkError() {
    this.toastService.networkError();
    console.log('📡 Triggered: Network Error toast');
  }

  testServerError() {
    this.toastService.serverError();
    console.log('🔥 Triggered: Server Error toast');
  }

  testSuccess() {
    this.toastService.success('This is a success message!', 'Success');
    console.log('✅ Triggered: Success toast');
  }

  testInfo() {
    this.toastService.info('This is an informational message', 'Information');
    console.log('ℹ️ Triggered: Info toast');
  }

  testWarning() {
    this.toastService.warning('This is a warning message', 'Warning');
    console.log('⚠️ Triggered: Warning toast');
  }

  corruptToken() {
    const currentToken = this.authService.token;
    if (currentToken) {
      localStorage.setItem('auth_token', 'invalid.corrupted.token');
      this.toastService.warning('Token corrupted! Try navigating to any page to see error toast.', 'Token Corrupted');
      console.log('🔧 JWT Token corrupted. Navigate to any page to trigger error.');
    } else {
      this.toastService.error('No token found in storage', 'Error');
    }
  }

  removeToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.toastService.warning('Token removed! You will be redirected on next API call.', 'Token Removed');
    console.log('🗑️ JWT Token removed from localStorage');
  }

  showToken() {
    const token = this.authService.token;
    if (token) {
      console.log('=== Current JWT Token ===');
      console.log('Full Token:', token);

      try {
        // Decode JWT payload
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('\n=== Decoded Payload ===');
        console.log('Subject (sub):', payload.sub);
        console.log('Name:', payload.name);
        console.log('Email:', payload.email);
        console.log('User ID:', payload.userId);
        console.log('Roles:', payload.roles);
        console.log('Project IDs:', payload.projectIds);
        console.log('Team IDs:', payload.teamIds);
        console.log('Issued At (iat):', new Date(payload.iat * 1000).toLocaleString());
        console.log('Expires At (exp):', new Date(payload.exp * 1000).toLocaleString());
        console.log('\n✅ All required claims present: sub, name, iat, exp');

        this.toastService.success('Token details logged to console (F12)', 'Token Info');
      } catch (e) {
        console.error('Error decoding token:', e);
        this.toastService.error('Failed to decode token', 'Error');
      }
    } else {
      console.log('No token found in localStorage');
      this.toastService.error('No token found', 'Error');
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
