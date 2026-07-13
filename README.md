Here's a clean, concise version — copy-paste ready:

```markdown
# HotelEase — DevOps Deployment

A MERN-stack hotel booking app, containerized with Docker and deployed to an Azure VM with CI/CD via GitHub Actions.

## Tech Stack
- Frontend: React (Vite) + Nginx
- Backend: Node.js + Express
- Database: MongoDB Atlas
- File Storage: Cloudinary
- Containerization: Docker, Docker Compose
- Hosting: Azure VM (Ubuntu)
- CI/CD: GitHub Actions
- Domain: No-IP DDNS

## Architecture

```
GitHub (push to main)
        │
        ▼
GitHub Actions → SSH into VM → git pull → docker compose up --build -d
        │
        ▼
Azure VM
 ┌─────────────────────────────┐
 │  Docker bridge network       │
 │  ┌──────────┐  ┌──────────┐ │
 │  │ frontend │─▶│ backend  │ │
 │  │ (Nginx)  │  │ (Express)│ │
 │  │ port 80  │  │ port 5000│ │
 │  └──────────┘  └────┬─────┘ │
 └────────────────────┼────────┘
                       ▼
              MongoDB Atlas (cloud)
```

## Project Structure
```
HotelEase-devops/
├── backend/
│   ├── Dockerfile
│   └── .env (gitignored)
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env (gitignored)
├── docker-compose.yml
└── .github/workflows/deploy.yml
```

## Docker Setup

**Backend Dockerfile** — `node:18-alpine`. Copies `package*.json` and runs `npm install` before copying source code, so dependency installation is cached and only reruns when `package.json` changes.

**Frontend Dockerfile** — multi-stage build. Stage 1 (`node:20-alpine`) builds the React app. Stage 2 (`nginx:alpine`) serves only the built static files — keeping the final image small.

**docker-compose.yml** — runs `backend` and `frontend` on a shared bridge network, so the frontend can reach the backend at `http://backend:5000` by container name. No database container — the app connects directly to MongoDB Atlas.

**nginx.conf** — serves the React build and reverse-proxies `/api/`, `/uploads/`, `/invoices/` to the backend container. Falls back to `index.html` for client-side routing.

## Environment Variables

`backend/.env`:
```
MONGO_URI=
PORT=5000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_SERVICE=
EMAIL_USER=
EMAIL_PASSWORD=
FRONTEND_ORIGINS=
FRONTEND_URL=
BACKEND_BASE_URL=
JWT_SECRET=
```

`frontend/.env`:
```
VITE_API_ORIGIN=
```
> Vite env variables are baked in at build time — set this before running `docker compose up --build`.

## Run Locally
```bash
git clone https://github.com/HayyanHaider/HotelEase-devops.git
cd HotelEase-devops
# add .env files as shown above
docker compose up --build
```
App runs at `http://localhost`.

## Deploy to VM
```bash
ssh -i <key.pem> <user>@<vm-host>
git clone <repo-url>
cd HotelEase-devops
# add .env files
docker compose up --build -d
```
Make sure ports `80` and `5000` are open in the VM's firewall/security group.

## CI/CD

`.github/workflows/deploy.yml` runs on every push to `main`:
1. Checks out the repo
2. SSHs into the VM
3. Runs `git pull` and `docker compose up --build -d`
4. Health-checks the live URL

GitHub Secrets required: `VM_SSH_KEY`, `VM_HOST`, `VM_USER`

## Next Steps
- [ ] SSL via Certbot
- [ ] Horizontal scaling / load balancer
- [ ] Migrate to AWS ECS/Fargate
```
