import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment } from '../models/sprint.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient) {}

  getCommentThread(entityType: Comment['entityType'], entityId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/threads/${entityType}/${entityId}`);
  }

  addComment(comment: Partial<Comment>): Observable<Comment> {
    return this.http.post<Comment>(this.apiUrl, comment);
  }

  updateComment(id: number, content: string): Observable<Comment> {
    return this.http.patch<Comment>(`${this.apiUrl}/${id}`, { content });
  }

  deleteComment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
