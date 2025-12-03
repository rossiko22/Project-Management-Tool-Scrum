# System Build Prompt – Scrum Platform (Kafka + Nginx + Microservices)

You are an experienced full-stack / DevOps engineering agent.

Your task is to **design and implement** a fully Dockerized Scrum Management Platform with **Spring Boot**, **NestJS**, **Angular**, **Apache Kafka**, and **Nginx** as a reverse proxy/API gateway.

Follow the steps below carefully and incrementally. Every component must be **containerized** and runnable via **docker-compose** (and be ready for Kubernetes later).

---

## 0. High-Level Architecture Overview

### 0.1 System Purpose

Build a multi-tenant Scrum management system with:

- **No public registration** - Admin creates all user accounts
- Identity & organization management (users, teams, projects)
- **Four distinct roles**: Organization Admin, Product Owner, Scrum Master, Developers
- Scrum core engine (backlog, sprints, tasks, impediments, Scrum events)
- Collaboration (comments, activity logging, notifications, WebSockets)
- Reporting & analytics (burndown, velocity, cumulative flow, summaries)
- Two Angular frontends:
  - **Admin Portal** - For Organization Admins (user/team/project management)
  - **Team Portal** - For Scrum roles (PO, SM, Developers)

### 0.2 High-Level Layout

Overall architecture:

- **API Gateway / Reverse Proxy:** Nginx
- **Backend microservices (Dockerized):**
  1. Identity & Organization Service (Spring Boot)
  2. Scrum Core Service (Spring Boot)
  3. Collaboration & Notifications Service (NestJS)
  4. Reporting & Analytics Service (NestJS)
- **Frontends (Dockerized Angular apps):**
  5. Admin Portal (Angular)
  6. Team Portal (Angular)
- **Shared infrastructure (Dockerized):**
  - Apache Kafka (+ Zookeeper / KRaft)
  - Nginx as reverse proxy/API gateway
  - PostgreSQL instances (one DB per microservice)
  - Service discovery/config (either Spring Cloud Eureka + Config Server or leave room for Kubernetes-native discovery)
  - Centralized logging, metrics, tracing stack (e.g., Loki/Promtail + Grafana OR ELK, plus Prometheus + Grafana)
  - Optional Keycloak or in-service JWT issuance (Identity service) for auth

Architecture sketch:

```text
                 ┌───────────────────────────┐
                 │         NGINX             │
                 │  (Reverse Proxy / API GW) │
                 └───────────┬───────────────┘
                             │
         ┌───────────────────┴────────────────────┐
         │                                        │
         ▼                                        ▼
 ┌───────────────┐                         ┌───────────────┐
 │ Identity &     │   REST / JWT           │ Scrum Core     │
 │ Organization   │ <--------------------> │ Service        │
 │ Service        │                         │ (Spring Boot) │
 │ (Spring Boot)  │                         └───────────────┘
 └───────────────┘                                 │
        ▲                                          │ Kafka events
        │                                          ▼
        │                                 ┌───────────────────────┐
        │                                 │ Collaboration &        │
        │ REST / JWT                      │ Notifications Service  │
        │                                 │ (NestJS + WebSockets) │
        │                                 └───────────────────────┘
        │                                          │ Kafka events
        │                                          ▼
        │                                 ┌───────────────────────┐
        │                                 │ Reporting & Analytics │
        │                                 │ Service (NestJS)      │
        │                                 └───────────────────────┘
        │
        │
        │    Frontend (Angular apps) via Nginx
        │
        ▼
 ┌───────────────┐      ┌────────────────┐
 │ Admin Portal   │      │ Team Portal    │
 │ (Angular app 1)│      │ (Angular app 2)│
 └───────────────┘      └────────────────┘
```

---

## 1. Repository Structure & Shared Conventions

### Step 1.1 – Define Monorepo Structure

Create a monorepo structure similar to:

```
/architecture-docs/        # markdown docs (including this architecture)
/backend/
  identity-service/        # Spring Boot
  scrum-core-service/      # Spring Boot
  collaboration-service/   # NestJS
  reporting-service/       # NestJS
/frontend/
  admin-portal/            # Angular
  team-portal/             # Angular
/infrastructure/
  nginx/
    nginx.conf
  kafka/
    docker-compose or configuration
  postgres/
    init-scripts/
  monitoring/
    prometheus/
    grafana/
    logging-stack/
/deploy/
  docker-compose.yml
  k8s/                     # future: manifests or Helm charts
```

### Step 1.2 – Define Common Standards

- Use Docker for all deployable artifacts.
- Use environment variables for:
  - DB connection strings
  - Kafka bootstrap servers
  - JWT secret/keys
  - Service base URLs
- Use OpenAPI/Swagger for each backend service.

---

## 2. Shared Infrastructure – Kafka, Databases, Nginx

### Step 2.1 – Kafka Setup (Dockerized)

- Provision Kafka (+ Zookeeper or KRaft) via Docker.
- Expose internal hostname, e.g. `kafka:9092`.
- Create topics (or ensure auto-creation) for:
  - `scrum.backlog-item-created`
  - `scrum.task-status-changed`
  - `scrum.sprint-started`
  - `scrum.sprint-completed`
  - `org.user-updated`
  - Any other events required by collaboration and reporting.

### Step 2.2 – PostgreSQL Databases

For each microservice, create an isolated PostgreSQL database:

- `identity_db`
- `scrum_core_db`
- `collaboration_db`
- `reporting_db`

Each runs in its own container or shared Postgres container with isolated DBs. Apply migrations using Flyway/Liquibase (Spring) and TypeORM migrations (NestJS).

### Step 2.3 – Nginx as Reverse Proxy / API Gateway

Nginx must:

- Serve Angular apps as static files (two separate apps).
- Reverse-proxy API requests to backend services based on URL prefix.
- Optionally handle TLS termination in front of everything.

Example routing:

- `/api/auth`, `/api/users`, `/api/teams`, `/api/projects` → Identity Service
- `/api/backlog`, `/api/sprints`, `/api/tasks` → Scrum Core Service
- `/api/comments`, `/api/notifications`, `/api/activity` → Collaboration Service
- `/api/reports/**` → Reporting Service
- `/admin` → Admin Portal Angular app
- `/app` → Team Portal Angular app

Implement Nginx config with upstream blocks per service, using Docker service names.

---

## 3. Spring Boot Microservices

### 3.1 Identity & Organization Service (Spring Boot)

**Responsibility:**

User management, authentication, organization structure:

- User accounts (Admin-created only, no public registration)
- Authentication (login only, no password reset via UI)
- Four system roles: Organization Admin, Product Owner, Scrum Master, Developer
- Teams (1 PO + 1 SM + multiple Developers)
- Projects (assigned to teams)
- JWT issuance
- User profile management (pictures, bio, preferences)

**Main Entities:**

- **User:** 
  - Core: id, email, passwordHash, status (active/disabled)
  - Profile: profilePictureUrl, bio, firstName, lastName
  - Settings: preferences (JSON: theme, timezone, notifications)
  - Audit: createdAt, createdBy, lastLogin
  
- **Role:** 
  - OrganizationAdmin (system-level, not a Scrum role)
  - ProductOwner (Scrum role)
  - ScrumMaster (Scrum role)
  - Developer (Scrum role)
  
- **Team:** 
  - Core: id, name, description
  - Leadership: productOwnerId (FK to User), scrumMasterId (FK to User)
  - Members: team_members junction table (team_id, user_id, role)
  - Project: projectId (FK - if enforcing 1:1 team-to-project relationship)
  
- **Project:** 
  - Core: id, name, description, status
  - Assignment: teamId (FK to Team)
  - Configuration: defaultSprintLength (1-4 weeks), timezone
  - Audit: createdAt, createdBy
  
- **Permission / RBAC matrix:**
  - Organization Admin: full system access
  - Product Owner: backlog management, sprint goal setting
  - Scrum Master: sprint start/end, impediment tracking, event facilitation
  - Developer: task management, technical item creation

**APIs:**

**Authentication:**
- `POST /auth/login` – issue JWT (email + password only)
- `GET /auth/me` – current user profile and roles
- `POST /auth/logout` – invalidate token

**User Management (Admin Only):**
- `POST /users` – create user with initial password
- `GET /users` – list all users (with filters)
- `GET /users/{id}` – get user details
- `PATCH /users/{id}` – update user (enable/disable, assign roles)
- `DELETE /users/{id}` – soft delete user
- `PATCH /users/{id}/roles` – assign/remove Scrum roles

