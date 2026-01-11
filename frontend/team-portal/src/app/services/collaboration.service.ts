import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Comment {
  id: number;
  authorId: number;
  authorName?: string;
  entityType: 'BACKLOG_ITEM' | 'TASK' | 'SPRINT' | 'IMPEDIMENT';
  entityId: number;
  content: string;
  parentCommentId?: number;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}

export interface ActivityLog {
  id: number;
  userId: number;
  userName?: string;
  projectId: number;
  action: string;
  entityType: string;
  entityId: number;
  details?: any;
  createdAt: Date;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: number;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // Comments APIs
  createComment(
    entityType: string,
    entityId: number,
    content: string,
    parentCommentId?: number
  ): Observable<Comment> {
    return this.http.post<Comment>(`${this.baseUrl}/comments`, {
      entityType,
      entityId,
      content,
      parentCommentId
    });
  }

  getComments(entityType: string, entityId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.baseUrl}/comments/thread/${entityType}/${entityId}`);
  }

  updateComment(id: number, content: string): Observable<Comment> {
    return this.http.put<Comment>(`${this.baseUrl}/comments/${id}`, { content });
  }

  deleteComment(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/comments/${id}`);
  }

  // Activity Feed APIs
  getProjectActivity(projectId: number, limit?: number): Observable<ActivityLog[]> {
    if (limit) {
      return this.http.get<ActivityLog[]>(`${this.baseUrl}/activity/project/${projectId}`, {
        params: { limit: limit.toString() }
      });
    }
    return this.http.get<ActivityLog[]>(`${this.baseUrl}/activity/project/${projectId}`);
  }

  getUserActivity(userId: number, limit?: number): Observable<ActivityLog[]> {
    if (limit) {
      return this.http.get<ActivityLog[]>(`${this.baseUrl}/activity/user/${userId}`, {
        params: { limit: limit.toString() }
      });
    }
    return this.http.get<ActivityLog[]>(`${this.baseUrl}/activity/user/${userId}`);
  }

  // Notifications APIs
  getNotifications(userId: number): Observable<Notification[]> {
    // Backend uses JWT auth, userId is extracted from token
    return this.http.get<Notification[]>(`${this.baseUrl}/notifications`);
  }

  markNotificationAsRead(notificationId: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/notifications/${notificationId}/read`, {});
  }

  markAllNotificationsAsRead(userId: number): Observable<{ message: string }> {
    // Backend uses JWT auth, userId is extracted from token
    return this.http.patch<{ message: string }>(`${this.baseUrl}/notifications/mark-all-read`, {});
  }
}
