import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>Reports & Analytics</h1>
      <p>Sprint metrics and team performance</p>
      <div class="reports-grid">
        <div class="report-card">
          <h3>📉 Burndown Chart</h3>
          <p>Track sprint progress over time</p>
        </div>
        <div class="report-card">
          <h3>⚡ Velocity</h3>
          <p>Team velocity trends</p>
        </div>
        <div class="report-card">
          <h3>📊 Cumulative Flow</h3>
          <p>Workflow visualization</p>
        </div>
        <div class="report-card">
          <h3>📈 Sprint Summary</h3>
          <p>Sprint completion metrics</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; }
    h1 { color: #1a202c; margin-bottom: 0.5rem; }
    p { color: #718096; margin-bottom: 2rem; }
    .reports-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
    .report-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .report-card h3 { margin: 0 0 0.5rem 0; color: #2d3748; }
    .report-card p { margin: 0; color: #718096; }
  `]
})
export class ReportsComponent {}