**User Profile (Self-Service):**
- `PATCH /me/profile` – update profile picture, bio
- `PATCH /me/password` – change own password
- `PATCH /me/preferences` – update UI theme, timezone, notification settings

**Team Management (Admin Only):**
- `POST /teams` – create team
- `GET /teams` – list all teams
- `GET /teams/{id}` – get team details with members
- `PATCH /teams/{id}` – update team details
- `POST /teams/{id}/members` – assign users to team
- `DELETE /teams/{id}/members/{userId}` – remove member
- `PATCH /teams/{id}/product-owner` – assign Product Owner
- `PATCH /teams/{id}/scrum-master` – assign Scrum Master

**Project Management (Admin Only):**
- `POST /projects` – create project
- `GET /projects` – list all projects
- `GET /projects/{id}` – get project details
- `PATCH /projects/{id}` – update project
- `PATCH /projects/{id}/team` – assign project to team
- `PATCH /projects/{id}/sprint-settings` – configure default sprint length

**Authorization Endpoints:**
- `GET /permissions/user/{userId}` – get user's effective permissions
- `GET /permissions/check` – validate if user can perform action

**Tech stack:**

- Spring Boot 3
- Spring Security with JWT (no OAuth/Keycloak initially)
- Spring Data JPA + PostgreSQL
- Flyway or Liquibase for migrations
- OpenAPI/Swagger for API documentation
- BCrypt for password hashing

**Kafka Integration:**

Publish events on relevant changes:
- `org.user-created` – when Admin creates a user
- `org.user-updated` – when user details or roles change
- `org.user-disabled` – when user is deactivated
- `org.team-created` – when team is formed
- `org.team-updated` – when team membership changes
- `org.project-created` – when project is created
- `org.project-assigned` – when project is assigned to team

Event payload should include: entityId, entityType, action, timestamp, performedBy, relevant IDs for correlation.

**Security & Authorization:**

Role-based access control (RBAC) enforced at service level:
- **Admin-only endpoints:** All user/team/project creation and assignment
- **Self-service endpoints:** Profile updates, password changes
- **Read access:** Users can view teams/projects they belong to
- JWT includes: userId, roles[], teamIds[], projectIds[]

**Dockerization:**

- Build fat JAR using Maven/Gradle
- Wrap in minimal JDK 17+ image (e.g., `eclipse-temurin:17-jre-alpine`)
- Externalize via environment variables:
  - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
  - `KAFKA_BOOTSTRAP_SERVERS`
  - `JWT_SECRET`, `JWT_EXPIRATION`
  - `SERVER_PORT` (default 8080)

### 3.2 Scrum Core Service (Spring Boot)

**Responsibility:**

Implements core Scrum workflow:

- Product backlog management (stories, epics, bugs, technical tasks)
- Sprint lifecycle (planning, execution, review, retrospective)
- Sprint backlog and task tracking
- Impediment management
- Scrum events documentation
- Status workflow enforcement (To Do → In Progress → Review → Done)
- Role-based backlog item creation and management

**Main Entities:**

- **ProductBacklogItem:**
  - Core: id, projectId, title, description
  - Type: STORY, EPIC, BUG, TECHNICAL_TASK
  - Estimation: storyPoints, priority, position (for ordering)
  - Status: BACKLOG, SPRINT_READY, IN_SPRINT, DONE
  - Ownership: createdBy, createdByRole (PO vs Developer)
  - Acceptance: acceptanceCriteria (text or JSON)
  - Audit: createdAt, updatedAt
  
- **Sprint:**
  - Core: id, projectId, name, goal
  - Timeline: startDate, endDate, length (in weeks)
  - Status: PLANNED, ACTIVE, COMPLETED, CANCELLED
  - Ownership: createdBy (should be Scrum Master)
  - Capacity: teamCapacity (story points)
  
- **SprintBacklogItem:**
  - Link: sprintId, backlogItemId
  - Planning: committedPoints, actualPoints
  - Status tracking: addedAt, completedAt
  
- **Task:**
  - Core: id, backlogItemId, title, description
  - Assignment: assigneeId (Developer)
  - Status: TO_DO, IN_PROGRESS, REVIEW, DONE
  - Estimation: estimatedHours, actualHours
  - Audit: createdAt, updatedAt, completedAt
  
- **Impediment:**
  - Core: id, sprintId, title, description
  - Status: OPEN, IN_PROGRESS, RESOLVED
  - Ownership: reportedBy, assignedTo (usually SM), resolvedBy
  - Tracking: reportedAt, resolvedAt
  
- **ScrumEvent:**
  - Core: id, sprintId, type (PLANNING, DAILY, REVIEW, RETROSPECTIVE)
  - Content: notes, outcomes, actionItems (JSON)
  - Participation: facilitatorId, attendees[]
  - Timing: scheduledAt, completedAt
  
- **DefinitionOfDone:**
  - Core: id, projectId, criteria (JSON array)
  - Version tracking: version, effectiveFrom
  
- **AcceptanceCriteria:**
  - Embedded in ProductBacklogItem or separate entity
  - Format: Given-When-Then or checklist

**APIs:**

**Backlog Management:**
- `GET /projects/{id}/backlog` – get entire product backlog (sorted by priority)
- `POST /projects/{id}/backlog-items` – create backlog item
  - **Authorization:** PO can create STORY/EPIC, Developers can create BUG/TECHNICAL_TASK
- `GET /backlog-items/{id}` – get item details
- `PATCH /backlog-items/{id}` – update item
  - **Authorization:** PO can edit all fields, Developers can edit only their own technical items
- `DELETE /backlog-items/{id}` – delete item (PO only)
- `PATCH /backlog-items/reorder` – reorder backlog (drag-and-drop) (PO only)
- `POST /backlog-items/{id}/estimate` – add/update story points

**Sprint Management:**
- `GET /projects/{id}/sprints` – list all sprints
- `POST /projects/{id}/sprints` – create new sprint (SM or PO)
- `GET /sprints/{id}` – get sprint details
- `PATCH /sprints/{id}` – update sprint details
- `POST /sprints/{id}/start` – start sprint (SM only)
- `POST /sprints/{id}/end` – end sprint (SM only)
- `POST /sprints/{id}/cancel` – cancel sprint (SM with PO approval)

**Sprint Backlog:**
- `GET /sprints/{id}/backlog` – get sprint backlog items
- `POST /sprints/{id}/backlog-items` – add item to sprint (during planning)
  - **Authorization:** Developers can self-assign, SM facilitates
- `DELETE /sprints/{id}/backlog-items/{itemId}` – remove from sprint (before sprint starts)
- `GET /sprints/{id}/board` – get Kanban board view (grouped by status)

**Task Management:**
- `POST /backlog-items/{id}/tasks` – create task
- `GET /tasks/{id}` – get task details
- `PATCH /tasks/{id}` – update task details
- `PATCH /tasks/{id}/status` – update task status (Developers only)
- `PATCH /tasks/{id}/assign` – assign task to developer
- `DELETE /tasks/{id}` – delete task

**Impediment Management:**
- `GET /sprints/{id}/impediments` – list sprint impediments
- `POST /sprints/{id}/impediments` – report impediment (any team member)
- `PATCH /impediments/{id}` – update impediment (SM primarily)
- `PATCH /impediments/{id}/resolve` – mark as resolved (SM)

**Scrum Events:**
- `POST /sprints/{id}/events` – document Scrum event
- `GET /sprints/{id}/events` – list sprint events
- `GET /sprints/{id}/events/{type}` – get specific event type (e.g., retrospective)

**Acceptance Criteria:**
- `POST /backlog-items/{id}/acceptance-criteria` – add criteria
- `PATCH /acceptance-criteria/{id}` – update criteria
- `PATCH /acceptance-criteria/{id}/check` – mark criterion as met

**Definition of Done:**
- `POST /projects/{id}/definition-of-done` – create/update DoD
- `GET /projects/{id}/definition-of-done` – get current DoD

**Kafka Integration:**

From Scrum Core, publish events to Kafka topics:

- `scrum.backlog-item-created` – payload: itemId, projectId, type, createdBy, title
- `scrum.backlog-item-updated` – payload: itemId, changedFields, updatedBy
- `scrum.backlog-item-estimated` – payload: itemId, storyPoints, estimatedBy (for analytics)
- `scrum.sprint-created` – payload: sprintId, projectId, startDate, endDate, goal
- `scrum.sprint-started` – payload: sprintId, startedBy, backlogItems[]
- `scrum.sprint-completed` – payload: sprintId, completedItems, velocity, outcomes
- `scrum.task-created` – payload: taskId, backlogItemId, title, assignee
- `scrum.task-status-changed` – payload: taskId, oldStatus, newStatus, changedBy, timestamp
- `scrum.impediment-reported` – payload: impedimentId, sprintId, reportedBy
- `scrum.impediment-resolved` – payload: impedimentId, resolvedBy, resolution

