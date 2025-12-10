# Stage 1: Build Admin Portal
FROM node:18-alpine AS admin-builder

WORKDIR /app/admin
COPY ./frontend/admin-portal/package*.json ./
RUN npm ci
COPY ./frontend/admin-portal/ ./
RUN npm run build

# Stage 2: Build Team Portal
FROM node:18-alpine AS team-builder

WORKDIR /app/team
COPY ./frontend/team-portal/package*.json ./
RUN npm ci
COPY ./frontend/team-portal/ ./
RUN npm run build

# Stage 3: Final nginx image with both apps
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx configuration
COPY ./backend/nginx/nginx.conf /etc/nginx/nginx.conf

# Copy built Angular applications from builder stages
COPY --from=admin-builder /app/admin/dist/admin-portal/browser /usr/share/nginx/html/admin
COPY --from=team-builder /app/team/dist/team-portal/browser /usr/share/nginx/html/team

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
