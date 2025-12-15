import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);
  const token = authService.token;

  console.log(`[Interceptor] Request to: ${req.url}`);
  console.log(`[Interceptor] Token exists: ${!!token}`);

  // Clone request with credentials enabled for cookie-based auth
  let clonedReq = req.clone({
    withCredentials: true
  });

  // Also include Authorization header if token exists
  if (token) {
    console.log(`[Interceptor] Adding Authorization header`);
    clonedReq = clonedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  } else {
    console.log(`[Interceptor] No token available`);
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('[Interceptor] HTTP Error:', error);

      // Handle different error scenarios
      if (error.status === 401) {
        // Unauthorized - Invalid or expired JWT token
        console.error('[Interceptor] 401 Unauthorized - Token invalid or expired');

        // Check if error message indicates token expiration
        const errorMessage = error.error?.message || error.message || '';
        if (errorMessage.toLowerCase().includes('expired')) {
          toastService.jwtExpired();
        } else {
          toastService.jwtInvalid();
        }

        // Logout user and redirect to login
        authService.logout();
        router.navigate(['/login']);

      } else if (error.status === 403) {
        // Forbidden - User doesn't have permission
        console.error('[Interceptor] 403 Forbidden - Insufficient permissions');
        toastService.forbidden();

      } else if (error.status === 0) {
        // Network error or CORS issue
        console.error('[Interceptor] Network error or CORS issue');
        toastService.networkError();

      } else if (error.status >= 500) {
        // Server error
        console.error('[Interceptor] Server error:', error.status);
        toastService.serverError();

      } else if (error.status === 400) {
        // Bad request - show specific error message if available
        const message = error.error?.message || 'Invalid request. Please check your input.';
        toastService.error(message, 'Bad Request');
      }

      // Re-throw the error so components can handle it if needed
      return throwError(() => error);
    })
  );
};
