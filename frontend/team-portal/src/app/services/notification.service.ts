import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Notification } from '../models/sprint.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl).pipe(
      tap(notifications => {
        const unreadCount = notifications.filter(n => !n.read).length;
        this.unreadCountSubject.next(unreadCount);
      })
    );
  }

  markAsRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, { read: true }).pipe(
      tap(() => {
        const currentCount = this.unreadCountSubject.value;
        this.unreadCountSubject.next(Math.max(0, currentCount - 1));
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap(() => this.unreadCountSubject.next(0))
    );
  }
}
