# CI/CD Implementation Documentation

## Assignment Overview

This document describes the implementation of a Continuous Integration/Continuous Deployment (CI/CD) pipeline for the Scrum Management Platform, including automated testing and code coverage reporting.

## Implementation Summary

### 1. Test Suite Creation (30% of grade)

#### Backend Tests (Spring Boot/JUnit) - 15 Tests Total

**`JwtUtilTest.java`** - 10 comprehensive JWT utility tests:
- `testGenerateToken_ShouldCreateValidToken()` - Validates JWT token structure
- `testExtractEmail_ShouldReturnCorrectEmail()` - Tests email claim extraction
- `testExtractUserId_ShouldReturnCorrectUserId()` - Tests user ID extraction
- `testExtractRoles_ShouldReturnCorrectRoles()` - Validates role claims
- `testValidateToken_ShouldReturnTrueForValidToken()` - Token validation
- `testValidateToken_ShouldReturnFalseForWrongEmail()` - Invalid token detection
- `testIsTokenExpired_ShouldReturnFalseForNewToken()` - Expiration checking
- `testExtractAllClaims_ShouldContainProjectIds()` - Project ID claims
- `testExtractAllClaims_ShouldContainTeamIds()` - Team ID claims
- `testGenerateToken_ShouldIncludeUserDetails()` - User detail validation

**`AuthServiceTest.java`** - 5 authentication service tests:
- `testLogin_Success()` - Successful login flow
- `testLogin_UserNotFound()` - Failed login handling
- `testGetCurrentUser_Success()` - User retrieval
- `testGetCurrentUser_UserNotFound()` - User not found error
- `testLogin_UpdatesLastLogin()` - Last login timestamp update

Location: `/backend/identity-service/src/test/java/com/example/identityservice/`

#### Frontend Tests (Angular/Jasmine) - 21 Tests Total

**`auth.service.spec.ts`** - 11 authentication service tests:
- Service creation validation
- Login flow with HTTP mocking
- Token storage in localStorage
- Logout and data clearing
- Authentication state checking
- Token retrieval
- Role-based authorization checks
- Admin role verification
- Observable stream testing

**`project-context.service.spec.ts`** - 10 project context tests:
- Service initialization
- Project list management
- Auto-selection of first project
- Project selection and localStorage persistence
- Project restoration from localStorage
- Context clearing
- Empty project list handling
- Project validity checks

Location: `/frontend/team-portal/src/app/services/`

**Total Tests: 36 tests** (exceeds minimum requirement of 20)

### 2. GitHub Actions Workflow (40% of grade)

Created `.github/workflows/ci.yml` with four jobs:

#### Job 1: Backend Tests & Coverage
- **Environment**: Ubuntu latest with JDK 21
- **Steps**:
  1. Checkout code
  2. Set up Java 21 with Maven caching
  3. Run identity-service tests (`mvn clean test`)
  4. Generate JaCoCo coverage report (`mvn jacoco:report`)
  5. Upload coverage artifacts (30-day retention)
  6. Display coverage summary

#### Job 2: Frontend Team Portal Tests & Coverage
- **Environment**: Ubuntu latest with Node.js 20
- **Steps**:
  1. Checkout code
  2. Set up Node.js with npm caching
  3. Install dependencies (`npm ci`)
  4. Run tests with coverage (`npm run test -- --no-watch --code-coverage --browsers=ChromeHeadless`)
  5. Upload coverage artifacts (30-day retention)
  6. Display coverage summary

#### Job 3: Frontend Admin Portal Tests & Coverage
- **Environment**: Ubuntu latest with Node.js 20
- **Steps**: Same as Team Portal (separate job for parallel execution)

#### Job 4: Test Summary
- **Depends on**: All three test jobs
- **Purpose**: Aggregates results and displays workflow summary
- **Always runs**: Even if previous jobs fail
- **Output**: Formatted GitHub Step Summary with test results and artifact links

**Workflow Triggers**:
- Push to `main`, `develop`, `feature/**` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

### 3. Code Coverage Artifacts (30% of grade)

#### Backend Coverage (JaCoCo)

