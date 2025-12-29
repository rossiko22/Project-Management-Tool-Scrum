import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private recentToasts = new Map<string, number>();
  private readonly TOAST_COOLDOWN_MS = 3000; // Prevent same toast within 3 seconds

  constructor(private toastr: ToastrService) {}

  private canShowToast(key: string): boolean {
    const lastShown = this.recentToasts.get(key);
    const now = Date.now();

    if (lastShown && now - lastShown < this.TOAST_COOLDOWN_MS) {
      return false; // Too soon, skip this toast
    }

    this.recentToasts.set(key, now);
    return true;
  }

  success(message: string, title?: string): void {
    const key = `success:${title}:${message}`;
    if (this.canShowToast(key)) {
      this.toastr.success(message, title || 'Success');
    }
  }

  error(message: string, title?: string): void {
    const key = `error:${title}:${message}`;
    if (this.canShowToast(key)) {
      this.toastr.error(message, title || 'Error');
    }
  }

  warning(message: string, title?: string): void {
    const key = `warning:${title}:${message}`;
    if (this.canShowToast(key)) {
      this.toastr.warning(message, title || 'Warning');
    }
  }

  info(message: string, title?: string): void {
    const key = `info:${title}:${message}`;
    if (this.canShowToast(key)) {
      this.toastr.info(message, title || 'Info');
    }
  }

  jwtExpired(): void {
    const key = 'jwt:expired';
    if (this.canShowToast(key)) {
      this.toastr.error(
        'Your session has expired. Please log in again.',
        'Session Expired'
      );
    }
  }

  jwtInvalid(): void {
    const key = 'jwt:invalid';
    if (this.canShowToast(key)) {
      this.toastr.error(
        'Your session is invalid. Please log in again.',
        'Invalid Session'
      );
    }
  }

  unauthorized(): void {
    const key = 'auth:unauthorized';
    if (this.canShowToast(key)) {
      this.toastr.error(
        'You are not authorized to perform this action.',
        'Unauthorized'
      );
    }
  }

  forbidden(): void {
    const key = 'auth:forbidden';
    if (this.canShowToast(key)) {
      this.toastr.error(
        'You do not have permission to access this resource.',
        'Access Denied'
      );
    }
  }

  serverError(): void {
    const key = 'server:error';
    if (this.canShowToast(key)) {
      this.toastr.error(
        'An unexpected server error occurred. Please try again later.',
        'Server Error'
      );
    }
  }

  networkError(): void {
    const key = 'network:error';
    if (this.canShowToast(key)) {
      this.toastr.error(
        'Unable to connect to the server. Please check your internet connection.',
        'Network Error'
      );
    }
  }
}
