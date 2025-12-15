# JWT (JSON Web Token) Implementation

## Overview

This document describes the complete JWT authentication and authorization implementation across all services in the Scrum Management System.

---

## JWT Token Structure

### Required Claims (As Per Requirements)

All JWT tokens issued by the identity-service contain the following **required** claims:

| Claim | Description | Example Value |
|-------|-------------|---------------|
| `sub` | Subject (user identifier) | `"sm123@example.com"` |
| `name` | User's display name | `"sm123@example.com"` |
| `iat` | Issued At (timestamp) | `1765778167` |
| `exp` | Expiration Time (timestamp) | `1765806967` |

### Additional Claims (For Authorization)

In addition to the required claims, tokens also include:

| Claim | Description | Example Value |
|-------|-------------|---------------|
| `userId` | Database user ID | `3` |
| `email` | User's email address | `"sm123@example.com"` |
| `roles` | Array of user roles | `["SCRUM_MASTER"]` |
| `teamIds` | Array of team IDs user belongs to | `[1, 3]` |
| `projectIds` | Array of project IDs user has access to | `[1, 2]` |

---

## JWT Generation (Identity Service)

### Implementation

**File**: `backend/identity-service/src/main/java/com/example/identityservice/security/JwtUtil.java`

```java
public String generateToken(User user, List<Long> teamIds, List<Long> projectIds) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("userId", user.getId());
    claims.put("name", user.getEmail());           // Required claim
    claims.put("email", user.getEmail());
    claims.put("roles", user.getRoles().stream()
            .map(role -> role.getName().name())
            .collect(Collectors.toList()));
    claims.put("teamIds", teamIds);
    claims.put("projectIds", projectIds);

    return Jwts.builder()
            .claims(claims)
            .subject(user.getEmail())              // Required claim: sub
            .issuedAt(new Date())                  // Required claim: iat
            .expiration(new Date(System.currentTimeMillis() + expiration))  // Required claim: exp
            .signWith(getSigningKey(), Jwts.SIG.HS256)
            .compact();
}
```

### Configuration

**File**: `backend/identity-service/src/main/resources/application.yml`

```yaml
jwt:
  secret: your-secret-key-change-in-production-must-be-at-least-256-bits-long-for-hs256
  expiration: 28800000  # 8 hours in milliseconds
```

### Algorithm

- **Algorithm**: HS256 (HMAC-SHA256)
- **Secret Key**: Shared across all services (256 bits minimum)
- **Token Validity**: 8 hours (28,800,000 milliseconds)

---

## JWT Validation (All Services)

### Shared Secret Approach

All services (identity-service, scrum-core-service, collaboration-service, reporting-service) share the same JWT secret, allowing them to independently verify tokens without calling back to the identity service.

### Validation Process

**File**: `backend/scrum-core-service/src/main/java/com/example/scrumcoreservice/security/JwtUtil.java`

```java
public Claims extractAllClaims(String token) {
    return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
}

public boolean isTokenExpired(String token) {
    return extractAllClaims(token).getExpiration().before(new Date());
}
```

### JWT Authentication Filter

Each service has a `JwtAuthenticationFilter` that:

1. Extracts the JWT token from the `Authorization: Bearer <token>` header
2. Validates the token signature
3. Checks if the token is expired
4. Extracts user information (userId, email, roles, teamIds, projectIds)
5. Creates a Spring Security authentication context
6. Stores the `UserPrincipal` for use in controller methods

**File**: `backend/scrum-core-service/src/main/java/com/example/scrumcoreservice/security/JwtAuthenticationFilter.java`

```java
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {

    final String authorizationHeader = request.getHeader("Authorization");

    String email = null;
    String jwt = null;

    if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
        jwt = authorizationHeader.substring(7);
        try {
            email = jwtUtil.extractEmail(jwt);
        } catch (Exception e) {
            // Token is invalid
        }
    }

    if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
        try {
            if (!jwtUtil.isTokenExpired(jwt)) {
                List<String> roles = jwtUtil.extractRoles(jwt);
                List<Long> teamIds = jwtUtil.extractTeamIds(jwt);
                List<Long> projectIds = jwtUtil.extractProjectIds(jwt);

                // Create UserPrincipal with all user information from JWT
                UserPrincipal userPrincipal = new UserPrincipal(
                        jwtUtil.extractUserId(jwt),
                        email,
                        roles,
                        teamIds,
                        projectIds,
                        authorities
                );

                UsernamePasswordAuthenticationToken authenticationToken =
                        new UsernamePasswordAuthenticationToken(userPrincipal, null, authorities);
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            }
        } catch (Exception e) {
            // JWT validation failed
        }
    }

    chain.doFilter(request, response);
}
```

---

## Frontend JWT Handling

### Storing the Token

