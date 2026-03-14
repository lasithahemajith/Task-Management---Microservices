# Deploying DevTask to Kubernetes

## Prerequisites

- kubectl ≥ 1.27
- Minikube ≥ 1.32 **or** Kind ≥ 0.20
- Docker (to build images)
- Helm ≥ 3.12 (optional)

---

## Option A – Plain kubectl (manifests)

### 1. Start your local cluster

**Minikube:**
```bash
minikube start --driver=docker --memory=4096 --cpus=2
minikube addons enable ingress
```

**Kind:**
```bash
kind create cluster --name devtask
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

### 2. Build and load images

```bash
# Build all images
docker compose build

# Minikube – load images directly into the cluster VM
minikube image load devtask/auth-service:latest
minikube image load devtask/task-service:latest
minikube image load devtask/notification-service:latest
minikube image load devtask/api-gateway:latest
minikube image load devtask/frontend:latest

# Kind – load images directly
kind load docker-image devtask/auth-service:latest --name devtask
kind load docker-image devtask/task-service:latest --name devtask
kind load docker-image devtask/notification-service:latest --name devtask
kind load docker-image devtask/api-gateway:latest --name devtask
kind load docker-image devtask/frontend:latest --name devtask
```

> **Note:** Docker Compose builds images with the service name as the tag.
> Tag them manually if needed: `docker tag auth-service devtask/auth-service:latest`

### 3. Apply manifests

```bash
kubectl apply -f infra/kubernetes/namespace.yaml
kubectl apply -f infra/kubernetes/configmap.yaml
kubectl apply -f infra/kubernetes/secrets.yaml
kubectl apply -f infra/kubernetes/mysql.yaml
kubectl apply -f infra/kubernetes/redis.yaml
kubectl apply -f infra/kubernetes/kafka.yaml
kubectl apply -f infra/kubernetes/auth-service.yaml
kubectl apply -f infra/kubernetes/task-service.yaml
kubectl apply -f infra/kubernetes/notification-service.yaml
kubectl apply -f infra/kubernetes/api-gateway.yaml
kubectl apply -f infra/kubernetes/frontend.yaml
kubectl apply -f infra/kubernetes/ingress.yaml
```

Or apply everything at once:
```bash
kubectl apply -f infra/kubernetes/
```

### 4. Verify pods

```bash
kubectl get pods -n devtask -w
```

### 5. Access the application

**Minikube:**
```bash
minikube ip   # e.g. 192.168.49.2
# Add to /etc/hosts:  192.168.49.2  devtask.local
```

**Kind / Port-forward:**
```bash
kubectl port-forward svc/frontend    8080:80   -n devtask &
kubectl port-forward svc/api-gateway 3000:3000 -n devtask &
# Frontend: http://localhost:8080
```

---

## Option B – Helm

```bash
# Install (first time)
helm install devtask ./infra/helm/devtask \
  --namespace devtask \
  --create-namespace \
  --set jwt.secret=MY_STRONG_SECRET \
  --set mysql.password=MY_DB_PASS

# Upgrade (after changes)
helm upgrade devtask ./infra/helm/devtask \
  --namespace devtask \
  --set image.tag=v1.2.0

# Uninstall
helm uninstall devtask -n devtask
```

---

## Useful kubectl Commands

```bash
# Watch all pods
kubectl get pods -n devtask -w

# Describe a failing pod
kubectl describe pod <pod-name> -n devtask

# View logs
kubectl logs deployment/task-service -n devtask -f

# Get services
kubectl get svc -n devtask

# Delete everything in namespace
kubectl delete namespace devtask
```

---

## Production Considerations

- Replace `stringData` in `secrets.yaml` with Kubernetes Secrets sealed via [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) or store them in a vault.
- Set `imagePullPolicy: Always` and use versioned image tags instead of `latest`.
- Add Horizontal Pod Autoscalers (HPA) to the task and auth services.
- Use a managed MySQL service (RDS, CloudSQL) instead of an in-cluster Deployment.
- Enable TLS on the Ingress with cert-manager.
