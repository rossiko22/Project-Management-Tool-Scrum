# Scrum Management Platform

A comprehensive event-driven microservices platform for managing Scrum projects.

## Quick Start

```bash
docker-compose up --build
```

## Access Points

- **Admin Portal**: http://localhost:4200
- **Team Portal**: http://localhost:4201
- **API Gateway**: http://localhost:8000

## Default Login

- Email: admin@example.com
- Password: admin123

## Architecture

- 4 Backend Microservices (Spring Boot + NestJS)
- 2 Frontend Applications (Angular)
- Apache Kafka for event streaming
- PostgreSQL databases
- Nginx API Gateway

For detailed documentation, see architecture-docs/
