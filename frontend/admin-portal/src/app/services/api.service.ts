import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  get<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${environment.apiUrl}${path}`, {
      headers: this.getHeaders(),
      params
    });
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(`${environment.apiUrl}${path}`, body, {
      headers: this.getHeaders()
    });
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(`${environment.apiUrl}${path}`, body, {
      headers: this.getHeaders()
    });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${environment.apiUrl}${path}`, {
      headers: this.getHeaders()
    });
  }
}
