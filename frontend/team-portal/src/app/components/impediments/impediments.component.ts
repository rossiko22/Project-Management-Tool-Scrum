import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-impediments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>Impediments</h1>
      <p>Track and manage sprint impediments</p>
      <div class="empty-state">
        <div class="icon">🚧</div>
        <h3>No impediments reported</h3>
        <p>That's great! Your sprint is running smoothly.</p>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; }
    h1 { color: #1a202c; margin-bottom: 0.5rem; }
    p { color: #718096; }
    .empty-state { text-align: center; padding: 4rem 2rem; }
    .empty-state .icon { font-size: 4rem; margin-bottom: 1rem; }
    .empty-state h3 { color: #2d3748; margin-bottom: 0.5rem; }
  `]
})
export class ImpedimentsComponent implements OnInit {
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Track page visit
    const userId = this.authService.currentUserValue?.id;
    if (userId) {
      this.http.post('https://backend-logger-361o.onrender.com/track/', {
        calledService: '/impediments',
        id: userId
      }).subscribe({
        next: () => console.log('✓ Tracking request to backend-logger succeeded'),
        error: () => console.log('✗ Tracking request to backend-logger did not succeed')
      });
    }
  }
}