Define consistent event schemas with correlation IDs (projectId, sprintId, userId).

**Authorization Rules:**

Implement role-based authorization using JWT claims:

**Product Owner:**
- Create/edit/delete STORY and EPIC items
- Set priorities and reorder backlog
- Define acceptance criteria
- Set sprint goals
- Approve sprint completion

**Scrum Master:**
- Start/end sprints
- Manage impediments
- Facilitate Scrum events
- View all team activities
- Cannot modify backlog priorities

**Developers:**
- Create BUG and TECHNICAL_TASK items
- Add tasks to backlog items
- Update task status
- Self-assign work during sprint planning
- Estimate work (story points)
- Cannot reorder backlog or start/end sprints

**All Team Members:**
- View backlog and sprint boards
- Comment on items
- Report impediments
- Participate in estimation

**Dockerization:**

Same pattern as Identity service:
- Spring Boot fat JAR
- JDK 17+ minimal image
- Environment variables:
  - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
  - `KAFKA_BOOTSTRAP_SERVERS`
  - `IDENTITY_SERVICE_URL` (for role verification)
  - `SERVER_PORT` (default 8081)

---

## 4. NestJS Microservices

### 4.1 Collaboration & Notifications Service (NestJS)

**Responsibility:**

- Comments on backlog items, tasks, sprints
- Activity logs
- Notifications (email, in-app)
- WebSockets for real-time updates (e.g., Kanban board, notifications panel)

**Main Models:**

- **Comment:** id, authorId, entityType, entityId, content, timestamps
- **ActivityLog:** actor, action, entityType, entityId, timestamp
- **Notification:** recipientId, type, payload, read/unread
- **WebSocket channels** keyed by project/team/sprint

**APIs (REST):**

- `POST /comments`
- `GET /threads/{entityType}/{entityId}` – entire comment thread
- `GET /notifications` – current user's notifications
- `PATCH /notifications/{id}` – mark as read

**WebSockets:**

Use NestJS WebSocket gateway (e.g., Socket.IO).

Namespaces / rooms:

- `/ws/projects/{projectId}`
- `/ws/sprints/{sprintId}`

Push events on:

- Task status changes
- New comments
- Sprint start/end

**Kafka Integration:**

Consume events from Kafka topics produced by Scrum Core and Identity:

- `scrum.task-status-changed`
- `scrum.sprint-started`
- `scrum.sprint-completed`
- `org.user-updated`

On relevant events:

- Log activity
- Generate notifications
- Emit WebSocket events to connected clients

**Database:**

PostgreSQL (or MongoDB if better for threaded comments). Use TypeORM with migrations.

**Dockerization:**

Standard NestJS Dockerfile (build in Node, run with Node or dist-only image).

### 4.2 Reporting & Analytics Service (NestJS)

**Responsibility:**

- Burndown charts
- Velocity per team/project
- Cumulative flow diagrams
- Sprint summaries
- Org-wide dashboards

**Data Handling:**

- Maintain denormalized analytics tables optimized for querying.
- Snapshot relevant metrics from Kafka events.

**APIs:**

- `GET /reports/projects/{id}/burndown?sprintId=...`
- `GET /reports/projects/{id}/velocity`
- `GET /reports/teams/{id}/cfd`
- `GET /reports/org/summary`

**Kafka Integration:**

Consume events:

- `scrum.backlog-item-created`
- `scrum.backlog-item-estimated`
- `scrum.task-status-changed`
- `scrum.sprint-started`
- `scrum.sprint-completed`

Update analytics stores incrementally.

**Database:**

PostgreSQL or time-series extension (TimescaleDB) for reporting.

**Dockerization:**

Same NestJS pattern.

---

## 5. Angular Frontends

### 5.1 Admin Portal (Angular app #1)

**Audience:** Organization Admins only.

**Purpose:** Complete system administration for users, teams, projects, and organization-wide settings.

**Main Sections:**

**1. Dashboard:**
- Organization overview statistics
- Active users count
- Active teams and projects
- System health indicators
- Recent activity feed

**2. User Management:**
- **User List View:**
  - Searchable/filterable table (by name, email, role, status)
  - Columns: Name, Email, Roles, Teams, Status (Active/Disabled), Last Login
  - Actions: Edit, Disable/Enable, Delete
  
- **Create User:**
  - Form fields: Email, First Name, Last Name, Initial Password
  - Auto-generate password option
  - Send credentials via email (optional)
  
- **Edit User:**
  - Update user details
  - Assign/remove roles (checkboxes for PO, SM, Developer)
  - Enable/disable account
  - View user's activity history
  
- **Role Assignment:**
  - Multi-select role assignment
  - Role conflict validation (e.g., warn if same user is PO and SM on same team)

**3. Team Management:**
- **Team List View:**
  - Cards or table showing: Team Name, Project, PO, SM, Member Count
  - Quick actions: Edit, View Members, Delete
  
- **Create Team Wizard:**
  - Step 1: Team name and description
  - Step 2: Assign Product Owner (dropdown of users with PO role)
  - Step 3: Assign Scrum Master (dropdown of users with SM role)
  - Step 4: Add Developers (multi-select from users with Developer role)
  - Step 5: Review and confirm
  
- **Edit Team:**
  - Update team details
  - Reassign PO/SM
  - Add/remove members
  - View team's sprint history and metrics

**4. Project Management:**
- **Project List View:**
  - Cards showing: Project Name, Team, Status, Start Date, Active Sprints
  - Filters: Status (Active, On Hold, Completed), Team
  
- **Create Project:**
  - Form: Project Name, Description
  - Assign to team (dropdown)
  - Set default sprint length (1-4 weeks)
  - Set timezone
  - Define initial Definition of Done
  
- **Edit Project:**
  - Update project details
  - Reassign to different team
  - Modify sprint settings
  - Archive/close project

**5. Global Settings:**
- **Organization Settings:**
  - Company name and logo
  - Default sprint length (1-4 weeks)
  - Default timezone
  - Working hours configuration
  - Holiday calendar
  
- **System Preferences:**
  - Email notification templates
  - Default user roles on creation
  - Password policies (length, complexity)
  - Session timeout settings

**6. Org-level Dashboards & Reports:**
- **Team Performance:**
  - Velocity comparison across teams
  - Sprint completion rates
  - Story points delivered per team
  
- **Resource Utilization:**
  - Active users per team
  - User workload distribution
  - Team capacity planning
  
- **Project Health:**
  - Projects at risk (behind schedule)
  - Impediment trends
  - Bug vs feature ratio
  
- **System Analytics:**
  - Total sprints completed
  - Average sprint velocity
  - User activity metrics

**7. Access Control & Permissions:**
- **Role Configuration:**
  - View/edit role permissions matrix
  - Define what each role can access
  
- **Audit Log:**
  - View all admin actions
  - Filter by user, action type, date
  - Export audit trail

**UI/UX Patterns:**
- Material Design or Bootstrap-based theme
- Responsive design (desktop-first, mobile-friendly)
- Data tables with sorting, pagination, search
- Modal dialogs for create/edit forms
- Confirmation dialogs for destructive actions
- Toast notifications for success/error messages
- Breadcrumb navigation
- Dark mode support (via user preferences)

**Backend Connections via Nginx /api:**
- Identity Service (users, teams, projects, roles)
- Reporting & Analytics Service (org dashboards)
- Collaboration Service (audit logs, activity feeds)

**Security:**
- Route guards: Only users with OrganizationAdmin role can access
- JWT validation on every route
- Auto-logout on token expiration
- Re-authenticate for sensitive actions (e.g., user deletion)

**Dockerization:**
- Build Angular app using `ng build --prod`
- Output static files to `/dist/admin-portal`
- Serve via Nginx:
  - Location: `/admin` → serve from `/usr/share/nginx/html/admin`
  - SPA routing: try_files with fallback to index.html
- Separate container or same Nginx container as Team Portal

### 5.2 Team Portal (Angular app #2)

**Audience:** Product Owners, Scrum Masters, Developers (all Scrum roles).

**Purpose:** Day-to-day Scrum workflow execution, sprint management, collaboration, and reporting.

**Main Sections:**

**1. Project Dashboard (Landing Page):**
- **Current Sprint Summary:**
  - Sprint name and goal
  - Days remaining
  - Progress bar (completed vs total story points)
  - Burndown chart (mini preview)
  
