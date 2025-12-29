# School Assignment - Scrum Master Sprint Management Frontend

**Student Name:** [Your Name]
**Date:** December 15, 2025
**Project:** Scrum Management System - Team Portal Frontend
**Backend URL:** http://team.local/

---

## Assignment Overview

This assignment implements a comprehensive frontend interface for Scrum Masters to manage sprints in the team-portal application. The implementation includes creating, starting, ending, and cancelling sprints, as well as managing sprint retrospectives.

---

## Implemented Features

### 1. Sprint Management Interface

The sprint management interface provides a complete dashboard for viewing and managing all sprints in a project.

#### Key Functionality:
- **View All Sprints**: Display all sprints for the current project with status badges (PLANNED, ACTIVE, COMPLETED, CANCELLED)
- **Sprint Details**: Show sprint goal, dates, duration, team capacity, and metrics
- **Role-Based Access**: Only Scrum Masters and Organization Admins can create and manage sprints
- **Real-Time Updates**: Automatic refresh after any sprint operation

#### Permissions:
- **Scrum Master / Organization Admin**:
  - Create new sprints
  - Start planned sprints
  - End active sprints
  - Cancel sprints (planned or active)
  - Create and view retrospectives
- **Other Roles**: View-only access

---

### 2. Create Sprint Feature

Scrum Masters can create new sprints through a modal dialog with comprehensive form validation.

#### Form Fields:
- **Sprint Name*** (required): e.g., "Sprint 10"
- **Sprint Goal*** (required): Clear objective for the sprint
- **Start Date*** (required): When the sprint begins
- **End Date*** (required): When the sprint ends
- **Length (weeks)*** (required): Duration in weeks (1-4)
- **Team Capacity** (optional): Available hours for the team

#### Technical Implementation:
```typescript
createSprint(): Observable<Sprint>
```

#### API Endpoint:
```
POST /api/scrum/sprints
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "projectId": 1,
  "teamId": 1,
  "name": "Sprint 10",
  "goal": "Implement user authentication",
  "startDate": "2025-01-06",
  "endDate": "2025-01-19",
  "lengthWeeks": 2,
  "teamCapacity": 80
}
```

---

### 3. Sprint Lifecycle Management

Scrum Masters can manage the complete lifecycle of sprints through dedicated action buttons.

#### A. Start Sprint
- **When**: Sprint status is PLANNED
- **Effect**:
  - Changes status to ACTIVE
  - Records start timestamp
  - Calculates committed points
  - Locks sprint scope (no more items can be added/removed)
- **Confirmation**: Warns user that scope will be locked

#### B. End Sprint
- **When**: Sprint status is ACTIVE
- **Effect**:
  - Changes status to COMPLETED
  - Records end timestamp
  - Calculates velocity (completed story points)
  - Counts completed stories
  - Displays metrics in UI
- **Confirmation**: Confirms completion

#### C. Cancel Sprint
- **When**: Sprint status is PLANNED or ACTIVE
- **Effect**:
  - Changes status to CANCELLED
  - Records end timestamp
  - Returns all sprint items to backlog
- **Confirmation**: Warns about backlog restoration
- **Use Cases**: External circumstances, team capacity changes, invalid sprint goal

#### Technical Implementation:
```typescript
startSprint(id: number): Observable<Sprint>
endSprint(id: number): Observable<Sprint>
cancelSprint(id: number): Observable<Sprint>
```

#### API Endpoints:
```
POST /api/scrum/sprints/{id}/start
POST /api/scrum/sprints/{id}/end
POST /api/scrum/sprints/{id}/cancel
```

---

### 4. Sprint Retrospective Feature

After completing a sprint, Scrum Masters can create retrospectives to capture team feedback and action items.

#### Retrospective Sections:

##### What Went Well
- Positive aspects of the sprint
- Successes and achievements
- Dynamic list (add/remove items)
- Example: "Good collaboration between teams"

##### Improvements
- Areas that need improvement
- Challenges encountered
- Things to do differently
- Example: "Better estimation needed"

##### Action Items
- Concrete steps for next sprint
- Commitments for improvement
- Trackable actions
- Example: "Schedule estimation workshop"

##### Overall Notes (Optional)
- General observations
- Summary of discussion
- Additional context

