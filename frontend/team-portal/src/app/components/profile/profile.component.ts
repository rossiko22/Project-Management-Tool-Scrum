import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>Profile & Settings</h1>
      <div class="profile-card">
        <div class="avatar">{{ getInitials() }}</div>
        <h2>{{ authService.currentUserValue?.firstName }} {{ authService.currentUserValue?.lastName }}</h2>
        <p class="email">{{ authService.currentUserValue?.email }}</p>
        <div class="roles">
          <span *ngFor="let role of authService.currentUserValue?.roles" class="role-badge">
            {{ role.replace('_', ' ') }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; max-width: 600px; margin: 0 auto; }
    h1 { color: var(--text-primary); margin-bottom: 2rem; text-align: center; }
    .profile-card { background: var(--bg-primary); padding: 3rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
    .avatar { width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; margin: 0 auto 1.5rem; }
    h2 { margin: 0 0 0.5rem 0; color: var(--text-primary); }
    .email { color: var(--text-muted); margin-bottom: 1.5rem; }
    .roles { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
    .role-badge { padding: 0.5rem 1rem; background: var(--info-light); color: var(--info-color); border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
  `]
})
export class ProfileComponent {
  constructor(public authService: AuthService) {}

  getInitials(): string {
    const user = this.authService.currentUserValue;
    if (!user) return '?';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;
  }
}