- **Quick Stats:**
  - Tasks: To Do / In Progress / Review / Done
  - Team velocity (last 3 sprints)
  - Open impediments count
  - Upcoming Scrum events
  
- **Team Members:**
  - Avatar grid with names and current tasks
  - Who's working on what
  
- **Recent Activity:**
  - Latest comments
  - Status changes
  - New items added

**2. Product Backlog (PO primary, all can view):**
- **Backlog View:**
  - Sortable list of all backlog items
  - Drag-and-drop to reorder priority (PO only)
  - Filters: Type (Story, Epic, Bug, Tech Task), Status, Sprint, Assignee
  - Search by title/description
  
- **Backlog Item Card/Row:**
  - Title, Description (expandable)
  - Type badge, Priority, Story Points
  - Status indicator
  - Assignee avatar
  - Quick actions: Edit, Add to Sprint, Delete
  
- **Create Backlog Item:**
  - Form fields: Type, Title, Description, Acceptance Criteria
  - **PO can create:** Stories, Epics
  - **Developers can create:** Bugs, Technical Tasks
  - Add story points (estimation)
  - Set initial priority
  
- **Edit Backlog Item:**
  - Update all fields
  - Add/edit acceptance criteria (Given-When-Then format)
  - Add attachments or links
  - Comment thread (below form)
  
- **Estimation/Refinement Mode:**
  - Planning Poker UI (optional)
  - Team voting on story points
  - Consensus indicator

**3. Sprint Planning:**
- **Planning View:**
  - Left panel: Product backlog (filtered to ready items)
  - Right panel: Sprint backlog (items being added to sprint)
  - Drag-and-drop from backlog to sprint
  
- **Capacity Planning:**
  - Team capacity (story points) vs committed points
  - Visual indicator: Under/At/Over capacity
  - Developer availability (holidays, PTO)
  
- **Sprint Goal Definition:**
  - Text field for sprint goal (PO defines, team collaborates)
  - Link to related epics or features
  
- **Task Breakdown:**
  - For each story in sprint, add tasks
  - Estimate hours per task
  - Self-assign tasks (Developers)

**4. Sprint Board (Kanban) (All team members, active sprint):**
- **Board Columns:**
  - **To Do** → **In Progress** → **Review** → **Done**
  
- **Task Cards:**
  - Title, Story points (parent item)
  - Assignee avatar
  - Priority indicator
  - Quick view: hover for description
  - Click to open detail modal
  
