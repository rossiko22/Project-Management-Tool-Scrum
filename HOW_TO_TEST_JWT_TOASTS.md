# How to Test JWT Toast Notifications

This guide shows you how to trigger and test the toast notifications for JWT errors.

---

## Quick Test Methods

### Method 1: Expire Token Instantly (Easiest for Demo)

Temporarily change the JWT expiration to 10 seconds for testing:

**File**: `backend/identity-service/src/main/resources/application.yml`

```yaml
jwt:
  secret: your-secret-key-change-in-production-must-be-at-least-256-bits-long-for-hs256
  expiration: 10000  # Change from 28800000 to 10000 (10 seconds)
```

**Steps**:
1. Change expiration to 10000 milliseconds (10 seconds)
2. Rebuild identity-service:
   ```bash
   cd backend/identity-service
   mvn clean package -DskipTests
   ```
3. Rebuild Docker image:
   ```bash
   cd ../..
   docker compose build identity-service
   docker compose up -d identity-service
   ```
4. Login to the frontend at http://team.local/
5. Wait 10 seconds
6. Try to navigate to any page or perform any action
7. **You'll see**: Toast notification "Session Expired" and redirect to login

**Don't forget to change it back to 28800000 after testing!**

---

### Method 2: Use Browser Developer Tools (No Rebuild Needed)

**Steps**:
1. Login to http://team.local/
2. Open Browser Developer Tools (F12)
3. Go to **Application** → **Local Storage** → `http://team.local`
4. Find the key `auth_token`
5. Modify the token value (add some random characters at the end)
6. Refresh the page or click any link
7. **You'll see**: Toast notification "Invalid Session" and redirect to login

---

### Method 3: Delete Token from LocalStorage

**Steps**:
1. Login to http://team.local/
2. Open Browser Developer Tools (F12)
3. Go to **Console** tab
4. Type: `localStorage.removeItem('auth_token')`
5. Try to navigate to any protected page
6. **You'll see**: Redirect to login (no toast, because there's no token to validate)

---

### Method 4: Test 403 Forbidden (Permission Denied)

**Steps**:
1. Login as a **DEVELOPER** user:
   - Email: `dev123@example.com`
   - Password: `admin123`
2. Navigate to http://team.local/sprints
3. Try to click "Create Sprint" (if visible)
4. OR use browser console:
   ```javascript
   fetch('/api/scrum/sprints', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       projectId: 1,
       teamId: 1,
       name: "Test Sprint",
       goal: "Test",
       startDate: "2025-01-20",
       endDate: "2025-02-03",
       lengthWeeks: 2
     })
   })
   ```
5. **You'll see**: Toast notification "Access Denied" (because only SCRUM_MASTER can create sprints)

---

### Method 5: Test Network Error

**Steps**:
1. Login to http://team.local/
2. Stop the backend service:
   ```bash
   docker compose stop scrum-core-service
   ```
3. Try to navigate to Sprints page or Dashboard
4. **You'll see**: Toast notification "Network Error"
5. Restart the service:
   ```bash
   docker compose start scrum-core-service
   ```

---

## Toast Notification Types

Here's what each toast looks like:

### 1. Session Expired (401 with "expired" message)
```
Title: Session Expired
Message: Your session has expired. Please log in again.
Color: Red (error)
Action: Auto-logout + redirect to login
```

### 2. Invalid Session (401 without "expired")
```
Title: Invalid Session
Message: Your session is invalid. Please log in again.
Color: Red (error)
Action: Auto-logout + redirect to login
```

### 3. Access Denied (403)
```
Title: Access Denied
Message: You do not have permission to access this resource.
Color: Red (error)
Action: Shows toast, no redirect
```

### 4. Network Error (status 0)
```
Title: Network Error
Message: Unable to connect to the server. Please check your internet connection.
Color: Red (error)
Action: Shows toast only
```

### 5. Server Error (status >= 500)
```
Title: Server Error
Message: An unexpected server error occurred. Please try again later.
Color: Red (error)
Action: Shows toast only
```

---

## Automated Test Script

You can also create a test page to trigger all toast types:

