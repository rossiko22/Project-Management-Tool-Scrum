# 🚀 QUICK START: Fix Authentication

## Current Situation

✅ **Good News**: The database is empty - migrations haven't run yet
✅ **Code Fixed**: BCrypt format changed from `$2b$` to `$2a$`
✅ **Beans Fixed**: Removed duplicate PasswordEncoder definitions

---

## What to Do Now

### Option 1: Fresh Start (Recommended) ⭐

Run this single command to rebuild everything with fixed authentication:

```bash
cd /home/unknown/Desktop/Proekt
./reset-databases.sh
```

This will:
1. ✅ Stop all services
2. ✅ Clean database volumes
3. ✅ Rebuild Java services with fixed code
4. ✅ Start services (migrations run automatically with `$2a$` hashes)
5. ✅ Verify migrations completed

**Time**: ~3-5 minutes

---

### Option 2: Manual Rebuild

If you prefer step-by-step:

```bash
cd /home/unknown/Desktop/Proekt

# 1. Stop services
docker compose down

# 2. Rebuild identity service
cd backend/identity-service
mvn clean package -DskipTests
cd ../..

# 3. Rebuild scrum-core service
cd backend/scrum-core-service
mvn clean package -DskipTests
cd ../..

# 4. Start everything (migrations auto-run)
docker compose up -d

# 5. Wait for startup
sleep 15

# 6. Verify
./verify-auth.sh
```

---

## What Was Fixed

### 1. Removed Duplicate Bean Conflict

**Before** (2 beans causing potential conflict):
```java
// ApplicationConfig.java
@Bean(name = "myPasswordEncoder")
public PasswordEncoder passwordEncoder() { ... }

// PasswordEncoderConfig.java
@Bean
public PasswordEncoder passwordEncoder() { ... }
```

**After** (single bean):
```java
// Only in PasswordEncoderConfig.java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

### 2. Fixed BCrypt Hash Format

**Before** (`$2b$` - compatibility issues):
```sql
INSERT INTO users (email, password_hash, ...)
VALUES ('po123@example.com', '$2b$10$yGRlnkVfSm2N39r01a0Aoe9GG1IzHkbu./KapYGc5UuNTSZIFhoHm', ...);
```

**After** (`$2a$` - Spring Security standard):
```sql
INSERT INTO users (email, password_hash, ...)
VALUES ('po123@example.com', '$2a$10$yGRlnkVfSm2N39r01a0Aoe9GG1IzHkbu./KapYGc5UuNTSZIFhoHm', ...);
```

### 3. Simplified Dependency Injection

**Before**:
```java
@Qualifier("myPasswordEncoder")
private final PasswordEncoder passwordEncoder;
```

**After**:
```java
private final PasswordEncoder passwordEncoder;
```

---

## Verification

After running `reset-databases.sh`, verify authentication works:

```bash
./verify-auth.sh
```

Or test manually:

```bash
# Test Product Owner login
curl -X POST http://localhost/api/identity/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"po123@example.com","password":"admin123"}'
```

**Expected**: Response with `token`, `type: "Bearer"`, and user details
**If fails**: Check logs with `docker compose logs identity-service`

---

## Test Credentials

All users have password: **`admin123`**

| Email | Role | Can Login After Fix? |
|-------|------|---------------------|
| `po123@example.com` | Product Owner | ✅ Yes |
| `sm123@example.com` | Scrum Master | ✅ Yes |
| `dev123@example.com` | Developer | ✅ Yes |
| `admin@example.com` | Org Admin | ✅ Yes |

---

## Troubleshooting

### If reset-databases.sh fails:

```bash
# Check what's running
docker compose ps

# View logs
docker compose logs identity-service
docker compose logs scrum-core-service

# Check database
docker exec identity-db psql -U postgres -d identity_db -c "\dt"
```

### If authentication still fails:

1. **Check password hash format in database**:
   ```bash
   docker exec identity-db psql -U postgres -d identity_db \
     -c "SELECT email, substring(password_hash, 1, 10) FROM users LIMIT 1;"
   ```
   Should show: `$2a$10$...` ✅
   Not: `$2b$10$...` ❌

2. **Check if migrations ran**:
   ```bash
   docker exec identity-db psql -U postgres -d identity_db \
     -c "SELECT * FROM flyway_schema_history;"
   ```
   Should show V1 and V2 migrations with `success = t`

3. **Check service logs for errors**:
   ```bash
   docker compose logs identity-service | grep -i error
   ```

---

## Files Modified

✅ `/backend/identity-service/src/main/java/com/example/identityservice/config/ApplicationConfig.java`
✅ `/backend/identity-service/src/main/java/com/example/identityservice/security/CustomAuthenticationProvider.java`
✅ `/backend/identity-service/src/main/resources/db/migration/V1__init_schema.sql`
✅ `/backend/identity-service/src/main/resources/db/migration/V2__add_seed_users_and_project.sql`

---

## Next Steps After Authentication Works

1. ✅ Verify you can log in as all 3 roles
2. ✅ Test the Scrum permission changes we implemented earlier
3. ✅ Build and test the frontend

---

**Ready? Run the fix script now:**

```bash
cd /home/unknown/Desktop/Proekt
./reset-databases.sh
```

⏱️ **ETA**: 3-5 minutes to complete rebuild and migration