##### Team Mood (1-5)
- 1 = Poor
- 2 = Below Average
- 3 = Average
- 4 = Good
- 5 = Excellent

#### Technical Implementation:
```typescript
interface CreateRetrospectiveRequest {
  sprintId: number;
  wentWell: string[];
  improvements: string[];
  actionItems: string[];
  overallNotes?: string;
  teamMood?: number;
}

createRetrospective(request: CreateRetrospectiveRequest): Observable<Retrospective>
getRetrospectiveBySprint(sprintId: number): Observable<Retrospective>
```

#### API Endpoints:
```
POST /api/scrum/retrospectives
Content-Type: application/json

{
  "sprintId": 10,
  "wentWell": ["Good collaboration", "Met sprint goal"],
  "improvements": ["Better estimates needed"],
  "actionItems": ["Schedule estimation workshop"],
  "overallNotes": "Team showed great collaboration.",
  "teamMood": 4
}

GET /api/scrum/retrospectives/sprint/{sprintId}
```

---

### 5. Sprint Metrics Display

Completed sprints display comprehensive metrics to track team performance and velocity.

#### Metrics Shown:
- **Committed Points**: Total story points planned at sprint start
- **Completed Points**: Actual story points delivered
- **Velocity**: Same as completed points (used for future planning)
- **Stories Completed**: Number of user stories finished

#### Active Sprint Metrics:
- **Committed Points**: Shows commitment made at start
- **Started At**: Timestamp when sprint became active

#### Visual Design:
- Metrics displayed in a responsive grid
- Highlighted velocity value
- Color-coded status badges
- Clean, modern card-based layout

---

## Technical Architecture

### Frontend Stack

#### Framework & Libraries:
- **Angular 17** (Standalone Components)
- **TypeScript** (Type-safe development)
- **RxJS** (Reactive programming)
- **SCSS** (Styling with variables and nesting)

#### Key Services:
1. **SprintService**: HTTP client for sprint operations
2. **RetrospectiveService**: HTTP client for retrospective operations
3. **AuthService**: Authentication and role-based access
4. **ProjectContextService**: Current project management

#### Components:
- **SprintsComponent** (`sprints.component.ts`): Main sprint management interface

---

### Data Models

#### Sprint Model:
```typescript
interface Sprint {
  id: number;
  projectId: number;
  teamId?: number;
  name: string;
  goal: string;
  startDate: Date;
  endDate: Date;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  teamCapacity?: number;
  lengthWeeks?: number;
  committedPoints?: number;
  completedPoints?: number;
  velocity?: number;
  storiesCompleted?: number;
  startedAt?: Date;
  endedAt?: Date;
  createdAt?: Date;
}
```

#### Retrospective Model:
```typescript
interface Retrospective {
  id: number;
  sprintId: number;
  facilitatedBy: number;
  facilitatorName?: string;
  wentWell: string[];
  improvements: string[];
  actionItems: string[];
  overallNotes?: string;
  teamMood?: number;
  createdAt: Date;
  updatedAt?: Date;
}
```

---

### API Integration

#### Base URL Configuration:
```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: '/api/identity',
  scrumApiUrl: '/api/scrum',
  collaborationApiUrl: '/api/collaboration',
  reportingApiUrl: '/api/reporting',
  wsUrl: '/ws'
};
```

#### HTTP Interceptor:
- Automatically adds JWT token to all requests
- Handles authentication errors
- Provides consistent error handling

#### Request/Response Flow:
1. User action triggers component method
2. Component calls service method
3. Service makes HTTP request to backend
4. Backend validates JWT and role permissions
5. Backend processes request and returns response
6. Service emits Observable
7. Component subscribes and updates UI

---

## User Interface Design

### Design Principles:
- **Clean & Modern**: Gradient headers, rounded corners, subtle shadows
- **Responsive**: Mobile-friendly with breakpoints at 768px
- **Accessible**: Clear labels, high contrast, keyboard navigation
- **Intuitive**: Action buttons contextual to sprint status
- **Feedback**: Success/error messages, loading spinners, confirmations

### Color Palette:
- **Primary**: #667eea (Purple-blue for main actions)
- **Success**: #48bb78 (Green for start/complete)
- **Danger**: #f56565 (Red for cancel/delete)
- **Warning**: #fbd38d (Orange for completed status)
- **Neutral**: #718096 (Gray for secondary actions)

