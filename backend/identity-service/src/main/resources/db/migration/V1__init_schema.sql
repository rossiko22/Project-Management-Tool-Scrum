    -- Identity Service Database Schema (identity_db)
    -- Based on architecture.md specifications

    -- Users table
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

    -- Roles table
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

    -- User roles (many-to-many)
    CREATE TABLE user_roles (
        user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
        role_id INT REFERENCES roles(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, role_id)
    );

    CREATE INDEX idx_user_roles_user ON user_roles(user_id);

    -- Teams table
    CREATE TABLE teams (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        project_id BIGINT,
        product_owner_id BIGINT REFERENCES users(id),
        scrum_master_id BIGINT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_teams_po ON teams(product_owner_id);
    CREATE INDEX idx_teams_sm ON teams(scrum_master_id);
    CREATE INDEX idx_teams_project ON teams(project_id);

    -- Team members (many-to-many)
    CREATE TABLE team_members (
        team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
        user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50), -- DEVELOPER primarily, but could track role within team
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (team_id, user_id)
    );

    CREATE INDEX idx_team_members_team ON team_members(team_id);
    CREATE INDEX idx_team_members_user ON team_members(user_id);

    -- Projects table
    CREATE TABLE projects (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        organization_id BIGINT,
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
    CREATE INDEX idx_projects_organization ON projects(organization_id);

    -- Insert default admin user (password: admin123, BCrypt encrypted with strength 10)
    -- Password hash generated using BCrypt for 'admin123'
    INSERT INTO users (email, password_hash, first_name, last_name, status) VALUES
        ('admin@example.com', '$2a$10$POtSb1ys2BBOdd6UUKC37OhSqBWeojJ0NJ487ZxBCpltD0wbcboaO', 'System', 'Administrator', 'ACTIVE');

    -- Assign ORGANIZATION_ADMIN role to default admin
    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id
    FROM users u, roles r
    WHERE u.email = 'admin@example.com' AND r.name = 'ORGANIZATION_ADMIN';
