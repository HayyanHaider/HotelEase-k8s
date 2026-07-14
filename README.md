git clone https://github.com/HayyanHaider/HotelEase-k8s.git
cd HotelEase-k8s

# create the cluster
kind create cluster --name hotelease --config kind-config.yml

# build + load images
docker build -t hotelease-backend:v1 ./backend
docker build -t hotelease-frontend:v1 ./frontend
kind load docker-image hotelease-backend:v1 --name hotelease
kind load docker-image hotelease-frontend:v1 --name hotelease

# apply core manifests
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/secret.yml       # copy from secret.example.yml first
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/backend-deployment.yml
kubectl apply -f k8s/backend-service.yml
kubectl apply -f k8s/frontend-deployment.yml
kubectl apply -f k8s/frontend-service.yml

# ingress controller + routing
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl apply -f k8s/ingress.yml

# metrics + standard HPA
kubectl apply -f metrics-server-patch.yml
kubectl apply -f k8s/hpa.yml

# custom-metric HPA (after Prometheus + Adapter + Grafana are installed)
kubectl apply -f k8s/hpa-custom-metric.yml