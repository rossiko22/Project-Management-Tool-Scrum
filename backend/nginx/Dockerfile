# Stage 1: Build Admin Portal
FROM node:18-alpine AS admin-builder

WORKDIR /app/admin

# Configure npm for better network tolerance
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

COPY ./frontend/admin-portal/package*.json ./
RUN npm install --legacy-peer-deps

COPY ./frontend/admin-portal/ ./
RUN npm run build

# Stage 2: Build Team Portal
FROM node:18-alpine AS team-builder

WORKDIR /app/team

# Configure npm for better network tolerance
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

COPY ./frontend/team-portal/package*.json ./
RUN npm install --legacy-peer-deps

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

# Expose ports for admin (4200) and team (4201) portals
EXPOSE 4200 4201

CMD ["nginx", "-g", "daemon off;"]
