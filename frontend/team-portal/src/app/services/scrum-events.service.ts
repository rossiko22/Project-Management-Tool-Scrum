import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ScrumEvent } from '../models/sprint.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScrumEventsService {
  private apiUrl = `${environment.apiUrl}/sprints`;

  constructor(private http: HttpClient) {}

  getSprintEvents(sprintId: number): Observable<ScrumEvent[]> {
    return this.http.get<ScrumEvent[]>(`${this.apiUrl}/${sprintId}/events`);
  }

  getSprintEventByType(sprintId: number, type: ScrumEvent['type']): Observable<ScrumEvent> {
    return this.http.get<ScrumEvent>(`${this.apiUrl}/${sprintId}/events/${type}`);
  }

  documentEvent(sprintId: number, event: Partial<ScrumEvent>): Observable<ScrumEvent> {
    return this.http.post<ScrumEvent>(`${this.apiUrl}/${sprintId}/events`, event);
  }

  updateEvent(eventId: number, event: Partial<ScrumEvent>): Observable<ScrumEvent> {
    return this.http.patch<ScrumEvent>(`${environment.apiUrl}/events/${eventId}`, event);
  }
}
