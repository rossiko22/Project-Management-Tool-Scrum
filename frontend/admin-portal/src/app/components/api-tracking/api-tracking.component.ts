import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface EndpointCount {
  endpoint: string;
  total_calls: number;
}

interface MostFrequent {
  endpoint: string;
  total_calls: number;
}

interface LastCalled {
  user_id: number | null;
  endpoint: string;
  method: string;
  ip: string;
  time: string;
}

@Component({
  selector: 'app-api-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './api-tracking.component.html',
  styleUrls: ['./api-tracking.component.scss']
})
export class ApiTrackingComponent implements OnInit {
  endpointCounts: EndpointCount[] = [];
  mostFrequent: MostFrequent | null = null;
  lastCalled: LastCalled | null = null;
  loading = false;
  error: string | null = null;

  // Filter
  filterEndpoint = '';

  private baseUrl = 'https://backend-logger-361o.onrender.com';

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = null;

    // Load all stats in parallel
    Promise.all([
      this.http.get<{counts: EndpointCount[]}>(`${this.baseUrl}/stats/counts`).toPromise(),
      this.http.get<{most_frequent: MostFrequent}>(`${this.baseUrl}/stats/most`).toPromise(),
      this.http.get<{last_called: LastCalled}>(`${this.baseUrl}/stats/last`).toPromise()
    ])
    .then(([countsRes, mostRes, lastRes]) => {
      this.endpointCounts = countsRes?.counts || [];
      this.mostFrequent = mostRes?.most_frequent || null;
      this.lastCalled = lastRes?.last_called || null;
      this.loading = false;
    })
    .catch((err) => {
      console.error('Error loading stats:', err);
      this.error = 'Failed to load API tracking data';
      this.loading = false;
    });
  }

  getFilteredCounts(): EndpointCount[] {
    if (!this.filterEndpoint) {
      return this.endpointCounts;
    }

    return this.endpointCounts.filter(count =>
      count.endpoint.toLowerCase().includes(this.filterEndpoint.toLowerCase())
    );
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  getTotalCalls(): number {
    return this.endpointCounts.reduce((sum, count) => sum + count.total_calls, 0);
  }

  getUniqueEndpoints(): number {
    return this.endpointCounts.length;
  }

  getMostFrequentEndpoint(): string {
    return this.mostFrequent?.endpoint || 'N/A';
  }

  getMostFrequentCount(): number {
    return this.mostFrequent?.total_calls || 0;
  }

  getLastCalledEndpoint(): string {
    return this.lastCalled?.endpoint || 'N/A';
  }

  getLastCalledTime(): string {
    return this.lastCalled?.time ? this.formatDate(this.lastCalled.time) : 'N/A';
  }

  refresh(): void {
    this.loadStats();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
