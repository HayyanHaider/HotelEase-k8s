# HotelEase — Kubernetes DevOps Project

A MERN-stack hotel booking app, containerized with Docker and deployed to a local Kubernetes cluster (kind), covering storage, config management, ingress routing, autoscaling, and monitoring.

## Tech Stack
- Frontend: React (Vite) + Nginx
- Backend: Node.js + Express
- Database: MongoDB Atlas (real data) + in-cluster Mongo (storage practice)
- File Storage: Cloudinary
- Containerization: Docker
- Orchestration: Kubernetes (kind — Kubernetes in Docker)
- Ingress: NGINX Ingress Controller
- Autoscaling: metrics-server + HPA
- Monitoring: Prometheus + Grafana

## Architecture

```
                        Browser
                           │
                           ▼
                  ┌─────────────────┐
                  │  Ingress (nginx) │
                  │  /      /api     │
                  └────┬─────────┬──┘
                       │         │
              ┌────────▼──┐  ┌───▼──────────┐
              │ frontend-  │  │ backend      │
              │ service    │  │ service      │
              └────┬───────┘  └───┬──────────┘
                   │              │
              ┌────▼──────┐  ┌────▼────────┐
              │ frontend  │  │ backend     │
              │ pod (nginx)│  │ pod (Express)│
              └───────────┘  └────┬────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
                 Secret      ConfigMap    MongoDB Atlas
              (credentials)  (settings)      (cloud)

        Namespace: hotelease (everything above runs inside it)
```

Separately, a `mongo-practice` Deployment + Service + PVC/PV exist purely to demonstrate storage concepts (ephemeral vs static PV vs dynamic PV) — it is not used by the real app, which connects to MongoDB Atlas.

## Project Structure

```
HotelEase-devops/
├── backend/
│   └── Dockerfile
├── frontend/
│   └── Dockerfile
├── k8s/
│   ├── namespace.yml
│   ├── backend-deployment.yml
│   ├── backend-service.yml
│   ├── frontend-deployment.yml
│   ├── frontend-service.yml
│   ├── secret.yml            (gitignored — real credentials)
│   ├── secret.example.yml    (template, safe to commit)
│   ├── configmap.yml
│   ├── mongo-deployment.yml
│   ├── mongo-service.yml
│   ├── mongo-pv.yml
│   ├── mongo-pvc.yml
│   ├── mongo-pvc-dynamic.yml
│   └── ingress.yml
├── kind-config.yml
└── docker-compose.yml        (legacy — pre-Kubernetes setup)
```

## What's been built so far

### Phase 1 — Cluster setup + core deployments
- Created a local `kind` cluster with port mappings (80/443) for later Ingress use
- Created the `hotelease` namespace
- Built backend and frontend Docker images and loaded them into the cluster
- Deployed backend as a Kubernetes Deployment

### Phase 2 — Storage
- Practiced all three storage patterns on a throwaway Mongo pod:
  - **Ephemeral** (`emptyDir`) — data lost on pod restart
  - **Static PV/PVC** (hostPath) — manually created volume, survives pod restarts
  - **Dynamic PV** — PVC requests storage from a StorageClass, PV auto-provisioned on first use (`WaitForFirstConsumer`)
- Added an `emptyDir` volume to the backend for a temp cache folder

### Phase 3 — Secrets + ConfigMaps
- Created a Secret for sensitive values (`MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_API_SECRET`)
- Created a ConfigMap for non-sensitive config (`PORT`, `CLOUDINARY_CLOUD_NAME`, `FRONTEND_URL`)
- Injected both into the backend two ways: as environment variables, and as a mounted volume
- Confirmed backend connects to real MongoDB Atlas and Cloudinary using these injected values

### Phase 4 — Ingress + Ingress Controller
- Installed the NGINX Ingress Controller (kind-specific manifest)
- Created `frontend-deployment.yml` / `frontend-service.yml` (frontend wasn't running in-cluster until this phase)
- Created `backend-service.yml` so the backend Deployment was reachable by a stable name
- Wrote path-based Ingress rules: `/` → frontend, `/api` → backend

**Debugging note worth keeping:** the frontend's nginx config (baked in from the old Docker Compose setup) had a hardcoded reverse-proxy rule expecting an upstream host literally named `backend`. Kubernetes only resolves a Service by its exact name, so naming the backend Service `backend-service` caused an unresolvable-host crash (`CrashLoopBackOff`). Fixed by naming the Service `backend` instead of rebuilding the image. Also had to remove the Ingress `rewrite-target: /` annotation, since the backend's Express routes expect the full `/api/...` path rather than a rewritten one.

## What's next

### Phase 5 — Metrics + autoscaling
- Install metrics-server, use `kubectl top` for live pod/node resource usage
- Set resource `requests`/`limits` on deployments
- Configure a standard Horizontal Pod Autoscaler (HPA) based on CPU

### Phase 6 — Monitoring + custom-metric scaling
- Deploy Prometheus + Grafana
- Build a custom-metric HPA (e.g. scaling on queue length instead of CPU)
- Final polish: architecture diagram, this README, final push

## Environment Variables

`backend` Secret (`k8s/secret.yml`, gitignored) / ConfigMap (`k8s/configmap.yml`):
```
MONGO_URI=
JWT_SECRET=
CLOUDINARY_API_SECRET=
PORT=
CLOUDINARY_CLOUD_NAME=
FRONTEND_URL=
```
See `k8s/secret.example.yml` for the Secret template — encode real values with `echo -n "value" | base64` before use.

## Run locally

```bash
git clone https://github.com/<your-username>/hotelease-devops.git
cd hotelease-devops

# create the cluster
kind create cluster --name hotelease --config kind-config.yml

# build + load images
docker build -t hotelease-backend:v1 ./backend
docker build -t hotelease-frontend:v1 ./frontend
kind load docker-image hotelease-backend:v1 --name hotelease
kind load docker-image hotelease-frontend:v1 --name hotelease

# apply manifests
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/secret.yml       # copy from secret.example.yml first
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/backend-deployment.yml
kubectl apply -f k8s/backend-service.yml
kubectl apply -f k8s/frontend-deployment.yml
kubectl apply -f k8s/frontend-service.yml

# install ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl apply -f k8s/ingress.yml
```

App available at `http://localhost/`.

## Legacy: Docker Compose deployment

Before this Kubernetes-based setup, the project was deployed as plain Docker containers on an Azure VM via GitHub Actions CI/CD. That workflow (`docker-compose.yml`, `.github/workflows/deploy.yml`) is kept in the repo for reference but is no longer the primary deployment path.