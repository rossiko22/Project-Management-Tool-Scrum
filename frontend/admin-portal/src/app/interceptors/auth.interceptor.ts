import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
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

  return next(clonedReq);
};
