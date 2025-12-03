# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Scrum Management Platform** built as a microservices architecture with Spring Boot, NestJS, Angular, Apache Kafka, and Nginx. The system is designed to be fully Dockerized and Kubernetes-ready.

### Core Principles

- **No public registration** - All user accounts are created by Organization Admin only
- **Four distinct roles**: Organization Admin, Product Owner, Scrum Master, Developer
- **Multi-tenant** with team-based access control
- **Event-driven architecture** using Kafka for inter-service communication
- **Real-time collaboration** via WebSockets

## Repository Structure

```
/architecture-docs/        # Comprehensive system architecture documentation
/backend/
  identity-service/        # Spring Boot - User, team, project, auth (JWT)
  scrum-core-service/      # Spring Boot - Backlog, sprints, tasks, impediments
  collaboration-service/   # NestJS - Comments, notifications, WebSockets
  reporting-service/       # NestJS - Analytics, burndown, velocity charts
/frontend/
  admin-portal/            # Angular - Admin management interface
  team-portal/             # Angular - Scrum team workspace
/infrastructure/
  nginx/                   # Reverse proxy and API gateway configs
  kafka/                   # Kafka configuration
  postgres/                # Database init scripts
  monitoring/              # Observability stack (Prometheus, Grafana)
/deploy/
  docker-compose.yml       # Docker orchestration
  k8s/                     # Kubernetes manifests (future)
```

## Technology Stack

### Backend Services

**Spring Boot Services** (Java 21, Spring Boot 4.0.0):
- `identity-service` - Port 8080
- `scrum-core-service` - Port 8081

**NestJS Services** (Node.js, TypeScript):
- `collaboration-service` - WebSocket + REST
- `reporting-service` - Analytics APIs

### Frontend Applications

**Angular Applications**:
- `admin-portal` - Organization admin interface at `/admin`
- `team-portal` - Scrum team workspace at `/app`

### Infrastructure

- **API Gateway**: Nginx (reverse proxy + static file serving)
- **Message Broker**: Apache Kafka + Zookeeper
- **Databases**: PostgreSQL (one isolated DB per service)
- **Observability**: Prometheus, Grafana, centralized logging

## Build Commands

### Spring Boot Services

```bash
# Build identity service
cd backend/identity-service
mvn clean package

# Build scrum core service
cd backend/scrum-core-service
mvn clean package

# Run locally (development)
mvn spring-boot:run

# Run tests
mvn test

# Run integration tests
mvn verify
```

### NestJS Services

```bash
# Build collaboration service
cd backend/collaboration-service
npm install
npm run build

# Build reporting service
cd backend/reporting-service
npm install
npm run build

# Run locally (development)
npm run start:dev

# Run tests
npm run test

# Run e2e tests
npm run test:e2e
```

### Angular Applications

```bash
# Build admin portal
cd frontend/admin-portal
npm install
npm run build

# Build team portal
cd frontend/team-portal
npm install
npm run build

# Run locally (development)
ng serve

# Run tests
ng test

# Run e2e tests
ng e2e
```

### Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Rebuild specific service
docker-compose build [service-name]
```

## High-Level Architecture

### Service Responsibilities

**Identity & Organization Service** (Spring Boot):
- User management (admin-created accounts only)
- JWT authentication (login only, no registration)
- Four-role system: ORGANIZATION_ADMIN, PRODUCT_OWNER, SCRUM_MASTER, DEVELOPER
- Team structure (1 PO + 1 SM + N Developers)
- Project assignments
- User profiles and preferences

**Scrum Core Service** (Spring Boot):
- Product backlog (stories, epics, bugs, technical tasks)
- Sprint lifecycle management
- Task tracking with status workflow (To Do → In Progress → Review → Done)
- Impediment management
- Scrum event documentation
- Role-based item creation (PO: stories/epics, Dev: bugs/tech tasks)

**Collaboration & Notifications Service** (NestJS):
- Threaded comments on all entities
- Activity logging for audit trail
- In-app notifications
- WebSocket real-time updates (task changes, sprint events)
- WebSocket rooms per project/sprint

**Reporting & Analytics Service** (NestJS):
- Burndown charts (daily sprint progress)
- Velocity tracking (team performance)
- Cumulative Flow Diagrams (workflow bottlenecks)
- Sprint summaries
- Org-wide dashboards

### API Gateway Routing (Nginx)

```
/api/auth, /api/users, /api/teams, /api/projects → Identity Service
/api/backlog, /api/sprints, /api/tasks → Scrum Core Service
/api/comments, /api/notifications, /api/activity → Collaboration Service
/api/reports → Reporting Service
/admin → Admin Portal (Angular static files)
/app → Team Portal (Angular static files)
/ws/** → WebSocket proxy to Collaboration Service
```

### Event-Driven Communication

**Kafka Topics**:

From Identity Service:
- `org.user-created`, `org.user-updated`, `org.user-disabled`
- `org.team-created`, `org.team-updated`
- `org.project-created`, `org.project-assigned`

From Scrum Core Service:
- `scrum.backlog-item-created`, `scrum.backlog-item-updated`, `scrum.backlog-item-estimated`
- `scrum.sprint-created`, `scrum.sprint-started`, `scrum.sprint-completed`
- `scrum.task-created`, `scrum.task-status-changed`
- `scrum.impediment-reported`, `scrum.impediment-resolved`

Consumers:
- **Collaboration Service**: Consumes all scrum.* events for activity logs and notifications
- **Reporting Service**: Consumes all scrum.* events for metrics calculation

## Database Schemas

Each microservice has an isolated PostgreSQL database:

**identity_db**: users, roles, user_roles, teams, team_members, projects
**scrum_core_db**: product_backlog_items, sprints, sprint_backlog_items, tasks, impediments, scrum_events, definition_of_done
**collaboration_db**: comments, activity_logs, notifications
**reporting_db**: sprint_metrics, daily_burndown, cumulative_flow, team_velocity

Database migrations:
- Spring Boot services use Flyway/Liquibase
- NestJS services use TypeORM migrations

## Authorization Model

### Role Definitions

1. **ORGANIZATION_ADMIN** - System-level admin (not a Scrum role)
   - Full system access
   - User/team/project management
   - Org-wide analytics

2. **PRODUCT_OWNER** - Scrum role
   - Create/edit stories and epics
   - Prioritize backlog
   - Define sprint goals and acceptance criteria

3. **SCRUM_MASTER** - Scrum role
   - Start/end sprints
   - Manage impediments
   - Facilitate Scrum events

4. **DEVELOPER** - Scrum role
   - Create bugs and technical tasks
   - Update task status
   - Self-assign work

### Permission Matrix

| Action | Admin | PO | SM | Dev |
|--------|-------|----|----|-----|
| Create users/teams/projects | ✔️ | ❌ | ❌ | ❌ |
| Create stories/epics | ✔️ | ✔️ | ❌ | ❌ |
| Create bugs/tech tasks | ✔️ | ⚠️ | ⚠️ | ✔️ |
| Prioritize backlog | ✔️ | ✔️ | ❌ | ❌ |
| Start/end sprints | ✔️ | ⚠️ | ✔️ | ❌ |
| Manage impediments | ✔️ | ⚠️ | ✔️ | ⚠️ |
| Update task status | ✔️ | ✔️ | ✔️ | ✔️ |

Legend: ✔️ = Full access, ❌ = No access, ⚠️ = Limited/conditional access

## Security Implementation

**Authentication**:
- JWT-based with 8-hour expiration
- Issued by Identity Service on POST /auth/login
- BCrypt password hashing (strength 10-12)
- No public registration or password reset UI

**Authorization**:
- Spring Security with `@PreAuthorize` annotations
- NestJS with `@UseGuards` and role decorators
- JWT includes: userId, roles[], teamIds[], projectIds[]
- Resource-level checks (user can only access their teams/projects)

**Environment Variables** (required for all services):
```
DB_URL, DB_USERNAME, DB_PASSWORD
KAFKA_BOOTSTRAP_SERVERS
JWT_SECRET, JWT_EXPIRATION
SERVER_PORT
IDENTITY_SERVICE_URL (for cross-service auth validation)
```

## Development Guidelines

### When Adding New Features

1. **Identify service boundary**: Determine which microservice owns the feature
2. **Define data model**: Add entities/tables with proper indexes
3. **Create migrations**: Flyway (Spring) or TypeORM (NestJS)
4. **Implement authorization**: Add role-based access control
5. **Publish events**: If state changes, publish to Kafka
6. **Update consumers**: Collaboration/Reporting may need to consume new events
7. **Update API docs**: Add OpenAPI/Swagger annotations
8. **Write tests**: Unit + integration tests

### Code Patterns

**Spring Boot Controllers**:
```java
@RestController
@RequestMapping("/api/backlog-items")
@PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'ORGANIZATION_ADMIN')")
public class BacklogItemController {
    // Role-based authorization on controller or method level
}
```

**NestJS Controllers**:
```typescript
@Controller('comments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentsController {
    @Roles('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER')
    @Post()
    async createComment(@Body() dto: CreateCommentDto) {
        // Implementation
    }
}
```

**Kafka Event Publishing**:
```java
// Spring Boot
kafkaTemplate.send("scrum.task-status-changed", event);
```

```typescript
// NestJS
this.kafkaClient.emit('scrum.task-status-changed', event);
```

### Database Considerations

- Use BIGSERIAL for primary keys
- Add indexes for foreign keys and frequently queried columns
- Use JSONB for flexible fields (preferences, event outcomes)
- Include audit fields: created_at, updated_at, created_by
- Use soft deletes (deleted_at) where appropriate

### WebSocket Implementation

WebSocket namespaces/rooms in Collaboration Service:
- `/ws/projects/{projectId}` - Project-level updates
- `/ws/sprints/{sprintId}` - Sprint board real-time sync

Events pushed: task.status.changed, comment.added, sprint.started, sprint.ended

## Current Project Status

**Implemented**:
- Project structure and monorepo layout
- Basic Spring Boot service scaffolds (identity-service, scrum-core-service)
- Maven configurations with Spring Boot 4.0.0 and Java 21
- Architecture documentation (comprehensive design in architecture-docs/architecture.md)

**To Be Implemented** (based on architecture.md):
- Complete entity models and database schemas
- REST API endpoints with role-based authorization
- Kafka integration (producers and consumers)
- NestJS services (collaboration, reporting)
- Angular frontends (admin portal, team portal)
- Nginx configuration
- Docker Compose orchestration
- Database migrations
- WebSocket real-time updates
- OpenAPI/Swagger documentation

## Key References

- **Complete architecture**: See `architecture-docs/architecture.md` for exhaustive system design
- **Database schemas**: Detailed table definitions in architecture.md sections 8.5
- **API specifications**: architecture.md sections 3-4 for endpoint definitions
- **Authorization rules**: architecture.md section 6 for complete RBAC matrix

## Initial Setup (Default Credentials)

After first deployment with docker-compose, a default admin account will be seeded:
- Email: admin@example.com
- Password: admin123
- Role: ORGANIZATION_ADMIN

Access points after deployment:
- Admin Portal: http://localhost/admin
- Team Portal: http://localhost/app
- API Gateway: http://localhost/api
