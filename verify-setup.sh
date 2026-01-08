#!/bin/bash

# Verification script to check if everything is ready for CI/CD deployment
# Run this before pushing to GitHub

set -e

echo "🔍 Verifying CI/CD Setup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

# Function to print failure
fail() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

# Function to print warning
warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

echo "=== 1. Checking Project Structure ==="
echo ""

# Check if required directories exist
if [ -d "backend/identity-service" ]; then
    success "backend/identity-service exists"
else
    fail "backend/identity-service not found"
fi

if [ -d "backend/scrum-core-service" ]; then
    success "backend/scrum-core-service exists"
else
    fail "backend/scrum-core-service not found"
fi

if [ -d "backend/collaboration-service" ]; then
    success "backend/collaboration-service exists"
else
    fail "backend/collaboration-service not found"
fi

if [ -d "frontend/admin-portal" ]; then
    success "frontend/admin-portal exists"
else
    fail "frontend/admin-portal not found"
fi

if [ -d "frontend/team-portal" ]; then
    success "frontend/team-portal exists"
else
    fail "frontend/team-portal not found"
fi

echo ""
echo "=== 2. Checking Dockerfiles ==="
echo ""

# Check Dockerfiles
DOCKERFILES=(
    "backend/identity-service/Dockerfile"
    "backend/scrum-core-service/Dockerfile"
    "backend/collaboration-service/Dockerfile"
    "frontend/admin-portal/Dockerfile"
    "frontend/team-portal/Dockerfile"
)

for dockerfile in "${DOCKERFILES[@]}"; do
    if [ -f "$dockerfile" ]; then
        success "$dockerfile exists"
    else
        fail "$dockerfile not found"
    fi
done

echo ""
echo "=== 3. Checking Build Files ==="
echo ""

# Check build configuration files
if [ -f "backend/identity-service/pom.xml" ]; then
    success "identity-service pom.xml exists"
else
    fail "identity-service pom.xml not found"
fi

if [ -f "backend/scrum-core-service/pom.xml" ]; then
    success "scrum-core-service pom.xml exists"
else
    fail "scrum-core-service pom.xml not found"
fi

if [ -f "backend/collaboration-service/package.json" ]; then
    success "collaboration-service package.json exists"
else
    fail "collaboration-service package.json not found"
fi

if [ -f "frontend/admin-portal/package.json" ]; then
    success "admin-portal package.json exists"
else
    fail "frontend/admin-portal package.json not found"
fi

echo ""
echo "=== 4. Checking GitHub Actions Workflow ==="
echo ""

if [ -f ".github/workflows/ci-cd-complete.yml" ]; then
    success "CI/CD workflow file exists"
else
    fail "CI/CD workflow file not found"
fi

echo ""
echo "=== 5. Checking Deployment Files ==="
echo ""

if [ -f "render.yaml" ]; then
    success "render.yaml exists"
else
    warn "render.yaml not found (optional)"
fi

if [ -f "DEPLOYMENT_GUIDE.md" ]; then
    success "DEPLOYMENT_GUIDE.md exists"
else
    warn "DEPLOYMENT_GUIDE.md not found (optional but recommended)"
fi

echo ""
echo "=== 6. Checking Git Repository ==="
echo ""

if [ -d ".git" ]; then
    success "Git repository initialized"

    # Check if on main branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
        success "On main/master branch"
    else
        warn "Not on main branch (current: $CURRENT_BRANCH)"
    fi

    # Check for uncommitted changes
    if git diff-index --quiet HEAD --; then
        success "No uncommitted changes"
    else
        warn "You have uncommitted changes"
    fi
else
    fail "Not a git repository"
fi

echo ""
echo "=== 7. Testing Local Builds (Quick Check) ==="
echo ""

# Test Java build
if command -v mvn &> /dev/null; then
    success "Maven is installed"

    echo "  Testing identity-service build..."
    if mvn -f backend/identity-service/pom.xml clean package -DskipTests -q; then
        success "identity-service builds successfully"
    else
        fail "identity-service build failed"
    fi
else
    warn "Maven not found - skipping Java build test"
fi

# Test Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    success "Node.js is installed ($NODE_VERSION)"
else
    warn "Node.js not found - skipping Node.js checks"
fi

# Test Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    success "Docker is installed ($DOCKER_VERSION)"

    # Test if Docker daemon is running
    if docker info &> /dev/null; then
        success "Docker daemon is running"
    else
        warn "Docker daemon is not running"
    fi
else
    warn "Docker not found - you'll need it for local testing"
fi

echo ""
echo "=== 8. Checking GitHub Secrets Setup ==="
echo ""

warn "Cannot verify GitHub secrets from local machine"
echo "  Please manually verify in GitHub:"
echo "  → Go to: Settings → Secrets and variables → Actions"
echo "  → Required secrets:"
echo "    - DOCKER_USERNAME"
echo "    - DOCKER_PASSWORD"
echo "    - RENDER_API_KEY (optional for manual deploy)"

echo ""
echo "============================================"
echo "📊 VERIFICATION SUMMARY"
echo "============================================"
echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🎉 Perfect! Everything is ready for deployment!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Make sure GitHub secrets are configured"
        echo "2. git add ."
        echo "3. git commit -m 'Setup CI/CD pipeline'"
        echo "4. git push origin main"
        echo "5. Watch the pipeline run in GitHub Actions"
    else
        echo -e "${YELLOW}✅ Ready to deploy (with warnings)${NC}"
        echo ""
        echo "Review the warnings above, but you can proceed with:"
        echo "1. Configure GitHub secrets"
        echo "2. git push origin main"
    fi
else
    echo -e "${RED}❌ Please fix the failed checks before deploying${NC}"
    exit 1
fi

echo ""
echo "📖 For detailed setup instructions, see:"
echo "   - DEPLOYMENT_GUIDE.md (comprehensive)"
echo "   - RENDER_SETUP_QUICK.md (quick start)"
echo ""