### Status Badge Colors:
- **PLANNED**: Blue (#bee3f8)
- **ACTIVE**: Green (#9ae6b4)
- **COMPLETED**: Orange (#fbd38d)
- **CANCELLED**: Red (#feb2b2)

### Layout Components:
1. **Sprint Cards**: Individual cards for each sprint with gradient header
2. **Modals**: Overlay dialogs for create/edit operations
3. **Forms**: Well-structured with labels, validation, and helper text
4. **Buttons**: Color-coded by action type with hover states
5. **Metrics Grid**: Responsive grid for displaying sprint metrics

---

## Code Structure

### Files Created/Modified:

#### 1. Models (`src/app/models/sprint.model.ts`)
- Extended Sprint interface with new fields
- Added CreateSprintRequest interface
- Added Retrospective and CreateRetrospectiveRequest interfaces

#### 2. Services

**`src/app/services/sprint.service.ts`** (Modified):
- Fixed API endpoints to match backend routes
- Updated createSprint to use CreateSprintRequest
- Corrected addItemToSprint and removeItemFromSprint endpoints

**`src/app/services/retrospective.service.ts`** (New):
- createRetrospective()
- updateRetrospective()
- getRetrospectiveBySprint()
- getRetrospective()

#### 3. Components

**`src/app/components/sprints/sprints.component.ts`** (Completely rewritten):
- Sprint CRUD operations
- Role-based UI rendering
- Modal state management
- Retrospective creation and viewing
- Dynamic form arrays for retrospective items
- Error and success message handling

**`src/app/components/sprints/sprints.component.html`** (Completely rewritten):
- Sprint list with cards
- Create sprint modal
- Retrospective modal (create and view modes)
- Status-based action buttons
- Metrics display for completed sprints
- Empty state for no sprints

**`src/app/components/sprints/sprints.component.scss`** (Completely rewritten):
- Modern card-based design
- Responsive grid layouts
- Modal overlay styles
- Form styling with focus states
- Button variants (primary, secondary, success, danger)
- Status badge styles
- Animation for loading spinner

---

## How to Use the Application

### Prerequisites:
1. Backend services running at http://team.local/
2. User account with SCRUM_MASTER or ORGANIZATION_ADMIN role
3. Existing project with ID

### Step-by-Step Usage:

#### 1. Login as Scrum Master
```
Email: sm123@example.com
Password: admin123
```

#### 2. Navigate to Sprints Page
- Click "Sprints" in the navigation menu
- View all existing sprints for your project

#### 3. Create a New Sprint
- Click "+ Create Sprint" button (top right)
- Fill in the form:
  - Name: "Sprint 10"
  - Goal: "Implement user authentication"
  - Start Date: 2025-01-20
  - End Date: 2025-02-03
  - Length: 2 weeks
  - Team Capacity: 80 hours
- Click "Create Sprint"
- Sprint appears in the list with status PLANNED

#### 4. Start the Sprint
- Find your sprint in the list
- Click "Start" button
- Confirm the action (warns about scope lock)
- Sprint status changes to ACTIVE
- Committed points are calculated and displayed

#### 5. During Sprint Execution
- Items cannot be added or removed (scope locked)
- Team works on committed items
- Developers update task status on board
- Product Owner accepts completed items

#### 6. End the Sprint
- Click "End" button on active sprint
- Confirm the completion
- Velocity is calculated automatically
- Sprint status changes to COMPLETED
- Metrics are displayed:
  - Committed: 55 points
  - Completed: 47 points
  - Velocity: 47 points
  - Stories: 8 completed

#### 7. Create Sprint Retrospective
- Click "+ Retrospective" button
- Fill in the retrospective form:
  - What Went Well: Add positive items
  - Improvements: Add areas for improvement
  - Action Items: Add commitments for next sprint
  - Overall Notes: Optional summary
  - Team Mood: Rate 1-5
- Click "Create Retrospective"

#### 8. View Retrospective
- Click "View Retro" button
- Read the retrospective details
- Review action items for implementation in next sprint

---

## Testing the Implementation

### Manual Testing Checklist:

- [ ] Login as Scrum Master
- [ ] View sprints page loads successfully
- [ ] Empty state shows when no sprints exist
- [ ] Create sprint modal opens
- [ ] Form validation works (required fields)
- [ ] Create sprint successfully
- [ ] New sprint appears in list with PLANNED status
- [ ] Start button visible for PLANNED sprint
- [ ] Start sprint successfully
- [ ] Sprint status changes to ACTIVE
- [ ] Committed points displayed
- [ ] Start button disappears, End button appears
- [ ] End sprint successfully
- [ ] Sprint status changes to COMPLETED
- [ ] Velocity and metrics displayed
- [ ] Create retrospective modal opens
- [ ] Can add multiple items to each section
- [ ] Can remove items (except last one)
- [ ] Create retrospective successfully
- [ ] View retrospective shows correct data
- [ ] Cancel sprint works for PLANNED sprint
- [ ] Cancel sprint works for ACTIVE sprint
- [ ] Non-Scrum Master users see view-only interface
- [ ] Error messages display on API failures
- [ ] Success messages display on successful operations
- [ ] Responsive design works on mobile (< 768px)

### API Testing:

Test the backend endpoints using curl or Postman:

```bash
# 1. Login and get JWT token
curl -X POST http://team.local/api/identity/auth/authenticate \
  -H 'Content-Type: application/json' \
  -d '{"email":"sm123@example.com","password":"admin123"}'

# Store the token
TOKEN="<JWT_TOKEN_FROM_RESPONSE>"

# 2. Create Sprint
curl -X POST http://team.local/api/scrum/sprints \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "projectId": 1,
    "teamId": 1,
    "name": "Sprint 11",
    "goal": "Testing sprint management",
    "startDate": "2025-01-20",
    "endDate": "2025-02-03",
    "lengthWeeks": 2,
    "teamCapacity": 80
  }'

# 3. List Sprints
curl -X GET http://team.local/api/scrum/sprints/project/1 \
  -H "Authorization: Bearer $TOKEN"

# 4. Start Sprint (use ID from create response)
curl -X POST http://team.local/api/scrum/sprints/11/start \
  -H "Authorization: Bearer $TOKEN"

# 5. End Sprint
curl -X POST http://team.local/api/scrum/sprints/11/end \
  -H "Authorization: Bearer $TOKEN"

# 6. Create Retrospective
curl -X POST http://team.local/api/scrum/retrospectives \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "sprintId": 11,
    "wentWell": ["Good collaboration", "Met sprint goal"],
    "improvements": ["Better estimation"],
    "actionItems": ["Schedule estimation training"],
    "teamMood": 4
  }'

# 7. View Retrospective
curl -X GET http://team.local/api/scrum/retrospectives/sprint/11 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Security Considerations

### Authentication:
- All API requests require valid JWT token
- Token stored in localStorage
- Automatically attached via HTTP interceptor

### Authorization:
- Backend validates user roles on every request
- Frontend hides UI elements based on roles (defense in depth)
- Scrum Master-only operations:
  - Create sprint
  - Start sprint
  - End sprint
  - Cancel sprint
  - Create/update retrospective

### CORS:
- Backend configured to accept requests from team-portal origin
- Proper headers for cross-origin requests

### Input Validation:
- Frontend: Form validation (required fields, data types)
- Backend: Request body validation, business logic validation
- Example: Cannot start a sprint that's already active
- Example: Cannot add items to an active sprint

---

## Alignment with Scrum Framework

This implementation follows official Scrum best practices:

### 1. Scrum Master Responsibilities:
- **Facilitation**: SM creates and manages sprints
- **Process Enforcement**: Only SM can start/end sprints
- **Continuous Improvement**: SM facilitates retrospectives

### 2. Sprint Lifecycle:
- **Sprint Planning**: Create sprint, add items (PLANNED)
- **Sprint Execution**: Start sprint, scope locked (ACTIVE)
- **Sprint Review**: End sprint, calculate velocity (COMPLETED)
- **Sprint Retrospective**: Capture learnings, action items

### 3. Protected Sprint Scope:
- Once started, sprint scope cannot be changed
- Prevents mid-sprint disruptions
- Encourages proper planning

### 4. Velocity Tracking:
- Automatically calculated from completed items
- Used for future sprint planning
- Helps team improve estimation over time

### 5. Continuous Improvement:
- Retrospectives after every sprint
- Action items tracked for next sprint
- Team mood monitoring

---

## Potential Enhancements

### Future Features:

1. **Sprint Burndown Chart**:
   - Track remaining work daily
   - Visualize progress toward sprint goal
   - Identify blockers early

2. **Sprint Planning Board**:
   - Drag-and-drop interface for adding items
   - Capacity planning visualization
   - Item prioritization

3. **Velocity Trend Chart**:
   - Show velocity over multiple sprints
   - Identify improvement patterns
   - Forecast future capacity

4. **Daily Standup Notes**:
   - Record daily progress updates
   - Track blockers and dependencies
   - Link to specific backlog items

5. **Sprint Report Export**:
   - PDF export of sprint summary
   - Metrics and retrospective
   - Share with stakeholders

6. **Retrospective Action Item Tracking**:
   - Carry forward uncompleted actions
   - Mark actions as complete
   - Link to specific improvements

7. **Team Mood Trends**:
   - Chart team morale over time
   - Identify patterns
   - Proactive intervention

8. **Sprint Templates**:
   - Save sprint configurations
   - Reuse common sprint patterns
   - Standardize across teams

---

## Challenges & Solutions

### Challenge 1: API Endpoint Mismatch
**Problem**: Frontend was calling `/projects/{id}/sprints` but backend expected `/sprints/project/{id}`
**Solution**: Updated SprintService to match backend routes exactly
**Learning**: Always verify API contracts between frontend and backend

### Challenge 2: Role-Based UI Rendering
**Problem**: Need to show/hide buttons based on user role
**Solution**: Created `isScrumMaster` getter that checks AuthService
**Learning**: Reactive properties make role-based UI simple

### Challenge 3: Dynamic Form Arrays
**Problem**: Retrospective needs variable number of items per section
**Solution**: Used TypeScript arrays with add/remove methods, tracked by index
**Learning**: Angular's trackBy improves performance for dynamic lists

### Challenge 4: Modal Click-Through
**Problem**: Clicking inside modal was closing it
**Solution**: Added `$event.stopPropagation()` on modal content
**Learning**: Event bubbling needs careful handling in modals

### Challenge 5: Date Formatting
**Problem**: Backend expects string dates, TypeScript Date objects
**Solution**: Used `formatDate()` method for display, string format for API
**Learning**: Type consistency important across frontend/backend boundary

---

## Lessons Learned

1. **Type Safety**: TypeScript interfaces prevent runtime errors
2. **Reactive Programming**: RxJS Observables handle async operations elegantly
3. **Separation of Concerns**: Services handle API, components handle UI
4. **User Feedback**: Success/error messages improve UX significantly
5. **Responsive Design**: Mobile-first CSS ensures broad accessibility
6. **Role-Based Access**: Security in both frontend and backend
7. **Scrum Principles**: Code structure should reflect domain concepts
8. **Testing**: Manual testing checklist ensures feature completeness

---

## Conclusion

This assignment successfully implements a complete Scrum Master sprint management interface for the team-portal application. The implementation follows Angular best practices, integrates seamlessly with the existing backend API, and provides an intuitive, modern user interface.

### Key Achievements:
- Full sprint lifecycle management (create, start, end, cancel)
- Sprint retrospective creation and viewing
- Role-based access control
- Responsive, modern UI design
- Comprehensive error handling
- Type-safe TypeScript implementation
- RESTful API integration
- Alignment with Scrum framework principles

### Production Readiness:
- Input validation on frontend and backend
- Authentication and authorization
- Error handling with user-friendly messages
- Loading states for async operations
- Confirmation dialogs for destructive actions
- Responsive design for all screen sizes

This feature is ready for testing and deployment to the team-portal application at http://team.local/.

---

## References

- [Scrum Guide](https://scrumguides.org/) - Official Scrum Framework
- [Angular Documentation](https://angular.io/docs) - Angular 17 Features
- [RxJS Documentation](https://rxjs.dev/) - Reactive Programming
- [SCRUM_MASTER_SPRINT_MANAGEMENT.md](./SCRUM_MASTER_SPRINT_MANAGEMENT.md) - Backend API Documentation
- [TODO_NEXT_SESSION.md](./TODO_NEXT_SESSION.md) - Implementation Context

---

**End of Assignment Documentation**

*For questions or issues, please contact the development team or refer to the project documentation.*