**File**: `frontend/team-portal/src/app/components/test-toasts/test-toasts.component.ts`

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-test-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <h2>Toast Notification Tests</h2>

      <button class="btn btn-danger" (click)="testExpiredToken()">
        Test: Session Expired
      </button>

      <button class="btn btn-danger" (click)="testInvalidToken()">
        Test: Invalid Session
      </button>

      <button class="btn btn-danger" (click)="testForbidden()">
        Test: Access Denied
      </button>

      <button class="btn btn-warning" (click)="testNetworkError()">
        Test: Network Error
      </button>

      <button class="btn btn-warning" (click)="testServerError()">
        Test: Server Error
      </button>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 2rem;
    }
    button {
      display: block;
      margin: 1rem 0;
      padding: 0.75rem 1.5rem;
    }
  `]
})
export class TestToastsComponent {
  constructor(
    private toastService: ToastService,
    private http: HttpClient
  ) {}

  testExpiredToken() {
    this.toastService.jwtExpired();
  }

  testInvalidToken() {
    this.toastService.jwtInvalid();
  }

  testForbidden() {
    this.toastService.forbidden();
  }

  testNetworkError() {
    this.toastService.networkError();
  }

  testServerError() {
    this.toastService.serverError();
  }
}
```

Then add route in `app.routes.ts`:
```typescript
{
  path: 'test-toasts',
  component: TestToastsComponent
}
```

Navigate to http://team.local/test-toasts and click buttons to test!

---

## Verify Toast Configuration

Check that toasts are properly configured:

1. **Styles Loaded**: Verify `ngx-toastr/toastr.css` is in `angular.json`
2. **Module Configured**: Check `app.config.ts` has `provideToastr()`
3. **Interceptor Active**: HTTP errors are caught in `auth.interceptor.ts`

---

## Current JWT Implementation Status

✅ **Backend**:
- JWT contains required claims: `sub`, `name`, `iat`, `exp`
- Tokens sent as `Authorization: Bearer <token>` header
- All services verify tokens independently (shared secret)
- Services check if token is valid and identify user

✅ **Frontend**:
- Tokens automatically added to all HTTP requests
- HTTP interceptor catches JWT errors (401, 403)
- Toast notifications display for all error scenarios
- Auto-logout on token expiration/invalidation
- Redirect to login page on authentication failure

---

## Production Recommendations

1. **Token Expiration**: Keep at 8 hours (28,800,000 ms) for production
2. **HTTPS Only**: Use HTTPS in production to prevent token interception
3. **Refresh Tokens**: Consider implementing refresh tokens for better UX
4. **Error Logging**: Log all JWT validation failures for security monitoring
5. **Rate Limiting**: Implement rate limiting on login endpoint

---

## Troubleshooting

### Toast doesn't appear
- Check browser console for errors
- Verify ngx-toastr CSS is loaded (inspect Network tab)
- Check that `provideToastr()` is in `app.config.ts`

### Token expires immediately
- Check `jwt.expiration` in `application.yml` (should be 28800000)
- Verify system clock is synchronized

### 403 errors for valid users
- Check user's roles in JWT payload (browser console)
- Verify endpoint permissions match user roles
- Check `projectIds` claim includes the project being accessed

---

## Example: Full Test Scenario

1. **Login**:
   ```
   Email: dev123@example.com
   Password: admin123
   ```

2. **Open Browser Console** and run:
   ```javascript
   // View current token
   console.log(localStorage.getItem('auth_token'));

   // Decode token (JWT payload)
   const token = localStorage.getItem('auth_token');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Token payload:', payload);
   console.log('Expires at:', new Date(payload.exp * 1000));
   ```

3. **Invalidate token**:
   ```javascript
   localStorage.setItem('auth_token', 'invalid.token.here');
   ```

4. **Trigger API call**:
   ```javascript
   fetch('/api/scrum/sprints/project/1')
     .catch(err => console.error('Error caught:', err));
   ```

5. **Observe**: Toast "Invalid Session" appears, redirect to login

---

**The JWT toast notification system is fully implemented and working!** 🎉
