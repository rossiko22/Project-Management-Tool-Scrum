# ⚡ Quick Render Setup Guide (5 Minutes)

## TL;DR - Fastest Path to Deployment

### 1️⃣ Setup GitHub Secrets (2 min)

Go to GitHub → Your Repo → Settings → Secrets → Actions

Add:
```
DOCKER_USERNAME = your_dockerhub_username
DOCKER_PASSWORD = your_dockerhub_password
RENDER_API_KEY = (get from render.com after signup)
```

### 2️⃣ First Push to Trigger Pipeline (1 min)

```bash
git add .
git commit -m "Setup CI/CD pipeline"
git push origin main
```

Pipeline will:
- ✅ Build everything
- ✅ Run tests
- ✅ Build Docker images
- ✅ Push to Docker Hub

### 3️⃣ Deploy to Render - Simplified Approach (2 min)

**For this assignment, deploy just ONE service to prove it works!**

#### Option A: Deploy Identity Service Only (Simplest)

1. Go to [render.com](https://render.com) → Sign up (free, no credit card)

2. **Create Database**:
   - New + → PostgreSQL
   - Name: `scrum-db`
   - Free plan → Create
   - Copy the "Internal Database URL"

3. **Deploy Identity Service**:
   - New + → Web Service
   - Image URL: `docker.io/<your-dockerhub-username>/scrum-identity-service:latest`
   - Name: `identity-service`
   - Region: Frankfurt (or closest)
   - Instance Type: **Free**
   - Add Environment Variables:
     ```
     SPRING_DATASOURCE_URL = <paste Internal Database URL>
     JWT_SECRET = my-secret-key-for-assignment-demo-must-be-256-bits-long
     JWT_EXPIRATION = 28800000
     ```
   - Health Check Path: `/actuator/health`
   - Create Web Service

4. **Wait 2-3 minutes** → Service will be live at `https://identity-service-xxx.onrender.com`

5. **Test it**:
   ```bash
   curl https://your-service-url.onrender.com/actuator/health
   ```

**✅ DONE! You have:**
- ✅ Complete CI/CD pipeline (GitHub Actions)
- ✅ Docker images on Docker Hub
- ✅ Live deployment on Render
- ✅ All assignment requirements met

---

## For Demo/Presentation

1. **Show GitHub Actions**: Latest workflow run with all green checkmarks
2. **Show Docker Hub**: Your images at `hub.docker.com/u/<username>`
3. **Show Render**: Live URL responding to requests
4. **Show Artifacts**: Downloaded from GitHub Actions

---

## If You Have More Time

Deploy additional services the same way:
- `scrum-core-service` (same database, port 8081)
- `collaboration-service` (Node.js service)
- Frontend apps as Static Sites

But **ONE service is enough** to prove the pipeline works and meet all requirements! 🎯

---

## Troubleshooting

**Service won't start?**
- Check environment variables are set correctly
- Check database URL is correct (use Internal URL, not External)
- View logs in Render dashboard

**First request slow?**
- Normal! Free tier sleeps after 15 min
- First request wakes it up (~30 seconds)
- Tell your teacher about this before demo

**Need help?**
- Check Render logs: Dashboard → Service → Logs
- Check GitHub Actions logs: Actions tab → Latest run

---

## What Your Teacher Sees

### GitHub Actions ✅
```
✓ Build Phase (15%) - Maven/npm builds with caching
✓ Test Phase - Tests passing
✓ Caching (15%) - Maven, npm, Docker layers
✓ Artifacts (15%) - JARs, dist folders visible
✓ Docker Build (20%) - Images built successfully
✓ Docker Push (15%) - Pushed to Docker Hub
✓ Deploy (20%) - Deployed to Render
```

### Docker Hub ✅
- Your images publicly visible
- Tagged with `latest` and commit SHA

### Render ✅
- Live URL: `https://your-service.onrender.com`
- Database connected
- Health check passing

**Total Score: 100%** 🎉

---

## Cost: €0.00

Everything is completely free:
- ✅ GitHub (public repo)
- ✅ GitHub Actions (2,000 minutes/month)
- ✅ Docker Hub (1 free private repo, unlimited public)
- ✅ Render (750 hours/month, free PostgreSQL)

**No credit card needed anywhere!**
