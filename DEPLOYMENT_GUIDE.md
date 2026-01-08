# 🚀 Complete CI/CD Deployment Guide

## Assignment Requirements Coverage

This setup fulfills **ALL** assignment requirements:

### ✅ Build Phase (15%)
- **Java services**: Maven builds with `mvn clean package`
- **Node.js services**: NestJS builds with `npm run build`
- **Frontend apps**: Angular builds with `ng build`
- All builds run in parallel using matrix strategy

### ✅ Caching (15%)
- **Maven cache**: `~/.m2/repository` cached based on `pom.xml` hash
- **Node modules**: `node_modules` cached based on `package-lock.json` hash
- **Docker layers**: BuildKit cache for faster image builds

### ✅ Artifacts (15%)
- **JAR files**: Uploaded from `target/*.jar`
- **Node.js builds**: Uploaded from `dist/` folders
- **Frontend builds**: Uploaded from `dist/` folders
- **Coverage reports**: JaCoCo and Angular coverage
- All visible in GitHub Actions artifacts section

### ✅ Docker Build (20%)
- Uses `docker/build-push-action@v5`
- Docker BuildKit with layer caching
- Builds all 7 services (2 Java + 3 Node.js + 2 Frontend)
- Matrix strategy for parallel builds

### ✅ Docker Hub Push (15%)
- Login with GitHub Secrets (`DOCKER_USERNAME`, `DOCKER_PASSWORD`)
- Tags: `latest` and `${{ github.sha }}`
- Push verification step
- Images visible at `https://hub.docker.com/u/<your-username>`

### ✅ Deployment (20%)
- **Service**: Render (Free tier)
- **Database**: PostgreSQL (Render free tier)
- **Method**: Pull Docker images from Docker Hub
- **Proof**: Public URLs for each service

---

## 📋 Setup Instructions

### Step 1: Create Docker Hub Account

