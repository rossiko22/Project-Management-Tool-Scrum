import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private toastr: ToastrService) {}

  success(message: string, title?: string): void {
    this.toastr.success(message, title || 'Success');
  }

  error(message: string, title?: string): void {
    this.toastr.error(message, title || 'Error');
  }

  warning(message: string, title?: string): void {
    this.toastr.warning(message, title || 'Warning');
  }

  info(message: string, title?: string): void {
    this.toastr.info(message, title || 'Info');
  }

  jwtExpired(): void {
    this.error(
      'Your session has expired. Please log in again.',
      'Session Expired'
    );
  }

  jwtInvalid(): void {
    this.error(
      'Your session is invalid. Please log in again.',
      'Invalid Session'
    );
  }

  unauthorized(): void {
    this.error(
      'You are not authorized to perform this action.',
      'Unauthorized'
    );
  }

  forbidden(): void {
    this.error(
      'You do not have permission to access this resource.',
      'Access Denied'
    );
  }

  serverError(): void {
    this.error(
      'An unexpected server error occurred. Please try again later.',
      'Server Error'
    );
  }

  networkError(): void {
    this.error(
      'Unable to connect to the server. Please check your internet connection.',
      'Network Error'
    );
  }
}
