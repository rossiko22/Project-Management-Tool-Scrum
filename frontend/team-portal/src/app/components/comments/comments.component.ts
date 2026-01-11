import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollaborationService, Comment } from '../../services/collaboration.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.scss']
})
export class CommentsComponent implements OnInit, OnDestroy {
  @Input() entityType!: string;
  @Input() entityId!: number;

  comments: Comment[] = [];
  newComment = '';
  replyingTo: number | null = null;
  replyText = '';
  editingCommentId: number | null = null;
  editText = '';
  loading = false;
  error: string | null = null;

  private refreshInterval: any;

  constructor(
    private collaborationService: CollaborationService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadComments();
    // Auto-refresh every 10 seconds
    this.refreshInterval = setInterval(() => this.loadComments(), 10000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadComments(): void {
    if (!this.entityType || !this.entityId) return;

    this.loading = true;
    this.collaborationService.getComments(this.entityType, this.entityId).subscribe({
      next: (comments) => {
        this.comments = comments.filter(c => !c.isDeleted).sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading comments:', err);
        this.error = 'Failed to load comments';
        this.loading = false;
      }
    });
  }

  getTopLevelComments(): Comment[] {
    return this.comments.filter(c => !c.parentCommentId);
  }

  getReplies(parentId: number): Comment[] {
    return this.comments.filter(c => c.parentCommentId === parentId);
  }

  addComment(): void {
    if (!this.newComment.trim()) return;

    this.error = null;

    this.collaborationService.createComment(
      this.entityType,
      this.entityId,
      this.newComment.trim()
    ).subscribe({
      next: () => {
        this.newComment = '';
        this.loadComments();
      },
      error: (err) => {
        console.error('Error creating comment:', err);
        this.error = 'Failed to create comment';
      }
    });
  }

  startReply(commentId: number): void {
    this.replyingTo = commentId;
    this.replyText = '';
    this.editingCommentId = null;
  }

  cancelReply(): void {
    this.replyingTo = null;
    this.replyText = '';
  }

  submitReply(parentId: number): void {
    if (!this.replyText.trim()) return;

    this.collaborationService.createComment(
      this.entityType,
      this.entityId,
      this.replyText.trim(),
      parentId
    ).subscribe({
      next: () => {
        this.cancelReply();
        this.loadComments();
      },
      error: (err) => {
        console.error('Error adding reply:', err);
        this.error = 'Failed to add reply';
      }
    });
  }

  startEdit(comment: Comment): void {
    this.editingCommentId = comment.id;
    this.editText = comment.content;
    this.replyingTo = null;
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editText = '';
  }

  submitEdit(commentId: number): void {
    if (!this.editText.trim()) return;

    this.collaborationService.updateComment(commentId, this.editText.trim()).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadComments();
      },
      error: (err) => {
        console.error('Error updating comment:', err);
        this.error = 'Failed to update comment';
      }
    });
  }

  deleteComment(commentId: number): void {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    this.collaborationService.deleteComment(commentId).subscribe({
      next: () => {
        this.loadComments();
      },
      error: (err) => {
        console.error('Error deleting comment:', err);
        this.error = 'Failed to delete comment';
      }
    });
  }

  canEditOrDelete(comment: Comment): boolean {
    return this.authService.currentUserValue?.id === comment.authorId;
  }

  formatDate(date: Date): string {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return commentDate.toLocaleDateString();
  }
}
