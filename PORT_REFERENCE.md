# Port Configuration Reference

## Database Ports
| Service | Database | Port |
|---------|----------|------|
| Collaboration Service | collaboration_db | **5434** |
| Reporting Service | reporting_db | **5435** |

## Application Ports
| Service | Port |
|---------|------|
| User Service | 8080 |
| Scrum Core Service | 8081 |
| Collaboration Service | 3000 |
| Reporting Service | 3001 |
| Team Portal (Frontend) | 4200 |

## Quick Commands

### Connect to Databases
```bash
# Collaboration database (PORT 5434)
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d collaboration_db

# Reporting database (PORT 5435)
PGPASSWORD=postgres psql -h localhost -p 5435 -U postgres -d reporting_db
```

### Test API Endpoints
```bash
# Collaboration Service (PORT 3000)
curl http://localhost:3000/api/comments/entity/BACKLOG_ITEM/1

# Reporting Service (PORT 3001)
curl http://localhost:3001/api/velocity/team/1
curl http://localhost:3001/api/burndown/sprint/1
```

## Environment Files

### Collaboration Service `.env`
```
DB_HOST=localhost
DB_PORT=5434
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=collaboration_db
PORT=3000
```

### Reporting Service `.env`
```
DB_HOST=localhost
DB_PORT=5435
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=reporting_db
PORT=3001
SCRUM_API_URL=http://localhost:8081/api
```

### Frontend `environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  scrumApiUrl: 'http://localhost:8081/api',
  collaborationApiUrl: 'http://localhost:3000/api',
  reportingApiUrl: 'http://localhost:3001/api',
  wsUrl: '/ws'
};
```
