import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BacklogItemApproval {
  backlogItemId: number;
  sprintId: number;
  developerId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  respondedAt?: string;
  rejectionReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApprovalService {
  private apiUrl = `${environment.scrumApiUrl}/approvals`;

  constructor(private http: HttpClient) {}

  /**
   * Get pending approvals for current user
   */
  getMyPendingApprovals(): Observable<BacklogItemApproval[]> {
    return this.http.get<BacklogItemApproval[]>(`${this.apiUrl}/my-pending`);
  }

  /**
   * Get all approvals for a specific backlog item in a sprint
   */
  getApprovalsForItem(backlogItemId: number, sprintId: number): Observable<BacklogItemApproval[]> {
    return this.http.get<BacklogItemApproval[]>(`${this.apiUrl}/item/${backlogItemId}/sprint/${sprintId}`);
  }

  /**
   * Approve a backlog item for sprint
   */
  approveItem(backlogItemId: number, sprintId: number): Observable<BacklogItemApproval> {
    return this.http.post<BacklogItemApproval>(
      `${this.apiUrl}/${backlogItemId}/sprint/${sprintId}/approve`,
      {}
    );
  }

  /**
   * Reject a backlog item for sprint
   */
  rejectItem(backlogItemId: number, sprintId: number, rejectionReason: string): Observable<BacklogItemApproval> {
    return this.http.post<BacklogItemApproval>(
      `${this.apiUrl}/${backlogItemId}/sprint/${sprintId}/reject`,
      { approved: false, rejectionReason }
    );
  }
}