1. Go to [hub.docker.com](https://hub.docker.com)
2. Sign up for a free account
3. Remember your username

### Step 2: Configure GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `DOCKER_USERNAME` | `your-dockerhub-username` | Your Docker Hub username |
| `DOCKER_PASSWORD` | `your-dockerhub-password` | Your Docker Hub password or access token |
| `RENDER_API_KEY` | `your-render-api-key` | Get from Render dashboard |
| `RENDER_SERVICE_ID_PREFIX` | `your-prefix` | (Optional) Service ID prefix |

**To get RENDER_API_KEY:**
1. Sign up at [render.com](https://render.com)
2. Go to Account Settings → API Keys
3. Create new API key
4. Copy and paste into GitHub Secret

### Step 3: Deploy to Render

#### Option A: Using Render Dashboard (Recommended for first time)

1. **Sign up/Login** to [render.com](https://render.com)

2. **Create PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - Name: `scrum-postgres-db`
   - Plan: **Free**
   - Region: Choose closest to you
   - Click "Create Database"
   - Save the connection details

3. **Deploy Backend Services** (repeat for each service)
   - Click "New +" → "Web Service"
   - Connect to your Docker Hub
   - Image URL: `docker.io/<your-username>/scrum-identity-service:latest`
   - Name: `identity-service`
   - Plan: **Free**
   - Add environment variables:
     ```
     SPRING_DATASOURCE_URL=jdbc:postgresql://<db-host>:5432/scrum_db
     SPRING_DATASOURCE_USERNAME=<db-user>
     SPRING_DATASOURCE_PASSWORD=<db-password>
     JWT_SECRET=your-secret-key-change-in-production-must-be-at-least-256-bits
     SERVER_PORT=8080
     ```
   - Health Check Path: `/actuator/health`
   - Click "Create Web Service"

   Repeat for:
   - `scrum-core-service` (port 8081, health: `/api/actuator/health`)
   - `collaboration-service` (port 3000, health: `/health`)
   - `reporting-service` (port 3001, health: `/api/health`)
   - `logging-service` (port 3002, health: `/health`)

4. **Deploy Frontend Applications**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Name: `admin-portal`
   - Build Command: `cd frontend/admin-portal && npm ci && npm run build`
   - Publish Directory: `frontend/admin-portal/dist/admin-portal/browser`
   - Click "Create Static Site"

   Repeat for `team-portal`

#### Option B: Using Blueprint (Infrastructure as Code)

1. Go to Render Dashboard
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will read `render.yaml` and create all services
5. Replace `$DOCKER_USERNAME` with your actual Docker Hub username
6. Click "Apply"

### Step 4: Test the Pipeline

1. **Make a change** to any file in your repository

2. **Commit and push** to `main` branch:
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin main
   ```

3. **Watch the pipeline** run:
   - Go to your GitHub repository
   - Click "Actions" tab
   - Watch the workflow execute

4. **Verify each phase**:
   - ✅ Build Phase: All services built successfully
   - ✅ Test Phase: Tests passed with coverage
   - ✅ Docker Build: Images built
   - ✅ Docker Push: Check Docker Hub for your images
   - ✅ Deploy: Check Render dashboard for deployments

5. **Access your deployed app**:
   - Go to Render Dashboard
   - Click on each service to get its URL
   - Test the endpoints

---

## 🎯 What Your Teacher Will See

### 1. GitHub Actions Workflow ✅
- Clear phases: Build → Test → Docker → Deploy
- Matrix strategy for parallel builds
- Caching implementation
- Artifact uploads

### 2. Docker Hub Repository ✅
- All 7 service images
- Tagged with `latest` and commit SHA
- Publicly visible

### 3. Render Deployment ✅
- Live URLs for all services
- PostgreSQL database connected
- Health checks passing
- Logs showing deployment success

### 4. Artifacts in GitHub ✅
- JAR files from Java builds
- Dist folders from Node.js builds
- Frontend build outputs
- Coverage reports

---

## 🆓 Render Free Tier Limits

### What's Free:
✅ 750 hours/month per service (enough for demo)
✅ 100GB bandwidth/month
✅ PostgreSQL database (90 days, 1GB storage)
✅ Automatic SSL certificates
✅ Public URLs
✅ No credit card required

### Limitations:
⚠️ **Services sleep after 15 min inactivity** (cold start ~30s)
⚠️ Shared CPU/RAM (512MB)
⚠️ Database expires after 90 days (can recreate)

### For Assignment Purposes:
🎓 **Perfect!** Your teacher can:
- Access live URLs (may take 30s to wake up)
- See GitHub Actions logs
- Verify Docker images
- Check database connection
- Review all artifacts

---

## 📊 Assignment Scoring Breakdown

| Requirement | Points | Implementation | Where to Verify |
|-------------|--------|----------------|-----------------|
| **Build Phase** | 15% | Maven/npm builds in workflow | GitHub Actions logs |
| **Caching** | 15% | Maven, npm, Docker layer cache | Workflow YAML + logs |
| **Artifacts** | 15% | JARs, dist folders, coverage | GitHub Actions artifacts |
| **Docker Build** | 20% | docker/build-push-action | Workflow logs |
| **Docker Push** | 15% | Push to Docker Hub | hub.docker.com/u/`<username>` |
| **Deployment** | 20% | Render deployment | Live URLs on Render |

**Total: 100%** ✅

---

## 🐛 Troubleshooting

### Pipeline fails at Docker build
- Check Dockerfiles are valid
- Verify all dependencies are available
- Check Docker Hub secrets are set correctly

### Docker push fails
- Verify `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets
- Make sure Docker Hub account is active
- Try logging in manually: `docker login`

### Render deployment fails
- Check environment variables are set
- Verify database connection string
- Check service health check paths
- View logs in Render dashboard

### Services won't start on Render
- Check memory limits (free tier: 512MB)
- Verify PostgreSQL database is running
- Check all required env vars are set
- Review Render service logs

### Cold start issues
- **Normal on free tier!** First request takes ~30s
- Services sleep after 15 min inactivity
- Subsequent requests are fast
- For demo: wake up services before presentation

---

## 🎓 For Your Presentation

1. **Show GitHub Actions**:
   - Navigate to Actions tab
   - Show latest successful workflow
   - Point out each phase

2. **Show Docker Hub**:
   - Open your Docker Hub profile
   - Show all 7 images
   - Show tags (latest, commit SHA)

3. **Show Render**:
   - Open Render dashboard
   - Show all services running
   - Click a service URL (wait for cold start if needed)

4. **Show Artifacts**:
   - Go to workflow run
   - Scroll to bottom
   - Show artifacts section

5. **Explain Caching**:
   - Show workflow YAML
   - Point out cache steps
   - Show cache hit/miss in logs

---

## 💡 Tips for Success

1. **Test locally first**: Use `docker-compose up` to verify everything works
2. **Push to test branch first**: Test the pipeline before pushing to main
3. **Check secrets**: Double-check all GitHub secrets are set
4. **Monitor first run**: First build takes longer (no cache)
5. **Documentation**: This README + workflow comments = easy grading

---

## 🌟 Why This Setup is Great for Your Assignment

✅ **Complete**: Covers ALL requirements (100%)
✅ **Free**: Zero cost, no credit card needed
✅ **Provable**: Live URLs, visible artifacts, public images
✅ **Professional**: Real CI/CD pipeline, industry practices
✅ **Automatic**: Push to main = full deployment
✅ **Documented**: Clear phases, comments, this guide

**Good luck with your assignment!** 🚀

---

## 📞 Quick Reference Links

- **GitHub Actions Docs**: https://docs.github.com/actions
- **Docker Hub**: https://hub.docker.com
- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **Your Docker Images**: `https://hub.docker.com/u/<your-username>`
- **Render Dashboard**: https://dashboard.render.com

---

## 📝 Submission Checklist

Before submitting:

- [ ] GitHub Actions workflow runs successfully
- [ ] All phases complete (Build, Test, Docker, Deploy)
- [ ] Docker images visible on Docker Hub
- [ ] Services deployed and accessible on Render
- [ ] Artifacts uploaded to GitHub
- [ ] Database connected and working
- [ ] Frontend apps load correctly
- [ ] Health checks passing
- [ ] This documentation included in repository
- [ ] GitHub secrets configured
- [ ] Screenshots of deployment (optional but recommended)

**You're ready to submit!** 🎉
