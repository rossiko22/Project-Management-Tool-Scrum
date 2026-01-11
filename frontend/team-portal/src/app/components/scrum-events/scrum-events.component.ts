import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-scrum-events',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>Scrum Events</h1>
      <p>Document and manage Scrum ceremonies</p>
      <div class="events-grid">
        <div class="event-card">
          <h3>📋 Sprint Planning</h3>
          <p>Plan the upcoming sprint</p>
        </div>
        <div class="event-card">
          <h3>🗣️ Daily Scrum</h3>
          <p>Daily standup meetings</p>
        </div>
        <div class="event-card">
          <h3>📊 Sprint Review</h3>
          <p>Demo completed work</p>
        </div>
        <div class="event-card">
          <h3>🔄 Sprint Retrospective</h3>
          <p>Reflect and improve</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; }
    h1 { color: #1a202c; margin-bottom: 0.5rem; }
    p { color: #718096; margin-bottom: 2rem; }
    .events-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
    .event-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .event-card h3 { margin: 0 0 0.5rem 0; color: #2d3748; }
    .event-card p { margin: 0; color: #718096; }
  `]
})
export class ScrumEventsComponent implements OnInit {
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Track page visit
    const userId = this.authService.currentUserValue?.id;
    if (userId) {
      this.http.post('https://backend-logger-361o.onrender.com/track/', {
        calledService: '/scrum-events',
        id: userId
      }).subscribe({
        next: () => console.log('✓ Tracking request to backend-logger succeeded'),
        error: () => console.log('✗ Tracking request to backend-logger did not succeed')
      });
    }
  }
}