**Configuration** (`pom.xml`):
```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <id>prepare-agent</id>
            <goals><goal>prepare-agent</goal></goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals><goal>report</goal></goals>
        </execution>
        <execution>
            <id>jacoco-check</id>
            <goals><goal>check</goal></goals>
            <configuration>
                <rules>
                    <rule>
                        <element>PACKAGE</element>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.50</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

**Artifact Details**:
- **Name**: `backend-coverage-report`
- **Location**: `backend/identity-service/target/site/jacoco/`
- **Contents**: HTML coverage reports, XML/CSV data
- **Retention**: 30 days
- **Minimum Coverage**: 50% line coverage enforced

#### Frontend Coverage (Karma/Istanbul)

**Configuration** (`angular.json`):
```json
{
  "test": {
    "builder": "@angular-devkit/build-angular:karma",
    "options": {
      "codeCoverage": true,
      "browsers": "ChromeHeadless",
      ...
    }
  }
}
```

**Artifacts**:
1. **team-portal-coverage-report**
   - Location: `frontend/team-portal/coverage/`
   - Retention: 30 days

2. **admin-portal-coverage-report**
   - Location: `frontend/admin-portal/coverage/`
   - Retention: 30 days

**Coverage Report Format**: HTML with lcov data

## Running Tests Locally

### Backend Tests

```bash
cd backend/identity-service

# Run all tests
mvn clean test

# Run specific test class
mvn test -Dtest=JwtUtilTest

# Generate coverage report
mvn test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

### Frontend Tests

```bash
cd frontend/team-portal

# Install dependencies
npm install

# Run tests once
npm test -- --no-watch --code-coverage

# Run tests in watch mode
npm test

# View coverage report
open coverage/team-portal/index.html
```

## CI/CD Pipeline Features

1. **Parallel Execution**: Frontend and backend tests run simultaneously
2. **Caching**: Maven and npm dependencies cached for faster builds
3. **Artifact Persistence**: Coverage reports stored for 30 days
4. **Fail-Fast**: Pipeline stops on first failure
5. **Summary Reports**: Aggregated results in GitHub UI
6. **Multi-Branch Support**: Runs on feature branches and PRs
7. **Manual Trigger**: Can be run on-demand via GitHub UI

## Viewing Test Results

After pushing code to GitHub:

1. **Navigate to**: Repository → Actions tab
2. **Select workflow run**: Click on the CI/CD Pipeline run
3. **View job logs**: Click individual jobs to see detailed output
4. **Download artifacts**: Scroll to bottom → Artifacts section
5. **Extract and view**: Download coverage reports and open `index.html`

## Test Coverage Summary

| Component | Tests | Status |
|-----------|-------|--------|
| Backend JwtUtil | 10 | ✅ Passing |
| Backend AuthService | 5 | ✅ Passing |
| Frontend AuthService | 11 | ✅ Ready |
| Frontend ProjectContext | 10 | ✅ Ready |
| **Total** | **36** | **Exceeds minimum** |

## Technology Stack

- **Backend Testing**: JUnit 5, Mockito, Spring Test
- **Frontend Testing**: Jasmine, Karma, Angular Testing Library
- **Coverage Tools**: JaCoCo (Java), Istanbul (JavaScript)
- **CI/CD Platform**: GitHub Actions
- **Build Tools**: Maven 3, npm/Angular CLI

## File Changes Summary

### Created Files
1. `/backend/identity-service/src/test/java/com/example/identityservice/security/JwtUtilTest.java`
2. `/backend/identity-service/src/test/java/com/example/identityservice/service/AuthServiceTest.java`
3. `/frontend/team-portal/src/app/services/auth.service.spec.ts`
4. `/frontend/team-portal/src/app/services/project-context.service.spec.ts`
5. `/.github/workflows/ci.yml`
6. `/CI_CD_IMPLEMENTATION.md` (this file)

### Modified Files
1. `/backend/identity-service/pom.xml` - Added JaCoCo plugin
2. `/frontend/team-portal/angular.json` - Enabled code coverage
3. `/frontend/admin-portal/angular.json` - Enabled code coverage

## Assessment Criteria Compliance

✅ **Tests (30%)**: 36 tests created (16 above minimum requirement)
✅ **GitHub Actions (40%)**: Complete workflow with 4 jobs, parallel execution, caching
✅ **Artifacts (30%)**: 3 coverage reports uploaded with 30-day retention

## Next Steps

1. Push code to GitHub repository
2. Verify workflow executes successfully
3. Download and review coverage reports
4. Optionally add badge to README:
   ```markdown
   ![CI/CD](https://github.com/username/repo/workflows/CI%2FCD%20Pipeline/badge.svg)
   ```

## Notes

- Tests are independent and do not require database connections (unit tests)
- Coverage reports include line, branch, and method coverage
- Workflow can be extended with deployment steps in the future
- ChromeHeadless browser used for frontend tests (CI-friendly)