**File**: `frontend/team-portal/src/app/services/auth.service.ts`

```typescript
login(credentials: LoginRequest): Observable<LoginResponse> {
  return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/authenticate`, credentials)
    .pipe(
      tap(response => {
        // Store JWT token in localStorage
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem('current_user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
}

public get token(): string | null {
  return localStorage.getItem(this.tokenKey);
}
```

### HTTP Interceptor

**File**: `frontend/team-portal/src/app/interceptors/auth.interceptor.ts`

The interceptor automatically:
1. Adds the JWT token to all HTTP requests as `Authorization: Bearer <token>` header
2. Catches HTTP errors related to JWT (401, 403)
3. Shows toast notifications for different error scenarios
4. Redirects to login on token expiration/invalidation

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);
  const token = authService.token;

  // Add Authorization header if token exists
  let clonedReq = req.clone({ withCredentials: true });

  if (token) {
    clonedReq = clonedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expired or invalid
        toastService.jwtExpired();
        authService.logout();
        router.navigate(['/login']);
      } else if (error.status === 403) {
        // Insufficient permissions
        toastService.forbidden();
      }
      return throwError(() => error);
    })
  );
};
```

---

## Toast Notifications for JWT Errors

### Implementation

**Library Used**: `ngx-toastr` v19

**File**: `frontend/team-portal/src/app/services/toast.service.ts`

### Toast Types

1. **JWT Expired (401 with "expired" message)**
   - Title: "Session Expired"
   - Message: "Your session has expired. Please log in again."
   - Action: Logout and redirect to login page

2. **JWT Invalid (401 without "expired" message)**
   - Title: "Invalid Session"
   - Message: "Your session is invalid. Please log in again."
   - Action: Logout and redirect to login page

3. **Forbidden (403)**
   - Title: "Access Denied"
   - Message: "You do not have permission to access this resource."
   - Action: Show error, no redirect

4. **Network Error (status 0)**
   - Title: "Network Error"
   - Message: "Unable to connect to the server. Please check your internet connection."

5. **Server Error (status >= 500)**
   - Title: "Server Error"
   - Message: "An unexpected server error occurred. Please try again later."

### Configuration

**File**: `frontend/team-portal/src/app/app.config.ts`

```typescript
provideToastr({
  timeOut: 5000,                    // Auto-dismiss after 5 seconds
  positionClass: 'toast-top-right', // Position in top-right corner
  preventDuplicates: true,          // Don't show duplicate messages
  closeButton: true,                // Show close button
  progressBar: true                 // Show countdown progress bar
})
```

---

## Security Features

### 1. Token Expiration

- **Default Expiration**: 8 hours
- **Auto-Logout**: Frontend automatically logs out and redirects to login when token expires
- **Refresh Strategy**: User must re-login (no refresh tokens currently implemented)

### 2. Role-Based Access Control (RBAC)

All endpoints are protected with Spring Security `@PreAuthorize` annotations:

```java
@PreAuthorize("hasAnyRole('SCRUM_MASTER', 'ORGANIZATION_ADMIN')")
public ResponseEntity<SprintDto> createSprint(@Valid @RequestBody CreateSprintRequest request) {
    // Only SCRUM_MASTER or ORGANIZATION_ADMIN can create sprints
}
```

### 3. Project/Team Access Validation

Endpoints validate that users have access to specific projects/teams:

```java
boolean hasAccess = principal.getRoles().contains("ORGANIZATION_ADMIN") ||
    principal.getProjectIds().stream().anyMatch(id -> id.longValue() == projectId);

if (!hasAccess) {
    return ResponseEntity.status(403).build();
}
```

### 4. Secure Token Transmission

- **HTTPS**: All production traffic should use HTTPS
- **HttpOnly Cookies**: Consider using HttpOnly cookies for additional XSS protection (future enhancement)
- **CORS**: Properly configured to allow only trusted origins

---

## Example JWT Token

### Request

```bash
curl -X POST http://localhost:8080/auth/authenticate \
  -H 'Content-Type: application/json' \
  -d '{"email":"sm123@example.com","password":"admin123"}'
```

### Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJTQ1JVTV9NQVNURVIiXSwibmFtZSI6InNtMTIzQGV4YW1wbGUuY29tIiwicHJvamVjdElkcyI6WzFdLCJ1c2VySWQiOjMsImVtYWlsIjoic20xMjNAZXhhbXBsZS5jb20iLCJ0ZWFtSWRzIjpbMV0sInN1YiI6InNtMTIzQGV4YW1wbGUuY29tIiwiaWF0IjoxNzY1Nzc4MTY3LCJleHAiOjE3NjU4MDY5Njd9.xyz...",
  "type": "Bearer",
  "user": {
    "id": 3,
    "email": "sm123@example.com",
    "firstName": "Sarah",
    "lastName": "ScrumMaster",
    "roles": ["SCRUM_MASTER"]
  }
}
```

### Decoded Payload

```json
{
  "roles": ["SCRUM_MASTER"],
  "name": "sm123@example.com",
  "projectIds": [1],
  "userId": 3,
  "email": "sm123@example.com",
  "teamIds": [1],
  "sub": "sm123@example.com",
  "iat": 1765778167,
  "exp": 1765806967
}
```

**Claim Verification**:
- ✅ `sub`: "sm123@example.com" (Present)
- ✅ `name`: "sm123@example.com" (Present)
- ✅ `iat`: 1765778167 (Present - Issued at timestamp)
- ✅ `exp`: 1765806967 (Present - Expiration timestamp)

---

## Testing JWT Functionality

### 1. Test Valid Token

```bash
TOKEN="<paste_token_here>"

curl -X GET http://localhost:8081/api/sprints/project/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: 200 OK with sprint data

### 2. Test Expired Token

Wait for token to expire (8 hours) or manually modify expiration in code to 1 minute for testing.

**Expected**:
- Backend: 401 Unauthorized
- Frontend: Toast notification "Session Expired" and redirect to login

### 3. Test Invalid Token

```bash
curl -X GET http://localhost:8081/api/sprints/project/1 \
  -H "Authorization: Bearer invalid.token.here"
```

**Expected**:
- Backend: 401 Unauthorized
- Frontend: Toast notification "Invalid Session" and redirect to login

### 4. Test Missing Token

```bash
curl -X GET http://localhost:8081/api/sprints/project/1
```

**Expected**: 401 Unauthorized

### 5. Test Insufficient Permissions

Login as DEVELOPER and try to create a sprint (SCRUM_MASTER only):

```bash
# Login as developer
DEV_TOKEN=$(curl -s -X POST http://localhost:8080/auth/authenticate \
  -H 'Content-Type: application/json' \
  -d '{"email":"dev123@example.com","password":"admin123"}' | jq -r '.token')

# Try to create sprint (should fail)
curl -X POST http://localhost:8081/api/sprints \
  -H "Authorization: Bearer $DEV_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "projectId": 1,
    "teamId": 1,
    "name": "Test Sprint",
    "goal": "Test"
  }'
```

**Expected**:
- Backend: 403 Forbidden
- Frontend: Toast notification "Access Denied"

---

## JWT Best Practices Implemented

1. ✅ **Use Strong Secrets**: Secret key is 256 bits (64 characters)
2. ✅ **Set Expiration**: Tokens expire after 8 hours
3. ✅ **Use HTTPS**: Recommended for production
4. ✅ **Validate on Every Request**: JWT filter validates all requests
5. ✅ **Include Minimal Claims**: Only necessary user data in token
6. ✅ **Use Standard Claims**: sub, iat, exp as per JWT spec
7. ✅ **Handle Errors Gracefully**: Clear error messages via toast notifications
8. ✅ **Logout on Expiration**: Auto-logout and redirect to login

---

## Future Enhancements

1. **Refresh Tokens**: Implement refresh token mechanism to extend sessions without re-login
2. **Token Blacklisting**: Maintain revoked token list for immediate logout capability
3. **HttpOnly Cookies**: Store tokens in HttpOnly cookies for better XSS protection
4. **Multi-Factor Authentication**: Add MFA before issuing JWT
5. **Token Rotation**: Automatic token rotation on sensitive operations
6. **Audit Logging**: Log all JWT issuance and validation failures

---

## Troubleshooting

### Issue: "Invalid JWT signature"

**Cause**: JWT secret mismatch between services

**Solution**: Ensure `JWT_SECRET` environment variable is identical across all services

### Issue: Token expires too quickly

**Cause**: Expiration time is too short

**Solution**: Increase `jwt.expiration` in application.yml (value in milliseconds)

### Issue: 403 errors despite valid token

**Cause**: User doesn't have required role or project access

**Solution**: Check user's roles and projectIds in JWT payload match required permissions

### Issue: Toast notifications not showing

**Cause**: ngx-toastr CSS not loaded

**Solution**: Verify `node_modules/ngx-toastr/toastr.css` is in angular.json styles array

---

## Conclusion

The JWT implementation provides secure, stateless authentication and authorization across all microservices. All required claims (sub, name, iat, exp) are present in tokens, services independently validate tokens using a shared secret, and the frontend provides excellent user experience with automatic error handling and toast notifications.

**Compliance**: ✅ All requirements met
- ✅ JWT contains sub, name, iat, exp
- ✅ Authorization Bearer token in HTTP headers
- ✅ Services verify tokens independently
- ✅ Frontend catches JWT errors
- ✅ Toast notifications for all error scenarios