- **Real-time Updates:**
  - WebSocket integration with Collaboration Service
  - Cards move automatically when team members update status
  - Presence indicators (who's viewing the board)
  
- **Drag-and-Drop:**
  - Developers drag tasks between columns
  - Status updates via drag = PATCH /tasks/{id}/status
  - Optimistic UI updates
  
- **Filters:**
  - By assignee
  - By story
  - By type (bug, task, etc.)
  
- **Swimlanes (optional):**
  - Group by story
  - Group by assignee
  - Group by priority

**5. Scrum Events (SM facilitates, all participate):**
- **Daily Scrum Notes:**
  - Quick form: What I did, What I'll do, Blockers
  - Timestamped entries per user
  - View team's daily notes
  
- **Sprint Planning:**
  - Document planning outcomes
  - Record sprint goal
  - Save sprint backlog snapshot
  
- **Sprint Review:**
  - Checklist of completed items
  - Demo notes per story
  - Stakeholder feedback (text fields)
  - PO acceptance checkboxes
  
- **Sprint Retrospective:**
  - Three columns: What went well / What didn't / Action items
  - Sticky note style UI
  - Team votes on top issues to address
  - Export retrospective report
  
- **Event History:**
  - List all past Scrum events
  - View notes and outcomes
  - Track action items from retros

**6. Impediments (SM manages, all can report):**
- **Impediment List:**
  - Table or cards: Title, Status, Reported By, Assigned To
  - Filters: Open, In Progress, Resolved
  
- **Report Impediment:**
  - Form: Title, Description, Impact level
  - Auto-assign to Scrum Master
  
- **Manage Impediment (SM):**
  - Update status
  - Add resolution notes
  - Mark as resolved
  - Link to related tasks/stories

**7. Reports & Analytics (All can view):**
- **Burndown Chart:**
  - Line chart: Planned vs Actual remaining story points
  - Daily granularity
  - Scope change indicator (if items added mid-sprint)
  
- **Velocity Chart:**
  - Bar chart: Story points per sprint (last 6-12 sprints)
  - Trend line
  - Average velocity
  
- **Cumulative Flow Diagram (CFD):**
  - Stacked area chart: To Do, In Progress, Review, Done over time
  - Identifies bottlenecks
  
- **Sprint Summary:**
  - Committed vs completed points
  - Stories completed vs carried over
  - Bug count
  - Impediments resolved
  
- **Team Performance:**
  - Cycle time per task
  - Lead time per story
  - Story completion rate

**8. Profile & Settings (Self-service):**
- **User Profile:**
  - Upload profile picture
  - Update bio/description
  - Change password
  
- **Preferences:**
  - UI theme (light/dark)
  - Timezone
  - Notification settings (email, in-app)
  - Language (if multi-language support)

**9. Notifications Panel:**
- **In-app Notifications:**
  - Bell icon with badge count
  - Dropdown list: Task assigned, Sprint started, Comment added, etc.
  - Mark as read/unread
  - "View all" link to full page
  
- **Notification Categories:**
  - Mentions (@username in comments)
  - Assignments
  - Status changes
  - Sprint events
  - Impediments

**Role-Specific UI Adaptations:**

**Product Owner sees:**
- "Create Story/Epic" button prominent
- Backlog reordering enabled
- Sprint goal editing
- Acceptance criteria management
- Cannot start/end sprints (unless configured otherwise)

**Scrum Master sees:**
- "Start Sprint" / "End Sprint" buttons
- Impediment management dashboard
- Scrum event facilitation tools
- Team capacity and workload view
- Cannot modify backlog priorities

**Developers see:**
- "Create Bug/Tech Task" button
- Task self-assignment
- Sprint board with drag-drop enabled for tasks
- Estimation input
- Cannot reorder backlog or start/end sprints

**UI/UX Patterns:**
- Angular Material or PrimeNG components
- Responsive design (mobile-friendly for daily scrums, board viewing)
- Real-time updates via WebSockets (Socket.IO client)
- Progressive Web App (PWA) features (optional)
- Drag-and-drop libraries (e.g., @angular/cdk/drag-drop)
- Charts: Chart.js or Recharts integration
- Toast notifications for real-time events
- Confirmation dialogs for critical actions
- Loading spinners and skeleton screens
- Dark mode toggle

**Backend Connections via Nginx /api:**
- Scrum Core Service (backlog, sprints, tasks, impediments)
- Collaboration & Notifications Service (comments, activity logs, WebSockets, notifications)
- Reporting & Analytics Service (charts, metrics)
- Identity Service (authentication, profile management)

**WebSocket Integration:**
- Connect to `/ws/projects/{projectId}` and `/ws/sprints/{sprintId}`
- Listen for events:
  - `task.status.changed`
  - `task.assigned`
  - `comment.added`
  - `sprint.started`
  - `sprint.ended`
  - `impediment.reported`
- Update UI in real-time without page refresh

**Security:**
- Route guards based on JWT roles
- PO-only routes: Backlog prioritization, Sprint goals
- SM-only routes: Sprint start/end, Impediment management dashboard
- Developer routes: Task updates
- All team members: View access to boards, reports
- Auto-logout on inactivity

**Dockerization:**
- Build Angular app using `ng build --prod`
- Output static files to `/dist/team-portal`
- Serve via Nginx:
  - Location: `/app` → serve from `/usr/share/nginx/html/app`
  - SPA routing: try_files with fallback to index.html
  - WebSocket proxying to Collaboration Service
- Separate container or same Nginx container as Admin Portal

---

## 6. Security & Auth

### Step 6.1 – JWT Auth

- Identity service issues JWT tokens on `POST /auth/login`.
- **No public registration** - all accounts created by Organization Admin
- **No password reset UI** - users change passwords via authenticated endpoint
- Tokens include:
  - `userId`
  - `email`
  - `roles[]` - array of role strings: `["ORGANIZATION_ADMIN"]`, `["PRODUCT_OWNER", "DEVELOPER"]`
  - `teamIds[]` - array of team IDs user belongs to
  - `projectIds[]` - array of project IDs user has access to
  - `orgId` - organization identifier (for future multi-tenancy)
  - `exp` - expiration timestamp
- Nginx passes `Authorization: Bearer <token>` header to all backend services.
- Token expiration: 8 hours (configurable)
- Refresh token flow (optional): separate refresh token for extended sessions

### Step 6.2 – Four System Roles

**Role Definitions:**

1. **ORGANIZATION_ADMIN**
   - System-level administrative role (not a Scrum role)
   - Represents IT, PMO, or HR authority
   - Full system access

2. **PRODUCT_OWNER**
   - Scrum role
   - Owns product backlog and priorities
   - Defines sprint goals

3. **SCRUM_MASTER**
   - Scrum role
   - Facilitates Scrum process
   - Manages impediments

4. **DEVELOPER**
   - Scrum role
   - Builds and delivers product
   - Self-organizes work

**Users can have multiple Scrum roles** (e.g., Developer + Scrum Master on different teams), but typically:
- Organization Admin is exclusive (not also PO/SM/Dev on teams)
- One person should not be both PO and SM on the same team

### Step 6.3 – Service-side Authorization

Within each service, implement role-based authorization:

**Identity & Organization Service:**

| Action | Admin | PO | SM | Dev |
|--------|-------|----|----|-----|
| Create user | ✔️ | ❌ | ❌ | ❌ |
| Assign roles | ✔️ | ❌ | ❌ | ❌ |
| Create team | ✔️ | ❌ | ❌ | ❌ |
| Create project | ✔️ | ❌ | ❌ | ❌ |
| Assign team to project | ✔️ | ❌ | ❌ | ❌ |
| Update own profile | ✔️ | ✔️ | ✔️ | ✔️ |
| Change own password | ✔️ | ✔️ | ✔️ | ✔️ |
| View team members | ✔️ | ✔️ | ✔️ | ✔️ |

**Scrum Core Service:**

| Action | Admin | PO | SM | Dev |
|--------|-------|----|----|-----|
| Create Story/Epic | ✔️ | ✔️ | ❌ | ❌ |
| Create Bug/Tech Task | ✔️ | ⚠️ | ⚠️ | ✔️ |
| Edit backlog item (any) | ✔️ | ✔️ | ❌ | ❌ |
| Edit own tech items | ✔️ | ✔️ | ✔️ | ✔️ |
| Delete backlog item | ✔️ | ✔️ | ❌ | ❌ |
| Reorder backlog | ✔️ | ✔️ | ❌ | ❌ |
| Estimate story points | ✔️ | ✔️ | ✔️ | ✔️ |
| Create sprint | ✔️ | ⚠️ | ✔️ | ❌ |
| Start sprint | ✔️ | ⚠️ | ✔️ | ❌ |
| End sprint | ✔️ | ⚠️ | ✔️ | ❌ |
| Add item to sprint | ✔️ | ✔️ | ✔️ | ✔️ |
| Create task | ✔️ | ✔️ | ✔️ | ✔️ |
| Update task status | ✔️ | ✔️ | ✔️ | ✔️ |
| Assign task | ✔️ | ✔️ | ✔️ | ✔️ |
| Report impediment | ✔️ | ✔️ | ✔️ | ✔️ |
| Manage impediments | ✔️ | ⚠️ | ✔️ | ⚠️ |
| Document Scrum events | ✔️ | ✔️ | ✔️ | ✔️ |
| Set Definition of Done | ✔️ | ✔️ | ⚠️ | ❌ |

Legend:
- ✔️ = Full access
- ❌ = No access
- ⚠️ = Conditional or limited access

**Collaboration & Notifications Service:**

| Action | Admin | PO | SM | Dev |
|--------|-------|----|----|-----|
| Add comment | ✔️ | ✔️ | ✔️ | ✔️ |
| Edit own comment | ✔️ | ✔️ | ✔️ | ✔️ |
| Delete own comment | ✔️ | ✔️ | ✔️ | ✔️ |
| Delete any comment | ✔️ | ⚠️ | ⚠️ | ❌ |
| View activity log | ✔️ | ✔️ | ✔️ | ✔️ |
| View notifications | ✔️ | ✔️ | ✔️ | ✔️ |
| Configure notifications | ✔️ | ✔️ | ✔️ | ✔️ |

**Reporting & Analytics Service:**

| Action | Admin | PO | SM | Dev |
|--------|-------|----|----|-----|
| View team reports | ✔️ | ✔️ | ✔️ | ✔️ |
| View org-wide reports | ✔️ | ❌ | ❌ | ❌ |
| Export reports | ✔️ | ✔️ | ✔️ | ⚠️ |

### Step 6.4 – Authorization Implementation

**Spring Security (Spring Boot services):**

```java
@PreAuthorize("hasRole('PRODUCT_OWNER') or hasRole('ORGANIZATION_ADMIN')")
@PostMapping("/backlog-items")
public ResponseEntity<BacklogItem> createStory(@RequestBody StoryRequest request) {
    // Only PO or Admin can create stories
}

@PreAuthorize("hasRole('SCRUM_MASTER')")
@PostMapping("/sprints/{id}/start")
public ResponseEntity<Sprint> startSprint(@PathVariable Long id) {
    // Only SM can start sprints
}
```

**NestJS Guards (NestJS services):**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PRODUCT_OWNER', 'ORGANIZATION_ADMIN')
@Post('backlog-items')
async createStory(@Body() request: StoryRequest) {
    // Only PO or Admin can create stories
}
```

**JWT Validation:**
- Each service validates JWT signature using shared secret
- Extract roles from JWT claims
- Check authorization before processing request
- Return 403 Forbidden if insufficient permissions

**Resource-level Authorization:**
- User can only access projects/teams they belong to
- Check `projectIds[]` or `teamIds[]` in JWT against requested resource
- Example: Developer from Team A cannot access Team B's sprint board

### Step 6.5 – Password Security

- Passwords hashed using BCrypt (strength 10-12)
- Minimum password length: 8 characters
- Password complexity requirements (optional but recommended):
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- Password change requires current password verification
- No password history (or store last 3 hashes to prevent reuse)

### Step 6.6 – Session Management

- JWT stored in browser: localStorage or sessionStorage (for persistence) or memory (for security)
- HttpOnly cookies (more secure alternative to localStorage)
- Token expiration enforcement
- Auto-logout on token expiration
- Optional: Refresh token rotation for extended sessions
- Rate limiting on login attempts (prevent brute force)

---

## 7. Observability & Logging

### Step 7.1 – Centralized Logging

Each service logs in JSON to stdout.

Use a logging stack (choose one):

- Loki + Promtail + Grafana
- ELK (Elasticsearch + Logstash/Fluentd + Kibana)

### Step 7.2 – Metrics

**Spring Boot Actuator** for JVM services:

- Expose `/actuator/prometheus`

**NestJS metrics:**

- Use Prometheus middleware

Scrape using Prometheus and visualize via Grafana.

### Step 7.3 – Tracing

Integrate OpenTelemetry SDKs:

- Trace HTTP calls between services
- Trace Kafka message production/consumption

Collect traces in Jaeger or Tempo.

---

## 8. Orchestration: docker-compose

### Step 8.1 – docker-compose.yml

Create a `docker-compose.yml` that defines services:

- `nginx`
- `identity-service`
- `scrum-core-service`
- `collaboration-service`
- `reporting-service`
- `admin-portal`
- `team-portal`
- `kafka`, `zookeeper` (or KRaft-only broker)
- `postgres-identity`, `postgres-scrum`, `postgres-collab`, `postgres-reporting`
- `prometheus`, `grafana`, logging components (optional but recommended)

Ensure:

- All services share a common Docker network.
- Environment variables correctly configure DB hosts and Kafka bootstrap servers.
- Nginx points to container hostnames.

**Sample docker-compose.yml structure:**

```yaml
version: '3.8'

networks:
  scrum-network:
    driver: bridge

volumes:
  postgres-identity-data:
  postgres-scrum-data:
  postgres-collab-data:
  postgres-reporting-data:
  kafka-data:
  zookeeper-data:

services:
  # Databases
  postgres-identity:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: identity_db
      POSTGRES_USER: identity_user
      POSTGRES_PASSWORD: identity_pass
    volumes:
      - postgres-identity-data:/var/lib/postgresql/data
    networks:
      - scrum-network

  postgres-scrum:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: scrum_core_db
      POSTGRES_USER: scrum_user
      POSTGRES_PASSWORD: scrum_pass
    volumes:
      - postgres-scrum-data:/var/lib/postgresql/data
    networks:
      - scrum-network

  postgres-collab:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: collaboration_db
      POSTGRES_USER: collab_user
      POSTGRES_PASSWORD: collab_pass
    volumes:
      - postgres-collab-data:/var/lib/postgresql/data
    networks:
      - scrum-network

  postgres-reporting:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: reporting_db
      POSTGRES_USER: reporting_user
      POSTGRES_PASSWORD: reporting_pass
    volumes:
      - postgres-reporting-data:/var/lib/postgresql/data
    networks:
      - scrum-network

  # Kafka & Zookeeper
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    volumes:
      - zookeeper-data:/var/lib/zookeeper
    networks:
      - scrum-network

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    volumes:
      - kafka-data:/var/lib/kafka
    networks:
      - scrum-network

  # Backend Services
  identity-service:
    build: ./backend/identity-service
    depends_on:
      - postgres-identity
      - kafka
    environment:
      DB_URL: jdbc:postgresql://postgres-identity:5432/identity_db
      DB_USERNAME: identity_user
      DB_PASSWORD: identity_pass
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
      JWT_SECRET: your-secret-key-change-in-production
      JWT_EXPIRATION: 28800000
    networks:
      - scrum-network

  scrum-core-service:
    build: ./backend/scrum-core-service
    depends_on:
      - postgres-scrum
      - kafka
    environment:
      DB_URL: jdbc:postgresql://postgres-scrum:5432/scrum_core_db
      DB_USERNAME: scrum_user
      DB_PASSWORD: scrum_pass
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
      IDENTITY_SERVICE_URL: http://identity-service:8080
    networks:
      - scrum-network

  collaboration-service:
    build: ./backend/collaboration-service
    depends_on:
      - postgres-collab
      - kafka
    environment:
      DB_HOST: postgres-collab
      DB_PORT: 5432
      DB_NAME: collaboration_db
      DB_USER: collab_user
      DB_PASSWORD: collab_pass
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
    networks:
      - scrum-network

  reporting-service:
    build: ./backend/reporting-service
    depends_on:
      - postgres-reporting
      - kafka
    environment:
      DB_HOST: postgres-reporting
      DB_PORT: 5432
      DB_NAME: reporting_db
      DB_USER: reporting_user
      DB_PASSWORD: reporting_pass
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
    networks:
      - scrum-network

  # Frontend Apps (built as static files)
  admin-portal:
    build: ./frontend/admin-portal
    networks:
      - scrum-network

  team-portal:
    build: ./frontend/team-portal
    networks:
      - scrum-network

  # Nginx Gateway
  nginx:
    image: nginx:alpine
    depends_on:
      - identity-service
      - scrum-core-service
      - collaboration-service
      - reporting-service
      - admin-portal
      - team-portal
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./infrastructure/nginx/ssl:/etc/nginx/ssl
    networks:
      - scrum-network
```

---

## 8.5 Database Schemas (Detailed)

### Identity Service Database (identity_db)

**Table: users**
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_picture_url VARCHAR(500),
    bio TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, DISABLED
    preferences JSONB DEFAULT '{}', -- {theme: 'dark', timezone: 'UTC', notifications: {...}}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

**Table: roles**
```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL -- ORGANIZATION_ADMIN, PRODUCT_OWNER, SCRUM_MASTER, DEVELOPER
);

