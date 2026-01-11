import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CollaborationService, Notification } from '../../services/collaboration.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  showDropdown = false;
  loading = false;
  error: string | null = null;

  private refreshInterval: any;

  constructor(
    private collaborationService: CollaborationService,
    private authService: AuthService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    // Auto-refresh every 30 seconds
    this.refreshInterval = setInterval(() => this.loadNotifications(), 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  loadNotifications(): void {
    const currentUserId = this.authService.currentUserValue?.id;
    if (!currentUserId) return;

    this.loading = true;
    this.error = null;

    this.collaborationService.getNotifications(currentUserId).subscribe({
      next: (backendNotifications: any[]) => {
        // Map backend format to frontend format
        this.notifications = backendNotifications.map(n => ({
          id: n.id,
          userId: n.recipientId,
          type: n.type,
          title: n.payload?.title || this.getDefaultTitle(n.type),
          message: n.payload?.message || '',
          entityType: n.payload?.entityType,
          entityId: n.payload?.entityId,
          isRead: n.read,
          createdAt: n.createdAt
        })).sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
        this.error = 'Failed to load notifications';
        this.loading = false;
      }
    });
  }

  getDefaultTitle(type: string): string {
    switch (type) {
      case 'BACKLOG_ITEM_APPROVAL_REQUEST':
        return 'Approval Request';
      case 'BACKLOG_ITEM_APPROVED':
        return 'Item Approved';
      case 'BACKLOG_ITEM_REJECTED':
        return 'Item Rejected';
      case 'COMMENT_ADDED':
        return 'New Comment';
      case 'TASK_ASSIGNED':
        return 'Task Assigned';
      case 'SPRINT_STARTED':
        return 'Sprint Started';
      case 'SPRINT_ENDED':
        return 'Sprint Ended';
      default:
        return 'Notification';
    }
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.loadNotifications();
    }
  }

  markAsRead(notification: Notification): void {
    if (notification.isRead) return;

    this.collaborationService.markNotificationAsRead(notification.id).subscribe({
      next: (updatedNotification) => {
        notification.isRead = true;
      },
      error: (err) => {
        console.error('Error marking notification as read:', err);
      }
    });
  }

  markAllAsRead(): void {
    const currentUserId = this.authService.currentUserValue?.id;
    if (!currentUserId) return;

    this.collaborationService.markAllNotificationsAsRead(currentUserId).subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
      },
      error: (err) => {
        console.error('Error marking all notifications as read:', err);
      }
    });
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'COMMENT_ADDED':
        return '💬';
      case 'BACKLOG_ITEM_APPROVAL_REQUEST':
        return '🔔';
      case 'BACKLOG_ITEM_APPROVED':
        return '✅';
      case 'BACKLOG_ITEM_REJECTED':
        return '❌';
      case 'SPRINT_STARTED':
        return '🏁';
      case 'SPRINT_ENDED':
        return '🎯';
      case 'TASK_ASSIGNED':
        return '📋';
      case 'IMPEDIMENT_REPORTED':
        return '🚧';
      case 'IMPEDIMENT_RESOLVED':
        return '✔️';
      default:
        return '📢';
    }
  }

  getTimeAgo(dateString: string): string {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return notificationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
