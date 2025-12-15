import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Retrospective, CreateRetrospectiveRequest } from '../models/sprint.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RetrospectiveService {
  private apiUrl = `${environment.scrumApiUrl}/retrospectives`;

  constructor(private http: HttpClient) {}

  createRetrospective(request: CreateRetrospectiveRequest): Observable<Retrospective> {
    return this.http.post<Retrospective>(this.apiUrl, request);
  }

  updateRetrospective(id: number, request: CreateRetrospectiveRequest): Observable<Retrospective> {
    return this.http.put<Retrospective>(`${this.apiUrl}/${id}`, request);
  }

  getRetrospectiveBySprint(sprintId: number): Observable<Retrospective> {
    return this.http.get<Retrospective>(`${this.apiUrl}/sprint/${sprintId}`);
  }

  getRetrospective(id: number): Observable<Retrospective> {
    return this.http.get<Retrospective>(`${this.apiUrl}/${id}`);
  }
}