-- Seed roles
INSERT INTO roles (name) VALUES 
    ('ORGANIZATION_ADMIN'),
    ('PRODUCT_OWNER'),
    ('SCRUM_MASTER'),
    ('DEVELOPER');
```

**Table: user_roles (many-to-many)**
```sql
CREATE TABLE user_roles (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
```

**Table: teams**
```sql
CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    product_owner_id BIGINT REFERENCES users(id),
    scrum_master_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_po ON teams(product_owner_id);
CREATE INDEX idx_teams_sm ON teams(scrum_master_id);
```

**Table: team_members (many-to-many)**
```sql
CREATE TABLE team_members (
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50), -- DEVELOPER primarily, but could track role within team
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
```

**Table: projects**
```sql
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    team_id BIGINT REFERENCES teams(id),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, ON_HOLD, COMPLETED, ARCHIVED
    default_sprint_length INT DEFAULT 2, -- in weeks (1-4)
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_team ON projects(team_id);
CREATE INDEX idx_projects_status ON projects(status);
```

### Scrum Core Service Database (scrum_core_db)

**Table: product_backlog_items**
```sql
CREATE TABLE product_backlog_items (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- STORY, EPIC, BUG, TECHNICAL_TASK
    story_points INT,
    priority INT DEFAULT 0,
    position INT NOT NULL, -- for drag-and-drop ordering
    status VARCHAR(50) DEFAULT 'BACKLOG', -- BACKLOG, SPRINT_READY, IN_SPRINT, DONE
    acceptance_criteria TEXT,
    created_by BIGINT NOT NULL,
    created_by_role VARCHAR(50), -- To track if PO or Dev created it
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backlog_project ON product_backlog_items(project_id);
CREATE INDEX idx_backlog_status ON product_backlog_items(status);
CREATE INDEX idx_backlog_position ON product_backlog_items(project_id, position);
```

**Table: sprints**
```sql
CREATE TABLE sprints (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    goal TEXT,
    start_date DATE,
    end_date DATE,
    length_weeks INT, -- 1-4
    status VARCHAR(50) DEFAULT 'PLANNED', -- PLANNED, ACTIVE, COMPLETED, CANCELLED
    team_capacity INT, -- total story points team can handle
    created_by BIGINT NOT NULL, -- should be Scrum Master
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP
);

CREATE INDEX idx_sprints_project ON sprints(project_id);
CREATE INDEX idx_sprints_status ON sprints(status);
```

**Table: sprint_backlog_items (junction)**
```sql
CREATE TABLE sprint_backlog_items (
    sprint_id BIGINT REFERENCES sprints(id) ON DELETE CASCADE,
    backlog_item_id BIGINT REFERENCES product_backlog_items(id) ON DELETE CASCADE,
    committed_points INT,
    actual_points INT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    PRIMARY KEY (sprint_id, backlog_item_id)
);

CREATE INDEX idx_sprint_backlog_sprint ON sprint_backlog_items(sprint_id);
```

**Table: tasks**
```sql
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    backlog_item_id BIGINT REFERENCES product_backlog_items(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    assignee_id BIGINT, -- references users.id (cross-service reference)
    status VARCHAR(50) DEFAULT 'TO_DO', -- TO_DO, IN_PROGRESS, REVIEW, DONE
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_tasks_backlog_item ON tasks(backlog_item_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
```

**Table: impediments**
```sql
CREATE TABLE impediments (
    id BIGSERIAL PRIMARY KEY,
    sprint_id BIGINT REFERENCES sprints(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED
    reported_by BIGINT NOT NULL,
    assigned_to BIGINT, -- usually Scrum Master
    resolved_by BIGINT,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution TEXT
);

CREATE INDEX idx_impediments_sprint ON impediments(sprint_id);
CREATE INDEX idx_impediments_status ON impediments(status);
```

**Table: scrum_events**
```sql
CREATE TABLE scrum_events (
    id BIGSERIAL PRIMARY KEY,
    sprint_id BIGINT REFERENCES sprints(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- PLANNING, DAILY, REVIEW, RETROSPECTIVE
    notes TEXT,
    outcomes JSONB, -- flexible JSON for different event types
    action_items JSONB, -- array of action items from retros
    facilitator_id BIGINT NOT NULL,
    attendees BIGINT[], -- array of user IDs
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scrum_events_sprint ON scrum_events(sprint_id);
CREATE INDEX idx_scrum_events_type ON scrum_events(type);
```

**Table: definition_of_done**
```sql
CREATE TABLE definition_of_done (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    criteria JSONB NOT NULL, -- [{id: 1, text: "Code reviewed"}, {id: 2, text: "Tests passed"}]
    version INT DEFAULT 1,
    effective_from DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dod_project ON definition_of_done(project_id);
```

### Collaboration Service Database (collaboration_db)

**Table: comments**
```sql
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- BACKLOG_ITEM, TASK, SPRINT, IMPEDIMENT
    entity_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id BIGINT REFERENCES comments(id), -- for threaded comments
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- soft delete
);

CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_author ON comments(author_id);
```

**Table: activity_logs**
```sql
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL, -- CREATED, UPDATED, DELETED, STATUS_CHANGED, etc.
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    project_id BIGINT,
    details JSONB, -- old/new values, etc.
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_project ON activity_logs(project_id, timestamp DESC);
CREATE INDEX idx_activity_actor ON activity_logs(actor_id);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);
```

**Table: notifications**
```sql
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL, -- TASK_ASSIGNED, COMMENT_ADDED, SPRINT_STARTED, etc.
    payload JSONB NOT NULL, -- {taskId: 123, taskTitle: "...", assignedBy: "..."}
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

### Reporting Service Database (reporting_db)

**Table: sprint_metrics**
```sql
CREATE TABLE sprint_metrics (
    id BIGSERIAL PRIMARY KEY,
    sprint_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    team_id BIGINT NOT NULL,
    committed_points INT,
    completed_points INT,
    carried_over_points INT,
    velocity INT,
    stories_completed INT,
    stories_carried_over INT,
    bugs_fixed INT,
    impediments_count INT,
    sprint_start DATE,
    sprint_end DATE,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sprint_metrics_sprint ON sprint_metrics(sprint_id);
CREATE INDEX idx_sprint_metrics_project ON sprint_metrics(project_id);
CREATE INDEX idx_sprint_metrics_team ON sprint_metrics(team_id);
```

**Table: daily_burndown**
```sql
CREATE TABLE daily_burndown (
    id BIGSERIAL PRIMARY KEY,
    sprint_id BIGINT NOT NULL,
    date DATE NOT NULL,
    remaining_points INT NOT NULL,
    ideal_remaining_points INT NOT NULL, -- for ideal line
    completed_points INT,
    added_points INT, -- scope changes
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sprint_id, date)
);

CREATE INDEX idx_burndown_sprint ON daily_burndown(sprint_id, date);
```

**Table: cumulative_flow**
```sql
CREATE TABLE cumulative_flow (
    id BIGSERIAL PRIMARY KEY,
    sprint_id BIGINT NOT NULL,
    date DATE NOT NULL,
    to_do_count INT DEFAULT 0,
    in_progress_count INT DEFAULT 0,
    review_count INT DEFAULT 0,
    done_count INT DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sprint_id, date)
);

CREATE INDEX idx_cfd_sprint ON cumulative_flow(sprint_id, date);
```

**Table: team_velocity**
```sql
CREATE TABLE team_velocity (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    sprint_id BIGINT NOT NULL,
    velocity INT NOT NULL,
    sprint_end_date DATE NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_velocity_team ON team_velocity(team_id, sprint_end_date DESC);
```

---

## 9. Kubernetes-Readiness (Future)

Prepare the services so they can later be deployed to Kubernetes:

- Externalize configuration via environment variables.
- Avoid assumptions about local file paths or hostnames.
- Plan Helm charts or Kustomize overlays for:
  - Deployments
  - Services
  - Ingress (Nginx ingress or Traefik)
  - ConfigMaps/Secrets

---

## 9.5 Functional Requirements Summary

This system implements a complete Scrum management platform aligned with professional Scrum practices and enterprise requirements:

### Core Principles Implemented:

**1. No Public Registration**
- All user accounts created by Organization Admin
- Login-only authentication (email + password)
- No self-service password reset via UI

**2. Four-Role System**
- **ORGANIZATION_ADMIN**: System administration (not a Scrum role)
- **PRODUCT_OWNER**: Backlog ownership and prioritization
- **SCRUM_MASTER**: Sprint facilitation and impediment removal
- **DEVELOPER**: Product development and task execution

**3. Team Structure**
- Each team has: 1 Product Owner + 1 Scrum Master + N Developers
- Teams are assigned to projects (1:1 or 1:many depending on configuration)
- Users can belong to multiple teams with different roles

**4. Scrum Workflow**
- **Product Backlog**: PO creates stories/epics, Devs create bugs/tech tasks
- **Sprint Planning**: Team collaboratively selects work, devs self-assign
- **Daily Scrum**: Notes and impediment tracking
- **Sprint Execution**: Task board with To Do → In Progress → Review → Done
- **Sprint Review**: Demo and feedback collection
- **Sprint Retrospective**: Process improvement action items

**5. Sprint Management**
- Scrum Master controls sprint start/end
- Configurable sprint length (1-4 weeks)
- Sprint goals defined by Product Owner
- Real-time sprint board with WebSocket updates

**6. Authorization Model**
| Capability | Admin | PO | SM | Dev |
|------------|-------|----|----|-----|
| Create users/teams/projects | ✔️ | ❌ | ❌ | ❌ |
| Create stories/epics | ✔️ | ✔️ | ❌ | ❌ |
| Create bugs/tech tasks | ✔️ | ⚠️ | ⚠️ | ✔️ |
| Prioritize backlog | ✔️ | ✔️ | ❌ | ❌ |
| Start/end sprints | ✔️ | ⚠️ | ✔️ | ❌ |
| Manage impediments | ✔️ | ⚠️ | ✔️ | ⚠️ |
| Update task status | ✔️ | ✔️ | ✔️ | ✔️ |

**7. Two-Portal Architecture**
- **Admin Portal**: User/team/project management, org-wide analytics
- **Team Portal**: Daily Scrum work, backlog, sprint board, reports

**8. Collaboration Features**
- Comments on all entities (stories, tasks, sprints)
- Activity logging for audit trail
- Real-time notifications (in-app)
- WebSocket-based live updates

**9. Reporting & Analytics**
- Burndown charts (sprint progress)
- Velocity tracking (team performance)
- Cumulative Flow Diagrams (workflow bottlenecks)
- Sprint summaries
- Org-wide dashboards (Admin only)

**10. User Experience**
- Profile management (picture, bio, preferences)
- Theme customization (light/dark mode)
- Timezone configuration
- Notification preferences
- Password change (self-service, authenticated)

### Scrum Events Supported:

1. **Backlog Refinement** (Ongoing)
   - Story creation and estimation
   - Acceptance criteria definition
   - Priority ordering

2. **Sprint Planning** (Sprint Start)
   - Sprint goal setting
   - Backlog item selection
   - Task breakdown
   - Capacity planning

3. **Daily Scrum** (Daily)
   - Quick status updates
   - Impediment identification
   - Day planning

4. **Sprint Review** (Sprint End)
   - Demo of completed work
   - Stakeholder feedback
   - PO acceptance

5. **Sprint Retrospective** (Sprint End)
   - Team reflection
   - Process improvements
   - Action item tracking

### Data Model Highlights:

**Identity Service:**
- Users with profiles, preferences, status
- Roles (system-level)
- Teams with designated PO and SM
- Projects with team assignments

**Scrum Core Service:**
- Product Backlog Items (stories, epics, bugs, tech tasks)
- Sprints with goals and timelines
- Sprint Backlog (junction)
- Tasks with status workflow
- Impediments
- Scrum Events documentation
- Definition of Done

**Collaboration Service:**
- Threaded comments
- Activity logs (audit trail)
- Notifications (read/unread tracking)

**Reporting Service:**
- Sprint metrics (velocity, completion)
- Daily burndown data
- Cumulative flow data
- Team velocity history

### Real-Time Features:

**WebSocket Channels:**
- `/ws/projects/{projectId}` - Project-level updates
- `/ws/sprints/{sprintId}` - Sprint board real-time sync

**Events Pushed:**
- Task status changes → Update all connected boards
- New comments → Notify relevant users
- Sprint start/end → Team-wide alerts
- Task assignments → Assignee notification

### Security & Compliance:

- JWT-based authentication (8-hour expiration)
- BCrypt password hashing
- Role-based authorization at service level
- Resource-level access control (team membership)
- Audit logging for all critical actions
- No public endpoints (all require authentication)

---

## 10. Deliverables Checklist

The agent must produce:

### 1. Complete Codebases

**Identity & Organization Service (Spring Boot):**
- User CRUD with profile management (picture upload, bio, password change)
- Four role system: ORGANIZATION_ADMIN, PRODUCT_OWNER, SCRUM_MASTER, DEVELOPER
- Team creation and member assignment (1 PO + 1 SM + N Developers)
- Project creation and team assignment
- JWT authentication (login only, no registration)
- User status management (active/disabled)
- User preferences (theme, timezone, notifications)
- Comprehensive RBAC implementation

**Scrum Core Service (Spring Boot):**
- Product backlog management with drag-and-drop ordering (position field)
- Role-based backlog item creation (PO: stories/epics, Dev: bugs/tech tasks)
- Sprint lifecycle (create, start, end, cancel) with SM authorization
- Sprint backlog management with capacity tracking
- Task management with status workflow (To Do → In Progress → Review → Done)
- Impediment tracking (SM-managed)
- Scrum event documentation (planning, daily, review, retro)
- Acceptance criteria and Definition of Done
- Story point estimation

**Collaboration & Notifications Service (NestJS):**
- Threaded comments on all entity types
- Activity logging for audit trail
- In-app notifications with read/unread tracking
- WebSocket real-time updates for:
  - Task status changes
  - New comments
  - Sprint start/end events
  - Task assignments
- WebSocket rooms per project and sprint

**Reporting & Analytics Service (NestJS):**
- Burndown chart data (daily tracking)
- Velocity calculation per team/sprint
- Cumulative Flow Diagram data
- Sprint summary metrics
- Team performance analytics
- Org-wide dashboard aggregations
- Kafka event consumption for metrics updates

**Admin Portal (Angular):**
- User management (create, edit, disable, role assignment)
- Team creation wizard (assign PO, SM, Developers)
- Project creation and configuration
- Global settings (sprint length, timezone, org preferences)
- Org-wide dashboards and reports
- Audit log viewer
- Role-based access (ORGANIZATION_ADMIN only)

**Team Portal (Angular):**
- Project dashboard with current sprint overview
- Product backlog with drag-and-drop prioritization (PO only)
- Sprint planning interface with capacity tracking
- Kanban board with real-time WebSocket updates
- Role-specific UI adaptations:
  - PO: Backlog management, sprint goals
  - SM: Sprint start/end, impediment management
  - Dev: Task updates, technical item creation
- Scrum event documentation tools
- Reports and charts (burndown, velocity, CFD)
- User profile and preferences
- Notifications panel

### 2. Infrastructure & Configuration

**Dockerfiles:**
- Identity Service (Spring Boot fat JAR + JDK 17)
- Scrum Core Service (Spring Boot fat JAR + JDK 17)
- Collaboration Service (NestJS dist + Node runtime)
- Reporting Service (NestJS dist + Node runtime)
- Admin Portal (Angular build → Nginx static)
- Team Portal (Angular build → Nginx static)

**docker-compose.yml:**
- All backend services with proper dependency ordering
- Four PostgreSQL databases (isolated per service)
- Kafka + Zookeeper (or KRaft)
- Nginx gateway
- Optional: Prometheus, Grafana, logging stack
- Shared Docker network
- Volume persistence for databases
- Environment variable configuration

**Nginx Configuration:**
- Reverse proxy rules:
  - `/api/auth`, `/api/users`, `/api/teams`, `/api/projects` → Identity Service
  - `/api/backlog`, `/api/sprints`, `/api/tasks` → Scrum Core Service
  - `/api/comments`, `/api/notifications`, `/api/activity` → Collaboration Service
  - `/api/reports` → Reporting Service
- Static file serving:
  - `/admin` → Admin Portal
  - `/app` → Team Portal
- WebSocket proxying for `/ws/**` → Collaboration Service
- SPA fallback routing (try_files)
- Optional TLS termination
- CORS configuration

### 3. Database Schemas & Migrations

**Flyway/Liquibase migrations (Spring Boot):**
- Identity Service: users, roles, user_roles, teams, team_members, projects
- Scrum Core Service: product_backlog_items, sprints, sprint_backlog_items, tasks, impediments, scrum_events, definition_of_done

**TypeORM migrations (NestJS):**
- Collaboration Service: comments, activity_logs, notifications
- Reporting Service: sprint_metrics, daily_burndown, cumulative_flow, team_velocity

**Schema Features:**
- Foreign key relationships
- Indexes for performance
- JSONB fields for flexible data (preferences, outcomes, action items)
- Soft delete support (deleted_at timestamps)
- Audit fields (created_at, updated_at, created_by)
- Position/ordering fields for drag-and-drop

### 4. Kafka Event Integration

**Producers (Topics & Events):**

From Identity Service:
- `org.user-created`
- `org.user-updated`
- `org.user-disabled`
- `org.team-created`
- `org.team-updated`
- `org.project-created`
- `org.project-assigned`

From Scrum Core Service:
- `scrum.backlog-item-created`
- `scrum.backlog-item-updated`
- `scrum.backlog-item-estimated`
- `scrum.sprint-created`
- `scrum.sprint-started`
- `scrum.sprint-completed`
- `scrum.task-created`
- `scrum.task-status-changed`
- `scrum.impediment-reported`
- `scrum.impediment-resolved`

**Consumers:**

Collaboration Service consumes:
- All `scrum.*` events for activity logging
- Task/sprint events for notifications
- User events for notification targeting

Reporting Service consumes:
- All `scrum.*` events for metrics calculation
- Sprint/task events for burndown/velocity
- Backlog events for CFD updates

**Event Schema Consistency:**
- Include correlation IDs: projectId, sprintId, userId
- Timestamp all events
- Include actor/performedBy fields
- Payload with relevant entity details

### 5. API Documentation

**OpenAPI/Swagger:**
- Complete API documentation for each service
- Endpoint descriptions, parameters, request/response schemas
- Authentication requirements (JWT Bearer)
- Role-based access annotations
- Example requests/responses
- Error response documentation

**Swagger UI:**
- Accessible at `/swagger-ui` for each service
- Interactive API testing
- Schema browsing

### 6. Security Implementation

**Authentication:**
- JWT issuance with 8-hour expiration
- BCrypt password hashing (strength 10-12)
- No public registration (admin-created accounts only)
- No password reset UI (change via authenticated endpoint)

**Authorization:**
- Role-based access control (RBAC) in all services
- Spring Security `@PreAuthorize` annotations
- NestJS `@UseGuards` with custom role guards
- JWT validation with shared secret
- Resource-level authorization (team/project membership checks)

**Session Management:**
- Token storage strategy (localStorage/sessionStorage/httpOnly cookies)
- Auto-logout on expiration
- Optional refresh token flow

### 7. Testing

**Unit Tests:**
- Service layer tests (business logic)
- Repository/DAO tests with test database
- Utility function tests
- Target: >70% code coverage

**Integration Tests:**
- API endpoint tests (REST assured for Spring, Supertest for NestJS)
- Database integration with Testcontainers
- Kafka producer/consumer integration tests
- JWT authentication flow tests

**E2E Tests (Optional):**
- Angular E2E with Cypress or Protractor
- Critical user flows: Login, Create backlog item, Move task on board
- Admin workflows: Create user, Create team, Assign project

### 8. Documentation

**ARCHITECTURE.md:**
- System overview with updated architecture diagram
- Service responsibilities and interactions
- Database schema documentation
- Kafka event flows
- Security model and authorization rules
- Deployment architecture

**README.md:**
- Quick start guide: `docker-compose up`
- Prerequisites (Docker, Docker Compose)
- Environment variable configuration
- Default credentials (initial admin account)
- Access URLs:
  - Admin Portal: http://localhost/admin
  - Team Portal: http://localhost/app
  - API Gateway: http://localhost/api
- Troubleshooting common issues
- Development setup instructions

**API.md (Optional):**
- High-level API overview
- Authentication flow
- Common request patterns
- Error handling conventions

**ROLES.md:**
- Detailed role descriptions
- Permission matrix
- Use case examples per role

### 9. Observability (Optional but Recommended)

**Logging:**
- Structured JSON logging in all services
- Log aggregation (Loki/Promtail or ELK stack)
- Correlation IDs for request tracing

**Metrics:**
- Spring Boot Actuator with Prometheus endpoint
- NestJS Prometheus middleware
- Grafana dashboards for:
  - Service health
  - Request rates and latency
  - Database connection pool
  - Kafka lag

**Tracing:**
- OpenTelemetry integration
- Distributed tracing across services
- Jaeger or Tempo for trace visualization

### 10. Additional Requirements

**Initial Data Seeding:**
- Default Organization Admin account (admin@example.com / admin123)
- Seed roles (ORGANIZATION_ADMIN, PRODUCT_OWNER, SCRUM_MASTER, DEVELOPER)
- Sample team and project (optional, for demo purposes)

**Error Handling:**
- Consistent error response format across all services
- HTTP status code conventions
- User-friendly error messages in UI

**Validation:**
- Input validation on all API endpoints
- Client-side form validation in Angular
- Email format validation
- Password complexity checks
- Story point range validation (1-100)

**Performance Considerations:**
- Database query optimization (indexes)
- Pagination for large lists
- Lazy loading in Angular
- WebSocket connection pooling
- Kafka consumer group configuration

---

**Follow these steps and deliver a working system that can be launched locally using `docker-compose up` with:**
- Nginx as the API gateway and static file server
- Kafka as the event backbone
- Complete role-based access control
- Two distinct portals for different user types
- Real-time collaboration via WebSockets
- Comprehensive reporting and analytics
- Full audit trail and activity logging
- Production-ready architecture (Kubernetes-ready)
